// ============================================================================
// TEST PEMBUATAN INVOICE — Dapur Laut
//
// Menjalankan handler Convex ASLI (createInvoice & createInvoiceTetesan)
// dengan database mock in-memory, untuk invoice berisi 1 s.d. 30 barang,
// di semua tipe: Supplier / Reseller / DPL / Pasar / Modal / Penjualan.
//
// Cara jalan:  node scripts/test-invoice.mjs
// ============================================================================
import { readFileSync, writeFileSync, existsSync, rmSync } from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);

// ---------------------------------------------------------------------------
// Entry berisi database mock in-memory — mensimulasikan Convex ctx.db
// (query/filter/insert/patch/delete) cukup untuk semua fungsi yang diuji
// (filter yang dipakai hanya q.eq sederhana).
// ---------------------------------------------------------------------------
const ENTRY_SRC = `
import { createInvoice, createInvoiceTetesan } from "@/convex/business.ts";
import { validate, invoiceSchema, invoiceTetesanSchema } from "@/lib/schemas.ts";
import { computeInvoiceTotals, computeTetesanTotals } from "@/lib/business.ts";

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
    // Bentuk mutation convex: fungsi dengan properti _handler (handler mentah).
    const handler = typeof fn === "function" ? fn._handler : fn.handler;
    const res = await handler(ctx, args);
    return { ok: true, res };
  } catch (e) {
    return { ok: false, data: (e && e.data) || {}, msg: String((e && e.message) || e) };
  }
}

export const invokeCreateInvoice = (ctx, doc) => run(createInvoice, ctx, { doc });
export const invokeCreateTetesan = (ctx, doc) => run(createInvoiceTetesan, ctx, { doc });
export const schemaInvoice = (doc) => validate(invoiceSchema, doc);
export const schemaTetesan = (doc) => validate(invoiceTetesanSchema, doc);
export const totalsInvoice = (tipe, items) => computeInvoiceTotals(tipe, items);
export const totalsTetesan = (tipe, items) => computeTetesanTotals(tipe, items);
export function snapshot(ctx) {
  return {
    invoice: ctx.db.query("invoice").collect(),
    invoiceTetesan: ctx.db.query("invoiceTetesan").collect(),
    kas: ctx.db.query("kas").collect(),
    stokHistory: ctx.db.query("stokHistory").collect(),
    tetesanHistory: ctx.db.query("tetesanStokHistory").collect(),
  };
}
`;

const entryOut = join(root, "scripts/.test-invoice-entry.tsx");
const bundleOut = join(root, "scripts/.test-invoice-bundle.cjs");

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

const TIPES = ["Supplier", "Reseller", "DPL", "Pasar"];
const SIZES = [1, 2, 5, 10, 30];
const N = (i) => 2 + (i % 4); // qty per item

function makeItems(tipe, n) {
  return Array.from({ length: n }, (_, i) => {
    const base = {
      kodeBarang: `BRG${String(i + 1).padStart(3, "0")}`,
      namaBarang: `Barang ${i + 1}`,
      hargaModal: 10000 + i * 500,
      qty: N(i),
    };
    if (tipe === "Pasar") {
      base.stokAwal = 10 + i;
      base.stokAkhir = 4 + i;
      base.qty = base.stokAwal;
    }
    if (tipe !== "Supplier") base.hargaJual = 15000 + i * 500;
    base.subtotal = 0; // dihitung ulang backend
    return base;
  });
}

console.log("=".repeat(70));
console.log("BAGIAN 1 — Validasi schema & total (1–30 barang, semua tipe)");
console.log("=".repeat(70));

for (const tipe of TIPES) {
  for (const n of SIZES) {
    const items = makeItems(tipe, n);
    const doc = { idInvoice: `INV-T-${n}`, tanggal: "2026-08-06", tipe, namaPihak: "Pihak Test", tenggat: "", mataUang: "Rp", items };
    const v = mod.schemaInvoice(doc);
    check(`[${tipe}] ${n} barang valid`, v.success === true && v.data.items.length === n, JSON.stringify(v.errors));
    if (v.success) {
      const t = mod.totalsInvoice(tipe, v.data.items);
      const sum = v.data.items.reduce((s, it) => {
        const terjual = tipe === "Pasar" ? (it.stokAwal ?? 0) - (it.stokAkhir ?? 0) : it.qty;
        return s + (tipe === "Supplier" ? it.hargaModal : it.hargaJual) * terjual;
      }, 0);
      const total = tipe === "Supplier" ? t.totalModal : t.totalPenjualan;
      check(`[${tipe}] ${n} barang total cocok (${total} = ${sum})`, total === sum);
    }
  }
}

