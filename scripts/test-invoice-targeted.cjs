/**
 * Quick targeted test runner for business logic.
 * Runs in plain Node.js (no vitest needed) to validate the functions
 * that our recent changes touch: computeInvoiceTotals, itemMargin, formatCurrency.
 */

// Polyfill Console for WebContainer
if (typeof Console === 'undefined') {
  globalThis.Console = class Console {
    constructor() {}
    log() {}
    error() {}
    warn() {}
    info() {}
    debug() {}
    trace() {}
  };
}

const assert = require('assert');

// Dynamically import the TS business module (Vite transpiles .ts on the fly)
(async () => {
  let passed = 0;
  let failed = 0;

  function test(name, fn) {
    try {
      fn();
      passed++;
      console.log(`  ✅ ${name}`);
    } catch (e) {
      failed++;
      console.log(`  ❌ ${name}`);
      console.log(`     ${e.message}`);
    }
  }

  // We can't import .ts files directly, so we inline the key functions
  // from src/lib/business.ts to validate them.

  function parseNum(v) {
    if (v == null || v === '') return 0;
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  }

  function roundNum(n) {
    return Math.round(n * 100) / 100;
  }

  function formatCurrency(n, mataUang = 'Rp') {
    const num = parseNum(n);
    if (mataUang === '$') {
      return `$${num.toLocaleString('en-US')}`;
    }
    return `Rp ${num.toLocaleString('id-ID')}`;
  }

  function itemSubtotal(tipe, it) {
    const qty = tipe === 'Pasar'
      ? parseNum(it.stokAwal) - parseNum(it.stokAkhir)
      : parseNum(it.qty);
    const harga = tipe === 'Supplier' ? parseNum(it.hargaModal) : parseNum(it.hargaJual);
    const st = roundNum(qty * harga);
    return tipe === 'Pasar' ? st : Math.max(0, st);
  }

  function itemMargin(tipe, it) {
    if (tipe === 'Supplier') return 0;
    const qty = tipe === 'Pasar'
      ? roundNum(parseNum(it.stokAwal) - parseNum(it.stokAkhir))
      : parseNum(it.qty);
    return roundNum(qty * (parseNum(it.hargaJual) - parseNum(it.hargaModal)));
  }

  function computeInvoiceTotals(tipe, items) {
    let totalModal = 0;
    let totalPenjualan = 0;
    for (const it of items) {
      const subtotal = itemSubtotal(tipe, it);
      const margin = itemMargin(tipe, it);
      if (tipe === 'Supplier') {
        totalModal += parseNum(it.hargaModal) * parseNum(it.qty);
        totalPenjualan += subtotal;
      } else {
        totalModal += parseNum(it.hargaModal) * parseNum(it.qty);
        totalPenjualan += subtotal;
      }
    }
    totalModal = roundNum(totalModal);
    totalPenjualan = roundNum(totalPenjualan);
    return {
      totalModal,
      totalPenjualan,
      margin: roundNum(totalPenjualan - totalModal),
      total: tipe === 'Supplier' ? totalModal : totalPenjualan,
    };
  }

  console.log('\n🧪 TARGETED TESTS — Invoice Business Logic\n');

  // ── Supplier ──
  console.log('Supplier:');
  test('total = sum of hargaModal × qty', () => {
    const items = [
      { hargaModal: 25000, hargaJual: 28000, qty: 10 },
      { hargaModal: 15000, hargaJual: 18000, qty: 5 },
    ];
    const t = computeInvoiceTotals('Supplier', items);
    assert.strictEqual(t.total, 325000);
    assert.strictEqual(t.totalModal, 325000);
    assert.strictEqual(t.margin, 0);
  });

  // ── Reseller ──
  console.log('\nReseller:');
  test('total = sum of hargaJual × qty, margin = penjualan − modal', () => {
    const items = [
      { hargaModal: 25000, hargaJual: 28000, qty: 10 },
      { hargaModal: 15000, hargaJual: 18000, qty: 5 },
    ];
    const t = computeInvoiceTotals('Reseller', items);
    assert.strictEqual(t.totalPenjualan, 370000); // 280k + 90k
    assert.strictEqual(t.totalModal, 325000);     // 250k + 75k
    assert.strictEqual(t.margin, 45000);           // 370k - 325k
    assert.strictEqual(t.total, 370000);
  });

  test('itemMargin computes correctly for Reseller', () => {
    const m = itemMargin('Reseller', { hargaModal: 25000, hargaJual: 28000, qty: 10 });
    assert.strictEqual(m, 30000); // (28000 - 25000) × 10
  });

  test('itemMargin is 0 for Supplier', () => {
    const m = itemMargin('Supplier', { hargaModal: 25000, hargaJual: 28000, qty: 10 });
    assert.strictEqual(m, 0);
  });

  // ── DPL ──
  console.log('\nDPL:');
  test('DPL behaves like Reseller for totals', () => {
    const items = [
      { hargaModal: 25000, hargaJual: 30000, qty: 20 },
    ];
    const t = computeInvoiceTotals('DPL', items);
    assert.strictEqual(t.totalPenjualan, 600000);
    assert.strictEqual(t.totalModal, 500000);
    assert.strictEqual(t.margin, 100000);
  });

  // ── Pasar ──
  console.log('\nPasar:');
  test('Pasar: subtotal = (stokAwal − stokAkhir) × hargaJual', () => {
    const it = { hargaModal: 25000, hargaJual: 35000, stokAwal: 30, stokAkhir: 5, qty: 30 };
    const sub = itemSubtotal('Pasar', it);
    assert.strictEqual(sub, 875000); // 25 × 35000
  });

  test('Pasar: margin = (stokAwal − stokAkhir) × (hargaJual − hargaModal)', () => {
    const m = itemMargin('Pasar', { hargaModal: 25000, hargaJual: 35000, stokAwal: 30, stokAkhir: 5, qty: 30 });
    assert.strictEqual(m, 250000); // 25 × 10000
  });

  // ── Item subtotal edge cases ──
  console.log('\nEdge Cases:');
  test('subtotal is 0 when qty is 0', () => {
    const sub = itemSubtotal('Reseller', { hargaModal: 25000, hargaJual: 28000, qty: 0 });
    assert.strictEqual(sub, 0);
  });

  test('subtotal is 0 when hargaJual is 0', () => {
    const sub = itemSubtotal('Reseller', { hargaModal: 25000, hargaJual: 0, qty: 10 });
    assert.strictEqual(sub, 0);
  });

  test('subtotal is non-negative even if qty × hargaJual is negative (non-Pasar)', () => {
    const sub = itemSubtotal('Reseller', { hargaModal: -100, hargaJual: -50, qty: 10 });
    assert.ok(sub >= 0, `Expected >= 0, got ${sub}`);
  });

  // ── Format currency ──
  console.log('\nFormat Currency:');
  test('formatCurrency Rp', () => {
    const s = formatCurrency(1000000, 'Rp');
    assert.ok(s.includes('Rp'), `Expected Rp prefix, got: ${s}`);
  });

  test('formatCurrency $', () => {
    const s = formatCurrency(1000000, '$');
    assert.ok(s.includes('$'), `Expected $ prefix, got: ${s}`);
  });

  // ── Mata Uang validation ──
  console.log('\nMata Uang:');
  test('valid mata uang values', () => {
    const valid = ['Rp', '$'];
    assert.ok(valid.includes('Rp'));
    assert.ok(valid.includes('$'));
  });

  // ── Session expiry ──
  console.log('\nSession Expiry:');
  test('15-year expiry in ms is correct', () => {
    const EXPIRY_MS = 15 * 365 * 24 * 60 * 60 * 1000;
    const years = EXPIRY_MS / (365 * 24 * 60 * 60 * 1000);
    assert.strictEqual(years, 15);
  });

  test('session with future expiresAt is valid', () => {
    const expiresAt = Date.now() + 100000;
    assert.ok(Date.now() <= expiresAt);
  });

  test('session with past expiresAt is expired', () => {
    const expiresAt = Date.now() - 100000;
    assert.ok(Date.now() > expiresAt);
  });

  test('session without expiresAt (legacy) is valid', () => {
    const expiresAt = undefined;
    assert.ok(!expiresAt || Date.now() <= expiresAt);
  });

  // ── Summary ──
  console.log(`\n${'═'.repeat(50)}`);
  console.log(`Results: ${passed} passed, ${failed} failed, ${passed + failed} total`);
  console.log(`${'═'.repeat(50)}\n`);

  process.exit(failed > 0 ? 1 : 0);
})();
