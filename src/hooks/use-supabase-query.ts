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
  const optionsKey = JSON.stringify(options);

  const fetchData = useCallback(async () => {
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
      if (error) {
        console.error(`[Supabase Query] ${table}:`, error.message);
        setData([]);
      } else {
        setData((rows as T[]) ?? []);
      }
    } catch (err) {
      console.error(`[Supabase Query] ${table} fetch error:`, err);
      setData([]);
    }
  }, [table, optionsKey]);

  useEffect(() => {
    fetchData();

    const channel = supabase
      .channel(`realtime:${table}`)
      .on("postgres_changes", { event: "*", schema: "public", table }, () => {
        fetchData();
      })
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [fetchData, table]);

  return data;
}
