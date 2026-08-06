import { useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
import { ReceiptText, Plus, Trash2 } from "lucide-react";
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
import { formatRupiah, formatDate, todayStr, genId, parseNum } from "@/lib/format";
import { PENGELUARAN_JENISES } from "@/lib/business";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

export default function PengeluaranPage() {
  const pengeluaran = useQuery(api.queries.listPengeluaran, {});
  const karyawan = useQuery(api.queries.listKaryawan);
  const upsertPengeluaran = useMutation(api.business.upsertPengeluaran);
  const deletePengeluaran = useMutation(api.business.deleteMaster as any);

  const [open, setOpen] = useState(false);
  const [id, setId] = useState(() => genId("PEN"));
  const [tanggal, setTanggal] = useState(todayStr());
  const [jenis, setJenis] = useState("Operasional");
  const [nominal, setNominal] = useState(0);
  const [keterangan, setKeterangan] = useState("");
  const [idKaryawan, setIdKaryawan] = useState("");
  const [saving, setSaving] = useState(false);
  const [filterJenis, setFilterJenis] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const filtered = useMemo(() => {
    if (!pengeluaran) return pengeluaran;
    return pengeluaran.filter(
      (p: any) =>
        (!filterJenis || p.jenis === filterJenis) &&
        (!from || p.tanggal >= from) &&
        (!to || p.tanggal <= to),
    );
  }, [pengeluaran, filterJenis, from, to]);

  const total = useMemo(() => (filtered ?? []).reduce((s: number, p: any) => s + p.nominal, 0), [filtered]);

  const namaKaryawan = (id: string) => karyawan?.find((k: any) => k.id === id)?.nama ?? id;

  const resetForm = () => {
    setId(genId("PEN"));
    setTanggal(todayStr());
    setJenis("Operasional");
    setNominal(0);
    setKeterangan("");
    setIdKaryawan("");
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await upsertPengeluaran({ doc: { id, tanggal, jenis, nominal: parseNum(nominal), keterangan, idKaryawan } });
      toast.success(
        jenis === "Utang Karyawan" && idKaryawan
          ? `Pengeluaran dicatat — utang ${namaKaryawan(idKaryawan)} bertambah otomatis`
          : "Pengeluaran dicatat — kas berkurang",
      );
      setOpen(false);
      resetForm();
    } catch (e: any) {
      toast.error(e?.data?.error ?? e?.message ?? "Gagal menyimpan");
    } finally {
      setSaving(false);
    }
  };

  const columns: Column<any>[] = [
    { key: "id", label: "ID", sortValue: (r) => r.id, render: (r) => <span className="font-semibold">{r.id}</span> },
    { key: "tanggal", label: "Tanggal", sortValue: (r) => r.tanggal, render: (r) => formatDate(r.tanggal) },
    { key: "jenis", label: "Jenis", render: (r) => <BadgeStatus status={r.jenis} /> },
    { key: "nominal", label: "Nominal", align: "right", sortValue: (r) => r.nominal, render: (r) => <span className="font-medium text-rose-600 tabular-nums">{formatRupiah(r.nominal)}</span> },
    { key: "keterangan", label: "Keterangan", render: (r) => r.keterangan || "—" },
    {
      key: "aksi",
      label: "",
      align: "right",
      render: (r) => (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="icon" className="size-7 text-rose-600 hover:text-rose-600">
              <Trash2 className="size-3.5" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Hapus pengeluaran?</AlertDialogTitle>
              <AlertDialogDescription>Kas keluar terkait juga akan dihapus.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Batal</AlertDialogCancel>
              <AlertDialogAction className="bg-rose-600 hover:bg-rose-700" onClick={async () => {
                try {
                  await deletePengeluaran({ table: "pengeluaran", id: r.id });
                  toast.success("Pengeluaran dihapus");
                } catch (e: any) {
                  toast.error(e?.data?.error ?? e?.message ?? "Gagal menghapus");
                }
              }}>
                Hapus
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Pengeluaran"
        description="Pengeluaran operasional & lainnya. Jenis 'Utang Karyawan' otomatis menambah record utang karyawan."
        icon={ReceiptText}
        actions={
          <Button onClick={() => setOpen(true)}>
            <Plus className="mr-2 size-4" />
            Catat Pengeluaran
          </Button>
        }
      />

      <div className="mb-4 grid gap-3 lg:grid-cols-4">
        <SectionCard title="Total (filter)" className="border-rose-200">
          <p className="text-2xl font-bold text-rose-600 tabular-nums">{formatRupiah(total)}</p>
        </SectionCard>
        <div className="lg:col-span-3 grid gap-2 sm:grid-cols-3">
          <div>
            <Label className="text-xs font-medium">Filter Jenis</Label>
            {/* Nilai "__all" hanyalah penanda; diubah jadi "" agar menampilkan SEMUA jenis (fix bug tabel kosong). */}
            <Select value={filterJenis} onValueChange={(v) => setFilterJenis(v === "__all" ? "" : v)}>
              <SelectTrigger className="mt-1.5">
                <SelectValue placeholder="Semua jenis" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all">Semua jenis</SelectItem>
                {PENGELUARAN_JENISES.map((j) => (
                  <SelectItem key={j} value={j}>{j}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs font-medium">Dari</Label>
            <Input type="date" className="mt-1.5" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div>
            <Label className="text-xs font-medium">Sampai</Label>
            <Input type="date" className="mt-1.5" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
        </div>
      </div>

      <DataTable
        columns={columns}
        rows={filtered as any}
        loading={pengeluaran === undefined}
        keyField={(r) => r.id}
        emptyTitle="Belum ada pengeluaran"
        emptyDescription="Catat pengeluaran operasional perusahaan."
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Catat Pengeluaran</DialogTitle>
            <DialogDescription>
              {jenis === "Utang Karyawan" && idKaryawan
                ? "Pengeluaran ini otomatis menjadi record utang karyawan."
                : "Kas keluar tercatat otomatis."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs font-medium">ID *</Label>
                <Input className="mt-1.5" value={id} onChange={(e) => setId(e.target.value)} />
              </div>
              <div>
                <Label className="text-xs font-medium">Tanggal *</Label>
                <Input type="date" className="mt-1.5" value={tanggal} onChange={(e) => setTanggal(e.target.value)} />
              </div>
            </div>
            <div>
              <Label className="text-xs font-medium">Jenis *</Label>
              <Select value={jenis} onValueChange={setJenis}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PENGELUARAN_JENISES.map((j) => (
                    <SelectItem key={j} value={j}>{j}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {jenis === "Utang Karyawan" && (
              <div>
                <Label className="text-xs font-medium">Karyawan (untuk utang) *</Label>
                <Select value={idKaryawan} onValueChange={setIdKaryawan}>
                  <SelectTrigger className="mt-1.5">
                    <SelectValue placeholder="Pilih karyawan" />
                  </SelectTrigger>
                  <SelectContent>
                    {(karyawan ?? []).map((k: any) => (
                      <SelectItem key={k.id} value={k.id}>{k.nama}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div>
              <Label className="text-xs font-medium">Nominal (Rp) *</Label>
              <Input
                type="number"
                min={0}
                step="any"
                inputMode="decimal"
                className="mt-1.5"
                value={nominal}
                onChange={(e) => setNominal(parseNum(e.target.value))}
              />
            </div>
            <div>
              <Label className="text-xs font-medium">Keterangan</Label>
              <Input className="mt-1.5" value={keterangan} onChange={(e) => setKeterangan(e.target.value)} placeholder="Keterangan pengeluaran" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Batal</Button>
            <Button onClick={handleSave} disabled={saving || parseNum(nominal) <= 0 || (jenis === "Utang Karyawan" && !idKaryawan)}>
              {saving ? "Menyimpan..." : "Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
