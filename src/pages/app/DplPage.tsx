import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { MasterCrud } from "@/components/app/MasterCrud";
import { Warehouse } from "lucide-react";

export default function DplPage() {
  const rows = useQuery(api.queries.listDpl);
  return (
    <MasterCrud
      title="DPL (Pasar Grosir)"
      description="Distributor pasar grosir. IDDPL UNIQUE — penjualan ke DPL mengurangi stok gudang."
      icon={Warehouse}
      rows={rows as any}
      loading={rows === undefined}
      keyField="id"
      idPrefix="DPL"
      upsertFn={api.business.upsertDpl}
      table="dpl"
      searchKeys={["id", "namaPasar", "alamat", "kontak"]}
      columns={[
        { key: "id", label: "ID DPL", sortValue: (r) => r.id, render: (r) => <span className="font-semibold text-foreground">{r.id}</span> },
        { key: "namaPasar", label: "Nama Pasar", sortValue: (r) => r.namaPasar, render: (r) => r.namaPasar },
        { key: "alamat", label: "Alamat", render: (r) => r.alamat || "—" },
        { key: "kontak", label: "Kontak", render: (r) => r.kontak || "—" },
      ]}
      fields={[
        { key: "id", label: "ID DPL", required: true, placeholder: "DPL-001" },
        { key: "namaPasar", label: "Nama Pasar", required: true, placeholder: "Pasar Induk Kramat Jati" },
        { key: "alamat", label: "Alamat", type: "textarea", span: 2 },
        { key: "kontak", label: "Kontak", placeholder: "021-8088-1000" },
      ]}
    />
  );
}
