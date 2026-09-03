import { useEffect, useRef } from "react";
import { useConvex } from "convex/react";
import { runBackupSnapshot, isBackupReady, BACKUP_INTERVAL_MS } from "@/lib/backup";

/**
 * Worker cadangan otomatis (Mode B).
 *
 * Selama aplikasi terbuka:
 *  - 12 detik setelah halaman dimuat → snapshot pertama (Convex → Supabase)
 *  - lalu otomatis setiap 5 menit
 *
 * Tidak merender apa pun — hanya komponen penjaga (guard). Status setiap
 * tabel tersimpan di localStorage (baca lewat readBackupStatus()).
 */
export function BackupWorker() {
  const client = useConvex();
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!isBackupReady()) return; // Supabase belum dikonfigurasi
    let alive = true;

    const doRun = async () => {
      if (!alive) return;
      try {
        await runBackupSnapshot(client);
      } catch (e: any) {
        console.warn("[Backup] worker error:", e?.message ?? e);
      }
    };

    const first = setTimeout(() => {
      void doRun();
    }, 12_000);

    timerRef.current = setInterval(() => {
      void doRun();
    }, BACKUP_INTERVAL_MS);

    return () => {
      alive = false;
      clearTimeout(first);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [client]);

  return null;
}
