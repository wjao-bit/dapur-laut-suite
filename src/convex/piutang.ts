import { v } from "convex/values";
import { query } from "./_generated/server";
import { daysUntil, todayStr } from "\./_business";

// ============================================================================
// PIUTANG — tagihan penjualan yang belum lunas
//
// Piutang = invoice penjualan (Reseller / DPL / Pasar) dengan sisa tagihan
// > 0. Supplier adalah pembelian (bukan piutang), jadi tidak dihitung.
// Baris yang dikembalikan adalah dokumen invoice lengkap (siap dicetak /
// dibayar) + field bantu: total, dibayar, sisa, daysLeft.
// ============================================================================

export const listPiutang = query({
  args: { tipe: v.optional(v.string()) },
  handler: async (ctx, { tipe }) => {
    const rows = await ctx.db.query("invoice").collect();
    const today = todayStr();
    return rows
      .filter(
        (r: any) =>
          !r.deletedAt &&
          r.tipe !== "Supplier" &&
          (!tipe || r.tipe === tipe),
      )
      .map((r: any) => {
        const total = r.totalPenjualan || r.total || 0;
        const dibayar =
          (r.statusPembayaran ?? "Pending") === "Lunas" ? total : (r.dibayar ?? 0);
        const sisa = Math.max(0, total - dibayar);
        return {
          ...r,
          total,
          dibayar,
          sisa,
          daysLeft: r.tenggat ? daysUntil(r.tenggat, today) : Number.NaN,
        };
      })
      .filter((r) => r.sisa > 0)
      .sort((a: any, b: any) => {
        const da = Number.isNaN(a.daysLeft) ? 999999 : a.daysLeft;
        const db = Number.isNaN(b.daysLeft) ? 999999 : b.daysLeft;
        // Paling mendesak (lewat tempo / terdekat) di atas
        return da - db || b.tanggal.localeCompare(a.tanggal);
      });
  },
});


