import { mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Simpan / ubah catatan (notes) pada sebuah invoice.
 *
 * Catatan disimpan sebagai field tambahan `catatan` pada dokumen invoice.
 * Schema memakai `schemaValidation: false`, jadi field tambahan ini aman
 * ditambahkan tanpa mengubah definisi tabel — dan otomatis ikut terkirim ke
 * frontend karena `queries.listInvoice` mengembalikan dokumen apa adanya.
 */
export const setCatatanInvoice = mutation({
  args: { idInvoice: v.string(), catatan: v.string() },
  handler: async (ctx, { idInvoice, catatan }) => {
    const row = await ctx.db
      .query("invoice")
      .withIndex("by_idInvoice", (q) => q.eq("idInvoice", idInvoice))
      .first();
    if (!row) return { ok: false, idInvoice, catatan: "" };
    const bersih = catatan.trim();
    await ctx.db.patch(row._id, { catatan: bersih } as any);
    return { ok: true, idInvoice, catatan: bersih };
  },
});
