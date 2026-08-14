import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
import { FileText, Plus, Trash2, Printer, Eye, CheckCircle2, CalendarClock, Wallet, Pencil, Wand2, ScanLine, Tags } from "lucide-react";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { PageHeader, BadgeStatus } from "@/components/app/ui";
import { DataTable, type Column } from "@/components/app/DataTable";
import { PrintFrame } from "@/components/app/PrintFrame";
import { BarangSearch } from "@/components/app/BarangSearch";
import { PaymentDialog } from "@/components/app/PaymentDialog";
import { OcrInvoiceDialog } from "@/components/app/OcrInvoiceDialog";
import { NumInput } from "@/components/app/NumInput";
import { formatRupiah, formatDate, todayStr, genId, parseNum, nextSeqKode } from "@/lib/format";
import { daysUntil, formatCurrency, type MataUang } from "@/lib/business";
import {
  computeInvoiceTotals,
  INVOICE_TIPES,
  type InvoiceItem,
  type InvoiceTipe,
} from "@/lib/business";

const TIPE_LABEL: Record<string, string> = {
  Supplier: "Pembelian (Stok Masuk)",
  Reseller: "Penjualan (Stok Keluar)",
  DPL: "Penjualan (Stok Keluar)",
  Pasar: "Penjualan Pasar (Awal−Akhir)",
};

/** Hitung subtotal satu baris item sesuai tipe invoice. */
export function itemSubtotal(tipe: string, it: any): number {
  const qty =
    tipe === "Pasar"
      ? parseNum(it.stokAwal) - parseNum(it.stokAkhir)
      : parseNum(it.qty);
  const harga =
    tipe === "Supplier" ? parseNum(it.hargaModal) : parseNum(it.hargaJual);
  const st = qty * harga;
  // Pasar: Terjual BOLEH minus (stok akhir > stok awal) → subtotal ikut minus.
  return tipe === "Pasar" ? st : Math.max(0, st);
}

/** Total tagihan invoice (penjualan untuk non-Supplier, pembelian untuk Supplier). */
export function invoiceTotal(r: any): number {
  return r.totalPenjualan || r.total || 0;
}

/** Total yang sudah dibayar (default 0; invoice berstatus Lunas dianggap lunas). */
export function invoiceDibayar(r: any): number {
  if (typeof r?.dibayar === "number" && r.dibayar > 0) return r.dibayar;
  return (r?.statusPembayaran ?? "Pending") === "Lunas" ? invoiceTotal(r) : 0;
}

/** Sisa tagihan (total − sudah dibayar). */
export function invoiceSisa(r: any): number {
  return Math.max(0, invoiceTotal(r) - invoiceDibayar(r));
}

/** Teks ringkasan invoice untuk dikirim ke WhatsApp (tombol Kirim WA di print). */
export function buildInvoiceWaText(inv: any): string {
  const mu: MataUang = inv.mataUang === "$" ? "$" : "Rp";
  const lines: string[] = [];
  lines.push("*PT DAPUR LAUT*");
  lines.push(`Invoice: ${inv.idInvoice}`);
  lines.push(`Tanggal: ${formatDate(inv.tanggal)}`);
  lines.push(`Tipe: ${inv.tipe} | Pihak: ${inv.namaPihak}`);
  if (inv.tenggat) lines.push(`Tenggat: ${formatDate(inv.tenggat)}`);
  lines.push("------------------------------");
  for (const [i, it] of (inv.items ?? []).entries()) {
    const terjual =
      inv.tipe === "Pasar"
        ? parseNum(it.stokAwal) - parseNum(it.stokAkhir)
        : parseNum(it.qty);
    const harga = inv.tipe === "Supplier" ? parseNum(it.hargaModal) : parseNum(it.hargaJual);
    lines.push(`${i + 1}. ${it.namaBarang}`);
    lines.push(`   ${terjual} x ${formatCurrency(harga, mu)} = ${formatCurrency(terjual * harga, mu)}`);
  }
  lines.push("------------------------------");
  lines.push(`Total: ${formatCurrency(invoiceTotal(inv), mu)}`);
  lines.push(`Sisa: ${formatCurrency(invoiceSisa(inv), mu)}`);
  lines.push("Terima kasih 🙏");
  return lines.join("\n");
}

function emptyItem(): InvoiceItem {
  return { kodeBarang: "", namaBarang: "", hargaModal: 0, qty: 1, hargaJual: 0, subtotal: 0 };
}

function isRowEmpty(it: InvoiceItem): boolean {
  return (
    !it.kodeBarang &&
    !it.namaBarang &&
    parseNum(it.qty) <= 0 &&
    parseNum(it.hargaModal) <= 0 &&
    parseNum(it.hargaJual) <= 0 &&
    parseNum(it.stokAwal) <= 0 &&
    parseNum(it.stokAkhir) <= 0
  );
}

/** Badge sisa hari menuju jatuh tempo (Reseller/Supplier). */
function DueBadge({ tenggat }: { tenggat?: string }) {
  if (!tenggat) return <span className="text-muted-foreground">—</span>;
  const d = daysUntil(tenggat);
  if (Number.isNaN(d)) return <span className="text-muted-foreground">—</span>;
  if (d < 0)
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 text-[11px] font-semibold text-rose-700">
        <CalendarClock className="size-3" />
        Lewat {Math.abs(d)} hari
      </span>
    );
  if (d === 0)
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
        <CalendarClock className="size-3" />
        Jatuh tempo hari ini
      </span>
    );
  if (d <= 3)
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
        <CalendarClock className="size-3" />
        H-{d}
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
      <CheckCircle2 className="size-3" />
      H-{d}
    </span>
  );
}

