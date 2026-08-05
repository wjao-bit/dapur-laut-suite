import { useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
import { FlaskConical, Wheat, PackageCheck, Settings2, Boxes } from "lucide-react";
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
import { PageHeader, SectionCard } from "@/components/app/ui";
import { MasterCrud, type FieldDef } from "@/components/app/MasterCrud";
import { DataTable, type Column } from "@/components/app/DataTable";
import { useMutation } from "convex/react";
import { BadgeStatus } from "@/components/app/ui";
import { formatDate } from "@/lib/format";

const BAKU_FIELDS: FieldDef[] = [
  { key: "kode", label: "Kode Bahan Baku", required: true, placeholder: "BBK001" },
  { key: "nama", label: "Nama Bahan Baku", required: true, span: 2, placeholder: "mis. Tepung Terigu" },
  { key: "hargaModal", label: "Harga Modal", type: "number", required: true, min: 0 },
  { key: "stokAwal", label: "Stok Awal", type: "number", min: 0 },
  { key: "kategori", label: "Kategori", span: 2, placeholder: "mis. Bumbu, Kemasan, Bahan Pokok" },
];

const JADI_FIELDS: FieldDef[] = [
  { key: "kode", label: "Kode Barang Jadi", required: true, placeholder: "BJK001" },
  { key: "nama", label: "Nama Barang Jadi", required: true, span: 2, placeholder: "mis. Abon Ikan 250gr" },
  { key: "hargaJual", label: "Harga Jual", type: "number", required: true, min: 0 },
  { key: "stokAwal", label: "Stok Awal", type: "number", min: 0 },
  { key: "kategori", label: "Kategori", span: 2, placeholder: "mis. Makanan Jadi, Minuman" },
];

export default function MasterTetesanPage() {
  const [tab, setTab] = useState<"Baku" | "Jadi">("Baku");
  const bahanBaku = useQuery(api.queries.listBahanBaku);
  const barangJadi = useQuery(api.queries.listBarangJadi);
  const stokRows = useQuery(api.queries.listTetesanStok);
  const upsertStok = useMutation(api.business.upsertTetesanStok);

  const [stokDialog, setStokDialog] = useState(false);
  const [stokForm, setStokForm] = useState({ namaBarang: "", tipe: "Baku" as "Baku" | "Jadi", stokAwal: 0, tanggalStokAwal: "", keterangan: "" });

  const stokFiltered = useMemo(() => {
    if (!stokRows) return stokRows;
    return stokRows.filter((s) => s.tipe === tab);
  }, [stokRows, tab]);

  const masterRows = tab === "Baku" ? bahanBaku : barangJadi;

  const stokColumns: Column<any>[] = [
    { key: "namaBarang", label: "Nama Barang", sortValue: (r) => r.namaBarang, render: (r) => <span className="font-semibold">{r.namaBarang}</span> },
    { key: "tipe", label: "Tipe", render: (r) => <BadgeStatus status={r.tipe} /> },
    {
      key: "stokAwal",
      label: "Stok Awal",
      align: "right",
      render: (r) => (
        <span className="tabular-nums">
          {r.stokAwal}
          {r.tanggalStokAwal ? <span className="ml-1 text-[10px] text-muted-foreground">({formatDate(r.tanggalStokAwal)})</span> : null}
        </span>
      ),
    },
    { key: "stokMasuk", label: "Masuk", align: "right", render: (r) => <span className="tabular-nums text-emerald-600">+{r.stokMasuk}</span> },
    { key: "stokKeluar", label: "Keluar", align: "right", render: (r) => <span className="tabular-nums text-rose-600">-{r.stokKeluar}</span> },
    {
      key: "stokAkhir",
      label: "Stok Akhir",
      align: "right",
      render: (r) => (
        <span className={`font-bold tabular-nums ${r.stokAkhir <= 0 ? "text-rose-600" : "text-emerald-600"}`}>{r.stokAkhir}</span>
      ),
    },
  ];

  const openStokDialog = (row?: any) => {
    if (row) {
      setStokForm({
        namaBarang: row.namaBarang,
        tipe: row.tipe,
        stokAwal: row.stokAwal,
        tanggalStokAwal: row.tanggalStokAwal || "",
        keterangan: row.keterangan || "",
      });
    } else {
      setStokForm({ namaBarang: "", tipe: tab, stokAwal: 0, tanggalStokAwal: "", keterangan: "" });
    }
    setStokDialog(true);
  };

  const saveStok = async () => {
    try {
      await upsertStok({
        doc: {
          id: `TSTK-${Date.now().toString(36).toUpperCase()}`,
          namaBarang: stokForm.namaBarang,
          tipe: stokForm.tipe,
          stokAwal: Number(stokForm.stokAwal) || 0,
          tanggalStokAwal: stokForm.tanggalStokAwal,
          keterangan: stokForm.keterangan,
        },
      });
      toast.success(`Stok awal ${stokForm.namaBarang} disimpan`);
      setStokDialog(false);
    } catch (e: any) {
      toast.error(e?.data?.error ?? e?.message ?? "Gagal menyimpan stok awal");
    }
  };

  const bakuColumns: Column<any>[] = [
    { key: "kode", label: "Kode", sortValue: (r) => r.kode, render: (r) => <span className="font-semibold tabular-nums">{r.kode}</span> },
    { key: "nama", label: "Nama", sortValue: (r) => r.nama, render: (r) => r.nama },
    { key: "kategori", label: "Kategori", render: (r) => r.kategori || "—" },
    {
      key: "hargaModal",
      label: "Harga Modal",
      align: "right",
      render: (r) => (
        <span className="tabular-nums">
          {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(r.hargaModal)}
        </span>
      ),
    },
    {
      key: "stokAwal",
      label: "Stok Awal",
      align: "right",
      render: (r) => <span className="tabular-nums">{r.stokAwal}</span>,
    },
  ];

  const jadiColumns: Column<any>[] = [
    { key: "kode", label: "Kode", sortValue: (r) => r.kode, render: (r) => <span className="font-semibold tabular-nums">{r.kode}</span> },
    { key: "nama", label: "Nama", sortValue: (r) => r.nama, render: (r) => r.nama },
    { key: "kategori", label: "Kategori", render: (r) => r.kategori || "—" },
    {
      key: "hargaJual",
      label: "Harga Jual",
      align: "right",
      render: (r) => (
        <span className="tabular-nums">
          {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(r.hargaJual)}
        </span>
      ),
    },
    {
      key: "stokAwal",
      label: "Stok Awal",
      align: "right",
      render: (r) => <span className="tabular-nums">{r.stokAwal}</span>,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Master Data Tetesan"
        description="Master data terpisah: Bahan Baku (harga modal) & Barang Jadi (harga jual). Transaksi invoice tetesan otomatis terhubung ke master ini."
        icon={FlaskConical}
        actions={
          <Button variant="outline" onClick={() => openStokDialog()}>
            <Settings2 className="mr-2 size-4" />
            Set Stok Awal
          </Button>
        }
      />

      {/* Ringkasan */}
      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <SectionCard title="Bahan Baku">
          <p className="text-2xl font-bold text-sky-600 tabular-nums">{bahanBaku?.length ?? 0}</p>
          <p className="text-xs text-muted-foreground">master bahan baku terdaftar</p>
        </SectionCard>
        <SectionCard title="Barang Jadi">
          <p className="text-2xl font-bold text-emerald-600 tabular-nums">{barangJadi?.length ?? 0}</p>
          <p className="text-xs text-muted-foreground">master barang jadi terdaftar</p>
        </SectionCard>
        <SectionCard title="Stok Tetesan">
          <p className="text-2xl font-bold text-primary tabular-nums">{stokRows?.length ?? 0}</p>
          <p className="text-xs text-muted-foreground">baris stok (Baku + Jadi)</p>
        </SectionCard>
      </div>

      {/* Tab */}
      <div className="mb-4 inline-flex rounded-lg border bg-muted/40 p-1">
        {(["Baku", "Jadi"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`flex cursor-pointer items-center gap-1.5 rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
              tab === t ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t === "Baku" ? <Wheat className="size-3.5" /> : <PackageCheck className="size-3.5" />}
            {t === "Baku" ? "Bahan Baku" : "Barang Jadi"}
          </button>
        ))}
      </div>

      {tab === "Baku" ? (
        <MasterCrud
          title="Bahan Baku"
          description="Daftar bahan baku untuk Invoice Modal Tetesan. Harga modal tersimpan di database dan tidak tampil di invoice penjualan."
          icon={Wheat}
          rows={bahanBaku}
          loading={bahanBaku === undefined}
          columns={bakuColumns}
          fields={BAKU_FIELDS}
          keyField="kode"
          idPrefix="BBK"
          upsertFn={api.business.upsertBahanBaku}
          table="bahanBaku"
          searchKeys={["kode", "nama", "kategori"]}
          emptyTitle="Belum ada bahan baku"
          emptyDescription="Tambahkan bahan baku pertama untuk mulai mencatat invoice modal."
        />
      ) : (
        <MasterCrud
          title="Barang Jadi"
          description="Daftar barang jadi untuk Invoice Penjualan Tetesan. Stok barang jadi otomatis berkurang saat terjual."
          icon={PackageCheck}
          rows={barangJadi}
          loading={barangJadi === undefined}
          columns={jadiColumns}
          fields={JADI_FIELDS}
          keyField="kode"
          idPrefix="BJK"
          upsertFn={api.business.upsertBarangJadi}
          table="barangJadi"
          searchKeys={["kode", "nama", "kategori"]}
          emptyTitle="Belum ada barang jadi"
          emptyDescription="Tambahkan barang jadi pertama untuk mulai mencatat invoice penjualan."
        />
      )}

      {/* Stok Tetesan */}
      <div className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-base font-semibold">
            <Boxes className="size-4 text-primary" />
            Stok {tab === "Baku" ? "Bahan Baku" : "Barang Jadi"}
          </h2>
          <Button variant="outline" size="sm" onClick={() => openStokDialog()}>
            <Settings2 className="mr-1.5 size-3.5" />
            Set Stok Awal
          </Button>
        </div>
        <DataTable
          columns={stokColumns}
          rows={stokFiltered as any}
          loading={stokRows === undefined}
          keyField={(r) => r.namaBarang}
          emptyTitle="Belum ada baris stok"
          emptyDescription="Stok otomatis dibuat saat transaksi atau bisa di-set manual di atas."
        />
      </div>

      {/* Dialog set stok awal */}
      <Dialog open={stokDialog} onOpenChange={setStokDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Set Stok Awal Tetesan</DialogTitle>
            <DialogDescription>
              Atur stok awal per barang dengan tanggal. Riwayat transaksi tetap dipertahankan.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div>
              <Label className="text-xs font-medium">Nama Barang *</Label>
              <Input
                className="mt-1.5"
                placeholder="Ketik nama bahan baku / barang jadi"
                value={stokForm.namaBarang}
                onChange={(e) => setStokForm((f) => ({ ...f, namaBarang: e.target.value }))}
              />
            </div>
            <div>
              <Label className="text-xs font-medium">Tipe *</Label>
              <select
                className="mt-1.5 flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                value={stokForm.tipe}
                onChange={(e) => setStokForm((f) => ({ ...f, tipe: e.target.value as "Baku" | "Jadi" }))}
              >
                <option value="Baku">Bahan Baku</option>
                <option value="Jadi">Barang Jadi</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-medium">Stok Awal *</Label>
                <Input
                  className="mt-1.5"
                  type="number"
                  min={0}
                  value={stokForm.stokAwal}
                  onChange={(e) => setStokForm((f) => ({ ...f, stokAwal: Number(e.target.value) }))}
                />
              </div>
              <div>
                <Label className="text-xs font-medium">Tanggal Stok Awal</Label>
                <Input
                  className="mt-1.5"
                  type="date"
                  value={stokForm.tanggalStokAwal}
                  onChange={(e) => setStokForm((f) => ({ ...f, tanggalStokAwal: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <Label className="text-xs font-medium">Keterangan</Label>
              <Input
                className="mt-1.5"
                placeholder="mis. Stok opname awal periode"
                value={stokForm.keterangan}
                onChange={(e) => setStokForm((f) => ({ ...f, keterangan: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStokDialog(false)}>
              Batal
            </Button>
            <Button onClick={saveStok} disabled={!stokForm.namaBarang}>
              Simpan Stok Awal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
