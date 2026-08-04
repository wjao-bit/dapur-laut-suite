import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
import { Banknote, Printer, Sparkles, Trash2 } from "lucide-react";
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
import { PrintFrame, SignatureRow } from "@/components/app/PrintFrame";
import { formatRupiah, formatDate, formatMonth, thisMonth } from "@/lib/format";

export default function SlipGajiPage() {
  const slipgaji = useQuery(api.queries.listSlipGaji, {});
  const karyawan = useQuery(api.queries.listKaryawan);
  const createSlipGaji = useMutation(api.business.createSlipGaji);
  const deleteSlipGaji = useMutation(api.business.deleteMaster as any);

  const [open, setOpen] = useState(false);
  const [idKaryawan, setIdKaryawan] = useState("");
  const [periode, setPeriode] = useState(thisMonth());
  const [bonus, setBonus] = useState(0);
  const [saving, setSaving] = useState(false);
  const [printSlip, setPrintSlip] = useState<any>(null);

  const namaKaryawan = (id: string) => karyawan?.find((k: any) => k.id === id)?.nama ?? id;

  const handleCreate = async () => {
    if (!idKaryawan) {
      toast.error("Pilih karyawan terlebih dahulu");
      return;
    }
    setSaving(true);
    try {
      const res = await createSlipGaji({ idKaryawan, periode, bonus: Number(bonus) || 0 });
      toast.success(`Slip gaji ${res.nama} dibuat — Gaji bersih ${formatRupiah(res.gajiBersih)}`);
      setOpen(false);
    } catch (e: any) {
      toast.error(e?.data?.error ?? e?.message ?? "Gagal membuat slip gaji");
    } finally {
      setSaving(false);
    }
  };

  const columns: Column<any>[] = [
    { key: "id", label: "ID Slip", sortValue: (r) => r.id, render: (r) => <span className="font-semibold">{r.id}</span> },
    { key: "idKaryawan", label: "Karyawan", sortValue: (r) => r.idKaryawan, render: (r) => namaKaryawan(r.idKaryawan) },
    { key: "periode", label: "Periode", sortValue: (r) => r.periode, render: (r) => formatMonth(r.periode) },
    { key: "gajiPokok", label: "Gaji Pokok", align: "right", sortValue: (r) => r.gajiPokok, render: (r) => formatRupiah(r.gajiPokok) },
    {
      key: "potongan",
      label: "Total Potongan",
      align: "right",
      sortValue: (r) => r.potonganAbsensi + r.potonganUtang + r.potonganCasbon,
      render: (r) => <span className="text-rose-600 tabular-nums">{formatRupiah(r.potonganAbsensi + r.potonganUtang + r.potonganCasbon)}</span>,
    },
    {
      key: "gajiBersih",
      label: "Gaji Bersih",
      align: "right",
      sortValue: (r) => r.gajiBersih,
      render: (r) => <span className="font-semibold text-emerald-600 tabular-nums">{formatRupiah(r.gajiBersih)}</span>,
    },
    { key: "tanggal", label: "Tgl Cetak", render: (r) => formatDate(r.tanggal) },
    {
      key: "aksi",
      label: "",
      align: "right",
      render: (r) => (
        <div className="flex items-center justify-end gap-1">
          <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setPrintSlip(r)}>
            <Printer className="mr-1 size-3" />
            Cetak
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-7 text-rose-600 hover:text-rose-600"
            onClick={async () => {
              await deleteSlipGaji({ table: "slipgaji", id: r.id });
              toast.success("Slip gaji dihapus");
            }}
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Slip Gaji"
        description="Menarik absensi, utang, dan casbon otomatis — hitung potongan & gaji bersih, lalu cetak slip resmi."
        icon={Banknote}
        actions={
          <Button onClick={() => setOpen(true)}>
            <Sparkles className="mr-2 size-4" />
            Buat Slip Gaji
          </Button>
        }
      />

      <DataTable
        columns={columns}
        rows={slipgaji as any}
        loading={slipgaji === undefined}
        keyField={(r) => r.id}
        emptyTitle="Belum ada slip gaji"
        emptyDescription="Klik 'Buat Slip Gaji' untuk menghitung gaji karyawan."
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Buat Slip Gaji</DialogTitle>
            <DialogDescription>
              Potongan absensi = (Alpa + Izin) × gaji per hari (26 hari kerja). Utang & casbon dipotong otomatis, gaji bersih tidak negatif.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs font-medium">Karyawan *</Label>
              <Select value={idKaryawan} onValueChange={setIdKaryawan}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder="Pilih karyawan" />
                </SelectTrigger>
                <SelectContent>
                  {(karyawan ?? []).map((k: any) => (
                    <SelectItem key={k.id} value={k.id}>
                      {k.nama} — {formatRupiah(k.gajiPokok)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-medium">Periode *</Label>
              <Input type="month" className="mt-1.5" value={periode} onChange={(e) => setPeriode(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs font-medium">Bonus (Rp)</Label>
              <Input type="number" min={0} className="mt-1.5" value={bonus} onChange={(e) => setBonus(Number(e.target.value))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Batal</Button>
            <Button onClick={handleCreate} disabled={saving}>
              {saving ? "Menghitung..." : "Hitung & Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <PrintFrame
        open={!!printSlip}
        onClose={() => setPrintSlip(null)}
        title={`Slip Gaji ${printSlip ? namaKaryawan(printSlip.idKaryawan) : ""} - ${printSlip?.periode ?? ""}`}
      >
        {printSlip && <SlipGajiPrintDoc slip={printSlip} nama={namaKaryawan(printSlip.idKaryawan)} jabatan={karyawan?.find((k: any) => k.id === printSlip.idKaryawan)?.jabatan ?? ""} />}
      </PrintFrame>
    </div>
  );
}

export function SlipGajiPrintDoc({ slip, nama, jabatan }: { slip: any; nama: string; jabatan?: string }) {
  const potonganAbsensi = slip.potonganAbsensi ?? 0;
  const potonganUtang = slip.potonganUtang ?? 0;
  const potonganCasbon = slip.potonganCasbon ?? 0;
  const totalPotongan = potonganAbsensi + potonganUtang + potonganCasbon;
  return (
    <div>
      <div className="mb-4 flex items-center justify-between text-sm">
        <div>
          <p className="text-xs text-slate-500">Slip Gaji Karyawan</p>
          <p className="text-lg font-bold text-slate-900">Periode {formatMonth(slip.periode)}</p>
        </div>
        <div className="text-right text-xs text-slate-500">
          <p>No. {slip.id}</p>
          <p>Tgl Cetak: {formatDate(slip.tanggal)}</p>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-4 rounded-md bg-slate-50 px-4 py-3 text-sm">
        <div>
          <p className="text-xs text-slate-500">Nama Karyawan</p>
          <p className="font-semibold text-slate-900">{nama}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">ID Karyawan</p>
          <p className="font-semibold text-slate-900">{slip.idKaryawan}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Jabatan</p>
          <p>{jabatan || "-"}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Rekap Absensi</p>
          <p>
            Hadir {slip.hadir} · Izin {slip.izin} · Sakit {slip.sakit} · Alpa {slip.alpa}
          </p>
        </div>
      </div>

      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-slate-100 text-left text-xs text-slate-600 uppercase">
            <th className="border border-slate-200 px-3 py-2">Keterangan</th>
            <th className="border border-slate-200 px-3 py-2 text-right">Jumlah</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border border-slate-200 px-3 py-2">Gaji Pokok</td>
            <td className="border border-slate-200 px-3 py-2 text-right tabular-nums">{formatRupiah(slip.gajiPokok)}</td>
          </tr>
          <tr>
            <td className="border border-slate-200 px-3 py-2">Bonus</td>
            <td className="border border-slate-200 px-3 py-2 text-right tabular-nums">{formatRupiah(slip.bonus)}</td>
          </tr>
          <tr className="text-rose-700">
            <td className="border border-slate-200 px-3 py-2">Potongan Absensi (Alpa {slip.alpa} + Izin {slip.izin})</td>
            <td className="border border-slate-200 px-3 py-2 text-right tabular-nums">({formatRupiah(potonganAbsensi)})</td>
          </tr>
          <tr className="text-rose-700">
            <td className="border border-slate-200 px-3 py-2">Potongan Utang</td>
            <td className="border border-slate-200 px-3 py-2 text-right tabular-nums">({formatRupiah(potonganUtang)})</td>
          </tr>
          <tr className="text-rose-700">
            <td className="border border-slate-200 px-3 py-2">Potongan Casbon</td>
            <td className="border border-slate-200 px-3 py-2 text-right tabular-nums">({formatRupiah(potonganCasbon)})</td>
          </tr>
          <tr className="bg-slate-50 font-bold">
            <td className="border border-slate-300 px-3 py-2.5">Total Potongan</td>
            <td className="border border-slate-300 px-3 py-2.5 text-right tabular-nums">({formatRupiah(totalPotongan)})</td>
          </tr>
          <tr className="bg-teal-50 font-bold">
            <td className="border border-teal-300 px-3 py-2.5 text-teal-800">GAJI BERSIH DITERIMA</td>
            <td className="border border-teal-300 px-3 py-2.5 text-right text-teal-800 tabular-nums">{formatRupiah(slip.gajiBersih)}</td>
          </tr>
        </tbody>
      </table>

      <div className="mt-10">
        <SignatureRow label="Pimpinan PT Dapur Laut" />
      </div>
    </div>
  );
}
