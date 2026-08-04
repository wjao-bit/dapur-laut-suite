// ============================================================================
// Pure business logic for PT Dapur Laut. No Convex/React imports here so this
// module is fully unit-testable with vitest.
// ============================================================================

export type InvoiceTipe = "Supplier" | "Reseller" | "DPL" | "Pasar";
export const INVOICE_TIPES: InvoiceTipe[] = ["Supplier", "Reseller", "DPL", "Pasar"];

export type AbsensiStatus = "Hadir" | "Izin" | "Sakit" | "Alpa";
export const ABSENSI_STATUSES: AbsensiStatus[] = ["Hadir", "Izin", "Sakit", "Alpa"];

export type UtangStatus = "Belum" | "Lunas" | "Parsial";
export const UTANG_STATUSES: UtangStatus[] = ["Belum", "Lunas", "Parsial"];

export type UtangJenis = "Utang" | "Casbon";
export const UTANG_JENISES: UtangJenis[] = ["Utang", "Casbon"];

export const PENGELUARAN_JENISES = [
  "Operasional",
  "Gaji",
  "Utang Karyawan",
  "Transportasi",
  "Listrik & Air",
  "Pembelian Perlengkapan",
  "Lainnya",
] as const;

export interface InvoiceItem {
  kodeBarang: string;
  namaBarang: string;
  hargaModal: number;
  qty: number;
  hargaJual?: number;
  /** Pasar only: stok awal yang dikirim ke pasar */
  stokAwal?: number;
  /** Pasar only: stok sisa yang dikembalikan ke gudang */
  stokAkhir?: number;
  subtotal: number;
}

export interface InvoiceTotals {
  total: number;
  totalModal: number;
  totalPenjualan: number;
  margin: number;
}

/**
 * Hitung total invoice berdasarkan tipe.
 * - Supplier  : pembelian, total = Σ hargaModal*qty (modal)
 * - Reseller  : penjualan, total = Σ hargaJual*qty
 * - DPL       : penjualan, total = Σ hargaJual*qty
 * - Pasar     : penjualan terhitung dari stokAwal - stokAkhir
 */
export function computeInvoiceTotals(tipe: InvoiceTipe, items: InvoiceItem[]): InvoiceTotals {
  let totalModal = 0;
  let totalPenjualan = 0;
  for (const it of items) {
    const terjual =
      tipe === "Pasar" ? (it.stokAwal ?? 0) - (it.stokAkhir ?? 0) : Math.max(0, it.qty || 0);
    totalModal += (it.hargaModal || 0) * terjual;
    totalPenjualan += (tipe === "Supplier" ? it.hargaModal || 0 : it.hargaJual || 0) * terjual;
  }
  const total = tipe === "Supplier" ? totalModal : totalPenjualan;
  return { total, totalModal, totalPenjualan, margin: totalPenjualan - totalModal };
}

export interface AbsensiCounts {
  hadir: number;
  izin: number;
  sakit: number;
  alpa: number;
}

export function emptyAbsensiCounts(): AbsensiCounts {
  return { hadir: 0, izin: 0, sakit: 0, alpa: 0 };
}

export function countAbsensi(records: { status: string }[]): AbsensiCounts {
  const c = emptyAbsensiCounts();
  for (const r of records) {
    if (r.status === "Hadir") c.hadir++;
    else if (r.status === "Izin") c.izin++;
    else if (r.status === "Sakit") c.sakit++;
    else if (r.status === "Alpa") c.alpa++;
  }
  return c;
}

export interface SlipGajiInput {
  gajiPokok: number;
  bonusKerajinan: number;
  bonusBulanan: number;
  denda: number;
  absensi: AbsensiCounts;
  sisaUtang: number;
  sisaCasbon: number;
  hariKerja?: number;
}

export interface SlipGajiComputed {
  hariKerja: number;
  potonganPerHari: number;
  potonganAbsensi: number;
  potonganUtang: number;
  potonganCasbon: number;
  denda: number;
  totalBonus: number;
  totalPotongan: number;
  gajiBersih: number;
}

