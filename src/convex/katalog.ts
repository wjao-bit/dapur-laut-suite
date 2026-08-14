import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { badRequest, findOneByKey, logRequest, logResponse } from "./lib";

// ============================================================================
// KATALOG HARGA RESELLER & SUPPLIER
//
// Satu katalog per nama pihak (tipe: Reseller | Supplier). Menyimpan daftar
// barang + harga khusus pihak tsb. Katalog dibuat OTOMATIS saat invoice
// pertama untuk pihak baru (dari createInvoice/editInvoice di business.ts),
// dan bisa dikelola manual dari menu Katalog Harga. Form invoice menarik
// harga dari katalog ini agar harga selalu konsisten.
// ============================================================================

function katalogId(tipe: string, namaPihak: string): string {
  const slug = String(namaPihak ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .slice(0, 40);
  return `KTL-${tipe.toUpperCase()}-${slug}`;
}

/** Cari katalog berdasarkan tipe + nama pihak (unik per pasangan). */
async function findKatalog(ctx: any, tipe: string, namaPihak: string) {
  const party = String(namaPihak ?? "").trim();
  if (!party) return null;
  return (ctx.db.query("katalogHarga") as any)
    .filter((q: any) => q.and(q.eq(q.field("tipe"), tipe), q.eq(q.field("namaPihak"), party)))
    .first();
}

export const listKatalog = query({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db.query("katalogHarga").collect();
    return rows.sort(
      (a, b) => a.tipe.localeCompare(b.tipe) || a.namaPihak.localeCompare(b.namaPihak),
    );
  },
});

export const getKatalog = query({
  args: {
    tipe: v.union(v.literal("Reseller"), v.literal("Supplier")),
    namaPihak: v.string(),
  },
  handler: async (ctx, { tipe, namaPihak }) => {
    const row = await findKatalog(ctx, tipe, namaPihak);
    return row ?? null;
  },
});

/** Simpan katalog utuh (ganti seluruh daftar item). Membuat katalog baru bila belum ada. */
export const upsertKatalog = mutation({
  args: {
    tipe: v.union(v.literal("Reseller"), v.literal("Supplier")),
    namaPihak: v.string(),
    items: v.array(
      v.object({
        kodeBarang: v.string(),
        namaBarang: v.string(),
        harga: v.number(),
      }),
    ),
  },
  handler: async (ctx, { tipe, namaPihak, items }) => {
    logRequest("upsertKatalog", { tipe, namaPihak, items });
    const party = String(namaPihak ?? "").trim();
    if (!party) return badRequest("Nama pihak wajib diisi");
    const clean = (items ?? []).filter((it) => String(it.namaBarang ?? "").trim());
    const existing = await findKatalog(ctx, tipe, party);
    if (existing) {
      await ctx.db.patch(existing._id, { items: clean, updatedAt: Date.now() });
    } else {
      await ctx.db.insert("katalogHarga", {
        id: katalogId(tipe, party),
        tipe,
        namaPihak: party,
        items: clean,
        updatedAt: Date.now(),
      });
    }
    logResponse("upsertKatalog", { tipe, namaPihak: party, count: clean.length });
    return { ok: true, tipe, namaPihak: party, items: clean };
  },
});

/** Tambah / perbarui satu barang di katalog pihak (bila nama sudah ada → harga diganti). */
export const addKatalogItem = mutation({
  args: {
    tipe: v.union(v.literal("Reseller"), v.literal("Supplier")),
    namaPihak: v.string(),
    kodeBarang: v.string(),
    namaBarang: v.string(),
    harga: v.number(),
  },
  handler: async (ctx, { tipe, namaPihak, kodeBarang, namaBarang, harga }) => {
    logRequest("addKatalogItem", { tipe, namaPihak, kodeBarang, namaBarang, harga });
    const party = String(namaPihak ?? "").trim();
    const name = String(namaBarang ?? "").trim();
    if (!party) return badRequest("Nama pihak wajib diisi");
    if (!name) return badRequest("Nama barang wajib diisi");
    const existing = await findKatalog(ctx, tipe, party);
    const item = { kodeBarang: kodeBarang ?? "", namaBarang: name, harga: Number(harga) || 0 };
    const items = existing ? [...((existing as any).items ?? [])] : [];
    const idx = items.findIndex(
      (it: any) =>
        String(it.namaBarang ?? "").toLowerCase() === name.toLowerCase() ||
        (kodeBarang && String(it.kodeBarang ?? "") === kodeBarang),
    );
    if (idx >= 0) items[idx] = item;
    else items.push(item);
    if (existing) {
      await ctx.db.patch(existing._id, { items, updatedAt: Date.now() });
      logResponse("addKatalogItem", { ok: true, id: existing._id });
      return { ok: true, id: existing._id };
    }
    const id = await ctx.db.insert("katalogHarga", {
      id: katalogId(tipe, party),
      tipe,
      namaPihak: party,
      items,
      updatedAt: Date.now(),
    });
    logResponse("addKatalogItem", { ok: true, id });
    return { ok: true, id };
  },
});

/** Hapus satu barang dari katalog (by kode bila ada, selain itu by nama). */
export const removeKatalogItem = mutation({
  args: { id: v.string(), kodeBarang: v.string(), namaBarang: v.string() },
  handler: async (ctx, { id, kodeBarang, namaBarang }) => {
    logRequest("removeKatalogItem", { id, kodeBarang, namaBarang });
    const row = await findOneByKey(ctx, "katalogHarga", "id", id);
    if (!row) return { ok: false };
    const items = ((row as any).items ?? []).filter((it: any) => {
      if (kodeBarang) return String(it.kodeBarang ?? "") !== kodeBarang;
      return String(it.namaBarang ?? "") !== namaBarang;
    });
    await ctx.db.patch(row._id, { items, updatedAt: Date.now() });
    logResponse("removeKatalogItem", { ok: true, id });
    return { ok: true, id };
  },
});

/** Hapus seluruh katalog sebuah pihak. */
export const deleteKatalog = mutation({
  args: { id: v.string() },
  handler: async (ctx, { id }) => {
    logRequest("deleteKatalog", { id });
    const row = await findOneByKey(ctx, "katalogHarga", "id", id);
    if (!row) return { deleted: false };
    await ctx.db.delete(row._id);
    logResponse("deleteKatalog", { deleted: true, id });
    return { deleted: true, id };
  },
});
