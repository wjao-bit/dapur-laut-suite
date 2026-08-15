// Probe: reproduksi alur EDIT Pasar persis seperti form frontend.
// 1) createInvoice (barang baru dengan stokAwal/stokAkhir)
// 2) "load" item seperti useEffect form: mapping editInv.items → form items
// 3) handleSubmit mapping form items → payload cleanItems
// 4) editInvoice → cek semua item lolos & jumlah item tetap
import { readFileSync, writeFileSync, existsSync, rmSync } from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);

const ENTRY_SRC = `
import { createInvoice, editInvoice } from "@/convex/business.ts";
import { validate, invoiceSchema } from "@/lib/schemas.ts";
import { computeInvoiceTotals } from "@/lib/business.ts";
import { parseNum, roundNum } from "@/lib/format.ts";

function makeDb() {
  const tables = new Map();
  let seq = 0;
  const ensure = (name) => {
    if (!tables.has(name)) tables.set(name, new Map());
    return tables.get(name);
  };
  const chain = (items) => {
    const qApi = { field: (f) => ({ __f: f }), eq: (a, b) => ({ __eq: [a, b] }), and: (a, b) => ({ __and: [a, b] }), or: (a, b) => ({ __or: [a, b] }), lt: (a, b) => ({ __lt: [a, b] }), gt: (a, b) => ({ __gt: [a, b] }) };
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
      filter(pred) { const expr = pred(qApi); return chain(items.filter((d) => evalExpr(expr, d))); },
      collect() { return items.map((d) => ({ ...d })); },
      first() { return items.length ? { ...items[0] } : null; },
    };
  };
  return {
    query(name) { return chain([...ensure(name).values()]); },
    insert(name, doc) { const t = ensure(name); const _id = "_" + name + "_" + (++seq); t.set(_id, { _id, _creationTime: Date.now() + seq, ...doc }); return _id; },
    patch(id, patch) { for (const t of tables.values()) { const d = t.get(id); if (d) { Object.assign(d, patch); return; } } },
    delete(id) { for (const t of tables.values()) t.delete(id); },
  };
}
export function makeCtx() { return { db: makeDb() }; }

async function run(fn, ctx, args) {
  try {
    const handler = typeof fn === "function" ? fn._handler : fn.handler;
    const res = await handler(ctx, args);
    return { ok: true, res };
  } catch (e) {
    return { ok: false, data: (e && e.data) || {}, msg: String((e && e.message) || e) };
  }
}
export const invokeCreateInvoice = (ctx, doc) => run(createInvoice, ctx, { doc });
export const invokeEditInvoice = (ctx, doc) => run(editInvoice, ctx, { doc });
export const schemaInvoice = (doc) => validate(invoiceSchema, doc);
export const totalsInvoice = (tipe, items) => computeInvoiceTotals(tipe, items);
export const parseNumFn = parseNum;
export const roundNumFn = roundNum;

// --- Persis mapping useEffect di InvoiceFormDialog (load item utk edit) ---
export function loadItemsForEdit(invItems) {
  return (invItems ?? []).map((it) => ({
    kodeBarang: it.kodeBarang ?? "",
    namaBarang: it.namaBarang ?? "",
    hargaModal: parseNum(it.hargaModal),
    qty: parseNum(it.qty) || 1,
    hargaJual: parseNum(it.hargaJual),
    stokAwal: it.stokAwal != null ? parseNum(it.stokAwal) : undefined,
    stokAkhir: it.stokAkhir != null ? parseNum(it.stokAkhir) : undefined,
    subtotal: parseNum(it.subtotal),
  }));
}

// --- Persis itemSubtotal + handleSubmit mapping di InvoiceFormDialog ---
export function itemSubtotal(tipe, it) {
  const qty = tipe === "Pasar" ? parseNum(it.stokAwal) - parseNum(it.stokAkhir) : parseNum(it.qty);
  const harga = tipe === "Supplier" ? parseNum(it.hargaModal) : parseNum(it.hargaJual);
  const st = roundNum(qty * harga);
  return tipe === "Pasar" ? st : Math.max(0, st);
}
export function buildCleanItems(tipe, items) {
  return items
    .filter((it) => {
      const hasName = !!it.kodeBarang || !!it.namaBarang;
      const hasVal = parseNum(it.qty) > 0 || parseNum(it.hargaModal) > 0 || parseNum(it.hargaJual) > 0 || parseNum(it.stokAwal) > 0 || parseNum(it.stokAkhir) > 0;
      return hasName || hasVal;
    })
    .map((it) => {
      const stokAwal = tipe === "Pasar" ? parseNum(it.stokAwal) : 0;
      const stokAkhir = tipe === "Pasar" ? parseNum(it.stokAkhir) : 0;
      return {
        kodeBarang: it.kodeBarang,
        namaBarang: it.namaBarang,
        hargaModal: parseNum(it.hargaModal),
        hargaJual: parseNum(it.hargaJual),
        qty: stokAwal || parseNum(it.qty),
        subtotal: itemSubtotal(tipe, it),
        stokAwal: tipe === "Pasar" ? stokAwal : undefined,
        stokAkhir: tipe === "Pasar" ? stokAkhir : undefined,
      };
    });
}
`;