/**
 * Hitung slip gaji:
 *   GajiBersih = GajiPokok − PotonganAbsensi + BonusKerajinan + BonusBulanan
 *                − (PotonganUtang + PotonganCasbon + Denda)
 * Potongan utang & casbon dibatasi agar gaji bersih tidak negatif.
 */
export function computeSlipGaji(inp: SlipGajiInput): SlipGajiComputed {
  const hariKerja = inp.hariKerja ?? 26;
  const potonganPerHari = hariKerja > 0 ? inp.gajiPokok / hariKerja : 0;
  const potonganAbsensi = Math.round((inp.absensi.alpa + inp.absensi.izin) * potonganPerHari);
  const totalBonus = Math.max(0, inp.bonusKerajinan || 0) + Math.max(0, inp.bonusBulanan || 0);
  const denda = Math.max(0, inp.denda || 0);
  let available = Math.max(0, inp.gajiPokok + totalBonus - potonganAbsensi - denda);
  const potonganUtang = Math.min(Math.max(0, inp.sisaUtang), available);
  available = Math.max(0, available - potonganUtang);
  const potonganCasbon = Math.min(Math.max(0, inp.sisaCasbon), available);
  const totalPotongan = potonganAbsensi + potonganUtang + potonganCasbon + denda;
  const gajiBersih = Math.max(0, inp.gajiPokok + totalBonus - totalPotongan);
  return {
    hariKerja,
    potonganPerHari,
    potonganAbsensi,
    potonganUtang,
    potonganCasbon,
    denda,
    totalBonus,
    totalPotongan,
    gajiBersih,
  };
}

export interface KasLike {
  id: string;
  tanggal: string;
  kasMasuk: number;
  kasKeluar: number;
  saldoAwal?: number;
  saldoAkhir?: number;
  createdAt?: number;
}

/** Urutkan entri kas dan hitung saldo berjalan (SaldoAkhir = SaldoAwal + Masuk - Keluar). */
export function computeKasBalances<T extends KasLike>(
  entries: T[],
): Array<T & { saldoAwal: number; saldoAkhir: number }> {
  const sorted = [...entries].sort((a, b) => {
    if (a.tanggal === b.tanggal) return (a.createdAt ?? 0) - (b.createdAt ?? 0);
    return a.tanggal.localeCompare(b.tanggal);
  });
  let bal = 0;
  return sorted.map((e) => {
    const saldoAwal = bal;
    bal = saldoAwal + (e.kasMasuk || 0) - (e.kasKeluar || 0);
    return { ...e, saldoAwal, saldoAkhir: bal };
  });
}

export interface StokRow {
  id: string;
  namaBarang: string;
  stokAwal: number;
  stokMasuk: number;
  stokKeluar: number;
  stokAkhir: number;
  keterangan?: string;
}

/**
 * Hitung stok gudang dari riwayat perubahan stok.
 * StokAkhir = StokAwal + Σ masuk - Σ keluar (boleh minus).
 */
export function computeGudangRows(
  base: { id: string; namaBarang: string; stokAwal: number; keterangan?: string }[],
  history: { namaBarang: string; perubahan: number }[],
): StokRow[] {
  const map = new Map<string, number>();
  for (const h of history) {
    map.set(h.namaBarang, (map.get(h.namaBarang) ?? 0) + h.perubahan);
  }
  return base.map((b) => {
    const net = map.get(b.namaBarang) ?? 0;
    const masuk = history
      .filter((h) => h.namaBarang === b.namaBarang && h.perubahan > 0)
      .reduce((s, h) => s + h.perubahan, 0);
    const keluar = Math.abs(
      history
        .filter((h) => h.namaBarang === b.namaBarang && h.perubahan < 0)
        .reduce((s, h) => s + h.perubahan, 0),
    );
    return {
      id: b.id,
      namaBarang: b.namaBarang,
      stokAwal: b.stokAwal,
      stokMasuk: masuk,
      stokKeluar: keluar,
      stokAkhir: b.stokAwal + net,
      keterangan: b.keterangan,
    };
  });
}

export interface RekapPihakRow {
  tipe: InvoiceTipe;
  namaPihak: string;
  totalTransaksi: number;
  totalBarang: number;
  totalNilai: number;
}

