/**
 * Dual-Write Utility: Syncs Convex mutations → Supabase
 *
 * Setelah setiap Convex mutation berhasil, panggil fungsi di sini untuk
 * menulis data yang sama ke Supabase secara bersamaan. Ini memastikan
 * kedua database tetap sinkron secara real-time.
 */
import { supabase, isSupabaseReady } from "./supabase";

// ============================================================================
// FIELD MAPPING: camelCase (Convex) → snake_case (Supabase)
// ============================================================================

const FIELD_MAP: Record<string, Record<string, string>> = {
  barang: {
    kode: "kode",
    nama: "nama",
    harga: "harga",
    kategori: "kategori",
  },
  supplier: {
    id: "id",
    nama: "nama",
    alamat: "alamat",
    kontak: "telepon",
  },
  reseller: {
    id: "id",
    nama: "nama",
    alamat: "alamat",
    kontak: "telepon",
  },
  dpl: {
    id: "id",
    namaPasar: "nama_pasar",
    alamat: "alamat",
    kontak: "telepon",
  },
  pasar: {
    id: "id",
    namaPasar: "nama_pasar",
    alamat: "alamat",
    kontak: "telepon",
  },
  karyawan: {
    id: "id",
    nama: "nama",
    jabatan: "jabatan",
    gajiPokok: "gaji",
  },
  absensi: {
    id: "id",
    idKaryawan: "id_karyawan",
    tanggal: "tanggal",
    status: "status",
    jamMasuk: "jam_masuk",
    jamKeluar: "jam_keluar",
  },
  utang: {
    id: "id",
    idKaryawan: "id_karyawan",
    tanggal: "tanggal",
    nominal: "nominal",
    status: "status",
    dibayar: "dibayar",
    tglBayar: "tgl_bayar",
    sisaUtang: "sisa_utang",
    keterangan: "keterangan",
    jenis: "jenis",
  },
  retur: {
    id: "id",
    tanggal: "tanggal",
    tipe: "tipe",
    namaPihak: "nama_pihak",
    namaBarang: "nama_barang",
    qty: "qty",
    keterangan: "keterangan",
  },
  kas: {
    id: "id",
    tanggal: "tanggal",
    kasMasuk: "kas_masuk",
    kasKeluar: "kas_keluar",
    saldoAwal: "saldo_awal",
    saldoAkhir: "saldo_akhir",
    keterangan: "keterangan",
    sumber: "sumber",
  },
  pengeluaran: {
    id: "id",
    tanggal: "tanggal",
    jenis: "jenis",
    nominal: "nominal",
    keterangan: "keterangan",
    idKaryawan: "id_karyawan",
  },
  gudang: {
    id: "id",
    namaBarang: "nama_barang",
    stokAwal: "stok_awal",
    tanggalStokAwal: "tanggal_stok_awal",
    keterangan: "keterangan",
    stokMin: "stok_min",
  },
  stok_history: {
    id: "id",
    tanggal: "tanggal",
    namaBarang: "nama_barang",
    perubahan: "perubahan",
    tipe: "tipe",
    keterangan: "keterangan",
  },
  invoice: {
    idInvoice: "id_invoice",
    tanggal: "tanggal",
    tipe: "tipe",
    namaPihak: "nama_pihak",
    tenggat: "tenggat",
    mataUang: "mata_uang",
    statusPembayaran: "status_pembayaran",
    items: "items",
    total: "total",
    totalModal: "total_modal",
    totalPenjualan: "total_penjualan",
    margin: "margin",
    dibayar: "dibayar",
    sisa: "sisa",
    riwayatBayar: "riwayat_bayar",
    deletedAt: "deleted_at",
  },
  slipgaji: {
    id: "id",
    idKaryawan: "id_karyawan",
    periode: "periode",
    tanggal: "tanggal",
    gajiPokok: "gaji_pokok",
    bonusKerajinan: "bonus_kerajinan",
    bonusBulanan: "bonus_bulanan",
    denda: "denda",
    hadir: "hadir",
    izin: "izin",
    sakit: "sakit",
    alpa: "alpa",
    potonganAbsensi: "potongan_absensi",
    potonganUtang: "potongan_utang",
    potonganCasbon: "potongan_casbon",
    gajiBersih: "gaji_bersih",
    sisaUtang: "sisa_utang",
    sisaCasbon: "sisa_casbon",
  },
  bahan_baku: {
    kode: "kode",
    nama: "nama",
    hargaModal: "harga",
    stokAwal: "stok_awal",
    kategori: "kategori",
  },
  barang_jadi: {
    kode: "kode",
    nama: "nama",
    hargaJual: "harga_jual",
    stokAwal: "stok_awal",
    kategori: "kategori",
  },
  tetesan_stok: {
    id: "id",
    namaBarang: "nama_barang",
    tipe: "tipe",
    stokAwal: "stok_awal",
    tanggalStokAwal: "tanggal_stok_awal",
    keterangan: "keterangan",
  },
  tetesan_stok_history: {
    id: "id",
    namaBarang: "nama_barang",
    perubahan: "perubahan",
    keterangan: "keterangan",
    tanggal: "tanggal",
  },
  invoice_tetesan: {
    idInvoice: "id_invoice",
    tanggal: "tanggal",
    tipe: "tipe",
    namaPihak: "nama_pihak",
    mataUang: "mata_uang",
    items: "items",
    total: "total",
    statusPembayaran: "status_pembayaran",
    dibayar: "dibayar",
    sisa: "sisa",
    riwayatBayar: "riwayat_bayar",
  },
  batch_masuk: {
    id: "id",
    tanggal: "tanggal",
    namaSupplier: "nama_supplier",
    items: "items",
    total: "total",
    keterangan: "keterangan",
  },
  batch_alokasi: {
    id: "id",
    idBatch: "id_batch",
    tanggal: "tanggal",
    namaPasar: "nama_pasar",
    items: "items",
    keterangan: "keterangan",
  },
};