const entryOut = join(root, "scripts/.probe-pasar-entry.tsx");
const bundleOut = join(root, "scripts/.probe-pasar-bundle.cjs");

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
let pass = 0;
let fail = 0;
const check = (name, cond, extra = "") => {
  if (cond) { pass++; console.log(`  ✅ ${name}`); }
  else { fail++; console.log(`  ❌ ${name} ${extra}`); }
};
const freshCtx = () => mod.makeCtx();

// ============================================================
// Kasus 1: invoice Pasar BARU (stokAwal/stokAkhir tersimpan penuh),
// 5 barang seperti di screenshot INV029 → edit round-trip
// ============================================================
{
  const ctx = freshCtx();
  const items = [
    { kodeBarang: "BRG092", namaBarang: "Belanak SD", hargaModal: 0, hargaJual: 38000, stokAwal: 18.6, stokAkhir: 2.9, qty: 18.6, subtotal: 596600 },
    { kodeBarang: "BRG098", namaBarang: "Talang", hargaModal: 0, hargaJual: 22000, stokAwal: 4.6, stokAkhir: 4.6, qty: 4.6, subtotal: 0 },
    { kodeBarang: "BRG093", namaBarang: "Duri", hargaModal: 0, hargaJual: 17000, stokAwal: 1.7, stokAkhir: 0, qty: 1.7, subtotal: 28900 },
    { kodeBarang: "BRG-MSK5SDFKEKK", namaBarang: "Bandeng", hargaModal: 0, hargaJual: 17000, stokAwal: 2.8, stokAkhir: 0.4, qty: 2.8, subtotal: 40800 },
    { kodeBarang: "BRG090", namaBarang: "Alu K", hargaModal: 0, hargaJual: 22000, stokAwal: 0.4, stokAkhir: 0.4, qty: 0.4, subtotal: 0 },
  ];
  const doc = { idInvoice: "INV029", tanggal: "2026-08-04", tipe: "Pasar", namaPihak: "Victoria", tenggat: "", mataUang: "Rp", statusPembayaran: "Lunas", items };
  const cr = await mod.invokeCreateInvoice(ctx, doc);
  check("create INV029 (5 barang Pasar) sukses", cr.ok === true, cr.msg);
  const dbInv = (() => {
    // ambil invoice dari snapshot via query db
    const rows = ctx.db.query("invoice").collect();
    return rows.find((x) => x.idInvoice === "INV029");
  })();
  check("DB menyimpan 5 item", !!dbInv && dbInv.items.length === 5);

  // load seperti form
  const formItems = mod.loadItemsForEdit(dbInv.items);
  check("load form: 5 item dimuat", formItems.length === 5);
  check("load form: stokAwal 18.6 & stokAkhir 2.9 utk item 1", formItems[0].stokAwal === 18.6 && formItems[0].stokAkhir === 2.9, JSON.stringify(formItems[0]));

  // submit seperti form
  const clean = mod.buildCleanItems("Pasar", formItems);
  check("cleanItems: 5 item dipertahankan", clean.length === 5, JSON.stringify(clean.map((c) => c.namaBarang)));
  const payload = { idInvoice: "INV029", tanggal: "2026-08-04", tipe: "Pasar", namaPihak: "Victoria", tenggat: "", mataUang: "Rp", statusPembayaran: "Lunas", items: clean };
  const sv = mod.schemaInvoice(payload);
  check("payload edit lolos schema", sv.success === true, JSON.stringify(sv.errors));

  const er = await mod.invokeEditInvoice(ctx, payload);
  check("editInvoice sukses", er.ok === true, er.msg);
  const inv2 = ctx.db.query("invoice").collect().find((x) => x.idInvoice === "INV029");
  check("setelah edit: 5 item tetap tersimpan", !!inv2 && inv2.items.length === 5, JSON.stringify(inv2?.items?.length));
  check("setelah edit: total 8.934.400", !!inv2 && inv2.totalPenjualan === 8934400, JSON.stringify(inv2?.totalPenjualan));
}

