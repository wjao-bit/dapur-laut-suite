import { ConvexError, v, type Infer } from "convex/values";
import { type QueryCtx, type MutationCtx } from "./_generated/server";
import { computeKasBalances, todayStr } from "../lib/business";

// ============================================================================
// Helpers Convex — logging, validasi, upsert-by-key (ON CONFLICT semantics)
// ============================================================================

export function logRequest(route: string, payload: unknown) {
  console.log(`[Dapur Laut] ${route} request:`, JSON.stringify(payload, null, 2));
}

export function logResponse(route: string, payload: unknown) {
  console.log(`[Dapur Laut] ${route} response:`, JSON.stringify(payload, null, 2));
}

/**
 * Lempar error validasi dengan pesan yang SEBENARNYA terjadi.
 * `error` dan `message` sama-sama berisi alasan asli (mis. "Nomor HP atau
 * password salah") sehingga frontend menampilkan alasan yang jelas, bukan
 * label generik "Payload tidak sesuai schema".
 */
export function badRequest(message: string, extra?: unknown): never {
  console.error(`[Dapur Laut] Invalid request:`, message, extra ?? "");
  throw new ConvexError({ error: message, message, detail: (extra ?? null) as any });
}

export function genBusinessId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

type BusinessTable =
  | "barang"
  | "supplier"
  | "reseller"
  | "dpl"
  | "pasar"
  | "karyawan"
  | "absensi"
  | "utang"
  | "invoice"
  | "retur"
  | "kas"
  | "slipgaji"
  | "gudang"
  | "pengeluaran"
  | "bahanBaku"
  | "barangJadi"
  | "tetesanStok"
  | "invoiceTetesan"
  | "katalogHarga";

/**
 * Upsert dengan semantik PRIMARY KEY/UNIQUE: cari dokumen berdasarkan kolom
 * kunci bisnis; jika ada → patch, jika tidak → insert. Setara ON CONFLICT DO UPDATE.
 */
export async function upsertByKey<T extends { _id: string }>(
  ctx: MutationCtx,
  table: BusinessTable,
  keyField: "kode" | "id" | "idInvoice" | "namaBarang",
  keyValue: string,
  doc: Record<string, unknown>,
): Promise<{ _id: string; created: boolean }> {
  const existing = await (ctx.db.query(table) as any)
    .filter((q: any) => q.eq(q.field(keyField), keyValue))
    .first();
  if (existing) {
    await (ctx.db as any).patch(existing._id, doc);
    return { _id: existing._id, created: false };
  }
  const _id = await (ctx.db as any).insert(table, { ...doc, [keyField]: keyValue });
  return { _id, created: true };
}

/** Cari dokumen berdasarkan kunci bisnis (untuk query). */
export async function findOneByKey(
  ctx: QueryCtx,
  table: BusinessTable,
  keyField: "kode" | "id" | "idInvoice" | "namaBarang",
  keyValue: string,
) {
  return (ctx.db.query(table) as any)
    .filter((q: any) => q.eq(q.field(keyField), keyValue))
    .first();
}

/**
 * Rekalkulasi saldo semua entri kas setelah perubahan apa pun.
 * SaldoAkhir = SaldoAwal + KasMasuk - KasKeluar (berurutan per tanggal).
 */
export async function recomputeKas(ctx: MutationCtx) {
  const entries = await ctx.db.query("kas").collect();
  const withBalances = computeKasBalances(
    entries.map((e) => ({
      id: e.id,
      tanggal: e.tanggal,
      kasMasuk: e.kasMasuk,
      kasKeluar: e.kasKeluar,
      saldoAwal: e.saldoAwal,
      saldoAkhir: e.saldoAkhir,
      createdAt: e._creationTime,
    })),
  );
  for (let i = 0; i < entries.length; i++) {
    const e = entries[i];
    const b = withBalances.find((x) => x.id === e.id);
    if (b && (b.saldoAwal !== e.saldoAwal || b.saldoAkhir !== e.saldoAkhir)) {
      await ctx.db.patch(e._id, { saldoAwal: b.saldoAwal, saldoAkhir: b.saldoAkhir });
    }
  }
}

/**
 * Catat satu entri kas dengan ID unik (refKey) → tidak ada duplikasi.
 * `id` unik = KAS-<sumber>-<ref>. Jika sudah ada, di-patch (bukan duplikat).
 */
export async function recordKas(
  ctx: MutationCtx,
  refKey: string,
  tanggal: string,
  kasMasuk: number,
  kasKeluar: number,
  keterangan: string,
  sumber: string,
) {
  const existing = await findOneByKey(ctx, "kas", "id", refKey);
  if (existing) {
    await ctx.db.patch(existing._id, { tanggal, kasMasuk, kasKeluar, keterangan, sumber });
  } else {
    await ctx.db.insert("kas", {
      id: refKey,
      tanggal,
      kasMasuk,
      kasKeluar,
      saldoAwal: 0,
      saldoAkhir: 0,
      keterangan,
      sumber,
    });
  }
  await recomputeKas(ctx);
}

/** Pastikan baris gudang untuk namaBarang ada (stok boleh minus). */
export async function ensureGudangRow(ctx: MutationCtx, namaBarang: string) {
  const existing = await findOneByKey(ctx, "gudang", "namaBarang", namaBarang);
  if (!existing) {
    await ctx.db.insert("gudang", {
      id: `GDG-${Date.now().toString(36).toUpperCase()}`,
      namaBarang,
      stokAwal: 0,
      keterangan: "",
    });
  }
}

/** Tambahkan riwayat perubahan stok + pastikan baris gudang ada. */
export async function addStokHistory(
  ctx: MutationCtx,
  namaBarang: string,
  tanggal: string,
  perubahan: number,
  tipe: string,
  keterangan?: string,
) {
  await ensureGudangRow(ctx, namaBarang);
  await ctx.db.insert("stokHistory", {
    id: `STK-${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
    tanggal,
    namaBarang,
    perubahan,
    tipe,
    keterangan: keterangan ?? "",
  });
}

/**
 * Hapus seluruh jejak stok sebuah barang dari Gudang & Tetesan.
 * Dipakai ketika barang dihapus dari master data (Barang / Bahan Baku /
 * Barang Jadi) agar stok-nya otomatis hilang dari Gudang dan daftar stok
 * Tetesan (baris stok + riwayat perubahan).
 */
export async function purgeStokFor(ctx: MutationCtx, namaBarang: string) {
  const gudang = await findOneByKey(ctx, "gudang", "namaBarang", namaBarang);
  if (gudang) await ctx.db.delete(gudang._id);
  const hist = await ctx.db.query("stokHistory").filter((q) => q.eq(q.field("namaBarang"), namaBarang)).collect();
  for (const h of hist) await ctx.db.delete(h._id);
  const tStok = await findOneByKey(ctx, "tetesanStok", "namaBarang", namaBarang);
  if (tStok) await ctx.db.delete(tStok._id);
  const tHist = await ctx.db.query("tetesanStokHistory").filter((q) => q.eq(q.field("namaBarang"), namaBarang)).collect();
  for (const h of tHist) await ctx.db.delete(h._id);
}

export function parseDate(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

export function formatDateDisplay(s: string): string {
  if (!s) return "-";
  const d = parseDate(s);
  return d.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
}

export function formatRupiah(n: number): string {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n || 0);
}

export function monthOf(tanggal: string): string {
  return tanggal.slice(0, 7); // YYYY-MM
}

export const now = () => todayStr();
