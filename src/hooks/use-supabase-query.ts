import { useState, useEffect, useRef, useCallback } from "react";
import { supabase, isSupabaseReady } from "@/lib/supabase";

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
  | "katalog"
  | "gudang";

interface QueryOptions {
  select?: string;
  filters?: Record<string, unknown>;
  orderBy?: { column: string; ascending?: boolean };
  limit?: number;
  dateField?: string;
}

export function useSupabaseQuery<T = Record<string, unknown>>(
  table: SupabaseTable,
  options?: QueryOptions,
): T[] | undefined {
  const [data, setData] = useState<T[] | undefined>(undefined);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const mountedRef = useRef(true);
  const optionsKey = JSON.stringify(options);

  const fetchData = useCallback(async () => {
    if (!isSupabaseReady()) {
      setData([]);
      return;
    }
    try {
      let query = supabase.from(table).select(options?.select ?? "*");

      if (options?.filters) {
        for (const [key, value] of Object.entries(options.filters)) {
          query = query.eq(key, value);
        }
      }

      const orderCol = options?.orderBy?.column ?? "created_at";
      const orderAsc = options?.orderBy?.ascending ?? false;
      query = query.order(orderCol, { ascending: orderAsc });

      if (options?.limit) {
        query = query.limit(options.limit);
      }

      const { data: rows, error } = await query;
      if (!mountedRef.current) return;
      if (error) {
        // Table might not exist yet — just return empty, don't spam console
        console.warn(`[Supabase] ${table}:`, error.message);
        setData([]);
      } else {
        setData((rows as T[]) ?? []);
      }
    } catch (err) {
      if (!mountedRef.current) return;
      console.warn(`[Supabase] ${table} fetch error:`, err);
      setData([]);
    }
  }, [table, optionsKey]);

  useEffect(() => {
    mountedRef.current = true;
    fetchData();

    // Only subscribe to realtime if Supabase is configured
    if (isSupabaseReady()) {
      try {
        const channel = supabase
          .channel(`realtime:${table}`)
          .on("postgres_changes", { event: "*", schema: "public", table }, () => {
            fetchData();
          })
          .subscribe((status) => {
            // Silently ignore subscription errors (table might not have realtime enabled)
            if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
              // Do nothing — just use polling fallback
            }
          });

        channelRef.current = channel;
      } catch {
        // Realtime not available — fine, we still have initial fetch
      }
    }

    return () => {
      mountedRef.current = false;
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current).catch(() => {});
        channelRef.current = null;
      }
    };
  }, [fetchData, table]);

  return data;
}
