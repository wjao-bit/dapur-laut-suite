import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { downloadCsv, type ExportColumn } from "@/lib/export";

/**
 * Tombol "Unduh CSV" yang dipakai berulang di halaman laporan/master.
 * `rows` = data yang akan diunduh (biasanya hasil filter yang sedang tampil).
 */
export function ExportButton<T>({
  rows,
  columns,
  filename,
  label = "Unduh CSV",
  disabled,
  variant = "outline",
  className,
}: {
  rows: T[] | undefined;
  columns: ExportColumn<T>[];
  filename: string;
  label?: string;
  disabled?: boolean;
  variant?: "default" | "outline" | "ghost" | "secondary";
  className?: string;
}) {
  const empty = !rows || rows.length === 0;
  return (
    <Button
      variant={variant}
      className={className}
      disabled={disabled || empty}
      title={empty ? "Belum ada data untuk diunduh" : `Unduh ${rows!.length} baris sebagai CSV`}
      onClick={() => downloadCsv(filename, rows ?? [], columns)}
    >
      <Download className="mr-2 size-4" />
      {label}
    </Button>
  );
}
