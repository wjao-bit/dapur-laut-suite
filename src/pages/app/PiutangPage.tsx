import { useCallback, useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
import {
  HandCoins,
  Wallet,
  Eye,
  MessageCircle,
  CalendarClock,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { PaymentDialog } from "@/components/app/PaymentDialog";
import { InvoicePrintDoc } from "@/components/app/InvoicePrintDoc";
import { formatDate } from "@/lib/format";
import { daysUntil, formatCurrency, INVOICE_TIPES, type MataUang } from "@/lib/business";
import { invoiceTotal, invoiceDibayar, invoiceSisa, buildInvoiceWaText } from "@/lib/invoice";

/** Badge sisa hari menuju jatuh tempo (merah = lewat, kuning = dekat). */
function DueBadge({ daysLeft }: { daysLeft: number }) {
  if (Number.isNaN(daysLeft)) return <span className="text-muted-foreground">—</span>;
  if (daysLeft < 0)
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 text-[11px] font-semibold text-rose-700">
        <AlertTriangle className="size-3" />
        Lewat {Math.abs(daysLeft)} hari
      </span>
    );
  if (daysLeft === 0)
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
        <CalendarClock className="size-3" />
        Jatuh tempo hari ini
      </span>
    );
  if (daysLeft <= 3)
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
        <CalendarClock className="size-3" />
        H-{daysLeft}
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
      <CheckCircle2 className="size-3" />
      H-{daysLeft}
    </span>
  );
}

/**
 * PIUTANG — tagihan penjualan (Reseller/DPL/Pasar) yang belum lunas.
 * Ringkasan: siapa yang belum bayar berapa, mana yang sudah lewat jatuh
 * tempo. Aksi: Terima Pembayaran (langsung), Lihat & Cetak, Kirim WhatsApp.
 */
export default function PiutangPage() {
  const piutang = useQuery(api.piutang.listPiutang, {});
  const bayarInvoice = useMutation(api.payment.bayarInvoice);

  const [filterTipe, setFilterTipe] = useState<string>("");
  const [payInv, setPayInv] = useState<any>(null);
  const [paySaving, setPaySaving] = useState(false);
  const [printInv, setPrintInv] = useState<any>(null);

  const rows = useMemo(() => {
    if (!piutang) return piutang;
    if (!filterTipe) return piutang;
    return (piutang as any[]).filter((r) => r.tipe === filterTipe);
  }, [piutang, filterTipe]);

  const summary = useMemo(() => {
    const list = piutang ?? [];
    return {
      total: (list as any[]).reduce((s, r) => s + (r.sisa ?? 0), 0),
      count: (list as any[]).length,
      overdue: (list as any[]).filter((r) => !Number.isNaN(r.daysLeft) && r.daysLeft < 0).length,
    };
  }, [piutang]);

  /** Simpan pembayaran → otomatis kurangi sisa tagihan invoice. */
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
        render: (r) =>
          r.tenggat ? (
            <div className="space-y-0.5">
              <p className="text-xs text-muted-foreground">{formatDate(r.tenggat)}</p>
              <DueBadge daysLeft={r.daysLeft} />
            </div>
          ) : (
            <span className="text-muted-foreground">—</span>
          ),
      },
      {
        key: "total",
        label: "Total",
        align: "right",
        sortValue: (r) => r.total,
        render: (r) => (
          <span className="font-medium tabular-nums">{formatCurrency(r.total, r.mataUang ?? "Rp")}</span>
        ),
      },
      {
        key: "dibayar",
        label: "Dibayar",
        align: "right",
        sortValue: (r) => r.dibayar,
        render: (r) => (
          <span className="text-emerald-600 tabular-nums">{formatCurrency(r.dibayar, r.mataUang ?? "Rp")}</span>
        ),
      },
      {
        key: "sisa",
        label: "Sisa",
        align: "right",
        sortValue: (r) => r.sisa,
        render: (r) => (
          <span className="font-bold text-rose-600 tabular-nums">{formatCurrency(r.sisa, r.mataUang ?? "Rp")}</span>
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
              title="Terima Pembayaran"
              onClick={() => setPayInv(r)}
            >
              <Wallet className="size-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-7"
              title="Lihat & Cetak"
              onClick={() => setPrintInv(r)}
            >
              <Eye className="size-3.5" />
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
          </div>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [setPayInv, setPrintInv],
  );

  return (
    <div>
      <PageHeader
        title="Piutang"
        description="Tagihan penjualan (Reseller, DPL, Pasar) yang belum lunas, diurutkan dari yang paling mendesak. Klik dompet untuk menerima pembayaran, atau kirim pengingat via WhatsApp."
        icon={HandCoins}
        actions={
          <Select
            value={filterTipe}
            onValueChange={(v) => setFilterTipe(v === "__all" ? "" : v)}
          >
            <SelectTrigger className="w-full cursor-pointer sm:w-44">
              <SelectValue placeholder="Semua tipe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all">Semua tipe</SelectItem>
              {INVOICE_TIPES.filter((t) => t !== "Supplier").map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      />

      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <SectionCard title="Total Piutang">
          <p className="text-2xl font-bold text-rose-600 tabular-nums">{formatCurrency(summary.total)}</p>
        </SectionCard>
        <SectionCard title="Invoice Belum Lunas">
          <p className="text-2xl font-bold tabular-nums">{summary.count}</p>
        </SectionCard>
        <SectionCard title="Lewat Jatuh Tempo">
          <p className={`text-2xl font-bold tabular-nums ${summary.overdue > 0 ? "text-amber-600" : "text-emerald-600"}`}>
            {summary.overdue}
          </p>
        </SectionCard>
      </div>

      <DataTable
        columns={columns}
        rows={rows as any}
        loading={piutang === undefined}
        keyField={(r) => r.idInvoice}
        emptyTitle="Tidak ada piutang 🎉"
        emptyDescription="Semua invoice penjualan sudah lunas."
      />

      {/* Dialog pembayaran piutang */}
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

      {/* Lihat / cetak invoice piutang */}
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
