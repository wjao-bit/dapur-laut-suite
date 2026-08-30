/**
 * DB Status Badge
 *
 * Shows a small indicator in the app showing which database is active.
 * - Green dot = Convex (primary)
 * - Orange dot = Supabase (fallback)
 * - Red dot = Offline
 * - Blue spinner = Syncing data back to Convex
 */

import { useDatabaseStatus } from "@/contexts/DatabaseStatusContext";
import { isSupabaseReady } from "@/lib/supabase";

export function DBStatusBadge() {
  const { activeDB, isFallback, isSyncing, syncQueueCount } =
    useDatabaseStatus();

  const supabaseReady = isSupabaseReady();

  // Don't show badge if everything is normal and Supabase isn't configured
  if (activeDB === "convex" && !isFallback && !isSyncing && !supabaseReady) {
    return null;
  }

  const config = {
    convex: {
      color: "bg-emerald-500",
      pulse: "",
      label: "Convex",
      text: "text-emerald-700 dark:text-emerald-400",
    },
    supabase: {
      color: "bg-amber-500",
      pulse: "animate-pulse",
      label: "Supabase (Fallback)",
      text: "text-amber-700 dark:text-amber-400",
    },
    offline: {
      color: "bg-red-500",
      pulse: "animate-pulse",
      label: "Offline",
      text: "text-red-700 dark:text-red-400",
    },
  }[activeDB];

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div
        className={`
          flex items-center gap-2 rounded-lg border px-3 py-1.5
          bg-card/80 backdrop-blur-sm shadow-sm
          text-xs font-medium
        `}
      >
        {/* Status dot */}
        <span
          className={`h-2 w-2 rounded-full ${config.color} ${config.pulse}`}
        />

        {/* Label */}
        <span className={config.text}>{config.label}</span>

        {/* Syncing indicator */}
        {isSyncing && (
          <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
            <svg
              className="h-3 w-3 animate-spin"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Syncing...
          </span>
        )}

        {/* Sync queue count */}
        {syncQueueCount > 0 && !isSyncing && (
          <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
            {syncQueueCount} pending
          </span>
        )}
      </div>
    </div>
  );
}
