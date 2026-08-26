import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/lib/supabase";

type SupabaseTable =
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
  | "users"
  | "push_subscription"
  | "bahan_baku"
  | "barang_jadi"
  | "tetesan_stok"
  | "tetesan_stok_history"
  | "invoice_tetesan"
  | "katalog";

interface QueryOptions {
  /** Kolom mana yang di-select. Default: '*' (semua kolom) */
  select?: string;
  /** Filter: WHERE clause, misal { tipe: 'Reseller' } */
  filters?: Record<string, unknown>;
  /** ORDER BY, misal { column: 'created_at', ascending: false } */
  orderBy?: { column: string; ascending?: boolean };
  /** Limit jumlah baris */
  limit?: number;
  /** Field yang di-assign ke created_at untuk sorting default */
  dateField?: string;
}

/**
 * Hook yang meniru pola useQuery Convex.
 *
 * Penggunaan:
 *   const barang = useSupabaseQuery("barang");
 *   const invoices = useSupabaseQuery("invoice", {
 *     filters: { tipe: "Reseller" },
 *     orderBy: { column: "created_at", ascending: false },
 *     limit: 100,
 *   });
 *
 * Mengembalikan data (array), null saat loading, atau [] jika error.
 * Menggunakan Realtime subscription Supabase untuk update otomatis.
 */
export function useSupabaseQuery<T = Record<string, unknown>>(
  table: SupabaseTable,
  options: QueryOptions = {},
): T[] | null {
  const { select = "*", filters, orderBy, limit, dateField = "created_at" } = options;
  const [data, setData] = useState<T[] | null>(null);
  const mountedRef = useRef(true);

  const fetchData = useCallback(async () => {
    if (!supabase) {
      setData([]);
      return;
    }

    let query = supabase.from(table).select(select);

    // Apply filters
    if (filters) {
      for (const [key, value] of Object.entries(filters)) {
        if (value !== undefined && value !== null && value !== "") {
          query = query.eq(key, value);
        }
      }
    }

    // Apply ordering
    if (orderBy) {
      query = query.order(orderBy.column, { ascending: orderBy.ascending ?? false });
    } else {
      // Default: sort by date descending
      query = query.order(dateField, { ascending: false });
    }

    // Apply limit
    if (limit) {
      query = query.limit(limit);
    }

    const { data: rows, error } = await query;

    if (mountedRef.current) {
      if (error) {
        console.error(`[useSupabaseQuery] Error fetching ${table}:`, error.message);
        setData([]);
      } else {
        setData((rows ?? []) as T[]);
      }
    }
  }, [table, select, JSON.stringify(filters), JSON.stringify(orderBy), limit, dateField]);

  // Initial fetch + realtime subscription
  useEffect(() => {
    mountedRef.current = true;
    fetchData();

    // Subscribe to realtime changes
    const channel = supabase
      ? supabase
          .channel(`${table}-changes`)
          .on(
            "postgres_changes",
            { event: "*", schema: "public", table },
            () => {
              // Re-fetch on any change
              fetchData();
            },
          )
          .subscribe()
      : null;

    return () => {
      mountedRef.current = false;
      if (channel) {
        supabase?.removeChannel(channel);
      }
    };
  }, [fetchData, table]);

  return data;
}

/**
 * Hook untuk fetch satu baris berdasarkan ID.
 */
export function useSupabaseRow<T = Record<string, unknown>>(
  table: SupabaseTable,
  id: string | null,
): T | null {
  const [data, setData] = useState<T | null>(null);

  useEffect(() => {
    if (!id || !supabase) {
      setData(null);
      return;
    }

    let cancelled = false;

    supabase
      .from(table)
      .select("*")
      .eq("id", id)
      .single()
      .then(({ data: row, error }) => {
        if (!cancelled) {
          if (error) {
            console.error(`[useSupabaseRow] Error:`, error.message);
            setData(null);
          } else {
            setData(row as T);
          }
        }
      });

    return () => {
      cancelled = true;
    };
  }, [table, id]);

  return data;
}

/**
 * Helper untuk mutations (insert, update, delete).
 * Return: { mutate, loading, error }
 */
export function useSupabaseMutation(table: SupabaseTable) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const insert = useCallback(
    async (rows: Record<string, unknown> | Record<string, unknown>[]) => {
      setLoading(true);
      setError(null);
      const { error: err } = await supabase!.from(table).insert(rows);
      setLoading(false);
      if (err) {
        setError(err.message);
        return { error: err.message };
      }
      return { error: null };
    },
    [table],
  );

  const update = useCallback(
    async (id: string, patch: Record<string, unknown>) => {
      setLoading(true);
      setError(null);
      const { error: err } = await supabase!.from(table).update(patch).eq("id", id);
      setLoading(false);
      if (err) {
        setError(err.message);
        return { error: err.message };
      }
      return { error: null };
    },
    [table],
  );

  const remove = useCallback(
    async (id: string) => {
      setLoading(true);
      setError(null);
      const { error: err } = await supabase!.from(table).delete().eq("id", id);
      setLoading(false);
      if (err) {
        setError(err.message);
        return { error: err.message };
      }
      return { error: null };
    },
    [table],
  );

  return { insert, update, remove, loading, error };
}
