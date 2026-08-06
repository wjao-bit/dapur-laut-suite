import { useMemo, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface BarangOption {
  kode: string;
  nama: string;
  harga?: number;
  kategori?: string;
}

interface BarangSearchProps {
  /** Daftar barang master (dari api.queries.listBarang). */
  barang: BarangOption[];
  /** Nilai input saat ini (nama barang yang diketik). */
  value: string;
  onChange: (v: string) => void;
  /** Dipanggil saat pengguna memilih hasil pencarian. */
  onPick: (b: BarangOption) => void;
  placeholder?: string;
  className?: string;
  /** Pesan saat tidak ada yang cocok (barang belum ada di database). */
  notFoundText?: string;
}

/**
 * Input pencarian barang: ketik nama → otomatis tampilkan kode & item yang cocok.
 * Dipakai di semua form input barang (Invoice, Retur, Gudang, dll). Bila tidak
 * ada yang cocok, tampilkan notifikasi bahwa barang belum terdaftar.
 */
export function BarangSearch({
  barang,
  value,
  onChange,
  onPick,
  placeholder = "Ketik nama barang…",
  className,
  notFoundText = "Barang belum terdaftar — data akan dibuat otomatis saat disimpan.",
}: BarangSearchProps) {
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  const q = value.trim().toLowerCase();

  const matches = useMemo(() => {
    if (!q) return [];
    return barang
      .filter(
        (b) =>
          b.nama.toLowerCase().includes(q) ||
          b.kode.toLowerCase().includes(q) ||
          (b.kategori ?? "").toLowerCase().includes(q),
      )
      .slice(0, 8);
  }, [barang, q]);

  const showList = focused && q.length > 0;
  const noMatch = showList && matches.length === 0;

  return (
    <div ref={boxRef} className={cn("relative", className)}>
      <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
      <Input
        className="h-8 pl-8 pr-7"
        placeholder={placeholder}
        value={value}
        autoComplete="off"
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => setTimeout(() => setFocused(false), 150)}
      />
      {value && (
        <button
          type="button"
          className="absolute top-1/2 right-2 -translate-y-1/2 rounded-full p-0.5 text-muted-foreground hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:outline-none"
          onMouseDown={(e) => {
            e.preventDefault();
            onChange("");
          }}
          title="Bersihkan"
          aria-label="Bersihkan pencarian"
        >
          <X className="size-3" />
        </button>
      )}

      {showList && matches.length > 0 && (
        <div className="absolute z-30 mt-1 max-h-56 w-full overflow-y-auto rounded-md border bg-popover p-1 shadow-md">
          {matches.map((b) => (
            <button
              key={b.kode}
              type="button"
              className="flex w-full items-center justify-between gap-2 rounded-sm px-2.5 py-1.5 text-left text-xs hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:outline-none"
              onMouseDown={(e) => {
                e.preventDefault();
                onPick(b);
                onChange(b.nama);
                setOpen(false);
                (document.activeElement as HTMLElement)?.blur();
              }}
            >
              <span className="flex min-w-0 items-center gap-2">
                <span className="font-medium text-foreground">{b.nama}</span>
                {b.kategori && <span className="shrink-0 text-[10px] text-muted-foreground">{b.kategori}</span>}
              </span>
              <span className="shrink-0 font-mono text-[10px] text-muted-foreground">{b.kode}</span>
            </button>
          ))}
        </div>
      )}

      {noMatch && (
        <div className="absolute z-30 mt-1 w-full rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-[11px] text-amber-700">
          {notFoundText}
        </div>
      )}
    </div>
  );
}
