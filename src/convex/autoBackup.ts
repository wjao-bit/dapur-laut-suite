/**
 * Auto Backup: Convex → Supabase
 *
 * Runs daily via cron job. Reads critical data from Convex
 * and writes to Supabase as backup.
 *
 * Tables backed up:
 * - barang (products)
 * - supplier
 * - karyawan (employees)
 * - invoice (transactions)
 * - kas (cash flow)
 */

import { action } from "./_generated/server";
import { api } from "./_generated/api";

// Supabase config from environment
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

interface SupabaseRow {
  id?: string;
  [key: string]: unknown;
}

/**
 * Insert or update rows in Supabase
 */
async function upsertToSupabase(
  table: string,
  rows: SupabaseRow[],
): Promise<{ inserted: number; errors: string[] }> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return { inserted: 0, errors: ["Supabase not configured"] };
  }

  let inserted = 0;
  const errors: string[] = [];

  for (const row of rows) {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          Prefer: "resolution=merge-duplicates",
        },
        body: JSON.stringify(row),
      });

      if (!response.ok) {
        const err = await response.text();
        errors.push(`${table}: ${err.substring(0, 100)}`);
      } else {
        inserted++;
      }
    } catch (err) {
      errors.push(`${table}: ${(err as Error).message}`);
    }
  }

  return { inserted, errors };
}

/**
 * Main backup function — called by cron daily
 */
export const runBackup = action({
  args: {},
  handler: async (ctx) => {
    const results: Record<string, { inserted: number; errors: string[] }> = {};
    const startTime = Date.now();

    // ========================================================================
    // 1. Backup Barang (Products)
    // ========================================================================
    try {
      const barang = await ctx.runQuery(api.queries.listBarang);
      if (barang?.length > 0) {
        const rows = barang.map((r: any) => ({
          id: r.kode || r._id,
          kode: r.kode,
          nama: r.nama,
          harga: r.harga,
          kategori: r.kategori || "",
          synced_at: new Date().toISOString(),
        }));
        results.barang = await upsertToSupabase("barang", rows);
      }
    } catch (err) {
      results.barang = { inserted: 0, errors: [(err as Error).message] };
    }

    // ========================================================================
    // 2. Backup Supplier
    // ========================================================================
    try {
      const suppliers = await ctx.runQuery(api.queries.listSupplier);
      if (suppliers?.length > 0) {
        const rows = suppliers.map((r: any) => ({
          id: r.id || r._id,
          nama: r.nama,
          alamat: r.alamat || "",
          kontak: r.kontak || "",
          synced_at: new Date().toISOString(),
        }));
        results.supplier = await upsertToSupabase("supplier", rows);
      }
    } catch (err) {
      results.supplier = { inserted: 0, errors: [(err as Error).message] };
    }

    // ========================================================================
    // 3. Backup Karyawan (Employees)
    // ========================================================================
    try {
      const karyawan = await ctx.runQuery(api.queries.listKaryawan);
      if (karyawan?.length > 0) {
        const rows = karyawan.map((r: any) => ({
          id: r.id || r._id,
          nama: r.nama,
          jabatan: r.jabatan || "",
          gaji_pokok: r.gajiPokok || 0,
          utang_total: r.utangTotal || 0,
          synced_at: new Date().toISOString(),
        }));
        results.karyawan = await upsertToSupabase("karyawan", rows);
      }
    } catch (err) {
      results.karyawan = { inserted: 0, errors: [(err as Error).message] };
    }

    // ========================================================================
    // 4. Backup Invoice (last 100)
    // ========================================================================
    try {
      const invoices = await ctx.runQuery(api.queries.listInvoice, {});
      if (invoices?.length > 0) {
        const rows = invoices.slice(0, 100).map((r: any) => ({
          id: r.idInvoice || r._id,
          id_invoice: r.idInvoice,
          tanggal: r.tanggal,
          tipe: r.tipe,
          nama_pihak: r.namaPihak,
          total: r.total,
          total_modal: r.totalModal,
          total_penjualan: r.totalPenjualan,
          margin: r.margin,
          status_pembayaran: r.statusPembayaran || "Pending",
          dibayar: r.dibayar || 0,
          sisa: r.sisa || 0,
          items: JSON.stringify(r.items || []),
          synced_at: new Date().toISOString(),
        }));
        results.invoice = await upsertToSupabase("invoice", rows);
      }
    } catch (err) {
      results.invoice = { inserted: 0, errors: [(err as Error).message] };
    }

    // ========================================================================
    // 5. Backup Kas (Cash Flow - last 100)
    // ========================================================================
    try {
      const kas = await ctx.runQuery(api.queries.listKas, {});
      if (kas?.length > 0) {
        const rows = kas.slice(0, 100).map((r: any) => ({
          id: r.id || r._id,
          tanggal: r.tanggal,
          kas_masuk: r.kasMasuk || 0,
          kas_keluar: r.kasKeluar || 0,
          saldo_awal: r.saldoAwal || 0,
          saldo_akhir: r.saldoAkhir || 0,
          keterangan: r.keterangan || "",
          synced_at: new Date().toISOString(),
        }));
        results.kas = await upsertToSupabase("kas", rows);
      }
    } catch (err) {
      results.kas = { inserted: 0, errors: [(err as Error).message] };
    }

    // ========================================================================
    // Summary
    // ========================================================================
    const duration = Date.now() - startTime;
    const totalInserted = Object.values(results).reduce(
      (sum, r) => sum + r.inserted,
      0,
    );
    const totalErrors = Object.values(results).reduce(
      (sum, r) => sum + r.errors.length,
      0,
    );

    console.log(
      `[Backup] Completed in ${duration}ms: ${totalInserted} rows inserted, ${totalErrors} errors`,
    );

    return {
      success: totalErrors === 0,
      duration,
      totalInserted,
      totalErrors,
      details: results,
    };
  },
});
