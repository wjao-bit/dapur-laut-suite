import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
import { FileText, Plus, Trash2, Eye, CheckCircle2, CalendarClock, Wallet, Pencil, ScanLine, Copy, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
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
import { PaymentDialog } from "@/components/app/PaymentDialog";
import { OcrInvoiceDialog } from "@/components/app/OcrInvoiceDialog";
import { InvoiceFormDialog } from "@/components/app/InvoiceFormDialog";
import { InvoicePrintDoc } from "@/components/app/InvoicePrintDoc";
import { InvoiceTrashDialog } from "@/components/app/InvoiceTrashDialog";
import { formatDate } from "@/lib/format";
import { daysUntil, formatCurrency, INVOICE_TIPES, type MataUang } from "@/lib/business";
import { invoiceTotal, invoiceDibayar, invoiceSisa, buildInvoiceWaText } from "@/lib/invoice";

// Re-export agar import lama dari InvoicePage tetap berfungsi.
export { invoiceTotal, invoiceDibayar, invoiceSisa, buildInvoiceWaText } from "@/lib/invoice";
export { InvoicePrintDoc } from "@/components/app/InvoicePrintDoc";

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
  const deleteInvoice = useMutation(api.business.deleteInvoice);
  const setStatusInvoice = useMutation(api.business.setStatusInvoice);
  const bayarInvoice = useMutation(api.payment.bayarInvoice);
  const trash = useQuery(api.queries.listInvoiceTrash);

  const [searchParams, setSearchParams] = useSearchParams();

  const [open, setOpen] = useState(false);
  const [ocrOpen, setOcrOpen] = useState(false);
  const [trashOpen, setTrashOpen] = useState(false);
  const [filterTipe, setFilterTipe] = useState<string>("");
  const [filterPihak, setFilterPihak] = useState<string>("");
  const [printInv, setPrintInv] = useState<any>(null);
  /** Invoice yang sedang diedit (mode edit — isi form otomatis dari invoice). */
  const [editInv, setEditInv] = useState<any>(null);
  /** Invoice yang sedang diduplikat (mode duplikat — disalin, simpan sebagai baru). */
  const [dupInv, setDupInv] = useState<any>(null);
  /** Invoice yang sedang dibayar (dialog pembayaran). */
  const [payInv, setPayInv] = useState<any>(null);
  const [paySaving, setPaySaving] = useState(false);

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

  // Opsi pihak yang sudah punya invoice — DEDUP (nama yang sama di tipe berbeda
  // muncul sekali) supaya React tidak menampilkan peringatan key duplikat.
  const filterPihakOptions = useMemo(() => {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const p of pihakList ?? []) {
      if (filterTipe && p.tipe !== filterTipe) continue;
      const name = String(p.namaPihak ?? "").trim();
      if (name && !seen.has(name)) {
        seen.add(name);
        out.push(name);
      }
    }
    return out;
  }, [pihakList, filterTipe]);

  const filtered = useMemo(() => {
    if (!invoices) return invoices;
    return invoices.filter((i: any) => {
      if (filterTipe && i.tipe !== filterTipe) return false;
      if (filterPihak && i.namaPihak !== filterPihak) return false;
      return true;
    });
  }, [invoices, filterTipe, filterPihak]);

  const openCreate = useCallback(() => {
    setEditInv(null);
    setDupInv(null);
    setOpen(true);
  }, []);

  /** Buka dialog untuk mengedit invoice yang sudah jadi. */
  const openEdit = useCallback((r: any) => {
    setEditInv(r);
    setDupInv(null);
    setOpen(true);
  }, []);

  /** Buka dialog duplikat: isi form disalin dari invoice lama, simpan sebagai BARU. */
  const openDuplicate = useCallback((r: any) => {
    setEditInv(null);
    setDupInv(r);
    setOpen(true);
  }, []);

  /** Hapus invoice → PINDAH KE SAMPAH (kas & stok TIDAK diubah sampai dihapus permanen). */
  const handleDeleteInvoice = useCallback(
    async (id: string) => {
      try {
        await deleteInvoice({ idInvoice: id });
        toast.success("Invoice dipindah ke Sampah — bisa dipulihkan kapan saja.");
      } catch (e: any) {
        toast.error(e?.data?.message ?? e?.message ?? "Gagal menghapus invoice");
      }
    },
    [deleteInvoice],
  );

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

  // useMemo: kolom tidak dibuat ulang setiap render → tabel tidak perlu
  // mengurutkan/membuat ulang baris saat state lain (mis. dialog) berubah.
  const columns: Column<any>[] = useMemo(
    () => [
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
            <Button
              variant="ghost"
              size="icon"
              className="size-7 text-sky-600 hover:text-sky-700"
              title="Duplikat Invoice (salin jadi invoice baru)"
              onClick={() => openDuplicate(r)}
            >
              <Copy className="size-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-7 text-emerald-600 hover:text-emerald-700"
              title="Kirim WhatsApp"
              onClick={() => {
                const url = `https://wa.me/?text=${encodeURIComponent(buildInvoiceWaText(r))}`;
                window.open(url, "_blank", "noopener,noreferrer");
              }}
            >
              <MessageCircle className="size-3.5" />
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
                    Invoice dipindah ke <b>Sampah</b>. Kas &amp; riwayat stok TIDAK diubah sampai dihapus permanen — kamu bisa memulihkan invoice ini kapan saja dari tombol "Sampah".
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
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [setPayInv, setPrintInv, openEdit, openDuplicate, handleDeleteInvoice, setStatusInvoice],
  );

  return (
    <div>
      <PageHeader
        title="Invoice"
        description="Invoice multi-barang untuk Supplier, Reseller, DPL, dan Pasar. Harga otomatis ditarik dari Katalog Harga per pihak (Reseller/Supplier) saat nama pihak dipilih — katalog baru dibuat otomatis untuk pihak baru. Stok & kas diperbarui otomatis; aksi Bayar mencatat pembayaran; Cetak/PDF + Kirim WhatsApp; Duplikat membuat invoice baru dari yang lama. Scan foto invoice dengan OCR (atau AI) lalu verifikasi sebelum simpan."
        icon={FileText}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={() => setOcrOpen(true)}>
              <ScanLine className="mr-2 size-4" />
              Scan Invoice (OCR)
            </Button>
            <Button variant="outline" onClick={() => setTrashOpen(true)} title="Invoice yang dihapus — bisa dipulihkan">
              <Trash2 className="mr-2 size-4" />
              Sampah
              {(trash?.length ?? 0) > 0 && (
                <span className="ml-1.5 inline-flex size-5 items-center justify-center rounded-full bg-rose-600 text-[10px] font-bold text-white">
                  {trash!.length}
                </span>
              )}
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
              {filterPihakOptions.map((p: string, i: number) => (
                <SelectItem key={`${p}-${i}`} value={p}>
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

      {/* Form invoice — komponen terpisah supaya mengetik tidak me-render ulang daftar */}
      <InvoiceFormDialog
        open={open}
        onOpenChange={setOpen}
        editInv={editInv}
        duplicateInv={dupInv}
        nextInvoiceId={nextInvoiceId}
        barang={barang as any}
        katalogs={katalogs as any}
        suppliers={suppliers as any}
        resellers={resellers as any}
        dpls={dpls as any}
        pasars={pasars as any}
        onSaved={() => {
          setEditInv(null);
          setDupInv(null);
        }}
      />

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

      {/* Dialog Sampah (recycle bin) invoice — pulihkan / hapus permanen */}
      <InvoiceTrashDialog open={trashOpen} onOpenChange={setTrashOpen} />

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
