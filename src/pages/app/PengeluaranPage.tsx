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
import { NumInput } from "@/components/app/NumInput";
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
            

[FILE_TOO_LARGE]: The combined read_files output exceeded the 100.000 character hard limit. This file was truncated after 4.354 characters. Read it separately or use code_search for the relevant section.