export function formatRupiah(n: number | undefined | null): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n || 0);
}

export function formatNumber(n: number | undefined | null): string {
  return new Intl.NumberFormat("id-ID").format(n || 0);
}

export function formatDate(s: string | undefined | null): string {
  if (!s) return "-";
  const [y, m, d] = s.split("-").map(Number);
  if (!y || !m || !d) return s;
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
}

export function formatDateLong(s: string | undefined | null): string {
  if (!s) return "-";
  const [y, m, d] = s.split("-").map(Number);
  if (!y || !m || !d) return s;
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

export function formatMonth(periode: string | undefined | null): string {
  if (!periode) return "-";
  const [y, m] = periode.split("-").map(Number);
  const d = new Date(y, (m || 1) - 1, 1);
  return d.toLocaleDateString("id-ID", { month: "long", year: "numeric" });
}

export function todayStr(): string {
  const d = new Date();
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

export function thisMonth(): string {
  return todayStr().slice(0, 7);
}

export function monthOptions(count = 12): string[] {
  const out: string[] = [];
  const d = new Date();
  for (let i = 0; i < count; i++) {
    const y = d.getFullYear();
    const m = `${d.getMonth() + 1}`.padStart(2, "0");
    out.push(`${y}-${m}`);
    d.setMonth(d.getMonth() - 1);
  }
  return out;
}

export function genId(prefix: string): string {
  const t = Date.now().toString(36).toUpperCase();
  const r = Math.random().toString(36).slice(2, 5).toUpperCase();
  return `${prefix}-${t}${r}`;
}

/**
 * Parsing angka yang toleran terhadap format Indonesia (dan umum):
 * menerima "0,7", "0.7", "1.500" (ribuan), "1.500,75", "Rp 25.000", " 12 " dst.
 * SELALU mengembalikan angka valid (bukan NaN) — input kosong/tidak valid → 0.
 *
 * Dipakai semua input angka di form agar nilai desimal seperti 0,7 tidak
 * pernah menjadi NaN (yang membuat payload ditolak backend).
 */
export function parseNum(v: string | number | null | undefined): number {
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  if (v === null || v === undefined) return 0;
  const cleaned = String(v).trim().replace(/[^\d.,\-]/g, "");
  if (!cleaned || cleaned === "-" || cleaned === "." || cleaned === ",") return 0;
  let normalized: string;
  const hasComma = cleaned.includes(",");
  const hasDot = cleaned.includes(".");
  if (hasComma && hasDot) {
    // "1.500,75" → titik = ribuan, koma = desimal
    normalized = cleaned.replace(/\./g, "").replace(",", ".");
  } else if (hasComma) {
    // "0,7" → koma = desimal
    normalized = cleaned.replace(",", ".");
  } else if (hasDot) {
    // Ambigu: "1.500" (ribuan) vs "0.7" / "1.5" (desimal).
    // Aturan: titik = ribuan bila ada >1 titik, ATAU grup terakhir tepat 3
    // digit dan angka sebelum titik bukan "0" (mis. "25.000", "1.500").
    // Selain itu titik = desimal ("0.7", "1.5", "3.14159", "0.750").
    const parts = cleaned.split(".");
    const last = parts[parts.length - 1];
    const isThousands =
      parts.length > 2 ||
      (parts.length === 2 &&
        parts[0] !== "" &&
        parts[0] !== "0" &&
        parts[0] !== "-0" &&
        last.length === 3);
    normalized = isThousands ? cleaned.replace(/\./g, "") : cleaned;
  } else {
    normalized = cleaned;
  }
  const n = Number(normalized);
  return Number.isFinite(n) ? n : 0;
}
