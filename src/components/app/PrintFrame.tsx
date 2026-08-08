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
 *
 * Tampilan mobile: toolbar menumpuk (title + tombol tidak terpotong di layar
 * sempit), padding dokumen diperkecil, dan tombol cetak memakai label pendek.
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
      {/* Toolbar (tidak ikut tercetak) — responsif: menumpuk di layar sempit */}
      <div className="sticky top-0 z-10 flex flex-col gap-2 border-b bg-white px-3 py-2.5 shadow-sm print:hidden sm:flex-row sm:items-center sm:justify-between sm:px-4">
        <p className="min-w-0 truncate text-sm font-semibold text-slate-800 sm:flex-1">{title}</p>
        <div className="flex shrink-0 items-center gap-2">
          <Button size="sm" className="h-9 whitespace-nowrap px-3 sm:h-auto sm:px-4" onClick={() => window.print()}>
            <Printer className="mr-1.5 size-4" />
            <span className="sm:hidden">Cetak</span>
            <span className="hidden sm:inline">Cetak / Simpan PDF</span>
          </Button>
          <Button size="sm" variant="outline" className="h-9 whitespace-nowrap px-3 sm:h-auto sm:px-4" onClick={onClose}>
            <X className="mr-1.5 size-4" />
            Tutup
          </Button>
        </div>
      </div>

      {/* Dokumen */}
      <div className="flex justify-center px-3 py-5 print:block print:p-0 sm:px-4 sm:py-6">
        <div
          className={cn(
            "print-area w-full max-w-[210mm] rounded-lg bg-white p-4 text-slate-900 shadow-xl sm:p-8 print:max-w-none print:rounded-none print:p-0 print:shadow-none",
            className,
          )}
        >
          <PrintBrandHeader />
          <div className="mt-4 sm:mt-6">{children}</div>
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
