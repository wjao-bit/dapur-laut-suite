import { useState, useEffect } from "react";
import { supabase, isSupabaseReady } from "@/lib/supabase";
import { getSyncStatus, type DBStatus } from "@/lib/db-sync";
import { toast } from "sonner";
import {
  Database,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  ArrowRightLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

/**
 * SyncPanel: Shows Supabase connection status and table row counts.
 * Displays which tables have data and which are empty.
 */
export function SyncPanel() {
  const [status, setStatus] = useState<DBStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);

  const refresh = async () => {
    setLoading(true);
    try {
      const s = await getSyncStatus();
      setStatus(s);
      setLastSync(new Date());
    } catch (e: any) {
      toast.error("Gagal cek status: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isSupabaseReady()) {
      refresh();
    }
  }, []);

  if (!isSupabaseReady()) {
    return (
      <div className="rounded-lg border border-dashed border-muted-foreground/25 p-4 text-center">
        <Database className="mx-auto mb-2 size-6 text-muted-foreground" />
        <p className="text-xs text-muted-foreground">
          Supabase belum terkonfigurasi.
        </p>
      </div>
    );
  }

  const totalRows = status
    ? Object.values(status.tableCounts).reduce((a, b) => a + b, 0)
    : 0;
  const totalTables = status ? Object.keys(status.tableCounts).length : 0;
  const filledTables = status ? totalTables - status.emptyTables.length : 0;

  return (
    <div className="space-y-3">
      {/* Connection Status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {status?.supabaseReady ? (
            <CheckCircle2 className="size-4 text-emerald-500" />
          ) : (
            <AlertTriangle className="size-4 text-amber-500" />
          )}
          <span className="text-sm font-medium">
            {status?.supabaseReady ? "Connected" : "Disconnected"}
          </span>
          <Badge variant="outline" className="text-[10px]">
            Supabase
          </Badge>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 cursor-pointer"
          onClick={refresh}
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="size-3 animate-spin" />
          ) : (
            <RefreshCw className="size-3" />
          )}
        </Button>
      </div>

      {/* Summary */}
      {status && (
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-md bg-muted/50 px-2 py-1.5">
            <p className="text-lg font-bold tabular-nums">{totalRows}</p>
            <p className="text-[10px] text-muted-foreground">Total Rows</p>
          </div>
          <div className="rounded-md bg-muted/50 px-2 py-1.5">
            <p className="text-lg font-bold tabular-nums text-emerald-600">
              {filledTables}
            </p>
            <p className="text-[10px] text-muted-foreground">Tabel ISI</p>
          </div>
          <div className="rounded-md bg-muted/50 px-2 py-1.5">
            <p className="text-lg font-bold tabular-nums text-amber-600">
              {status.emptyTables.length}
            </p>
            <p className="text-[10px] text-muted-foreground">Tabel KOSONG</p>
          </div>
        </div>
      )}

      {/* Empty Tables Warning */}
      {status && status.emptyTables.length > 0 && (
        <div className="rounded-md border border-amber-200 bg-amber-50 p-2 dark:border-amber-800 dark:bg-amber-950/30">
          <p className="mb-1 text-[10px] font-semibold text-amber-700 dark:text-amber-400">
            ⚠️ Tabel Kosong ({status.emptyTables.length}):
          </p>
          <div className="flex flex-wrap gap-1">
            {status.emptyTables.map((t) => (
              <Badge
                key={t}
                variant="outline"
                className="text-[9px] text-amber-600"
              >
                {t}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Quick Table Overview */}
      {status && (
        <div className="max-h-40 space-y-1 overflow-y-auto">
          {Object.entries(status.tableCounts)
            .filter(([, count]) => count > 0)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 10)
            .map(([table, count]) => (
              <div
                key={table}
                className="flex items-center justify-between text-xs"
              >
                <span className="text-muted-foreground">{table}</span>
                <span className="font-medium tabular-nums">{count}</span>
              </div>
            ))}
        </div>
      )}

      {/* Last Sync */}
      {lastSync && (
        <p className="text-center text-[10px] text-muted-foreground">
          Terakhir cek: {lastSync.toLocaleTimeString("id-ID")}
        </p>
      )}
    </div>
  );
}

/**
 * Inline badge that shows DB status in the sidebar.
 * Green = Convex active, Orange = Supabase fallback, Red = Offline
 */
export function DBStatusBadge({
  convexActive,
}: {
  convexActive: boolean;
}) {
  if (!isSupabaseReady()) return null;

  return (
    <div
      className="flex items-center gap-1.5 rounded-md border px-2 py-1 text-[10px]"
      title={
        convexActive
          ? "Convex aktif (primary)"
          : "Convex error — Supabase fallback aktif"
      }
    >
      <ArrowRightLeft className="size-2.5" />
      <span
        className={
          convexActive ? "text-emerald-600" : "text-amber-600"
        }
      >
        {convexActive ? "Convex ✓" : "Supabase ✓"}
      </span>
    </div>
  );
}
