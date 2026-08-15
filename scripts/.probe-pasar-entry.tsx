
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
