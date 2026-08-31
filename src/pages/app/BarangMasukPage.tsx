import { useMemo, useRef, useState, useCallback, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useSupabaseQuery } from "@/hooks/use-supabase-query";
import { toast } from "sonner";
import {
  PackagePlus,
  Plus,
  Trash2,
  Scissors,
  Truck,
  CheckCircle2,
  FileText,
  Loader2,
  Mic,
  MicOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
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

interface BatchItem {
  namaBarang: string;
  qty: number;
  hargaModal: number;
}

const emptyItem = (): BatchItem => ({ namaBarang: "", qty: 0, hargaModal: 0 });

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function formatRp(n: number) {
  return `Rp ${new Intl.NumberFormat("id-ID").format(Math.round(n || 0))}`;
}

// ===== Parsing catatan suara (speech-to-text) =====
const WORD_NUM: Record<string, number> = {
  nol: 0, satu: 1, dua: 2, tiga: 3, empat: 4, lima: 5, enam: 6,
  tujuh: 7, delapan: 8, sembilan: 9, sepuluh: 10, sebelas: 11, setengah: 0.5,
};

function readNumberAt(tokens: string[], i: number): { value: number; len: number } | null {
  const t = tokens[i];
  if (!t) return null;
  if (/^\d+([.,]\d+)?$/.test(t)) return { value: parseFloat(t.replace(",", ".")), len: 1 };
  const w = WORD_NUM[t];
  if (w === undefined) return null;
  if (w >= 1 && w <= 10 && tokens[i + 1] === "belas") return { value: 10 + w, len: 2 };
  if (w >= 1 && w <= 10 && tokens[i + 1] === "puluh") {
    const u = tokens[i + 2] !== undefined ? WORD_NUM[tokens[i + 2]] : undefined;
    if (u !== undefined && u < 10) return { value: w * 10 + u, len: 3 };
    return { value: w * 10, len: 2 };
  }
  return { value: w, len: 1 };
}

const QTY_UNITS = new Set(["kilo", "kg", "kilogram", "gram", "gr", "ons", "liter", "ltr", "buah", "pcs", "pack", "dus", "karung", "sak", "ikat", "kotak", "box"]);
function titleCase(s: string) { return s.replace(/\b\w/g, (ch) => ch.toUpperCase()); }
const normName = (s?: string) => (s ?? "").toLowerCase().replace(/\s+/g, " ").trim();

function findBestMatch(name: string, list: { nama?: string; namaPasar?: string; harga?: number }[] | undefined) {
  if (!list || !list.length) return null;
  const n = normName(name);
  if (!n) return null;
  let hit = list.find((x) => normName(x.nama ?? x.namaPasar) === n);
  if (hit) return hit;
  if (n.length >= 3) {
    hit = list.find((x) => { const xn = normName(x.nama ?? x.namaPasar); return !!xn && (xn.includes(n) || n.includes(xn)); });
  }
  return hit ?? null;
}

export function parseVoiceNote(text: string): { supplier: string; items: BatchItem[] } {
  let t = ` ${text.toLowerCase()} `.replace(/[!?]/g, " ").replace(/,(?!\d)/g, " ").replace(/\.(?!\d)/g, " ");
  let supplier = "";
  const di = t.lastIndexOf(" dari ");
  if (di >= 0) { supplier = t.slice(di + 6).trim(); t = t.slice(0, di); }
  const tokens = t.split(/\s+/).filter(Boolean);
  const items: BatchItem[] = [];
  let curName: string[] = [];
  let i = 0;
  while (i < tokens.length) {
    const num = readNumberAt(tokens, i);
    if (num) {
      i += num.len;
      if (i < tokens.length && QTY_UNITS.has(tokens[i])) i++;
      const name = curName.join(" ").trim();
      if (name && num.value > 0) items.push({ namaBarang: titleCase(name), qty: num.value, hargaModal: 0 });
      curName = [];
    } else { curName.push(tokens[i]); i++; }
  }
  return { supplier: titleCase(supplier), items };
}

export default function BarangMasukPage() {
  // Supabase queries
  const batchRows = useSupabaseQuery("batch_masuk", { orderBy: { column: "created_at", ascending: false } });
  const alokasiRows = useSupabaseQuery("batch_alokasi");
  const suppliers = useSupabaseQuery("supplier");
  const barangs = useSupabaseQuery("barang");
  const resellers = useSupabaseQuery("reseller");
  const dpls = useSupabaseQuery("dpl");
  const pasars = useSupabaseQuery("pasar");

  // Build batch objects with computed fields
  const batches = useMemo(() => {
    if (!batchRows) return undefined;
    return batchRows.map((b: any) => {
      const batchAlokasi = (alokasiRows ?? []).filter((a: any) => a.id_batch === b.id_batch);
      const items: any[] = Array.isArray(b.items) ? b.items : [];
      let totalQty = 0;
      let sisaTotal = 0;
      const sisaPerBarang = items.map((it: any) => {
        const nama = it.namaBarang ?? it.nama ?? "";
        const qty = Number(it.qty) || 0;
        const hargaModal = Number(it.hargaModal ?? it.harga_modal) || 0;
        const teralokasi = batchAlokasi.reduce((sum: number, a: any) => {
          const aItems: any[] = Array.isArray(a.items) ? a.items : [];
          return sum + aItems.filter((ai: any) => (ai.namaBarang ?? ai.nama) === nama).reduce((s2: number, ai: any) => s2 + (Number(ai.qty) || 0), 0);
        }, 0);
        totalQty += qty;
        const sisa = qty - teralokasi;
        sisaTotal += sisa;
        return { namaBarang: nama, qty, hargaModal, teralokasi, sisa };
      });
      return {
        _id: b.id,
        id: b.id_batch,
        tanggal: b.tanggal,
        namaSupplier: b.nama_supplier,
        petugas: b.petugas ?? "",
        catatan: b.catatan ?? "",
        totalModal: Number(b.total_modal) || 0,
        totalQty,
        sisaTotal,
        sisaPerBarang,
        alokasi: batchAlokasi.map((a: any) => ({
          _id: a.id,
          id: a.id,
          namaBarang: Array.isArray(a.items) && a.items[0] ? (a.items[0].namaBarang ?? a.items[0].nama) : "",
          tujuan: a.tipe_pihak,
          namaTujuan: a.nama_pihak,
          qty: Array.isArray(a.items) ? a.items.reduce((s: number, ai: any) => s + (Number(ai.qty) || 0), 0) : 0,
          hargaJual: Array.isArray(a.items) && a.items[0] ? (Number(a.items[0].hargaJual ?? a.items[0].harga_jual) || 0) : 0,
          status: a.status ?? "Pending",
          idInvoice: a.id_invoice ?? "",
        })),
      };
    });
  }, [batchRows, alokasiRows]);

  // State
  const [createOpen, setCreateOpen] = useState(false);
  const [tanggal, setTanggal] = useState(todayStr());
  const [namaSupplier, setNamaSupplier] = useState("");
  const [petugas, setPetugas] = useState("");
  const [catatan, setCatatan] = useState("");
  const [items, setItems] = useState<BatchItem[]>([emptyItem()]);
  const [saving, setSaving] = useState(false);

  // Voice
  const [listening, setListening] = useState(false);
  const recogRef = useRef<any>(null);
  const speechSupported = typeof window !== "undefined" && ((window as any).webkitSpeechRecognition || (window as any).SpeechRecognition);

  const startVoice = () => {
    const SR = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (!SR) { toast.error("Browser tidak mendukung voice — gunakan Chrome Android"); return; }
    if (listening) { recogRef.current?.stop(); return; }
    const rec = new SR();
    rec.lang = "id-ID"; rec.interimResults = false; rec.maxAlternatives = 1;
    rec.onstart = () => setListening(true);
    rec.onend = () => setListening(false);
    rec.onerror = (e: any) => {
      setListening(false);
      toast.error(e?.error === "not-allowed" ? "Izin mikrofon ditolak" : e?.error === "no-speech" ? "Tidak ada suara terdeteksi" : "Voice error, coba lagi");
    };
    rec.onresult = (e: any) => {
      const transcript = Array.from(e.results as ArrayLike<any>).map((r: any) => r[0]?.transcript ?? "").join(" ").trim();
      if (!transcript) return;
      const parsed = parseVoiceNote(transcript);
      if (parsed.items.length > 0) {
        const corrected = parsed.items.map((it) => {
          const m = findBestMatch(it.namaBarang, barangs);
          return { ...it, namaBarang: m ? (m.nama ?? it.namaBarang) : it.namaBarang, hargaModal: m?.harga ?? it.hargaModal };
        });
        setItems(corrected);
        if (parsed.supplier) {
          const sm = findBestMatch(parsed.supplier, suppliers);
          setNamaSupplier(sm ? (sm.nama ?? parsed.supplier) : parsed.supplier);
        }
        toast.success(`🎤 Terbaca: ${corrected.map((x) => `${x.namaBarang} ${x.qty}`).join(", ")}`);
      } else {
        toast.warning(`🎤 Tidak dikenali: "${transcript}". Contoh: "tongkol lima kilo dari Aga"`);
      }
    };
    recogRef.current = rec;
    try { rec.start(); } catch { /* already running */ }
  };

  // Split dialog state
  const [splitFor, setSplitFor] = useState<any>(null);
  const [splitBarang, setSplitBarang] = useState("");
  const [tujuan, setTujuan] = useState<"Reseller" | "DPL" | "Pasar">("Reseller");
  const [namaTujuan, setNamaTujuan] = useState("");
  const [qtySplit, setQtySplit] = useState(0);
  const [hargaJual, setHargaJual] = useState(0);

  const loading = batches === undefined;

  const pihakOptions = useMemo(() => {
    if (tujuan === "Reseller") return (resellers ?? []).map((r: any) => r.nama);
    if (tujuan === "DPL") return (dpls ?? []).map((d: any) => d.nama_pasar ?? d.nama);
    return (pasars ?? []).map((p: any) => p.nama_pasar ?? p.nama);
  }, [tujuan, resellers, dpls, pasars]);

  const resetCreateForm = () => {
    setTanggal(todayStr()); setNamaSupplier(""); setPetugas(""); setCatatan(""); setItems([emptyItem()]);
  };

  const handleCreate = async () => {
    if (!namaSupplier.trim()) { toast.error("Nama supplier wajib diisi"); return; }
    if (!items.some((it) => it.namaBarang.trim() && it.qty > 0)) { toast.error("Minimal satu barang dengan qty lebih dari 0"); return; }
    const sm = findBestMatch(namaSupplier.trim(), suppliers);
    const finalSupplier = sm?.nama ?? namaSupplier.trim();
    const correctedItems = items.filter((it) => it.namaBarang.trim() && it.qty > 0).map((it) => {
      const m = findBestMatch(it.namaBarang.trim(), barangs);
      return { ...it, namaBarang: m ? (m.nama ?? it.namaBarang.trim()) : it.namaBarang.trim() };
    });
    if (!sm) { toast.error("Supplier tidak ada di database — pilih dari daftar"); return; }
    const unknown = correctedItems.filter((it) => !findBestMatch(it.namaBarang, barangs)).map((it) => it.namaBarang);
    if (unknown.length > 0) { toast.error(`Barang belum terdaftar: ${unknown.join(", ")}`); return; }

    setSaving(true);
    try {
      const idBatch = `BM-${Date.now().toString(36).toUpperCase()}`;
      const totalModal = correctedItems.reduce((s, it) => s + it.qty * it.hargaModal, 0);
      const { error } = await supabase.from("batch_masuk").insert({
        id_batch: idBatch,
        tanggal,
        nama_supplier: finalSupplier,
        items: correctedItems.map((it) => ({ namaBarang: it.namaBarang, qty: it.qty, hargaModal: it.hargaModal })),
        total_modal: totalModal,
        petugas,
        catatan,
      });
      if (error) throw error;
      toast.success("Barang masuk tercatat 📦");
      resetCreateForm();
      setCreateOpen(false);
    } catch (e: any) {
      toast.error(e?.message ?? "Gagal menyimpan");
    } finally {
      setSaving(false);
    }
  };

  const openSplit = (batch: any) => {
    setSplitFor(batch);
    const firstSisa = (batch.sisaPerBarang ?? []).find((x: any) => x.sisa > 0);
    setSplitBarang(firstSisa?.namaBarang ?? "");
    setTujuan("Reseller"); setNamaTujuan("");
    setQtySplit(firstSisa?.sisa ?? 0); setHargaJual(0);
  };

  const handleSplit = async () => {
    if (!splitFor) return;
    if (!namaTujuan.trim()) { toast.error("Pilih / isi nama tujuan"); return; }
    if (!(qtySplit > 0)) { toast.error("Qty harus lebih dari 0"); return; }

    const modalPerKg = splitFor.sisaPerBarang?.find((x: any) => x.namaBarang === splitBarang)?.hargaModal ?? 0;
    const idAlokasi = `ALO-${Date.now().toString(36).toUpperCase()}`;
    const idInvoice = `INV-${Date.now().toString(36).toUpperCase()}`;

    try {
      // Insert batch_alokasi
      const { error: aloErr } = await supabase.from("batch_alokasi").insert({
        id_batch: splitFor.id,
        nama_pihak: namaTujuan.trim(),
        tipe_pihak: tujuan,
        items: [{ namaBarang: splitBarang, qty: qtySplit, hargaJual, hargaModal: modalPerKg }],
        total: qtySplit * hargaJual,
        id_invoice: idInvoice,
        status: "Pending",
      });
      if (aloErr) throw aloErr;

      // Insert invoice
      const { error: invErr } = await supabase.from("invoice").insert({
        id_invoice: idInvoice,
        tanggal: todayStr(),
        tipe: tujuan,
        nama_pihak: namaTujuan.trim(),
        items: [{ namaBarang: splitBarang, qty: qtySplit, hargaJual, hargaModal: modalPerKg }],
        total: qtySplit * hargaJual,
        total_penjualan: qtySplit * hargaJual,
        margin: (hargaJual - modalPerKg) * qtySplit,
        status_pembayaran: "Pending",
      });
      if (invErr) throw invErr;

      toast.success(`Invoice ${idInvoice} otomatis dibuat ✅`);
      setSplitFor(null);
    } catch (e: any) {
      toast.error(e?.message ?? "Gagal memecah barang");
    }
  };

  const handleDeleteBatch = async (batchId: string) => {
    try {
      // Delete alokasi first
      await supabase.from("batch_alokasi").delete().eq("id_batch", batchId);
      // Delete batch
      const { error } = await supabase.from("batch_masuk").delete().eq("id_batch", batchId);
      if (error) throw error;
      toast.success("Batch dihapus");
    } catch (e: any) {
      toast.error(e?.message ?? "Gagal menghapus");
    }
  };

  const handleConfirmAlokasi = async (alokasiId: string) => {
    try {
      const { error } = await supabase.from("batch_alokasi").update({ status: "Diterima" }).eq("id", alokasiId);
      if (error) throw error;
      toast.success("Alokasi ditandai diterima");
    } catch (e: any) {
      toast.error(e?.message ?? "Gagal");
    }
  };

  const handleDeleteAlokasi = async (alokasiId: string) => {
    try {
      const { error } = await supabase.from("batch_alokasi").delete().eq("id", alokasiId);
      if (error) throw error;
      toast.success("Alokasi dibatalkan");
    } catch (e: any) {
      toast.error(e?.message ?? "Gagal");
    }
  };

  const sisaBarangTerpilih = splitFor?.sisaPerBarang?.find((x: any) => x.namaBarang === splitBarang)?.sisa ?? 0;
  const modalPerKg = splitFor?.sisaPerBarang?.find((x: any) => x.namaBarang === splitBarang)?.hargaModal ?? 0;

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <PackagePlus className="size-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Barang Masuk</h1>
            <p className="text-sm text-muted-foreground">
              Catat barang datang dari supplier, lalu pecahkan ke Reseller/DPL/Pasar — invoice otomatis jadi.
            </p>
          </div>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="gap-2 cursor-pointer">
          <Plus className="size-4" />
          Catat Barang Masuk
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="mr-2 size-4 animate-spin" />
          Memuat…
        </div>
      ) : (batches ?? []).length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center">
          <Truck className="mx-auto mb-3 size-8 text-muted-foreground/50" />
          <p className="font-medium">Belum ada barang masuk</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Tekan "Catat Barang Masuk" saat barang dari supplier tiba di gudang.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {(batches ?? []).map((b: any) => {
            const persen = b.totalQty > 0 ? Math.min(100, ((b.totalQty - b.sisaTotal) / b.totalQty) * 100) : 0;
            return (
              <div key={b.id} className="rounded-lg border bg-card p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="flex flex-wrap items-center gap-2 font-semibold tracking-tight">
                      <Truck className="size-4 text-muted-foreground" />
                      {b.namaSupplier}
                      <span className="rounded-full bg-muted px-2 py-0.5 font-mono text-[11px] text-muted-foreground">{b.id}</span>
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {b.tanggal}{b.petugas ? ` · Dicatat: ${b.petugas}` : ""}{` · Modal total ${formatRp(b.totalModal)}`}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {b.alokasi.length === 0 && (
                      <Button variant="outline" size="sm" className="cursor-pointer gap-1.5 text-destructive hover:text-destructive" onClick={() => handleDeleteBatch(b.id)}>
                        <Trash2 className="size-3.5" /> Hapus
                      </Button>
                    )}
                    <Button size="sm" className="cursor-pointer gap-1.5" onClick={() => openSplit(b)}>
                      <Scissors className="size-3.5" /> Pecahkan
                    </Button>
                  </div>
                </div>

                <div className="mt-3 grid gap-1.5 sm:grid-cols-2">
                  {(b.sisaPerBarang ?? []).map((x: any) => (
                    <div key={x.namaBarang} className="flex flex-wrap items-center justify-between gap-x-2 rounded-md border px-3 py-1.5 text-sm">
                      <span>{x.namaBarang}</span>
                      <span className="text-xs text-muted-foreground tabular-nums">
                        masuk {x.qty} · alokasi {x.teralokasi} ·{" "}
                        <span className={x.sisa > 0 ? "font-semibold text-emerald-600" : ""}>sisa {x.sisa}</span>
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mt-3">
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${persen}%` }} />
                  </div>
                  <p className="mt-1 text-[11px] text-muted-foreground">Terpecah {Math.round(persen)}% · Sisa gudang {b.sisaTotal}</p>
                </div>

                {b.alokasi.length > 0 && (
                  <div className="mt-3 space-y-1 border-t pt-3">
                    <p className="text-[11px] font-semibold tracking-widest text-muted-foreground uppercase">Alokasi</p>
                    {b.alokasi.map((a: any) => (
                      <div key={a._id} className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-muted/40 px-3 py-1.5 text-xs">
                        <span>
                          <b>{a.namaBarang}</b> → {a.tujuan} <b>{a.namaTujuan}</b>: {a.qty} × {formatRp(a.hargaJual)}
                        </span>
                        <span className="flex flex-wrap items-center gap-2">
                          {a.status === "Diterima" ? (
                            <span className="flex items-center gap-1 font-medium text-emerald-600"><CheckCircle2 className="size-3.5" /> Diterima</span>
                          ) : (
                            <>
                              <button type="button" className="cursor-pointer font-medium text-primary hover:underline" onClick={() => handleConfirmAlokasi(a.id)}>
                                Tandai diterima
                              </button>
                              <button type="button" className="cursor-pointer font-medium text-destructive hover:underline" onClick={() => handleDeleteAlokasi(a.id)}>
                                Batal
                              </button>
                            </>
                          )}
                          {a.idInvoice && (
                            <span className="flex items-center gap-1 rounded-full border px-2 py-0.5 font-mono text-[10px] text-muted-foreground">
                              <FileText className="size-3" /> {a.idInvoice}
                            </span>
                          )}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {b.catatan && <p className="mt-2 text-xs italic text-muted-foreground">📝 {b.catatan}</p>}
              </div>
            );
          })}
        </div>
      )}

      {/* Dialog catat barang masuk */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader><DialogTitle>Catat Barang Masuk</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Tanggal</Label>
                <Input type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label>Nama Supplier *</Label>
                <Input placeholder="cth. Aga" list="supplier-options" value={namaSupplier} onChange={(e) => setNamaSupplier(e.target.value)} className="mt-1" />
                <datalist id="supplier-options">{(suppliers ?? []).map((s: any) => <option key={s.id} value={s.nama} />)}</datalist>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Petugas</Label>
                <Input placeholder="Nama pencatat" value={petugas} onChange={(e) => setPetugas(e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label>Catatan</Label>
                <Input placeholder="cth. 1 karung rusak" value={catatan} onChange={(e) => setCatatan(e.target.value)} className="mt-1" />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Label>Barang</Label>
                {speechSupported && (
                  <Button type="button" variant={listening ? "default" : "outline"} size="sm" className="cursor-pointer gap-1.5" onClick={startVoice}>
                    {listening ? <><MicOff className="size-3.5 animate-pulse" /> Mendengarkan… ketuk untuk stop</> : <><Mic className="size-3.5" /> Isi via Suara 🎤</>}
                  </Button>
                )}
              </div>
              {listening && <p className="text-xs text-muted-foreground">Ucapkan cth: "<b>tongkol lima kilo dari Aga</b>" atau "cabai dua puluh kilo dari Budi" — lalu isi harga modal manual.</p>}
              {items.map((it, idx) => (
                <div key={idx} className="grid grid-cols-[1fr_72px_110px_36px] items-end gap-2">
                  <Input placeholder="Nama barang" list="barang-master-options" value={it.namaBarang} onChange={(e) => setItems((prev) => prev.map((p, i) => (i === idx ? { ...p, namaBarang: e.target.value } : p)))} />
                  <Input type="number" inputMode="decimal" min={0} placeholder="Qty" value={it.qty || ""} onChange={(e) => setItems((prev) => prev.map((p, i) => (i === idx ? { ...p, qty: Number(e.target.value) || 0 } : p)))} />
                  <Input type="number" inputMode="numeric" min={0} placeholder="Modal/kg" value={it.hargaModal || ""} onChange={(e) => setItems((prev) => prev.map((p, i) => (i === idx ? { ...p, hargaModal: Number(e.target.value) || 0 } : p)))} />
                  <Button type="button" variant="ghost" size="icon" className="cursor-pointer text-destructive" disabled={items.length === 1} onClick={() => setItems((prev) => prev.filter((_, i) => i !== idx))}>
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              ))}
              <datalist id="barang-master-options">{(barangs ?? []).map((b: any) => <option key={b.id} value={b.nama} />)}</datalist>
              <Button type="button" variant="outline" size="sm" className="cursor-pointer gap-1.5" onClick={() => setItems((prev) => [...prev, emptyItem()])}>
                <Plus className="size-3.5" /> Tambah barang
              </Button>
            </div>

            <Button className="w-full cursor-pointer" onClick={handleCreate} disabled={saving}>
              {saving ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
              Simpan Barang Masuk
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog pecah batch */}
      <Dialog open={!!splitFor} onOpenChange={(v) => !v && setSplitFor(null)}>
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-md">
          <DialogHeader><DialogTitle>Pecahkan Barang — {splitFor?.namaSupplier}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Barang</Label>
              <Select value={splitBarang} onValueChange={(v) => { setSplitBarang(v); const row = splitFor?.sisaPerBarang?.find((x: any) => x.namaBarang === v); setQtySplit(row?.sisa ?? 0); }}>
                <SelectTrigger className="mt-1 w-full cursor-pointer"><SelectValue placeholder="Pilih barang" /></SelectTrigger>
                <SelectContent>
                  {(splitFor?.sisaPerBarang ?? []).filter((x: any) => x.sisa > 0).map((x: any) => (
                    <SelectItem key={x.namaBarang} value={x.namaBarang}>{x.namaBarang} (sisa {x.sisa})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="mt-1 text-xs text-muted-foreground">Sisa: <b>{sisaBarangTerpilih}</b> · Modal {formatRp(modalPerKg)}/kg</p>
            </div>

            <div>
              <Label>Tujuan</Label>
              <Select value={tujuan} onValueChange={(v) => { setTujuan(v as any); setNamaTujuan(""); }}>
                <SelectTrigger className="mt-1 w-full cursor-pointer"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Reseller">Reseller</SelectItem>
                  <SelectItem value="DPL">DPL</SelectItem>
                  <SelectItem value="Pasar">Pasar</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Nama Tujuan</Label>
              <Input list="pihak-options" placeholder={`cth. ${tujuan === "Pasar" ? "Victoria" : tujuan === "DPL" ? "Pasar Grosir" : "Budi"}`} value={namaTujuan} onChange={(e) => setNamaTujuan(e.target.value)} className="mt-1" />
              <datalist id="pihak-options">{pihakOptions.map((n: string) => <option key={n} value={n} />)}</datalist>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Qty</Label>
                <Input type="number" inputMode="decimal" min={0} value={qtySplit || ""} onChange={(e) => setQtySplit(Number(e.target.value) || 0)} className="mt-1" />
              </div>
              <div>
                <Label>Harga Jual</Label>
                <Input type="number" inputMode="numeric" min={0} value={hargaJual || ""} onChange={(e) => setHargaJual(Number(e.target.value) || 0)} className="mt-1" />
              </div>
            </div>

            <div className="rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
              Subtotal: <b className="text-foreground">{formatRp(qtySplit * hargaJual)}</b>
              {" · "}Estimasi margin:{" "}
              <b className="text-foreground">{formatRp((hargaJual - modalPerKg) * qtySplit)}</b>
              {tujuan === "Pasar" && " · Titipan: margin muncul setelah laporan stok akhir"}
            </div>

            <Button className="w-full cursor-pointer" onClick={handleSplit}>
              <Scissors className="mr-2 size-4" /> Pecah & Buat Invoice
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
