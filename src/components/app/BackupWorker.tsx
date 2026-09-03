import { useEffect, useRef } from "react";
import { useConvex } from "convex/react";
import {
  runBackupSnapshot,
  readBackupStatus,
  isBackupReady,
  BACKUP_INTERVAL_MS,
} from "@/lib/backup";

/**
 * Worker cadangan otomatis (Mode B) — hemat kuota Convex.
 *
 * - Snapshot pertama 12 detik setelah halaman dimuat (saat tab terlihat)
 * - Lalu otomatis setiap 10 menit (BACKUP_INTERVAL_MS) — HANYA saat tab
 *   aktif/terlihat. Kalau tab di-minimize/dipindah, tidak ada query Convex
 *   yang dijalankan (backup sendiri tidak boleh membebani limit Convex).
 * - Begitu tab kembali terlihat dan sudah lewat 10 menit sejak cadangan
 *   terakhir → langsung dijalankan sekali.
 *
 * Tidak merender apa pun — hanya komponen penjaga (guard). Status per tabel
 * tersimpan di localStorage (baca lewat readBackupStatus()).
 */
export function BackupWorker() {
  const client = useConvex();
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!isBackupReady()) return; // Supabase belum dikonfigurasi
    let alive = true;

    const doRun = async () => {
      if (!alive || document.visibilityState === "hidden") return;
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

    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      const st = readBackupStatus();
      const last = st.lastRun ? new Date(st.lastRun).getTime() : 0;
      // Tab kembali dibuka & sudah lewat interval sejak cadangan terakhir → jalankan.
      if (Date.now() - last >= BACKUP_INTERVAL_MS) void doRun();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      alive = false;
      clearTimeout(first);
      if (timerRef.current) clearInterval(timerRef.current);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [client]);

  return null;
}
