import { useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
import {
  Droplets,
  Plus,
  Trash2,
  Eye,
  ShoppingCart,
  PackageCheck,
  Boxes,
  Landmark,
  CheckCircle2,
  Wallet,
} from "lucide-react";
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
import { PageHeader, SectionCard, BadgeStatus } from "@/components/app/ui";
import { DataTable, type Column } from "@/components/app/DataTable";
import { PrintFrame } from "@/components/app/PrintFrame";
import { BarangSearch } from "@/components/app/BarangSearch";
import { PaymentDialog } from "@/components/app/PaymentDialog";
import { formatDate, todayStr, parseNum, nextSeqKode } from "@/lib/format";
import { formatCurrency, type MataUang, type TetesanTipe } from "@/lib/business";

const TIPE_LABEL: Record<string, string> = {
  Modal: "Beli bahan baku (harga modal)",
  Penjualan: "Jual barang jadi (harga jual)",
};

/** Sudah dibayar invoice tetesan (Lunas dianggap lunas penuh). */
export function tetesanDibayar(r: any): number {
  if (typeof r?.dibayar === "number" && r.dibayar > 0) return r.dibayar;
  return (r?.statusPembayaran ?? "Pending") === "Lunas" ? r?.total || 0 : 0;
}

/** Sisa tagihan invoice tetesan (total − sudah dibayar). */
export function tetesanSisa(r: any): number {
  return Math.max(0, (r?.total || 0) - tetesanDibayar(r));
}

interface Row {
  kodeBarang: string;
  namaBarang: string;
  harga: number;
  qty: number;
  subtotal: number;
}

function emptyRow(): Row {
  return { kodeBarang: "", namaBarang: "", harga: 0, qty: 1, subtotal: 0 };
}

function isRowEmpty(r: Row): boolean {
  return (
    !r.kodeBarang &&
    !r.namaBarang &&
    parseNum(r.harga) <= 0 &&
    parseNum(r.qty) <= 0
  );
}

function nextInvoiceId(list: any[] | undefined): string {
  let max = 0;
  for (const i of list ?? []) {
    const m = /^(?:TET|INV)?(\d+)$/i.exec(String(i.idInvoice ?? "").replace(/^TET/, ""));
    const n = parseInt(m?.[1] ?? "0", 10);
    if (!Number.isNaN(n)) max = Math.max(max, n);
  }
  return `TET${String(max + 1).padStart(3, "0")}`;
}

export default function TetesanPage() {
  const invoices = useQuery(api.queries.listInvoiceTetesan, {});
  const bahanBaku = useQuery(api.queries.listBahanBaku);
  const barangJadi = useQuery(api.queries.listBarangJadi);
  const stokRows = useQuery(api.queries.listTetesanStok);
  const createInvoice = useMutation(api.business.createInvoiceTetesan);
  const deleteInvoice = useMutation(api.business.deleteInvoiceTetesan);
  const bayarInvoice = useMutation(api.payment.bayarInvoiceTetesan);
  const upsertBahanBaku = useMutation(api.business.upsertBahanBaku);
  const upsertBarangJadi = useMutation(api.business.upsertBarangJadi);

  const [tab, setTab] = useState<TetesanTipe>("Penjualan");
  const [open, setOpen] = useState(false);
  const [tanggal, setTanggal] = useState(todayStr());
  const [idInvoice, setIdInvoice] = useState("TET001");
  const [namaPihak, setNamaPihak] = useState("");
  const [rows, setRows] = useState<Row[]>([emptyRow()]);
  const [saving, setSaving] = useState(false);
  const [printInv, setPrintInv] = useState<any>(null);
  /** Baris yang sedang membuat master baru ke database. */
  const [creatingBarangIdx, setCreatingBarangIdx] = useState<number | null>(null);
  /** Kotak pencarian cepat di atas daftar barang. */
  const [quickSearch, setQuickSearch] = useState("");
  const [quickCreating, setQuickCreating] = useState(false);
  /** Invoice yang sedang dibayar (dialog pembayaran). */
  const [payInv, setPayInv] = useState<any>(null);
  const [paySaving, setPaySaving] = useState(false);

  const stokMap = useMemo(() => {
    const m = new Map<string, number>();
    for (const s of stokRows ?? []) m.set(s.namaBarang, s.stokAkhir);
    return m;
  }, [stokRows]);

  const master = tab === "Modal" ? bahanBaku : barangJadi;
  const masterKey = tab === "Modal" ? "hargaModal" : "hargaJual";

  /** Kode master otomatis berikutnya sesuai tab: BBK001 (bahan baku) / BJK001 (barang jadi). */
  const nextMasterKode = useMemo(
    () =>
      nextSeqKode(
        ((tab === "Modal" ? bahanBaku : barangJadi) ?? []).map((b: any) => b.kode),
        tab === "Modal" ? "BBK" : "BJK",
      ),
    [tab, bahanBaku, barangJadi],
  );

  const total = useMemo(
    () => rows.reduce((s, r) => s + parseNum(r.harga) * Math.max(0, parseNum(r.qty)), 0),
    [rows],
  );

  const openCreate = (tipe: TetesanTipe) => {
    setTab(tipe);
    setTanggal(todayStr());
    setIdInvoice(nextInvoiceId(invoices));
    setNamaPihak("");
    setRows([emptyRow()]);
    setQuickSearch("");
    setOpen(true);
  };

  const selectBarang = (idx: number, b: any) => {
    setRows((prev) =>
      prev.map((r, i) =>
        i === idx
          ? { ...r, kodeBarang: b.kode, namaBarang: b.nama, harga: parseNum(b[masterKey]) }
          : r,
      ),
    );
  };

  const updateRow = (idx: number, patch: Partial<Row>) => {
    setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  };

  const addRow = () => setRows((prev) => [...prev, emptyRow()]);
  const removeRow = (idx: number) => setRows((prev) => (prev.length === 1 ? prev : prev.filter((_, i) => i !== idx)));

  /**
   * Bahan baku / barang jadi yang diketik belum terdaftar → buat master baru
   * dengan kode otomatis (BBK001 / BJK001, dst) lalu isi baris invoice.
   */
  const handleCreateBarang = async (idx: number, nama: string) => {
    const name = String(nama ?? "").trim();
    if (!name) return;
    setCreatingBarangIdx(idx);
    try {
      const kode = nextMasterKode;
      const harga = rows[idx] ? parseNum(rows[idx].harga) : 0;
      if (tab === "Modal") {
        await upsertBahanBaku({ doc: { kode, nama: name, hargaModal: harga, stokAwal: 0, kategori: "" } });
      } else {
        await upsertBarangJadi({ doc: { kode, nama: name, hargaJual: harga, stokAwal: 0, kategori: "" } });
      }
      updateRow(idx, { kodeBarang: kode, namaBarang: name });
      toast.success(`${name} ditambahkan ke database (${kode})`);
    } catch (e: any) {
      toast.error(e?.data?.message ?? e?.message ?? "Gagal menambahkan ke database");
    } finally {
      setCreatingBarangIdx(null);
    }
  };

  /** Tambah bahan baku/barang jadi dari kotak pencarian cepat → langsung masuk daftar. */
  const addQuickItem = (b: any) => {
    const newRow: Row = {
      kodeBarang: b.kode,
      namaBarang: b.nama,
      harga: parseNum(b[masterKey]) || 0,
      qty: 1,
      subtotal: 0,
    };
    setRows((prev) => {
      const emptyIdx = prev.findIndex(isRowEmpty);
      if (emptyIdx >= 0) return prev.map((r, i) => (i === emptyIdx ? newRow : r));
      return [...prev, newRow];
    });
    setQuickSearch("");
    toast.success(`${b.nama} masuk daftar invoice`);
  };

  /** Buat master baru dari kotak pencarian cepat (belum ada di database). */
  const quickCreateBarang = async (nama: string) => {
    const name = String(nama ?? "").trim();
    if (!name) return;
    setQuickCreating(true);
    try {
      const kode = nextMasterKode;
      if (tab === "Modal") {
        await upsertBahanBaku({ doc: { kode, nama: name, hargaModal: 0, stokAwal: 0, kategori: "" } });
      } else {
        await upsertBarangJadi({ doc: { kode, nama: name, hargaJual: 0, stokAwal: 0, kategori: "" } });
      }
      addQuickItem({ kode, nama: name });
      toast.success(`${name} ditambahkan ke database (${kode})`);
    } catch (e: any) {
      toast.error(e?.data?.message ?? e?.message ?? "Gagal menambahkan ke database");
    } finally {
      setQuickCreating(false);
    }
  };

  /** Simpan pembayaran invoice tetesan → otomatis kurangi sisa tagihan. */
  const handleBayarSave = async (nominal: number, tanggalBayar: string, keterangan: string) => {
    if (!payInv) return;
    setPaySaving(true);
    try {
      const res = await bayarInvoice({
        idInvoice: payInv.idInvoice,
        nominal,
        tanggal: tanggalBayar,
        keterangan,
      });
      toast.success(
        res.sisa <= 0
          ? `Invoice ${res.idInvoice} LUNAS — total dibayar ${formatCurrency(res.dibayar, "Rp")}`
          : `Pembayaran ${formatCurrency(nominal, "Rp")} tercatat — sisa ${formatCurrency(res.sisa, "Rp")}`,
      );
      setPayInv(null);
    } catch (e: any) {
      toast.error(e?.data?.message ?? e?.message ?? "Gagal menyimpan pembayaran");
    } finally {
      setPaySaving(false);
    }
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      // Buang baris kosong (barang belum dipilih & semua nilai 0) agar tidak
      // memblokir penyimpanan invoice tetesan.
      const items = rows
        .filter((r) => !!r.kodeBarang || !!r.namaBarang || parseNum(r.harga) > 0 || parseNum(r.qty) > 0)
        .map((r) => ({
          kodeBarang: r.kodeBarang,
          namaBarang: r.namaBarang,
          harga: parseNum(r.harga),
          qty: parseNum(r.qty),
          subtotal: parseNum(r.harga) * parseNum(r.qty),
        }));
      if (items.length === 0) {
        toast.error("Tambahkan minimal 1 barang sebelum menyimpan invoice.");
        return;
      }
      const res = await createInvoice({ doc: { idInvoice, tanggal, tipe: tab, namaPihak, mataUang: "Rp", items } });
      toast.success(
        tab === "Modal"
          ? `Invoice Modal ${res.idInvoice} tersimpan — ${formatCurrency(res.total)}`
          : `Invoice Penjualan ${res.idInvoice} tersimpan — ${formatCurrency(res.total)}`,
      );
      setOpen(false);
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
      toast.success("Invoice Tetesan dihapus — kas & stok dikembalikan");
    } catch (e: any) {
      toast.error(e?.data?.message ?? e?.message ?? "Gagal menghapus invoice");
    }
  };

  const filtered = useMemo(() => {
    if (!invoices) return invoices;
    return invoices.filter((i: any) => i.tipe === tab);
  }, [invoices, tab]);

  const columns: Column<any>[] = [
    {
      key: "idInvoice",
      label: "No. Invoice",
      sortValue: (r) => r.idInvoice,
      render: (r) => <span className="font-semibold">{r.idInvoice}</span>,
    },
    { key: "tanggal", label: "Tanggal", sortValue: (r) => r.tanggal, render: (r) => formatDate(r.tanggal) },
    { key: "tipe", label: "Tipe", render: (r) => <BadgeStatus status={r.tipe} /> },
    { key: "namaPihak", label: "Pihak", render: (r) => r.namaPihak },
    {
      key: "items",
      label: "Jumlah Item",
      align: "right",
      render: (r) => r.items?.length ?? 0,
    },
    {
      key: "total",
      label: "Total",
      align: "right",
      sortValue: (r) => r.total,
      render: (r) => <span className="font-semibold text-emerald-600 tabular-nums">{formatCurrency(r.total, r.mataUang ?? "Rp")}</span>,
    },
    {
      key: "sisa",
      label: "Sisa",
      align: "right",
      sortValue: (r) => tetesanSisa(r),
      render: (r) => {
        const sisa = tetesanSisa(r);
        if (sisa <= 0)
          return (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600">
              <CheckCircle2 className="size-3" />
              Lunas
            </span>
          );
        return <span className="font-semibold text-rose-600 tabular-nums">{formatCurrency(sisa, r.mataUang ?? "Rp")}</span>;
      },
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
            disabled={tetesanSisa(r) <= 0}
          >
            <Wallet className="size-3.5" />
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
        title="Invoice Tetesan"
        description="Invoice Modal (bahan baku, harga modal) & Invoice Penjualan (barang jadi, harga jual). Harga modal hanya tersimpan di database, tidak tampil di invoice penjualan. Bahan baku/barang jadi baru bisa langsung ditambahkan ke database saat diketik. Aksi Bayar mencatat pembayaran & mengurangi sisa tagihan otomatis."
        icon={Droplets}
        actions={
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button variant="outline" onClick={() => openCreate("Modal")}>
              <ShoppingCart className="mr-2 size-4" />
              Invoice Modal
            </Button>
            <Button onClick={() => openCreate("Penjualan")}>
              <PackageCheck className="mr-2 size-4" />
              Invoice Penjualan
            </Button>
          </div>
        }
      />

      {/* Stok ringkas */}
      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <SectionCard title="Stok Barang Jadi">
          <p className="text-2xl font-bold text-primary tabular-nums">
            {(stokRows ?? []).filter((s: any) => s.namaBarang && (barangJadi ?? []).some((b: any) => b.nama === s.namaBarang)).length}
          </p>
          <p className="text-xs text-muted-foreground">jenis barang jadi terdaftar</p>
        </SectionCard>
        <SectionCard title="Total Stok Jadi">
          <p className="text-2xl font-bold text-emerald-600 tabular-nums">
            {(stokRows ?? [])
              .filter((s: any) => (barangJadi ?? []).some((b: any) => b.nama === s.namaBarang))
              .reduce((sum: number, s: any) => sum + Math.max(0, s.stokAkhir), 0)}
          </p>
          <p className="text-xs text-muted-foreground">unit siap jual</p>
        </SectionCard>
        <SectionCard title="Stok Bahan Baku">
          <p className="text-2xl font-bold text-sky-600 tabular-nums">
            {(stokRows ?? [])
              .filter((s: any) => (bahanBaku ?? []).some((b: any) => b.nama === s.namaBarang))
              .reduce((sum: number, s: any) => sum + Math.max(0, s.stokAkhir), 0)}
          </p>
          <p className="text-xs text-muted-foreground">unit bahan baku</p>
        </SectionCard>
      </div>

      {/* Tab Modal / Penjualan */}
      <div className="mb-4 inline-flex rounded-lg border bg-muted/40 p-1">
        {(["Penjualan", "Modal"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`cursor-pointer rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
              tab === t ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Invoice {t}
          </button>
        ))}
      </div>

      <DataTable
        columns={columns}
        rows={filtered as any}
        loading={invoices === undefined}
        keyField={(r) => r.idInvoice}
        emptyTitle={`Belum ada invoice ${tab}`}
        emptyDescription={`Klik 'Invoice ${tab}' untuk membuat transaksi pertama.`}
      />

      {/* Form invoice tetesan */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Invoice {tab === "Modal" ? "Modal" : "Penjualan"} Tetesan</DialogTitle>
            <DialogDescription>
              {TIPE_LABEL[tab]}. Stok & kas diperbarui otomatis. Barang baru bisa langsung ditambahkan ke database saat diketik.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <Label className="text-xs font-medium">Tipe *</Label>
              <Select value={tab} onValueChange={(v) => setTab(v as TetesanTipe)}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Modal">Modal — {TIPE_LABEL.Modal}</SelectItem>
                  <SelectItem value="Penjualan">Penjualan — {TIPE_LABEL.Penjualan}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-medium">No. Invoice *</Label>
              <Input className="mt-1.5" value={idInvoice} onChange={(e) => setIdInvoice(e.target.value)} />
              <p className="mt-1 text-[11px] text-muted-foreground">Contoh: {nextInvoiceId(invoices)} (unik)</p>
            </div>
            <div>
              <Label className="text-xs font-medium">Tanggal *</Label>
              <Input className="mt-1.5" type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} />
            </div>
          </div>

          <div>
            <Label className="text-xs font-medium">
              Nama Pihak / Toko <span className="text-muted-foreground">(mis. "Kios Ibu Sari")</span> *
            </Label>
            <Input
              className="mt-1.5"
              placeholder={tab === "Modal" ? "Pemasok bahan baku" : "Nama toko / pembeli barang jadi"}
              value={namaPihak}
              onChange={(e) => setNamaPihak(e.target.value)}
            />
          </div>

          <div className="rounded-lg border">
            {/* Kotak pencarian cepat — pilih bahan baku/barang jadi → masuk daftar */}
            <div className="border-b bg-muted/20 px-3 py-2.5">
              <Label className="text-xs font-medium">Cari / Pilih {tab === "Modal" ? "Bahan Baku" : "Barang Jadi"}</Label>
              <div className="mt-1.5 flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-3">
                <BarangSearch
                  className="w-full sm:w-96"
                  barang={(master ?? []) as any}
                  value={quickSearch}
                  onChange={setQuickSearch}
                  onPick={addQuickItem}
                  onCreateNew={quickCreateBarang}
                  creatingNew={quickCreating}
                  nextKode={nextMasterKode}
                  placeholder={tab === "Modal" ? "Cari / Pilih Bahan Baku…" : "Cari / Pilih Barang Jadi…"}
                />
                <p className="text-[11px] text-muted-foreground">
                  Ketuk hasil untuk menambah ke daftar. Barang yang belum ada langsung dibuat ke database.
                </p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm">
                <thead>
                  <tr className="border-b bg-muted/40 text-left text-[11px] tracking-wide text-muted-foreground uppercase">
                    <th className="min-w-52 px-2 py-2 font-semibold">
                      {tab === "Modal" ? "Bahan Baku" : "Barang Jadi"}
                    </th>
                    <th className="min-w-28 px-2 py-2 text-right font-semibold">
                      {tab === "Modal" ? "Harga Modal" : "Harga Jual"}
                    </th>
                    <th className="min-w-24 px-2 py-2 text-right font-semibold">Qty</th>
                    <th className="min-w-32 px-2 py-2 text-right font-semibold">Subtotal</th>
                    <th className="w-10 px-1 py-2" />
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, idx) => {
                    const subtotal = parseNum(r.harga) * Math.max(0, parseNum(r.qty));
                    const stokTersedia = tab === "Penjualan" ? stokMap.get(r.namaBarang) ?? 0 : null;
                    return (
                      <tr key={idx} className="border-b last:border-0">
                        <td className="px-2 py-2">
                          <BarangSearch
                            barang={(master ?? []) as any}
                            value={r.namaBarang}
                            onChange={(v) => updateRow(idx, { namaBarang: v })}
                            onPick={(b) => selectBarang(idx, b)}
                            onCreateNew={(nama) => handleCreateBarang(idx, nama)}
                            creatingNew={creatingBarangIdx === idx}
                            nextKode={nextMasterKode}
                            placeholder={tab === "Modal" ? "Ketik bahan baku…" : "Ketik barang jadi…"}
                          />
                          {tab === "Penjualan" && r.namaBarang && (
                            <p className="mt-0.5 text-[10px] text-muted-foreground">
                              Stok tersedia: <b className={(stokTersedia ?? 0) <= 0 ? "text-rose-600" : "text-emerald-600"}>{stokTersedia ?? 0}</b>
                            </p>
                          )}
                        </td>
                        <td className="px-2 py-2">
                          <Input
                            className="h-8 w-full min-w-24 text-base text-right tabular-nums sm:text-sm"
                            type="number"
                            inputMode="decimal"
                            min={0}
                            step="any"
                            value={r.harga || ""}
                            onChange={(e) => updateRow(idx, { harga: parseNum(e.target.value) })}
                          />
                        </td>
                        <td className="px-2 py-2">
                          <Input
                            className="h-8 w-full min-w-24 text-base text-right tabular-nums sm:text-sm"
                            type="number"
                            inputMode="decimal"
                            min={0}
                            step="any"
                            value={r.qty || ""}
                            onChange={(e) => updateRow(idx, { qty: parseNum(e.target.value) })}
                          />
                        </td>
                        <td className="min-w-32 px-2 py-2 text-right font-semibold tabular-nums">{formatCurrency(subtotal)}</td>
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
              <Button variant="outline" size="sm" onClick={addRow}>
                <Plus className="mr-1.5 size-3.5" />
                Tambah Barang
              </Button>
              <div className="text-right text-sm">
                Total: <span className="font-bold text-foreground tabular-nums">{formatCurrency(total)}</span>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleSubmit} disabled={saving || !namaPihak || rows.length === 0}>
              {saving ? "Menyimpan..." : `Simpan Invoice ${tab}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog pembayaran invoice tetesan */}
      <PaymentDialog
        open={!!payInv}
        onOpenChange={(o) => {
          if (!o) setPayInv(null);
        }}
        idInvoice={payInv?.idInvoice ?? ""}
        pihak={payInv?.namaPihak}
        total={payInv ? payInv.total ?? 0 : 0}
        dibayar={payInv ? tetesanDibayar(payInv) : 0}
        sisa={payInv ? tetesanSisa(payInv) : 0}
        mataUang="Rp"
        riwayat={payInv?.riwayatBayar ?? []}
        saving={paySaving}
        onSave={handleBayarSave}
      />

      {/* Print */}
      <PrintFrame
        open={!!printInv}
        onClose={() => setPrintInv(null)}
        title={`${printInv?.tipe ?? ""} Tetesan ${printInv?.idInvoice ?? ""}`}
      >
        {printInv && <TetesanPrintDoc invoice={printInv} />}
      </PrintFrame>
    </div>
  );
}

function TetesanPrintDoc({ invoice }: { invoice: any }) {
  const mu: MataUang = invoice.mataUang === "$" ? "$" : "Rp";
  const isModal = invoice.tipe === "Modal";
  const dibayar = tetesanDibayar(invoice);
  const sisa = tetesanSisa(invoice);
  const lunas = sisa <= 0;
  return (
    <div className="relative">
      {/* Watermark status pembayaran (BELUM LUNAS / LUNAS) */}
      <div className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center">
        <div
          className={`-rotate-12 rounded-xl border-4 px-8 py-4 text-3xl font-black uppercase tracking-[0.25em] opacity-20 ${
            lunas ? "border-emerald-600 text-emerald-600" : "border-rose-600 text-rose-600"
          }`}
        >
          {lunas ? "LUNAS" : "BELUM LUNAS"}
        </div>
      </div>

      <div className="relative z-10">
        <div className="mb-2 flex items-center justify-center gap-2">
          <Boxes className="size-4 text-sky-700" />
          <p className="text-center text-base font-bold tracking-wide text-sky-800 uppercase">
            {isModal ? "Invoice Modal Tetesan" : "Invoice Penjualan Tetesan"}
          </p>
        </div>
        <div className="mx-auto mb-4 h-0.5 w-40 bg-gradient-to-r from-sky-800 via-amber-500 to-sky-800" />

        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 text-sm">
          <div>
            <p className="text-xs text-slate-500">Nomor Invoice</p>
            <p className="text-lg font-bold text-slate-900">{invoice.idInvoice}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-500">Tanggal</p>
            <p className="font-semibold">{formatDate(invoice.tanggal)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-500">Pihak / Toko</p>
            <p className="font-semibold">{invoice.namaPihak}</p>
          </div>
        </div>

        {/* Ringkasan pembayaran */}
        <div className="mb-4 grid grid-cols-3 gap-2 text-sm">
          <div className="rounded-md border border-slate-200 px-3 py-2">
            <p className="text-xs text-slate-500">Total Tagihan</p>
            <p className="font-bold tabular-nums">{formatCurrency(invoice.total || 0, mu)}</p>
          </div>
          <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2">
            <p className="text-xs text-emerald-700">Sudah Dibayar</p>
            <p className="font-bold text-emerald-700 tabular-nums">{formatCurrency(dibayar, mu)}</p>
          </div>
          <div className={`rounded-md border px-3 py-2 ${lunas ? "border-emerald-200 bg-emerald-50" : "border-rose-200 bg-rose-50"}`}>
            <p className={`text-xs ${lunas ? "text-emerald-700" : "text-rose-600"}`}>Sisa Tagihan</p>
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

        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-sky-50 text-left text-xs text-sky-900 uppercase">
              <th className="border border-slate-200 px-2 py-2">No</th>
              <th className="border border-slate-200 px-2 py-2">Kode</th>
              <th className="border border-slate-200 px-2 py-2">{isModal ? "Bahan Baku" : "Barang Jadi"}</th>
              <th className="border border-slate-200 px-2 py-2 text-right">Qty</th>
              <th className="border border-slate-200 px-2 py-2 text-right">{isModal ? "Harga Modal" : "Harga Jual"}</th>
              <th className="border border-slate-200 px-2 py-2 text-right">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((it: any, i: number) => (
              <tr key={i}>
                <td className="border border-slate-200 px-2 py-1.5">{i + 1}</td>
                <td className="border border-slate-200 px-2 py-1.5">{it.kodeBarang}</td>
                <td className="border border-slate-200 px-2 py-1.5">{it.namaBarang}</td>
                <td className="border border-slate-200 px-2 py-1.5 text-right">{it.qty}</td>
                <td className="border border-slate-200 px-2 py-1.5 text-right">{formatCurrency(it.harga, mu)}</td>
                <td className="border border-slate-200 px-2 py-1.5 text-right">{formatCurrency(it.subtotal, mu)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-4 flex justify-end">
          <div className="w-64 space-y-1 text-sm">
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
              <span className="tabular-nums">{formatCurrency(invoice.total, mu)}</span>
            </div>
          </div>
        </div>

        <div className="mt-12 grid grid-cols-2 gap-8 text-sm">
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

        {/* Footer kontak & alamat */}
        <div className="mt-10 flex items-center justify-center gap-4 border-t border-slate-200 pt-3 text-[10px] text-slate-500">
          <span className="flex items-center gap-1">
            <Landmark className="size-3" />
            Dapur Laut — Kepulauan Riau · Batam, Tanjung Uncang, Tunas Regency
          </span>
          <span>dapurlaut@example.com</span>
        </div>
      </div>
    </div>
  );
}
