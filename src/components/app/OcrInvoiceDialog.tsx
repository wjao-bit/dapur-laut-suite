import { useRef, useState } from "react";
import { useAction, useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
import { Camera, FileText, Loader2, Plus, ScanText, Sparkles, Trash2, KeyRound } from "lucide-react";
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
import { nextSeqKode, parseNum, todayStr, roundNum } from "@/lib/format";
import { parseOcrText, type OcrItem } from "@/lib/ocr";

type OcrStatus = "idle" | "reading" | "done" | "error";

/** Baris draft — selain qty & harga, khusus Pasar bisa berisi stok akhir. */
type DraftItem = OcrItem & { stokAkhir?: number };

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

/** Canvas → data URL JPEG dengan skala & kualitas terkontrol (untuk AI, payload kecil). */
function canvasToJpeg(canvas: HTMLCanvasElement, maxW: number, quality: number): string {
  const scale = Math.min(1, maxW / canvas.width);
  const out = document.createElement("canvas");
  out.width = Math.round(canvas.width * scale);
  out.height = Math.round(canvas.height * scale);
  const ctx = out.getContext("2d");
  if (!ctx) return canvas.toDataURL("image/jpeg", quality);
  ctx.drawImage(canvas, 0, 0, out.width, out.height);
  return out.toDataURL("image/jpeg", quality);
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
  const scanAi = useAction(api.aiOcr.scanInvoiceWithAi);
  const checkAiKeys = useAction(api.aiKeys.checkAiKeys);

  const fileRef = useRef<HTMLInputElement>(null);

  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [canvasRef, setCanvasRef] = useState<HTMLCanvasElement | null>(null);
  const [status, setStatus] = useState<OcrStatus>("idle");
  const [progress, setProgress] = useState<{ status: string; pct: number } | null>(null);
  const [rawText, setRawText] = useState("");
  const [aiBusy, setAiBusy] = useState(false);

  const [tipe, setTipe] = useState<InvoiceTipe>("Reseller");
  const [namaPihak, setNamaPihak] = useState("");
  const [tanggal, setTanggal] = useState(todayStr());
  const [idInvoice, setIdInvoice] = useState(nextInvoiceId);
  const [items, setItems] = useState<DraftItem[]>([{ namaBarang: "", qty: 1, harga: 0 }]);
  const [saving, setSaving] = useState(false);
  /** Perintah tambahan bebas dari user untuk Scan AI (opsional). */
  const [instruksi, setInstruksi] = useState("");
  /** Hasil tes kunci AI (dari action checkAiKeys). */
  const [keyTest, setKeyTest] = useState<{ ok: boolean; messages: string[] } | null>(null);
  const [testingKeys, setTestingKeys] = useState(false);

  const reset = () => {
    setImageUrl(null);
    setCanvasRef(null);
    setStatus("idle");
    setProgress(null);
    setRawText("");
    setAiBusy(false);
    setTipe("Reseller");
    setNamaPihak("");
    setTanggal(todayStr());
    setIdInvoice(nextInvoiceId);
    setItems([{ namaBarang: "", qty: 1, harga: 0 }]);
    setInstruksi("");
    setKeyTest(null);
    setTestingKeys(false);
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

  /** Tes kunci AI (Gemini / Cloudflare / OpenAI) langsung dari backend. */
  const handleTestKeys = async () => {
    setTestingKeys(true);
    setKeyTest(null);
    try {
      const res = await checkAiKeys();
      setKeyTest(res);
      if (!res.ok) toast.warning("Belum ada kunci AI yang berfungsi — cek hasil tes di bawah.");
      else toast.success("Kunci AI siap dipakai — lihat detail di bawah.");
    } catch (e: any) {
      setKeyTest({
        ok: false,
        messages: [`❌ Gagal menjalankan tes: ${e?.message ?? "koneksi"}`],
      });
    } finally {
      setTestingKeys(false);
    }
  };

  /** Scan dengan AI (Gemini & Cloudflare GRATIS, OpenAI cadangan) — perintah diarahkan sesuai tipe & instruksi user. */
  const handleAiScan = async () => {
    if (!canvasRef) return;
    setAiBusy(true);
    try {
      // Kirim versi kecil (≤1024px, JPEG 0.7) supaya payload ringan.
      const smallUrl = canvasToJpeg(canvasRef, 1024, 0.7);
      const res = await scanAi({
        imageDataUrl: smallUrl,
        tipe,
        instruksi: instruksi.trim() || undefined,
      });
      if (!res.ok || !res.data) {
        toast.error(res?.error ?? "Scan AI gagal — coba lagi atau pakai OCR biasa.");
        return;
      }
      const d = res.data;
      // Tipe tetap milik user (dipilih sebelum scan) — AI tidak menimpa.
      if (d.namaPihak) setNamaPihak(d.namaPihak);
      if (d.tanggal) setTanggal(d.tanggal);
      if (d.items.length > 0) {
        setItems(
          d.items.map((it) => ({
            namaBarang: it.namaBarang,
            qty: parseNum(it.qty) > 0 ? parseNum(it.qty) : 1,
            harga: Math.max(0, parseNum(it.harga)),
            ...(it.stokAkhir ? { stokAkhir: parseNum(it.stokAkhir) } : {}),
          })),
        );
        setStatus("done");
        toast.success(`AI membaca ${d.items.length} baris barang — periksa & koreksi sebelum simpan.`);
      } else {
        toast.warning("AI tidak menemukan baris barang — periksa foto atau gunakan OCR biasa.");
        setStatus("error");
      }
    } catch (e: any) {
      console.error("[OCR-AI] Gagal:", e);
      setStatus("error");
      toast.error(e?.message ?? "Scan AI gagal — coba lagi atau gunakan OCR biasa (Tesseract).");
    } finally {
      setAiBusy(false);
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

  const updateItem = (idx: number, patch: Partial<DraftItem>) => {
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
        const qty = parseNum(it.qty);
        const kode = match ? match.kode : `${nextKode.slice(0, -3)}${String(parseInt(nextKode.slice(-3), 10) + autoIdx++).padStart(3, "0")}`;
        if (tipe === "Pasar") {
          const stokAkhir = Math.max(0, parseNum(it.stokAkhir));
          return {
            kodeBarang: kode,
            namaBarang: it.namaBarang.trim(),
            hargaModal: 0,
            hargaJual: harga,
            // Pasar: qty = stok awal; subtotal = (awal − akhir) × harga jual
            qty,
            subtotal: roundNum((qty - stokAkhir) * harga),
            stokAwal: qty,
            stokAkhir,
          };
        }
        return {
          kodeBarang: kode,
          namaBarang: it.namaBarang.trim(),
          hargaModal: tipe === "Supplier" ? harga : 0,
          qty,
          hargaJual: tipe === "Supplier" ? 0 : harga,
          subtotal: roundNum(qty * harga),
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
      toast.success(`Invoice ${res.idInvoice} tersimpan dari hasil scan — periksa stok & kas.`);
      onSaved?.(res);
      onOpenChange(false);
      reset();
    } catch (e: any) {
      toast.error(e?.data?.message ?? e?.message ?? "Gagal menyimpan invoice");
    } finally {
      setSaving(false);
    }
  };

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
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle>Scan Invoice dari Foto</DialogTitle>
          <DialogDescription>
            Foto/upload kertas invoice → sistem membaca otomatis → <b>kamu periksa & koreksi</b> draft
            sebelum disimpan ke database. <b>Pilih tipe invoice dulu</b> supaya pembacaan diarahkan
            (harga beli/jual, stok awal-akhir untuk Pasar).
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

          {/* Tes kunci AI — selalu terlihat, supaya bisa cek dulu sebelum scan */}
          <div className="rounded-lg border bg-muted/20 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-[11px] text-muted-foreground">
                <KeyRound className="mr-1 inline size-3.5" />
                Cek dulu apakah kunci AI (Gemini / Cloudflare / OpenAI) sudah terpasang & valid.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleTestKeys}
                disabled={testingKeys}
                className="cursor-pointer"
              >
                {testingKeys ? (
                  <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                ) : (
                  <KeyRound className="mr-1.5 size-3.5" />
                )}
                {testingKeys ? "Mengecek…" : "Tes Kunci AI"}
              </Button>
            </div>
            {keyTest && (
              <div className="mt-2 space-y-1 rounded-md border bg-background/60 px-3 py-2">
                {keyTest.messages.map((m, i) => (
                  <p key={i} className="text-[11px] leading-4 text-foreground">
                    {m}
                  </p>
                ))}
              </div>
            )}
          </div>

          {/* Langkah 2 — pilih tipe, instruksi khusus, lalu baca (AI atau OCR biasa) */}
          {imageUrl && status !== "done" && (
            <div className="rounded-lg border bg-muted/20 p-3">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <Label className="text-xs font-medium">Tipe:</Label>
                  <Select value={tipe} onValueChange={(v) => setTipe(v as InvoiceTipe)}>
                    <SelectTrigger className="h-9 w-32 cursor-pointer text-xs">
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
                <Button onClick={handleAiScan} disabled={aiBusy} className="cursor-pointer">
                  {aiBusy ? (
                    <Loader2 className="mr-2 size-4 animate-spin" />
                  ) : (
                    <Sparkles className="mr-2 size-4" />
                  )}
                  {aiBusy ? "AI membaca…" : "2. Scan AI (Pintar)"}
                </Button>
                <Button variant="outline" onClick={handleOcr} disabled={status === "reading"} className="cursor-pointer">
                  {status === "reading" ? (
                    <Loader2 className="mr-2 size-4 animate-spin" />
                  ) : (
                    <ScanText className="mr-2 size-4" />
                  )}
                  {status === "reading" ? "Membaca teks…" : "OCR Biasa (Tanpa kunci)"}
                </Button>
              </div>
              <div className="mt-2.5">
                <Label className="text-[11px] font-medium text-muted-foreground">
                  Instruksi khusus untuk Scan AI <span className="text-muted-foreground/70">(opsional)</span>
                </Label>
                <Input
                  className="mt-1 h-9 text-sm"
                  value={instruksi}
                  onChange={(e) => setInstruksi(e.target.value)}
                  placeholder="Mis. hanya 5 baris pertama · abaikan barang tanpa harga · tulis satuan di nama barang"
                />
              </div>
              <p className="mt-2 text-[11px] text-muted-foreground">
                Scan AI memakai <b>Google Gemini — punya kuota GRATIS harian</b> (daftar di
                aistudio.google.com, simpan kunci sebagai <code className="rounded bg-muted px-1">GEMINI_API_KEY</code>).
                Cadangan gratis kedua: <b>Cloudflare Workers AI</b> (
                <code className="rounded bg-muted px-1">CF_API_TOKEN</code> +{" "}
                <code className="rounded bg-muted px-1">CF_ACCOUNT_ID</code> dari dash.cloudflare.com —
                tanpa kartu kredit). OpenAI hanya cadangan terakhir. OCR Biasa berjalan tanpa kunci
                apa pun — hasilnya sama-sama draft yang kamu periksa dulu.
              </p>
              {status === "error" && (
                <p className="mt-1 text-xs text-rose-600">
                  Gagal membaca. Coba foto yang lebih terang, tombol Scan AI, atau isi manual di bawah.
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
                      {pihakOptions.map((p: string, i: number) => (
                        <option key={`${p}-${i}`} value={p} />
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

              {/* Daftar barang hasil scan — bisa diedit/hapus */}
              <div className="rounded-lg border">
                <div className="border-b bg-muted/20 px-3 py-2 text-[11px] font-semibold text-muted-foreground uppercase">
                  Barang (No. Invoice: {idInvoice})
                  {tipe === "Pasar" && <span className="ml-2 normal-case">· qty = stok awal, isi stok akhir yang kembali</span>}
                </div>
                <div className="overflow-x-auto touch-pan-x overscroll-x-contain [-webkit-overflow-scrolling:touch]">
                  <table className="w-full min-w-[500px] text-sm">
                    <thead>
                      <tr className="border-b text-left text-[11px] tracking-wide text-muted-foreground uppercase">
                        <th className="min-w-44 px-2 py-2 font-semibold">Nama Barang</th>
                        <th className="min-w-20 px-2 py-2 text-right font-semibold">{tipe === "Pasar" ? "Stok Awal" : "Qty"}</th>
                        {tipe === "Pasar" && (
                          <th className="min-w-20 px-2 py-2 text-right font-semibold">Stok Akhir</th>
                        )}
                        <th className="min-w-28 px-2 py-2 text-right font-semibold">Harga</th>
                        <th className="min-w-28 px-2 py-2 text-right font-semibold">Subtotal</th>
                        <th className="w-10 px-1 py-2" />
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((it, idx) => {
                        const terjual = tipe === "Pasar" ? parseNum(it.qty) - parseNum(it.stokAkhir) : parseNum(it.qty);
                        return (
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
                            {tipe === "Pasar" && (
                              <td className="px-2 py-2">
                                <NumInput
                                  className="h-8 w-full text-base text-right sm:text-sm"
                                  value={it.stokAkhir}
                                  onValue={(n) => updateItem(idx, { stokAkhir: n })}
                                />
                              </td>
                            )}
                            <td className="px-2 py-2">
                              <NumInput
                                className="h-8 w-full text-base text-right sm:text-sm"
                                value={it.harga}
                                onValue={(n) => updateItem(idx, { harga: n })}
                              />
                            </td>
                            <td className="px-2 py-2 text-right font-semibold tabular-nums">
                              {formatCurrency(roundNum(terjual * parseNum(it.harga)), "Rp")}
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
                        );
                      })}
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
                    <span className="font-bold tabular-nums">
                      {formatCurrency(
                        items.reduce(
                          (s, it) =>
                            s +
                            roundNum(
                              (tipe === "Pasar"
                                ? parseNum(it.qty) - parseNum(it.stokAkhir)
                                : parseNum(it.qty)) * parseNum(it.harga),
                            ),
                          0,
                        ),
                        "Rp",
                      )}
                    </span>
                  </div>
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Barang yang cocok dengan database otomatis memakai kodenya; yang baru dibuatkan kode
                otomatis (BRG…). Stok & kas menyesuaikan sesuai tipe invoice. Tombol{" "}
                <b>Scan AI (Pintar)</b> memakai Google Gemini atau Cloudflare Workers AI (keduanya
                punya kuota gratis harian) — OpenAI hanya cadangan. Hasilnya selalu diperiksa manual
                dulu sebelum disimpan.
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
