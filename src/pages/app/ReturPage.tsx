import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
import { Undo2, Plus, Trash2 } from "lucide-react";
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
import { PageHeader, BadgeStatus } from "@/components/app/ui";
import { DataTable, type Column } from "@/components/app/DataTable";
import { BarangSearch } from "@/components/app/BarangSearch";
import { NumInput } from "@/components/app/NumInput";
import { formatDate, todayStr, genId, parseNum, formatNum } from "@/lib/format";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

export default function ReturPage() {
  const retur = useQuery(api.queries.listRetur, {});
  const resellers = useQuery(api.queries.listReseller);
  const dpls = useQuery(api.queries.listDpl);
  const pasars = useQuery(api.queries.listPasar);
  const barang = useQuery(api.queries.listBarang);
  const upsertRetur = useMutation(api.business.upsertRetur);
  const deleteRetur = useMutation(api.business.deleteMaster as any);

  const [open, setOpen] = useState(false);
  const [tipe, setTipe] = useState("Reseller");
  const [tanggal, setTanggal] = useState(todayStr());
  const [id, setId] = useState(() => genId("RET"));
  const [namaPihak, setNamaPihak] = useState("");
  const [namaBarang, setNamaBarang] = useState("");
  const [qty, setQty] = useState(1);
  const [keterangan, setKeterangan] = useState("");
  const [saving, setSaving] = useState(false);

  const pihakOptions =
    tipe === "Reseller"
      ? resellers?.map((r: any) => r.nama) ?? []
      : tipe === "DPL"
        ? dpls?.map((d: any) => d.namaPasar) ?? []
        : pasars?.map((p: any) => p.namaPasar) ?? [];

  const barangOptions = (barang ?? []).map((b: any) => ({
    kode: b.kode,
    nama: b.nama,
    harga: b.harga,
    kategori: b.kategori ?? "",
  }));

  const resetForm = () => {
    setTipe("Reseller");
    setTanggal(todayStr());
    setId(genId("RET"));
    setNamaPihak("");
    setNamaBarang("");
    setQty(1);
    setKeterangan("");
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const qtyNum = Math.max(0, parseNum(qty));
      // Convex upsertRetur otomatis menambah riwayat stok (+qty) di gudang.
      await upsertRetur({ doc: { id, tanggal, tipe, namaPihak, namaBarang, qty: qtyNum, keterangan } });
      toast.success(`Retur ${formatNum(qtyNum)} × ${namaBarang} dicatat — stok gudang bertambah`);
      setOpen(false);
      resetForm();
    } catch (e: any) {
      toast.error(e?.data?.error ?? e?.message ?? "Gagal menyimpan retur");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (row: any) => {
    try {
      await deleteRetur({ table: "retur", id: String(row.id) });
      toast.success("Retur dihapus");
    } catch (e: any) {
      toast.error(e?.data?.error ?? e?.message ?? "Gagal menghapus retur");
    }
  };

  const columns: Column<any>[] = [
    { key: "id", label: "ID Retur", sortValue: (r) => r.id, render: (r) => <span className="font-semibold">{r.id}</span> },
    { key: "tanggal", label: "Tanggal", sortValue: (r) => r.tanggal, render: (r) => formatDate(r.tanggal) },
    { key: "tipe", label: "Tipe", render: (r) => <BadgeStatus status={r.tipe} /> },
    { key: "namaPihak", label: "Dari Pihak", render: (r) => r.namaPihak },
    { key: "namaBarang", label: "Barang", render: (r) => r.namaBarang },
    { key: "qty", label: "Qty", align: "right", sortValue: (r) => r.qty, render: (r) => <span className="font-semibold tabular-nums">{formatNum(r.qty)}</span> },
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
              <AlertDialogTitle>Hapus retur ini?</AlertDialogTitle>
              <AlertDialogDescription>Data retur {r.id} akan dihapus.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Batal</AlertDialogCancel>
              <AlertDialogAction className="bg-rose-600 hover:bg-rose-700" onClick={() => handleDelete(r)}>
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
        title="Retur Barang"
        description="Barang kembali dari Reseller/DPL/Pasar. Retur otomatis menambah stok ke Gudang."
        icon={Undo2}
        actions={
          <Button onClick={() => setOpen(true)}>
            <Plus className="mr-2 size-4" />
            Catat Retur
          </Button>
        }
      />

      <DataTable
        columns={columns}
        rows={retur as any}
        loading={retur === undefined}
        keyField={(r) => r.id}
        emptyTitle="Belum ada retur"
        emptyDescription="Catat retur barang yang dikembalikan pihak lain."
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Catat Retur</DialogTitle>
            <DialogDescription>Stok gudang otomatis bertambah sesuai qty retur.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs font-medium">ID Retur *</Label>
                <Input className="mt-1.5" value={id} onChange={(e) => setId(e.target.value)} />
              </div>
              <div>
                <Label className="text-xs font-medium">Tanggal *</Label>
                <Input type="date" className="mt-1.5" value={tanggal} onChange={(e) => setTanggal(e.target.value)} />
              </div>
            </div>
            <div>
              <Label className="text-xs font-medium">Tipe *</Label>
              <Select value={tipe} onValueChange={(v) => { setTipe(v); setNamaPihak(""); }}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["Reseller", "DPL", "Pasar"].map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-medium">Nama Pihak *</Label>
              <Input className="mt-1.5" list="retur-pihak" value={namaPihak} onChange={(e) => setNamaPihak(e.target.value)} placeholder="Nama reseller / pasar" />
              <datalist id="retur-pihak">
                {pihakOptions.map((p: string, i: number) => <option key={`${p}-${i}`} value={p} />)}
              </datalist>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs font-medium">Barang *</Label>
                <BarangSearch
                  className="mt-1.5"
                  barang={barangOptions as any}
                  value={namaBarang}
                  onChange={setNamaBarang}
                  onPick={(b) => setNamaBarang(b.nama)}
                  placeholder="Ketik nama barang…"
                />
              </div>
              <div>
                <Label className="text-xs font-medium">Qty *</Label>
                <NumInput
                  className="mt-1.5"
                  value={qty}
                  onValue={setQty}
                />
                <p className="mt-1 text-[11px] text-muted-foreground">Boleh desimal, mis. 0,7</p>
              </div>
            </div>
            <div>
              <Label className="text-xs font-medium">Keterangan</Label>
              <Input className="mt-1.5" value={keterangan} onChange={(e) => setKeterangan(e.target.value)} placeholder="Barang rusak / tidak laku" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Batal</Button>
            <Button onClick={handleSave} disabled={saving || !namaPihak || !namaBarang || !(parseNum(qty) > 0)}>
              {saving ? "Menyimpan..." : "Simpan Retur"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
