import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { MasterCrud } from "@/components/app/MasterCrud";
import { Store } from "lucide-react";

export default function ResellerPage() {
  const rows = useQuery(api.queries.listReseller);
  return (
    <MasterCrud
      title="Reseller"
      description="Pembeli perorangan/toko. IDReseller UNIQUE — penjualan ke reseller mengurangi stok gudang."
      icon={Store}
      rows={rows as any}
      loading={rows === undefined}
      keyField="id"
      idPrefix="RSL"
      upsertFn={api.business.upsertReseller}
      table="reseller"
      searchKeys={["id", "nama", "alamat", "kontak"]}
      columns={[
        { key: "id", label: "ID Reseller", sortValue: (r) => r.id, render: (r) => <span className="font-semibold text-foreground">{r.id}</span> },
        { key: "nama", label: "Nama Reseller", sortValue: (r) => r.nama, render: (r) => r.nama },
        { key: "alamat", label: "Alamat", render: (r) => r.alamat || "—" },
        { key: "kontak", label: "Kontak", render: (r) => r.kontak || "—" },
      ]}
      fields={[
        { key: "id", label: "ID Reseller", required: true, placeholder: "RSL-001" },
        { key: "nama", label: "Nama Reseller", required: true, placeholder: "Reseller A" },
        { key: "alamat", label: "Alamat", type: "textarea", span: 2 },
        { key: "kontak", label: "Kontak", placeholder: "0812-3456-7890" },
      ]}
    />
  );
}
