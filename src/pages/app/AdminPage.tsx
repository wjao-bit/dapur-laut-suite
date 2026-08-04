import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { ShieldCheck, ShieldX, CheckCircle2, XCircle, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader, SectionCard } from "@/components/app/ui";
import { DataTable, type Column } from "@/components/app/DataTable";
import { formatDate } from "@/lib/format";

type Akun = { phone: string; nama: string; status: "pending" | "approved" | "rejected"; createdAt: number };

const STATUS_STYLE: Record<Akun["status"], { label: string; cls: string }> = {
  pending: { label: "Menunggu", cls: "bg-amber-100 text-amber-700" },
  approved: { label: "Disetujui", cls: "bg-emerald-100 text-emerald-700" },
  rejected: { label: "Ditolak", cls: "bg-rose-100 text-rose-700" },
};

export default function AdminPage() {
  const { token, session } = useAuth();
  const akun = useQuery(api.admin.listAkun, token ? { token } : "skip") as Akun[] | undefined;
  const approve = useMutation(api.admin.approveAkun);
  const reject = useMutation(api.admin.rejectAkun);

  const totals = {
    pending: (akun ?? []).filter((a) => a.status === "pending").length,
    approved: (akun ?? []).filter((a) => a.status === "approved").length,
    rejected: (akun ?? []).filter((a) => a.status === "rejected").length,
  };

  const handleApprove = async (phone: string) => {
    try {
      await approve({ token: token!, phone });
      toast.success(`Akun ${phone} disetujui — kini bisa login`);
    } catch (e: any) {
      toast.error(e?.data?.error ?? e?.message ?? "Gagal menyetujui akun");
    }
  };

  const handleReject = async (phone: string) => {
    try {
      await reject({ token: token!, phone });
      toast.success(`Akun ${phone} ditolak`);
    } catch (e: any) {
      toast.error(e?.data?.error ?? e?.message ?? "Gagal menolak akun");
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
          {r.status !== "approved" && (
            <Button size="sm" className="h-7 cursor-pointer text-xs" onClick={() => handleApprove(r.phone)}>
              <ShieldCheck className="mr-1 size-3.5" />
              Setujui
            </Button>
          )}
          {r.status !== "rejected" && (
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
          {r.phone === session?.phone && (
            <span className="text-[10px] text-muted-foreground">(Anda)</span>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Admin & Akun"
        description="Aplikasi privat — hanya admin yang disetujui yang bisa masuk. Setujui/tolak akun admin baru di sini."
        icon={ShieldCheck}
      />

      <div className="mb-4 grid grid-cols-3 gap-3 sm:max-w-lg">
        <SectionCard title="Menunggu" className="border-amber-200">
          <p className="text-2xl font-bold text-amber-600 tabular-nums">{totals.pending}</p>
        </SectionCard>
        <SectionCard title="Disetujui" className="border-emerald-200">
          <p className="text-2xl font-bold text-emerald-600 tabular-nums">{totals.approved}</p>
        </SectionCard>
        <SectionCard title="Ditolak" className="border-rose-200">
          <p className="text-2xl font-bold text-rose-600 tabular-nums">{totals.rejected}</p>
        </SectionCard>
      </div>

      <DataTable
        columns={columns}
        rows={akun ?? []}
        loading={akun === undefined}
        keyField={(r) => r.phone}
        emptyTitle="Belum ada akun admin"
        emptyDescription="Akun admin baru akan muncul di sini setelah mendaftar di halaman login."
      />
    </div>
  );
}
