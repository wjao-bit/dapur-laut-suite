/**
 * Database Fallback Layer
 *
 * Convex = Primary database
 * Supabase = Automatic fallback when Convex is down/rate-limited
 *
 * Usage:
 *   import { useFallbackQuery } from '@/lib/db-fallback'
 *   const data = useFallbackQuery('barang', { orderBy: { column: 'nama' } })
 */

import { supabase, isSupabaseReady } from "@/lib/supabase";
import {
  reportFailure,
  reportSuccess,
  isConvexUsable,
} from "@/lib/convex-health";

// ============================================================================
// Types
// ============================================================================

export interface FallbackQueryOptions {
  select?: string;
  filters?: Record<string, unknown>;
  orderBy?: { column: string; ascending?: boolean };
  limit?: number;
}

export interface FallbackMutationResult {
  success: boolean;
  error?: string;
  source: "convex" | "supabase";
}

// ============================================================================
// Table name mapping (Convex → Supabase)
// ============================================================================

const TABLE_MAP: Record<string, string> = {
  barang: "barang",
  supplier: "supplier",
  reseller: "reseller",
  dpl: "dpl",
  pasar: "pasar",
  karyawan: "karyawan",
  absensi: "absensi",
  utang: "utang",
  invoice: "invoice",
  retur: "retur",
  kas: "kas",
  pengeluaran: "pengeluaran",
  gudang: "gudang",
  stokHistory: "stok_history",
  slipgaji: "slipgaji",
  katalog: "katalog",
  monitor: "monitor",
  invoiceTetesan: "invoice_tetesan",
  tetesanStok: "tetesan_stok",
  tetesanStokHistory: "tetesan_stok_history",
  bahanBaku: "bahan_baku",
  barangJadi: "barang_jadi",
  batchMasuk: "batch_masuk",
  batchAlokasi: "batch_alokasi",
  piutang: "piutang",
  auditLog: "audit_log",
  users: "users",
  akun: "akun",
  sessions: "sessions",
  aktivitas: "aktivitas",
};

function toSupabaseTable(convexTable: string): string {
  return TABLE_MAP[convexTable] || convexTable;
}

// ============================================================================
// Supabase Query Engine
// ============================================================================

async function supabaseQuery<T>(
  table: string,
  options?: FallbackQueryOptions,
): Promise<T[]> {
  if (!isSupabaseReady()) {
    console.warn("[DB Fallback] Supabase not configured");
    return [];
  }

  try {
    const sbTable = toSupabaseTable(table);
    let query = supabase.from(sbTable).select(options?.select ?? "*");

    if (options?.filters) {
      for (const [key, value] of Object.entries(options.filters)) {
        if (value !== undefined && value !== null) {
          query = query.eq(key, value);
        }
      }
    }

    const orderCol = options?.orderBy?.column ?? "created_at";
    const orderAsc = options?.orderBy?.ascending ?? false;
    query = query.order(orderCol, { ascending: orderAsc });

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;

    if (error) {
      console.error(`[DB Fallback] Supabase query error (${table}):`, error.message);
      return [];
    }

    return (data as T[]) ?? [];
  } catch (err) {
    console.error(`[DB Fallback] Supabase query exception (${table}):`, err);
    return [];
  }
}

async function supabaseInsert<T>(
  table: string,
  record: Record<string, unknown>,
): Promise<FallbackMutationResult> {
  if (!isSupabaseReady()) {
    return { success: false, error: "Supabase not configured", source: "supabase" };
  }

  try {
    const sbTable = toSupabaseTable(table);
    const { error } = await supabase.from(sbTable).insert(record);

    if (error) {
      console.error(`[DB Fallback] Supabase insert error (${table}):`, error.message);
      return { success: false, error: error.message, source: "supabase" };
    }

    return { success: true, source: "supabase" };
  } catch (err) {
    return {
      success: false,
      error: (err as Error).message,
      source: "supabase",
    };
  }
}

async function supabaseUpdate(
  table: string,
  matchField: string,
  matchValue: unknown,
  updates: Record<string, unknown>,
): Promise<FallbackMutationResult> {
  if (!isSupabaseReady()) {
    return { success: false, error: "Supabase not configured", source: "supabase" };
  }

  try {
    const sbTable = toSupabaseTable(table);
    const { error } = await supabase
      .from(sbTable)
      .update(updates)
      .eq(matchField, matchValue);

    if (error) {
      console.error(`[DB Fallback] Supabase update error (${table}):`, error.message);
      return { success: false, error: error.message, source: "supabase" };
    }

    return { success: true, source: "supabase" };
  } catch (err) {
    return {
      success: false,
      error: (err as Error).message,
      source: "supabase",
    };
  }
}

async function supabaseDelete(
  table: string,
  matchField: string,
  matchValue: unknown,
): Promise<FallbackMutationResult> {
  if (!isSupabaseReady()) {
    return { success: false, error: "Supabase not configured", source: "supabase" };
  }

  try {
    const sbTable = toSupabaseTable(table);
    const { error } = await supabase
      .from(sbTable)
      .delete()
      .eq(matchField, matchValue);

    if (error) {
      console.error(`[DB Fallback] Supabase delete error (${table}):`, error.message);
      return { success: false, error: error.message, source: "supabase" };
    }

    return { success: true, source: "supabase" };
  } catch (err) {
    return {
      success: false,
      error: (err as Error).message,
      source: "supabase",
    };
  }
}

// ============================================================================
// Sync Queue: Supabase → Convex (when Convex recovers)
// ============================================================================

