import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { MasterCrud } from "@/components/app/MasterCrud";
import { Building2 } from "lucide-react";

export default function PasarPage() {
  const rows = useQuery(api.queries.listPasar);
  return (
    <MasterCrud
      title="Pasar (Victoria / Tunas)"
      description="Pasar penjualan langsung. IDPasar UNIQUE — sistem menghitung penjualan dari stok awal−akhir."
      icon={Building2}
      rows={rows as any}
      loading={rows === undefined}
      keyField="id"
      idPrefix="PAS"
      upsertFn={api.business.upsertPasar}
      table="pasar"
      searchKeys={["id", "namaPasar", "alamat", "kontak"]}
      columns={[
        { key: "id", label: "ID Pasar", sortValue: (r) => r.id, render: (r) => <span className="font-semibold text-foreground">{r.id}</span> },
        { key: "namaPasar", label: "Nama Pasar", sortValue: (r) => r.namaPasar, render: (r) => <span className="font-medium">{r.namaPasar}</span> },
        { key: "alamat", label: "Alamat", render: (r) => r.alamat || "—" },
        { key: "kontak", label: "Kontak", render: (r) => r.kontak || "—" },
      ]}
      fields={[
        { key: "id", label: "ID Pasar", required: true, placeholder: "PAS-001" },
        { key: "namaPasar", label: "Nama Pasar", required: true, placeholder: "Victoria / Tunas" },
        { key: "alamat", label: "Alamat", type: "textarea", span: 2 },
        { key: "kontak", label: "Kontak", placeholder: "021-5555-0001" },
      ]}
    />
  );
}
