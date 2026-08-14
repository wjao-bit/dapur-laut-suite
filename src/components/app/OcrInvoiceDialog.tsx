import { useRef, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
import { Camera, FileText, Loader2, Plus, ScanText, Sparkles, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { NumInput } from "@/components/app/NumInput";
import { formatCurrency, INVOICE_TIPES, type InvoiceTipe } from "@/lib/business";
import { nextSeqKode, parseNum, todayStr } from "@/lib/format";

interface OcrItem {
  namaBarang: string;
  qty: number;
  harga: number;
}

type OcrStatus = "idle" | "reading" | "done" | "error";

// ============================================================================
// Heuristik pengurai teks hasil OCR menjadi baris item invoice.
// Baris berisi nama barang + angka (qty & harga). Header/total dokumen
// disaring agar tidak masuk sebagai barang. Hasilnya HANYA draft — user
// wajib memverifikasi sebelum disimpan.
// ============================================================================
export function parseOcrText(text: string): OcrItem[] {
  const HEADER_RE =
    /^(invoice|faktur|nota|bon|kwitansi|tanggal|tgl|no\.?|nomor|kepada|yth|hal|terbilang|total|jumlah|bayar|dibayar|kembali|uang|muka|dp|ppn|pph|disc|diskon|kasir|alamat|telp|fax|npwp|halaman|page|qty|harga|subtotal|satuan|keterangan|pcs|kg|gram|liter|lembar|dus|sak|pak|botol|cup|plastik|karton|jual|beli|barang|item|produk|metode|pembayaran|tunai|transfer|piutang|sisa|grand|potongan|ongkir|biaya|dapur|laut|pt|cv|ud|toko|kios|warung)/i;
  const lines = String(text ?? "")
    .split(/\n/)
    .map((l) => l.replace(/\s+/g, " ").trim())
    .filter(Boolean);
  const out: OcrItem[] = [];
  for (const line of lines) {
    const lower = line.toLowerCase();
    if (HEADER_RE.test(lower)) continue;
    if (/\b(terbilang|subtotal|diskon|dibayar|kembalian|total|jumlah)\b/i.test(lower)) continue;

    // Ekstrak semua angka (dukung "25.000", "1.500,75", "0,7", "25000")
    const numRe = /\d{1,3}(?:[.,]\d{3})+(?:[.,]\d+)?|\d+(?:[.,]\d+)?/g;
    const rawNums: string[] = line.match(numRe) ?? [];
    const parsed = rawNums.map((n) => parseNum(n)).filter((n) => n > 0);
    if (parsed.length === 0) continue;

    // Sisa teks setelah angka dihapus = nama barang
    let nama = line.replace(numRe, " ").replace(/\s+/g, " ").trim();
    // Buang pemisah qty ("2 x Kopi" → "Kopi")
    nama = nama.replace(/[x×]/gi, " ").replace(/\s+/g, " ").trim();
    nama = nama.replace(/^\d+\s+/, "").trim();
    nama = nama.replace(/^(barang|item|nama|produk)\s+/i, "").trim();
    // Baris yang hanya berisi kata tak bermakna
    if (!nama || nama.length < 2) continue;
    if (/^(dll|dan lain|rp|harga|total|jumlah|bayar)/i.test(nama)) continue;

    let qty = 1;
    let harga = parsed[parsed.length - 1];
    if (parsed.length >= 2) {
      qty = parsed[0];
      harga = parsed[1];
    }
    out.push({ namaBarang: nama, qty: qty > 0 ? qty : 1, harga: harga > 0 ? harga : 0 });
  }
  // Gabungkan nama yang sama (jumlah qty, harga pakai yang terakhir)
  const map = new Map<string, OcrItem>();
  for (const it of out) {
    const key = it.namaBarang.toLowerCase();
    const prev = map.get(key);
    if (prev) {
      prev.qty += it.qty;
      prev.harga = it.harga;
    } else {
      map.set(key, { ...it });
    }
  }
  return [...map.values()];
}

/** Muat file gambar → canvas (grayscale + kontras) siap OCR. */
function fileToCanvas(file: File): Promise<HTMLCanvasElement> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        try {
          const maxW = 1600;
          const scale = Math.min(1, maxW / img.width);
          const canvas = document.createElement("canvas");
          canvas.width = Math.round(img.width * scale);
          canvas.height = Math.round(img.height * scale);
          const ctx = canvas.getContext("2d");
          if (!ctx) return reject(new Error("Canvas tidak didukung"));
          ctx.fillStyle = "#fff";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          // Grayscale + kontras untuk membantu mesin OCR
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const d = imageData.data;
          const contrast = 1.4;
          for (let i = 0; i < d.length; i += 4) {
            const gray = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
            const v = Math.min(255, Math.max(0, (gray - 128) * contrast + 128));
            d[i] = d[i + 1] = d[i + 2] = v;
          }
          ctx.putImageData(imageData, 0, 0);
          resolve(canvas);
        } catch (e) {
          reject(e);
        }
      };
      img.onerror = () => reject(new Error("Gagal membaca gambar"));
      img.src = String(reader.result);
    };
    reader.onerror = () => reject(new Error("Gagal membaca file"));
    reader.readAsDataURL(file);
  });
}