console.log("\n  — Regresi bug tenggat (invoice tanpa tanggal jatuh tempo harus bisa disimpan) —");
for (const tipe of TIPES) {
  const doc = { idInvoice: "INV-NO-DUE", tanggal: "2026-08-06", tipe, namaPihak: "Tanpa Tenggat", tenggat: "", mataUang: "Rp", items: makeItems(tipe, 1) };
  const v = mod.schemaInvoice(doc);
  check(`[${tipe}] tenggat kosong diterima`, v.success === true, JSON.stringify(v.errors));
}
{
  const doc = { idInvoice: "INV-BAD", tanggal: "2026-08-06", tipe: "Reseller", namaPihak: "X", tenggat: "salah", mataUang: "Rp", items: makeItems("Reseller", 1) };
  check("tenggat tidak valid ditolak", mod.schemaInvoice(doc).success === false);
}
{
  const doc = { idInvoice: "INV-EMPTY", tanggal: "2026-08-06", tipe: "Reseller", namaPihak: "X", tenggat: "", mataUang: "Rp", items: [] };
  check("invoice tanpa barang ditolak", mod.schemaInvoice(doc).success === false);
}
{
  const items = makeItems("Reseller", 1);
  items[0].qty = 0;
  const doc = { idInvoice: "INV-Q0", tanggal: "2026-08-06", tipe: "Reseller", namaPihak: "X", tenggat: "", mataUang: "Rp", items };
  check("qty 0 ditolak", mod.schemaInvoice(doc).success === false);
}
{
  const items = makeItems("Pasar", 1);
  items[0].stokAkhir = items[0].stokAwal + 5;
  const doc = { idInvoice: "INV-PASAR", tanggal: "2026-08-06", tipe: "Pasar", namaPihak: "X", tenggat: "", mataUang: "Rp", items };
  check("Pasar stok akhir > stok awal ditolak", mod.schemaInvoice(doc).success === false);
}

console.log("\n" + "=".repeat(70));
console.log("BAGIAN 2 — Handler ASLI createInvoice (1–30 barang, semua tipe)");
console.log("=".repeat(70));

for (const tipe of TIPES) {
  for (const n of SIZES) {
    const ctx = freshCtx();
    const items = makeItems(tipe, n);
    const doc = { idInvoice: `INV${n}${tipe.slice(0, 1)}`, tanggal: "2026-08-06", tipe, namaPihak: "PT Mitra " + n, tenggat: "", mataUang: tipe === "Supplier" ? "$" : "Rp", items };
    const r = await mod.invokeCreateInvoice(ctx, doc);
    check(`[${tipe}] ${n} barang tersimpan`, r.ok === true, r.msg);
    if (!r.ok) continue;
    const snap = mod.snapshot(ctx);
    const inv = snap.invoice.find((x) => x.idInvoice === doc.idInvoice);
    check(`[${tipe}] ${n} barang: invoice tersimpan di DB`, !!inv && inv.items.length === n);
    const t = mod.totalsInvoice(tipe, items);
    const kas = snap.kas.find((k) => k.id === `INV-${doc.idInvoice}`);
    if (tipe === "Supplier") {
      check(`[${tipe}] ${n} barang: kas keluar = total modal`, !!kas && kas.kasKeluar === t.total && kas.kasMasuk === 0);
      const masuk = snap.stokHistory.filter((h) => (h.keterangan ?? "").includes(doc.idInvoice) && h.perubahan > 0);
      check(`[${tipe}] ${n} barang: ${n} riwayat stok masuk`, masuk.length === n);
    } else if (tipe === "Reseller" || tipe === "DPL") {
      check(`[${tipe}] ${n} barang: kas masuk = total penjualan`, !!kas && kas.kasMasuk === t.totalPenjualan && kas.kasKeluar === 0);
      const keluar = snap.stokHistory.filter((h) => (h.keterangan ?? "").includes(doc.idInvoice) && h.perubahan < 0);
      check(`[${tipe}] ${n} barang: ${n} riwayat stok keluar`, keluar.length === n);
    } else {
      check(`[${tipe}] ${n} barang: kas masuk = total penjualan`, !!kas && kas.kasMasuk === t.totalPenjualan && kas.kasKeluar === 0);
      const kirim = snap.stokHistory.filter((h) => (h.keterangan ?? "").includes("Kirim stok awal"));
      const kembali = snap.stokHistory.filter((h) => (h.keterangan ?? "").includes("Stok akhir kembali"));
      check(`[${tipe}] ${n} barang: ${n} kirim + ${n} kembali`, kirim.length === n && kembali.length === n);
    }
  }
}

console.log("\n  — Urutan idInvoice INV001..INV030 (unik, 1 barang per invoice) —");
{
  const ctx = freshCtx();
  let allOk = true;
  for (let i = 1; i <= 30; i++) {
    const items = makeItems("Reseller", 1);
    const doc = { idInvoice: `INV${String(i).padStart(3, "0")}`, tanggal: "2026-08-06", tipe: "Reseller", namaPihak: "Reseller " + i, tenggat: "", mataUang: "Rp", items };
    const r = await mod.invokeCreateInvoice(ctx, doc);
    if (!r.ok) { allOk = false; check(`INV${String(i).padStart(3, "0")} tersimpan`, false, r.msg); break; }
  }
  const snap = mod.snapshot(ctx);
  check("30 invoice INV001..INV030 semua tersimpan", allOk && snap.invoice.length === 30);
  check("30 entri kas unik", snap.kas.length === 30 && new Set(snap.kas.map((k) => k.id)).size === 30);
}

