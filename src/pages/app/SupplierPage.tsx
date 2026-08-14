import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { MasterCrud } from "@/components/app/MasterCrud";
import { Truck } from "lucide-react";

export default function SupplierPage() {
  const rows = useQuery(api.queries.listSupplier);
  return (
    <MasterCrud
      title="Supplier"
      description="Pemasok barang dagang. IDSupplier UNIQUE — pembelian dari supplier menambah stok gudang."
      icon={Truck}
      rows={rows as any}
      loading={rows === undefined}
      keyField="id"
      idPrefix="SUP"
      upsertFn={api.business.upsertSupplier}
      table="supplier"
      searchKeys={["id", "nama", "alamat", "kontak"]}
      columns={[
        { key: "id", label: "ID Supplier", sortValue: (r) => r.id, render: (r) => <span className="font-semibold text-foreground">{r.id}</span> },
        { key: "nama", label: "Nama Supplier", sortValue: (r) => r.nama, render: (r) => r.nama },
        { key: "alamat", label: "Alamat", render: (r) => r.alamat || "—" },
        { key: "kontak", label: "Kontak", render: (r) => r.kontak || "—" },
      ]}
      fields={[
        { key: "id", label: "ID Supplier", required: true, placeholder: "SUP-001" },
        { key: "nama", label: "Nama Supplier", required: true, placeholder: "CV Samudra Jaya" },
        { key: "alamat", label: "Alamat", type: "textarea", span: 2 },
        { key: "kontak", label: "Kontak", placeholder: "0812-3456-7890" },
      ]}
    />
  );
}
