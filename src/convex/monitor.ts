import { v } from "convex/values";
import { query } from "./_generated/server";
import { badRequest, logRequest, logResponse } from "./lib";
import { requireMaster } from "./admin";

// ============================================================================
// MONITORING (KHUSUS ADMIN MASTER) — pantau aplikasi dari web/HP mana pun.
//
// Semua query di file ini DIVALIDASI di backend lewat requireMaster: hanya
// Admin Master yang punya data hasilnya. User biasa yang memanggil langsung
// akan mendapat error "Hanya Admin Master yang dapat melakukan aksi ini".
//
// Isi:
//   - getRingkasan  : statistik umum (akun, sesi aktif, data master, kas).
//   - listAktivitas : log aktivitas (login/logout/pengelolaan akun/ganti pw).
//   - listSesiAktif : siapa yang sedang login saat ini.
// ============================================================================

/** Hitung jumlah baris (fallback ke collect bila .count() tidak tersedia). */
async function countRows(ctx: any, table: string, filter?: (q: any) => any): Promise<number> {
  let q = ctx.db.query(table);
  if (filter) q = q.filter(filter);
  try {
    return await q.count();
  } catch {
    const rows = await q.collect();
    return rows.length;
  }
}

export const getRingkasan = query({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    logRequest("monitor.getRingkasan", {});
    await requireMaster(ctx, token);

    const [akunTotal, akunPending, akunApproved, akunRejected, akunMaster, sesiAktif] =
      await Promise.all([
        countRows(ctx, "akun"),
        countRows(ctx, "akun", (q) => q.eq(q.field("status"), "pending")),
        countRows(ctx, "akun", (q) => q.eq(q.field("status"), "approved")),
        countRows(ctx, "akun", (q) => q.eq(q.field("status"), "rejected")),
        countRows(ctx, "akun", (q) => q.eq(q.field("role"), "Admin Master")),
        countRows(ctx, "sessions"),
      ]);

    const [barang, supplier, reseller, dpl, pasar, karyawan, gudang] = await Promise.all([
      countRows(ctx, "barang"),
      countRows(ctx, "supplier"),
      countRows(ctx, "reseller"),
      countRows(ctx, "dpl"),
      countRows(ctx, "pasar"),
      countRows(ctx, "karyawan"),
      countRows(ctx, "gudang"),
    ]);

    const [invoice, invoiceTetesan, pengeluaran, absensi, katalog] = await Promise.all([
      countRows(ctx, "invoice"),
      countRows(ctx, "invoiceTetesan"),
      countRows(ctx, "pengeluaran"),
      countRows(ctx, "absensi"),
      countRows(ctx, "katalogHarga"),
    ]);

    // Saldo kas terakhir (entri terbaru berdasarkan waktu dibuat)
    let kasTerakhir: number | null = null;
    try {
      const lastKas = await ctx.db.query("kas").order("desc").take(1);
      if (lastKas.length > 0) kasTerakhir = lastKas[0].saldoAkhir;
    } catch {
      kasTerakhir = null;
    }

    const out = {
      akun: { total: akunTotal, pending: akunPending, approved: akunApproved, rejected: akunRejected, master: akunMaster },
      sesiAktif,
      dataMaster: { barang, supplier, reseller, dpl, pasar, karyawan, gudang },
      transaksi: { invoice, invoiceTetesan, pengeluaran, absensi, katalog },
      kasTerakhir,
    };
    logResponse("monitor.getRingkasan", { akun: out.akun, sesiAktif: out.sesiAktif });
    return out;
  },
});

export const listAktivitas = query({
  args: { token: v.string(), limit: v.optional(v.number()) },
  handler: async (ctx, { token, limit }) => {
    logRequest("monitor.listAktivitas", { limit });
    await requireMaster(ctx, token);
    const n = Math.min(Math.max(limit ?? 50, 1), 200);
    const rows = await ctx.db.query("aktivitas").withIndex("by_createdAt").order("desc").take(n);
    const out = rows.map((r) => ({
      id: r.id,
      phone: r.phone,
      nama: r.nama,
      aksi: r.aksi,
      detail: r.detail ?? "",
      createdAt: r.createdAt,
    }));
    logResponse("monitor.listAktivitas", { count: out.length });
    return out;
  },
});

export const listSesiAktif = query({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    logRequest("monitor.listSesiAktif", {});
    await requireMaster(ctx, token);
    const sesi = await ctx.db.query("sessions").order("desc").take(200);
    const out: { phone: string; nama: string; role: string; status: string; createdAt: number }[] = [];
    for (const s of sesi) {
      const akun = await (ctx.db.query("akun") as any)
        .filter((q: any) => q.eq(q.field("id"), s.phone))
        .first();
      out.push({
        phone: s.phone,
        nama: akun?.nama ?? "-",
        role: akun?.role ?? "Admin",
        status: akun?.status ?? "-",
        createdAt: s.createdAt,
      });
    }
    logResponse("monitor.listSesiAktif", { count: out.length });
    return out;
  },
});