// ============================================================================
// SUPABASE CONFLICT COLUMNS (for ON CONFLICT upsert)
// ============================================================================

const CONFLICT_COLUMNS: Record<string, string> = {
  barang: "kode",
  supplier: "id",
  reseller: "id",
  dpl: "id",
  pasar: "id",
  karyawan: "id",
  absensi: "id",
  utang: "id",
  retur: "id",
  kas: "id",
  pengeluaran: "id",
  gudang: "nama_barang",
  stok_history: "id",
  invoice: "id_invoice",
  slipgaji: "id",
  bahan_baku: "kode",
  barang_jadi: "kode",
  tetesan_stok: "nama_barang",
  tetesan_stok_history: "id",
  invoice_tetesan: "id_invoice",
  batch_masuk: "id",
  batch_alokasi: "id",
};

// ============================================================================
// HELPER: Map camelCase → snake_case
// ============================================================================

function mapRow(table: string, row: Record<string, any>): Record<string, any> {
  const fieldMap = FIELD_MAP[table];
  if (!fieldMap) return row; // no mapping, return as-is

  const mapped: Record<string, any> = {};
  for (const [convexKey, supaKey] of Object.entries(fieldMap)) {
    if (row[convexKey] !== undefined) {
      mapped[supaKey] = row[convexKey];
    }
  }
  return mapped;
}

// ============================================================================
// UPSERT: Write a single row to Supabase (ON CONFLICT DO UPDATE)
// ============================================================================

export async function upsertToSupabase(
  table: string,
  convexRow: Record<string, any>,
): Promise<{ ok: boolean; error?: string }> {
  if (!isSupabaseReady()) return { ok: false, error: "Supabase not configured" };

  const mapped = mapRow(table, convexRow);
  if (Object.keys(mapped).length === 0) return { ok: false, error: "No fields to write" };

  const conflictCol = CONFLICT_COLUMNS[table];

  try {
    let query = supabase.from(table).upsert(mapped, {
      onConflict: conflictCol,
      ignoreDuplicates: false,
    });
    const { error } = await query;
    if (error) {
      console.warn(`[DualWrite] upsert ${table}:`, error.message);
      return { ok: false, error: error.message };
    }
    return { ok: true };
  } catch (err: any) {
    console.warn(`[DualWrite] upsert ${table}:`, err?.message);
    return { ok: false, error: err?.message };
  }
}

// ============================================================================
// DELETE: Remove a row from Supabase
// ============================================================================

export async function deleteFromSupabase(
  table: string,
  keyColumn: string,
  keyValue: string,
): Promise<{ ok: boolean; error?: string }> {
  if (!isSupabaseReady()) return { ok: false, error: "Supabase not configured" };

  try {
    const { error } = await supabase.from(table).delete().eq(keyColumn, keyValue);
    if (error) {
      console.warn(`[DualWrite] delete ${table}:`, error.message);
      return { ok: false, error: error.message };
    }
    return { ok: true };
  } catch (err: any) {
    console.warn(`[DualWrite] delete ${table}:`, err?.message);
    return { ok: false, error: err?.message };
  }
}

// ============================================================================
// BATCH UPSERT: Write multiple rows at once
// ============================================================================

