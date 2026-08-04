import { useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
import { CalendarCheck, Check, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeader, SectionCard, BadgeStatus } from "@/components/app/ui";
import { DataTable, type Column } from "@/components/app/DataTable";
import { formatDate, todayStr, thisMonth } from "@/lib/format";
import { ABSENSI_STATUSES } from "@/lib/business";
import { cn } from "@/lib/utils";

const STATUS_COLOR: Record<string, string> = {
  Hadir: "bg-emerald-600 text-white hover:bg-emerald-700",
  Izin: "bg-amber-500 text-white hover:bg-amber-600",
  Sakit: "bg-orange-500 text-white hover:bg-orange-600",
  Alpa: "bg-rose-600 text-white hover:bg-rose-700",
};

export default function AbsensiPage() {
  const karyawan = useQuery(api.queries.listKaryawan);
  const absensi = useQuery(api.queries.listAbsensi, {});
  const upsertAbsensi = useMutation(api.business.upsertAbsensi);

  const [tanggal, setTanggal] = useState(todayStr());
  const [idKaryawan, setIdKaryawan] = useState("");
  const [jamMasuk, setJamMasuk] = useState("08:00");
  const [jamKeluar, setJamKeluar] = useState("17:00");
  const [filterKaryawan, setFilterKaryawan] = useState("");
  const [filterPeriode, setFilterPeriode] = useState(thisMonth());

  const filtered = useMemo(() => {
    if (!absensi) return absensi;
    return absensi.filter(
      (a: any) =>
        (!filterKaryawan || a.idKaryawan === filterKaryawan) &&
        a.tanggal.startsWith(filterPeriode),
    );
  }, [absensi, filterKaryawan, filterPeriode]);

  const summary = useMemo(() => {
    const c = { Hadir: 0, Izin: 0, Sakit: 0, Alpa: 0 };
    for (const a of filtered ?? []) c[a.status as keyof typeof c]++;
    return c;
  }, [filtered]);

  const namaKaryawan = (id: string) => karyawan?.find((k: any) => k.id === id)?.nama ?? id;

  const quickSet = async (status: string) => {
    if (!idKaryawan) {
      toast.error("Pilih karyawan terlebih dahulu");
      return;
    }
    try {
      await upsertAbsensi({
        doc: {
          id: `ABS-${tanggal}-${idKaryawan}`,
          idKaryawan,
          tanggal,
          status,
          jamMasuk: status === "Hadir" ? jamMasuk : "",
          jamKeluar: status === "Hadir" ? jamKeluar : "",
        },
      });
      toast.success(`Absensi ${namaKaryawan(idKaryawan)}: ${status}`);
    } catch (e: any) {
      toast.error(e?.data?.error ?? e?.message ?? "Gagal menyimpan");
    }
  };

  const columns: Column<any>[] = [
    { key: "tanggal", label: "Tanggal", sortValue: (r) => r.tanggal, render: (r) => formatDate(r.tanggal) },
    { key: "idKaryawan", label: "Karyawan", sortValue: (r) => r.idKaryawan, render: (r) => namaKaryawan(r.idKaryawan) },
    { key: "status", label: "Status", render: (r) => <BadgeStatus status={r.status} /> },
    { key: "jamMasuk", label: "Jam Masuk", render: (r) => r.jamMasuk || "—" },
    { key: "jamKeluar", label: "Jam Keluar", render: (r) => r.jamKeluar || "—" },
  ];

  return (
    <div>
      <PageHeader
        title="Absensi Harian"
        description="Catat kehadiran karyawan. Data ini otomatis dipakai di slip gaji sebagai potongan absensi."
        icon={CalendarCheck}
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <SectionCard title="Input Cepat Absensi" description="Pilih karyawan, tanggal, lalu tekan status">
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
                      {k.nama} ({k.id})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-medium">Tanggal *</Label>
              <Input type="date" className="mt-1.5" value={tanggal} onChange={(e) => setTanggal(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs font-medium">
                  <Clock className="mr-1 inline size-3" />
                  Masuk
                </Label>
                <Input type="time" className="mt-1.5" value={jamMasuk} onChange={(e) => setJamMasuk(e.target.value)} />
              </div>
              <div>
                <Label className="text-xs font-medium">Keluar</Label>
                <Input type="time" className="mt-1.5" value={jamKeluar} onChange={(e) => setJamKeluar(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1">
              {ABSENSI_STATUSES.map((s) => (
                <Button key={s} className={cn("justify-start", STATUS_COLOR[s])} onClick={() => quickSet(s)}>
                  <Check className="mr-1.5 size-3.5" />
                  {s}
                </Button>
              ))}
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Rekap Bulan Ini" description={`Periode ${filterPeriode}`} className="lg:col-span-2">
          <div className="mb-4 flex flex-wrap gap-2">
            {(["Hadir", "Izin", "Sakit", "Alpa"] as const).map((s) => (
              <div
                key={s}
                className={cn(
                  "flex-1 rounded-xl border px-4 py-3 text-center",
                  s === "Hadir" && "border-emerald-200 bg-emerald-50",
                  s === "Izin" && "border-amber-200 bg-amber-50",
                  s === "Sakit" && "border-orange-200 bg-orange-50",
                  s === "Alpa" && "border-rose-200 bg-rose-50",
                )}
              >
                <p className="text-2xl font-bold tabular-nums">{summary[s]}</p>
                <p className="text-xs font-medium text-muted-foreground">{s}</p>
              </div>
            ))}
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <div>
              <Label className="text-xs font-medium">Filter Karyawan</Label>
              <Select value={filterKaryawan} onValueChange={setFilterKaryawan}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder="Semua karyawan" />
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
              <Label className="text-xs font-medium">Periode</Label>
              <Input type="month" className="mt-1.5" value={filterPeriode} onChange={(e) => setFilterPeriode(e.target.value)} />
            </div>
          </div>
        </SectionCard>
      </div>

      <div className="mt-4">
        <DataTable
          columns={columns}
          rows={filtered as any}
          loading={absensi === undefined}
          keyField={(r) => r.id}
          emptyTitle="Belum ada data absensi"
          emptyDescription="Gunakan form input cepat di atas untuk mencatat absensi."
        />
      </div>
    </div>
  );
}
