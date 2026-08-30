/**
 * Database Status Context
 *
 * Provides app-wide awareness of which database is active:
 * - Convex (primary)
 * - Supabase (fallback when Convex is down)
 *
 * Usage:
 *   const { activeDB, isFallback, isSyncing } = useDatabaseStatus()
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import {
  getHealthStatus,
  onHealthChange,
  isConvexUsable,
} from "@/lib/convex-health";
import { isSupabaseReady } from "@/lib/supabase";

// ============================================================================
// Types
// ============================================================================

type ActiveDB = "convex" | "supabase" | "offline";

interface DatabaseStatusContextValue {
  activeDB: ActiveDB;
  isFallback: boolean;
  isHealthy: boolean;
  isSyncing: boolean;
  syncQueueCount: number;
  forceCheck: () => Promise<void>;
}

// ============================================================================
// Context
// ============================================================================

const DatabaseStatusContext = createContext<DatabaseStatusContextValue>({
  activeDB: "convex",
  isFallback: false,
  isHealthy: true,
  isSyncing: false,
  syncQueueCount: 0,
  forceCheck: async () => {},
});

export function useDatabaseStatus(): DatabaseStatusContextValue {
  return useContext(DatabaseStatusContext);
}

// ============================================================================
// Provider
// ============================================================================

interface Props {
  children: ReactNode;
}

export function DatabaseStatusProvider({ children }: Props) {
  const [activeDB, setActiveDB] = useState<ActiveDB>("convex");
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncQueueCount, setSyncQueueCount] = useState(0);

  // Update active DB based on health status
  useEffect(() => {
    const update = () => {
      const health = getHealthStatus();
      const supabaseReady = isSupabaseReady();

      if (health === "healthy") {
        setActiveDB("convex");
      } else if (health === "down" && supabaseReady) {
        setActiveDB("supabase");
      } else if (health === "down" && !supabaseReady) {
        setActiveDB("offline");
      } else {
        // degraded - try Convex first
        setActiveDB("convex");
      }
    };

    update();
    const unsub = onHealthChange(update);
    return unsub;
  }, []);

  // Check sync queue periodically
  useEffect(() => {
    const check = () => {
      try {
        const raw = localStorage.getItem("dl-sync-queue");
        const queue = raw ? JSON.parse(raw) : [];
        setSyncQueueCount(queue.length);
      } catch {
        setSyncQueueCount(0);
      }
    };

    check();
    const interval = setInterval(check, 5000);
    return () => clearInterval(interval);
  }, []);

  // Process sync queue when Convex recovers
  useEffect(() => {
    const unsub = onHealthChange(async () => {
      if (isConvexUsable() && syncQueueCount > 0) {
        setIsSyncing(true);
        try {
          // Dynamic import to avoid circular deps
          const { processSyncQueue } = await import("@/lib/db-fallback");
          const result = await processSyncQueue(
            async (
              table: string,
              action: string,
              record: Record<string, unknown>,
              _matchField?: string,
              _matchValue?: unknown,
            ) => {
              console.log(`[Sync] ${action} on ${table}:`, record);
              return true;
            },
          );
          console.log(
            `[Sync] Processed: ${result.processed}, Failed: ${result.failed}`,
          );
        } finally {
          setIsSyncing(false);
        }
      }
    });

    return unsub;
  }, [syncQueueCount]);

  const forceCheck = useCallback(async () => {
    const { checkConvexHealth, reportSuccess } = await import(
      "@/lib/convex-health"
    );
    const isAlive = await checkConvexHealth();
    if (isAlive) {
      reportSuccess();
    }
  }, []);

  return (
    <DatabaseStatusContext.Provider
      value={{
        activeDB,
        isFallback: activeDB === "supabase",
        isHealthy: activeDB === "convex",
        isSyncing,
        syncQueueCount,
        forceCheck,
      }}
    >
      {children}
    </DatabaseStatusContext.Provider>
  );
}
