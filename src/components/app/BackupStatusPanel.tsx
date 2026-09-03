import { useEffect, useState } from "react";
import { useConvex } from "convex/react";
import { toast } from "sonner";
import {
  DatabaseBackup,
  RefreshCw,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock3,
  TriangleAlert,
  ServerOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SectionCard } from "@/components/app/ui";
import {
  runBackupSnapshot,
  readBackupStatus,
  backupTableNames,
  isBackupReady,
  BACKUP_INTERVAL_MS,
  type BackupStatus,
  type BackupTableStatus,
} from "@/lib/backup";

/** Nama tabel Supabase → label Indonesia untuk panel. */
const TABLE_LABEL: Record<string, string> = {
  barang: "Barang",
  supplier: "Supplier",
  reseller: "Reseller",
  dpl: "DPL (Pasar Grosir)",
  pasar: "Pasar (Victoria/Tunas)",
  karyawan: "Karyawan",
  bahan_baku: "Bahan Baku",
  barang_jadi: "Barang Jadi",
  gudang: "Gudang & Stok",
  invoice: "Invoice",
  kas: "Kas Harian",
  pengeluaran: "Pengeluaran",
  absensi: "Absensi",
  utang: "Utang",
  slipgaji: "Slip Gaji",
  batch_masuk: "Barang Masuk (Batch)",
};

function fmtTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("id-ID", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  } catch {
    return "—";
  }
}

function StatusBadge({ st, pending }: { st?: BackupTableStatus; pending?: boolean }) {
  if (pending || st?.ok === undefined) {
    if (pending)
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-sky-100 px-2 py-0.5 text-[11px] font-semibold text-sky-700">
          <Loader2 className="size-3 animate-spin" /> Mencadangkan…
        </span>
      );
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500">
        Belum pernah
      </span>
    );
  }
  if (st.ok) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
        <CheckCircle2 className="size-3" /> OK
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 text-[11px] font-semibold text-rose-700">
      <XCircle className="size-3" /> Gagal
    </span>
  );
}

