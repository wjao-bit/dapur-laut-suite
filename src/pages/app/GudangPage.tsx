import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
import { Boxes, Plus, History, SlidersHorizontal, Printer } from "lucide-react";
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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { PageHeader, SectionCard, BadgeStatus } from "@/components/app/ui";
import { DataTable, type Column } from "@/components/app/DataTable";
import { PrintFrame } from "@/components/app/PrintFrame";
import { BarangSearch } from "@/components/app/BarangSearch";
import { formatDate, todayStr } from "@/lib/format";
import { cn } from "@/lib/utils";

export default function GudangPage() {
  const gudang = useQuery(api.queries.listGudang);
  const history = useQuery(api.queries.listStokHistory, {});
  const barang = useQuery(api.queries.listBarang);
  const upsertGudang = useMutation(api.business.upsertGudang);
  const adjustStok = useMutation(api.business.adjustStok);

  const [open, setOpen] = useState(false);
  const [namaBarang, setNamaBarang] = useState("");
  const [stokAwal, setStokAwal] = useState(0);
  const [tanggalStokAwal, setTanggalStokAwal] = useState(todayStr());
  const [keterangan, setKeterangan] = useState("");

  const [adjBarang, setAdjBarang] = useState<string | null>(null);
  const [adjStok, setAdjStok] = useState(0);
  const [adjKet, setAdjKet] = useState("");

  const [histBarang, setHistBarang] = useState<string | null>(null);
  const [printOpen, setPrintOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const histRows = (histBarang ? history?.filter((h: any) => h.namaBarang === histBarang) : []) ?? [];
  const totalStok = (gudang ?? []).reduce((s: number, g: any) => s + Math.max(0, g.stokAkhir), 0);

  const handleAdd = async () => {
    setSaving(true);
    try {
      await upsertGudang({
        doc: {
          id: `GDG-${Date.now().toString(36).toUpperCase()}`,
          namaBarang,
          stokAwal: Number(stokAwal),
          tanggalStokAwal,
          keterangan,
        },
      });
      toast.success(`${namaBarang} ditambahkan ke gudang`);
      setOpen(false);
      setNamaBarang("");
      setStokAwal(0);
      setTanggalStokAwal(todayStr());
      setKeterangan("");
    } catch (e: any) {
      toast.error(e?.data?.error ?? e?.message ?? "Gagal menambah");
    } finally {
      setSaving(false);
    }
  };

  const handleAdjust = async () => {
    if (!adjBarang) return;
    setSaving(true);
    try {
      await adjustStok({ namaBarang: adjBarang, stokBaru: Number(adjStok), keterangan: adjKet || undefined });
      toast.success(`Stok ${adjBarang} disesuaikan menjadi ${adjStok}`);
      setAdjBarang(null);
    } catch (e: any) {
      toast.error(e?.data?.error ?? e?.message ?? "Gagal menyesuaikan");
    } finally {
      setSaving(false);
    }
  };

  const columns: Column<any>[] = [
    { key: "namaBarang", label: "Nama Barang", sortValue: (r) => r.namaBarang, render: (r) => <span className="font-semibold text-foreground">{r.namaBarang}</span> },
    { key: "stokAwal", label: "Stok Awal", align: "right", sortValue: (r) => r.stokAwal, render: (r) => <span className="tabular-nums">{r.stokAwal}</span> },
    { key: "stokMasuk", label: "Stok Masuk", align: "right", sortValue: (r) => r.stokMasuk, render: (r) => <span className="tabular-nums text-emerald-600">+{r.stokMasuk}</span> },
    { key: "stokKeluar", label: "Stok Keluar", align: "right", sortValue: (r) => r.stokKeluar, render: (r) => <span className="tabular-nums text-rose-600">-{r.stokKeluar}</span> },
    {
      key: "stokAkhir",
      label: "Stok Akhir",
      align: "right",
      sortValue: (r) => r.stokAkhir,
      render: (r) => (
        <span className={cn("font-bold tabular-nums", r.stokAkhir < 0 ? "text-rose-600" : r.stokAkhir === 0 ? "text-muted-foreground" : "text-emerald-600")}>
          {r.stokAkhir}
        </span>
      ),
    },
    {
      key: "aksi",
      label: "",
      align: "right",
      render: (r) => (
        <div className="flex items-center justify-end gap-1">
          <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => { setAdjBarang(r.namaBarang); setAdjStok(r.stokAkhir); setAdjKet(""); }}>
            <SlidersHorizontal className="mr-1 size-3" />
            Set Stok
          </Button>
          <Button variant="ghost" size="icon" className="size-7" title="Riwayat stok" onClick={() => setHistBarang(r.namaBarang)}>
            <History className="size-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Gudang & Stok"
        description="Posisi stok dihitung dari riwayat perubahan (Supplier, Reseller, DPL, Pasar, Retur, Manual). Stok boleh minus."
        icon={Boxes}
        actions={
          <>
            <Button variant="outline" onClick={() => setPrintOpen(true)}>
              <Printer className="mr-2 size-4" />
              Cetak PDF
            </Button>
            <Button onClick={() => setOpen(true)}>
              <Plus className="mr-2 size-4" />
              Tambah ke Gudang
            </Button>
          </>
        }
      />

      <div className="mb-4 grid grid-cols-2 gap-3 sm:max-w-md">
        <SectionCard title="Total Stok (unit)">
          <p className="text-2xl font-bold text-emerald-600 tabular-nums">{totalStok.toLocaleString("id-ID")}</p>
        </SectionCard>
        <SectionCard title="Jenis Barang">
          <p className="text-2xl font-bold tabular-nums">{gudang?.length ?? "—"}</p>
        </SectionCard>
      </div>

      <DataTable
        columns={columns}
        rows={gudang as any}
        loading={gudang === undefined}
        keyField={(r) => r.namaBarang}
        emptyTitle="Gudang kosong"
        emptyDescription="Tambahkan barang atau buat invoice — stok akan tercatat otomatis."
      />

      {/* Tambah barang ke gudang */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Tambah Barang ke Gudang</DialogTitle>
            <DialogDescription>Barang yang belum ada di database tetap bisa masuk (stok boleh minus).</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs font-medium">Nama Barang *</Label>
              <BarangSearch
                className="mt-1.5"
                barang={(barang ?? []) as any}
                value={namaBarang}
                onChange={setNamaBarang}
                onPick={(b) => setNamaBarang(b.nama)}
                placeholder="Ketik nama barang…"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs font-medium">Stok Awal</Label>
                <Input type="number" inputMode="decimal" className="mt-1.5" value={stokAwal} onChange={(e) => setStokAwal(Number(e.target.value))} />
              </div>
              <div>
                <Label className="text-xs font-medium">Tgl Stok Awal</Label>
                <Input type="date" className="mt-1.5" value={tanggalStokAwal} onChange={(e) => setTanggalStokAwal(e.target.value)} />
              </div>
            </div>
            <div>
              <Label className="text-xs font-medium">Keterangan</Label>
              <Input className="mt-1.5" value={keterangan} onChange={(e) => setKeterangan(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Batal</Button>
            <Button onClick={handleAdd} disabled={saving || !namaBarang}>{saving ? "Menyimpan..." : "Simpan"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Set / sesuaikan stok */}
      <Dialog open={!!adjBarang} onOpenChange={(o) => !o && setAdjBarang(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Set Stok: {adjBarang}</DialogTitle>
            <DialogDescription>Menyesuaikan stok saat ini (dicatat sebagai riwayat Manual).</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs font-medium">Stok Baru *</Label>
              <Input type="number" inputMode="decimal" className="mt-1.5 text-lg font-semibold" value={adjStok} onChange={(e) => setAdjStok(Number(e.target.value))} />
            </div>
            <div>
              <Label className="text-xs font-medium">Keterangan</Label>
              <Input className="mt-1.5" value={adjKet} onChange={(e) => setAdjKet(e.target.value)} placeholder="Stok opname" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAdjBarang(null)}>Batal</Button>
            <Button onClick={handleAdjust} disabled={saving}>{saving ? "Menyimpan..." : "Simpan"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Riwayat stok */}
      <Sheet open={!!histBarang} onOpenChange={(o) => !o && setHistBarang(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Riwayat Stok: {histBarang}</SheetTitle>
            <SheetDescription>Asal perubahan stok di gudang.</SheetDescription>
          </SheetHeader>
          <div className="mt-4 space-y-2">
            {histRows.length === 0 && <p className="text-sm text-muted-foreground">Belum ada riwayat.</p>}
            {histRows.map((h: any) => (
              <div key={h.id} className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <div className="flex items-center gap-2">
                    <BadgeStatus status={h.tipe} />
                    <span className={cn("font-semibold tabular-nums", h.perubahan >= 0 ? "text-emerald-600" : "text-rose-600")}>
                      {h.perubahan >= 0 ? `+${h.perubahan}` : h.perubahan}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{h.keterangan || "—"}</p>
                </div>
                <span className="text-xs text-muted-foreground">{formatDate(h.tanggal)}</span>
              </div>
            ))}
          </div>
        </SheetContent>
      </Sheet>

      {/* Cetak PDF gudang */}
      <PrintFrame open={printOpen} onClose={() => setPrintOpen(false)} title="Laporan Stok Gudang — Dapur Laut">
        <GudangPrintDoc rows={gudang ?? []} />
      </PrintFrame>
    </div>
  );
}

/** Dokumen cetak stok gudang. */
export function GudangPrintDoc({ rows }: { rows: any[] }) {
  const total = rows.reduce((s: number, r: any) => s + Math.max(0, r.stokAkhir), 0);
  const td = "border border-slate-200 px-2 py-1.5 text-[13px]";
  const tdr = "border border-slate-200 px-2 py-1.5 text-right text-[13px] tabular-nums";
  return (
    <div>
      <div className="mb-4 flex items-center justify-between text-sm">
        <div>
          <p className="text-xs text-slate-500">Laporan Stok</p>
          <p className="text-lg font-bold text-slate-900">Laporan Stok Gudang</p>
        </div>
        <div className="text-right text-xs text-slate-500">
          <p>Tgl Cetak: {formatDate(todayStr())}</p>
          <p className="mt-0.5 font-semibold text-slate-700">Total Stok: {total.toLocaleString("id-ID")} unit</p>
        </div>
      </div>
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-slate-100 text-left text-xs text-slate-600 uppercase">
            <th className="border border-slate-200 px-2 py-2">Nama Barang</th>
            <th className="border border-slate-200 px-2 py-2 text-right">Stok Awal</th>
            <th className="border border-slate-200 px-2 py-2 text-right">Masuk</th>
            <th className="border border-slate-200 px-2 py-2 text-right">Keluar</th>
            <th className="border border-slate-200 px-2 py-2 text-right">Stok Akhir</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r: any) => (
            <tr key={r.namaBarang}>
              <td className={td + " font-medium"}>{r.namaBarang}</td>
              <td className={tdr}>{r.stokAwal}</td>
              <td className={tdr + " text-emerald-700"}>{r.stokMasuk}</td>
              <td className={tdr + " text-rose-700"}>{r.stokKeluar}</td>
              <td className={tdr + " font-bold"}>{r.stokAkhir}</td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={5} className={td + " text-center text-muted-foreground"}>Gudang kosong.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
