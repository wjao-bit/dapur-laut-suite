import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { MasterCrud } from "@/components/app/MasterCrud";
import { Users } from "lucide-react";
import { formatRupiah } from "@/lib/format";

export default function KaryawanPage() {
  const rows = useQuery(api.queries.listKaryawan);
  return (
    <MasterCrud
      title="Karyawan"
      description="Data pegawai PT Dapur Laut. IDKaryawan UNIQUE — dipakai di absensi, utang, dan slip gaji."
      icon={Users}
      rows={rows as any}
      loading={rows === undefined}
      keyField="id"
      idPrefix="KRY"
      upsertFn={api.business.upsertKaryawan}
      table="karyawan"
      searchKeys={["id", "nama", "jabatan"]}
      columns={[
        { key: "id", label: "ID Karyawan", sortValue: (r) => r.id, render: (r) => <span className="font-semibold text-foreground">{r.id}</span> },
        { key: "nama", label: "Nama", sortValue: (r) => r.nama, render: (r) => r.nama },
        { key: "jabatan", label: "Jabatan", render: (r) => r.jabatan || "—" },
        { key: "gajiPokok", label: "Gaji Pokok", align: "right", sortValue: (r) => r.gajiPokok, render: (r) => <span className="tabular-nums">{formatRupiah(r.gajiPokok)}</span> },
        { key: "utangTotal", label: "Utang Total", align: "right", sortValue: (r) => r.utangTotal, render: (r) => (
            <span className={r.utangTotal > 0 ? "font-medium text-rose-600 tabular-nums" : "tabular-nums text-muted-foreground"}>
              {formatRupiah(r.utangTotal)}
            </span>
          ) },
      ]}
      fields={[
        { key: "id", label: "ID Karyawan", required: true, placeholder: "KRY-001" },
        { key: "nama", label: "Nama", required: true, placeholder: "Andi Wijaya" },
        { key: "jabatan", label: "Jabatan", placeholder: "Kepala Gudang" },
        { key: "gajiPokok", label: "Gaji Pokok (Rp)", type: "number", required: true, min: 0 },
      ]}
    />
  );
}
