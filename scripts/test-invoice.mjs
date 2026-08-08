// ============================================================================
// TEST PEMBUATAN INVOICE & PEMBAYARAN — Dapur Laut
//
// Menjalankan handler Convex ASLI (createInvoice, createInvoiceTetesan,
// bayarInvoice, bayarInvoiceTetesan, editInvoice, editInvoiceTetesan) dengan
// database mock in-memory, untuk invoice berisi 1 s.d. 30 barang, di semua
// tipe: Supplier / Reseller / DPL / Pasar / Modal / Penjualan. Plus regresi:
// input desimal (0,7), parseNum, aksi pembayaran (bayar → sisa berkurang →
// Lunas, riwayat tercatat), EDIT invoice (stok & kas lama dibatalkan lalu
// diterapkan ulang; pembayaran tercatat dipertahankan), dan Pasar MINUS
// (stok akhir > stok awal → Terjual & total negatif, tetap bisa disimpan).
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
import { createInvoice, createInvoiceTetesan, editInvoice, editInvoiceTetesan } from "@/convex/business.ts";
import { bayarInvoice, bayarInvoiceTetesan } from "@/convex/payment.ts";
import { validate, invoiceSchema, invoiceTetesanSchema } from "@/lib/schemas.ts";
import { computeInvoiceTotals, computeTetesanTotals, computeInvoicePayment } from "@/lib/business.ts";
import { parseNum } from "@/lib/format.ts";

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
export const invokeEditInvoice = (ctx, doc) => run(editInvoice, ctx, { doc });
export const invokeEditTetesan = (ctx, doc) => run(editInvoiceTetesan, ctx, { doc });
export const invokeBayarInvoice = (ctx, args) => run(bayarInvoice, ctx, args);
export const invokeBayarTetesan = (ctx, args) => run(bayarInvoiceTetesan, ctx, args);
export const schemaInvoice = (doc) => validate(invoiceSchema, doc);
export const schemaTetesan = (doc) => validate(invoiceTetesanSchema, doc);
export const totalsInvoice = (tipe, items) => computeInvoiceTotals(tipe, items);
export const totalsTetesan = (tipe, items) => computeTetesanTotals(tipe, items);
export const parseNumFn = parseNum;
export const paymentFn = computeInvoicePayment;
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
  // Pasar: stok akhir BOLEH > stok awal — Terjual jadi MINUS (barang pulang
  // lebih banyak dari yang dikirim). Schema harus menerima & total jadi negatif.
  const v = mod.schemaInvoice(doc);
  check("Pasar stok akhir > stok awal DITERIMA (terjual minus)", v.success === true, JSON.stringify(v.errors));
  if (v.success) {
    const t = mod.totalsInvoice("Pasar", v.data.items);
    check("Pasar minus: total penjualan negatif", t.totalPenjualan < 0, JSON.stringify(t));
  }
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
    // Status pembayaran awal: Pending, dibayar 0, sisa = tagihan, riwayat kosong
    const tagihan = tipe === "Supplier" ? inv.total : inv.totalPenjualan;
    check(`[${tipe}] ${n} barang: field pembayaran diinisialisasi`, inv.dibayar === 0 && Math.abs(inv.sisa - tagihan) < 1e-9 && Array.isArray(inv.riwayatBayar) && inv.riwayatBayar.length === 0 && inv.statusPembayaran === "Pending");
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

