import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// ============================================================================
// Audit Log — Riwayat Aktivitas Pengguna
// ============================================================================

/** Tulis log aktivitas (dipanggil dari mutation lain). */
export const log = mutation({
  args: {
    aksi: v.string(),
    oleh: v.string(),
    target: v.string(),
    detail: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("auditLog", {
      aksi: args.aksi,
      oleh: args.oleh,
      target: args.target,
      detail: args.detail,
      timestamp: Date.now(),
    });
  },
});

/** Ambil 100 log terbaru. */
export const list = query({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db
      .query("auditLog")
      .withIndex("by_timestamp")
      .order("desc")
      .take(100);
    return rows;
  },
});

/** Ambil log per aksi (filter). */
export const listByAksi = query({
  args: { aksi: v.string() },
  handler: async (ctx, { aksi }) => {
    return await ctx.db
      .query("auditLog")
      .withIndex("by_aksi", (q) => q.eq("aksi", aksi))
      .order("desc")
      .take(50);
  },
});

/** Ringkasan aktivitas hari ini (untuk dashboard). */
export const todaySummary = query({
  args: {},
  handler: async (ctx) => {
    const today = new Date().toISOString().slice(0, 10);
    const startOfDay = new Date(today + "T00:00:00").getTime();
    const endOfDay = startOfDay + 86400000;

    const rows = await ctx.db
      .query("auditLog")
      .withIndex("by_timestamp", (q) =>
        q.gte("timestamp", startOfDay).lt("timestamp", endOfDay)
      )
      .collect();

    // Group by aksi
    const byAksi: Record<string, number> = {};
    for (const r of rows) {
      byAksi[r.aksi] = (byAksi[r.aksi] ?? 0) + 1;
    }

    return {
      total: rows.length,
      byAksi,
      recent: rows.slice(-10).reverse(),
    };
  },
});
