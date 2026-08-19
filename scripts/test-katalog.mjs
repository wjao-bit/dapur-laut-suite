// ============================================================================
// TEST KATALOG HARGA RESELLER & SUPPLIER — Dapur Laut
//
// Menjalankan handler Convex ASLI (upsertKatalog, addKatalogItem,
// removeKatalogItem, deleteKatalog, listKatalog, getKatalog) dengan database
// mock in-memory. Menguji: pembuatan katalog otomatis, update tanpa duplikat,
// variasi huruf besar/kecil nama pihak (satu katalog, tanpa error index unik),
// tambah/hapus item, hapus katalog, dan validasi payload.
//
// Cara jalan:  node scripts/test-katalog.mjs
// ============================================================================
import { writeFileSync, rmSync, existsSync } from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);

// ---------------------------------------------------------------------------
// Entry berisi database mock in-memory — mensimulasikan Convex ctx.db
// (query/filter/insert/patch/delete) cukup untuk fungsi yang diuji.
// ---------------------------------------------------------------------------
const ENTRY_SRC = `
import {
  upsertKatalog,
  addKatalogItem,
  removeKatalogItem,
  deleteKatalog,
  listKatalog,
  getKatalog,
} from "@/convex/katalog.ts";

function makeDb() {
  const tables = new Map();
  let seq = 0;
  const ensure = (name) => {
    if (!tables.has(name)) tables.set(name, new Map());
    return tables.get(name);
  };
  const chain = (items) => {
    const qApi = {
      field: (f) => ({ __f: f }),
      eq: (a, b) => ({ __eq: [a, b] }),
      and: (a, b) => ({ __and: [a, b] }),
      or: (a, b) => ({ __or: [a, b] }),
      lt: (a, b) => ({ __lt: [a, b] }),
      gt: (a, b) => ({ __gt: [a, b] }),
    };
    const evalExpr = (e, doc) => {
      if (!e) return false;
      if (e.__f) return doc[e.__f];
      if (e.__eq) return evalExpr(e.__eq[0], doc) === e.__eq[1];
      if (e.__and) return evalExpr(e.__and[0], doc) && evalExpr(e.__and[1], doc);
      if (e.__or) return evalExpr(e.__or[0], doc) || evalExpr(e.__or[1], doc);
      if (e.__lt) return evalExpr(e.__lt[0], doc) < e.__lt[1];
      if (e.__gt) return evalExpr(e.__gt[0], doc) > e.__gt[1];
      return false;
    };
    return {
      filter(pred) {
        const expr = pred(qApi);
        return chain(items.filter((d) => evalExpr(expr, d)));
      },
      collect() { return items.map((d) => ({ ...d })); },
      first() { return items.length ? { ...items[0] } : null; },
    };
  };
  return {
    query(name) { return chain([...ensure(name).values()]); },
    insert(name, doc) {
      const t = ensure(name);
      const _id = "_" + name + "_" + (++seq);
      t.set(_id, { _id, _creationTime: Date.now() + seq, ...doc });
      return _id;
    },
    patch(id, patch) {
      for (const t of tables.values()) {
        const d = t.get(id);
        if (d) { Object.assign(d, patch); return; }
      }
    },
    delete(id) { for (const t of tables.values()) t.delete(id); },
  };
}

export function makeCtx() { return { db: makeDb() }; }

async function run(fn, ctx, args) {
  try {
    // Bentuk function Convex: handler mentah ada di properti _handler.
    const handler = typeof fn === "function" ? fn._handler : fn.handler;
    const res = await handler(ctx, args);
    return { ok: true, res };
  } catch (e) {
    return { ok: false, data: (e && e.data) || {}, msg: String((e && e.message) || e) };
  }
}

export const invokeUpsert = (ctx, args) => run(upsertKatalog, ctx, args);
export const invokeAddItem = (ctx, args) => run(addKatalogItem, ctx, args);
export const invokeRemoveItem = (ctx, args) => run(removeKatalogItem, ctx, args);
export const invokeDelete = (ctx, args) => run(deleteKatalog, ctx, args);
export const queryList = async (ctx) => (await listKatalog._handler(ctx, {}));
export const queryGet = (ctx, args) => getKatalog._handler(ctx, args);
export function snapshot(ctx) {
  return { katalog: ctx.db.query("katalog").collect() };
}
`;

const entryOut = join(root, "scripts/.test-katalog-entry.tsx");
const bundleOut = join(root, "scripts/.test-katalog-bundle.cjs");

writeFileSync(entryOut, ENTRY_SRC);

const { build } = require("esbuild");
const aliasPlugin = {
  name: "alias",
  setup(b) {
    b.onResolve({ filter: /^@\// }, (args) => {
      const base = join(root, "src", args.path.slice(2));
      for (const ext of [".tsx", ".ts"]) {
        if (existsSync(base + ext)) return { path: base + ext };
      }
      return { path: base };
    });
  },
};
await build({
  entryPoints: [entryOut],
  outfile: bundleOut,
  bundle: true,
  platform: "node",
  format: "cjs",
  jsx: "automatic",
  loader: { ".tsx": "tsx", ".ts": "ts" },
  plugins: [aliasPlugin],
  packages: "external",
  logLevel: "silent",
});

