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
          

[FILE_TOO_LARGE]: The combined read_files output exceeded the 100.000 character hard limit. This file was truncated after 4.328 characters. Read it separately or use code_search for the relevant section.