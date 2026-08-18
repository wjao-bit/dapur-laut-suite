import { useEffect, useState } from "react";
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
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Info,
  ShieldCheck,
  Clock,
  ArrowDownRight,
  ArrowUpRight,
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

type DebugIssue = {
  level: "error" | "warning" | "ok";
  category: string;
  msg: string;
};

const LEVEL_ICON: Record<string, typeof CheckCircle2> = {
  error: XCircle,
  warning: AlertTriangle,
  ok: CheckCircle2,
};

const LEVEL_COLOR: Record<string, string> = {
  error: "text-rose-600 bg-rose-50",
  warning: "text-amber-600 bg-amber-50",
  ok: "text-emerald-600 bg-emerald-50",
};

export default function DashboardPage() {
  const stats = useQuery(api.queries.dashboardStats);
  const liveData = useQuery(api.dashboard.liveStats);
  const seedDemo = useMutation(api.seed.seedDemo);
  const navigate = useNavigate();

  const [debugIssues, setDebugIssues] = useState<DebugIssue[] | null>(null);
  const [debugSummary, setDebugSummary] = useState<{ errors: number; warnings: number; oks: number } | null>(null);
  const [debugRunning, setDebugRunning] = useState(false);

  useEffect(() => {
    if (stats && stats.jumlahBarang === 0) {
      seedDemo()
        .then((res) => {
          if (res.seeded) toast.success("Data contoh Dapur Laut berhasil dimuat");
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

  // Live 7-day trend chart
  const liveTrend = (liveData?.trend7Hari ?? []).map((d: any) => ({
    label: d.label,
    Penjualan: d.penjualan,
    Pembelian: d.pembelian,
    Margin: d.margin,
  }));

  const runBugCheck = async () => {
    setDebugRunning(true);
    try {
      const res = await (api as any).dashboard.debugCheck();
      setDebugIssues(res.issues);
      setDebugSummary(res.summary);
    } catch {
      toast.error("Gagal menjalankan Bug Checker");
    } finally {
      setDebugRunning(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Ringkasan kas, stok, penjualan, dan margin Dapur Laut."
        icon={Sparkles}
        actions={
          <div className="flex gap-2">
            <Button onClick={runBugCheck} variant="outline" disabled={debugRunning}>
              <ShieldCheck className="mr-2 size-4" />
              {debugRunning ? "Memeriksa..." : "Bug Checker"}
            </Button>
            <Button onClick={() => navigate("/dashboard/invoice")}>
              <FileText className="mr-2 size-4" />
              Buat Invoice
            </Button>
          </div>
        }
      />

      {/* Live Today Stats */}
      {liveData && (
        <div className="mb-4 rounded-lg border bg-gradient-to-r from-teal-50 to-cyan-50 p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="size-2 animate-pulse rounded-full bg-emerald-500" />
            <h3 className="text-sm font-semibold text-teal-800">Live Hari Ini — {liveData.today.tanggal}</h3>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="text-center">
              <p className="text-lg font-bold text-foreground tabular-nums">{liveData.today.jumlahInvoice}</p>
              <p className="text-[11px] text-muted-foreground">Invoice</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-emerald-600 tabular-nums">{formatRupiah(liveData.today.kasMasuk)}</p>
              <p className="text-[11px] text-muted-foreground flex items-center justify-center gap-1"><ArrowUpRight className="size-3" /> Kas Masuk</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-rose-600 tabular-nums">{formatRupiah(liveData.today.kasKeluar)}</p>
              <p className="text-[11px] text-muted-foreground flex items-center justify-center gap-1"><ArrowDownRight className="size-3" /> Kas Keluar</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-teal-700 tabular-nums">{formatRupiah(liveData.today.totalPenjualan)}</p>
              <p className="text-[11px] text-muted-foreground">Total Penjualan</p>
            </div>
          </div>
        </div>
      )}

      {/* Alerts */}
      {liveData && liveData.alerts.length > 0 && (
        <div className="mb-4 space-y-2">
          {liveData.alerts.map((a: any, i: number) => (
            <div
              key={i}
              className={`flex items-start gap-2 rounded-lg border px-3 py-2 text-sm ${
                a.type === "danger"
                  ? "border-rose-200 bg-rose-50 text-rose-800"
                  : a.type === "warning"
                    ? "border-amber-200 bg-amber-50 text-amber-800"
                    : "border-sky-200 bg-sky-50 text-sky-800"
              }`}
            >
              {a.type === "danger" ? <XCircle className="mt-0.5 size-4 shrink-0" /> : a.type === "warning" ? <AlertTriangle className="mt-0.5 size-4 shrink-0" /> : <Info className="mt-0.5 size-4 shrink-0" />}
              <span>{a.msg}</span>
            </div>
          ))}
        </div>
      )}

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

      {/* Summary quick badges */}
      {liveData && (
        <div className="mt-3 flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 border border-amber-200">
            <Clock className="size-3" /> {liveData.summary.jumlahPending} Pending
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="size-3" /> {liveData.summary.jumlahLunas} Lunas
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2.5 py-1 text-xs font-medium text-sky-700 border border-sky-200">
            <Wallet className="size-3" /> Piutang {formatRupiah(liveData.summary.totalPiutang)}
          </span>
          {liveData.summary.stokMenipis > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-1 text-xs font-medium text-rose-700 border border-rose-200">
              <AlertTriangle className="size-3" /> {liveData.summary.stokMenipis} Stok Menipis
            </span>
          )}
        </div>
      )}

      {/* Charts */}
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {/* Live 7-day trend */}
        <SectionCard
          title="Tren 7 Hari (Live)"
          description="Penjualan vs Pembelian"
        >
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={liveTrend} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 10 }} tickLine={false} axisLine={{ stroke: "#e2e8f0" }} />
                <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={(v) => `${Math.round(v / 1000)}rb`} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v) => formatRupiah(Number(v))} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="Penjualan" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Pembelian" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

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

      {/* Live Top Barang Terlaris */}
      {liveData && liveData.topBarang.length > 0 && (
        <div className="mt-4">
          <SectionCard title="Top 5 Barang Terlaris (7 hari)" description="Berdasarkan total penjualan">
            <div className="divide-y">
              {liveData.topBarang.map((b: any, i: number) => (
                <div key={b.nama} className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-3">
                    <span className="flex size-7 items-center justify-center rounded-full bg-teal-100 text-xs font-bold text-teal-700">
                      {i + 1}
                    </span>
                    <div>
                      <p className="text-sm font-medium">{b.nama}</p>
                      <p className="text-[11px] text-muted-foreground">{b.qty} unit terjual</p>
                    </div>
                  </div>
                  <p className="text-sm font-semibold text-emerald-600 tabular-nums">{formatRupiah(b.total)}</p>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      )}

      {/* Bug Checker Panel */}
      {debugIssues && debugSummary && (
        <div className="mt-6">
          <SectionCard
            title="Bug Checker — Hasil Pemeriksaan"
            description={`${debugSummary.errors} error · ${debugSummary.warnings} warning · ${debugSummary.oks} ok`}
            actions={
              <Button variant="outline" size="sm" onClick={runBugCheck} disabled={debugRunning}>
                <ShieldCheck className="mr-1.5 size-3.5" />
                Periksa Ulang
              </Button>
            }
          >
            <div className="space-y-1.5">
              {debugIssues.map((issue, i) => {
                const Icon = LEVEL_ICON[issue.level];
                return (
                  <div
                    key={i}
                    className={`flex items-start gap-2 rounded-md px-3 py-2 text-sm ${LEVEL_COLOR[issue.level]}`}
                  >
                    <Icon className="mt-0.5 size-4 shrink-0" />
                    <div className="min-w-0">
                      <span className="font-medium">{issue.category}</span>
                      <span className="mx-1.5 text-xs opacity-60">·</span>
                      <span>{issue.msg}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </SectionCard>
        </div>
      )}
    </div>
  );
}