export function aggregateRekapPihak(
  invoices: { tipe: InvoiceTipe; namaPihak: string; items: InvoiceItem[]; total: number; totalPenjualan: number }[],
): RekapPihakRow[] {
  const map = new Map<string, RekapPihakRow>();
  for (const inv of invoices) {
    const key = `${inv.tipe}|${inv.namaPihak}`;
    const row = map.get(key) ?? { tipe: inv.tipe, namaPihak: inv.namaPihak, totalTransaksi: 0, totalBarang: 0, totalNilai: 0 };
    row.totalTransaksi++;
    row.totalBarang += inv.items.reduce((s, it) => s + (inv.tipe === "Pasar" ? (it.stokAwal ?? 0) - (it.stokAkhir ?? 0) : it.qty), 0);
    row.totalNilai += inv.tipe === "Supplier" ? inv.total : inv.totalPenjualan;
    map.set(key, row);
  }
  return [...map.values()].sort((a, b) => a.tipe.localeCompare(b.tipe) || a.namaPihak.localeCompare(b.namaPihak));
}

export interface MarginProdukRow {
  kodeBarang: string;
  namaBarang: string;
  totalModal: number;
  totalPenjualan: number;
  margin: number;
  marginPct: number;
}

/** Analisis margin per produk dari semua invoice penjualan (non-Supplier). */
export function aggregateMarginByProduk(
  invoices: { tipe: InvoiceTipe; items: InvoiceItem[] }[],
): MarginProdukRow[] {
  const map = new Map<string, MarginProdukRow>();
  for (const inv of invoices) {
    if (inv.tipe === "Supplier") continue;
    for (const it of inv.items) {
      const terjual = inv.tipe === "Pasar" ? (it.stokAwal ?? 0) - (it.stokAkhir ?? 0) : it.qty;
      const modal = (it.hargaModal || 0) * terjual;
      const penjualan = (it.hargaJual || 0) * terjual;
      const row = map.get(it.kodeBarang) ?? {
        kodeBarang: it.kodeBarang,
        namaBarang: it.namaBarang,
        totalModal: 0,
        totalPenjualan: 0,
        margin: 0,
        marginPct: 0,
      };
      row.totalModal += modal;
      row.totalPenjualan += penjualan;
      map.set(it.kodeBarang, row);
    }
  }
  const rows = [...map.values()];
  for (const r of rows) {
    r.margin = r.totalPenjualan - r.totalModal;
    r.marginPct = r.totalPenjualan > 0 ? Math.round((r.margin / r.totalPenjualan) * 1000) / 10 : 0;
  }
  return rows.sort((a, b) => b.margin - a.margin);
}

export interface RekapBarangRow {
  namaBarang: string;
  masuk: number;
  keluar: number;
  net: number;
}

export function aggregateRekapBarang(
  history: { namaBarang: string; perubahan: number }[],
): RekapBarangRow[] {
  const map = new Map<string, RekapBarangRow>();
  for (const h of history) {
    const row = map.get(h.namaBarang) ?? { namaBarang: h.namaBarang, masuk: 0, keluar: 0, net: 0 };
    if (h.perubahan > 0) row.masuk += h.perubahan;
    else row.keluar += Math.abs(h.perubahan);
    row.net += h.perubahan;
    map.set(h.namaBarang, row);
  }
  return [...map.values()].sort((a, b) => a.namaBarang.localeCompare(b.namaBarang));
}

export function genId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2, 5).toUpperCase()}`;
}

export function todayStr(): string {
  const d = new Date();
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

export function thisMonthStr(): string {
  return todayStr().slice(0, 7);
}

/** Tambah N hari ke tanggal YYYY-MM-DD (untuk menghitung jatuh tempo). */
export function addDaysStr(tanggal: string, days: number): string {
  const [y, m, d] = tanggal.split("-").map(Number);
  const dt = new Date(y, (m || 1) - 1, (d || 1) + days);
  const mm = `${dt.getMonth() + 1}`.padStart(2, "0");
  const dd = `${dt.getDate()}`.padStart(2, "0");
  return `${dt.getFullYear()}-${mm}-${dd}`;
}

export function inRange(tanggal: string, from?: string, to?: string): boolean {
  if (from && tanggal < from) return false;
  if (to && tanggal > to) return false;
  return true;
}
