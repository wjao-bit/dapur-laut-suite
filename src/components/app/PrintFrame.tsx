import { useEffect } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { Printer, X } from "lucide-react";
import { PrintBrandHeader } from "@/components/Brand";
import { cn } from "@/lib/utils";

/**
 * Render dokumen (invoice/slip/laporan) ke area cetak lalu panggil window.print().
 * `open` mengontrol tampilan; tombol Cetak / Simpan PDF membuka dialog print browser.
 *
 * PENTING (fix bug print): div dokumen diberi class `print-area` agar aturan
 * `@media print` di index.css (body * { visibility: hidden }) hanya menampilkan
 * dokumen ini — tanpa class tersebut hasil cetak/PDF akan blank.
 */
export function PrintFrame({
  open,
  onClose,
  title,
  children,
  className,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  useEffect(() => {
    if (open) {
      const t = setTimeout(() => {
        // dialog print muncul otomatis setelah render dokumen
        try {
          window.print();
        } catch {
          /* ignore */
        }
      }, 400);
      return () => clearTimeout(t);
    }
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] overflow-auto bg-slate-900/60 backdrop-blur-sm print:static print:bg-white print:backdrop-blur-none">
      {/* Toolbar (tidak ikut tercetak) */}
      <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white px-4 py-2.5 shadow-sm print:hidden">
        <p className="text-sm font-semibold text-slate-800">{title}</p>
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={() => window.print()}>
            <Printer className="mr-2 size-4" />
            Cetak / Simpan PDF
          </Button>
          <Button size="sm" variant="outline" onClick={onClose}>
            <X className="mr-2 size-4" />
            Tutup
          </Button>
        </div>
      </div>

      {/* Dokumen */}
      <div className="flex justify-center px-4 py-6 print:block print:p-0">
        <div
          className={cn(
            "print-area w-full max-w-[210mm] rounded-lg bg-white p-8 text-slate-900 shadow-xl print:max-w-none print:rounded-none print:p-0 print:shadow-none",
            className,
          )}
        >
          <PrintBrandHeader />
          <div className="mt-6">{children}</div>
          <div className="mt-10 border-t border-slate-200 pt-3 text-[10px] text-slate-400 print:block">
            Dokumen ini dibuat otomatis oleh Sistem Manajemen Bisnis Dapur Laut.
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

/** Kolom tanda tangan standar dokumen. */
export function SignatureRow({ label = "Hormat kami" }: { label?: string }) {
  return (
    <div className="grid grid-cols-2 gap-8 text-sm text-slate-800">
      <div>
        <p>Dibuat oleh,</p>
        <div className="mt-14" />
        <p className="font-semibold">____________________</p>
        <p className="text-xs text-slate-500">(Administrasi)</p>
      </div>
      <div>
        <p>{label}</p>
        <div className="mt-14" />
        <p className="font-semibold">____________________</p>
        <p className="text-xs text-slate-500">(Pimpinan Dapur Laut)</p>
      </div>
    </div>
  );
}
