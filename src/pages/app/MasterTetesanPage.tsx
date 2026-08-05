// Master Data Tetesan — PT Dapur Laut (barang baku & barang jadi)
import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { MasterCrud } from "../../components/app/MasterCrud";
import { BadgeStatus, PrintButton } from "../../components/app/ui";
import { PrintFrame } from "../../components/app/PrintFrame";
import { formatCurrency } from "../../lib/format";
import { Database, Boxes, Save } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { toast } from "sonner";

type Jenis = "bahanBaku" | "barangJadi";

export default function MasterTetesanPage() {
  const [jenis, setJenis] = useState<Jenis>("bahanBaku");
  const bahanBaku = useQuery(api.queries.listBahanBaku);
  const barangJadi = useQuery(api.queries.listBarangJadi);
  const tetesanStok = useQuery(api.queries.listTetesanStok);
  const upsertStok = useMutation(api.business.upsertTetesanStok);

  const isBaku = jenis === "bahanBaku";
  const rows = isBaku ? (bahanBaku ?? []) : (barangJadi ?? []);

  // ---- Setting stok awal ----
  const [stokNama, setStokNama] = useState("");
  const [stokAwal, setStokAwal] = useState(0);
  const [stokTgl, setStokTgl] = useState("");
  const [savingStok, setSavingStok] = useState(false);

  const stokOptions = (tetesanStok ?? []).filter((s) => s.tipe === (isBaku ? "Baku" : "Jadi"));

  const handleSetStok = async () => {
    if (!stokNama) return toast.error("Pilih nama barang terlebih dahulu");
    setSavingStok(true);
    try {
      await upsertStok({
        doc: {
          id: (tetesanStok ?? []).find((s) => s.namaBarang === stokNama)?.id ?? undefined,
          namaBarang: stokNama,
          tipe: isBaku ? "Baku" : "Jadi",
          stokAwal: Number(stokAwal) || 0,
          tanggalStokAwal: stokTgl,
        },
      });
      toast.success("Stok awal berhasil disimpan");
      setStokNama("");
      setStokAwal(0);
      setStokTgl("");
    } catch (e: any) {
      toast.error(e?.data?.error ?? e?.message ?? "Gagal menyimpan stok");
    } finally {
      setSavingStok(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-xl bg-[#0f2f5e] text-amber-300 shadow-md">
            <Database className="size-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#0f2f5e]">Master Data Tetesan</h1>
            <p className="text-xs text-slate-500">Barang baku (modal) & barang jadi (penjualan) PT Dapur Laut</p>
          </div>
        </div>
        <PrintButton label="Cetak Master" />
      </div>

      {/* Tab switch */}
      <div className="flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
        {(["bahanBaku", "barangJadi"] as Jenis[]).map((j) => (
          <button
            key={j}
            onClick={() => setJenis(j)}
            className={`flex-1 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
              jenis === j ? "bg-[#0f2f5e] text-amber-300 shadow" : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            {j === "bahanBaku" ? "🧂 Barang Baku (Modal)" : "🍽️ Barang Jadi (Penjualan)"}
          </button>
        ))}
      </div>

      {/* Setting stok awal */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-3 flex items-center gap-2">
          <Boxes className="size-4 text-[#0f2f5e]" />
          <h3 className="text-sm font-bold text-[#0f2f5e]">Setting Stok Awal {isBaku ? "Barang Baku" : "Barang Jadi"}</h3>
        </div>
        <div className="grid gap-3 sm:grid-cols-4">
          <div className="sm:col-span-2">
            <Label className="text-xs font-medium">Nama Barang</Label>
            <select
              value={stokNama}
              onChange={(e) => setStokNama(e.target.value)}
              className="mt-1.5 flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
            >
              <option value="">— Pilih barang —</option>
              {stokOptions.map((s) => (
                <option key={s.id ?? s.namaBarang} value={s.namaBarang}>
                  {s.namaBarang} (stok saat ini: {s.stokAkhir})
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label className="text-xs font-medium">Stok Awal</Label>
            <Input
              type="number"
              min={0}
              className="mt-1.5"
              value={String(stokAwal)}
              onChange={(e) => setStokAwal(Number(e.target.value))}
              placeholder="0"
            />
          </div>
          <div>
            <Label className="text-xs font-medium">Tanggal</Label>
            <Input type="date" className="mt-1.5" value={stokTgl} onChange={(e) => setStokTgl(e.target.value)} />
          </div>
        </div>
        <Button className="mt-3" onClick={handleSetStok} disabled={savingStok}>
          <Save className="mr-2 size-4" />
          {savingStok ? "Menyimpan..." : "Simpan Stok Awal"}
        </Button>
      </div>

      {/* CRUD */}
      <MasterCrud
        title={isBaku ? "Barang Baku" : "Barang Jadi"}
        description={isBaku ? "Bahan baku untuk invoice modal" : "Barang jadi untuk invoice penjualan"}
        icon={Database}
        rows={rows}
        loading={!bahanBaku || !barangJadi}
        columns={
          isBaku
            ? [
                { key: "kode", label: "Kode" },
                { key: "nama", label: "Nama Barang Baku" },
                { key: "kategori", label: "Kategori" },
                { key: "hargaModal", label: "Harga Modal", render: (r: any) => formatCurrency(r.hargaModal ?? 0) },
                { key: "stokAwal", label: "Stok Awal", render: (r: any) => <BadgeStatus status={(r.stokAwal ?? 0) > 0 ? "Hadir" : "Alpa"} className="w-14 text-center">{r.stokAwal ?? 0}</BadgeStatus> },
              ]
            : [
                { key: "kode", label: "Kode" },
                { key: "nama", label: "Nama Barang Jadi" },
                { key: "kategori", label: "Kategori" },
                { key: "hargaJual", label: "Harga Jual", render: (r: any) => formatCurrency(r.hargaJual ?? 0) },
                { key: "stokAwal", label: "Stok", render: (r: any) => <BadgeStatus status={(r.stokAwal ?? 0) > 0 ? "Hadir" : "Alpa"} className="w-14 text-center">{r.stokAwal ?? 0}</BadgeStatus> },
              ]
        }
        fields={
          isBaku
            ? [
                { key: "kode", label: "Kode Barang", required: true, placeholder: "contoh: BB001" },
                { key: "nama", label: "Nama Barang Baku", required: true, placeholder: "contoh: Tepung Terigu" },
                { key: "kategori", label: "Kategori", placeholder: "contoh: Bahan Pokok" },
                { key: "hargaModal", label: "Harga Modal (Rp)", type: "number", required: true },
                { key: "stokAwal", label: "Stok Awal", type: "number", placeholder: "0" },
              ]
            : [
                { key: "kode", label: "Kode Barang", required: true, placeholder: "contoh: BJ001" },
                { key: "nama", label: "Nama Barang Jadi", required: true, placeholder: "contoh: Roti Isi" },
                { key: "kategori", label: "Kategori", placeholder: "contoh: Olahan" },
                { key: "hargaJual", label: "Harga Jual (Rp)", type: "number", required: true },
                { key: "stokAwal", label: "Stok Awal", type: "number", placeholder: "0" },
              ]
        }
        keyField="kode"
        idPrefix={isBaku ? "BB" : "BJ"}
        upsertFn={isBaku ? api.business.upsertBahanBaku : api.business.upsertBarangJadi}
        table={jenis}
        searchKeys={["kode", "nama", "kategori"]}
      />

      {/* Printable master list */}
      <PrintFrame title={`Master Data ${isBaku ? "Barang Baku" : "Barang Jadi"} — PT Dapur Laut`}>
        <table className="w-full border-collapse text-left text-xs">
          <thead>
            <tr className="border-b-2 border-[#0f2f5e] text-[#0f2f5e]">
              <th className="px-2 py-2">No</th>
              <th className="px-2 py-2">Kode</th>
              <th className="px-2 py-2">Nama Barang</th>
              <th className="px-2 py-2">Kategori</th>
              <th className="px-2 py-2 text-right">{isBaku ? "Harga Modal" : "Harga Jual"}</th>
              <th className="px-2 py-2 text-right">Stok</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((b, i) => (
              <tr key={b._id ?? i} className="border-b border-slate-200">
                <td className="px-2 py-1.5">{i + 1}</td>
                <td className="px-2 py-1.5 font-mono">{b.kode}</td>
                <td className="px-2 py-1.5">{b.nama}</td>
                <td className="px-2 py-1.5">{b.kategori || "Umum"}</td>
                <td className="px-2 py-1.5 text-right">{formatCurrency((b as any).hargaModal ?? (b as any).hargaJual ?? 0)}</td>
                <td className="px-2 py-1.5 text-right">{b.stokAwal ?? 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </PrintFrame>
    </div>
  );
}