console.log("\n  — Pasar MINUS: stok akhir > stok awal (barang pulang lebih banyak) —");
{
  const ctx = freshCtx();
  const items = [
    { kodeBarang: "BRG901", namaBarang: "Ikan Kembung", hargaModal: 10000, hargaJual: 15000, stokAwal: 5, stokAkhir: 8, qty: 5, subtotal: -45000 },
    { kodeBarang: "BRG902", namaBarang: "Cumi", hargaModal: 20000, hargaJual: 30000, stokAwal: 3, stokAkhir: 3, qty: 3, subtotal: 0 },
  ];
  const doc = { idInvoice: "INV-PASAR-MINUS", tanggal: "2026-08-06", tipe: "Pasar", namaPihak: "Victoria", tenggat: "", mataUang: "Rp", items };
  const r = await mod.invokeCreateInvoice(ctx, doc);
  check("Pasar minus: invoice tersimpan (terjual -3 + 0)", r.ok === true, r.msg);
  if (r.ok) {
    const snap = mod.snapshot(ctx);
    const inv = snap.invoice.find((x) => x.idInvoice === "INV-PASAR-MINUS");
    const kas = snap.kas.find((k) => k.id === "INV-INV-PASAR-MINUS");
    check("Pasar minus: totalPenjualan -45.000, totalModal -30.000, margin -15.000", !!inv && inv.totalPenjualan === -45000 && inv.totalModal === -30000 && inv.margin === -15000, JSON.stringify(inv));
    check("Pasar minus: kas masuk -45.000", !!kas && kas.kasMasuk === -45000 && kas.kasKeluar === 0, JSON.stringify(kas));
    const kirim = snap.stokHistory.filter((h) => (h.keterangan ?? "").includes("Kirim stok awal"));
    const kembali = snap.stokHistory.filter((h) => (h.keterangan ?? "").includes("Stok akhir kembali"));
    check("Pasar minus: riwayat kirim -5/-3 & kembali +8/+3", kirim.length === 2 && kirim.some((h) => h.perubahan === -5) && kirim.some((h) => h.perubahan === -3) && kembali.length === 2 && kembali.some((h) => h.perubahan === 8) && kembali.some((h) => h.perubahan === 3), JSON.stringify({ kirim, kembali }));
  }
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
    check(`[Tetesan ${tipe}] ${n} barang: field pembayaran diinisialisasi`, inv.dibayar === 0 && Math.abs(inv.sisa - inv.total) < 1e-9 && Array.isArray(inv.riwayatBayar) && inv.riwayatBayar.length === 0 && inv.statusPembayaran === "Pending");
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

console.log("\n" + "=".repeat(70));
console.log("BAGIAN 4 — Regresi input DESIMAL (0,7) — parseNum & semua tipe invoice");
console.log("=".repeat(70));

// --- parseNum: format Indonesia tidak boleh jadi NaN ---
{
  const p = mod.parseNumFn;
  const cases = [
    ["0,7", 0.7],
    ["0.7", 0.7],
    ["1.500", 1500],
    ["1.500,75", 1500.75],
    ["Rp 25.000", 25000],
    ["", 0],
    ["abc", 0],
    ["-3", -3],
  ];
  for (const [input, expect] of cases) {
    const got = p(input);
    check(`parseNum("${input}") = ${expect}`, Math.abs(got - expect) < 1e-9, `got ${got}`);
  }
}

// --- Invoice schema menerima qty desimal 0,7 (Reseller/DPL) & stok pasar 1 → 0,3 ---
{
  const items = makeItems("Reseller", 1);
  items[0].qty = 0.7;
  items[0].hargaJual = 15000;
  const doc = { idInvoice: "INV-DEC-R", tanggal: "2026-08-06", tipe: "Reseller", namaPihak: "Pihak Desimal", tenggat: "", mataUang: "Rp", items };
  const v = mod.schemaInvoice(doc);
  check("Reseller qty 0,7 diterima schema", v.success === true, JSON.stringify(v.errors));
  if (v.success) {
    const t = mod.totalsInvoice("Reseller", v.data.items);
    check("Reseller 0,7 × 15000 = 10500", Math.abs(t.totalPenjualan - 10500) < 1e-9, `got ${t.totalPenjualan}`);
  }
}
{
  const items = [
    { kodeBarang: "BRG001", namaBarang: "Ikan Asin", hargaModal: 10000, qty: 1, hargaJual: 15000, stokAwal: 1, stokAkhir: 0.3, subtotal: 0 },
  ];
  const doc = { idInvoice: "INV-DEC-P", tanggal: "2026-08-06", tipe: "Pasar", namaPihak: "Victoria", tenggat: "", mataUang: "Rp", items };
  const v = mod.schemaInvoice(doc);
  check("Pasar stok 1 → 0,3 diterima schema", v.success === true, JSON.stringify(v.errors));
  if (v.success) {
    const t = mod.totalsInvoice("Pasar", v.data.items);
    check("Pasar terjual 0,7 × 15000 = 10500", Math.abs(t.totalPenjualan - 10500) < 1e-9, `got ${t.totalPenjualan}`);
  }
}

// --- Handler ASLI menyimpan qty desimal di semua tipe (kas & stok sesuai) ---
for (const tipe of TIPES) {
  const ctx = freshCtx();
  const items = makeItems(tipe, 1);
  if (tipe === "Pasar") {
    items[0].stokAwal = 1;
    items[0].stokAkhir = 0.3;
    items[0].qty = 1;
  } else {
    items[0].qty = 0.7;
  }
  const doc = { idInvoice: `INV-DEC${tipe.slice(0, 1)}`, tanggal: "2026-08-06", tipe, namaPihak: "Pihak " + tipe, tenggat: "", mataUang: "Rp", items };
  const r = await mod.invokeCreateInvoice(ctx, doc);
  check(`[${tipe}] invoice qty desimal (0,7) TERSIMPAN`, r.ok === true, r.msg);
  if (!r.ok) continue;
  const snap = mod.snapshot(ctx);
  const terjual = 0.7;
  const total = tipe === "Supplier" ? 10000 * terjual : 15000 * terjual;
  const kas = snap.kas.find((k) => k.id === `INV-${doc.idInvoice}`);
  if (tipe === "Supplier") {
    check(`[${tipe}] kas keluar = ${total}`, !!kas && Math.abs(kas.kasKeluar - total) < 1e-9);
  } else {
    check(`[${tipe}] kas masuk = ${total}`, !!kas && Math.abs(kas.kasMasuk - total) < 1e-9);
  }
  check(`[${tipe}] stok riwayat −0,7 tercatat`, snap.stokHistory.some((h) => Math.abs(Math.abs(h.perubahan) - 0.7) < 1e-9 || (tipe === "Pasar" && (h.keterangan ?? "").includes("Kirim"))));
}

// --- Invoice Tetesan qty desimal 0,7 ---
{
  const ctx = freshCtx();
  const items = [{ kodeBarang: "TET001", namaBarang: "Tepung", harga: 10000, qty: 0.7, subtotal: 0 }];
  const doc = { idInvoice: "TET-DEC", tanggal: "2026-08-06", tipe: "Penjualan", namaPihak: "Toko", mataUang: "Rp", items };
  const r = await mod.invokeCreateTetesan(ctx, doc);
  check("[Tetesan Penjualan] qty 0,7 TERSIMPAN", r.ok === true, r.msg);
  if (r.ok) {
    const snap = mod.snapshot(ctx);
    check("[Tetesan Penjualan] total 7000 & stok −0,7", snap.invoiceTetesan.some((x) => x.idInvoice === "TET-DEC" && Math.abs(x.total - 7000) < 1e-9) && snap.tetesanHistory.some((h) => Math.abs(h.perubahan + 0.7) < 1e-9));
  }
}

// ---------------------------------------------------------------------------
console.log("\n" + "=".repeat(70));
console.log("BAGIAN 5 — Aksi PEMBAYARAN invoice (bayar → sisa berkurang → Lunas)");
console.log("=".repeat(70));

// --- Logika murni computeInvoicePayment ---
{
  const f = mod.paymentFn;
  const cases = [
    // [total, dibayarSebelum, nominal, dibayar, sisa, status, tercatat]
    [10000, 0, 4000, 4000, 6000, "Pending", 4000],
    [10000, 4000, 6000, 10000, 0, "Lunas", 6000],
    [10000, 0, 20000, 10000, 0, "Lunas", 10000],
    [10000, 9000, 2000, 10000, 0, "Lunas", 1000],
    [10000, 10000, 1000, 10000, 0, "Lunas", 0],
    [250000, 0, 25000, 25000, 225000, "Pending", 25000],
    [250000, 225000, 50000, 250000, 0, "Lunas", 25000],
  ];
  for (const [total, sudah, nominal, expBayar, expSisa, expStatus, expTercatat] of cases) {
    const r = f(total, sudah, nominal);
    check(
      `payment(${total}, sudah ${sudah}, nominal ${nominal}) → bayar ${expBayar}, sisa ${expSisa}, ${expStatus}`,
      r.dibayar === expBayar && r.sisa === expSisa && r.status === expStatus && r.tercatat === expTercatat,
      JSON.stringify(r),
    );
  }
}

// --- bayarInvoice handler ASLI: multi-bayar Reseller sampai Lunas ---
{
  const ctx = freshCtx();
  // 2 barang Reseller: (15000+0*500)*2 + (15000+1*500)*3 = 30000 + 46500 = 76500
  const items = makeItems("Reseller", 2);
  const doc = { idInvoice: "INV-BAYAR", tanggal: "2026-08-06", tipe: "Reseller", namaPihak: "Toko Bayar", tenggat: "", mataUang: "Rp", items };
  const cr = await mod.invokeCreateInvoice(ctx, doc);
  check("invoice dibuat sebelum pembayaran", cr.ok === true, cr.msg);

  const p1 = await mod.invokeBayarInvoice(ctx, { idInvoice: "INV-BAYAR", nominal: 30000, tanggal: "2026-08-07", keterangan: "DP" });
  check("bayar 30.000 tercatat", p1.ok === true && p1.res.dibayar === 30000 && p1.res.sisa === 46500 && p1.res.status === "Pending", p1.msg);
  let inv = mod.snapshot(ctx).invoice.find((x) => x.idInvoice === "INV-BAYAR");
  check("DB: dibayar 30.000, sisa 46.500, riwayat 1", inv.dibayar === 30000 && inv.sisa === 46500 && inv.riwayatBayar.length === 1 && inv.riwayatBayar[0].nominal === 30000 && inv.riwayatBayar[0].keterangan === "DP");

  const p2 = await mod.invokeBayarInvoice(ctx, { idInvoice: "INV-BAYAR", nominal: 46500, tanggal: "2026-08-09", keterangan: "Pelunasan" });
  check("bayar pelunasan → LUNAS", p2.ok === true && p2.res.dibayar === 76500 && p2.res.sisa === 0 && p2.res.status === "Lunas", p2.msg);
  inv = mod.snapshot(ctx).invoice.find((x) => x.idInvoice === "INV-BAYAR");
  check("DB: Lunas, sisa 0, riwayat 2", inv.statusPembayaran === "Lunas" && inv.sisa === 0 && inv.riwayatBayar.length === 2);

  // Bayar melebihi sisa → dibatasi & tetap Lunas, riwayat tercatat hanya sisa
  const p3 = await mod.invokeBayarInvoice(ctx, { idInvoice: "INV-BAYAR", nominal: 999999 });
  check("bayar berlebih dibatasi (tercatat 0, tetap Lunas)", p3.ok === true && p3.res.dibayar === 76500 && p3.res.sisa === 0 && p3.res.status === "Lunas", p3.msg);
}

// --- bayarInvoice: invoice tidak ditemukan / nominal <= 0 ditolak ---
{
  const ctx = freshCtx();
  const bad1 = await mod.invokeBayarInvoice(ctx, { idInvoice: "INV-GAK-ADA", nominal: 1000 });
  check("invoice tidak ditemukan ditolak", bad1.ok === false && /tidak ditemukan/.test(bad1.msg), bad1.msg);
  const bad2 = await mod.invokeBayarInvoice(ctx, { idInvoice: "INV-GAK-ADA", nominal: 0 });
  check("nominal 0 ditolak", bad2.ok === false && /lebih dari 0/.test(bad2.msg), bad2.msg);
}

// --- bayarInvoice: invoice SUPPLIER memakai total pembelian (totalPenjualan 0) ---
{
  const ctx = freshCtx();
  const items = makeItems("Supplier", 1); // hargaModal 10000 × qty 2 = 20000
  const doc = { idInvoice: "INV-BAY-SUP", tanggal: "2026-08-06", tipe: "Supplier", namaPihak: "CV Pasok", tenggat: "", mataUang: "Rp", items };
  await mod.invokeCreateInvoice(ctx, doc);
  const p = await mod.invokeBayarInvoice(ctx, { idInvoice: "INV-BAY-SUP", nominal: 20000 });
  check("Supplier: bayar 20.000 → Lunas", p.ok === true && p.res.dibayar === 20000 && p.res.sisa === 0 && p.res.status === "Lunas", p.msg);
}

// --- bayarInvoiceTetesan handler ASLI: Penjualan & Modal ---
{
  const ctx = freshCtx();
  const items = [{ kodeBarang: "TET001", namaBarang: "Keripik", harga: 10000, qty: 5, subtotal: 0 }]; // total 50000
  const doc = { idInvoice: "TET-BAYAR", tanggal: "2026-08-06", tipe: "Penjualan", namaPihak: "Kios", mataUang: "Rp", items };
  await mod.invokeCreateTetesan(ctx, doc);
  const p1 = await mod.invokeBayarTetesan(ctx, { idInvoice: "TET-BAYAR", nominal: 20000 });
  check("Tetesan: bayar 20.000 → sisa 30.000 Pending", p1.ok === true && p1.res.dibayar === 20000 && p1.res.sisa === 30000 && p1.res.status === "Pending", p1.msg);
  const p2 = await mod.invokeBayarTetesan(ctx, { idInvoice: "TET-BAYAR", nominal: 30000 });
  check("Tetesan: pelunasan → LUNAS", p2.ok === true && p2.res.dibayar === 50000 && p2.res.sisa === 0 && p2.res.status === "Lunas", p2.msg);
  const inv = mod.snapshot(ctx).invoiceTetesan.find((x) => x.idInvoice === "TET-BAYAR");
  check("Tetesan: DB Lunas, riwayat 2", inv.statusPembayaran === "Lunas" && inv.sisa === 0 && inv.riwayatBayar.length === 2);
}

// --- Upsert re-save TIDAK menghapus pembayaran yang sudah tercatat ---
{
  const ctx = freshCtx();
  const doc = { idInvoice: "INV-REBAYAR", tanggal: "2026-08-06", tipe: "Reseller", namaPihak: "A", tenggat: "", mataUang: "Rp", items: makeItems("Reseller", 1) };
  await mod.invokeCreateInvoice(ctx, doc);
  await mod.invokeBayarInvoice(ctx, { idInvoice: "INV-REBAYAR", nominal: 10000, tanggal: "2026-08-08" });
  const inv1 = mod.snapshot(ctx).invoice.find((x) => x.idInvoice === "INV-REBAYAR");
  const sebelum = { dibayar: inv1.dibayar, sisa: inv1.sisa, riwayat: inv1.riwayatBayar.length, status: inv1.statusPembayaran };
  // Simpan ulang dengan item berbeda
  const doc2 = { idInvoice: "INV-REBAYAR", tanggal: "2026-08-10", tipe: "Reseller", namaPihak: "B", tenggat: "", mataUang: "Rp", items: makeItems("Reseller", 1) };
  const r = await mod.invokeCreateInvoice(ctx, doc2);
  const inv2 = mod.snapshot(ctx).invoice.find((x) => x.idInvoice === "INV-REBAYAR");
  check("re-save berhasil & pembayaran tidak hilang", r.ok === true && inv2.dibayar === sebelum.dibayar && inv2.riwayatBayar.length === sebelum.riwayat && inv2.statusPembayaran === sebelum.status, JSON.stringify({ sebelum, sesudah: inv2 }));
  check("re-save: sisa tetap konsisten (tidak negatif)", inv2.sisa >= 0);
}

console.log("\n" + "=".repeat(70));
console.log("BAGIAN 6 — EDIT invoice yang sudah jadi (stok & kas dibatalkan lalu diterapkan)");
console.log("=".repeat(70));

// --- Edit Reseller: riwayat stok & kas lama dihapus, yang baru diterapkan ---
{
  const ctx = freshCtx();
  const doc1 = {
    idInvoice: "INV-EDIT1", tanggal: "2026-08-06", tipe: "Reseller", namaPihak: "Reseller A", tenggat: "", mataUang: "Rp",
    items: [
      { kodeBarang: "BRG001", namaBarang: "Kopi", hargaModal: 20000, hargaJual: 25000, qty: 2, subtotal: 50000 },
      { kodeBarang: "BRG002", namaBarang: "Teh", hargaModal: 10000, hargaJual: 15000, qty: 3, subtotal: 45000 },
    ],
  };
  await mod.invokeCreateInvoice(ctx, doc1);
  let snap = mod.snapshot(ctx);
  check("edit: create awal 2 riwayat stok keluar", snap.stokHistory.length === 2 && snap.stokHistory.every((h) => h.perubahan < 0));
  check("edit: create awal kas masuk 95.000", (() => { const k = snap.kas.find((x) => x.id === "INV-INV-EDIT1"); return k && k.kasMasuk === 95000; })());

  // Edit: ganti qty & pihak, tambah 1 barang baru
  const doc2 = {
    idInvoice: "INV-EDIT1", tanggal: "2026-08-07", tipe: "Reseller", namaPihak: "Reseller B", tenggat: "", mataUang: "Rp",
    items: [
      { kodeBarang: "BRG001", namaBarang: "Kopi", hargaModal: 20000, hargaJual: 25000, qty: 5, subtotal: 125000 },
      { kodeBarang: "BRG003", namaBarang: "Susu", hargaModal: 5000, hargaJual: 8000, qty: 10, subtotal: 80000 },
    ],
  };
  const r = await mod.invokeEditInvoice(ctx, doc2);
  snap = mod.snapshot(ctx);
  const inv = snap.invoice.find((x) => x.idInvoice === "INV-EDIT1");
  const kas = snap.kas.find((x) => x.id === "INV-INV-EDIT1");
  check("edit: sukses & total baru 205.000", r.ok === true && inv && inv.totalPenjualan === 205000, r.msg);
  check("edit: riwayat stok lama dihapus — hanya 2 baris baru", snap.stokHistory.length === 2, JSON.stringify(snap.stokHistory));
  check("edit: stok Kopi −5 & Susu −10", (() => { const k = snap.stokHistory.find((h) => h.namaBarang === "Kopi"); const s = snap.stokHistory.find((h) => h.namaBarang === "Susu"); return k && k.perubahan === -5 && s && s.perubahan === -10; })(), JSON.stringify(snap.stokHistory));
  check("edit: kas tetap 1 entri dengan nilai baru 205.000", kas && kas.kasMasuk === 205000, JSON.stringify(snap.kas));
  check("edit: pihak & tanggal ikut berubah", inv.namaPihak === "Reseller B" && inv.tanggal === "2026-08-07");
}

// --- Edit invoice Pasar: stok awal/akhir dibatalkan & diterapkan ulang ---
{
  const ctx = freshCtx();
  const doc1 = {
    idInvoice: "INV-EDIT-PASAR", tanggal: "2026-08-06", tipe: "Pasar", namaPihak: "Victoria", tenggat: "", mataUang: "Rp",
    items: [{ kodeBarang: "BRG010", namaBarang: "Ikan", hargaModal: 10000, hargaJual: 15000, stokAwal: 20, stokAkhir: 5, qty: 20, subtotal: 225000 }],
  };
  await mod.invokeCreateInvoice(ctx, doc1);
  let snap = mod.snapshot(ctx);
  check("pasar edit: create awal 2 riwayat (kirim 20, kembali 5)", snap.stokHistory.length === 2, JSON.stringify(snap.stokHistory));
  const doc2 = {
    idInvoice: "INV-EDIT-PASAR", tanggal: "2026-08-08", tipe: "Pasar", namaPihak: "Tunas", tenggat: "", mataUang: "Rp",
    items: [{ kodeBarang: "BRG010", namaBarang: "Ikan", hargaModal: 10000, hargaJual: 15000, stokAwal: 30, stokAkhir: 10, qty: 30, subtotal: 300000 }],
  };
  await mod.invokeEditInvoice(ctx, doc2);
  snap = mod.snapshot(ctx);
  check("pasar edit: riwayat baru 2 (kirim 30, kembali 10)", snap.stokHistory.length === 2 && snap.stokHistory.some((h) => h.perubahan === -30) && snap.stokHistory.some((h) => h.perubahan === 10), JSON.stringify(snap.stokHistory));
  const inv = snap.invoice.find((x) => x.idInvoice === "INV-EDIT-PASAR");
  check("pasar edit: total baru 300.000", inv && inv.totalPenjualan === 300000);
}

// --- Edit invoice: pembayaran yang sudah tercatat TETAP dipertahankan ---
{
  const ctx = freshCtx();
  const doc1 = {
    idInvoice: "INV-EDIT-BAYAR", tanggal: "2026-08-06", tipe: "DPL", namaPihak: "DPL A", tenggat: "", mataUang: "Rp",
    items: [{ kodeBarang: "BRG001", namaBarang: "Kopi", hargaModal: 20000, hargaJual: 25000, qty: 10, subtotal: 250000 }],
  };
  await mod.invokeCreateInvoice(ctx, doc1);
  await mod.invokeBayarInvoice(ctx, { idInvoice: "INV-EDIT-BAYAR", nominal: 100000, tanggal: "2026-08-08" });
  const doc2 = {
    idInvoice: "INV-EDIT-BAYAR", tanggal: "2026-08-06", tipe: "DPL", namaPihak: "DPL A", tenggat: "", mataUang: "Rp",
    items: [{ kodeBarang: "BRG001", namaBarang: "Kopi", hargaModal: 20000, hargaJual: 25000, qty: 16, subtotal: 400000 }],
  };
  const r = await mod.invokeEditInvoice(ctx, doc2);
  const inv = mod.snapshot(ctx).invoice.find((x) => x.idInvoice === "INV-EDIT-BAYAR");
  check("edit: dibayar tetap 100.000 & riwayat tetap 1", r.ok === true && inv.dibayar === 100000 && inv.riwayatBayar.length === 1, r.msg);
  check("edit: sisa dihitung ulang = 300.000", inv.sisa === 300000, JSON.stringify(inv));
}

// --- Edit invoice yang tidak ada → ditolak ---
{
  const ctx = freshCtx();
  const doc = {
    idInvoice: "INV-TIDAK-ADA", tanggal: "2026-08-06", tipe: "Reseller", namaPihak: "X", tenggat: "", mataUang: "Rp",
    items: [{ kodeBarang: "BRG001", namaBarang: "Kopi", hargaModal: 1000, hargaJual: 2000, qty: 1, subtotal: 2000 }],
  };
  const r = await mod.invokeEditInvoice(ctx, doc);
  check("edit invoice tak ada → ditolak", r.ok === false && /tidak ditemukan/.test(r.msg), r.msg);
}

// --- Edit invoice tetesan Penjualan: stok & kas dibatalkan lalu diterapkan ---
{
  const ctx = freshCtx();
  const doc1 = {
    idInvoice: "TET-EDIT1", tanggal: "2026-08-06", tipe: "Penjualan", namaPihak: "Kios A", mataUang: "Rp",
    items: [{ kodeBarang: "BJK001", namaBarang: "Keripik", harga: 10000, qty: 5, subtotal: 50000 }],
  };
  await mod.invokeCreateTetesan(ctx, doc1);
  const doc2 = {
    idInvoice: "TET-EDIT1", tanggal: "2026-08-07", tipe: "Penjualan", namaPihak: "Kios B", mataUang: "Rp",
    items: [
      { kodeBarang: "BJK001", namaBarang: "Keripik", harga: 10000, qty: 8, subtotal: 80000 },
      { kodeBarang: "BJK002", namaBarang: "Abon", harga: 20000, qty: 2, subtotal: 40000 },
    ],
  };
  const r = await mod.invokeEditTetesan(ctx, doc2);
  const snap = mod.snapshot(ctx);
  const inv = snap.invoiceTetesan.find((x) => x.idInvoice === "TET-EDIT1");
  const kas = snap.kas.find((x) => x.id === "KAS-TET-TET-EDIT1");
  check("tetesan edit: sukses & total 120.000", r.ok === true && inv && inv.total === 120000, r.msg);
  check("tetesan edit: riwayat baru 2 (keluar 8 & 2)", snap.tetesanHistory.length === 2, JSON.stringify(snap.tetesanHistory));
  check("tetesan edit: kas tetap 1 entri 120.000", kas && kas.kasMasuk === 120000, JSON.stringify(snap.kas));
}

// --- Edit invoice tetesan Modal: stok Baku & Gudang ikut dibatalkan/diterapkan ---
{
  const ctx = freshCtx();
  const doc1 = {
    idInvoice: "TET-EDIT-M", tanggal: "2026-08-06", tipe: "Modal", namaPihak: "Pemasok A", mataUang: "Rp",
    items: [{ kodeBarang: "BBK001", namaBarang: "Tepung", harga: 5000, qty: 10, subtotal: 50000 }],
  };
  await mod.invokeCreateTetesan(ctx, doc1);
  let snap = mod.snapshot(ctx);
  check("tetesan modal create: stok baku +10 & gudang −10", snap.tetesanHistory.some((h) => h.perubahan === 10) && snap.stokHistory.some((h) => h.perubahan === -10));
  const doc2 = {
    idInvoice: "TET-EDIT-M", tanggal: "2026-08-07", tipe: "Modal", namaPihak: "Pemasok B", mataUang: "Rp",
    items: [{ kodeBarang: "BBK001", namaBarang: "Tepung", harga: 5000, qty: 15, subtotal: 75000 }],
  };
  const r = await mod.invokeEditTetesan(ctx, doc2);
  snap = mod.snapshot(ctx);
  const inv = snap.invoiceTetesan.find((x) => x.idInvoice === "TET-EDIT-M");
  const kas = snap.kas.find((x) => x.id === "KAS-TET-TET-EDIT-M");
  check("tetesan modal edit: sukses & total 75.000", r.ok === true && inv.total === 75000, r.msg);
  check("tetesan modal edit: stok baku 1 riwayat +15 & gudang 1 riwayat −15", snap.tetesanHistory.length === 1 && snap.tetesanHistory[0].perubahan === 15 && snap.stokHistory.length === 1 && snap.stokHistory[0].perubahan === -15, JSON.stringify({ tetesan: snap.tetesanHistory, gudang: snap.stokHistory }));
  check("tetesan modal edit: kas keluar 75.000 (1 entri)", kas && kas.kasKeluar === 75000);
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
