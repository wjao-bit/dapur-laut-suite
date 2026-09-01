/**
 * DB-SYNC: Convex ↔ Supabase Real-Time Sync
 * 
 * Fitur:
 * 1. Auto-seed: Kalau Supabase kosong tapi Convex ada data → otomatis copy
 * 2. Dual-write: Setiap write ke Convex → juga write ke Supabase
 * 3. Manual sync: Tombol untuk sync manual dari salah satu DB
 * 4. Conflict resolution: Convex = primary, Supabase = backup
 */

import { supabase, isSupabaseReady } from "./supabase";

// ============================================================================
// Type definitions
// ============================================================================
type TableName =
  | "barang"
  | "supplier"
  | "reseller"
  | "dpl"
  | "pasar"
  | "karyawan"
  | "invoice"
  | "batch_masuk"
  | "batch_alokasi"
  | "kas"
  | "pengeluaran"
  | "stok_history"
  | "retur"
  | "absensi"
  | "utang"
  | "slipgaji"
  | "piutang"
  | "audit_log"
  | "gudang"
  | "bahan_baku"
  | "barang_jadi"
  | "tetesan_stok"
  | "tetesan_stok_history"
  | "invoice_tetesan"
  | "katalog";

// ============================================================================
// Supabase Helpers
// ============================================================================

/** Count rows in a Supabase table */
async function countRows(table: TableName): Promise<number> {
  if (!isSupabaseReady()) return 0;
  const { count } = await supabase
    .from(table)
    .select("*", { count: "exact", head: true });
  return count ?? 0;
}

/** Check if Supabase table has any data */
async function isTableEmpty(table: TableName): Promise<boolean> {
  const count = await countRows(table);
  return count === 0;
}

/** Upsert batch of rows to Supabase (chunks of 100 to avoid limits) */
async function upsertBatch(
  table: TableName,
  rows: Record<string, unknown>[],
  onConflict?: string,
): Promise<{ inserted: number; errors: string[] }> {
  if (!isSupabaseReady() || rows.length === 0) {
    return { inserted: 0, errors: [] };
  }

  const errors: string[] = [];
  let inserted = 0;
  const CHUNK = 50;

  for (let i = 0; i < rows.length; i += CHUNK) {
    const chunk = rows.slice(i, i + CHUNK);
    try {
      const { error } = await supabase
        .from(table)
        .upsert(chunk, onConflict ? { onConflict } : undefined);
      if (error) {
        errors.push(`${table} chunk ${i}: ${error.message}`);
      } else {
        inserted += chunk.length;
      }
    } catch (e: any) {
      errors.push(`${table} chunk ${i}: ${e.message}`);
    }
  }

  return { inserted, errors };
}

// ============================================================================
// Convex → Supabase Migration (Manual)
// ============================================================================

export interface SyncResult {
  success: boolean;
  tables: Record<string, { count: number; errors: string[] }>;
  totalSynced: number;
  totalErrors: number;
}

/**
 * Migrate data from Convex to Supabase.
 * This reads from Convex via a special export and writes to Supabase.
 * 
 * IMPORTANT: This function is called from the frontend with data already
 * fetched from Convex. Pass the data as the `convexData` parameter.
 */
export async function migrateConvexToSupabase(
  convexData: Record<TableName, Record<string, unknown>[]>,
): Promise<SyncResult> {
  if (!isSupabaseReady()) {
    return {
      success: false,
      tables: {},
      totalSynced: 0,
      totalErrors: 1,
    };
  }

  const results: Record<string, { count: number; errors: string[] }> = {};
  let totalSynced = 0;
  let totalErrors = 0;

  // Map Convex camelCase IDs → Supabase UUID IDs
  const idMap: Record<string, string> = {};

  // Table mapping: Convex table name → Supabase table name + conflict column
  const tableMap: Record<string, { supabase: TableName; conflict: string }> = {
    barang: { supabase: "barang", conflict: "kode" },
    supplier: { supabase: "supplier", conflict: "kode" },
    reseller: { supabase: "reseller", conflict: "kode" },
    dpl: { supabase: "dpl", conflict: "kode" },
    pasar: { supabase: "pasar", conflict: "kode" },
    karyawan: { supabase: "karyawan", conflict: "kode" },
    invoice: { supabase: "invoice", conflict: "id_invoice" },
    batch_masuk: { supabase: "batch_masuk", conflict: "id_batch" },
    batch_alokasi: { supabase: "batch_alokasi", conflict: "id" },
    kas: { supabase: "kas", conflict: "id" },
    pengeluaran: { supabase: "pengeluaran", conflict: "id" },
    stok_history: { supabase: "stok_history", conflict: "id" },
    retur: { supabase: "retur", conflict: "id" },
    gudang: { supabase: "gudang", conflict: "nama_barang" },
  };

  for (const [convexTable, mapping] of Object.entries(tableMap)) {
    const data = convexData[convexTable as TableName];
    if (!data || data.length === 0) continue;

    // Convert Convex _id to string and map fields
    const rows = data.map((row) => {
      const supaRow: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(row)) {
        // Skip Convex internal fields
        if (key === "_id" || key === "_creationTime") continue;
        supaRow[key] = value;
      }
      return supaRow;
    });

    const result = await upsertBatch(mapping.supabase, rows, mapping.conflict);
    results[convexTable] = { count: result.inserted, errors: result.errors };
    totalSynced += result.inserted;
    totalErrors += result.errors.length;
  }

  return {
    success: totalErrors === 0,
    tables: results,
    totalSynced,
    totalErrors,
  };
}

