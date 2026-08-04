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