interface SyncOperation {
  id: string;
  table: string;
  action: "insert" | "update" | "delete";
  record: Record<string, unknown>;
  matchField?: string;
  matchValue?: unknown;
  timestamp: number;
}

const SYNC_QUEUE_KEY = "dl-sync-queue";

function getSyncQueue(): SyncOperation[] {
  try {
    const raw = localStorage.getItem(SYNC_QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveSyncQueue(queue: SyncOperation[]): void {
  try {
    localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
  } catch {
    /* ignore */
  }
}

/**
 * Queue an operation for later sync to Convex
 */
export function queueSync(
  table: string,
  action: "insert" | "update" | "delete",
  record: Record<string, unknown>,
  matchField?: string,
  matchValue?: unknown,
): void {
  const queue = getSyncQueue();
  queue.push({
    id: crypto.randomUUID(),
    table,
    action,
    record,
    matchField,
    matchValue,
    timestamp: Date.now(),
  });
  saveSyncQueue(queue);
}

/**
 * Process sync queue when Convex recovers
 */
export async function processSyncQueue(
  convexMutation: (
    table: string,
    action: string,
    record: Record<string, unknown>,
    matchField?: string,
    matchValue?: unknown,
  ) => Promise<boolean>,
): Promise<{ processed: number; failed: number }> {
  const queue = getSyncQueue();
  if (queue.length === 0) return { processed: 0, failed: 0 };

  let processed = 0;
  let failed = 0;
  const remaining: SyncOperation[] = [];

  for (const op of queue) {
    try {
      const success = await convexMutation(
        op.table,
        op.action,
        op.record,
        op.matchField,
        op.matchValue,
      );
      if (success) {
        processed++;
      } else {
        remaining.push(op);
        failed++;
      }
    } catch {
      remaining.push(op);
      failed++;
    }
  }

  saveSyncQueue(remaining);
  return { processed, failed };
}

// ============================================================================
// Unified Query Hook (React)
// ============================================================================

import { useState, useEffect, useCallback, useRef } from "react";

/**
 * useFallbackQuery - React hook that:
 * 1. Tries Convex first (if healthy)
 * 2. Falls back to Supabase automatically if Convex fails
 * 3. Returns data from whichever source works
 *
 * Usage:
 *   const barang = useFallbackQuery('barang', {
 *     orderBy: { column: 'nama', ascending: true },
 *     filters: { kategori: 'Ikan' }
 *   })
 */
export function useFallbackQuery<T = Record<string, unknown>>(
  convexQueryFn: (() => T[] | undefined) | undefined,
  supabaseTable: string,
  options?: FallbackQueryOptions,
): T[] | undefined {
  const [data, setData] = useState<T[] | undefined>(undefined);
  const [source, setSource] = useState<"convex" | "supabase" | null>(null);
  const mountedRef = useRef(true);

  const fetchFromSupabase = useCallback(async () => {
    const rows = await supabaseQuery<T>(supabaseTable, options);
    if (mountedRef.current) {
      setData(rows);
      setSource("supabase");
    }
  }, [supabaseTable, options]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    // Try Convex first
    if (isConvexUsable() && convexQueryFn) {
      try {
        const result = convexQueryFn();
        if (result !== undefined) {
          setData(result);
          setSource("convex");
          reportSuccess();
          return;
        }
      } catch (err) {
        console.warn("[Fallback] Convex query failed, falling back to Supabase:", err);
        reportFailure((err as Error).message);
      }
    }

    // Fallback to Supabase
    if (isSupabaseReady()) {
      fetchFromSupabase();
    }
  }, [convexQueryFn, isConvexUsable(), fetchFromSupabase]);

  // Log which source is being used (dev only)
  if (import.meta.env.DEV && source) {
    console.log(`[DB Fallback] Using ${source} for ${supabaseTable}`);
  }

  return data;
}

/**
 * Simple fallback query - no Convex, just Supabase
 * Use this for tables that only exist in Supabase
 */
export function useSupabaseOnlyQuery<T = Record<string, unknown>>(
  table: string,
  options?: FallbackQueryOptions,
): T[] | undefined {
  const [data, setData] = useState<T[] | undefined>(undefined);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    supabaseQuery<T>(table, options).then((rows) => {
      if (mountedRef.current) setData(rows);
    });
    return () => {
      mountedRef.current = false;
    };
  }, [table, JSON.stringify(options)]);

  return data;
}

/**
 * Mutation helper: tries Convex first, falls back to Supabase
 */
export async function fallbackMutation(
  convexFn: () => Promise<unknown>,
  supabaseTable: string,
  action: "insert" | "update" | "delete",
  record: Record<string, unknown>,
  matchField?: string,
  matchValue?: unknown,
): Promise<FallbackMutationResult> {
  // Try Convex first
  if (isConvexUsable()) {
    try {
      await convexFn();
      reportSuccess();
      return { success: true, source: "convex" };
    } catch (err) {
      console.warn("[Fallback] Convex mutation failed:", err);
      reportFailure((err as Error).message);
    }
  }

  // Fallback to Supabase + queue for later sync
  let result: FallbackMutationResult;

  switch (action) {
    case "insert":
      result = await supabaseInsert(supabaseTable, record);
      break;
    case "update":
      result = await supabaseUpdate(
        supabaseTable,
        matchField || "id",
        matchValue || record.id,
        record,
      );
      break;
    case "delete":
      result = await supabaseDelete(
        supabaseTable,
        matchField || "id",
        matchValue || record.id,
      );
      break;
  }

  // Queue for sync when Convex recovers
  if (result.success) {
    queueSync(supabaseTable, action, record, matchField, matchValue);
  }

  return result;
}
