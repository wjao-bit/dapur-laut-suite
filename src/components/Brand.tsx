import { cn } from "@/lib/utils";

/** Logo mark Dapur Laut — ikan/ombak dalam bentuk geometris modern. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-xl bg-gradient-to-br from-sky-600 via-teal-600 to-emerald-600 text-white shadow-sm",
        className,
      )}
    >
      <svg viewBox="0 0 24 24" fill="none" className="size-[60%]" aria-hidden>
        {/* Fish silhouette */}
        <path
          d="M2 12c2.5-1.8 5-2.6 7.5-2.4 1.5-3.2 3.8-5.4 6.6-6.6.8 1.6.8 3.2 0 4.8 1.6.6 2.9 1.7 3.9 3.2-1 .8-2.3 1.3-3.6 1.5-.4 1.9-.9 3.5-1.6 4.8-2.7-1-4.8-3.1-5.3-6.1C4.8 11.6 3.2 12 2 12Z"
          fill="currentColor"
        />
        {/* Wave */}
        <path
          d="M4.5 17.5c1.2-.6 2.4-.6 3.6 0 1.2.6 2.4.6 3.6 0 1.2-.6 2.4-.6 3.6 0"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
          opacity="0.85"
        />
      </svg>
    </div>
  );
}

export function BrandLockup({ className, markClassName }: { className?: string; markClassName?: string }) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <LogoMark className={cn("size-9", markClassName)} />
      <div className="leading-tight">
        <p className="text-[15px] font-bold tracking-tight text-foreground">Dapur Laut</p>
        <p className="text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
          Manajemen Bisnis &amp; Distribusi
        </p>
      </div>
    </div>
  );
}

/** Header branding untuk dokumen cetak (invoice / slip / laporan). */
export function PrintBrandHeader({ subtitle }: { subtitle?: string }) {
  return (
    <div className="flex items-center justify-between border-b-2 border-sky-700 pb-3">
      <div className="flex items-center gap-3">
        <LogoMark className="size-12 rounded-lg" />
        <div>
          <p className="text-xl font-bold tracking-tight text-slate-900">Dapur Laut</p>
          <p className="text-[11px] text-slate-600">
            Kepulauan Riau · Batam, Tanjung Uncang, Tunas Regency
          </p>
        </div>
      </div>
      {subtitle && (
        <div className="text-right">
          <p className="text-base font-semibold text-slate-900">{subtitle}</p>
          <p className="text-[11px] text-slate-500">Dokumen Resmi Perusahaan</p>
        </div>
      )}
    </div>
  );
}