const mod = require(bundleOut);

// ---------------------------------------------------------------------------
// Runner
// ---------------------------------------------------------------------------
let pass = 0;
let fail = 0;
function check(name, cond, extra = "") {
  if (cond) {
    pass++;
    console.log(`  ✅ ${name}`);
  } else {
    fail++;
    console.log(`  ❌ ${name} ${extra}`);
  }
}
function freshCtx() {
  return mod.makeCtx();
}
const ITEMS = (prices) =>
  prices.map(([kode, nama, harga]) => ({ kodeBarang: kode, namaBarang: nama, harga }));

console.log("=".repeat(70));
console.log("KATALOG HARGA — upsert / tambah / hapus item / hapus katalog");
console.log("=".repeat(70));

// --- 1. upsert membuat katalog baru + listKatalog & getKatalog ---
{
  const ctx = freshCtx();
  const items = ITEMS([["BRG001", "Kopi Bubuk", 25000], ["BRG002", "Teh Hijau", 15000]]);
  const r = await mod.invokeUpsert(ctx, { tipe: "Reseller", namaPihak: "Reseller A", items });
  check("upsert pertama sukses", r.ok === true, r.msg);
  const snap = mod.snapshot(ctx);
  check("katalog tersimpan 1 baris", snap.katalog.length === 1);
  const row = snap.katalog[0];
  check("id deterministik KTL-RESELLER-reseller-a", row.id === "KTL-RESELLER-reseller-a", row.id);
  check("items tersimpan 2 barang", row.items.length === 2 && row.items[0].harga === 25000);
  const list = await mod.queryList(ctx);
  check("listKatalog mengembalikan 1 katalog", list.length === 1 && list[0].namaPihak === "Reseller A");
  const got = await mod.queryGet(ctx, { tipe: "Reseller", namaPihak: "Reseller A" });
  check("getKatalog menemukan pihak", got !== null && got.items.length === 2);
}

// --- 2. upsert ulang pihak sama → update tanpa duplikat ---
{
  const ctx = freshCtx();
  const items1 = ITEMS([["BRG001", "Kopi", 25000]]);
  await mod.invokeUpsert(ctx, { tipe: "Reseller", namaPihak: "Reseller A", items: items1 });
  const items2 = ITEMS([["BRG001", "Kopi", 27000], ["BRG003", "Susu", 12000]]);
  const r = await mod.invokeUpsert(ctx, { tipe: "Reseller", namaPihak: "Reseller A", items: items2 });
  const snap = mod.snapshot(ctx);
  check("upsert ulang sukses", r.ok === true, r.msg);
  check("tetap 1 baris (tanpa duplikat)", snap.katalog.length === 1);
  check("items diperbarui (2 barang, harga baru 27000)", snap.katalog[0].items.length === 2 && snap.katalog[0].items.find((i) => i.namaBarang === "Kopi").harga === 27000);
}

// --- 3. Variasi huruf besar/kecil nama pihak → katalog yang sama (bug fix) ---
{
  const ctx = freshCtx();
  const items1 = ITEMS([["BRG001", "Kopi", 25000]]);
  await mod.invokeUpsert(ctx, { tipe: "Reseller", namaPihak: "Reseller A", items: items1 });
  const items2 = ITEMS([["BRG001", "Kopi", 28000], ["BRG002", "Teh", 16000]]);
  const r = await mod.invokeUpsert(ctx, { tipe: "Reseller", namaPihak: "reseller a", items: items2 });
  const snap = mod.snapshot(ctx);
  check("upsert huruf kecil sukses (tidak error index unik)", r.ok === true, r.msg);
  check("masih 1 baris katalog", snap.katalog.length === 1, `ada ${snap.katalog.length}`);
  check("items milik katalog yang sama diperbarui", snap.katalog[0].items.length === 2 && snap.katalog[0].items.find((i) => i.namaBarang === "Kopi").harga === 28000);
  check("nama pihak tetap nama asli pertama", snap.katalog[0].namaPihak === "Reseller A", snap.katalog[0].namaPihak);
  const got = await mod.queryGet(ctx, { tipe: "Reseller", namaPihak: "RESELLER A" });
  check("getKatalog case-insensitive menemukan katalog", got !== null && got.items.length === 2);
}

// --- 4. addKatalogItem: tambah barang baru & update harga barang lama ---
{
  const ctx = freshCtx();
  await mod.invokeUpsert(ctx, { tipe: "Supplier", namaPihak: "Supplier Sumber", items: ITEMS([["BRG001", "Ikan Tongkol", 30000]]) });
  const r1 = await mod.invokeAddItem(ctx, { tipe: "Supplier", namaPihak: "Supplier Sumber", kodeBarang: "BRG002", namaBarang: "Cumi", harga: 45000 });
  let snap = mod.snapshot(ctx);
  check("tambah item baru sukses", r1.ok === true, r1.msg);
  check("katalog kini 2 barang", snap.katalog[0].items.length === 2);
  const r2 = await mod.invokeAddItem(ctx, { tipe: "Supplier", namaPihak: "Supplier Sumber", kodeBarang: "BRG001", namaBarang: "Ikan Tongkol", harga: 32000 });
  snap = mod.snapshot(ctx);
  check("update harga barang lama sukses", r2.ok === true, r2.msg);
  check("tetap 2 barang (bukan duplikat)", snap.katalog[0].items.length === 2);
  check("harga Ikan Tongkol jadi 32000", snap.katalog[0].items.find((i) => i.namaBarang === "Ikan Tongkol").harga === 32000);
}