// ============================================================================
// Auto-Seed: When Supabase table is empty, create entries from barang list
// ============================================================================

/**
 * Auto-create gudang entries from barang list.
 * Called when gudang table is empty.
 */
export async function autoSeedGudang(
  barangList: Record<string, unknown>[],
): Promise<number> {
  if (!isSupabaseReady() || barangList.length === 0) return 0;

  const rows = barangList.map((b) => ({
    nama_barang: b.nama as string,
    stok_awal: 0,
    stok_min: 5,
    keterangan: "Auto-seed dari daftar barang",
  }));

  const { inserted } = await upsertBatch("gudang", rows, "nama_barang");
  return inserted;
}

// ============================================================================
// Single-row Sync (for dual-write)
// ============================================================================

/**
 * Sync a single row to Supabase (for dual-write pattern).
 * Use this whenever writing to Convex.
 */
export async function syncToSupabase(
  table: TableName,
  data: Record<string, unknown>,
  onConflict?: string,
): Promise<boolean> {
  if (!isSupabaseReady()) return false;

  try {
    const { error } = await supabase
      .from(table)
      .upsert(data, onConflict ? { onConflict } : undefined);
    if (error) {
      console.warn(`[Sync] ${table} upsert failed:`, error.message);
      return false;
    }
    return true;
  } catch (e: any) {
    console.warn(`[Sync] ${table} error:`, e.message);
    return false;
  }
}

/**
 * Delete a row from Supabase (for dual-write pattern).
 */
export async function deleteFromSupabase(
  table: TableName,
  column: string,
  value: unknown,
): Promise<boolean> {
  if (!isSupabaseReady()) return false;

  try {
    const { error } = await supabase
      .from(table)
      .delete()
      .eq(column, value);
    if (error) {
      console.warn(`[Sync] ${table} delete failed:`, error.message);
      return false;
    }
    return true;
  } catch (e: any) {
    console.warn(`[Sync] ${table} error:`, e.message);
    return false;
  }
}

// ============================================================================
// Status & Diagnostics
// ============================================================================

export interface DBStatus {
  supabaseReady: boolean;
  tableCounts: Record<string, number>;
  emptyTables: string[];
}

/**
 * Get current sync status — how many rows in each Supabase table.
 */
export async function getSyncStatus(): Promise<DBStatus> {
  if (!isSupabaseReady()) {
    return {
      supabaseReady: false,
      tableCounts: {},
      emptyTables: [],
    };
  }

  const tables: TableName[] = [
    "barang", "supplier", "reseller", "dpl", "pasar", "karyawan",
    "invoice", "batch_masuk", "batch_alokasi", "kas", "pengeluaran",
    "stok_history", "retur", "gudang", "absensi", "utang", "slipgaji",
    "piutang", "bahan_baku", "barang_jadi", "tetesan_stok",
    "tetesan_stok_history", "invoice_tetesan", "katalog",
  ];

  const tableCounts: Record<string, number> = {};
  const emptyTables: string[] = [];

  for (const table of tables) {
    const count = await countRows(table);
    tableCounts[table] = count;
    if (count === 0) emptyTables.push(table);
  }

  return {
    supabaseReady: true,
    tableCounts,
    emptyTables,
  };
}
