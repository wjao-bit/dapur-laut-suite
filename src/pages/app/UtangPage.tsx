import { useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
import { HandCoins, Plus, Pencil, Trash2, Wallet } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeader, SectionCard, BadgeStatus } from "@/components/app/ui";
import { DataTable, type Column } from "@/components/app/DataTable";
import { formatRupiah, formatDate, todayStr, genId } from "@/lib/format";
import { UTANG_JENISES } from "@/lib/business";

const EMPTY = {
  id: "",
  idKaryawan: "",
  tanggal: todayStr(),
  nominal: 0,
  status: "Belum",
  dibayar: 0,
  tglBayar: "",
  sisaUtang: 0,
  keterangan: "",
  jenis: "Utang",
};

export default function UtangPage() {
  const utang = useQuery(api.queries.listUtang, {});
  const karyawan = useQuery(api.queries.listKaryawan);
  const upsertUtang = useMutation(api.business.upsertUtang);
  const bayarUtang = useMutation(api.business.bayarUtang);
  const deleteUtang = useMutation(api.business.deleteMaster as any);

  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<any>({ ...EMPTY, id: genId("UTG") });
  const [bayarId, setBayarId] = useState<string | null>(null);
  const [bayarJumlah, setBayarJumlah] = useState(0);
  const [saving, setSaving] = useState(false);
  const [filterKaryawan, setFilterKaryawan] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const namaKaryawan = (id: string) => karyawan?.find((k: any) => k.id === id)?.nama ?? id;

  const filtered = useMemo(() => {
    if (!utang) return utang;
    return utang.filter(
      (u: any) =>
        (!filterKaryawan || u.idKaryawan === filterKaryawan) &&
        (!filterStatus || u.status === filterStatus),
    );
  }, [utang, filterKaryawan, filterStatus]);

  const totals = useMemo(() => {
    let sisa = 0;
    let lunas = 0;
    for (const u of filtered ?? []) {
      sisa += u.sisaUtang;
      if (u.status === "Lunas") lunas += u.nominal;
    }
    return { sisa, lunas };
  }, [filtered]);

  const openCreate = () => setValues({ ...EMPTY, id: genId("UTG") });

  const openEdit = (row: any) =>
    setValues({
      id: row.id,
      idKaryawan: row.idKaryawan,
      tanggal: row.tanggal,
      nominal: row.nominal,
      status: row.status,
      dibayar: row.dibayar,
      tglBayar: row.tglBayar,
      sisaUtang: row.sisaUtang,
      keterangan: row.keterangan ?? "",
      jenis: row.jenis,
    });

  const handleSave = async () => {
    setSaving(true);
    try {
      const sisa = Math.max(0, Number(values.nominal) - Number(values.dibayar));
      await upsertUtang({
        doc: {
          ...values,
          nominal: Number(values.nominal),
          dibayar: Number(values.dibayar),
          sisaUtang: sisa,
          status: sisa <= 0 ? "Lunas" : Number(values.dibayar) > 0 ? "Parsial" : "Belum",
        },
      });
      toast.success("Data utang disimpan");
      setOpen(false);
    } catch (e: any) {
      toast.error(e?.data?.error ?? e?.message ?? "Gagal menyimpan");
    } finally {
      setSaving(false);
    }
  };

  const handleBayar = async () => {
    if (!bayarId) return;
    setSaving(true);
    try {
      await bayarUtang({ id: bayarId, jumlah: Number(bayarJumlah) });
      toast.success("Pembayaran utang dicatat — kas bertambah");
      setBayarId(null);
    } catch (e: any) {
      toast.error(e?.data?.error ?? e?.message ?? "Gagal membayar");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteUtang({ table: "utang", id });
      toast.success("Utang dihapus");
    } catch (e: any) {
      toast.error(e?.data?.error ?? e?.message ?? "Gagal menghapus utang");
    }
  };

  const columns: Column<any>[] = [
    { key: "id", label: "ID Utang", sortValue: (r) => r.id, render: (r) => <span className="font-semibold">{r.id}</span> },
    { key: "idKaryawan", label: "Karyawan", sortValue: (r) => r.idKaryawan, render: (r) => namaKaryawan(r.idKaryawan) },
    { key: "tanggal", label: "Tanggal", sortValue: (r) => r.tanggal, render: (r) => formatDate(r.tanggal) },
    { key: "jenis", label: "Jenis", render: (r) => <BadgeStatus status={r.jenis} /> },
    { key: "nominal", label: "Nominal", align: "right", sortValue: (r) => r.nominal, render: (r) => formatRupiah(r.nominal) },
    { key: "dibayar", label: "Dibayar", align: "right", sortValue: (r) => r.dibayar, render: (r) => formatRupiah(r.dibayar) },
    {
      key: "sisaUtang",
      label: "Sisa",
      align: "right",
      sortValue: (r) => r.sisaUtang,
      render: (r) => (
        <span className={r.sisaUtang > 0 ? "font-medium text-rose-600 tabular-nums" : "text-muted-foreground tabular-nums"}>
          {formatRupiah(r.sisaUtang)}
        </span>
      ),
    },
    { key: "status", label: "Status", render: (r) => <BadgeStatus status={r.status} /> },
    {
      key: "aksi",
      label: "",
      align: "right",
      render: (r) => (
        <div className="flex items-center justify-end gap-1">
          {r.sisaUtang > 0 && (
            <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => { setBayarId(r.id); setBayarJumlah(r.sisaUtang); }}>
              <Wallet className="mr-1 size-3" />
              Bayar
            </Button>
          )}
          <Button variant="ghost" size="icon" className="size-7" onClick={() => { setOpen(true); openEdit(r); }}>
            <Pencil className="size-3.5" />
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon" className="size-7 text-rose-600 hover:text-rose-600">
                <Trash2 className="size-3.5" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Hapus utang ini?</AlertDialogTitle>
                <AlertDialogDescription>Riwayat utang {r.id} akan dihapus permanen.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Batal</AlertDialogCancel>
                <AlertDialogAction className="bg-rose-600 hover:bg-rose-700" onClick={() => handleDelete(r.id)}>
                  Hapus
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Utang Karyawan"
        description="Utang & casbon karyawan. Terpotong otomatis di slip gaji; pengeluaran jenis 'Utang Karyawan' otomatis membuat record utang."
        icon={HandCoins}
        actions={
          <Button onClick={() => { setOpen(true); openCreate(); }}>
            <Plus className="mr-2 size-4" />
            Tambah Utang
          </Button>
        }
      />

      <div className="mb-4 grid grid-cols-1 gap-3 sm:max-w-md sm:grid-cols-2">
        <SectionCard title="Total Sisa Utang" className="border-rose-200">
          <p className="text-2xl font-bold text-rose-600 tabular-nums">{formatRupiah(totals.sisa)}</p>
        </SectionCard>
        <SectionCard title="Sudah Lunas" className="border-emerald-200">
          <p className="text-2xl font-bold text-emerald-600 tabular-nums">{formatRupiah(totals.lunas)}</p>
        </SectionCard>
      </div>

      <div className="mb-4 grid gap-2 sm:max-w-md sm:grid-cols-2">
        <div>
          <Label className="text-xs font-medium">Filter Karyawan</Label>
          {/* Nilai "__all" hanyalah penanda; diubah jadi "" agar menampilkan SEMUA (fix bug tabel kosong). */}
          <Select value={filterKaryawan} onValueChange={(v) => setFilterKaryawan(v === "__all" ? "" : v)}>
            <SelectTrigger className="mt-1.5">
              <SelectValue placeholder="Semua" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all">Semua karyawan</SelectItem>
              {(karyawan ?? []).map((k: any) => (
                <SelectItem key={k.id} value={k.id}>
                  {k.nama}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs font-medium">Filter Status</Label>
          <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v === "__all" ? "" : v)}>
            <SelectTrigger className="mt-1.5">
              <SelectValue placeholder="Semua status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all">Semua status</SelectItem>
              {["Belum", "Parsial", "Lunas"].map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <DataTable
        columns={columns}
        rows={filtered as any}
        loading={utang === undefined}
        keyField={(r) => r.id}
        emptyTitle="Belum ada utang"
        emptyDescription="Tambahkan utang atau casbon karyawan."
      />

      {/* Form utang */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Data Utang</DialogTitle>
            <DialogDescription>Slip gaji otomatis memotong sisa utang/casbon karyawan.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs font-medium">ID Utang *</Label>
              <Input className="mt-1.5" value={values.id} onChange={(e) => setValues({ ...values, id: e.target.value })} />
            </div>
            <div>
              <Label className="text-xs font-medium">Karyawan *</Label>
              <Select value={values.idKaryawan} onValueChange={(v) => setValues({ ...values, idKaryawan: v })}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder="Pilih karyawan" />
                </SelectTrigger>
                <SelectContent>
                  {(karyawan ?? []).map((k: any) => (
                    <SelectItem key={k.id} value={k.id}>
                      {k.nama}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs font-medium">Tanggal *</Label>
                <Input type="date" className="mt-1.5" value={values.tanggal} onChange={(e) => setValues({ ...values, tanggal: e.target.value })} />
              </div>
              <div>
                <Label className="text-xs font-medium">Jenis</Label>
                <Select value={values.jenis} onValueChange={(v) => setValues({ ...values, jenis: v })}>
                  <SelectTrigger className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {UTANG_JENISES.map((j) => (
                      <SelectItem key={j} value={j}>
                        {j}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs font-medium">Nominal *</Label>
                <Input type="number" min={0} inputMode="decimal" className="mt-1.5" value={values.nominal} onChange={(e) => setValues({ ...values, nominal: Number(e.target.value) })} />
              </div>
              <div>
                <Label className="text-xs font-medium">Sudah Dibayar</Label>
                <Input type="number" min={0} inputMode="decimal" className="mt-1.5" value={values.dibayar} onChange={(e) => setValues({ ...values, dibayar: Number(e.target.value) })} />
              </div>
            </div>
            <div>
              <Label className="text-xs font-medium">Keterangan</Label>
              <Input className="mt-1.5" value={values.keterangan} onChange={(e) => setValues({ ...values, keterangan: e.target.value })} placeholder="Pinjaman tunai / casbon mingguan" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Batal</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? "Menyimpan..." : "Simpan"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog bayar utang */}
      <Dialog open={!!bayarId} onOpenChange={(o) => !o && setBayarId(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Bayar Utang</DialogTitle>
            <DialogDescription>Pembayaran utang oleh karyawan akan menambah kas masuk.</DialogDescription>
          </DialogHeader>
          <div>
            <Label className="text-xs font-medium">Jumlah Pembayaran (Rp) *</Label>
            <Input
              type="number"
              min={1}
              inputMode="decimal"
              className="mt-1.5 text-lg font-semibold"
              value={bayarJumlah}
              onChange={(e) => setBayarJumlah(Number(e.target.value))}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBayarId(null)}>Batal</Button>
            <Button onClick={handleBayar} disabled={saving || bayarJumlah <= 0}>
              <Wallet className="mr-2 size-4" />
              Catat Pembayaran
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
