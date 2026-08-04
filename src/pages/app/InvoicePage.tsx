import { useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
import { FileText, Plus, Trash2, Printer, Eye, CheckCircle2 } from "lucide-react";
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
import { PageHeader, SectionCard, BadgeStatus } from "@/components/app/ui";
import { DataTable, type Column } from "@/components/app/DataTable";
import { PrintFrame } from "@/components/app/PrintFrame";
import { formatRupiah, formatDate, todayStr, genId } from "@/lib/format";
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

function emptyItem(): InvoiceItem {
  return { kodeBarang: "", namaBarang: "", hargaModal: 0, qty: 1, hargaJual: 0, subtotal: 0 };
}

export default function InvoicePage() {
  const invoices = useQuery(api.queries.listInvoice, {});
  const barang = useQuery(api.queries.listBarang);
  const suppliers = useQuery(api.queries.listSupplier);
  const resellers = useQuery(api.queries.listReseller);
  const dpls = useQuery(api.queries.listDpl);
  const pasars = useQuery(api.queries.listPasar);
  const createInvoice = useMutation(api.business.createInvoice);
  const deleteInvoice = useMutation(api.business.deleteInvoice);

  const [open, setOpen] = useState(false);
  const [tipe, setTipe] = useState<InvoiceTipe>("Reseller");
  const [tanggal, setTanggal] = useState(todayStr());
  const [idInvoice, setIdInvoice] = useState(() => genId("INV"));
  const [namaPihak, setNamaPihak] = useState("");
  const [items, setItems] = useState<InvoiceItem[]>([emptyItem()]);
  const [saving, setSaving] = useState(false);
  const [filterTipe, setFilterTipe] = useState<string>("");
  const [printInv, setPrintInv] = useState<any>(null);

  const pihakOptions = useMemo(() => {
    if (tipe === "Supplier") return suppliers?.map((s: any) => s.nama) ?? [];
    if (tipe === "Reseller") return resellers?.map((s: any) => s.nama) ?? [];
    if (tipe === "DPL") return dpls?.map((s: any) => s.namaPasar) ?? [];
    return pasars?.map((s: any) => s.namaPasar) ?? [];
  }, [tipe, suppliers, resellers, dpls, pasars]);

  const totals = useMemo(() => computeInvoiceTotals(tipe, items), [tipe, items]);

  const filtered = useMemo(() => {
    if (!invoices) return invoices;
    if (!filterTipe) return invoices;
    return invoices.filter((i: any) => i.tipe === filterTipe);
  }, [invoices, filterTipe]);

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

  const resetForm = () => {
    setTipe("Reseller");
    setTanggal(todayStr());
    setIdInvoice(genId("INV"));
    setNamaPihak("");
    setItems([emptyItem()]);
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const cleanItems = items.map((it) => ({
        ...it,
        qty: Number(it.qty) || 0,
        hargaModal: Number(it.hargaModal) || 0,
        hargaJual: Number(it.hargaJual) || 0,
        stokAwal: tipe === "Pasar" ? Number(it.stokAwal) || 0 : undefined,
        stokAkhir: tipe === "Pasar" ? Number(it.stokAkhir) || 0 : undefined,
      }));
      const res = await createInvoice({
        doc: {
          idInvoice,
          tanggal,
          tipe,
          namaPihak,
          items: cleanItems,
        },
      });
      toast.success(`Invoice ${res.idInvoice} tersimpan — ${formatRupiah(res.totalPenjualan || res.total)}`);
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
      key: "total",
      label: "Total",
      align: "right",
      sortValue: (r) => r.totalPenjualan || r.total,
      render: (r) => (
        <span className="font-medium text-emerald-600 tabular-nums">{formatRupiah(r.totalPenjualan || r.total)}</span>
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
            {formatRupiah(r.margin)}
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
        description="Invoice multi-barang untuk Supplier, Reseller, DPL, dan Pasar. Stok & kas diperbarui otomatis."
        icon={FileText}
        actions={
          <Button onClick={() => setOpen(true)}>
            <Plus className="mr-2 size-4" />
            Buat Invoice
          </Button>
        }
      />

      <div className="mb-4 w-48">
        <Select value={filterTipe} onValueChange={setFilterTipe}>
          <SelectTrigger>
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
              <Select
                value={tipe}
                onValueChange={(v) => {
                  setTipe(v as InvoiceTipe);
                  setNamaPihak("");
                  setItems([emptyItem()]);
                }}
              >
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
            </div>
            <div>
              <Label className="text-xs font-medium">Tanggal *</Label>
              <Input className="mt-1.5" type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} />
            </div>
          </div>

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

          {/* Multi-item table */}
          <div className="rounded-lg border">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40 text-left text-[11px] tracking-wide text-muted-foreground uppercase">
                    <th className="px-2 py-2 font-semibold">Barang</th>
                    <th className="px-2 py-2 text-right font-semibold">Harga Modal</th>
                    {tipe === "Pasar" ? (
                      <>
                        <th className="px-2 py-2 text-right font-semibold">Stok Awal</th>
                        <th className="px-2 py-2 text-right font-semibold">Stok Akhir</th>
                        <th className="px-2 py-2 text-right font-semibold">Terjual</th>
                      </>
                    ) : (
                      <th className="px-2 py-2 text-right font-semibold">Qty</th>
                    )}
                    {tipe !== "Supplier" && <th className="px-2 py-2 text-right font-semibold">Harga Jual</th>}
                    <th className="px-2 py-2 text-right font-semibold">Subtotal</th>
                    <th className="w-8 px-1 py-2" />
                  </tr>
                </thead>
                <tbody>
                  {items.map((it, idx) => {
                    const subtotal =
                      tipe === "Pasar"
                        ? ((Number(it.stokAwal) || 0) - (Number(it.stokAkhir) || 0)) * (Number(it.hargaJual) || 0)
                        : tipe === "Supplier"
                          ? (Number(it.qty) || 0) * (Number(it.hargaModal) || 0)
                          : (Number(it.qty) || 0) * (Number(it.hargaJual) || 0);
                    return (
                      <tr key={idx} className="border-b last:border-0">
                        <td className="px-2 py-2">
                          <div className="flex gap-1.5">
                            <Input
                              className="h-8 w-28"
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
                            <Input
                              className="h-8 flex-1 min-w-28"
                              placeholder="Nama barang"
                              value={it.namaBarang}
                              onChange={(e) => updateItem(idx, { namaBarang: e.target.value })}
                            />
                          </div>
                        </td>
                        <td className="px-2 py-2">
                          <Input
                            className="h-8 text-right tabular-nums"
                            type="number"
                            min={0}
                            value={it.hargaModal || ""}
                            onChange={(e) => updateItem(idx, { hargaModal: Number(e.target.value) })}
                          />
                        </td>
                        {tipe === "Pasar" ? (
                          <>
                            <td className="px-2 py-2">
                              <Input
                                className="h-8 w-20 text-right tabular-nums"
                                type="number"
                                min={1}
                                value={it.stokAwal || ""}
                                onChange={(e) => updateItem(idx, { stokAwal: Number(e.target.value), qty: Number(e.target.value) })}
                              />
                            </td>
                            <td className="px-2 py-2">
                              <Input
                                className="h-8 w-20 text-right tabular-nums"
                                type="number"
                                min={0}
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
                              className="h-8 w-20 text-right tabular-nums"
                              type="number"
                              min={1}
                              value={it.qty || ""}
                              onChange={(e) => updateItem(idx, { qty: Number(e.target.value) })}
                            />
                          </td>
                        )}
                        {tipe !== "Supplier" && (
                          <td className="px-2 py-2">
                            <Input
                              className="h-8 w-28 text-right tabular-nums"
                              type="number"
                              min={0}
                              value={it.hargaJual || ""}
                              onChange={(e) => updateItem(idx, { hargaJual: Number(e.target.value) })}
                            />
                          </td>
                        )}
                        <td className="px-2 py-2 text-right font-semibold tabular-nums">{formatRupiah(subtotal)}</td>
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
            <div className="flex items-center justify-between border-t bg-muted/20 px-3 py-2">
              <Button variant="outline" size="sm" onClick={addRow}>
                <Plus className="mr-1.5 size-3.5" />
                Tambah Barang
              </Button>
              <div className="text-right text-xs">
                <div className="text-muted-foreground">
                  Total Modal: <span className="font-semibold text-foreground tabular-nums">{formatRupiah(totals.totalModal)}</span>
                </div>
                {tipe !== "Supplier" && (
                  <div className="text-muted-foreground">
                    Total Penjualan:{" "}
                    <span className="font-semibold text-emerald-600 tabular-nums">{formatRupiah(totals.totalPenjualan)}</span>
                  </div>
                )}
                {tipe !== "Supplier" && (
                  <div className="text-muted-foreground">
                    Margin:{" "}
                    <span className={totals.margin >= 0 ? "font-semibold text-sky-600 tabular-nums" : "font-semibold text-rose-600 tabular-nums"}>
                      {formatRupiah(totals.margin)}
                    </span>
                  </div>
                )}
                <div className="mt-0.5 text-sm">
                  Total: <span className="font-bold text-foreground tabular-nums">{formatRupiah(totals.total)}</span>
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

      <div className="mb-4 flex items-center justify-between rounded-md bg-slate-50 px-4 py-3 text-sm">
        <div>
          <p className="text-xs text-slate-500">Tipe Transaksi</p>
          <p className="font-semibold">{invoice.tipe}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-500">Pihak</p>
          <p className="font-semibold">{invoice.namaPihak}</p>
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
                ? (it.stokAwal ?? 0) - (it.stokAkhir ?? 0)
                : invoice.tipe === "Supplier"
                  ? it.qty
                  : it.qty;
            const harga = invoice.tipe === "Supplier" ? it.hargaModal : it.hargaJual;
            return (
              <tr key={i}>
                <td className="border border-slate-200 px-2 py-1.5">{i + 1}</td>
                <td className="border border-slate-200 px-2 py-1.5">{it.kodeBarang}</td>
                <td className="border border-slate-200 px-2 py-1.5">{it.namaBarang}</td>
                <td className="border border-slate-200 px-2 py-1.5 text-right">{qty}</td>
                <td className="border border-slate-200 px-2 py-1.5 text-right">{formatRupiah(harga)}</td>
                <td className="border border-slate-200 px-2 py-1.5 text-right">{formatRupiah(it.subtotal)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div className="mt-4 flex justify-end">
        <div className="w-64 space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-500">Total Modal</span>
            <span className="tabular-nums">{formatRupiah(invoice.totalModal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Total Penjualan</span>
            <span className="tabular-nums">{formatRupiah(invoice.totalPenjualan)}</span>
          </div>
          {invoice.tipe !== "Supplier" && (
            <div className="flex justify-between">
              <span className="text-slate-500">Margin</span>
              <span className="font-semibold text-teal-700 tabular-nums">{formatRupiah(invoice.margin)}</span>
            </div>
          )}
          <div className="flex justify-between border-t border-slate-300 pt-1 text-base font-bold">
            <span>Total</span>
            <span className="tabular-nums">{formatRupiah(invoice.tipe === "Supplier" ? invoice.total : invoice.totalPenjualan)}</span>
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