console.log("\n  — Update invoice dengan idInvoice sama (upsert ON CONFLICT) —");
{
  const ctx = freshCtx();
  const doc = { idInvoice: "INV-UPD", tanggal: "2026-08-06", tipe: "Reseller", namaPihak: "A", tenggat: "", mataUang: "Rp", items: makeItems("Reseller", 2) };
  const r1 = await mod.invokeCreateInvoice(ctx, doc);
  const doc2 = { idInvoice: "INV-UPD", tanggal: "2026-08-07", tipe: "Reseller", namaPihak: "B", tenggat: "", mataUang: "Rp", items: makeItems("Reseller", 5) };
  const r2 = await mod.invokeCreateInvoice(ctx, doc2);
  const snap = mod.snapshot(ctx);
  const inv = snap.invoice.find((x) => x.idInvoice === "INV-UPD");
  check("simpan ulang idInvoice sama tidak error", r1.ok === true && r2.ok === true, r2.msg);
  check("data invoice diperbarui (5 barang, pihak B)", !!inv && inv.items.length === 5 && inv.namaPihak === "B");
  check("tidak ada invoice duplikat", snap.invoice.filter((x) => x.idInvoice === "INV-UPD").length === 1);
}

console.log("\n" + "=".repeat(70));
console.log("BAGIAN 3 — Handler ASLI createInvoiceTetesan (Modal & Penjualan, 1–30)");
console.log("=".repeat(70));

for (const tipe of ["Modal", "Penjualan"]) {
  for (const n of SIZES) {
    const ctx = freshCtx();
    const items = Array.from({ length: n }, (_, i) => ({
      kodeBarang: `TET${String(i + 1).padStart(3, "0")}`,
      namaBarang: `Produk ${i + 1}`,
      harga: tipe === "Modal" ? 5000 + i * 250 : 8000 + i * 250,
      qty: 1 + (i % 3),
      subtotal: 0,
    }));
    const doc = { idInvoice: `TET${n}${tipe === "Modal" ? "M" : "P"}`, tanggal: "2026-08-06", tipe, namaPihak: "Toko " + n, mataUang: "Rp", items };
    const r = await mod.invokeCreateTetesan(ctx, doc);
    check(`[Tetesan ${tipe}] ${n} barang tersimpan`, r.ok === true, r.msg);
    if (!r.ok) continue;
    const snap = mod.snapshot(ctx);
    const inv = snap.invoiceTetesan.find((x) => x.idInvoice === doc.idInvoice);
    check(`[Tetesan ${tipe}] ${n} barang: tersimpan di DB`, !!inv && inv.items.length === n);
    const t = mod.totalsTetesan(tipe, items);
    const kas = snap.kas.find((k) => k.id === `KAS-TET-${doc.idInvoice}`);
    if (tipe === "Modal") {
      check(`[Tetesan Modal] ${n} barang: kas keluar = total`, !!kas && kas.kasKeluar === t.total && kas.kasMasuk === 0);
      const baku = snap.tetesanHistory.filter((h) => (h.keterangan ?? "").includes(doc.idInvoice) && h.perubahan > 0);
      const gudang = snap.stokHistory.filter((h) => (h.keterangan ?? "").includes(doc.idInvoice) && h.perubahan < 0);
      check(`[Tetesan Modal] ${n} barang: stok baku + & gudang −`, baku.length === n && gudang.length === n);
    } else {
      check(`[Tetesan Penjualan] ${n} barang: kas masuk = total`, !!kas && kas.kasMasuk === t.total && kas.kasKeluar === 0);
      const jadi = snap.tetesanHistory.filter((h) => (h.keterangan ?? "").includes(doc.idInvoice) && h.perubahan < 0);
      check(`[Tetesan Penjualan] ${n} barang: stok jadi −`, jadi.length === n);
    }
  }
}

console.log("\n  — Regresi: Penjualan Tetesan dengan STOK 0 harus tetap bisa disimpan —");
{
  const ctx = freshCtx(); // DB kosong → stok jadi = 0
  const items = [{ kodeBarang: "TET001", namaBarang: "Produk Tanpa Stok", harga: 10000, qty: 5, subtotal: 0 }];
  const doc = { idInvoice: "TET-NOSTOK", tanggal: "2026-08-06", tipe: "Penjualan", namaPihak: "Toko Baru", mataUang: "Rp", items };
  const r = await mod.invokeCreateTetesan(ctx, doc);
  check("Invoice Penjualan dengan stok 0 TERSIMPAN (stok minus)", r.ok === true, r.msg);
  const snap = mod.snapshot(ctx);
  check("riwayat stok jadi tercatat −5", snap.tetesanHistory.some((h) => h.perubahan === -5));
}

{
  const v = mod.schemaTetesan({ idInvoice: "TET-EMPTY", tanggal: "2026-08-06", tipe: "Modal", namaPihak: "X", mataUang: "Rp", items: [] });
  check("invoice tetesan tanpa barang ditolak", v.success === false);
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
