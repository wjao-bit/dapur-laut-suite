import { useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
import { Wallet, Plus, ArrowDownCircle, ArrowUpCircle, PiggyBank } from "lucide-react";
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
import { PageHeader, SectionCard, BadgeStatus } from "@/components/app/ui";
import { DataTable, type Column } from "@/components/app/DataTable";
import { formatRupiah, formatDate, todayStr, genId } from "@/lib/format";
import { cn } from "@/lib/utils";

export default function KasPage() {
  const kas = useQuery(api.queries.listKas, {});
  const upsertKasManual = useMutation(api.business.upsertKasManual);
  const setSaldoAwalKas = useMutation(api.business.setSaldoAwalKas);

  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"masuk" | "keluar">("masuk");
  const [id, setId] = useState(() => genId("KAS"));
  const [tanggal, setTanggal] = useState(todayStr());
  const [nominal, setNominal] = useState(0);
  const [keterangan, setKeterangan] = useState("");
  const [saldoDialog, setSaldoDialog] = useState(false);
  const [saldoAwal, setSaldoAwal] = useState(0);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [saving, setSaving] = useState(false);

  const filtered = useMemo(() => {
    if (!kas) return kas;
    return kas.filter((k: any) => (!from || k.tanggal >= from) && (!to || k.tanggal <= to));
  }, [kas, from, to]);

  const summary = useMemo(() => {
    let masuk = 0;
    let keluar = 0;
    for (const k of filtered ?? []) {
      masuk += k.kasMasuk;
      keluar += k.kasKeluar;
    }
    return { masuk, keluar, saldo: masuk - keluar };
  }, [filtered]);

  const hasSaldoAwal = (kas ?? []).some((k: any) => k.id === "KAS-AWAL");

  const handleSave = async () => {
    setSaving(true);
    try {
      await upsertKasManual({
        doc: {
          id,
          tanggal,
          kasMasuk: mode === "masuk" ? Number(nominal) : 0,
          kasKeluar: mode === "keluar" ? Number(nominal) : 0,
          keterangan,
        },
      });
      toast.success(`Kas ${mode} dicatat`);
      setOpen(false);
      setId(genId("KAS"));
      setNominal(0);
      setKeterangan("");
    } catch (e: any) {
      toast.error(e?.data?.error ?? e?.message ?? "Gagal menyimpan kas");
    } finally {
      setSaving(false);
    }
  };

  const handleSaldoAwal = async () => {
    setSaving(true);
    try {
      await setSaldoAwalKas({ nominal: Number(saldoAwal) });
      toast.success("Saldo awal kas diperbarui");
      setSaldoDialog(false);
    } catch (e: any) {
      toast.error(e?.data?.error ?? e?.message ?? "Gagal");
    } finally {
      setSaving(false);
    }
  };

  const columns: Column<any>[] = [
    { key: "tanggal", label: "Tanggal", sortValue: (r) => r.tanggal, render: (r) => formatDate(r.tanggal) },
    { key: "keterangan", label: "Keterangan", render: (r) => r.keterangan || "—" },
    { key: "sumber", label: "Sumber", render: (r) => <BadgeStatus status={r.sumber} /> },
    {
      key: "kasMasuk",
      label: "Kas Masuk",
      align: "right",
      sortValue: (r) => r.kasMasuk,
      render: (r) => (
        <span className={cn("flex items-center justify-end gap-1 tabular-nums", r.kasMasuk > 0 ? "font-medium text-emerald-600" : "text-muted-foreground")}>
          {r.kasMasuk > 0 && <ArrowDownCircle className="size-3.5" />}
          {r.kasMasuk > 0 ? formatRupiah(r.kasMasuk) : "—"}
        </span>
      ),
    },
    {
      key: "kasKeluar",
      label: "Kas Keluar",
      align: "right",
      sortValue: (r) => r.kasKeluar,
      render: (r) => (
        <span className={cn("flex items-center justify-end gap-1 tabular-nums", r.kasKeluar > 0 ? "font-medium text-rose-600" : "text-muted-foreground")}>
          {r.kasKeluar > 0 && <ArrowUpCircle className="size-3.5" />}
          {r.kasKeluar > 0 ? formatRupiah(r.kasKeluar) : "—"}
        </span>
      ),
    },
    {
      key: "saldoAkhir",
      label: "Saldo Akhir",
      align: "right",
      sortValue: (r) => r.saldoAkhir,
      render: (r) => <span className="font-bold tabular-nums">{formatRupiah(r.saldoAkhir)}</span>,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Kas Harian"
        description="Kas masuk otomatis dari invoice penjualan & pembayaran utang; kas keluar dari pembelian, slip gaji, dan pengeluaran. SaldoAkhir = SaldoAwal + Masuk − Keluar."
        icon={Wallet}
        actions={
          <>
            <Button variant="outline" onClick={() => setSaldoDialog(true)}>
              <PiggyBank className="mr-2 size-4" />
              Set Saldo Awal
            </Button>
            <Button onClick={() => setOpen(true)}>
              <Plus className="mr-2 size-4" />
              Transaksi Kas Manual
            </Button>
          </>
        }
      />

      <div className="mb-4 grid grid-cols-3 gap-3">
        <SectionCard title="Total Kas Masuk" className="border-sky-200">
          <p className="text-2xl font-bold text-sky-600 tabular-nums">{formatRupiah(summary.masuk)}</p>
        </SectionCard>
        <SectionCard title="Total Kas Keluar" className="border-rose-200">
          <p className="text-2xl font-bold text-rose-600 tabular-nums">{formatRupiah(summary.keluar)}</p>
        </SectionCard>
        <SectionCard title="Saldo (filter)" className="border-teal-200">
          <p className="text-2xl font-bold text-teal-700 tabular-nums">{formatRupiah(summary.saldo)}</p>
        </SectionCard>
      </div>

      <div className="mb-4 flex flex-wrap items-end gap-2">
        <div>
          <Label className="text-xs font-medium">Dari</Label>
          <Input type="date" className="mt-1.5 w-40" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div>
          <Label className="text-xs font-medium">Sampai</Label>
          <Input type="date" className="mt-1.5 w-40" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
        {(from || to) && (
          <Button variant="ghost" size="sm" onClick={() => { setFrom(""); setTo(""); }}>
            Reset filter
          </Button>
        )}
      </div>

      {!hasSaldoAwal && !kas?.length && (
        <p className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          💡 Kas masih kosong. Atur <b>Saldo Awal</b> agar perhitungan saldo berjalan dimulai dari nilai yang benar.
        </p>
      )}

      <DataTable
        columns={columns}
        rows={filtered as any}
        loading={kas === undefined}
        keyField={(r) => r.id}
        emptyTitle="Belum ada transaksi kas"
        emptyDescription="Transaksi invoice, slip gaji, dan pengeluaran otomatis tercatat di sini."
      />

      {/* Manual kas */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Transaksi Kas Manual</DialogTitle>
            <DialogDescription>Catat kas masuk atau kas keluar di luar invoice/pengeluaran.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={mode === "masuk" ? "default" : "outline"}
                className={mode === "masuk" ? "bg-emerald-600 hover:bg-emerald-700" : ""}
                onClick={() => setMode("masuk")}
              >
                <ArrowDownCircle className="mr-1.5 size-4" /> Kas Masuk
              </Button>
              <Button
                variant={mode === "keluar" ? "default" : "outline"}
                className={mode === "keluar" ? "bg-rose-600 hover:bg-rose-700" : ""}
                onClick={() => setMode("keluar")}
              >
                <ArrowUpCircle className="mr-1.5 size-4" /> Kas Keluar
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs font-medium">Tanggal *</Label>
                <Input type="date" className="mt-1.5" value={tanggal} onChange={(e) => setTanggal(e.target.value)} />
              </div>
              <div>
                <Label className="text-xs font-medium">Nominal (Rp) *</Label>
                <Input type="number" min={1} className="mt-1.5" value={nominal} onChange={(e) => setNominal(Number(e.target.value))} />
              </div>
            </div>
            <div>
              <Label className="text-xs font-medium">Keterangan</Label>
              <Input className="mt-1.5" value={keterangan} onChange={(e) => setKeterangan(e.target.value)} placeholder="Contoh: setoran tunai / pembelian ATK" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Batal</Button>
            <Button onClick={handleSave} disabled={saving || nominal <= 0}>{saving ? "Menyimpan..." : "Simpan"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Saldo awal */}
      <Dialog open={saldoDialog} onOpenChange={setSaldoDialog}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Set Saldo Awal Kas</DialogTitle>
            <DialogDescription>Saldo awal menjadi dasar perhitungan saldo berjalan seluruh transaksi kas.</DialogDescription>
          </DialogHeader>
          <div>
            <Label className="text-xs font-medium">Nominal Saldo Awal (Rp) *</Label>
            <Input type="number" min={0} className="mt-1.5 text-lg font-semibold" value={saldoAwal} onChange={(e) => setSaldoAwal(Number(e.target.value))} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSaldoDialog(false)}>Batal</Button>
            <Button onClick={handleSaldoAwal} disabled={saving}>{saving ? "Menyimpan..." : "Simpan"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
