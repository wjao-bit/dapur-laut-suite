import { useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Package,
  Boxes,
  FileText,
  ArrowRight,
  Users,
  Sparkles,
} from "lucide-react";
import { StatCard, SectionCard, PageHeader, BadgeStatus } from "@/components/app/ui";
import { formatRupiah, formatDate } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useNavigate } from "react-router";

const tooltipStyle = {
  borderRadius: 10,
  border: "1px solid #e2e8f0",
  fontSize: 12,
  boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
};

export default function DashboardPage() {
  const stats = useQuery(api.queries.dashboardStats);
  const seedDemo = useMutation(api.seed.seedDemo);
  const navigate = useNavigate();

  useEffect(() => {
    if (stats && stats.jumlahBarang === 0) {
      seedDemo()
        .then((res) => {
          if (res.seeded) toast.success("Data contoh PT Dapur Laut berhasil dimuat");
        })
        .catch(() => undefined);
    }
  }, [stats, seedDemo]);

  const kasChart = (stats?.kas14Hari ?? []).map((d: any) => ({
    tanggal: formatDate(d.tanggal)?.split(" ").slice(0, 2).join(" "),
    Masuk: d.masuk,
    Keluar: d.keluar,
  }));

  const marginChart = (stats?.marginPerTipe ?? []).map((d: any) => ({
    tipe: d.tipe,
    Margin: d.margin,
  }));

  const stokChart = (stats?.stokTop ?? []).map((d: any) => ({
    barang: d.namaBarang.length > 14 ? d.namaBarang.slice(0, 14) + "…" : d.namaBarang,
    Stok: d.stokAkhir,
  }));

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Ringkasan kas, stok, penjualan, dan margin PT Dapur Laut."
        icon={Sparkles}
        actions={
          <Button onClick={() => navigate("/dashboard/invoice")}>
            <FileText className="mr-2 size-4" />
            Buat Invoice
          </Button>
        }
      />

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard
          label="Saldo Kas"
          value={formatRupiah(stats?.saldoKas)}
          icon={Wallet}
          tone="brand"
          loading={!stats}
          sub="Saldo berjalan kas"
        />
        <StatCard
          label="Pendapatan Bulan Ini"
          value={formatRupiah(stats?.pendapatanBulanIni)}
          icon={TrendingUp}
          tone="income"
          loading={!stats}
          sub="Invoice Reseller + DPL + Pasar"
        />
        <StatCard
          label="Pengeluaran Bulan Ini"
          value={formatRupiah(stats?.pengeluaranBulanIni)}
          icon={TrendingDown}
          tone="expense"
          loading={!stats}
          sub="Pembelian + Pengeluaran"
        />
        <StatCard
          label="Margin Bulan Ini"
          value={formatRupiah(stats?.marginBulanIni)}
          icon={Package}
          tone="stock"
          loading={!stats}
          sub="Selisih penjualan - modal"
        />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard label="Nilai Stok Gudang" value={formatRupiah(stats?.nilaiStok)} icon={Boxes} tone="stock" loading={!stats} />
        <StatCard label="Total Barang" value={`${stats?.jumlahBarang ?? "—"} item`} icon={Package} loading={!stats} />
        <StatCard label="Total Karyawan" value={`${stats?.jumlahKaryawan ?? "—"} orang`} icon={Users} loading={!stats} />
        <StatCard label="Total Invoice" value={`${stats?.jumlahInvoice ?? "—"} transaksi`} icon={FileText} loading={!stats} />
      </div>

      {/* Charts */}
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <SectionCard
          title="Kas Masuk vs Kas Keluar (14 hari)"
          description="Grafik pergerakan kas harian"
        >
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={kasChart} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
                <defs>
                  <linearGradient id="gMasuk" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0ea5e9" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#0ea5e9" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="gKeluar" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#f43f5e" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="tanggal" tick={{ fontSize: 10 }} tickLine={false} axisLine={{ stroke: "#e2e8f0" }} />
                <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={(v) => `${Math.round(v / 1000)}rb`} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v) => formatRupiah(Number(v))} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Area type="monotone" dataKey="Masuk" stroke="#0ea5e9" strokeWidth={2} fill="url(#gMasuk)" />
                <Area type="monotone" dataKey="Keluar" stroke="#f43f5e" strokeWidth={2} fill="url(#gKeluar)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        <SectionCard title="Margin per Saluran Penjualan" description="Reseller, DPL, dan Pasar">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={marginChart} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="tipe" tick={{ fontSize: 12 }} tickLine={false} axisLine={{ stroke: "#e2e8f0" }} />
                <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={(v) => `${Math.round(v / 1000)}rb`} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v) => formatRupiah(Number(v))} />
                <Bar dataKey="Margin" fill="#0d9488" radius={[6, 6, 0, 0]} maxBarSize={48} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <SectionCard title="Stok Gudang Teratas" description="5 barang dengan stok akhir terbesar">
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stokChart} layout="vertical" margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="barang" width={110} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v) => `${Number(v)} unit`} />
                <Bar dataKey="Stok" fill="#10b981" radius={[0, 6, 6, 0]} maxBarSize={18} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        <SectionCard
          title="Invoice Terbaru"
          description="Transaksi terakhir"
          className="lg:col-span-2"
          actions={
            <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard/invoice")}>
              Lihat semua <ArrowRight className="ml-1 size-3.5" />
            </Button>
          }
        >
          <div className="divide-y">
            {(stats?.invoiceTerbaru ?? []).length === 0 && (
              <p className="py-6 text-center text-sm text-muted-foreground">Belum ada invoice.</p>
            )}
            {stats?.invoiceTerbaru.map((inv: any) => (
              <div key={inv.idInvoice} className="flex items-center justify-between gap-3 py-2.5">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-foreground">{inv.idInvoice}</span>
                    <BadgeStatus status={inv.tipe} />
                  </div>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {inv.namaPihak} · {formatDate(inv.tanggal)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-emerald-600 tabular-nums">
                    {formatRupiah(inv.totalPenjualan || inv.total)}
                  </p>
                  {inv.tipe !== "Supplier" && (
                    <p className="text-[11px] text-muted-foreground tabular-nums">Margin {formatRupiah(inv.margin)}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
