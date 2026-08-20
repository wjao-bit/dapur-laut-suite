import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { badRequest, findOneByKey, logRequest, logResponse } from "./lib";

function katalogId(tipe: string, namaPihak: string): string {
  const slug = String(namaPihak ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .slice(0, 40);
  return `KTL-${tipe.toUpperCase()}-${slug}`;
}

async function findKatalog(ctx: any, tipe: string, namaPihak: string) {
  const party = String(namaPihak ?? "").trim();
  if (!party) return null;
  const byId = await findOneByKey(ctx, "katalog" as any, "id", katalogId(tipe, party));
  if (byId) return byId;
  return (ctx.db.query("katalog") as any)
    .filter((q: any) => q.and(q.eq(q.field("tipe"), tipe), q.eq(q.field("namaPihak"), party)))
    .first();
}

export const listKatalog = query({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db.query("katalog" as any).collect();
    return rows.sort(
      (a: any, b: any) => (a.tipe ?? "").localeCompare(b.tipe ?? "") || (a.namaPihak ?? "").localeCompare(b.namaPihak ?? ""),
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
      await (ctx.db as any).insert("katalog", {
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

export const addKatalogItem = mutation({
  args: {
    tipe: v.union(v.literal("Reseller"), v.literal("Supplier")),
    namaPihak: v.string(),
    item: v.object({
      kodeBarang: v.string(),
      namaBarang: v.string(),
      harga: v.number(),
    }),
  },
  handler: async (ctx, { tipe, namaPihak, item }) => {
    const { kodeBarang, namaBarang, harga } = item;
    logRequest("addKatalogItem", { tipe, namaPihak, kodeBarang, namaBarang, harga });
    const party = String(namaPihak ?? "").trim();
    const name = String(namaBarang ?? "").trim();
    if (!party) return badRequest("Nama pihak wajib diisi");
    if (!name) return badRequest("Nama barang wajib diisi");
    const existing = await findKatalog(ctx, tipe, party);
    const cleanItem = { kodeBarang: kodeBarang ?? "", namaBarang: name, harga: Number(harga) || 0 };
    const items = existing ? [...((existing as any).items ?? [])] : [];
    const idx = items.findIndex(
      (it: any) =>
        String(it.namaBarang ?? "").toLowerCase() === name.toLowerCase() ||
        (kodeBarang && String(it.kodeBarang ?? "") === kodeBarang),
    );
    if (idx >= 0) items[idx] = cleanItem;
    else items.push(cleanItem);
    if (existing) {
      await ctx.db.patch(existing._id, { items, updatedAt: Date.now() });
      logResponse("addKatalogItem", { ok: true, id: existing._id });
      return { ok: true, id: existing._id };
    }
    const id = await (ctx.db as any).insert("katalog", {
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

export const removeKatalogItem = mutation({
  args: {
    tipe: v.union(v.literal("Reseller"), v.literal("Supplier")),
    namaPihak: v.string(),
    kodeBarang: v.string(),
  },
  handler: async (ctx, { tipe, namaPihak, kodeBarang }) => {
    logRequest("removeKatalogItem", { tipe, namaPihak, kodeBarang });
    const party = String(namaPihak ?? "").trim();
    const row = await findKatalog(ctx, tipe, party);
    if (!row) return { ok: false };
    const items = ((row as any).items ?? []).filter((it: any) => String(it.kodeBarang ?? "") !== kodeBarang);
    await ctx.db.patch(row._id, { items, updatedAt: Date.now() });
    logResponse("removeKatalogItem", { ok: true, tipe, namaPihak: party });
    return { ok: true };
  },
});

export const deleteKatalog = mutation({
  args: {
    tipe: v.union(v.literal("Reseller"), v.literal("Supplier")),
    namaPihak: v.string(),
  },
  handler: async (ctx, { tipe, namaPihak }) => {
    const party = String(namaPihak ?? "").trim();
    logRequest("deleteKatalog", { tipe, namaPihak: party });
    const row = await findKatalog(ctx, tipe, party);
    if (!row) return { deleted: false };
    await ctx.db.delete(row._id);
    logResponse("deleteKatalog", { deleted: true, tipe, namaPihak: party });
    return { deleted: true };
  },
});
