import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import {
  Activity,
  Users,
  UserCheck,
  Wallet,
  Boxes,
  FileText,
  LogIn,
  ShieldAlert,
  Crown,
  Smartphone,
  Database,
  Package,
  Truck,
  Store,
  Warehouse,
  Building2,
  ReceiptText,
  BookOpenText,
} from "lucide-react";
import { PageHeader, SectionCard } from "@/components/app/ui";
import { DataTable, type Column } from "@/components/app/DataTable";
import { formatRupiah } from "@/lib/format";

type Aktivitas = {
  id: string;
  phone: string;
  nama: string;
  aksi: string;
  detail: string;
  createdAt: number;
};

type SesiAktif = {
  id?: string;
  phone: string;
  nama: string;
  role: string;
  status: string;
  createdAt: number;
};

function formatWaktu(ts: number): string {
  if (!ts) return "-";
  return new Date(ts).toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const AKSI_STYLE: Record<string, string> = {
  Login: "bg-emerald-100 text-emerald-700",
  Logout: "bg-slate-200 text-slate-700",
  "Daftar Akun Baru": "bg-sky-100 text-sky-700",
  "Daftar (Admin Master)": "bg-amber-100 text-amber-700",
  "Setujui Akun": "bg-emerald-100 text-emerald-700",
  "Tolak Akun": "bg-rose-100 text-rose-700",
  "Kick Akun": "bg-rose-100 text-rose-700",
  "Ganti Password": "bg-violet-100 text-violet-700",
};

export default function MonitorPage() {
  const { token, session } = useAuth();
  const isMaster = session?.role === "Admin Master";

  // Query hanya untuk Admin Master — user biasa TIDAK memanggil fungsi ini
  // (backend menolak dengan "Hanya Admin Master...", dan query error itu
  // membuat preview halaman ini crash).
  const ringkasan = useQuery(api.monitor.getRingkasan, token && isMaster ? { token } : "skip") as
    | {
        akun: { total: number; pending: number; approved: number; rejected: number; master: number };
        sesiAktif: number;
        dataMaster: { barang: number; supplier: number; reseller: number; dpl: number; pasar: number; karyawan: number; gudang: number };
        transaksi: { invoice: number; invoiceTetesan: number; pengeluaran: number; absensi: number; katalog: number };
        kasTerakhir: number | null;
      }
    | undefined;

  const aktivitas = useQuery(api.monitor.listAktivitas, token && isMaster ? { token, limit: 50 } : "skip") as
    | Aktivitas[]
    | undefined;

  const sesiAktif = useQuery(api.monitor.listSesiAktif, token && isMaster ? { token } : "skip") as
    | SesiAktif[]
    | undefined;

  if (!isMaster) {
    return (
      <div>
        <PageHeader
          title="Monitoring"
          description="Pantau aktivitas login, sesi aktif, dan data master aplikasi."
          icon={Activity}
        />
        <div className="flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50/70 p-5 sm:flex-row sm:items-center">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-amber-100">
            <ShieldAlert className="size-5 text-amber-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-amber-900">Akses terbatas — hanya Admin Master</p>
            <p className="mt-1 text-xs leading-relaxed text-amber-800">
              Halaman Monitoring hanya bisa dibuka oleh <b>Admin Master</b>. Anda login sebagai <b>Admin</b> —
              hubungi pemilik sistem jika perlu akses ini.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const r = ringkasan;
  const loading = ringkasan === undefined;

  const masterCards = [
    { icon: Users, label: "Total Akun", value: r ? String(r.akun.total) : "–", accent: "text-teal-600" },
    { icon: UserCheck, label: "Menunggu Persetujuan", value: r ? String(r.akun.pending) : "–", accent: "text-amber-600" },
    { icon: Smartphone, label: "Sesi Aktif", value: r ? String(r.sesiAktif) : "–", accent: "text-emerald-600" },
    { icon: Wallet, label: "Saldo Kas Terakhir", value: r ? formatRupiah(r.kasTerakhir ?? 0) : "–", accent: "text-sky-600" },
  ];

  const dataMasterItems = [
    { icon: Package, label: "Barang", value: r?.dataMaster.barang },
    { icon: Truck, label: "Supplier", value: r?.dataMaster.supplier },
    { icon: Store, label: "Reseller", value: r?.dataMaster.reseller },
    { icon: Warehouse, label: "DPL", value: r?.dataMaster.dpl },
    { icon: Building2, label: "Pasar", value: r?.dataMaster.pasar },
    { icon: Users, label: "Karyawan", value: r?.dataMaster.karyawan },
    { icon: Boxes, label: "Gudang & Stok", value: r?.dataMaster.gudang },
    { icon: FileText, label: "Invoice", value: r?.transaksi.invoice },
    { icon: ReceiptText, label: "Pengeluaran", value: r?.transaksi.pengeluaran },
    { icon: BookOpenText, label: "Katalog Harga", value: r?.transaksi.katalog },
  ];

  const aktivitasColumns: Column<Aktivitas>[] = [
    {
      key: "createdAt",
      label: "Waktu",
      sortValue: (a) => a.createdAt,
      render: (a) => <span className="whitespace-nowrap text-xs tabular-nums">{formatWaktu(a.createdAt)}</span>,
    },
    { key: "nama", label: "Nama", sortValue: (a) => a.nama, render: (a) => <span className="font-medium">{a.nama}</span> },
    { key: "phone", label: "Nomor HP", sortValue: (a) => a.phone, render: (a) => <span className="tabular-nums">{a.phone}</span> },
    {
      key: "aksi",
      label: "Aksi",
      render: (a) => (
        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${AKSI_STYLE[a.aksi] ?? "bg-slate-100 text-slate-700"}`}>
          {a.aksi}
        </span>
      ),
    },
    { key: "detail", label: "Keterangan", render: (a) => <span className="text-xs text-muted-foreground">{a.detail || "–"}</span> },
  ];

  const sesiColumns: Column<SesiAktif>[] = [
    { key: "phone", label: "Nomor HP", sortValue: (s) => s.phone, render: (s) => <span className="font-semibold tabular-nums">{s.phone}</span> },
    { key: "nama", label: "Nama", sortValue: (s) => s.nama, render: (s) => s.nama },
    {
      key: "role",
      label: "Role",
      render: (s) =>
        s.role === "Admin Master" ? (
          <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
            <Crown className="size-3" />
            Admin Master
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
            Admin
          </span>
        ),
    },
    {
      key: "status",
      label: "Status",
      render: (s) => (
        <span
          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${
            s.status === "approved" ? "bg-emerald-100 text-emerald-700" : s.status === "pending" ? "bg-amber-100 text-amber-700" : "bg-rose-100 text-rose-700"
          }`}
        >
          {s.status === "approved" ? "Disetujui" : s.status === "pending" ? "Menunggu" : "Ditolak"}
        </span>
      ),
    },
    {
      key: "createdAt",
      label: "Masuk Sejak",
      sortValue: (s) => s.createdAt,
      render: (s) => <span className="whitespace-nowrap text-xs tabular-nums">{formatWaktu(s.createdAt)}</span>,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Monitoring"
        description="Pusat pantauan Admin Master: aktivitas login semua user, sesi aktif, dan kondisi data master — bisa diakses dari web/HP mana pun."
        icon={Activity}
      />

      {/* Kartu ringkasan */}
      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {masterCards.map((c) => (
          <SectionCard key={c.label} title={c.label}>
            <p className={`flex items-center gap-2 text-2xl font-bold tabular-nums ${c.accent}`}>
              <c.icon className="size-5" />
              {loading ? "…" : c.value}
            </p>
          </SectionCard>
        ))}
      </div>

      {/* Data master */}
      <SectionCard
        title={
          <span className="flex items-center gap-2">
            <Database className="size-4 text-teal-600" />
            Data Master
          </span>
        }
        className="mb-6"
      >
        {loading ? (
          <p className="py-2 text-sm text-muted-foreground">Memuat…</p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {dataMasterItems.map((d) => (
              <div key={d.label} className="flex items-center gap-2.5 rounded-lg border bg-background px-3 py-2.5">
                <d.icon className="size-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0">
                  <p className="truncate text-[11px] font-medium text-muted-foreground">{d.label}</p>
                  <p className="text-sm font-bold tabular-nums">{d.value ?? "–"}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      {/* Sesi aktif */}
      <div className="mb-6">
        <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold tracking-tight">
          <LogIn className="size-4 text-emerald-600" />
          Sesi Login Aktif
          <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground tabular-nums">
            {sesiAktif?.length ?? "…"}
          </span>
        </h2>
        <DataTable
          columns={sesiColumns}
          rows={sesiAktif}
          loading={sesiAktif === undefined}
          keyField={(s) => s.phone}
          emptyTitle="Tidak ada sesi aktif"
          emptyDescription="Belum ada user yang login saat ini."
          pageSize={25}
        />
      </div>

      {/* Log aktivitas */}
      <div>
        <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold tracking-tight">
          <Activity className="size-4 text-teal-600" />
          Riwayat Aktivitas
          <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground tabular-nums">
            {aktivitas?.length ?? "…"}
          </span>
        </h2>
        <DataTable
          columns={aktivitasColumns}
          rows={aktivitas}
          loading={aktivitas === undefined}
          keyField={(a) => a.id}
          emptyTitle="Belum ada aktivitas"
          emptyDescription="Login, logout, dan pengelolaan akun akan tercatat di sini."
          initialSort={{ key: "createdAt", dir: "desc" }}
          pageSize={25}
        />
      </div>
    </div>
  );
}
