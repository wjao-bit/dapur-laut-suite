import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { MasterCrud } from "@/components/app/MasterCrud";
import { Package } from "lucide-react";
import { formatRupiah } from "@/lib/format";

export default function BarangPage() {
  const rows = useQuery(api.queries.listBarang);
  return (
    <MasterCrud
      title="Barang"
      description="Master data barang dagang. KodeBarang bersifat UNIQUE — input ulang akan memperbarui data (ON CONFLICT)."
      icon={Package}
      rows={rows as any}
      loading={rows === undefined}
      keyField="kode"
      idPrefix="BRG"
      upsertFn={api.business.upsertBarang}
      table="barang"
      searchKeys={["kode", "nama", "kategori"]}
      columns={[
        { key: "kode", label: "Kode Barang", sortValue: (r) => r.kode, render: (r) => <span className="font-semibold text-foreground">{r.kode}</span> },
        { key: "nama", label: "Nama Barang", sortValue: (r) => r.nama, render: (r) => r.nama },
        { key: "harga", label: "Harga", align: "right", sortValue: (r) => r.harga, render: (r) => <span className="tabular-nums">{formatRupiah(r.harga)}</span> },
        { key: "kategori", label: "Kategori", render: (r) => r.kategori || "—" },
      ]}
      fields={[
        { key: "kode", label: "Kode Barang", required: true, placeholder: "BRG-001" },
        { key: "nama", label: "Nama Barang", required: true, placeholder: "Kopi Bubuk" },
        { key: "harga", label: "Harga (Rp)", type: "number", required: true, min: 0 },
        { key: "kategori", label: "Kategori", placeholder: "Bahan Pokok / Ikan / Seafood" },
      ]}
    />
  );
}
