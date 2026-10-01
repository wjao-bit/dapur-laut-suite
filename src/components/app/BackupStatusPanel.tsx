import { useEffect, useState } from "react";
import { useConvex } from "convex/react";
import { toast } from "sonner";
import { DatabaseBackup, Loader2, RefreshCw, CheckCircle2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SectionCard } from "@/components/app/ui";
import {
  backupTableNames,
  isBackupReady,
  readBackupStatus,
  runBackupSnapshot,
  type BackupStatus,
} from "@/lib/backup";

/** Tampilkan stempel waktu ISO sebagai tanggal + jam lokal. */
function formatStamp(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Panel status cadangan Supabase (Mode B).
 * Menampilkan kapan snapshot terakhir jalan + status per tabel, dan
 * tombol untuk menjalankan snapshot manual sekarang.
 */
export function BackupStatusPanel() {
  const client = useConvex();
  const [status, setStatus] = useState<BackupStatus>(() => readBackupStatus());
  const [busy, setBusy] = useState(false);
  const ready = isBackupReady();

  // Segarkan tampilan status saat komponen muncul.
  useEffect(() => {
    setStatus(readBackupStatus());
  }, []);

  const handleBackup = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const next = await runBackupSnapshot(client);
      setStatus({ ...next });
      const failed = Object.values(next.tables).filter((t) => !t.ok).length;
      if (failed === 0) toast.success("Cadangan ke Supabase selesai");
      else toast.warning(`Cadangan selesai, ${failed} tabel gagal — cek status di bawah`);
    } catch (e: any) {
      toast.error(e?.message ?? "Cadangan gagal dijalankan");
    } finally {
      setBusy(false);
    }
  };

  const tables = backupTableNames();

  return (
    <SectionCard
      className="mb-6"
      title={
        <span className="flex items-center gap-2">
          <DatabaseBackup className="size-4 text-teal-600" />
          Cadangan Supabase (Otomatis)
        </span>
      }
      description="Data utama disimpan di Convex. Salinan dicadangkan otomatis ke Supabase setiap 10 menit selama tab aplikasi terbuka."
      actions={
        <Button
          size="sm"
          variant="outline"
          className="cursor-pointer"
          disabled={busy || !ready}
          onClick={handleBackup}
        >
          {busy ? (
            <Loader2 className="mr-1 size-4 animate-spin" />
          ) : (
            <RefreshCw className="mr-1 size-4" />
          )}
          {busy ? "Mencadangkan…" : "Backup Sekarang"}
        </Button>
      }
    >
      {!ready ? (
        <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50/70 p-3 text-xs text-amber-800">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          <span>
            Supabase belum terkonfigurasi. Isi <b>VITE_SUPABASE_URL</b> dan{" "}
            <b>VITE_SUPABASE_ANON_KEY</b> di tab Keys agar cadangan otomatis bisa berjalan.
          </span>
        </div>
      ) : (
        <>
          <p className="mb-3 text-xs text-muted-foreground">
            Snapshot terakhir:{" "}
            <b className="text-foreground">
              {status.lastRun ? formatStamp(status.lastRun) : "belum pernah"}
            </b>
          </p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
            {tables.map((t) => {
              const st = status.tables[t];
              return (
                <div
                  key={t}
                  className="flex items-center justify-between gap-2 rounded-lg border border-border/70 px-2.5 py-2"
                >
                  <span className="truncate text-xs font-medium text-foreground">{t}</span>
                  {st?.ok ? (
                    <span className="inline-flex shrink-0 items-center gap-1 text-[11px] font-semibold text-emerald-600">
                      <CheckCircle2 className="size-3" />
                      {st.count}
                    </span>
                  ) : st ? (
                    <span
                      className="inline-flex shrink-0 items-center gap-1 text-[11px] font-semibold text-rose-600"
                      title={st.error}
                    >
                      <AlertTriangle className="size-3" />
                      gagal
                    </span>
                  ) : (
                    <span className="shrink-0 text-[11px] text-muted-foreground">—</span>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </SectionCard>
  );
}
