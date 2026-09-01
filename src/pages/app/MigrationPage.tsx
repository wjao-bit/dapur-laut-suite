/**
 * Halaman Migrasi Data: Convex → Supabase
 */
import { useState, useCallback } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PageHeader, SectionCard } from "@/components/app/ui";
import { Database, ArrowRight, Check, Loader2, AlertTriangle } from "lucide-react";

function mapBarang(rows: any[]) {
  return rows.map((r) => ({ kode: r.kode, nama: r.nama, satuan: r.satuan || "kg", harga_modal: r.hargaModal ?? 0, kategori: r.kategori || "" }));
}
function mapSupplier(rows: any[]) {
  return rows.map((r) => ({ nama: r.nama, alamat: r.alamat || "", telepon: r.telepon || "" }));
}
function mapReseller(rows: any[]) {
  return rows.map((r) => ({ nama: r.nama, alamat: r.alamat || "", telepon: r.telepon || "" }));
}
function mapDpl(rows: any[]) {
  return rows.map((r) => ({ nama_pasar: r.namaPasar, alamat: r.alamat || "" }));
}
function mapPasar(rows: any[]) {
  return rows.map((r) => ({ nama_pasar: r.namaPasar, alamat: r.alamat || "" }));
}
function mapKaryawan(rows: any[]) {
  return rows.map((r) => ({ nama: r.nama, jabatan: r.jabatan || "", gaji: r.gaji ?? 0 }));
}
function mapGudang(rows: any[]) {
  return rows.map((r) => ({ nama_barang: r.namaBarang, stok_awal: r.stokAwal ?? 0, stok_min: r.stokMin ?? 5, keterangan: r.keterangan || "" }));
}
function mapInvoice(rows: any[]) {
  return rows.map((r) => ({
    id_invoice: r.idInvoice, tanggal: r.tanggal, tipe: r.tipe, nama_pihak: r.namaPihak,
    items: r.items ?? [], total: r.total ?? 0, total_penjualan: r.totalPenjualan ?? 0,
    margin: r.margin ?? 0, status_pembayaran: r.statusPembayaran || "Pending",
  }));
}
function mapKas(rows: any[]) {
  return rows.map((r) => ({
    id_kas: r.idKas || "", tanggal: r.tanggal, keterangan: r.keterangan || "",
    kas_masuk: r.kasMasuk ?? 0, kas_keluar: r.kasKeluar ?? 0,
    saldo_awal: r.saldoAwal ?? 0, saldo_akhir: r.saldoAkhir ?? 0, sumber: r.sumber || "Manual",
  }));
}
function mapPengeluaran(rows: any[]) {
  return rows.map((r) => ({
    id_pengeluaran: r.idPengeluaran || "", tanggal: r.tanggal,
    jenis: r.jenis || "Operasional", nominal: r.nominal ?? 0, keterangan: r.keterangan || "",
  }));
}
function mapStokHistory(rows: any[]) {
  return rows.map((r) => ({ nama_barang: r.namaBarang, perubahan: r.perubahan ?? 0, keterangan: r.keterangan || "", tanggal: r.tanggal, asal: r.asal || "" }));
}
function mapRetur(rows: any[]) {
  return rows.map((r) => ({ id_retur: r.idRetur || "", tanggal: r.tanggal, tipe: r.tipe || "", nama_pihak: r.namaPihak || "", items: r.items ?? [], total: r.total ?? 0 }));
}
function mapAbsensi(rows: any[]) {
  return rows.map((r) => ({ id_karyawan: r.idKaryawan || "", tanggal: r.tanggal, status: r.status || "Hadir", jam_masuk: r.jamMasuk || "", jam_keluar: r.jamKeluar || "" }));
}
function mapUtang(rows: any[]) {
  return rows.map((r) => ({ id_karyawan: r.idKaryawan || "", tanggal: r.tanggal, nominal: r.nominal ?? 0, keterangan: r.keterangan || "", status: r.status || "Belum Lunas" }));
}
function mapSlipGaji(rows: any[]) {
  return rows.map((r) => ({ id_karyawan: r.idKaryawan || "", periode: r.periode || "", gaji_pokok: r.gajiPokok ?? 0, bonus: r.bonus ?? 0, potongan: r.potongan ?? 0, total: r.total ?? 0 }));
}

