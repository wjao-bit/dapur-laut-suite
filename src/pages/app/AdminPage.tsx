import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import {
  ShieldCheck,
  ShieldX,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  UserCheck,
  UserX,
  Crown,
  Lock,
  KeyRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader, SectionCard } from "@/components/app/ui";
import { DataTable, type Column } from "@/components/app/DataTable";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

type Akun = {
  id: string;
  phone: string;
  nama: string;
  status: "pending" | "approved" | "rejected";
  role: "Admin Master" | "Admin";
  createdAt: number;
};

const STATUS_STYLE: Record<Akun["status"], { label: string; cls: string }> = {
  pending: { label: "Menunggu", cls: "bg-amber-100 text-amber-700" },
  approved: { label: "Disetujui", cls: "bg-emerald-100 text-emerald-700" },
  rejected: { label: "Ditolak", cls: "bg-rose-100 text-rose-700" },
};

export default function AdminPage() {
  const { token, session } = useAuth();
  const isMaster = session?.role === "Admin Master";

  // Hanya query listAkun untuk Admin Master — user biasa TIDAK memanggil
  // fungsi ini (backend menolak dengan "Hanya Admin Master..." dan query
  // error itu dulu membuat preview halaman ini crash).
  const raw = useQuery(api.admin.listAkun, token && isMaster ? { token } : "skip");
  const approve = useMutation(api.admin.approveAkun);
  const reject = useMutation(api.admin.rejectAkun);
  const kick = useMutation(api.admin.kickAkun);

  const akun: Akun[] | undefined = (raw as any)?.map((a: any) => ({ ...a, id: a.phone }));

  const totals = {
    pending: (akun ?? []).filter((a) => a.status === "pending").length,
    approved: (akun ?? []).filter((a) => a.status === "approved").length,
    master: (akun ?? []).filter((a) => a.role === "Admin Master").length,
  };

  const handleApprove = async (phone: string) => {
    try {
      await approve({ token: token!, phone });
      toast.success(`Akun ${phone} disetujui — kini bisa login`);
    } catch (e: any) {
      toast.error(e?.data?.message ?? e?.data?.error ?? e?.message ?? "Gagal menyetujui akun");
    }
  };

  const handleReject = async (phone: string) => {
    try {
      await reject({ token: token!, phone });
      toast.success(`Akun ${phone} ditolak`);
    } catch (e: any) {
      toast.error(e?.data?.message ?? e?.data?.error ?? e?.message ?? "Gagal menolak akun");
    }
  };

  const handleKick = async (phone: string) => {
    try {
      await kick({ token: token!, phone });
      toast.success(`Akun ${phone} di-kick — sesi dicabut`);
    } catch (e: any) {
      toast.error(e?.data?.message ?? e?.data?.error ?? e?.message ?? "Gagal meng-kick akun");
    }
  };

  const columns: Column<Akun>[] = [
    {
      key: "phone",
      label: "Nomor HP",
      sortValue: (r) => r.phone,
      render: (r) => <span className="font-semibold tabular-nums">{r.phone}</span>,
    },
    { key: "nama", label: "Nama", sortValue: (r) => r.nama, render: (r) => r.nama },
    {
      key: "role",
      label: "Role",
      render: (r) =>
        r.role === "Admin Master" ? (
          <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
            <Crown className="size-3" />
            Admin Master
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
            <UserCheck className="size-3" />
            Admin
          </span>
        ),
    },
    {
      key: "status",
      label: "Status",
      render: (r) => (
        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${STATUS_STYLE[r.status].cls}`}>
          {r.status === "approved" ? <CheckCircle2 className="size-3" /> : r.status === "pending" ? <UserCheck className="size-3" /> : <XCircle className="size-3" />}
          {STATUS_STYLE[r.status].label}
        </span>
      ),
    },
    { key: "createdAt", label: "Terdaftar", sortValue: (r) => r.createdAt, render: (r) => formatDate(new Date(r.createdAt).toISOString().slice(0, 10)) },
    {
      key: "aksi",
      label: "",
      align: "right",
      render: (r) => (
        <div className="flex items-center justify-end gap-1.5">
          {r.phone === session?.phone && <span className="text-[10px] text-muted-foreground">(Anda)</span>}
          {/* Hanya Admin Master yang boleh setujui/tolak/kick */}
          {isMaster && r.role !== "Admin Master" && r.status !== "approved" && (
            <Button size="sm" className="h-7 cursor-pointer text-xs" onClick={() => handleApprove(r.phone)}>
              <ShieldCheck className="mr-1 size-3.5" />
              Setujui
            </Button>
          )}
          {isMaster && r.role !== "Admin Master" && r.status !== "rejected" && (
            <Button
              size="sm"
              variant="outline"
              className="h-7 cursor-pointer text-xs text-rose-600 hover:text-rose-600"
              onClick={() => handleReject(r.phone)}
            >
              <ShieldX className="mr-1 size-3.5" />
              Tolak
            </Button>
          )}
          {/* Kick: hanya Admin Master, dan Admin Master TIDAK bisa di-kick */}
          {isMaster && r.role !== "Admin Master" && r.status === "approved" && (
            <Button
              size="sm"
              variant="ghost"
              className="h-7 cursor-pointer text-xs text-rose-700 hover:bg-rose-50 hover:text-rose-700"
              title="Cabut sesi & tolak akun ini"
              onClick={() => handleKick(r.phone)}
            >
              <UserX className="mr-1 size-3.5" />
              Kick
            </Button>
          )}
          {r.role === "Admin Master" && (
            <span className="inline-flex items-center gap-1 rounded border border-amber-300/60 bg-amber-50/70 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">
              <Lock className="size-3" />
              Tidak bisa di-kick
            </span>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Admin & Akun"
        description={
          isMaster
            ? "Aplikasi privat — hanya admin yang disetujui yang bisa masuk. Admin Master punya hak penuh: setujui, tolak, dan kick user lain."
            : "Aplikasi privat — daftar akun admin. Hanya Admin Master yang bisa menyetujui, menolak, atau meng-kick user."
        }
        icon={ShieldCheck}
      />

      {!isMaster ? (
        <div className="mb-4 flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50/70 p-5 sm:flex-row sm:items-center">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-amber-100">
            <ShieldAlert className="size-5 text-amber-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-amber-900">Akses terbatas — hanya Admin Master</p>
            <p className="mt-1 text-xs leading-relaxed text-amber-800">
              Anda login sebagai <b>Admin</b>. Pengelolaan akun (setujui/tolak/kick) hanya bisa dilakukan oleh{" "}
              <b>Admin Master</b>. Keluar lalu masuk dengan nomor <b>082100000000</b> untuk mendapat akses penuh, atau daftar
              akun baru dengan nomor tersebut (langsung disetujui otomatis).
            </p>
          </div>
          <div className="flex items-center gap-1.5 rounded-lg border border-amber-300/60 bg-white/70 px-3 py-2 text-[11px] font-medium text-amber-800">
            <KeyRound className="size-3.5" />
            Admin Master: 082100000000
          </div>
        </div>
      ) : (
        <div className="mb-4 grid grid-cols-3 gap-3 sm:max-w-lg">
          <SectionCard title="Menunggu" className="border-amber-200">
            <p className="text-2xl font-bold text-amber-600 tabular-nums">{totals.pending}</p>
          </SectionCard>
          <SectionCard title="Disetujui" className="border-emerald-200">
            <p className="text-2xl font-bold text-emerald-600 tabular-nums">{totals.approved}</p>
          </SectionCard>
          <SectionCard title="Admin Master" className="border-amber-200">
            <p className="text-2xl font-bold text-amber-600 tabular-nums">{totals.master}</p>
          </SectionCard>
        </div>
      )}

      {isMaster && (
        <DataTable
          columns={columns}
          rows={akun ?? []}
          loading={raw === undefined}
          keyField={(r) => r.phone}
          emptyTitle="Belum ada akun admin"
          emptyDescription="Akun admin baru akan muncul di sini setelah mendaftar di halaman login."
        />
      )}
    </div>
  );
}