export function BackupStatusPanel() {
  const client = useConvex();
  const [status, setStatus] = useState<BackupStatus>(() => readBackupStatus());
  const [busy, setBusy] = useState(false);

  // Pantau status cadangan (ditulis worker/manual ke localStorage).
  useEffect(() => {
    const t = setInterval(() => {
      setStatus(readBackupStatus());
    }, 2_000);
    return () => clearInterval(t);
  }, []);

  const ready = isBackupReady();
  const names = backupTableNames();
  const okCount = names.filter((n) => status.tables[n]?.ok).length;
  const failCount = names.filter((n) => status.tables[n] && !status.tables[n].ok).length;
  const neverCount = names.length - okCount - failCount;

  const handleManualBackup = async () => {
    if (!ready || busy || status.running) return;
    setBusy(true);
    try {
      const res = await runBackupSnapshot(client);
      setStatus(res);
      const fails = backupTableNames().filter((n) => res.tables[n] && !res.tables[n].ok);
      if (fails.length === 0) {
        toast.success(`Cadangan selesai — ${backupTableNames().length} tabel tersalin ke Supabase`);
      } else {
        toast.warning(`Cadangan selesai, tapi ${fails.length} tabel gagal (lihat daftar di bawah)`);
      }
    } catch (e: any) {
      toast.error(e?.message ?? "Gagal menjalankan cadangan");
    } finally {
      setBusy(false);
      setStatus(readBackupStatus());
    }
  };

  return (
    <SectionCard
      className="mb-6"
      title={
        <span className="flex items-center gap-2">
          <DatabaseBackup className="size-4 text-teal-600" />
          Cadangan Supabase (Mode B)
        </span>
      }
      description="Data Convex disalin otomatis ke Supabase sebagai jaring pengaman — bukan untuk mengurangi limit Convex (baca catatan di bawah)."
    >
      {!ready ? (
        <div className="flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50/70 p-4 sm:flex-row sm:items-center">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-amber-100">
            <ServerOff className="size-5 text-amber-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-amber-900">Supabase belum dikonfigurasi</p>
            <p className="mt-0.5 text-xs text-amber-800">
              Isi kunci Supabase di tab <b>Keys/API keys</b> (URL + anon key) supaya cadangan otomatis aktif.
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Ringkasan + tombol */}
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 font-medium text-slate-600">
                <Clock3 className="size-3.5 text-slate-400" />
                Terakhir: {fmtTime(status.lastRun)}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 font-medium text-emerald-700">
                <CheckCircle2 className="size-3.5" />
                {okCount}/{names.length} tabel OK
              </span>
              {failCount > 0 && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 font-medium text-rose-700">
                  <XCircle className="size-3.5" />
                  {failCount} gagal
                </span>
              )}
              {neverCount > 0 && status.lastRun && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 font-medium text-slate-500">
                  {neverCount} belum pernah
                </span>
              )}
              {status.running && (
                <span className="inline-flex items-center gap-1.5 font-medium text-sky-600">
                  <Loader2 className="size-3.5 animate-spin" />
                  Sedang mencadangkan…
                </span>
              )}
            </div>
            <Button
              onClick={handleManualBackup}
              disabled={busy || status.running}
              className="h-9 cursor-pointer text-sm"
              variant="outline"
            >
              {busy || status.running ? (
                <Loader2 className="mr-1.5 size-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-1.5 size-4" />
              )}
              {busy || status.running ? "Mencadangkan…" : "Backup Sekarang"}
            </Button>
          </div>

          {/* Daftar status per tabel */}
          <div className="overflow-x-auto rounded-xl border border-border/60">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead>
                <tr className="border-b border-border/60 bg-muted/40 text-[11px] uppercase tracking-wide text-muted-foreground">
                  <th className="px-3 py-2 font-semibold">Tabel</th>
                  <th className="px-3 py-2 font-semibold">Status</th>
                  <th className="px-3 py-2 text-right font-semibold">Baris</th>
                  <th className="px-3 py-2 font-semibold">Waktu</th>
                </tr>
              </thead>
              <tbody>
                {names.map((name) => {
                  const st = status.tables[name];
                  const pending = status.running && !st;
                  return (
                    <tr key={name} className="border-b border-border/40 last:border-0">
                      <td className="px-3 py-2 font-medium">{TABLE_LABEL[name] ?? name}</td>
                      <td className="px-3 py-2">
                        <StatusBadge st={st} pending={pending} />
                        {st?.error && (
                          <p className="mt-1 max-w-[340px] truncate text-[11px] text-rose-600" title={st.error}>
                            {st.error}
                          </p>
                        )}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums text-muted-foreground">
                        {st ? st.count.toLocaleString("id-ID") : "—"}
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">{st ? fmtTime(st.at) : "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Catatan jujur tentang limit Convex */}
          <div className="mt-3 flex flex-col gap-2 rounded-xl border border-sky-200/70 bg-sky-50/60 p-3.5 sm:flex-row sm:items-start">
            <TriangleAlert className="mt-0.5 size-4 shrink-0 text-sky-600" />
            <p className="text-xs leading-relaxed text-sky-900">
              <b>Cadangan ≠ penghemat limit Convex.</b> Cadangan ini otomatis berjalan{" "}
              {Math.round(BACKUP_INTERVAL_MS / 60000)} menit sekali (hanya saat tab terbuka) dan melindungi data kamu
              kalau Convex bermasalah. Namun selama menu masih membaca Convex, kuota Convex tetap terpakai — cadangan
              berkala ikut memakai sedikit kuota baca. Satu-satunya cara <b>menekan pemakaian limit Convex</b> adalah
              memindahkan menu (mulai dari yang paling sering dibuka: Gudang, Invoice, Laporan) agar membaca langsung
              dari Supabase — bilang saja kalau mau aku pindahkan bertahap.
            </p>
          </div>
        </>
      )}
    </SectionCard>
  );
}