// --- 5. addKatalogItem untuk pihak baru → katalog dibuat otomatis ---
{
  const ctx = freshCtx();
  const r = await mod.invokeAddItem(ctx, { tipe: "Reseller", namaPihak: "Toko Baru", kodeBarang: "BRG009", namaBarang: "Abon", harga: 20000 });
  const snap = mod.snapshot(ctx);
  check("pihak baru: katalog dibuat otomatis", r.ok === true && snap.katalog.length === 1, r.msg);
  check("katalog baru berisi 1 barang", snap.katalog[0].items.length === 1 && snap.katalog[0].namaPihak === "Toko Baru");
}

// --- 6. removeKatalogItem by kode ---
{
  const ctx = freshCtx();
  await mod.invokeUpsert(ctx, { tipe: "Reseller", namaPihak: "Reseller B", items: ITEMS([["BRG001", "Kopi", 25000], ["BRG002", "Teh", 15000], ["BRG003", "Susu", 12000]]) });
  const row = mod.snapshot(ctx).katalog[0];
  const r = await mod.invokeRemoveItem(ctx, { id: row.id, kodeBarang: "BRG002", namaBarang: "" });
  const snap = mod.snapshot(ctx);
  check("hapus item by kode sukses", r.ok === true, r.msg);
  check("tinggal 2 barang (Teh hilang)", snap.katalog[0].items.length === 2 && !snap.katalog[0].items.some((i) => i.namaBarang === "Teh"));
}

// --- 7. deleteKatalog menghapus seluruh katalog ---
{
  const ctx = freshCtx();
  await mod.invokeUpsert(ctx, { tipe: "Reseller", namaPihak: "Reseller C", items: ITEMS([["BRG001", "Kopi", 25000]]) });
  const row = mod.snapshot(ctx).katalog[0];
  const r = await mod.invokeDelete(ctx, { id: row.id });
  const snap = mod.snapshot(ctx);
  check("hapus katalog sukses", r.ok === true && r.res.deleted === true, r.msg);
  check("katalog tidak ada lagi", snap.katalog.length === 0);
  const list = await mod.queryList(ctx);
  check("listKatalog kosong", list.length === 0);
}

// --- 8. Pihak berbeda → katalog berbeda ---
{
  const ctx = freshCtx();
  await mod.invokeUpsert(ctx, { tipe: "Reseller", namaPihak: "Reseller A", items: ITEMS([["BRG001", "Kopi", 25000]]) });
  await mod.invokeUpsert(ctx, { tipe: "Supplier", namaPihak: "Supplier Z", items: ITEMS([["BRG001", "Kopi", 20000]]) });
  await mod.invokeUpsert(ctx, { tipe: "Reseller", namaPihak: "Reseller B", items: ITEMS([["BRG002", "Teh", 15000]]) });
  const snap = mod.snapshot(ctx);
  check("3 katalog berbeda tersimpan", snap.katalog.length === 3);
  check("id katalog unik semua", new Set(snap.katalog.map((k) => k.id)).size === 3);
  const list = await mod.queryList(ctx);
  check("listKatalog: 3 baris terurut", list.length === 3);
}

// --- 9. Validasi payload ---
{
  const ctx = freshCtx();
  const r1 = await mod.invokeUpsert(ctx, { tipe: "Reseller", namaPihak: "", items: [] });
  check("upsert nama pihak kosong ditolak", r1.ok === false && /wajib diisi/.test(r1.msg), r1.msg);
  const r2 = await mod.invokeAddItem(ctx, { tipe: "Reseller", namaPihak: "Reseller A", kodeBarang: "B1", namaBarang: "", harga: 1000 });
  check("addItem nama barang kosong ditolak", r2.ok === false && /wajib diisi/.test(r2.msg), r2.msg);
  const got = await mod.queryGet(ctx, { tipe: "Reseller", namaPihak: "Tidak Ada" });
  check("getKatalog pihak tak dikenal → null", got === null);
}

// ---------------------------------------------------------------------------
console.log("\n" + "=".repeat(70));
console.log(`HASIL: ${pass} lulus, ${fail} gagal — ${fail === 0 ? "SEMUA LULUS ✅" : "ADA KEGAGALAN ❌"}`);
console.log("=".repeat(70));
try {
  rmSync(entryOut, { force: true });
  rmSync(bundleOut, { force: true });
} catch {
  /* abaikan */
}
process.exit(fail === 0 ? 0 : 1);

