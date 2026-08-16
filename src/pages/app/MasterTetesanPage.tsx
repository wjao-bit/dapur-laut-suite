import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { FlaskConical, Boxes, Droplets } from "lucide-react";
import { PageHeader, SectionCard } from "@/components/app/ui";
import { MasterCrud } from "@/components/app/MasterCrud";
import { formatCurrency } from "@/lib/business";

/**
 * Master Data Toko (Tetesan):
 *  - Bahan Baku : kode, nama, harga modal, stok awal, kategori.
 *                 Dipakai otomatis oleh Invoice Modal.
 *  - Barang Jadi: kode, nama, harga jual, stok awal, kategori.
 *                 Dipakai otomatis oleh Invoice Penjualan.
 * Stok awal master langsung disinkronkan ke tabel stok Tetesan (upsertBahanBaku /
 * upsertBarangJadi menangani pembuatan baris stok otomatis).
 */
export default function MasterTetesanPage() {
  const [tab, setTab] = useState<"Baku" | "Jadi">("Baku");

  const bahanBaku = useQuery(api.queries.listBahanBaku);
  const barangJadi = useQuery(api.queries.listBarangJadi);
  const stokRows = useQuery(api.queries.listTetesanStok);

  const totalStokBaku = (stokRows ?? [])
    .filter((s: any) => s.tipe === "Baku")
    .reduce((sum: number, s: any) => sum + Math.max(0, s.stokAkhir), 0);
  const totalStokJadi = (stokRows ?? [])
    .filter((s: any) => s.tipe === "Jadi")
    .reduce((sum: number, s: any) => sum + Math.max(0, s.stokAkhir), 0);

  return (
    <div>
      <PageHeader
        title="Master Data Tetesan"
        description="Master data toko Tetesan terpisah dua: Bahan Baku (harga modal) & Barang Jadi (harga jual). Semua transaksi invoice Modal / Penjualan otomatis terhubung ke master ini."
        icon={FlaskConical}
      />

      {/* Ringkasan stok */}
      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <SectionCard title="Jenis Bahan Baku">
          <p className="text-2xl font-bold text-sky-600 tabular-nums">{bahanBaku?.length ?? 0}</p>
          <p className="text-xs text-muted-foreground">terdaftar di master</p>
        </SectionCard>
        <SectionCard title="Jenis Barang Jadi">
          <p className="text-2xl font-bold text-emerald-600 tabular-nums">{barangJadi?.length ?? 0}</p>
          <p className="text-xs text-muted-foreground">terdaftar di master</p>
        </SectionCard>
        <SectionCard title="Total Stok Tetesan">
          <p className="text-2xl font-bold text-primary tabular-nums">
            {totalStokBaku + totalStokJadi}
            <span className="ml-1 text-xs font-medium text-muted-foreground">
              ({totalStokBaku} baku · {totalStokJadi} jadi)
            </span>
          </p>
          <p className="text-xs text-muted-foreground">unit dari stok awal + transaksi</p>
        </SectionCard>
      </div>

      {/* Tab Bahan Baku / Barang Jadi */}
      <div className="mb-4 inline-flex rounded-lg border bg-muted/40 p-1">
        <button
          type="button"
          onClick={() => setTab("Baku")}
          className={`flex cursor-pointer items-center gap-2 rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
            tab === "Baku" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Droplets className="size-4 text-sky-600" />
          Barang Baku
        </button>
        <button
          type="button"
          onClick={() => setTab("Jadi")}
          className={`flex cursor-pointer items-center gap-2 rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
            tab === "Jadi" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Boxes className="size-4 text-emerald-600" />
          Barang Jadi
        </button>
      </div>

      {tab === "Baku" ? (
        <MasterCrud
          title="Bahan Baku"
          description="Bahan baku untuk Invoice Modal (harga modal). Stok awal otomatis masuk ke stok Tetesan."
          icon={Droplets}
          rows={bahanBaku as any}
          loading={bahanBaku === undefined}
          keyField="kode"
          idPrefix="BBK"
          upsertFn={api.business.upsertBahanBaku}
          table="bahanBaku"
          searchKeys={["kode", "nama", "kategori"]}
          columns={[
            { key: "kode", label: "Kode", sortValue: (r) => r.kode, render: (r) => <span className="font-semibold text-foreground">{r.kode}</span> },
            { key: "nama", label: "Nama Bahan Baku", sortValue: (r) => r.nama, render: (r) => r.nama },
            {
              key: "hargaModal",
              label: "Harga Modal",
              align: "right",
              sortValue: (r) => r.hargaModal,
              render: (r) => <span className="tabular-nums text-sky-600">{formatCurrency(r.hargaModal)}</span>,
            },
            { key: "stokAwal", label: "Stok Awal", align: "right", sortValue: (r) => r.stokAwal, render: (r) => <span className="tabular-nums">{r.stokAwal}</span> },
            { key: "kategori", label: "Kategori", render: (r) => r.kategori || "—" },
          ]}
          fields={[
            { key: "kode", label: "Kode Bahan Baku", required: true, placeholder: "BBK-001" },
            { key: "nama", label: "Nama Bahan Baku", required: true, placeholder: "Tepung Terigu" },
            { key: "hargaModal", label: "Harga Modal (Rp)", type: "number", required: true, min: 0 },
            { key: "stokAwal", label: "Stok Awal", type: "number", min: 0 },
            { key: "kategori", label: "Kategori", placeholder: "Bahan Pokok / Ikan / Seafood" },
          ]}
        />
      ) : (
        <MasterCrud
          title="Barang Jadi"
          description="Barang jadi untuk Invoice Penjualan (harga jual). Stok awal otomatis masuk ke stok Tetesan."
          icon={Boxes}
          rows={barangJadi as any}
          loading={barangJadi === undefined}
          keyField="kode"
          idPrefix="BJK"
          upsertFn={api.business.upsertBarangJadi}
          table="barangJadi"
          searchKeys={["kode", "nama", "kategori"]}
          columns={[
            { key: "kode", label: "Kode", sortValue: (r) => r.kode, render: (r) => <span className="font-semibold text-foreground">{r.kode}</span> },
            { key: "nama", label: "Nama Barang Jadi", sortValue: (r) => r.nama, render: (r) => r.nama },
            {
              key: "hargaJual",
              label: "Harga Jual",
              align: "right",
              sortValue: (r) => r.hargaJual,
              render: (r) => <span className="tabular-nums text-emerald-600">{formatCurrency(r.hargaJual)}</span>,
            },
            { key: "stokAwal", label: "Stok Awal", align: "right", sortValue: (r) => r.stokAwal, render: (r) => <span className="tabular-nums">{r.stokAwal}</span> },
            { key: "kategori", label: "Kategori", render: (r) => r.kategori || "—" },
          ]}
          fields={[
            { key: "kode", label: "Kode Barang Jadi", required: true, placeholder: "BJK-001" },
            { key: "nama", label: "Nama Barang Jadi", required: true, placeholder: "Kerupuk Udang" },
            { key: "hargaJual", label: "Harga Jual (Rp)", type: "number", required: true, min: 0 },
            { key: "stokAwal", label: "Stok Awal", type: "number", min: 0 },
            { key: "kategori", label: "Kategori", placeholder: "Snack / Ikan / Seafood" },
          ]}
        />
      )}
    </div>
  );
}
