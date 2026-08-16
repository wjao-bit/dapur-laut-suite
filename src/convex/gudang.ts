import { v } from "convex/values";
import { internalQuery, mutation } from "./_generated/server";
import { badRequest, findOneByKey, logRequest, logResponse } from "./lib";
import { computeGudangRows } from "../lib/business";

// ============================================================================
// GUDANG — peringatan stok menipis
//
// setStokMin : set batas stok minimum per barang (untuk peringatan "Stok
//              Menipis" di halaman Gudang & notifikasi push). Barang yang
//              belum punya batas memakai default 5 unit.
//
// internalListGudangForNotif : data stok saat ini + batas minimum, dipakai
//              aksi notif.checkStokMenipisAndNotify (cron 6 jam) untuk
//              mengirim push "stok menipis". HANYA bisa dipanggil dari action.
// ============================================================================

/** Set batas stok minimum per barang. */
export const setStokMin = mutation({
  args: { namaBarang: v.string(), stokMin: v.number() },
  handler: async (ctx, { namaBarang, stokMin }) => {
    logRequest("setStokMin", { namaBarang, stokMin });
    if (!(stokMin >= 0)) return badRequest("Batas stok minimum harus ≥ 0", { stokMin });
    const g = await findOneByKey(ctx, "gudang", "namaBarang", namaBarang);
    if (!g) return badRequest("Barang tidak ada di gudang", { namaBarang });
    await ctx.db.patch(g._id, { stokMin });
    logResponse("setStokMin", { namaBarang, stokMin });
    return { namaBarang, stokMin };
  },
});

/** Data gudang (stok akhir + batas minimum) untuk aksi notifikasi — INTERNAL. */
export const internalListGudangForNotif = internalQuery({
  args: {},
  handler: async (ctx) => {
    const base = await ctx.db.query("gudang").collect();
    const history = await ctx.db.query("stokHistory").collect();
    const rows = computeGudangRows(
      base.map((b) => ({
        id: b.id,
        namaBarang: b.namaBarang,
        stokAwal: b.stokAwal,
        keterangan: b.keterangan ?? "",
      })),
      history.map((h) => ({ namaBarang: h.namaBarang, perubahan: h.perubahan })),
    );
    const minMap = new Map<string, number>(
      base.map((b) => [b.namaBarang, (b as any).stokMin ?? 5]),
    );
    return rows.map((r) => ({
      namaBarang: r.namaBarang,
      stokAkhir: r.stokAkhir,
      stokMin: minMap.get(r.namaBarang) ?? 5,
    }));
  },
});
