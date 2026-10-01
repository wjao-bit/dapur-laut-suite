// ============================================================================
// EXPORT / UNDUH — utilitas murni untuk mengunduh data sebagai CSV.
//
// CSV dipilih karena bisa langsung dibuka di Excel / Google Sheets / HP.
// Pemisah memakai `;` + BOM UTF-8 supaya Excel ber-locale Indonesia membaca
// kolom dan karakter (Rp, é, dsb.) dengan benar.
// ============================================================================

export interface ExportColumn<T = any> {
  /** Kunci field pada baris (dipakai bila `value` tidak diberikan). */
  key: string;
  /** Judul kolom di file CSV. */
  label: string;
  /** Ambil nilai khusus dari baris. */
  value?: (row: T) => unknown;
}

function esc(v: unknown): string {
  const s = v === null || v === undefined ? "" : String(v);
  return /[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** Susun isi CSV (tanpa BOM) dari baris + definisi kolom. */
export function rowsToCsv<T>(rows: T[], columns: ExportColumn<T>[]): string {
  const head = columns.map((c) => esc(c.label)).join(";");
  const body = rows.map((r) =>
    columns.map((c) => esc(c.value ? c.value(r) : (r as any)?.[c.key])).join(";"),
  );
  return [head, ...body].join("\r\n");
}

/**
 * Susun daftar kolom otomatis dari kunci baris pertama (mengabaikan kunci
 * internal seperti `_id`/`_creationTime`).
 */
export function autoColumns<T extends Record<string, any>>(rows: T[]): ExportColumn<T>[] {
  if (rows.length === 0) return [];
  return Object.keys(rows[0])
    .filter((k) => !k.startsWith("_"))
    .map((k) => ({ key: k, label: k }));
}

/** Pemicu unduhan file teks di browser. */
export function downloadTextFile(filename: string, content: string, mime = "text/csv;charset=utf-8") {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

/** Unduh data sebagai file CSV (nama otomatis berakhiran `.csv`). */
export function downloadCsv<T>(filename: string, rows: T[], columns: ExportColumn<T>[]) {
  const nama = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  downloadTextFile(nama, "\uFEFF" + rowsToCsv(rows, columns));
}

/** Nama file dengan tanggal hari ini: "pengeluaran-2026-10-01.csv". */
export function datedFilename(base: string): string {
  const d = new Date();
  const mm = `${d.getMonth() + 1}`.padStart(2, "0");
  const dd = `${d.getDate()}`.padStart(2, "0");
  return `${base}-${d.getFullYear()}-${mm}-${dd}.csv`;
}
