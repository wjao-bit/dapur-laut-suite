import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
import { RotateCcw, Trash2, ArchiveRestore, ArchiveX, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { BadgeStatus } from "@/components/app/ui";
import { formatCurrency } from "@/lib/business";
import { formatDate } from "@/lib/format";

/**
 * SAMPAH (Recycle Bin) invoice.
 *
 * Invoice yang dihapus TIDAK langsung hilang — dipindah ke Sampah (soft
 * delete). Kas & stok TIDAK dibatalkan selama masih di Sampah, jadi invoice
 * bisa dipulihkan UTUH kapan saja:
 *   - "Pulihkan" → invoice kembali ke daftar aktif (efek kas & stok tetap
 *     seperti semula, tanpa perlu hitung ulang).
 *   - "Hapus Permanen" → efek kas & stok dibatalkan (riwayat stok & entri kas
 *     dihapus, saldo dihitung ulang) lalu invoice dihapus selamanya.
 */
export function InvoiceTrashDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const trash = useQuery(api.queries.listInvoiceTrash);
  const restore = useMutation(api.business.restoreInvoice);
  const purge = useMutation(api.business.purgeInvoice);

  /** idInvoice yang sedang diproses (spinner di baris itu). */
  const [busyId, setBusyId] = useState<string | null>(null);

  const handleRestore = async (idInvoice: string) => {
    setBusyId(idInvoice);
    try {
      await restore({ idInvoice });
      toast.success(`Invoice ${idInvoice} dipulihkan — kembali ke daftar aktif.`);
    } catch (e: any) {
      toast.error(e?.data?.message ?? e?.message ?? `Gagal memulihkan ${idInvoice}`);
    } finally {
      setBusyId(null);
    }
  };

  const handlePurge = async (idInvoice: string) => {
    setBusyId(idInvoice);
    try {
      await purge({ idInvoice });
      toast.success(`Invoice ${idInvoice} dihapus permanen — kas & stok dikembalikan otomatis.`);
    } catch (e: any) {
      toast.error(e?.data?.message ?? e?.message ?? `Gagal menghapus ${idInvoice}`);
    } finally {
      setBusyId(null);
    }
  };

  const rows = trash ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArchiveRestore className="size-5 text-teal-600" />
            Sampah Invoice ({rows.length})
          </DialogTitle>
          <DialogDescription>
            Invoice yang dihapus berpindah ke sini. Kas &amp; stok tidak diubah sampai dihapus
            permanen — invoice bisa dipulihkan utuh kapan saja.
          </DialogDescription>
        </DialogHeader>

        {trash === undefined ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        ) : rows.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed py-10 text-center">
            <ArchiveX className="size-8 text-muted-foreground/50" />
            <p className="text-sm font-medium text-muted-foreground">Sampah kosong</p>
            <p className="max-w-xs text-xs text-muted-foreground/70">
              Invoice yang Anda hapus akan muncul di sini dan bisa dipulihkan.
            </p>
          </div>
        ) : (
          <div className="divide-y rounded-lg border">
            {rows.map((r) => {
              const busy = busyId === r.idInvoice;
              return (
                <div key={r.idInvoice} className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-foreground">{r.idInvoice}</span>
                      <BadgeStatus status={r.tipe} />
                      <span className="text-[11px] text-muted-foreground">
                        dihapus {formatDate(new Date(r.deletedAt).toISOString().slice(0, 10))}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {r.namaPihak} · {formatDate(r.tanggal)} ·{" "}
                      <span className="font-medium text-foreground tabular-nums">
                        {formatCurrency(r.total, "Rp")}
                      </span>
                      {r.tipe !== "Supplier" && r.margin != null && (
                        <span className={r.margin >= 0 ? "text-sky-600" : "text-rose-600"}>
                          {" "}
                          (margin {formatCurrency(r.margin, "Rp")})
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 cursor-pointer text-xs text-teal-700 hover:text-teal-700"
                      onClick={() => handleRestore(r.idInvoice)}
                      disabled={busy}
                    >
                      {busy ? <Loader2 className="mr-1 size-3.5 animate-spin" /> : <RotateCcw className="mr-1 size-3.5" />}
                      Pulihkan
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 cursor-pointer text-xs text-rose-600 hover:text-rose-600"
                          disabled={busy}
                        >
                          <Trash2 className="mr-1 size-3.5" />
                          Hapus Permanen
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Hapus permanen {r.idInvoice}?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Kas &amp; riwayat stok invoice ini akan dikembalikan otomatis, dan invoice
                            tidak bisa dipulihkan lagi. Yakin ingin melanjutkan?
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Batal</AlertDialogCancel>
                          <AlertDialogAction
                            className="bg-rose-600 hover:bg-rose-700"
                            onClick={() => handlePurge(r.idInvoice)}
                          >
                            Hapus Permanen
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Tutup
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
