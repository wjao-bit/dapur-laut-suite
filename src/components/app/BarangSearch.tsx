import { useDeferredValue, useMemo, useRef, useState } from "react";
import { Loader2, Plus, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { formatRupiah } from "@/lib/format";

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
  /**
   * Opsional: bila diberikan, saat barang tidak ditemukan akan muncul tombol
   * "Tambah ke database" yang memanggil onCreateNew(nama). Biasanya dipakai di
   * form invoice untuk membuat barang baru + kode otomatis secara instan.
   */
  onCreateNew?: (nama: string) => void;
  /** Sedang menyimpan barang baru (menampilkan spinner di tombol). */
  creatingNew?: boolean;
  /** Preview kode yang akan dipakai saat barang baru dibuat (mis. "BRG001"). */
  nextKode?: string;
}

/** Bungkus potongan teks yang cocok dengan query memakai sorotan kuning. */
function Highlight({ text, query }: { text: string; query: string }) {
  const q = query.trim();
  if (!q) return <>{text}</>;
  const lower = text.toLowerCase();
  const ql = q.toLowerCase();
  const parts: { s: string; hit: boolean }[] = [];
  let i = 0;
  while (i < text.length) {
    const idx = lower.indexOf(ql, i);
    if (idx < 0) {
      parts.push({ s: text.slice(i), hit: false });
      break;
    }
    if (idx > i) parts.push({ s: text.slice(i, idx), hit: false });
    parts.push({ s: text.slice(idx, idx + ql.length), hit: true });
    i = idx + ql.length;
  }
  return (
    <>
      {parts.map((p, k) =>
        p.hit ? (
          <mark key={k} className="rounded-sm bg-yellow-200 px-0.5 text-foreground">
            {p.s}
          </mark>
        ) : (
          <span key={k}>{p.s}</span>
        ),
      )}
    </>
  );
}

/**
 * Input pencarian barang bergaya POS: ketik nama → dropdown berisi nama dengan
 * teks cocok disorot + kode & harga. Bila tidak ada yang cocok, panel
 * "Tambah ke database" (bila onCreateNew disediakan) SELALU tampil — tidak
 * tergantung fokus — supaya pengguna langsung bisa menambahkan barang baru.
 *
 * Pencarian memakai useDeferredValue agar UI tetap responsif saat mengetik
 * cepat (hasil filter tidak menghalangi ketikan berikutnya). Ukuran input &
 * item dropdown diperbesar di layar sentuh (Android) supaya mudah ditekan.
 */
export function BarangSearch({
  barang,
  value,
  onChange,
  onPick,
  placeholder = "Ketik nama barang…",
  className,
  notFoundText = "Barang belum terdaftar — data akan dibuat otomatis saat disimpan.",
  onCreateNew,
  creatingNew = false,
  nextKode,
}: BarangSearchProps) {
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  const q = value.trim().toLowerCase();
  const hasQuery = q.length > 0;
  // Filter dihitung dengan nilai "tertunda" → mengetik tidak tersendat.
  const deferredQ = useDeferredValue(q);
  const deferredHasQuery = deferredQ.length > 0;

  const matches = useMemo(() => {
    if (!deferredHasQuery) return [];
    return barang
      .filter(
        (b) =>
          b.nama.toLowerCase().includes(deferredQ) ||
          b.kode.toLowerCase().includes(deferredQ) ||
          (b.kategori ?? "").toLowerCase().includes(deferredQ),
      )
      .slice(0, 8);
  }, [barang, deferredQ, deferredHasQuery]);

  // Daftar hasil hanya saat fokus; panel "tidak ditemukan" selalu tampil.
  const showList = focused && hasQuery && matches.length > 0;
  const noMatch = hasQuery && matches.length === 0 && deferredHasQuery;

  return (
    <div ref={boxRef} className={cn("relative", className)}>
      <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground sm:size-3.5" />
      <Input
        className="h-9 pl-8 pr-8 text-base sm:h-8 sm:pl-8 sm:pr-7 sm:text-sm"
        placeholder={placeholder}
        value={value}
        autoComplete="off"
        spellCheck={false}
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
          className="absolute top-1/2 right-2 -translate-y-1/2 rounded-full p-1 text-muted-foreground hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:outline-none"
          onMouseDown={(e) => {
            e.preventDefault();
            onChange("");
          }}
          title="Bersihkan"
          aria-label="Bersihkan pencarian"
        >
          <X className="size-3.5" />
        </button>
      )}

      {showList && (
        <div className="absolute z-30 mt-1 max-h-64 w-full overflow-y-auto rounded-md border bg-popover p-1 shadow-md">
          {matches.map((b) => (
            <button
              key={b.kode}
              type="button"
              className="flex w-full cursor-pointer items-center justify-between gap-2 rounded-sm px-2.5 py-2.5 text-left text-sm hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:outline-none sm:py-1.5 sm:text-xs"
              onMouseDown={(e) => {
                e.preventDefault();
                onPick(b);
                setOpen(false);
                (document.activeElement as HTMLElement)?.blur();
              }}
            >
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium text-foreground">
                  <Highlight text={b.nama} query={value} />
                </span>
                <span className="mt-0.5 flex items-center gap-1.5">
                  <span className="font-mono text-[10px] text-muted-foreground">{b.kode}</span>
                  {b.kategori && <span className="text-[10px] text-muted-foreground">· {b.kategori}</span>}
                </span>
              </span>
              {typeof b.harga === "number" && b.harga > 0 && (
                <span className="shrink-0 text-[10px] tabular-nums text-muted-foreground">
                  {formatRupiah(b.harga)}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {noMatch && !onCreateNew && (
        <div className="absolute z-30 mt-1 w-full rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-[11px] text-amber-700">
          {notFoundText}
        </div>
      )}

      {noMatch && onCreateNew && (
        <div className="absolute z-30 mt-1 w-full rounded-md border bg-popover p-1.5 shadow-md">
          <p className="px-1 pb-1.5 text-[11px] text-muted-foreground">
            <span className="font-medium text-amber-700">"{value.trim()}"</span> belum terdaftar di database.
          </p>
          <button
            type="button"
            disabled={creatingNew}
            onMouseDown={(e) => {
              e.preventDefault();
              if (!creatingNew && value.trim()) onCreateNew(value.trim());
            }}
            className="flex w-full cursor-pointer items-center justify-between gap-2 rounded-md border border-teal-200 bg-teal-50 px-2.5 py-2.5 text-left text-sm font-medium text-teal-700 transition-colors hover:bg-teal-100 focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:outline-none disabled:cursor-wait disabled:opacity-60 sm:py-2 sm:text-xs"
          >
            <span className="flex items-center gap-1.5">
              {creatingNew ? <Loader2 className="size-3.5 animate-spin" /> : <Plus className="size-3.5" />}
              {creatingNew ? "Menyimpan ke database…" : `Tambah "${value.trim()}" ke database`}
            </span>
            {nextKode && (
              <span className="shrink-0 font-mono text-[10px] text-teal-600">Kode: {nextKode}</span>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