export async function batchUpsertToSupabase(
  table: string,
  convexRows: Record<string, any>[],
): Promise<{ ok: boolean; count: number; error?: string }> {
  if (!isSupabaseReady()) return { ok: false, count: 0, error: "Supabase not configured" };
  if (convexRows.length === 0) return { ok: true, count: 0 };

  const mapped = convexRows.map((r) => mapRow(table, r)).filter((r) => Object.keys(r).length > 0);
  if (mapped.length === 0) return { ok: false, count: 0, error: "No fields to write" };

  const conflictCol = CONFLICT_COLUMNS[table];

  try {
    const { error } = await supabase.from(table).upsert(mapped, {
      onConflict: conflictCol,
      ignoreDuplicates: false,
    });
    if (error) {
      console.warn(`[DualWrite] batch upsert ${table}:`, error.message);
      return { ok: false, count: 0, error: error.message };
    }
    return { ok: true, count: mapped.length };
  } catch (err: any) {
    console.warn(`[DualWrite] batch upsert ${table}:`, err?.message);
    return { ok: false, count: 0, error: err?.message };
  }
}

// ============================================================================
// HIGH-LEVEL: Sync after specific mutation types
// ============================================================================

/** Sync setelah upsert master data (Barang, Supplier, Reseller, DPL, Pasar, Karyawan) */
export async function syncMasterAfterUpsert(
  table: string,
  doc: Record<string, any>,
): Promise<void> {
  await upsertToSupabase(table, doc);
}

/** Sync setelah delete master data */
export async function syncMasterAfterDelete(
  table: string,
  id: string,
): Promise<void> {
  // Map convex table name → supabase table name
  const supaTable = table === "slipgaji" ? "slipgaji" : table;
  const conflictCol = CONFLICT_COLUMNS[supaTable] || "id";
  await deleteFromSupabase(supaTable, conflictCol, id);
}

/** Sync setelah createInvoice / editInvoice */
export async function syncInvoiceAfterUpsert(
  invoiceData: Record<string, any>,
  stokHistoryRows: Record<string, any>[],
  kasRow: Record<string, any> | null,
): Promise<void> {
  await upsertToSupabase("invoice", invoiceData);
  if (stokHistoryRows.length > 0) {
    await batchUpsertToSupabase("stok_history", stokHistoryRows);
  }
  if (kasRow) {
    await upsertToSupabase("kas", kasRow);
  }
}

/** Sync setelah upsert retur */
export async function syncReturAfterUpsert(
  returData: Record<string, any>,
  stokHistoryRow: Record<string, any>,
): Promise<void> {
  await upsertToSupabase("retur", returData);
  await upsertToSupabase("stok_history", stokHistoryRow);
}

/** Sync setelah kas manual */
export async function syncKasAfterUpsert(
  kasData: Record<string, any>,
): Promise<void> {
  await upsertToSupabase("kas", kasData);
}

/** Sync setelah pengeluaran */
export async function syncPengeluaranAfterUpsert(
  pengeluaranData: Record<string, any>,
  kasRow: Record<string, any> | null,
  utangRow: Record<string, any> | null,
): Promise<void> {
  await upsertToSupabase("pengeluaran", pengeluaranData);
  if (kasRow) await upsertToSupabase("kas", kasRow);
  if (utangRow) await upsertToSupabase("utang", utangRow);
}

/** Sync setelah slip gaji */
export async function syncSlipGajiAfterUpsert(
  slipData: Record<string, any>,
  kasRows: Record<string, any>[],
  utangRows: Record<string, any>[],
): Promise<void> {
  await upsertToSupabase("slipgaji", slipData);
  for (const kas of kasRows) {
    await upsertToSupabase("kas", kas);
  }
  for (const utang of utangRows) {
    await upsertToSupabase("utang", utang);
  }
}

/** Sync setelah absensi */
export async function syncAbsensiAfterUpsert(
  absensiData: Record<string, any>,
): Promise<void> {
  await upsertToSupabase("absensi", absensiData);
}

/** Sync setelah utang */
export async function syncUtangAfterUpsert(
  utangData: Record<string, any>,
  karyawanRow: Record<string, any> | null,
): Promise<void> {
  await upsertToSupabase("utang", utangData);
  if (karyawanRow) await upsertToSupabase("karyawan", karyawanRow);
}

/** Sync setelah gudang / adjustStok */
export async function syncGudangAfterUpsert(
  gudangRow: Record<string, any> | null,
  stokHistoryRow: Record<string, any> | null,
): Promise<void> {
  if (gudangRow) await upsertToSupabase("gudang", gudangRow);
  if (stokHistoryRow) await upsertToSupabase("stok_history", stokHistoryRow);
}

/** Sync setelah batch masuk */
export async function syncBatchMasukAfterUpsert(
  batchData: Record<string, any>,
  stokHistoryRows: Record<string, any>[],
  gudangRows: Record<string, any>[],
): Promise<void> {
  await upsertToSupabase("batch_masuk", batchData);
  for (const sh of stokHistoryRows) {
    await upsertToSupabase("stok_history", sh);
  }
  for (const g of gudangRows) {
    await upsertToSupabase("gudang", g);
  }
}
