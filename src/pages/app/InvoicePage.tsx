import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
import { FileText, Plus, Trash2, Printer, Eye, CheckCircle2, CalendarClock } from "lucide-react";
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
import { PageHeader, BadgeStatus } from "@/components/app/ui";
import { DataTable, type Column } from "@/components/app/DataTable";
import { PrintFrame } from "@/components/app/PrintFrame";
import { BarangSearch } from "@/components/app/BarangSearch";
import { formatRupiah, formatDate, todayStr, genId } from "@/lib/format";
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
      ? (Number(it.stokAwal) || 0) - (Number(it.stokAkhir) || 0)
      : Number(it.qty) || 0;
  const harga =
    tipe === "Supplier" ? Number(it.hargaModal) || 0 : Number(it.hargaJual) || 0;
  return Math.max(0, qty * harga);
}

function emptyItem(): InvoiceItem {
  return { kodeBarang: "", namaBarang: "", hargaModal: 0, qty: 1, hargaJual: 0, subtotal: 0 };
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
  const createInvoice = useMutation(api.business.createInvoice);
  const deleteInvoice = useMutation(api.business.deleteInvoice);
  const setStatusInvoice = useMutation(api.business.setStatusInvoice);

  const [searchParams, setSearchParams] = useSearchParams();

  const [open, setOpen] = useState(false);
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

  /** Nomor invoice otomatis berikutnya: INV001, INV002, dst (unik). */
  const nextInvoiceId = useMemo(() => {
    let max = 0;
    for (const i of invoices ?? []) {
      const m = /^INV(\d+)$/i.exec(String(i.idInvoice ?? ""));
      if (m) max = Math.max(max, parseInt(m[1], 10));
    }
    return `INV${String(max + 1).padStart(3, "0")}`;
  }, [invoices]);

  // Notifikasi tenggat ditekan (AppLayout) → /dashboard/invoice?view=<id> → buka detail
  useEffect(() => {
    const view = searchParams.get("view");
    if (view && invoices) {
      const found = invoices.find((i: any) => i.idInvoice === view);
      if (found) setPrintInv(found);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, invoices, setSearchParams]);

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

  const openCreate = () => {
    setTipe("Reseller");
    setTanggal(todayStr());
    setIdInvoice(nextInvoiceId);
    setNamaPihak("");
    setTenggat("");
    setMataUang("Rp");
    setStatusPembayaran("Pending");
    setItems([emptyItem()]);
    setOpen(true);
  };

  const changeTipe = (t: InvoiceTipe) => {
    setTipe(t);
    setNamaPihak("");
    setTenggat("");
    // Mata uang khusus Supplier (Rp/$); tipe lain selalu Rp
    if (t !== "Supplier") setMataUang("Rp");
    setItems([emptyItem()]);
  };

  const resetForm = () => {
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
      const cleanItems = items.map((it) => {
        const stokAwal = tipe === "Pasar" ? Number(it.stokAwal) || 0 : 0;
        const stokAkhir = tipe === "Pasar" ? Number(it.stokAkhir) || 0 : 0;
        return {
          kodeBarang: it.kodeBarang,
          namaBarang: it.namaBarang,
          hargaModal: Number(it.hargaModal) || 0,
          hargaJual: Number(it.hargaJual) || 0,
          // Pasar: qty = stok awal (konsisten); subtotal = (awal - akhir) x harga jual
          qty: stokAwal || Number(it.qty) || 0,
          subtotal: itemSubtotal(tipe, it),
          stokAwal: tipe === "Pasar" ? stokAwal : undefined,
          stokAkhir: tipe === "Pasar" ? stokAkhir : undefined,
        };
      });
      const res = await createInvoice({
        doc: {
          idInvoice,
          tanggal,
          tipe,
          namaPihak,
          tenggat,
          mataUang,
          statusPembayaran,
          items: cleanItems,
        },
      });
      toast.success(`Invoice ${res.idInvoice} tersimpan — ${formatCurrency(res.totalPenjualan || res.total, mataUang)}`);
      setOpen(false);
      resetForm();
    } catch (e: any) {
      const msg = e?.data?.message ?? e?.message ?? "Terjadi kesalahan";
      toast.error(msg.includes("schema") ? "Data tidak valid. Periksa kembali isian invoice." : msg);
    } finally {
      setSaving(false);
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
        const st = r.statusPembayaran ?? "Pending";
        return (
          <div className="flex items-center gap-1.5">
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                st === "Lunas" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
              }`}
            >
              {st === "Lunas" ? <CheckCircle2 className="size-3" /> : <CalendarClock className="size-3" />}
              {st}
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
          <Button variant="ghost" size="icon" className="size-7" title="Lihat & Cetak" onClick={() => setPrintInv(r)}>
            <Eye className="size-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-7 text-rose-600 hover:text-rose-600"
            title="Hapus"
            onClick={async () => {
              await deleteInvoice({ idInvoice: r.idInvoice });
              toast.success("Invoice dihapus");
            }}
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Invoice"
        description="Invoice multi-barang untuk Supplier, Reseller, DPL, dan Pasar. Stok & kas diperbarui otomatis; tenggat pembayaran untuk Reseller & Supplier; mata uang Rp/$ khusus Supplier; status pembayaran Lunas/Pending bisa diubah kapan saja."
        icon={FileText}
        actions={
          <Button onClick={openCreate}>
            <Plus className="mr-2 size-4" />
            Buat Invoice
          </Button>
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
            <DialogTitle>Buat Invoice</DialogTitle>
            <DialogDescription>
              Pilih tipe, isi pihak & barang. Total dihitung otomatis; stok dan kas menyesuaikan.
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
              <Input className="mt-1.5" value={idInvoice} onChange={(e) => setIdInvoice(e.target.value)} />
              <p className="mt-1 text-[11px] text-muted-foreground">Otomatis: {nextInvoiceId} (unik, tidak bisa duplikat)</p>
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
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-sm">
                <thead>
                  <tr className="border-b bg-muted/40 text-left text-[11px] tracking-wide text-muted-foreground uppercase">
                    <th className="min-w-56 px-2 py-2 font-semibold">Barang</th>
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
                              placeholder="Ketik nama barang…"
                            />
                          </div>
                        </td>
                        <td className="px-2 py-2">
                          <Input
                            className="h-8 w-full min-w-24 text-base text-right tabular-nums sm:text-sm"
                            type="number"
                            inputMode="decimal"
                            min={0}
                            value={it.hargaModal || ""}
                            onChange={(e) => updateItem(idx, { hargaModal: Number(e.target.value) })}
                          />
                        </td>
                        {tipe === "Pasar" ? (
                          <>
                            <td className="px-2 py-2">
                              <Input
                                className="h-8 w-full min-w-24 text-base text-right tabular-nums sm:text-sm"
                                type="number"
                                inputMode="decimal"
                                min={0.01}
                                step="any"
                                value={it.stokAwal || ""}
                                onChange={(e) => updateItem(idx, { stokAwal: Number(e.target.value), qty: Number(e.target.value) })}
                              />
                            </td>
                            <td className="px-2 py-2">
                              <Input
                                className="h-8 w-full min-w-24 text-base text-right tabular-nums sm:text-sm"
                                type="number"
                                inputMode="decimal"
                                min={0}
                                step="any"
                                value={it.stokAkhir || ""}
                                onChange={(e) => updateItem(idx, { stokAkhir: Number(e.target.value) })}
                              />
                            </td>
                            <td className="px-2 py-2 text-right font-semibold text-teal-600 tabular-nums">
                              {Math.max(0, (Number(it.stokAwal) || 0) - (Number(it.stokAkhir) || 0))}
                            </td>
                          </>
                        ) : (
                          <td className="px-2 py-2">
                            <Input
                              className="h-8 w-full min-w-24 text-base text-right tabular-nums sm:text-sm"
                              type="number"
                              inputMode="decimal"
                              min={0}
                              step="any"
                              value={it.qty || ""}
                              onChange={(e) => updateItem(idx, { qty: e.target.value === "" ? 0 : Number(e.target.value) })}
                            />
                          </td>
                        )}
                        {tipe !== "Supplier" && (
                          <td className="px-2 py-2">
                            <Input
                              className="h-8 w-full min-w-28 text-base text-right tabular-nums sm:text-sm"
                              type="number"
                              inputMode="decimal"
                              min={0}
                              value={it.hargaJual || ""}
                              onChange={(e) => updateItem(idx, { hargaJual: Number(e.target.value) })}
                            />
                          </td>
                        )}
                        <td className="min-w-32 px-2 py-2 text-right font-semibold tabular-nums">
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
              <Button variant="outline" size="sm" onClick={addRow}>
                <Plus className="mr-1.5 size-3.5" />
                Tambah Barang
              </Button>
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
              {saving ? "Menyimpan..." : "Simpan Invoice"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Print dokumen invoice */}
      <PrintFrame
        open={!!printInv}
        onClose={() => setPrintInv(null)}
        title={`Invoice ${printInv?.idInvoice ?? ""}`}
      >
        {printInv && <InvoicePrintDoc invoice={printInv} />}
      </PrintFrame>
    </div>
  );
}

export function InvoicePrintDoc({ invoice }: { invoice: any }) {
  const mu: MataUang = invoice.mataUang === "$" ? "$" : "Rp";
  return (
    <div>
      <div className="mb-4 flex items-center justify-between text-sm">
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
          <p className="font-semibold">{invoice.statusPembayaran ?? "Pending"}</p>
        </div>
      </div>

      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-slate-100 text-left text-xs text-slate-600 uppercase">
            <th className="border border-slate-200 px-2 py-2">No</th>
            <th className="border border-slate-200 px-2 py-2">Kode</th>
            <th className="border border-slate-200 px-2 py-2">Nama Barang</th>
            <th className="border border-slate-200 px-2 py-2 text-right">Qty</th>
            <th className="border border-slate-200 px-2 py-2 text-right">Harga</th>
            <th className="border border-slate-200 px-2 py-2 text-right">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          {invoice.items.map((it: any, i: number) => {
            const qty =
              invoice.tipe === "Pasar"
                ? (Number(it.stokAwal) || 0) - (Number(it.stokAkhir) || 0)
                : it.qty;
            const harga = invoice.tipe === "Supplier" ? it.hargaModal : it.hargaJual;
            const stored = Number(it.subtotal) || 0;
            // Fallback kalau subtotal tidak tersimpan (data lama): hitung ulang
            const subtotal = stored > 0 ? stored : Math.max(0, (Number(qty) || 0) * (Number(harga) || 0));
            return (
              <tr key={i}>
                <td className="border border-slate-200 px-2 py-1.5">{i + 1}</td>
                <td className="border border-slate-200 px-2 py-1.5">{it.kodeBarang}</td>
                <td className="border border-slate-200 px-2 py-1.5">{it.namaBarang}</td>
                <td className="border border-slate-200 px-2 py-1.5 text-right">{qty}</td>
                <td className="border border-slate-200 px-2 py-1.5 text-right">{formatCurrency(harga, mu)}</td>
                <td className="border border-slate-200 px-2 py-1.5 text-right">{formatCurrency(subtotal, mu)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div className="mt-4 flex justify-end">
        <div className="w-64 space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-500">Total Modal</span>
            <span className="tabular-nums">{formatCurrency(invoice.totalModal, mu)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Total Penjualan</span>
            <span className="tabular-nums">{formatCurrency(invoice.totalPenjualan, mu)}</span>
          </div>
          {invoice.tipe !== "Supplier" && (
            <div className="flex justify-between">
              <span className="text-slate-500">Margin</span>
              <span className="font-semibold text-teal-700 tabular-nums">{formatCurrency(invoice.margin, mu)}</span>
            </div>
          )}
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
            <p className="text-xs text-slate-500">(Pimpinan PT Dapur Laut)</p>
          </div>
        </div>
      </div>
    </div>
  );
}
