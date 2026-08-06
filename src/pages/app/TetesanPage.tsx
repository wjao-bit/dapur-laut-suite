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
import { formatDate, todayStr } from "@/lib/format";
import { formatCurrency, type MataUang, type TetesanTipe } from "@/lib/business";

const TIPE_LABEL: Record<string, string> = {
  Modal: "Beli bahan baku (harga modal)",
  Penjualan: "Jual barang jadi (harga jual)",
};

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

  const [tab, setTab] = useState<TetesanTipe>("Penjualan");
  const [open, setOpen] = useState(false);
  const [tanggal, setTanggal] = useState(todayStr());
  const [idInvoice, setIdInvoice] = useState("TET001");
  const [namaPihak, setNamaPihak] = useState("");
  const [rows, setRows] = useState<Row[]>([emptyRow()]);
  const [saving, setSaving] = useState(false);
  const [printInv, setPrintInv] = useState<any>(null);

  const stokMap = useMemo(() => {
    const m = new Map<string, number>();
    for (const s of stokRows ?? []) m.set(s.namaBarang, s.stokAkhir);
    return m;
  }, [stokRows]);

  const master = tab === "Modal" ? bahanBaku : barangJadi;
  const masterKey = tab === "Modal" ? "hargaModal" : "hargaJual";

  const total = useMemo(
    () => rows.reduce((s, r) => s + (Number(r.harga) || 0) * Math.max(0, Number(r.qty) || 0), 0),
    [rows],
  );

  const openCreate = (tipe: TetesanTipe) => {
    setTab(tipe);
    setTanggal(todayStr());
    setIdInvoice(nextInvoiceId(invoices));
    setNamaPihak("");
    setRows([emptyRow()]);
    setOpen(true);
  };

  const selectBarang = (idx: number, b: any) => {
    setRows((prev) =>
      prev.map((r, i) =>
        i === idx
          ? { ...r, kodeBarang: b.kode, namaBarang: b.nama, harga: Number(b[masterKey]) || 0 }
          : r,
      ),
    );
  };

  const updateRow = (idx: number, patch: Partial<Row>) => {
    setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  };

  const addRow = () => setRows((prev) => [...prev, emptyRow()]);
  const removeRow = (idx: number) => setRows((prev) => (prev.length === 1 ? prev : prev.filter((_, i) => i !== idx)));

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const items = rows.map((r) => ({
        kodeBarang: r.kodeBarang,
        namaBarang: r.namaBarang,
        harga: Number(r.harga) || 0,
        qty: Number(r.qty) || 0,
        subtotal: (Number(r.harga) || 0) * (Number(r.qty) || 0),
      }));
      const res = await createInvoice({ doc: { idInvoice, tanggal, tipe: tab, namaPihak, mataUang: "Rp", items } });
      toast.success(
        tab === "Modal"
          ? `Invoice Modal ${res.idInvoice} tersimpan — ${formatCurrency(res.total)}`
          : `Invoice Penjualan ${res.idInvoice} tersimpan — ${formatCurrency(res.total)}`,
      );
      setOpen(false);
    } catch (e: any) {
      const msg = e?.data?.message ?? e?.message ?? "Terjadi kesalahan";
      toast.error(msg);
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
      key: "aksi",
      label: "",
      align: "right",
      render: (r) => (
        <div className="flex items-center justify-end gap-1">
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
        description="Invoice Modal (bahan baku, harga modal) & Invoice Penjualan (barang jadi, harga jual). Harga modal hanya tersimpan di database, tidak tampil di invoice penjualan."
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
              {TIPE_LABEL[tab]}. Stok & kas diperbarui otomatis.
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
                    const subtotal = (Number(r.harga) || 0) * Math.max(0, Number(r.qty) || 0);
                    const stokTersedia = tab === "Penjualan" ? stokMap.get(r.namaBarang) ?? 0 : null;
                    return (
                      <tr key={idx} className="border-b last:border-0">
                        <td className="px-2 py-2">
                          <BarangSearch
                            barang={(master ?? []) as any}
                            value={r.namaBarang}
                            onChange={(v) => updateRow(idx, { namaBarang: v })}
                            onPick={(b) => selectBarang(idx, b)}
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
                            value={r.harga || ""}
                            onChange={(e) => updateRow(idx, { harga: Number(e.target.value) })}
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
                            onChange={(e) => updateRow(idx, { qty: e.target.value === "" ? 0 : Number(e.target.value) })}
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
  return (
    <div>
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
  );
}