export default function InvoicePage() {
  const invoices = useQuery(api.queries.listInvoice, {});
  const pihakList = useQuery(api.queries.listInvoicePihak);
  const barang = useQuery(api.queries.listBarang);
  const suppliers = useQuery(api.queries.listSupplier);
  const resellers = useQuery(api.queries.listReseller);
  const dpls = useQuery(api.queries.listDpl);
  const pasars = useQuery(api.queries.listPasar);
  const katalogs = useQuery(api.katalog.listKatalog);
  const createInvoice = useMutation(api.business.createInvoice);
  const editInvoice = useMutation(api.business.editInvoice);
  const deleteInvoice = useMutation(api.business.deleteInvoice);
  const setStatusInvoice = useMutation(api.business.setStatusInvoice);
  const bayarInvoice = useMutation(api.payment.bayarInvoice);
  const upsertBarang = useMutation(api.business.upsertBarang);
  const upsertKatalog = useMutation(api.katalog.upsertKatalog);

  const [searchParams, setSearchParams] = useSearchParams();

  const [open, setOpen] = useState(false);
  const [ocrOpen, setOcrOpen] = useState(false);
  const [tipe, setTipe] = useState<InvoiceTipe>("Reseller");
  const [tanggal, setTanggal] = useState(todayStr());
  const [idInvoice, setIdInvoice] = useState(() => genId("INV"));
  const [namaPihak, setNamaPihak] = useState("");
  const [tenggat, setTenggat] = useState("");
  const [mataUang, setMataUang] = useState<MataUang>("Rp");
  const [statusPembayaran, setStatusPembayaran] = useState<"Lunas" | "Pending">("Pending");
  const [items, setItems] = useState<InvoiceItem[]>([emptyItem()]);
  const [saving, setSaving] = useState(false);
  const [filterTipe, setFilterTipe] = useState<string>("");
  const [filterPihak, setFilterPihak] = useState<string>("");
  const [printInv, setPrintInv] = useState<any>(null);
  /** Baris yang sedang membuat barang baru ke database (index item). */
  const [creatingBarangIdx, setCreatingBarangIdx] = useState<number | null>(null);
  /** Kotak pencarian cepat di atas daftar barang. */
  const [quickSearch, setQuickSearch] = useState("");
  const [quickCreating, setQuickCreating] = useState(false);
  /** Invoice yang sedang diedit (mode edit — isi form otomatis dari invoice). */
  const [editInv, setEditInv] = useState<any>(null);
  /** Invoice yang sedang dibayar (dialog pembayaran). */
  const [payInv, setPayInv] = useState<any>(null);
  const [paySaving, setPaySaving] = useState(false);

  /** Cegah toast "harga diisi otomatis dari katalog" berulang utk pihak yg sama. */
  const lastAutoParty = useRef<string | null>(null);

  /** Nomor invoice otomatis berikutnya: INV001, INV002, dst (unik). */
  const nextInvoiceId = useMemo(() => {
    let max = 0;
    for (const i of invoices ?? []) {
      const m = /^INV(\d+)$/i.exec(String(i.idInvoice ?? ""));
      if (m) max = Math.max(max, parseInt(m[1], 10));
    }
    return `INV${String(max + 1).padStart(3, "0")}`;
  }, [invoices]);

  /** Kode barang otomatis berikutnya (BRG001, BRG002, …) saat menambah barang baru. */
  const nextBarangKode = useMemo(
    () => nextSeqKode((barang ?? []).map((b: any) => b.kode), "BRG"),
    [barang],
  );

  /** Katalog harga pihak yang sedang dipilih (cocok tipe + nama). */
  const katalogForParty = useMemo(() => {
    if (!katalogs) return null;
    const party = String(namaPihak ?? "").trim().toLowerCase();
    if (!party) return null;
    return (
      (katalogs as any[]).find(
        (k: any) =>
          k.tipe === tipe &&
          String(k.namaPihak ?? "").trim().toLowerCase() === party,
      ) ?? null
    );
  }, [katalogs, tipe, namaPihak]);

  // Notifikasi tenggat ditekan (AppLayout) → /dashboard/invoice?view=<id> → buka detail
  useEffect(() => {
    const view = searchParams.get("view");
    if (view && invoices) {
      const found = invoices.find((i: any) => i.idInvoice === view);
      if (found) setPrintInv(found);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, invoices, setSearchParams]);

  // Isi harga otomatis dari katalog saat pihak dipilih (hanya kolom kosong,
  // agar harga yang sudah diisi manual tidak tertimpa).
  useEffect(() => {
    const party = String(namaPihak ?? "").trim().toLowerCase();
    const kat = katalogForParty;
    if (!party || !kat || lastAutoParty.current === party) return;
    lastAutoParty.current = party;
    let filled = 0;
    const next = items.map((it) => {
      const ki = (kat.items ?? []).find(
        (x: any) =>
          String(x.kodeBarang ?? "") === String(it.kodeBarang ?? "") ||
          String(x.namaBarang ?? "").toLowerCase().trim() === String(it.namaBarang ?? "").toLowerCase().trim(),
      );
      if (!ki) return it;
      const harga = parseNum(ki.harga);
      const baruModal = parseNum(it.hargaModal) > 0 ? it.hargaModal : tipe === "Supplier" ? harga : it.hargaModal;
      const baruJual = parseNum(it.hargaJual) > 0 ? it.hargaJual : tipe === "Reseller" ? harga : it.hargaJual;
      if (tipe === "Supplier" ? parseNum(it.hargaModal) <= 0 : parseNum(it.hargaJual) <= 0) filled++;
      return {
        ...it,
        kodeBarang: it.kodeBarang || ki.kodeBarang,
        namaBarang: it.namaBarang || ki.namaBarang,
        hargaModal: baruModal,
        hargaJual: baruJual,
      };
    });
    setItems(next);
    if (filled > 0) {
      toast.success(`Harga ${filled} kolom diisi otomatis dari katalog ${kat.namaPihak}.`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [namaPihak, katalogForParty]);

  const pihakOptions = useMemo(() => {
    if (tipe === "Supplier") return suppliers?.map((s: any) => s.nama) ?? [];
    if (tipe === "Reseller") return resellers?.map((s: any) => s.nama) ?? [];
    if (tipe === "DPL") return dpls?.map((s: any) => s.namaPasar) ?? [];
    return pasars?.map((s: any) => s.namaPasar) ?? [];
  }, [tipe, suppliers, resellers, dpls, pasars]);

  // Opsi pihak yang sudah punya invoice (untuk pengelompokan per pihak)
  const filterPihakOptions = useMemo(() => {
    return (pihakList ?? [])
      .filter((p: any) => !filterTipe || p.tipe === filterTipe)
      .map((p: any) => p.namaPihak);
  }, [pihakList, filterTipe]);

  const totals = useMemo(() => computeInvoiceTotals(tipe, items), [tipe, items]);

  const filtered = useMemo(() => {
    if (!invoices) return invoices;
    return invoices.filter((i: any) => {
      if (filterTipe && i.tipe !== filterTipe) return false;
      if (filterPihak && i.namaPihak !== filterPihak) return false;
      return true;
    });
  }, [invoices, filterTipe, filterPihak]);

  const selectBarang = (idx: number, kode: string) => {
    const b = barang?.find((x: any) => x.kode === kode);
    setItems((prev) =>
      prev.map((it, i) =>
        i === idx ? { ...it, kodeBarang: kode, namaBarang: b?.nama ?? "", hargaJual: b?.harga ?? it.hargaJual } : it,
      ),
    );
  };

  const updateItem = (idx: number, patch: Partial<InvoiceItem>) => {
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  };

  const addRow = () => setItems((prev) => [...prev, emptyItem()]);
  const removeRow = (idx: number) =>
    setItems((prev) => (prev.length === 1 ? prev : prev.filter((_, i) => i !== idx)));

  /**
   * Barang yang diketik belum ada di database → buat sekarang dengan kode
   * otomatis (BRG001, BRG002, …) lalu isi baris invoice. Harga jual yang sudah
   * diketik dipakai sebagai harga default di master barang.
   */
  const handleCreateBarang = async (idx: number, nama: string) => {
    const name = String(nama ?? "").trim();
    if (!name) return;
    setCreatingBarangIdx(idx);
    try {
      const kode = nextBarangKode;
      const harga = items[idx] ? parseNum(items[idx].hargaJual) : 0;
      await upsertBarang({ doc: { kode, nama: name, harga, kategori: "" } });
      updateItem(idx, { kodeBarang: kode, namaBarang: name });
      toast.success(`Barang "${name}" ditambahkan ke database (${kode})`);
    } catch (e: any) {
      toast.error(e?.data?.message ?? e?.message ?? "Gagal menambahkan barang ke database");
    } finally {
      setCreatingBarangIdx(null);
    }
  };

  /** Tambah barang dari kotak pencarian cepat → langsung masuk daftar item. */
  const addQuickItem = (b: any) => {
    const newItem: InvoiceItem = {
      kodeBarang: b.kode,
      namaBarang: b.nama,
      hargaModal: parseNum(b.harga) || 0,
      qty: 1,
      hargaJual: parseNum(b.harga) || 0,
      subtotal: 0,
    };
    setItems((prev) => {
      const emptyIdx = prev.findIndex(isRowEmpty);
      if (emptyIdx >= 0) return prev.map((it, i) => (i === emptyIdx ? newItem : it));
      return [...prev, newItem];
    });
    setQuickSearch("");
    toast.success(`${b.nama} masuk daftar invoice`);
  };

  /**
   * Isi Semua (DB): isi harga modal & harga jual semua baris otomatis dari
   * harga barang di database (cocokkan lewat kode, lalu nama). Harga yang
   * sudah diisi manual TIDAK ditimpa — hanya kolom yang masih kosong/0.
   */
  const fillAllPrices = () => {
    if (!barang) {
      toast.error("Data barang belum termuat — coba lagi sebentar.");
      return;
    }
    let matched = 0;
    let filled = 0;
    const next = items.map((it) => {
      const b = (barang as any[]).find(
        (x: any) =>
          String(x.kode ?? "") === String(it.kodeBarang ?? "") ||
          String(x.nama ?? "").toLowerCase().trim() === String(it.namaBarang ?? "").toLowerCase().trim(),
      );
      if (!b) return it;
      matched++;
      const hargaDb = parseNum(b.harga);
      const baruModal = parseNum(it.hargaModal) > 0 ? it.hargaModal : hargaDb;
      const baruJual = parseNum(it.hargaJual) > 0 ? it.hargaJual : hargaDb;
      if (parseNum(it.hargaModal) <= 0 && hargaDb > 0) filled++;
      if (parseNum(it.hargaJual) <= 0 && hargaDb > 0) filled++;
      return {
        ...it,
        kodeBarang: it.kodeBarang || b.kode,
        namaBarang: it.namaBarang || b.nama,
        hargaModal: baruModal,
        hargaJual: baruJual,
      };
    });
    setItems(next);
    if (matched === 0) {
      toast.info("Tidak ada barang yang cocok dengan database — isi harga secara manual.");
    } else if (filled === 0) {
      toast.success(`Semua ${matched} barang sudah punya harga dari database.`);
    } else {
      toast.success(`Harga ${filled} kolom diisi otomatis dari database (${matched} barang).`);
    }
  };

  /**
   * Isi Katalog: isi harga semua baris dari KATALOG Harga pihak (Reseller/
   * Supplier). Katalog menyimpan harga khusus per pihak dan selalu terhubung
   * ke invoice. Hanya kolom kosong yang diisi (harga manual tidak ditimpa).
   */
  const applyKatalogPrices = () => {
    const kat = katalogForParty;
    if (!kat) {
      toast.info(
        tipe === "Supplier" || tipe === "Reseller"
          ? "Belum ada katalog untuk pihak ini — buat di menu Katalog Harga, atau isi manual."
          : "Katalog harga hanya untuk Reseller & Supplier.",
      );
      return;
    }
    let matched = 0;
    let filled = 0;
    const next = items.map((it) => {
      const ki = (kat.items ?? []).find(
        (x: any) =>
          String(x.kodeBarang ?? "") === String(it.kodeBarang ?? "") ||
          String(x.namaBarang ?? "").toLowerCase().trim() === String(it.namaBarang ?? "").toLowerCase().trim(),
      );
      if (!ki) return it;
      matched++;
      const harga = parseNum(ki.harga);
      const baruModal = parseNum(it.hargaModal) > 0 ? it.hargaModal : tipe === "Supplier" ? harga : it.hargaModal;
      const baruJual = parseNum(it.hargaJual) > 0 ? it.hargaJual : tipe === "Reseller" ? harga : it.hargaJual;
      if (tipe === "Supplier" ? parseNum(it.hargaModal) <= 0 : parseNum(it.hargaJual) <= 0) filled++;
      return {
        ...it,
        kodeBarang: it.kodeBarang || ki.kodeBarang,
        namaBarang: it.namaBarang || ki.namaBarang,
        hargaModal: baruModal,
        hargaJual: baruJual,
      };
    });
    setItems(next);
    if (matched === 0) {
      toast.info(`Katalog ${kat.namaPihak} ada, tapi tidak ada barang yang cocok — isi manual.`);
    } else if (filled === 0) {
      toast.success(`Semua ${matched} barang sudah memakai harga dari katalog ${kat.namaPihak}.`);
    } else {
      toast.success(`Harga ${filled} kolom diisi dari katalog ${kat.namaPihak} (${matched} barang).`);
    }
  };

  /** Buat barang baru dari kotak pencarian cepat (belum ada di database). */
  const quickCreateBarang = async (nama: string) => {
    const name = String(nama ?? "").trim();
    if (!name) return;
    setQuickCreating(true);
    try {
      const kode = nextBarangKode;
      await upsertBarang({ doc: { kode, nama: name, harga: 0, kategori: "" } });
      addQuickItem({ kode, nama: name, harga: 0 });
      toast.success(`Barang "${name}" ditambahkan ke database (${kode})`);
    } catch (e: any) {
      toast.error(e?.data?.message ?? e?.message ?? "Gagal menambahkan barang ke database");
    } finally {
      setQuickCreating(false);
    }
  };

  /** Simpan pembayaran invoice → otomatis kurangi sisa tagihan. */
  const handleBayarSave = async (nominal: number, tanggal: string, keterangan: string) => {
    if (!payInv) return;
    setPaySaving(true);
    try {
      const res = await bayarInvoice({
        idInvoice: payInv.idInvoice,
        nominal,
        tanggal,
        keterangan,
      });
      toast.success(
        res.sisa <= 0
          ? `Invoice ${res.idInvoice} LUNAS — total dibayar ${formatCurrency(res.dibayar, payInv.mataUang ?? "Rp")}`
          : `Pembayaran ${formatCurrency(nominal, payInv.mataUang ?? "Rp")} tercatat — sisa ${formatCurrency(res.sisa, payInv.mataUang ?? "Rp")}`,
      );
      setPayInv(null);
    } catch (e: any) {
      toast.error(e?.data?.message ?? e?.message ?? "Gagal menyimpan pembayaran");
    } finally {
      setPaySaving(false);
    }
  };

  const openCreate = () => {
    lastAutoParty.current = null;
    setEditInv(null);
    setTipe("Reseller");
    setTanggal(todayStr());
    setIdInvoice(nextInvoiceId);
    setNamaPihak("");
    setTenggat("");
    setMataUang("Rp");
    setStatusPembayaran("Pending");
    setItems([emptyItem()]);
    setQuickSearch("");
    setOpen(true);
  };

  /**
   * Buka dialog untuk mengedit invoice yang sudah jadi. Form diisi ulang dari
   * data invoice; nomor invoice dikunci (tidak bisa diubah). Efek stok & kas
   * lama otomatis dibatalkan lalu diterapkan ulang saat disimpan (editInvoice).
   */
  const openEdit = (r: any) => {
    lastAutoParty.current = null;
    setEditInv(r);
    setTipe(r.tipe);
    setTanggal(r.tanggal);
    setIdInvoice(r.idInvoice);
    setNamaPihak(r.namaPihak ?? "");
    setTenggat(r.tenggat ?? "");
    setMataUang(r.mataUang === "$" ? "$" : "Rp");
    setStatusPembayaran((r.statusPembayaran ?? "Pending") === "Lunas" ? "Lunas" : "Pending");
    setItems(
      (r.items ?? []).map((it: any) => ({
        kodeBarang: it.kodeBarang ?? "",
        namaBarang: it.namaBarang ?? "",
        hargaModal: parseNum(it.hargaModal),
        qty: parseNum(it.qty) || 1,
        hargaJual: parseNum(it.hargaJual),
        stokAwal: it.stokAwal != null ? parseNum(it.stokAwal) : undefined,
        stokAkhir: it.stokAkhir != null ? parseNum(it.stokAkhir) : undefined,
        subtotal: parseNum(it.subtotal),
      })),
    );
    setQuickSearch("");
    setOpen(true);
  };

  const changeTipe = (t: InvoiceTipe) => {
    lastAutoParty.current = null;
    setTipe(t);
    setNamaPihak("");
    setTenggat("");
    // Mata uang khusus Supplier (Rp/$); tipe lain selalu Rp
    if (t !== "Supplier") setMataUang("Rp");
    setItems([emptyItem()]);
  };

  const resetForm = () => {
    setEditInv(null);
    setTipe("Reseller");
    setTanggal(todayStr());
    setIdInvoice(nextInvoiceId);
    setNamaPihak("");
    setTenggat("");
    setMataUang("Rp");
    setStatusPembayaran("Pending");
    setItems([emptyItem()]);
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      // Buang baris yang benar-benar kosong (barang belum dipilih & semua
      // nilai 0) agar tidak memblokir penyimpanan invoice.
      const cleanItems = items
        .filter((it) => {
          const hasName = !!it.kodeBarang || !!it.namaBarang;
          const hasVal =
            parseNum(it.qty) > 0 ||
            parseNum(it.hargaModal) > 0 ||
            parseNum(it.hargaJual) > 0 ||
            parseNum(it.stokAwal) > 0 ||
            parseNum(it.stokAkhir) > 0;
          return hasName || hasVal;
        })
        .map((it) => {
          const stokAwal = tipe === "Pasar" ? parseNum(it.stokAwal) : 0;
          const stokAkhir = tipe === "Pasar" ? parseNum(it.stokAkhir) : 0;
          return {
            kodeBarang: it.kodeBarang,
            namaBarang: it.namaBarang,
            hargaModal: parseNum(it.hargaModal),
            hargaJual: parseNum(it.hargaJual),
            // Pasar: qty = stok awal (konsisten); subtotal = (awal - akhir) x harga jual
            qty: stokAwal || parseNum(it.qty),
            subtotal: itemSubtotal(tipe, it),
            stokAwal: tipe === "Pasar" ? stokAwal : undefined,
            stokAkhir: tipe === "Pasar" ? stokAkhir : undefined,
          };
        });
      if (cleanItems.length === 0) {
        toast.error("Tambahkan minimal 1 barang sebelum menyimpan invoice.");
        return;
      }
      const docPayload = {
        idInvoice,
        tanggal,
        tipe,
        namaPihak,
        tenggat,
        mataUang,
        statusPembayaran,
        items: cleanItems,
      };
      const res = editInv
        ? await editInvoice({ doc: docPayload })
        : await createInvoice({ doc: docPayload });
      // Sinkronkan katalog harga pihak (Reseller/Supplier) agar katalog selalu
      // terhubung ke invoice — otomatis membuat katalog baru untuk pihak baru.
      if (tipe === "Supplier" || tipe === "Reseller") {
        try {
          await upsertKatalog({
            tipe,
            namaPihak,
            items: cleanItems.map((it) => ({
              kodeBarang: it.kodeBarang,
              namaBarang: it.namaBarang,
              harga: it.hargaJual || it.hargaModal,
            })),
          });
        } catch {
          /* katalog pelengkap — gagal sinkron tidak menggagalkan invoice */
        }
      }
      toast.success(
        editInv
          ? `Invoice ${res.idInvoice} diperbarui — ${formatCurrency(res.totalPenjualan || res.total, mataUang)}`
          : `Invoice ${res.idInvoice} tersimpan — ${formatCurrency(res.totalPenjualan || res.total, mataUang)}`,
      );
      setOpen(false);
      setEditInv(null);
      resetForm();
    } catch (e: any) {
      const data = e?.data ?? e;
      const detail: string[] = Array.isArray(data?.detail) ? data.detail : [];
      const ringkas = detail
        .slice(0, 3)
        .map((s: string) => s.replace(/^items\.\d+\./, "").replace(/\./g, " "))
        .join(" · ");
      const msg = data?.message ?? e?.message ?? "Terjadi kesalahan";
      toast.error(ringkas ? `Gagal simpan — ${ringkas}` : msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteInvoice = async (id: string) => {
    try {
      await deleteInvoice({ idInvoice: id });
      toast.success("Invoice dihapus — kas & stok dikembalikan otomatis");
    } catch (e: any) {
      toast.error(e?.data?.message ?? e?.message ?? "Gagal menghapus invoice");
    }
  };

  const columns: Column<any>[] = [
    {
      key: "idInvoice",
      label: "No. Invoice",
      sortValue: (r) => r.idInvoice,
      render: (r) => <span className="font-semibold text-foreground">{r.idInvoice}</span>,
    },
    { key: "tanggal", label: "Tanggal", sortValue: (r) => r.tanggal, render: (r) => formatDate(r.tanggal) },
    { key: "tipe", label: "Tipe", render: (r) => <BadgeStatus status={r.tipe} /> },
    { key: "namaPihak", label: "Pihak", render: (r) => r.namaPihak },
    {
      key: "tenggat",
      label: "Tenggat",
      render: (r) => {
        if (!r.tenggat) return <span className="text-muted-foreground">—</span>;
        return (
          <div className="space-y-0.5">
            <p className="text-xs text-muted-foreground">{formatDate(r.tenggat)}</p>
            <DueBadge tenggat={r.tenggat} />
          </div>
        );
      },
    },
    {
      key: "statusPembayaran",
      label: "Status Bayar",
      render: (r) => {
        const st = (r.statusPembayaran ?? "Pending") === "Lunas" ? "Lunas" : "Pending";
        const sisa = invoiceSisa(r);
        return (
          <div className="flex items-center gap-1.5">
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                st === "Lunas" ? "bg-emerald-100 text-emerald-700" : sisa > 0 && r.dibayar > 0 ? "bg-sky-100 text-sky-700" : "bg-amber-100 text-amber-700"
              }`}
            >
              {st === "Lunas" ? <CheckCircle2 className="size-3" /> : <CalendarClock className="size-3" />}
              {st === "Lunas" ? "Lunas" : r.dibayar > 0 ? "Parsial" : "Pending"}
            </span>
            <Select
              value={st}
              onValueChange={async (v) => {
                try {
                  await setStatusInvoice({ idInvoice: r.idInvoice, status: v as "Lunas" | "Pending" });
                  toast.success(`Invoice ${r.idInvoice} — status: ${v}`);
                } catch (e: any) {
                  toast.error(e?.data?.message ?? e?.message ?? "Gagal mengubah status");
                }
              }}
            >
              <SelectTrigger className="h-6 w-24 cursor-pointer text-[11px]" aria-label="Ubah status pembayaran">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Lunas">Lunas</SelectItem>
              </SelectContent>
            </Select>
          </div>
        );
      },
    },
    {
      key: "total",
      label: "Total",
      align: "right",
      sortValue: (r) => r.totalPenjualan || r.total,
      render: (r) => (
        <span className="font-medium text-emerald-600 tabular-nums">
          {formatCurrency(r.totalPenjualan || r.total, r.mataUang ?? "Rp")}
        </span>
      ),
    },
    {
      key: "sisa",
      label: "Sisa",
      align: "right",
      sortValue: (r) => invoiceSisa(r),
      render: (r) => {
        const sisa = invoiceSisa(r);
        const mu: MataUang = r.mataUang === "$" ? "$" : "Rp";
        if (sisa <= 0)
          return (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600">
              <CheckCircle2 className="size-3" />
              Lunas
            </span>
          );
        return <span className="font-semibold text-rose-600 tabular-nums">{formatCurrency(sisa, mu)}</span>;
      },
    },
    {
      key: "margin",
      label: "Margin",
      align: "right",
      sortValue: (r) => r.margin,
      render: (r) =>
        r.tipe === "Supplier" ? (
          <span className="text-muted-foreground">—</span>
        ) : (
          <span className={r.margin >= 0 ? "text-sky-600 tabular-nums" : "text-rose-600 tabular-nums"}>
            {formatCurrency(r.margin, r.mataUang ?? "Rp")}
          </span>
        ),
    },
    {
      key: "aksi",
      label: "",
      align: "right",
      render: (r) => (
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="size-7 text-emerald-600 hover:text-emerald-700"
            title="Bayar"
            onClick={() => setPayInv(r)}
            disabled={invoiceSisa(r) <= 0}
          >
            <Wallet className="size-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-7 text-sky-600 hover:text-sky-700"
            title="Edit Invoice"
            onClick={() => openEdit(r)}
          >
            <Pencil className="size-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="size-7" title="Lihat & Cetak" onClick={() => setPrintInv(r)}>
            <Eye className="size-3.5" />
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon" className="size-7 text-rose-600 hover:text-rose-600" title="Hapus">
                <Trash2 className="size-3.5" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Hapus invoice {r.idInvoice}?</AlertDialogTitle>
                <AlertDialogDescription>
                  Kas dan riwayat stok dari invoice ini akan dikembalikan otomatis. Tindakan ini tidak dapat dibatalkan.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Batal</AlertDialogCancel>
                <AlertDialogAction className="bg-rose-600 hover:bg-rose-700" onClick={() => handleDeleteInvoice(r.idInvoice)}>
                  Hapus
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Invoice"
        description="Invoice multi-barang untuk Supplier, Reseller, DPL, dan Pasar. Harga otomatis ditarik dari Katalog Harga per pihak (Reseller/Supplier) saat nama pihak dipilih — katalog baru dibuat otomatis untuk pihak baru. Stok & kas diperbarui otomatis; aksi Bayar mencatat pembayaran; Cetak/PDF + Kirim WhatsApp. Scan foto invoice dengan OCR lalu verifikasi sebelum simpan."
        icon={FileText}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={() => setOcrOpen(true)}>
              <ScanLine className="mr-2 size-4" />
              Scan Invoice (OCR)
            </Button>
            <Button onClick={openCreate}>
              <Plus className="mr-2 size-4" />
              Buat Invoice
            </Button>
          </div>
        }
      />

      <div className="mb-4 grid gap-2 sm:grid-cols-2 sm:max-w-lg">
        <div>
          <Label className="text-xs font-medium">Filter Tipe</Label>
          <Select value={filterTipe} onValueChange={(v) => { setFilterTipe(v === "__all" ? "" : v); setFilterPihak(""); }}>
            <SelectTrigger className="mt-1.5">
              <SelectValue placeholder="Semua tipe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all">Semua tipe</SelectItem>
              {INVOICE_TIPES.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs font-medium">Kelompokkan per Pihak</Label>
          <Select value={filterPihak} onValueChange={(v) => setFilterPihak(v === "__all" ? "" : v)}>
            <SelectTrigger className="mt-1.5">
              <SelectValue placeholder="Semua pihak" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all">Semua pihak</SelectItem>
              {filterPihakOptions.map((p: string) => (
                <SelectItem key={p} value={p}>
                  {p}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <DataTable
        columns={columns}
        rows={filtered as any}
        loading={invoices === undefined}
        keyField={(r) => r.idInvoice}
        emptyTitle="Belum ada invoice"
        emptyDescription="Klik 'Buat Invoice' untuk membuat transaksi pertama."
      />

      {/* Form invoice */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>{editInv ? `Edit Invoice ${editInv.idInvoice}` : "Buat Invoice"}</DialogTitle>
            <DialogDescription>
              {editInv
                ? "Ubah isi invoice (tanggal, pihak, barang, harga, qty). Efek stok & kas lama otomatis dibatalkan lalu diterapkan ulang; pembayaran yang sudah tercatat tetap dipertahankan."
                : "Pilih tipe, isi pihak & barang. Harga ditarik otomatis dari katalog saat pihak dipilih; total dihitung otomatis; stok dan kas menyesuaikan."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <Label className="text-xs font-medium">Tipe Invoice *</Label>
              <Select value={tipe} onValueChange={(v) => changeTipe(v as InvoiceTipe)}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {INVOICE_TIPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t} — {TIPE_LABEL[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-medium">No. Invoice *</Label>
              <Input className="mt-1.5" value={idInvoice} onChange={(e) => setIdInvoice(e.target.value)} disabled={!!editInv} />
              <p className="mt-1 text-[11px] text-muted-foreground">
                {editInv ? "Nomor invoice tidak bisa diubah saat edit." : `Otomatis: ${nextInvoiceId} (unik, tidak bisa duplikat)`}
              </p>
            </div>
            <div>
              <Label className="text-xs font-medium">Tanggal *</Label>
              <Input className="mt-1.5" type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label className="text-xs font-medium">Nama {tipe === "Supplier" ? "Supplier" : "Pihak"} *</Label>
              <div className="mt-1.5 flex gap-2">
                <Input
                  className="flex-1"
                  list="pihak-options"
                  placeholder={tipe === "Supplier" ? "CV Samudra Jaya" : tipe === "Pasar" ? "Victoria / Tunas" : "Nama pihak"}
                  value={namaPihak}
                  onChange={(e) => setNamaPihak(e.target.value)}
                />
                <datalist id="pihak-options">
                  {pihakOptions.map((p: string) => (
                    <option key={p} value={p} />
                  ))}
                </datalist>
              </div>
              {katalogForParty && (
                <p className="mt-1 text-[11px] text-teal-600">
                  Katalog {katalogForParty.tipe} ditemukan ({katalogForParty.items.length} barang) — harga diisi otomatis untuk kolom kosong.
                </p>
              )}
            </div>
            {tipe === "Supplier" ? (
              <div>
                <Label className="text-xs font-medium">Mata Uang *</Label>
                <Select value={mataUang} onValueChange={(v) => setMataUang(v as MataUang)}>
                  <SelectTrigger className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Rp">Rupiah (Rp)</SelectItem>
                    <SelectItem value="$">Dolar ($)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Khusus Supplier boleh pilih Dolar. Transaksi lain selalu Rupiah.
                </p>
              </div>
            ) : (
              (tipe === "Reseller" || tipe === "DPL") && (
                <div>
                  <Label className="text-xs font-medium">
                    Tenggat Pembayaran <span className="text-muted-foreground">(opsional)</span>
                  </Label>
                  <Input
                    className="mt-1.5"
                    type="date"
                    min={tanggal}
                    value={tenggat}
                    onChange={(e) => setTenggat(e.target.value)}
                  />
                  {tenggat && (
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      Notifikasi otomatis H-3 sebelum jatuh tempo.
                    </p>
                  )}
                </div>
              )
            )}
            <div>
              <Label className="text-xs font-medium">Status Pembayaran *</Label>
              <Select value={statusPembayaran} onValueChange={(v) => setStatusPembayaran(v as "Lunas" | "Pending")}>
                <SelectTrigger className="mt-1.5 cursor-pointer">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pending">Pending — belum dibayar</SelectItem>
                  <SelectItem value="Lunas">Lunas — sudah dibayar</SelectItem>
                </SelectContent>
              </Select>
              <p className="mt-1 text-[11px] text-muted-foreground">Status bisa diubah kapan saja dari tabel invoice.</p>
            </div>
          </div>

          {/* Multi-item table — responsif (scroll horizontal di layar kecil) */}
          <div className="rounded-lg border">
            {/* Kotak pencarian cepat — seperti referensi POS: pilih barang → masuk daftar */}
            <div className="border-b bg-muted/20 px-3 py-2.5">
              <Label className="text-xs font-medium">Cari / Pilih Barang</Label>
              <div className="mt-1.5 flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-3">
                <BarangSearch
                  className="w-full sm:w-96"
                  barang={(barang ?? []) as any}
                  value={quickSearch}
                  onChange={setQuickSearch}
                  onPick={addQuickItem}
                  onCreateNew={quickCreateBarang}
                  creatingNew={quickCreating}
                  nextKode={nextBarangKode}
                  placeholder="Cari / Pilih Barang…"
                />
                <p className="text-[11px] text-muted-foreground">
                  Ketuk hasil untuk menambah ke daftar. Barang yang belum ada langsung dibuat ke database.
                </p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] text-sm">
                <thead>
                  <tr className="border-b bg-muted/40 text-left text-[11px] tracking-wide text-muted-foreground uppercase">
                    <th className="min-w-44 px-2 py-2 font-semibold sm:min-w-56">Barang</th>
                    <th className="min-w-28 px-2 py-2 text-right font-semibold">Harga Modal</th>
                    {tipe === "Pasar" ? (
                      <>
                        <th className="min-w-24 px-2 py-2 text-right font-semibold">Stok Awal</th>
                        <th className="min-w-24 px-2 py-2 text-right font-semibold">Stok Akhir</th>
                        <th className="min-w-20 px-2 py-2 text-right font-semibold">Terjual</th>
                      </>
                    ) : (
                      <th className="min-w-24 px-2 py-2 text-right font-semibold">Qty</th>
                    )}
                    {tipe !== "Supplier" && <th className="min-w-28 px-2 py-2 text-right font-semibold">Harga Jual</th>}
                    <th className="min-w-32 px-2 py-2 text-right font-semibold">Subtotal</th>
                    <th className="w-10 px-1 py-2" />
                  </tr>
                </thead>
                <tbody>
                  {items.map((it, idx) => {
                    const subtotal = itemSubtotal(tipe, it);
                    return (
                      <tr key={idx} className="border-b last:border-0">
                        <td className="px-2 py-2">
                          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-1.5">
                            <Input
                              className="h-8 w-full text-base sm:w-24 sm:text-sm"
                              list={`barang-list-${idx}`}
                              placeholder="Kode"
                              value={it.kodeBarang}
                              onChange={(e) => selectBarang(idx, e.target.value)}
                            />
                            <datalist id={`barang-list-${idx}`}>
                              {(barang ?? []).map((b: any) => (
                                <option key={b.kode} value={b.kode}>
                                  {b.nama}
                                </option>
                              ))}
                            </datalist>
                            <BarangSearch
                              className="flex-1"
                              barang={(barang ?? []) as any}
                              value={it.namaBarang}
                              onChange={(v) => updateItem(idx, { namaBarang: v })}
                              onPick={(b) =>
                                updateItem(idx, {
                                  kodeBarang: b.kode,
                                  namaBarang: b.nama,
                                  hargaJual: b.harga ?? it.hargaJual,
                                  hargaModal: it.hargaModal || (b.harga ?? 0),
                                })
                              }
                              onCreateNew={(nama) => handleCreateBarang(idx, nama)}
                              creatingNew={creatingBarangIdx === idx}
                              nextKode={nextBarangKode}
                              placeholder="Ketik nama barang…"
                            />
                          </div>
                        </td>
                        <td className="px-2 py-2">
                          <NumInput
                            className="h-8 w-full min-w-24 text-base text-right sm:text-sm"
                            value={it.hargaModal}
                            onValue={(n) => updateItem(idx, { hargaModal: n })}
                          />
                        </td>
                        {tipe === "Pasar" ? (
                          <>
                            <td className="px-2 py-2">
                              <NumInput
                                className="h-8 w-full min-w-24 text-base text-right sm:text-sm"
                                value={it.stokAwal}
                                onValue={(n) => updateItem(idx, { stokAwal: n, qty: n })}
                              />
                            </td>
                            <td className="px-2 py-2">
                              <NumInput
                                className="h-8 w-full min-w-24 text-base text-right sm:text-sm"
                                value={it.stokAkhir}
                                onValue={(n) => updateItem(idx, { stokAkhir: n })}
                              />
                            </td>
                            <td
                              className={`px-2 py-2 text-right font-semibold tabular-nums ${parseNum(it.stokAwal) - parseNum(it.stokAkhir) < 0 ? "text-rose-600" : "text-teal-600"}`}
                            >
                              {parseNum(it.stokAwal) - parseNum(it.stokAkhir)}
                            </td>
                          </>
                        ) : (
                          <td className="px-2 py-2">
                            <NumInput
                              className="h-8 w-full min-w-24 text-base text-right sm:text-sm"
                              value={it.qty}
                              onValue={(n) => updateItem(idx, { qty: n })}
                            />
                          </td>
                        )}
                        {tipe !== "Supplier" && (
                          <td className="px-2 py-2">
                            <NumInput
                              className="h-8 w-full min-w-28 text-base text-right sm:text-sm"
                              value={it.hargaJual}
                              onValue={(n) => updateItem(idx, { hargaJual: n })}
                            />
                          </td>
                        )}
                        <td className={`min-w-32 px-2 py-2 text-right font-semibold tabular-nums ${subtotal < 0 ? "text-rose-600" : ""}`}>
                          {formatCurrency(subtotal, mataUang)}
                        </td>
                        <td className="px-1 py-2">
                          <Button variant="ghost" size="icon" className="size-7 text-rose-500" onClick={() => removeRow(idx)}>
                            <Trash2 className="size-3.5" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="flex flex-col gap-2 border-t bg-muted/20 px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-2">
                <Button variant="outline" size="sm" onClick={addRow}>
                  <Plus className="mr-1.5 size-3.5" />
                  Tambah Barang
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fillAllPrices}
                  title="Isi harga modal & jual semua baris dari harga barang di database"
                >
                  <Wand2 className="mr-1.5 size-3.5" />
                  Isi Semua (DB)
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={applyKatalogPrices}
                  disabled={!katalogForParty}
                  title="Isi harga dari katalog khusus pihak ini (Reseller/Supplier)"
                >
                  <Tags className="mr-1.5 size-3.5" />
                  Isi Katalog
                </Button>
              </div>
              <div className="text-right text-xs">
                <div className="text-muted-foreground">
                  Total Modal: <span className="font-semibold text-foreground tabular-nums">{formatCurrency(totals.totalModal, mataUang)}</span>
                </div>
                {tipe !== "Supplier" && (
                  <div className="text-muted-foreground">
                    Total Penjualan:{" "}
                    <span className="font-semibold text-emerald-600 tabular-nums">{formatCurrency(totals.totalPenjualan, mataUang)}</span>
                  </div>
                )}
                {tipe !== "Supplier" && (
                  <div className="text-muted-foreground">
                    Margin:{" "}
                    <span className={totals.margin >= 0 ? "font-semibold text-sky-600 tabular-nums" : "font-semibold text-rose-600 tabular-nums"}>
                      {formatCurrency(totals.margin, mataUang)}
                    </span>
                  </div>
                )}
                <div className="mt-0.5 text-sm">
                  Total: <span className="font-bold text-foreground tabular-nums">{formatCurrency(totals.total, mataUang)}</span>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleSubmit} disabled={saving || !namaPihak || items.length === 0}>
              {saving ? "Menyimpan..." : editInv ? "Simpan Perubahan" : "Simpan Invoice"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog pembayaran invoice */}
      <PaymentDialog
        open={!!payInv}
        onOpenChange={(o) => {
          if (!o) setPayInv(null);
        }}
        idInvoice={payInv?.idInvoice ?? ""}
        pihak={payInv?.namaPihak}
        total={payInv ? invoiceTotal(payInv) : 0}
        dibayar={payInv ? invoiceDibayar(payInv) : 0}
        sisa={payInv ? invoiceSisa(payInv) : 0}
        mataUang={(payInv?.mataUang ?? "Rp") as MataUang}
        riwayat={payInv?.riwayatBayar ?? []}
        saving={paySaving}
        onSave={handleBayarSave}
      />

      {/* Dialog OCR scan invoice */}
      <OcrInvoiceDialog
        open={ocrOpen}
        onOpenChange={setOcrOpen}
        nextInvoiceId={nextInvoiceId}
        onSaved={(inv) => setPrintInv(inv)}
      />

      {/* Print dokumen invoice */}
      <PrintFrame
        open={!!printInv}
        onClose={() => setPrintInv(null)}
        title={`Invoice ${printInv?.idInvoice ?? ""}`}
        waText={printInv ? buildInvoiceWaText(printInv) : undefined}
      >
        {printInv && <InvoicePrintDoc invoice={printInv} />}
      </PrintFrame>
    </div>
  );
}

export function InvoicePrintDoc({ invoice }: { invoice: any }) {
  const mu: MataUang = invoice.mataUang === "$" ? "$" : "Rp";
  const dibayar = invoiceDibayar(invoice);
  const sisa = invoiceSisa(invoice);
  const lunas = sisa <= 0;
  const isPasar = invoice.tipe === "Pasar";
  return (
    <div className="relative">
      {/* Watermark status pembayaran (BELUM LUNAS / LUNAS) */}
      <div className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center">
        <div
          className={`-rotate-12 rounded-xl border-4 px-5 py-3 text-2xl font-black uppercase tracking-[0.25em] opacity-20 sm:px-8 sm:py-4 sm:text-3xl ${
            lunas ? "border-emerald-600 text-emerald-600" : "border-rose-600 text-rose-600"
          }`}
        >
          {lunas ? "LUNAS" : "BELUM LUNAS"}
        </div>
      </div>

      <div className="relative z-10">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 text-sm">
          <div>
            <p className="text-xs text-slate-500">Nomor Invoice</p>
            <p className="text-lg font-bold text-slate-900">{invoice.idInvoice}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-500">Tanggal</p>
            <p className="font-semibold">{formatDate(invoice.tanggal)}</p>
          </div>
        </div>

        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-md bg-slate-50 px-4 py-3 text-sm">
          <div>
            <p className="text-xs text-slate-500">Tipe Transaksi</p>
            <p className="font-semibold">{invoice.tipe}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Pihak</p>
            <p className="font-semibold">{invoice.namaPihak}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Mata Uang</p>
            <p className="font-semibold">{mu}</p>
          </div>
          {invoice.tenggat && (
            <div>
              <p className="text-xs text-slate-500">Tenggat Pembayaran</p>
              <p className="font-semibold">{formatDate(invoice.tenggat)}</p>
            </div>
          )}
          <div>
            <p className="text-xs text-slate-500">Status Pembayaran</p>
            <p className={`font-semibold ${lunas ? "text-emerald-700" : "text-rose-600"}`}>
              {lunas ? "Lunas" : "Belum Lunas"}
            </p>
          </div>
        </div>

        {/* Ringkasan pembayaran */}
        <div className="mb-4 grid grid-cols-3 gap-1.5 text-sm sm:gap-2">
          <div className="rounded-md border border-slate-200 px-2 py-2 sm:px-3">
            <p className="text-[11px] text-slate-500 sm:text-xs">Total Tagihan</p>
            <p className="font-bold tabular-nums">{formatCurrency(invoiceTotal(invoice), mu)}</p>
          </div>
          <div className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-2 sm:px-3">
            <p className="text-[11px] text-emerald-700 sm:text-xs">Sudah Dibayar</p>
            <p className="font-bold text-emerald-700 tabular-nums">{formatCurrency(dibayar, mu)}</p>
          </div>
          <div className={`rounded-md border px-2 py-2 sm:px-3 ${lunas ? "border-emerald-200 bg-emerald-50" : "border-rose-200 bg-rose-50"}`}>
            <p className={`text-[11px] sm:text-xs ${lunas ? "text-emerald-700" : "text-rose-600"}`}>Sisa Tagihan</p>
            <p className={`font-bold tabular-nums ${lunas ? "text-emerald-700" : "text-rose-600"}`}>{formatCurrency(sisa, mu)}</p>
          </div>
        </div>

        {/* Riwayat pembayaran */}
        {Array.isArray(invoice.riwayatBayar) && invoice.riwayatBayar.length > 0 && (
          <div className="mb-4 rounded-md border border-slate-200 px-4 py-2 text-sm">
            <p className="mb-1 text-xs font-semibold text-slate-500">Riwayat Pembayaran</p>
            {invoice.riwayatBayar.map((r: any, i: number) => (
              <div key={i} className="flex justify-between border-t border-slate-100 py-1 text-xs first:border-0">
                <span className="text-slate-600">
                  {formatDate(r.tanggal)}
                  {r.keterangan ? ` · ${r.keterangan}` : ""}
                </span>
                <span className="font-semibold tabular-nums">{formatCurrency(r.nominal, mu)}</span>
              </div>
            ))}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[540px] border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="bg-slate-100 text-left text-xs text-slate-600 uppercase">
                <th className="border border-slate-200 px-1.5 py-1.5 sm:px-2 sm:py-2">No</th>
                <th className="border border-slate-200 px-1.5 py-1.5 sm:px-2 sm:py-2">Kode</th>
                <th className="border border-slate-200 px-1.5 py-1.5 sm:px-2 sm:py-2">Nama Barang</th>
                {isPasar ? (
                  <>
                    <th className="border border-slate-200 px-1.5 py-1.5 text-right sm:px-2 sm:py-2">Stok Awal</th>
                    <th className="border border-slate-200 px-1.5 py-1.5 text-right sm:px-2 sm:py-2">Stok Akhir</th>
                    <th className="border border-slate-200 px-1.5 py-1.5 text-right sm:px-2 sm:py-2">Terjual</th>
                    <th className="border border-slate-200 px-1.5 py-1.5 text-right sm:px-2 sm:py-2">Harga Modal</th>
                    <th className="border border-slate-200 px-1.5 py-1.5 text-right sm:px-2 sm:py-2">Harga Jual</th>
                  </>
                ) : (
                  <>
                    <th className="border border-slate-200 px-1.5 py-1.5 text-right sm:px-2 sm:py-2">Qty</th>
                    <th className="border border-slate-200 px-1.5 py-1.5 text-right sm:px-2 sm:py-2">Harga</th>
                  </>
                )}
                <th className="border border-slate-200 px-1.5 py-1.5 text-right sm:px-2 sm:py-2">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((it: any, i: number) => {
                const terjual = isPasar
                  ? parseNum(it.stokAwal) - parseNum(it.stokAkhir)
                  : it.qty;
                const harga = invoice.tipe === "Supplier" ? it.hargaModal : it.hargaJual;
                const hasStored = it.subtotal != null && String(it.subtotal).trim() !== "";
                // Fallback kalau subtotal tidak tersimpan (data lama): hitung ulang.
                // Pasar: subtotal tersimpan bisa NEGATIF (terjual minus) — dipakai apa adanya.
                const subtotal = hasStored ? parseNum(it.subtotal) : Math.max(0, parseNum(terjual) * parseNum(harga));
                return (
                  <tr key={i}>
                    <td className="border border-slate-200 px-1.5 py-1 sm:px-2 sm:py-1.5">{i + 1}</td>
                    <td className="border border-slate-200 px-1.5 py-1 sm:px-2 sm:py-1.5">{it.kodeBarang}</td>
                    <td className="border border-slate-200 px-1.5 py-1 sm:px-2 sm:py-1.5">{it.namaBarang}</td>
                    {isPasar ? (
                      <>
                        <td className="border border-slate-200 px-1.5 py-1 text-right sm:px-2 sm:py-1.5">{it.stokAwal ?? 0}</td>
                        <td className="border border-slate-200 px-1.5 py-1 text-right sm:px-2 sm:py-1.5">{it.stokAkhir ?? 0}</td>
                        <td className={`border border-slate-200 px-1.5 py-1 text-right sm:px-2 sm:py-1.5 ${terjual < 0 ? "font-bold text-rose-600" : ""}`}>{terjual}</td>
                        <td className="border border-slate-200 px-1.5 py-1 text-right sm:px-2 sm:py-1.5">{formatCurrency(it.hargaModal, mu)}</td>
                        <td className="border border-slate-200 px-1.5 py-1 text-right sm:px-2 sm:py-1.5">{formatCurrency(it.hargaJual, mu)}</td>
                      </>
                    ) : (
                      <>
                        <td className="border border-slate-200 px-1.5 py-1 text-right sm:px-2 sm:py-1.5">{terjual}</td>
                        <td className="border border-slate-200 px-1.5 py-1 text-right sm:px-2 sm:py-1.5">{formatCurrency(harga, mu)}</td>
                      </>
                    )}
                    <td className="border border-slate-200 px-1.5 py-1 text-right sm:px-2 sm:py-1.5">{formatCurrency(subtotal, mu)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Nota penjualan (Reseller/DPL) TIDAK menampilkan Total Modal & Margin —
            hanya total akhir. Pasar menampilkan rincian stok & harga di tabel.
            Supplier tetap menampilkan total pembelian. */}
        <div className="mt-4 flex justify-end">
          <div className="w-full space-y-1 text-sm sm:w-64">
            <div className="flex justify-between text-slate-600">
              <span>Sudah Dibayar</span>
              <span className="tabular-nums">{formatCurrency(dibayar, mu)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Sisa</span>
              <span className={`font-semibold tabular-nums ${lunas ? "text-emerald-700" : "text-rose-600"}`}>
                {formatCurrency(sisa, mu)}
              </span>
            </div>
            <div className="flex justify-between border-t border-slate-300 pt-1 text-base font-bold">
              <span>Total</span>
              <span className="tabular-nums">{formatCurrency(invoice.tipe === "Supplier" ? invoice.total : invoice.totalPenjualan, mu)}</span>
            </div>
          </div>
        </div>

        <div className="mt-12">
          <div className="grid grid-cols-2 gap-8 text-sm">
            <div>
              <p>Diterima oleh,</p>
              <div className="mt-14" />
              <p className="font-semibold">____________________</p>
              <p className="text-xs text-slate-500">({invoice.namaPihak})</p>
            </div>
            <div>
              <p>Hormat kami,</p>
              <div className="mt-14" />
              <p className="font-semibold">____________________</p>
              <p className="text-xs text-slate-500">(Pimpinan Dapur Laut)</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