async function batchInsert(table: string, rows: any[], onProgress: (msg: string) => void): Promise<{ ok: number; fail: number; error?: string }> {
  if (rows.length === 0) return { ok: 0, fail: 0 };
  let ok = 0; let fail = 0; let lastError = "";
  for (let i = 0; i < rows.length; i += 50) {
    const batch = rows.slice(i, i + 50);
    onProgress(`${table}: insert ${i + 1}–${Math.min(i + 50, rows.length)} dari ${rows.length}`);
    const { error } = await supabase.from(table).insert(batch);
    if (error) { lastError = error.message; fail += batch.length; } else { ok += batch.length; }
  }
  return { ok, fail, error: lastError };
}

type TableConfig = { supabaseTable: string; label: string; getData: () => any[] | undefined; mapFn: (rows: any[]) => any[] };

export default function MigrationPage() {
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState<Record<string, { ok: number; fail: number; error?: string }>>({});
  const [progress, setProgress] = useState("");

  const barang = useQuery(api.queries.listBarang);
  const supplier = useQuery(api.queries.listSupplier);
  const reseller = useQuery(api.queries.listReseller);
  const dpl = useQuery(api.queries.listDpl);
  const pasar = useQuery(api.queries.listPasar);
  const karyawan = useQuery(api.queries.listKaryawan);
  const gudang = useQuery(api.queries.listGudang);
  const invoices = useQuery(api.queries.listInvoice, {});
  const kas = useQuery(api.queries.listKas, {});
  const pengeluaran = useQuery(api.queries.listPengeluaran, {});
  const stokHistory = useQuery(api.queries.listStokHistory, {});
  const retur = useQuery(api.queries.listRetur, {});
  const absensi = useQuery(api.queries.listAbsensi, {});
  const utang = useQuery(api.queries.listUtang, {});
  const slipGaji = useQuery(api.queries.listSlipGaji, {});

  const allLoaded =
    barang !== undefined && supplier !== undefined && reseller !== undefined && dpl !== undefined &&
    pasar !== undefined && karyawan !== undefined && gudang !== undefined && invoices !== undefined &&
    kas !== undefined && pengeluaran !== undefined && stokHistory !== undefined && retur !== undefined &&
    absensi !== undefined && utang !== undefined && slipGaji !== undefined;

  const totalRecords =
    (barang?.length ?? 0) + (supplier?.length ?? 0) + (reseller?.length ?? 0) + (dpl?.length ?? 0) +
    (pasar?.length ?? 0) + (karyawan?.length ?? 0) + (gudang?.length ?? 0) + (invoices?.length ?? 0) +
    (kas?.length ?? 0) + (pengeluaran?.length ?? 0) + (stokHistory?.length ?? 0) + (retur?.length ?? 0) +
    (absensi?.length ?? 0) + (utang?.length ?? 0) + (slipGaji?.length ?? 0);

  const runMigration = useCallback(async () => {
    if (!allLoaded) { toast.error("Data Convex belum selesai dimuat."); return; }
    setRunning(true); setDone({}); setProgress("Memulai migrasi...");
    const tables: TableConfig[] = [
      { supabaseTable: "barang", label: "Barang", getData: () => barang, mapFn: mapBarang },
      { supabaseTable: "supplier", label: "Supplier", getData: () => supplier, mapFn: mapSupplier },
      { supabaseTable: "reseller", label: "Reseller", getData: () => reseller, mapFn: mapReseller },
      { supabaseTable: "dpl", label: "DPL", getData: () => dpl, mapFn: mapDpl },
      { supabaseTable: "pasar", label: "Pasar", getData: () => pasar, mapFn: mapPasar },
      { supabaseTable: "karyawan", label: "Karyawan", getData: () => karyawan, mapFn: mapKaryawan },
      { supabaseTable: "gudang", label: "Gudang", getData: () => gudang, mapFn: mapGudang },
      { supabaseTable: "invoice", label: "Invoice", getData: () => invoices, mapFn: mapInvoice },
      { supabaseTable: "kas", label: "Kas", getData: () => kas, mapFn: mapKas },
      { supabaseTable: "pengeluaran", label: "Pengeluaran", getData: () => pengeluaran, mapFn: mapPengeluaran },
      { supabaseTable: "stok_history", label: "Stok History", getData: () => stokHistory, mapFn: mapStokHistory },
      { supabaseTable: "retur", label: "Retur", getData: () => retur, mapFn: mapRetur },
      { supabaseTable: "absensi", label: "Absensi", getData: () => absensi, mapFn: mapAbsensi },
      { supabaseTable: "utang", label: "Utang", getData: () => utang, mapFn: mapUtang },
      { supabaseTable: "slipgaji", label: "Slip Gaji", getData: () => slipGaji, mapFn: mapSlipGaji },
    ];
    const results: Record<string, { ok: number; fail: number; error?: string }> = {};
    for (const t of tables) {
      const raw = t.getData();
      if (!raw || raw.length === 0) { results[t.supabaseTable] = { ok: 0, fail: 0 }; continue; }
      const mapped = t.mapFn(raw);
      const result = await batchInsert(t.supabaseTable, mapped, (msg) => setProgress(msg));
      results[t.supabaseTable] = result;
      setDone({ ...results });
    }
    setProgress("Migrasi selesai!"); setRunning(false);
    toast.success("Migrasi selesai!");
  }, [allLoaded, barang, supplier, reseller, dpl, pasar, karyawan, gudang, invoices, kas, pengeluaran, stokHistory, retur, absensi, utang, slipGaji]);

  return (
    <div>
      <PageHeader title="Migrasi Data" description="Pindahkan data dari Convex ke Supabase." icon={Database} />
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <SectionCard title="Convex Source">
          <p className="text-sm text-muted-foreground">capable-boar-593</p>
          <p className="text-lg font-bold">{allLoaded ? totalRecords : "..."}</p>
        </SectionCard>
        <SectionCard title="Supabase Target">
          <p className="text-sm text-muted-foreground">eggcsogywefwdbsqynkyz</p>
          <p className="text-lg font-bold text-blue-600">Ready</p>
        </SectionCard>
        <SectionCard title="Status">
          <p className={`text-lg font-bold ${Object.keys(done).length > 0 ? "text-emerald-600" : "text-muted-foreground"}`}>
            {Object.keys(done).length > 0 ? `${Object.values(done).reduce((s, d) => s + d.ok, 0)} OK` : "Belum dijalankan"}
          </p>
        </SectionCard>
        <SectionCard title="Progress">
          <p className="text-xs text-muted-foreground break-words">{progress || "Siap"}</p>
        </SectionCard>
      </div>
      {allLoaded && (
        <div className="mb-6 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs font-medium text-muted-foreground">
                <th className="py-2 pr-4">Tabel</th>
                <th className="py-2 pr-4 text-right">Records</th>
                <th className="py-2 pr-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["barang", barang], ["supplier", supplier], ["reseller", reseller], ["dpl", dpl],
                ["pasar", pasar], ["karyawan", karyawan], ["gudang", gudang], ["invoice", invoices],
                ["kas", kas], ["pengeluaran", pengeluaran], ["stok_history", stokHistory],
                ["retur", retur], ["absensi", absensi], ["utang", utang], ["slipgaji", slipGaji],
              ].map(([name, data]) => {
                const count = (data as any[])?.length ?? 0;
                const status = done[name as string];
                return (
                  <tr key={name} className="border-b border-border/40">
                    <td className="py-2 pr-4 font-mono text-xs">{String(name)}</td>
                    <td className="py-2 pr-4 text-right tabular-nums">{count}</td>
                    <td className="py-2 pr-4 text-center">
                      {status ? (
                        status.fail > 0 ? (
                          <span className="text-xs text-amber-600">{status.ok} OK / {status.fail} fail</span>
                        ) : (
                          <span className="text-xs text-emerald-600"><Check className="inline size-3" /> {status.ok} OK</span>
                        )
                      ) : <span className="text-xs text-muted-foreground">—</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <div className="flex items-center gap-3">
        <Button className="cursor-pointer" onClick={runMigration} disabled={running || !allLoaded}>
          {running ? (
            <><Loader2 className="mr-2 size-4 animate-spin" /> Migrasi berjalan...</>
          ) : (
            <><ArrowRight className="mr-2 size-4" /> Mulai Migrasi Convex → Supabase</>
          )}
        </Button>
        {!allLoaded && (
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            <AlertTriangle className="size-3" /> Menunggu data Convex dimuat...
          </p>
        )}
      </div>
    </div>
  );
}