// ============================================================
// Kasus 2: invoice Pasar LAMA — item TANPA stokAwal/stokAkhir
// (hanya qty + subtotal). Ini yang membuat edit GAGAL.
// ============================================================
{
  const ctx = freshCtx();
  const items = [
    { kodeBarang: "BRG001", namaBarang: "Kembung", hargaModal: 0, hargaJual: 15000, qty: 10, subtotal: 120000 },
    { kodeBarang: "BRG002", namaBarang: "Cumi", hargaModal: 0, hargaJual: 30000, qty: 5, subtotal: 90000 },
  ];
  const doc = { idInvoice: "INV-LAMA", tanggal: "2026-07-01", tipe: "Pasar", namaPihak: "Tunas", tenggat: "", mataUang: "Rp", items };
  const cr = await mod.invokeCreateInvoice(ctx, doc);
  check("create invoice Pasar lama (tanpa stokAwal) sukses", cr.ok === true, cr.msg);

  const dbInv = ctx.db.query("invoice").collect().find((x) => x.idInvoice === "INV-LAMA");
  const formItems = mod.loadItemsForEdit(dbInv.items);
  check("load form: item lama tanpa stokAwal dimuat", formItems.length === 2);
  check("load form: stokAwal item lama = undefined (BUG terdeteksi)", formItems[0].stokAwal === undefined, JSON.stringify(formItems[0]));

  const clean = mod.buildCleanItems("Pasar", formItems);
  const payload = { idInvoice: "INV-LAMA", tanggal: "2026-07-01", tipe: "Pasar", namaPihak: "Tunas", tenggat: "", mataUang: "Rp", items: clean };
  const sv = mod.schemaInvoice(payload);
  check("payload edit invoice lama lolos schema (HARUSNYA sekarang bisa)", sv.success === true, JSON.stringify(sv.errors));
  const er = await mod.invokeEditInvoice(ctx, payload);
  check("editInvoice invoice lama sukses (tidak error 'Stok awal')", er.ok === true, er.msg);
  const inv2 = ctx.db.query("invoice").collect().find((x) => x.idInvoice === "INV-LAMA");
  check("setelah edit: 2 item tetap tersimpan", !!inv2 && inv2.items.length === 2);
}

console.log(`\nHASIL: ${pass} lulus, ${fail} gagal — ${fail === 0 ? "SEMUA LULUS ✅" : "ADA KEGAGALAN ❌"}`);
try { rmSync(entryOut, { force: true }); rmSync(bundleOut, { force: true }); } catch { /* abaikan */ }
process.exit(fail === 0 ? 0 : 1);
