import { useEffect, useRef } from "react";
import { useConvex } from "convex/react";
import {
  BACKUP_INTERVAL_MS,
  isBackupReady,
  readBackupStatus,
  runBackupSnapshot,
} from "@/lib/backup";

/**
 * Worker cadangan otomatis (Mode B).
 *
 * - Snapshot pertama dijalankan beberapa detik setelah aplikasi siap.
 * - Setelah itu dicek tiap 60 detik; snapshot hanya dijalankan bila sudah
 *   lewat BACKUP_INTERVAL_MS (10 menit) DAN tab sedang terlihat.
 * - Tidak merender apa pun (hanya efek latar).
 */
const FIRST_DELAY_MS = 12 * 1000;
const CHECK_EVERY_MS = 60 * 1000;

export function BackupWorker() {
  const client = useConvex();
  const busy = useRef(false);

  useEffect(() => {
    if (!isBackupReady()) return;
    let cancelled = false;

    const maybeRun = async (force: boolean) => {
      if (cancelled || busy.current) return;
      if (document.visibilityState !== "visible") return;
      if (!force) {
        const { lastRun } = readBackupStatus();
        const last = lastRun ? new Date(lastRun).getTime() : 0;
        if (Date.now() - last < BACKUP_INTERVAL_MS) return;
      }
      busy.current = true;
      try {
        await runBackupSnapshot(client);
      } catch (e: any) {
        console.warn("[Backup] snapshot gagal:", e?.message ?? e);
      } finally {
        busy.current = false;
      }
    };

    const firstTimer = window.setTimeout(() => void maybeRun(true), FIRST_DELAY_MS);
    const interval = window.setInterval(() => void maybeRun(false), CHECK_EVERY_MS);
    const onVisible = () => {
      if (document.visibilityState === "visible") void maybeRun(false);
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cancelled = true;
      window.clearTimeout(firstTimer);
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [client]);

  return null;
}
