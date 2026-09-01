import { supabase, isSupabaseReady } from "./supabase";

// =============================================================================
// Convex → Supabase Sync Utility
//
// This utility syncs data from Convex to Supabase tables.
// It converts camelCase Convex fields to snake_case Supabase fields.
// =============================================================================

interface SyncResult {
  table: string;
  synced: number;
  errors: string[];
}

// Field mapping: Convex camelCase → Supabase snake_case
const FIELD_MAP: Record<string, string> = {
  // Barang
  kode: "kode",
  nama: "nama",
  harga: "harga_modal",
  kategori: "kategori",
  
  // Supplier/Reseller
  id: "id",
  alamat: "alamat",
  kontak: "telepon",
  
  // DPL/Pasar
  namaPasar: "nama_pasar",
  
  // Karyawan
  jabatan: "jabatan",
  gajiPokok: "gaji",
  utangTotal: "utang_total",
  
  // Absensi
  idKaryawan: "id_karyawan",
  jamMasuk: "jam_masuk",
  jamKeluar: "jam_keluar",
  
  // Utang
  dibayar: "dibayar",
  tglBayar: "tgl_bayar",
  sisaUtang: "sisa_utang",
  jenis: "jenis",
  
  // Invoice
  idInvoice: "id_invoice",
  namaPihak: "nama_pihak",
  totalModal: "total_modal",
  totalPenjualan: "total_penjualan",
  statusPembayaran: "status_pembayaran",
  mataUang: "mata_uang",
  riwayatBayar: "riwayat_bayar",
  deletedAt: "deleted_at",
  
  // Kas
  kasMasuk: "kas_masuk",
  kasKeluar: "kas_keluar",
  saldoAwal: "saldo_awal",
  saldoAkhir: "saldo_akhir",
  sumber: "sumber",
  
  // Pengeluaran
  idPengeluaran: "id_pengeluaran",
  
  // Gudang
  namaBarang: "nama_barang",
  stokAwal: "stok_awal",
  stokMin: "stok_min",
  
  // Stok History
  perubahan: "perubahan",
  tipe: "tipe",
  
  // Retur
  idRetur: "id_retur",
  
  // Slip Gaji
  idSlipGaji: "id_slip_gaji",
  gajiBersih: "gaji_bersih",
  potonganAbsensi: "potongan_absensi",
  potonganUtang: "potongan_utang",
  potonganCasbon: "potongan_casbon",
  bonusKerajinan: "bonus_kerajinan",
  bonusBulanan: "bonus_bulanan",
  
  // Piutang
  idPiutang: "id_piutang",
  
  // Batch
  idBatch: "id_batch",
  namaSupplier: "nama_supplier",
  petugas: "petugas",
  catatan: "catatan",
  namaTujuan: "nama_tujuan",
  tujuan: "tujuan",
  
  // Tetesan
  tanggalStokAwal: "tanggal_stok_awal",
  hargaModal: "harga_modal",
  
  // Bahan Baku / Barang Jadi
  hargaJual: "harga_jual",
  
  // Katalog
  updatedAt: "updated_at",
};

/**
 * Convert a Convex document (camelCase) to Supabase row (snake_case)
 */
function toSnakeCase(doc: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  
  for (const [key, value] of Object.entries(doc)) {
    if (key === "_id" || key === "_creationTime") continue;
    const snakeKey = FIELD_MAP[key] || key;
    result[snakeKey] = value;
  }
  
  return result;
}

/**
 * Sync a single table from Convex data to Supabase
 */
export async function syncTable(
  table: string,
  data: Record<string, unknown>[],
): Promise<SyncResult> {
  const result: SyncResult = { table, synced: 0, errors: [] };
  
  if (!isSupabaseReady()) {
    result.errors.push("Supabase not configured");
    return result;
  }
  
  for (const doc of data) {
    try {
      const row = toSnakeCase(doc);
      const { error } = await supabase
        .from(table)
        .upsert(row, { onConflict: "id" });
      
      if (error) {
        const { error: insertError } = await supabase
          .from(table)
          .insert(row);
        
        if (insertError) {
          result.errors.push(`${insertError.message}`);
        } else {
          result.synced++;
        }
      } else {
        result.synced++;
      }
    } catch (err) {
      result.errors.push(`${err}`);
    }
  }
  
  return result;
}

/**
 * Sync all main tables from Convex to Supabase
 */
export async function syncAllTables(
  tablesData: Record<string, Record<string, unknown>[]>,
): Promise<SyncResult[]> {
  const results: SyncResult[] = [];
  
  for (const [table, data] of Object.entries(tablesData)) {
    const result = await syncTable(table, data);
    results.push(result);
  }
  
  return results;
}

/**
 * Get sync status summary
 */
export function getSyncSummary(results: SyncResult[]): {
  totalSynced: number;
  totalErrors: number;
  details: string[];
} {
  let totalSynced = 0;
  let totalErrors = 0;
  const details: string[] = [];
  
  for (const r of results) {
    totalSynced += r.synced;
    totalErrors += r.errors.length;
    
    if (r.errors.length > 0) {
      details.push(`❌ ${r.table}: ${r.errors.join(", ")}`);
    } else {
      details.push(`✅ ${r.table}: ${r.synced} records`);
    }
  }
  
  return { totalSynced, totalErrors, details };
}