export function OcrInvoiceDialog({
  open,
  onOpenChange,
  onSaved,
  nextInvoiceId,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onSaved?: (inv: any) => void;
  nextInvoiceId: string;
}) {
  const barang = useQuery(api.queries.listBarang);
  const suppliers = useQuery(api.queries.listSupplier);
  const resellers = useQuery(api.queries.listReseller);
  const dpls = useQuery(api.queries.listDpl);
  const pasars = useQuery(api.queries.listPasar);
  const createInvoice = useMutation(api.business.createInvoice);
  const upsertKatalog = useMutation(api.katalog.upsertKatalog);

  const fileRef = useRef<HTMLInputElement>(null);

  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [canvasRef, setCanvasRef] = useState<HTMLCanvasElement | null>(null);
  const [status, setStatus] = useState<OcrStatus>("idle");
  const [progress, setProgress] = useState<{ status: string; pct: number } | null>(null);
  const [rawText, setRawText] = useState("");

  const [tipe, setTipe] = useState<InvoiceTipe>("Reseller");
  const [namaPihak, setNamaPihak] = useState("");
  const [tanggal, setTanggal] = useState(todayStr());
  const [idInvoice, setIdInvoice] = useState(nextInvoiceId);
  const [items, setItems] = useState<OcrItem[]>([{ namaBarang: "", qty: 1, harga: 0 }]);
  const [saving, setSaving] = useState(false);

  const reset = () => {
    setImageUrl(null);
    setCanvasRef(null);
    setStatus("idle");
    setProgress(null);
    setRawText("");
    setTipe("Reseller");
    setNamaPihak("");
    setTanggal(todayStr());
    setIdInvoice(nextInvoiceId);
    setItems([{ namaBarang: "", qty: 1, harga: 0 }]);
  };

  const pihakOptions =
    tipe === "Supplier"
      ? (suppliers?.map((s: any) => s.nama) ?? [])
      : tipe === "Reseller"
        ? (resellers?.map((s: any) => s.nama) ?? [])
        : tipe === "DPL"
          ? (dpls?.map((s: any) => s.namaPasar) ?? [])
          : (pasars?.map((s: any) => s.namaPasar) ?? []);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    try {
      const canvas = await fileToCanvas(file);
      setCanvasRef(canvas);
      setImageUrl(canvas.toDataURL("image/jpeg", 0.85));
      setStatus("idle");
      setRawText("");
    } catch (e: any) {
      toast.error(e?.message ?? "Gagal memproses gambar");
    }
  };

  const handleOcr = async () => {
    if (!canvasRef) return;
    setStatus("reading");
    setProgress({ status: "memulai…", pct: 0 });
    try {
      // Muat tesseract.js secara dinamis agar bundle utama tetap ringan.
      const mod: any = await import("tesseract.js");
      const Tesseract = mod.default ?? mod;
      const result = await Tesseract.recognize(canvasRef, "ind+eng", {
        logger: (m: any) => {
          if (m?.status && typeof m?.progress === "number") {
            setProgress({
              status: m.status,
              pct: Math.round(m.progress * 100),
            });
          }
        },
      });
      const text = String(result?.data?.text ?? "");
      setRawText(text);
      const parsed = parseOcrText(text);
      if (parsed.length === 0) {
        toast.warning("Tidak ada baris barang terbaca — periksa hasil teks mentah lalu isi manual.");
        setItems([{ namaBarang: "", qty: 1, harga: 0 }]);
      } else {
        setItems(parsed);
        toast.success(`${parsed.length} baris barang terbaca — periksa & koreksi sebelum simpan.`);
      }
      setStatus("done");
    } catch (e: any) {
      console.error("[OCR] Gagal:", e);
      setStatus("error");
      toast.error(e?.message ?? "OCR gagal — cek koneksi internet (model dibaca dari CDN) atau coba gambar lain.");
    } finally {
      setProgress(null);
    }
  };

  const updateItem = (idx: number, patch: Partial<OcrItem>) => {
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  };

  const handleSave = async () => {
    if (!namaPihak.trim()) {
      toast.error("Isi nama pihak terlebih dahulu");
      return;
    }
    // Kode barang: cocokkan nama dengan database; yang tidak cocok diberi kode otomatis.
    const nextKode = nextSeqKode((barang ?? []).map((b: any) => b.kode), "BRG");
    let autoIdx = 0;
    const cleanItems = items
      .filter((it) => it.namaBarang.trim() && parseNum(it.qty) > 0 && parseNum(it.harga) > 0)
      .map((it) => {
        const match = (barang ?? []).find(
          (b: any) => b.nama.toLowerCase().trim() === it.namaBarang.toLowerCase().trim(),
        );
        const harga = parseNum(it.harga);
        const kode = match ? match.kode : `${nextKode.slice(0, -3)}${String(parseInt(nextKode.slice(-3), 10) + autoIdx++).padStart(3, "0")}`;
        return {
          kodeBarang: kode,
          namaBarang: it.namaBarang.trim(),
          hargaModal: tipe === "Supplier" ? harga : 0,
          qty: parseNum(it.qty),
          hargaJual: tipe === "Supplier" ? 0 : harga,
          subtotal: parseNum(it.qty) * harga,
        };
      });
    if (cleanItems.length === 0) {
      toast.error("Tidak ada baris valid — isi minimal 1 barang (nama, qty, harga)");
      return;
    }
    setSaving(true);
    try {
      const res = await createInvoice({
        doc: {
          idInvoice,
          tanggal,
          tipe,
          namaPihak: namaPihak.trim(),
          tenggat: "",
          mataUang: "Rp",
          statusPembayaran: "Pending",
          items: cleanItems,
        },
      });
      // Sinkronkan katalog harga pihak (Reseller/Supplier) agar selalu terhubung.
      if (tipe === "Reseller" || tipe === "Supplier") {
        try {
          await upsertKatalog({
            tipe,
            namaPihak: namaPihak.trim(),
            items: cleanItems.map((it) => ({
              kodeBarang: it.kodeBarang,
              namaBarang: it.namaBarang,
              harga: it.hargaJual || it.hargaModal,
            })),
          });
        } catch {
          /* katalog bersifat pelengkap — gagal sinkron tidak menggagalkan invoice */
        }
      }
      toast.success(`Invoice ${res.idInvoice} tersimpan dari hasil OCR — periksa stok & kas.`);
      onSaved?.(res);
      onOpenChange(false);
      reset();
    } catch (e: any) {
      toast.error(e?.data?.message ?? e?.message ?? "Gagal menyimpan invoice");
    } finally {
      setSaving(false);
    }
  };

  const total = items.reduce((s, it) => s + parseNum(it.qty) * parseNum(it.harga), 0);

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) {
          reset();
          onOpenChange(false);
        }
      }}
    >
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Scan Invoice dari Foto (OCR)</DialogTitle>
          <DialogDescription>
            Foto/upload kertas invoice → sistem membaca otomatis → <b>kamu periksa & koreksi</b> draft
            sebelum disimpan ke database.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Langkah 1 — pilih foto */}
          <div className="rounded-lg border bg-muted/20 p-4">
            <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
              <div className="flex items-center gap-3">
                <Camera className="size-6 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">1. Foto / unggah kertas invoice</p>
                  <p className="text-[11px] text-muted-foreground">
                    Pastikan terang & lurus agar angka terbaca baik.
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                className="cursor-pointer"
                onClick={() => fileRef.current?.click()}
              >
                <Camera className="mr-1.5 size-4" />
                {imageUrl ? "Ganti Foto" : "Pilih Foto"}
              </Button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => {
                  handleFile(e.target.files?.[0]);
                  e.target.value = "";
                }}
              />
            </div>
            {imageUrl && (
              <img
                src={imageUrl}
                alt="Pratinjau invoice"
                className="mt-3 max-h-56 w-full rounded-md border object-contain"
              />
            )}
          </div>

          {/* Langkah 2 — baca teks */}
          {imageUrl && status !== "done" && (
            <div className="flex flex-wrap items-center gap-3">
              <Button onClick={handleOcr} disabled={status === "reading"}>
                {status === "reading" ? (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                ) : (
                  <ScanText className="mr-2 size-4" />
                )}
                {status === "reading" ? "Membaca teks…" : "2. Baca Teks (OCR)"}
              </Button>
              {status === "error" && (
                <p className="text-xs text-rose-600">
                  Gagal membaca. Coba foto yang lebih terang, atau isi manual di bawah.
                </p>
              )}
            </div>
          )}

          {status === "reading" && progress && (
            <div className="rounded-md border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
              OCR {progress.status} — {progress.pct}%
              <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-sky-500 transition-all"
                  style={{ width: `${progress.pct}%` }}
                />
              </div>
            </div>
          )}

          {/* Langkah 3 — verifikasi draft */}
          {(status === "done" || status === "error" || (!imageUrl && status === "idle")) && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles className="size-4 text-amber-500" />
                <p className="text-sm font-semibold">3. Periksa & koreksi draft sebelum simpan</p>
              </div>

              {rawText && (
                <details className="rounded-md border bg-muted/20 px-3 py-2">
                  <summary className="cursor-pointer text-xs font-medium text-muted-foreground">
                    Lihat teks mentah hasil OCR ({rawText.length} karakter)
                  </summary>
                  <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap font-mono text-[10px] leading-4 text-muted-foreground">
                    {rawText}
                  </pre>
                </details>
              )}

              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <Label className="text-xs font-medium">Tipe Invoice *</Label>
                  <Select value={tipe} onValueChange={(v) => setTipe(v as InvoiceTipe)}>
                    <SelectTrigger className="mt-1.5 cursor-pointer">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {INVOICE_TIPES.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs font-medium">Nama {tipe === "Supplier" ? "Supplier" : "Pihak"} *</Label>
                  <div className="mt-1.5">
                    <Input
                      list="ocr-pihak"
                      value={namaPihak}
                      onChange={(e) => setNamaPihak(e.target.value)}
                      placeholder="Nama pihak"
                    />
                    <datalist id="ocr-pihak">
                      {pihakOptions.map((p: string) => (
                        <option key={p} value={p} />
                      ))}
                    </datalist>
                  </div>
                </div>
                <div>
                  <Label className="text-xs font-medium">Tanggal *</Label>
                  <Input
                    className="mt-1.5"
                    type="date"
                    value={tanggal}
                    onChange={(e) => setTanggal(e.target.value)}
                  />
                </div>
              </div>

              {/* Daftar barang hasil OCR — bisa diedit/hapus */}
              <div className="rounded-lg border">
                <div className="border-b bg-muted/20 px-3 py-2 text-[11px] font-semibold text-muted-foreground uppercase">
                  Barang (No. Invoice: {idInvoice})
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[480px] text-sm">
                    <thead>
                      <tr className="border-b text-left text-[11px] tracking-wide text-muted-foreground uppercase">
                        <th className="min-w-44 px-2 py-2 font-semibold">Nama Barang</th>
                        <th className="min-w-20 px-2 py-2 text-right font-semibold">Qty</th>
                        <th className="min-w-28 px-2 py-2 text-right font-semibold">Harga</th>
                        <th className="min-w-28 px-2 py-2 text-right font-semibold">Subtotal</th>
                        <th className="w-10 px-1 py-2" />
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((it, idx) => (
                        <tr key={idx} className="border-b last:border-0">
                          <td className="px-2 py-2">
                            <Input
                              className="h-8 w-full text-base sm:text-sm"
                              value={it.namaBarang}
                              placeholder="Nama barang"
                              onChange={(e) => updateItem(idx, { namaBarang: e.target.value })}
                            />
                          </td>
                          <td className="px-2 py-2">
                            <NumInput
                              className="h-8 w-full text-base text-right sm:text-sm"
                              value={it.qty}
                              onValue={(n) => updateItem(idx, { qty: n })}
                            />
                          </td>
                          <td className="px-2 py-2">
                            <NumInput
                              className="h-8 w-full text-base text-right sm:text-sm"
                              value={it.harga}
                              onValue={(n) => updateItem(idx, { harga: n })}
                            />
                          </td>
                          <td className="px-2 py-2 text-right font-semibold tabular-nums">
                            {formatCurrency(parseNum(it.qty) * parseNum(it.harga), "Rp")}
                          </td>
                          <td className="px-1 py-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-7 cursor-pointer text-rose-500"
                              onClick={() => setItems((prev) => (prev.length === 1 ? prev : prev.filter((_, i) => i !== idx)))}
                            >
                              <Trash2 className="size-3.5" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2 border-t bg-muted/20 px-3 py-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setItems((prev) => [...prev, { namaBarang: "", qty: 1, harga: 0 }])}
                  >
                    <Plus className="mr-1.5 size-3.5" />
                    Tambah Baris
                  </Button>
                  <div className="text-right text-sm">
                    Total:{" "}
                    <span className="font-bold tabular-nums">{formatCurrency(total, "Rp")}</span>
                  </div>
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Barang yang cocok dengan database otomatis memakai kodenya; yang baru dibuatkan kode
                otomatis (BRG…). Stok & kas menyesuaikan sesuai tipe invoice.
              </p>
            </div>
          )}
        </div>

        {(status === "done" || status === "error") && (
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Batal
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" /> Menyimpan…
                </>
              ) : (
                <>
                  <FileText className="mr-2 size-4" /> Simpan Invoice ke Sistem
                </>
              )}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
