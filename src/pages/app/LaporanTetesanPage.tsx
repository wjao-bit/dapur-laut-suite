import { useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { LineChart, Printer, Droplets, TrendingUp, TrendingDown, Boxes, Scale } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader, SectionCard, BadgeStatus } from "@/components/app/ui";
import { DataTable, type Column } from "@/components/app/DataTable";
import { PrintFrame } from "@/components/app/PrintFrame";
import { formatDate, formatNum } from "@/lib/format";
import { formatCurrency } from "@/lib/business";

export default function LaporanTetesanPage() {
  const bahanBaku = useQuery(api.queries.listBahanBaku);
  const barangJadi = useQuery(api.queries.listBarangJadi);

  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [kategori, setKategori] = useState("");
  const [namaItem, setNamaItem] = useState("");
  const [print, setPrint] = useState(false);

  const laporan = useQuery(api.queries.laporanTetesan, {
    from: from || undefined,
    to: to || undefined,
    kategori: kategori || undefined,
    namaItem: namaItem || undefined,
  });

  const kategoriOptions = useMemo(() => {
    const s = new Set<string>();
    for (const b of bahanBaku ?? []) if (b.kategori) s.add(b.kategori);
    for (const b of barangJadi ?? []) if (b.kategori) s.add(b.kategori);
    return [...s].sort();
  }, [bahanBaku, barangJadi]);

  const itemOptions = useMemo(() => {
    const s = new Set<string>();
    for (const b of bahanBaku ?? []) s.add(b.nama);
    for (const b of barangJadi ?? []) s.add(b.nama);
    return [...s].sort();
  }, [bahanBaku, barangJadi]);

  const itemColumns: Column<any>[] = [
    { key: "namaBarang", label: "Item", sortValue: (r) => r.namaBarang, render: (r) => <span className="font-semibold">{r.namaBarang}</span> },
    { key: "qtyModal", label: "Qty Beli (Modal)", align: "right", render: (r) => <span className="tabular-nums">{formatNum(r.qtyModal)}</span> },
    { key: "qtyJual", label: "Qty Terjual", align: "right", render: (r) => <span className="tabular-nums">{formatNum(r.qtyJual)}</span> },
    { key: "totalModal", label: "Total Modal", align: "right", render: (r) => <span className="tabular-nums text-sky-600">{formatCurrency(r.totalModal)}</span> },
    {
      key: "totalPenjualan",
      label: "Total Penjualan",
      align: "right",
      render: (r) => <span className="tabular-nums text-emerald-600">{formatCurrency(r.totalPenjualan)}</span>,
    },
    {
      key: "margin",
      label: "Margin",
      align: "right",
      sortValue: (r) => r.totalPenjualan - r.totalModal,
      render: (r) => {
        const m = r.totalPenjualan - r.totalModal;
        return (
          <span className={`font-semibold tabular-nums ${m < 0 ? "text-rose-600" : "text-emerald-600"}`}>
            {formatCurrency(m)}
          </span>
        );
      },
    },
  ];

  const stokColumns: Column<any>[] = [
    { key: "namaBarang", label: "Nama Barang", sortValue: (r) => r.namaBarang, render: (r) => <span className="font-semibold">{r.namaBarang}</span> },
    { key: "tipe", label: "Tipe", render: (r) => <BadgeStatus status={r.tipe} /> },
    { key: "kategori", label: "Kategori", render: (r) => r.kategori || "—" },
    { key: "stokAwal", label: "Stok Awal", align: "right", render: (r) => <span className="tabular-nums">{formatNum(r.stokAwal)}</span> },
    { key: "stokMasuk", label: "Masuk", align: "right", render: (r) => <span className="tabular-nums text-emerald-600">+{formatNum(r.stokMasuk)}</span> },
    { key: "stokKeluar", label: "Keluar", align: "right", render: (r) => <span className="tabular-nums text-rose-600">-{formatNum(r.stokKeluar)}</span> },
    {
      key: "stokAkhir",
      label: "Stok Akhir",
      align: "right",
      sortValue: (r) => r.stokAkhir,
      render: (r) => (
        <span className={`font-bold tabular-nums ${r.stokAkhir <= 0 ? "text-rose-600" : "text-emerald-600"}`}>{formatNum(r.stokAkhir)}</span>
      ),
    },
  ];

  const modalColumns: Column<any>[] = [
    { key: "idInvoice", label: "No. Invoice", render: (r) => <span className="font-semibold">{r.idInvoice}</span> },
    { key: "tanggal", label: "Tanggal", render: (r) => formatDate(r.tanggal) },
    { key: "namaPihak", label: "Pemasok", render: (r) => r.namaPihak },
    {
      key: "total",
      label: "Total Modal",
      align: "right",
      render: (r) => <span className="tabular-nums text-sky-600">{formatCurrency(r.total)}</span>,
    },
  ];

  const jualColumns: Column<any>[] = [
    { key: "idInvoice", label: "No. Invoice", render: (r) => <span className="font-semibold">{r.idInvoice}</span> },
    { key: "tanggal", label: "Tanggal", render: (r) => formatDate(r.tanggal) },
    { key: "namaPihak", label: "Toko / Pembeli", render: (r) => r.namaPihak },
    {
      key: "total",
      label: "Total Penjualan",
      align: "right",
      render: (r) => <span className="tabular-nums text-emerald-600">{formatCurrency(r.total)}</span>,
    },
  ];

  const loading = laporan === undefined;

  return (
    <div>
      <PageHeader
        title="Laporan Tetesan"
        description="Total modal (invoice modal), total penjualan (invoice penjualan), perbandingan modal vs penjualan, dan stok otomatis dari transaksi."
        icon={LineChart}
        actions={
          <Button variant="outline" onClick={() => setPrint(true)} disabled={loading}>
            <Printer className="mr-2 size-4" />
            Cetak Laporan (PDF)
          </Button>
        }
      />

      {/* Filter */}
      <div className="mb-4 grid gap-3 rounded-lg border bg-muted/30 p-3 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Label className="text-xs font-medium">Dari Tanggal</Label>
          <Input className="mt-1.5" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div>
          <Label className="text-xs font-medium">Sampai Tanggal</Label>
          <Input className="mt-1.5" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
        <div>
          <Label className="text-xs font-medium">Kategori</Label>
          <select
            className="mt-1.5 flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
            value={kategori}
            onChange={(e) => setKategori(e.target.value)}
          >
            <option value="">Semua kategori</option>
            {kategoriOptions.map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label className="text-xs font-medium">Nama Item</Label>
          <select
            className="mt-1.5 flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
            value={namaItem}
            onChange={(e) => setNamaItem(e.target.value)}
          >
            <option value="">Semua item</option>
            {itemOptions.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Statistik inti */}
      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <SectionCard title="Total Modal">
          <p className="text-2xl font-bold text-sky-600 tabular-nums">{loading ? "…" : formatCurrency(laporan?.totalModal ?? 0)}</p>
          <p className="text-xs text-muted-foreground">
            {laporan?.jumlahInvoiceModal ?? 0} invoice modal
          </p>
        </SectionCard>
        <SectionCard title="Total Penjualan">
          <p className="text-2xl font-bold text-emerald-600 tabular-nums">{loading ? "…" : formatCurrency(laporan?.totalPenjualan ?? 0)}</p>
          <p className="text-xs text-muted-foreground">
            {laporan?.jumlahInvoicePenjualan ?? 0} invoice penjualan
          </p>
        </SectionCard>
        <SectionCard title="Margin (Modal vs Jual)">
          <p className={`text-2xl font-bold tabular-nums ${(laporan?.margin ?? 0) < 0 ? "text-rose-600" : "text-primary"}`}>
            {loading ? "…" : formatCurrency(laporan?.margin ?? 0)}
          </p>
          <p className="text-xs text-muted-foreground">
            {loading ? "" : `${laporan?.marginPct ?? 0}% dari penjualan`}
          </p>
        </SectionCard>
        <SectionCard title="Perbandingan">
          <div className="flex h-9 items-end gap-1">
            <div
              className="rounded-t bg-sky-500 transition-all"
              style={{ height: "100%", width: "24px" }}
              title={`Modal: ${formatCurrency(laporan?.totalModal ?? 0)}`}
            />
            <div
              className="rounded-t bg-emerald-500 transition-all"
              style={{
                height: `${
                  loading
                    ? 0
                    : Math.max(6, Math.min(100, ((laporan?.totalPenjualan ?? 0) / Math.max(1, laporan?.totalModal ?? 1)) * 100))
                }%`,
                width: "24px",
              }}
              title={`Penjualan: ${formatCurrency(laporan?.totalPenjualan ?? 0)}`}
            />
          </div>
          <p className="text-[11px] text-muted-foreground">
            <span className="text-sky-600">■</span> Modal vs <span className="text-emerald-600">■</span> Penjualan
          </p>
        </SectionCard>
      </div>

      {/* Rekap per item */}
      <div className="mb-4">
        <h2 className="mb-3 flex items-center gap-2 text-base font-semibold">
          <Scale className="size-4 text-primary" />
          Rekap Modal vs Penjualan per Item
        </h2>
        <DataTable
          columns={itemColumns}
          rows={(laporan?.itemRekap ?? []) as any}
          loading={loading}
          keyField={(r) => r.namaBarang}
          emptyTitle="Belum ada data transaksi"
          emptyDescription="Buat invoice modal / penjualan di menu Invoice Tetesan."
        />
      </div>

      {/* Stok otomatis */}
      <div className="mb-4">
        <h2 className="mb-3 flex items-center gap-2 text-base font-semibold">
          <Boxes className="size-4 text-primary" />
          Stok Otomatis (dari Transaksi Modal & Penjualan)
        </h2>
        <DataTable
          columns={stokColumns}
          rows={(laporan?.stok ?? []) as any}
          loading={loading}
          keyField={(r) => r.namaBarang}
          emptyTitle="Belum ada baris stok"
          emptyDescription="Stok akan terisi otomatis dari invoice modal & penjualan."
        />
      </div>

      {/* Rincian invoice */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div>
          <h2 className="mb-3 flex items-center gap-2 text-base font-semibold">
            <TrendingDown className="size-4 text-sky-600" />
            Rincian Invoice Modal
          </h2>
          <DataTable
            columns={modalColumns}
            rows={(laporan?.rincianModal ?? []) as any}
            loading={loading}
            keyField={(r) => r.idInvoice}
            emptyTitle="Tidak ada invoice modal"
          />
        </div>
        <div>
          <h2 className="mb-3 flex items-center gap-2 text-base font-semibold">
            <TrendingUp className="size-4 text-emerald-600" />
            Rincian Invoice Penjualan
          </h2>
          <DataTable
            columns={jualColumns}
            rows={(laporan?.rincianPenjualan ?? []) as any}
            loading={loading}
            keyField={(r) => r.idInvoice}
            emptyTitle="Tidak ada invoice penjualan"
          />
        </div>
      </div>

      {/* Print */}
      <PrintFrame open={print} onClose={() => setPrint(false)} title={`Laporan Tetesan ${from || ""} s.d. ${to || ""}`}>
        {laporan && <TetesanLaporanDoc laporan={laporan} from={from} to={to} kategori={kategori} namaItem={namaItem} />}
      </PrintFrame>
    </div>
  );
}

function TetesanLaporanDoc({ laporan, from, to, kategori, namaItem }: any) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-center gap-2">
        <Droplets className="size-4 text-sky-700" />
        <p className="text-center text-base font-bold tracking-wide text-sky-800 uppercase">Laporan Tetesan — Dapur Laut</p>
      </div>
      <div className="mx-auto mb-4 h-0.5 w-40 bg-gradient-to-r from-sky-800 via-amber-500 to-sky-800" />
      <p className="mb-1 text-center text-xs text-slate-500">
        Periode: {from || "…awal"} s.d. {to || "sekarang"}
        {kategori ? ` · Kategori: ${kategori}` : ""}
        {namaItem ? ` · Item: ${namaItem}` : ""}
      </p>

      <div className="mb-5 grid grid-cols-4 gap-3 text-sm">
        <div className="rounded border border-sky-200 bg-sky-50 p-3">
          <p className="text-[10px] text-sky-700 uppercase">Total Modal</p>
          <p className="text-lg font-bold text-sky-800 tabular-nums">{formatCurrency(laporan.totalModal)}</p>
        </div>
        <div className="rounded border border-emerald-200 bg-emerald-50 p-3">
          <p className="text-[10px] text-emerald-700 uppercase">Total Penjualan</p>
          <p className="text-lg font-bold text-emerald-800 tabular-nums">{formatCurrency(laporan.totalPenjualan)}</p>
        </div>
        <div className="rounded border border-slate-200 bg-slate-50 p-3">
          <p className="text-[10px] text-slate-600 uppercase">Margin</p>
          <p className="text-lg font-bold text-slate-800 tabular-nums">{formatCurrency(laporan.margin)}</p>
        </div>
        <div className="rounded border border-amber-200 bg-amber-50 p-3">
          <p className="text-[10px] text-amber-700 uppercase">% Margin</p>
          <p className="text-lg font-bold text-amber-800 tabular-nums">{laporan.marginPct}%</p>
        </div>
      </div>

      <table className="w-full border-collapse text-xs">
        <thead>
          <tr className="bg-sky-50 text-left text-sky-900 uppercase">
            <th className="border border-slate-200 px-2 py-1.5">Item</th>
            <th className="border border-slate-200 px-2 py-1.5 text-right">Qty Beli</th>
            <th className="border border-slate-200 px-2 py-1.5 text-right">Qty Jual</th>
            <th className="border border-slate-200 px-2 py-1.5 text-right">Total Modal</th>
            <th className="border border-slate-200 px-2 py-1.5 text-right">Total Jual</th>
            <th className="border border-slate-200 px-2 py-1.5 text-right">Margin</th>
          </tr>
        </thead>
        <tbody>
          {laporan.itemRekap.length === 0 && (
            <tr>
              <td colSpan={6} className="border border-slate-200 px-2 py-3 text-center text-slate-400">
                Tidak ada transaksi pada periode ini.
              </td>
            </tr>
          )}
          {laporan.itemRekap.map((r: any) => {
            const m = r.totalPenjualan - r.totalModal;
            return (
              <tr key={r.namaBarang}>
                <td className="border border-slate-200 px-2 py-1">{r.namaBarang}</td>
                <td className="border border-slate-200 px-2 py-1 text-right">{formatNum(r.qtyModal)}</td>
                <td className="border border-slate-200 px-2 py-1 text-right">{formatNum(r.qtyJual)}</td>
                <td className="border border-slate-200 px-2 py-1 text-right tabular-nums">{formatCurrency(r.totalModal)}</td>
                <td className="border border-slate-200 px-2 py-1 text-right tabular-nums">{formatCurrency(r.totalPenjualan)}</td>
                <td className="border border-slate-200 px-2 py-1 text-right tabular-nums">{formatCurrency(m)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <h3 className="mt-6 mb-2 text-sm font-bold text-slate-800 uppercase">Stok Otomatis</h3>
      <table className="w-full border-collapse text-xs">
        <thead>
          <tr className="bg-slate-50 text-left text-slate-700 uppercase">
            <th className="border border-slate-200 px-2 py-1.5">Barang</th>
            <th className="border border-slate-200 px-2 py-1.5">Tipe</th>
            <th className="border border-slate-200 px-2 py-1.5">Kategori</th>
            <th className="border border-slate-200 px-2 py-1.5 text-right">Stok Awal</th>
            <th className="border border-slate-200 px-2 py-1.5 text-right">Masuk</th>
            <th className="border border-slate-200 px-2 py-1.5 text-right">Keluar</th>
            <th className="border border-slate-200 px-2 py-1.5 text-right">Stok Akhir</th>
          </tr>
        </thead>
        <tbody>
          {laporan.stok.length === 0 && (
            <tr>
              <td colSpan={7} className="border border-slate-200 px-2 py-3 text-center text-slate-400">
                Belum ada baris stok.
              </td>
            </tr>
          )}
          {laporan.stok.map((s: any) => (
            <tr key={s.namaBarang}>
              <td className="border border-slate-200 px-2 py-1">{s.namaBarang}</td>
              <td className="border border-slate-200 px-2 py-1">{s.tipe}</td>
              <td className="border border-slate-200 px-2 py-1">{s.kategori || "—"}</td>
              <td className="border border-slate-200 px-2 py-1 text-right">{formatNum(s.stokAwal)}</td>
              <td className="border border-slate-200 px-2 py-1 text-right text-emerald-700">+{formatNum(s.stokMasuk)}</td>
              <td className="border border-slate-200 px-2 py-1 text-right text-rose-700">-{formatNum(s.stokKeluar)}</td>
              <td className="border border-slate-200 px-2 py-1 text-right font-semibold">{formatNum(s.stokAkhir)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
