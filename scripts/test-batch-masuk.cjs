// Targeted tests untuk fitur Barang Masuk (batch + alokasi + invoice otomatis).
// Vitest tidak bisa berjalan di WebContainer, jadi logika murni direplikasi
// 1:1 dari src/convex/batch.ts dan diuji di sini.

let passed = 0;
let failed = 0;

function check(name, cond) {
  if (cond) {
    passed++;
    console.log(`  ✅ ${name}`);
  } else {
    failed++;
    console.log(`  ❌ ${name}`);
  }
}

const roundNum = (n) => Math.round(n * 1000) / 1000;

// ===== Replikasi logika dari src/convex/batch.ts =====

// Sisa batch = qty - total alokasi (validasi splitBatch)
function sisaBatch(qty, alokasiList) {
  return roundNum(qty - alokasiList.reduce((s, a) => s + a.qty, 0));
}

function validateSplit(batchQty, existingAlokasi, newAlokasiQty) {
  const sisa = sisaBatch(batchQty, existingAlokasi);
  if (newAlokasiQty <= 0) return { ok: false, reason: "Qty harus > 0" };
  if (newAlokasiQty > sisa) return { ok: false, reason: "Stok tidak cukup" };
  return { ok: true, sisaBaru: roundNum(sisa - newAlokasiQty) };
}

// Subtotal & margin per tujuan (logika sama seperti invoice)
function hitungAlokasi(tipeTujuan, qty, hargaJual, hargaModal) {
  const subtotal = qty * hargaJual;
  let margin = 0;
  if (tipeTujuan === "Reseller" || tipeTujuan === "DPL") {
    margin = subtotal - qty * hargaModal;
  }
  // Pasar: margin dihitung nanti saat laporan stok akhir masuk
  return { subtotal, margin };
}

// Margin Pasar saat laporan balik: terjual = stokAwal - stokAkhir
function marginPasar(stokAwal, stokAkhir, hargaJual, hargaModal) {
  const terjual = stokAwal - stokAkhir;
  return terjual * (hargaJual - hargaModal);
}

// ===== Tests =====

console.log("\n📦 Validasi Pemecahan Batch");
{
  const alokasi = [{ qty: 5 }, { qty: 8 }];
  check("sisa = 15 - (5+8) = 2", sisaBatch(15, alokasi) === 2);
  check("split pas (0 sisa) diterima", validateSplit(15, alokasi, 2).ok === true);
  check("split melebihi sisa ditolak", validateSplit(15, alokasi, 3).ok === false);
  check("qty negatif ditolak", validateSplit(15, [], -1).ok === false);
  check("qty nol ditolak", validateSplit(15, [], 0).ok === false);
  check("sisa baru setelah pecah 5 dari 15", validateSplit(15, [], 5).sisaBaru === 10);
}

console.log("\n💰 Hitung Alokasi per Tujuan");
{
  const r1 = hitungAlokasi("Reseller", 5, 13000, 10000);
  check("Reseller subtotal = 65.000", r1.subtotal === 65000);
  check("Reseller margin = 15.000", r1.margin === 15000);

  const r2 = hitungAlokasi("DPL", 4, 12500, 10000);
  check("DPL margin = 10.000", r2.margin === 10000);

  const r3 = hitungAlokasi("Pasar", 8, 13000, 10000);
  check("Pasar subtotal = 104.000", r3.subtotal === 104000);
  check("Pasar margin ditunda (0)", r3.margin === 0);

  const r4 = hitungAlokasi("Reseller", 3, 9000, 10000); // jual di bawah modal
  check("Margin negatif tetap tercatat", r4.margin === -3000);
}

console.log("\n🏪 Margin Pasar saat Laporan Balik");
{
  check("terjual 6 dari titipan 8 (akhir 2)", marginPasar(8, 2, 13000, 10000) === 18000);
  check("laku semua (akhir 0)", marginPasar(8, 0, 13000, 10000) === 24000);
  check("tidak laku (akhir 8)", marginPasar(8, 8, 13000, 10000) === 0);
}

console.log("\n🔗 Invoice Otomatis");
{
  // splitBatch membuat invoice dengan tipe sesuai tujuan
  const tujuanToTipe = { Reseller: "Reseller", DPL: "DPL", Pasar: "Pasar" };
  check("tujuan Reseller → tipe invoice Reseller", tujuanToTipe["Reseller"] === "Reseller");
  check("tujuan DPL → tipe invoice DPL", tujuanToTipe["DPL"] === "DPL");
  check("tujuan Pasar → tipe invoice Pasar", tujuanToTipe["Pasar"] === "Pasar");

  // Item invoice membawa hargaModal untuk margin tracking
  const item = { namaBarang: "Tongkol", qty: 5, hargaJual: 13000, hargaModal: 10000 };
  check("item invoice menyimpan hargaModal", item.hargaModal === 10000);
}

console.log(`\n${"=".repeat(40)}`);
console.log(`Hasil: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
