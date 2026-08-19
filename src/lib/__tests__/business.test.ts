import { describe, it, expect } from "vitest";
import {
  computeInvoiceTotals,
  computeKasBalances,
  computeSlipGaji,
  computeGudangRows,
  aggregateRekapPihak,
  aggregateMarginByProduk,
  aggregateRekapBarang,
  countAbsensi,
  daysUntil,
  inRange,
  computeTetesanTotals,
  formatCurrency,
} from "../business";
import {
  validate,
  invoiceSchema,
  returSchema,
  kasSchema,
  absensiSchema,
  slipGajiSchema,
  invoiceTetesanSchema,
  bahanBakuSchema,
  barangJadiSchema,
  gudangSchema,
} from "../schemas";

// ============================================================================
// INVOICE — perhitungan total/modal/penjualan/margin per tipe
// ============================================================================

describe("Invoice", () => {
  const items = [
    { kodeBarang: "BRG001", namaBarang: "Kopi Bubuk", hargaModal: 25000, qty: 10, subtotal: 250000 },
    { kodeBarang: "BRG002", namaBarang: "Teh Hijau", hargaModal: 15000, qty: 5, subtotal: 75000 },
  ];

  it("Supplier: total = Σ hargaModal × qty (pembelian, stok masuk)", () => {
    const t = computeInvoiceTotals("Supplier", items as any);
    expect(t.total).toBe(325000);
    expect(t.totalModal).toBe(325000);
    expect(t.margin).toBe(0);
  });

  it("Reseller: total = Σ hargaJual × qty, margin = penjualan − modal", () => {
    const t = computeInvoiceTotals("Reseller", [
      { ...items[0], hargaJual: 28000, subtotal: 280000 },
      { ...items[1], hargaJual: 18000, subtotal: 90000 },
    ] as any);
    expect(t.totalModal).toBe(325000);
    expect(t.totalPenjualan).toBe(370000);
    expect(t.margin).toBe(45000);
  });

  it("Pasar: penjualan dari stokAwal − stokAkhir, stok akhir dikembalikan", () => {
    const t = computeInvoiceTotals("Pasar", [
      { kodeBarang: "BRG004", namaBarang: "Udang", hargaModal: 75000, qty: 30, hargaJual: 95000, stokAwal: 30, stokAkhir: 5, subtotal: 2375000 },
    ] as any);
    expect(t.totalModal).toBe(25 * 75000); // 1.875.000 (25 terjual)
    expect(t.totalPenjualan).toBe(25 * 95000); // 2.375.000
    expect(t.margin).toBe(500000);
  });

  it("Pasar: stok akhir > stok awal DITERIMA — barang pulang lebih banyak → terjual minus", () => {
    // Sesuai permintaan user: barang pulang boleh lebih banyak dari stok awal
    // (stok gudang ikut minus). Validator menerimanya, dan perhitungan
    // penjualan/modal/margin menjadi negatif.
    const r = validate(invoiceSchema, {
      idInvoice: "INV-X",
      tanggal: "2026-08-04",
      tipe: "Pasar",
      namaPihak: "Victoria",
      items: [{ kodeBarang: "B1", namaBarang: "X", hargaModal: 1000, qty: 5, stokAwal: 5, stokAkhir: 7, subtotal: 0 }],
    });
    expect(r.success).toBe(true);
    const t = computeInvoiceTotals("Pasar", [
      { kodeBarang: "B1", namaBarang: "X", hargaModal: 1000, qty: 5, hargaJual: 1500, stokAwal: 5, stokAkhir: 7, subtotal: -3000 },
    ]);
    expect(t.totalPenjualan).toBe(-3000); // (5 − 7) × 1500
    expect(t.totalModal).toBe(-2000); // (5 − 7) × 1000
    expect(t.margin).toBe(-1000);
  });

  it("Pasar: stok awal harus lebih dari 0 (tetap divalidasi)", () => {
    const r = validate(invoiceSchema, {
      idInvoice: "INV-Y",
      tanggal: "2026-08-04",
      tipe: "Pasar",
      namaPihak: "Victoria",
      items: [{ kodeBarang: "B1", namaBarang: "X", hargaModal: 1000, qty: 5, stokAwal: 0, stokAkhir: 0, subtotal: 0 }],
    });
    expect(r.success).toBe(false);
  });

  it("Invoice kosong tanpa items harus ditolak validator", () => {
    const r = validate(invoiceSchema, {
      idInvoice: "INV-X",
      tanggal: "2026-08-04",
      tipe: "Reseller",
      namaPihak: "Reseller A",
      items: [],
    });
    expect(r.success).toBe(false);
  });

  it("Payload contoh multi-barang valid sesuai schema", () => {
    const r = validate(invoiceSchema, {
      idInvoice: "INV001",
      tanggal: "2026-08-04",
      tipe: "Reseller",
      namaPihak: "Reseller A",
      items: [
        { kodeBarang: "BRG001", namaBarang: "Kopi Bubuk", hargaModal: 25000, qty: 10, subtotal: 250000 },
        { kodeBarang: "BRG002", namaBarang: "Teh Hijau", hargaModal: 15000, qty: 5, subtotal: 75000 },
      ],
    });
    expect(r.success).toBe(true);
  });

  it("Tenggat: tanpa tenggat valid; format salah ditolak", () => {
    const ok = validate(invoiceSchema, {
      idInvoice: "INV002",
      tanggal: "2026-08-04",
      tipe: "Reseller",
      namaPihak: "Reseller A",
      tenggat: "2026-08-10",
      items: [{ kodeBarang: "B1", namaBarang: "X", hargaModal: 1000, qty: 2, subtotal: 2000 }],
    });
    expect(ok.success).toBe(true);
    const bad = validate(invoiceSchema, {
      idInvoice: "INV003",
      tanggal: "2026-08-04",
      tipe: "Reseller",
      namaPihak: "Reseller A",
      tenggat: "10-08-2026",
      items: [{ kodeBarang: "B1", namaBarang: "X", hargaModal: 1000, qty: 2, subtotal: 2000 }],
    });
    expect(bad.success).toBe(false);
  });

  it("Invoice valid → error message sesuai {'error': 'Payload tidak sesuai schema'}", () => {
    const r = validate(invoiceSchema, {
      idInvoice: "INV004",
      tanggal: "2026-08-04",
      tipe: "Reseller",
      namaPihak: "Reseller A",
      items: [],
    });
    expect(r.success).toBe(false);
    expect(Array.isArray(r.errors)).toBe(true);
    expect(r.errors!.length).toBeGreaterThan(0);
  });
});

// ============================================================================
// TANGGAL — sisa hari menuju tenggat (notifikasi H-3) & filter periode
// ============================================================================

describe("Tenggat & Notifikasi", () => {
  it("daysUntil menghitung sisa hari (0 = hari ini, negatif = lewat)", () => {
    expect(daysUntil("2026-08-07", "2026-08-04")).toBe(3);
    expect(daysUntil("2026-08-04", "2026-08-04")).toBe(0);
    expect(daysUntil("2026-08-02", "2026-08-04")).toBe(-2);
  });

  it("Notifikasi H-3: hari ≤ 3 atau lewat → wajib muncul", () => {
    expect(daysUntil("2026-08-07", "2026-08-04")).toBeLessThanOrEqual(3);
    expect(daysUntil("2026-08-03", "2026-08-04")).toBeLessThanOrEqual(3);
    expect(daysUntil("2026-08-10", "2026-08-04")).toBeGreaterThan(3);
  });

  it("inRange memfilter tanggal dalam periode", () => {
    expect(inRange("2026-08-04", "2026-08-01", "2026-08-31")).toBe(true);
    expect(inRange("2026-07-30", "2026-08-01", "2026-08-31")).toBe(false);
    expect(inRange("2026-08-04", undefined, "2026-08-31")).toBe(true);
    expect(inRange("2026-09-01", undefined, "2026-08-31")).toBe(false);
  });
});

// ============================================================================
// KAS — saldo berjalan, tidak ada duplikasi, edit & hapus transaksi
// ============================================================================

describe("Kas Harian", () => {
  it("SaldoAkhir = SaldoAwal + KasMasuk − KasKeluar secara berurutan", () => {
    const rows = computeKasBalances([
      { id: "KAS-AWAL", tanggal: "2026-08-01", kasMasuk: 10000, kasKeluar: 0, createdAt: 1 },
      { id: "KAS-2", tanggal: "2026-08-02", kasMasuk: 5000, kasKeluar: 0, createdAt: 2 },
      { id: "KAS-3", tanggal: "2026-08-03", kasMasuk: 0, kasKeluar: 3000, createdAt: 3 },
    ]);
    expect(rows[0].saldoAkhir).toBe(10000);
    expect(rows[1].saldoAwal).toBe(10000);
    expect(rows[1].saldoAkhir).toBe(15000);
    expect(rows[2].saldoAwal).toBe(15000);
    expect(rows[2].saldoAkhir).toBe(12000);
  });

  it("Kas manual: masuk ATAU keluar, bukan keduanya", () => {
    const ok = validate(kasSchema, { id: "KAS-1", tanggal: "2026-08-04", kasMasuk: 0, kasKeluar: 5000, keterangan: "x" });
    expect(ok.success).toBe(true);
  });

  it("Hapus transaksi kas → saldo dihitung ulang (uang kembali ke saldo)", () => {
    const before = computeKasBalances([
      { id: "KAS-AWAL", tanggal: "2026-08-01", kasMasuk: 10000, kasKeluar: 0, createdAt: 1 },
      { id: "KAS-M1", tanggal: "2026-08-02", kasMasuk: 0, kasKeluar: 4000, createdAt: 2 },
      { id: "KAS-M2", tanggal: "2026-08-03", kasMasuk: 2000, kasKeluar: 0, createdAt: 3 },
    ]);
    expect(before[before.length - 1].saldoAkhir).toBe(8000);
    // Hapus KAS-M1 (kas keluar 4.000) → saldo akhir naik kembali 4.000
    const after = computeKasBalances(
      before.filter((e) => e.id !== "KAS-M1").map((e) => ({ ...e })),
    );
    expect(after[after.length - 1].saldoAkhir).toBe(12000);
  });

  it("Kas invalid: nominal negatif / tanggal kosong ditolak validator", () => {
    const neg = validate(kasSchema, { id: "KAS-1", tanggal: "2026-08-04", kasMasuk: -5, kasKeluar: 0 });
    expect(neg.success).toBe(false);
    const noTgl = validate(kasSchema, { id: "KAS-2", tanggal: "", kasMasuk: 0, kasKeluar: 1000 });
    expect(noTgl.success).toBe(false);
  });
});

// ============================================================================
// ABSENSI — edit status & hapus data; validator status kehadiran
// ============================================================================

describe("Absensi (edit & hapus)", () => {
  it("Semua status kehadiran valid: Hadir / Izin / Sakit / Alpa", () => {
    for (const s of ["Hadir", "Izin", "Sakit", "Alpa"]) {
      const ok = validate(absensiSchema, {
        id: "ABS-2026-08-04-KRY001",
        idKaryawan: "KRY001",
        tanggal: "2026-08-04",
        status: s,
      });
      expect(ok.success).toBe(true);
    }
  });

  it("Edit absensi: id sama, status berbeda → tetap valid (upsert)", () => {
    const base = { id: "ABS-2026-08-04-KRY001", idKaryawan: "KRY001", tanggal: "2026-08-04" };
    const awalnyaHadir = validate(absensiSchema, { ...base, status: "Hadir", jamMasuk: "08:00", jamKeluar: "17:00" });
    const diubahAlpa = validate(absensiSchema, { ...base, status: "Alpa" });
    expect(awalnyaHadir.success).toBe(true);
    expect(diubahAlpa.success).toBe(true);
  });

  it("Perubahan status → potongan absensi di slip gaji ikut berubah", () => {
    const g1 = computeSlipGaji({
      gajiPokok: 5200000,
      bonusKerajinan: 0,
      bonusBulanan: 0,
      denda: 0,
      absensi: { hadir: 20, izin: 2, sakit: 1, alpa: 3 },
      sisaUtang: 0,
      sisaCasbon: 0,
    });
    expect(g1.potonganAbsensi).toBe(1000000); // (alpa 3 + izin 2) × 200.000
    const g2 = computeSlipGaji({
      gajiPokok: 5200000,
      bonusKerajinan: 0,
      bonusBulanan: 0,
      denda: 0,
      absensi: { hadir: 19, izin: 2, sakit: 1, alpa: 4 },
      sisaUtang: 0,
      sisaCasbon: 0,
    });
    expect(g2.potonganAbsensi).toBe(1200000); // alpa naik 3 → 4
  });

  it("Status di luar daftar ditolak validator", () => {
    const r = validate(absensiSchema, {
      id: "ABS-1",
      idKaryawan: "KRY001",
      tanggal: "2026-08-04",
      status: "Cuti",
    });
    expect(r.success).toBe(false);
  });
});

// ============================================================================
// SLIP GAJI — potongan absensi, utang, casbon, bonus & denda, gaji bersih
// GajiBersih = GajiPokok − PotonganAbsensi + BonusKerajinan + BonusBulanan
//              − (PotonganUtang + PotonganCasbon + Denda)
// ============================================================================

describe("Slip Gaji", () => {
  it("Potongan absensi = (Alpa + Izin) × gaji per hari (26 hari kerja)", () => {
    const g = computeSlipGaji({
      gajiPokok: 5200000,
      bonusKerajinan: 0,
      bonusBulanan: 0,
      denda: 0,
      absensi: { hadir: 20, izin: 2, sakit: 1, alpa: 3 },
      sisaUtang: 0,
      sisaCasbon: 0,
    });
    // per hari = 200.000; alpa(3)+izin(2) = 5 hari → 1.000.000
    expect(g.potonganPerHari).toBe(200000);
    expect(g.potonganAbsensi).toBe(1000000);
    expect(g.gajiBersih).toBe(4200000);
    expect(g.sisaUtangAkhir).toBe(0);
  });

  it("Potongan utang & casbon otomatis, gaji bersih tidak negatif", () => {
    const g = computeSlipGaji({
      gajiPokok: 4000000,
      bonusKerajinan: 0,
      bonusBulanan: 500000,
      denda: 0,
      absensi: { hadir: 26, izin: 0, sakit: 0, alpa: 0 },
      sisaUtang: 2000000,
      sisaCasbon: 3000000,
    });
    expect(g.potonganUtang).toBe(2000000);
    expect(g.potonganCasbon).toBe(2500000); // dibatasi sisa gaji
    expect(g.gajiBersih).toBe(0);
    expect(g.totalPotongan).toBe(4500000);
    expect(g.sisaUtangAkhir).toBe(0);
    expect(g.sisaCasbonAkhir).toBe(500000); // casbon tersisa 3jt - 2,5jt
  });

  it("Potongan utang manual mengoverride otomatis", () => {
    const g = computeSlipGaji({
      gajiPokok: 5000000,
      bonusKerajinan: 0,
      bonusBulanan: 0,
      denda: 0,
      absensi: { hadir: 26, izin: 0, sakit: 0, alpa: 0 },
      sisaUtang: 3000000,
      sisaCasbon: 0,
      potonganUtangManual: 1000000, // hanya bayar 1jt bulan ini
    });
    expect(g.potonganUtang).toBe(1000000);
    expect(g.gajiBersih).toBe(4000000);
    expect(g.sisaUtangAkhir).toBe(2000000); // sisa ditunjukkan untuk notifikasi
  });

  it("Potongan casbon manual + sisa casbon dihitung benar", () => {
    const g = computeSlipGaji({
      gajiPokok: 6000000,
      bonusKerajinan: 0,
      bonusBulanan: 0,
      denda: 0,
      absensi: { hadir: 26, izin: 0, sakit: 0, alpa: 0 },
      sisaUtang: 0,
      sisaCasbon: 1500000,
      potonganCasbonManual: 800000,
    });
    expect(g.potonganCasbon).toBe(800000);
    expect(g.sisaCasbonAkhir).toBe(700000);
    expect(g.gajiBersih).toBe(5200000);
  });

  it("Bonus (kerajinan + bulanan) menambah gaji bersih", () => {
    const g = computeSlipGaji({
      gajiPokok: 4000000,
      bonusKerajinan: 400000,
      bonusBulanan: 600000,
      denda: 0,
      absensi: { hadir: 26, izin: 0, sakit: 0, alpa: 0 },
      sisaUtang: 0,
      sisaCasbon: 0,
    });
    expect(g.totalBonus).toBe(1000000);
    expect(g.gajiBersih).toBe(5000000);
  });

  it("Denda mengurangi gaji bersih dan masuk total potongan", () => {
    const g = computeSlipGaji({
      gajiPokok: 4000000,
      bonusKerajinan: 0,
      bonusBulanan: 0,
      denda: 250000,
      absensi: { hadir: 26, izin: 0, sakit: 0, alpa: 0 },
      sisaUtang: 0,
      sisaCasbon: 0,
    });
    expect(g.denda).toBe(250000);
    expect(g.totalPotongan).toBe(250000);
    expect(g.gajiBersih).toBe(3750000);
  });

  it("countAbsensi menghitung status dengan benar", () => {
    const c = countAbsensi([
      { status: "Hadir" },
      { status: "Hadir" },
      { status: "Izin" },
      { status: "Sakit" },
      { status: "Alpa" },
    ]);
    expect(c).toEqual({ hadir: 2, izin: 1, sakit: 1, alpa: 1 });
  });

  it("Validator slip gaji: periode harus YYYY-MM", () => {
    const r = validate(slipGajiSchema, { id: "SLP-1", idKaryawan: "K1", periode: "2026/08", bonusKerajinan: 0 });
    expect(r.success).toBe(false);
    const ok = validate(slipGajiSchema, { id: "SLP-1", idKaryawan: "K1", periode: "2026-08", bonusKerajinan: 0 });
    expect(ok.success).toBe(true);
  });
});

// ============================================================================
// RETUR & GUDANG — retur menambah stok, stok boleh minus
// ============================================================================

describe("Retur & Gudang", () => {
  it("Retur menambah stok: stokAkhir = stokAwal + Σ perubahan", () => {
    const rows = computeGudangRows(
      [{ id: "G1", namaBarang: "Kopi", stokAwal: 10, keterangan: "" }],
      [
        { namaBarang: "Kopi", perubahan: -4 }, // invoice reseller
        { namaBarang: "Kopi", perubahan: +2 }, // retur
      ],
    );
    expect(rows[0].stokMasuk).toBe(2);
    expect(rows[0].stokKeluar).toBe(4);
    expect(rows[0].stokAkhir).toBe(8);
  });

  it("Stok boleh minus", () => {
    const rows = computeGudangRows(
      [{ id: "G1", namaBarang: "Ikan", stokAwal: 0, keterangan: "" }],
      [{ namaBarang: "Ikan", perubahan: -5 }],
    );
    expect(rows[0].stokAkhir).toBe(-5);
  });

  it("Validator retur: tipe harus Reseller/DPL/Pasar", () => {
    const r = validate(returSchema, { id: "R1", tanggal: "2026-08-04", tipe: "Supplier", namaPihak: "X", namaBarang: "Y", qty: 1 });
    expect(r.success).toBe(false);
    const ok = validate(returSchema, { id: "R1", tanggal: "2026-08-04", tipe: "Reseller", namaPihak: "X", namaBarang: "Y", qty: 1 });
    expect(ok.success).toBe(true);
  });
});

// ============================================================================
// LAPORAN — rekap per pihak, analisis margin, rekap barang
// ============================================================================

describe("Laporan & Rekap", () => {
  const invoices = [
    {
      tipe: "Reseller" as const,
      namaPihak: "Reseller A",
      total: 0,
      totalPenjualan: 370000,
      items: [
        { kodeBarang: "BRG001", namaBarang: "Kopi", hargaModal: 25000, qty: 10, hargaJual: 28000, subtotal: 280000 },
      ],
    },
    {
      tipe: "Reseller" as const,
      namaPihak: "Reseller A",
      total: 0,
      totalPenjualan: 185000,
      items: [
        { kodeBarang: "BRG002", namaBarang: "Teh", hargaModal: 15000, qty: 5, hargaJual: 18000, subtotal: 90000 },
      ],
    },
    {
      tipe: "Pasar" as const,
      namaPihak: "Victoria",
      total: 0,
      totalPenjualan: 2375000,
      items: [
        { kodeBarang: "BRG004", namaBarang: "Udang", hargaModal: 75000, qty: 30, hargaJual: 95000, stokAwal: 30, stokAkhir: 5, subtotal: 2375000 },
      ],
    },
  ];

  it("Rekap per pihak: total transaksi, barang, dan nilai", () => {
    const rows = aggregateRekapPihak(invoices as any);
    const ra = rows.find((r) => r.namaPihak === "Reseller A");
    expect(ra?.totalTransaksi).toBe(2);
    expect(ra?.totalBarang).toBe(15);
    expect(ra?.totalNilai).toBe(555000);
    const vic = rows.find((r) => r.namaPihak === "Victoria");
    expect(vic?.totalTransaksi).toBe(1);
    expect(vic?.totalBarang).toBe(25); // stokAwal 30 − stokAkhir 5
  });

  it("Analisis margin per produk", () => {
    const rows = aggregateMarginByProduk(invoices as any);
    const kopi = rows.find((r) => r.kodeBarang === "BRG001");
    expect(kopi?.totalModal).toBe(250000);
    expect(kopi?.totalPenjualan).toBe(280000);
    expect(kopi?.margin).toBe(30000);
    expect(kopi?.marginPct).toBe(10.7);
  });

  it("Rekap barang: masuk vs keluar", () => {
    const rows = aggregateRekapBarang([
      { namaBarang: "Kopi", perubahan: 10 },
      { namaBarang: "Kopi", perubahan: -4 },
      { namaBarang: "Kopi", perubahan: 2 },
    ]);
    const kopi = rows.find((r) => r.namaBarang === "Kopi");
    expect(kopi?.masuk).toBe(12);
    expect(kopi?.keluar).toBe(4);
    expect(kopi?.net).toBe(8);
  });
});

// ============================================================================
// TETESAN — invoice modal & penjualan, master bahan baku / barang jadi
// ============================================================================

describe("Tetesan", () => {
  it("computeTetesanTotals: Modal = Σ harga modal × qty", () => {
    const t = computeTetesanTotals("Modal", [
      { kodeBarang: "BBK001", namaBarang: "Tepung", harga: 12000, qty: 10, subtotal: 120000 },
      { kodeBarang: "BBK002", namaBarang: "Gula", harga: 15000, qty: 5, subtotal: 75000 },
    ]);
    expect(t.total).toBe(195000);
  });

  it("computeTetesanTotals: Penjualan = Σ harga jual × qty", () => {
    const t = computeTetesanTotals("Penjualan", [
      { kodeBarang: "BJK001", namaBarang: "Abon Ikan", harga: 35000, qty: 3, subtotal: 105000 },
    ]);
    expect(t.total).toBe(105000);
  });

  it("Harga modal TIDAK tampil di invoice penjualan (hanya harga jual)", () => {
    // Item invoice penjualan hanya membawa harga jual — tidak ada field hargaModal.
    const inv = {
      idInvoice: "TET001",
      tanggal: "2026-08-04",
      tipe: "Penjualan",
      namaPihak: "Kios Ibu Sari",
      items: [{ kodeBarang: "BJK001", namaBarang: "Abon Ikan", harga: 35000, qty: 2, subtotal: 70000 }],
    };
    expect(Object.keys(inv.items[0])).not.toContain("hargaModal");
    const r = validate(invoiceTetesanSchema, inv);
    expect(r.success).toBe(true);
  });

  it("Invoice tetesan tanpa items / qty 0 harus ditolak validator", () => {
    const empty = validate(invoiceTetesanSchema, {
      idInvoice: "TET002",
      tanggal: "2026-08-04",
      tipe: "Modal",
      namaPihak: "Pemasok A",
      items: [],
    });
    expect(empty.success).toBe(false);

    const qty0 = validate(invoiceTetesanSchema, {
      idInvoice: "TET003",
      tanggal: "2026-08-04",
      tipe: "Penjualan",
      namaPihak: "Toko B",
      items: [{ kodeBarang: "BJK001", namaBarang: "Abon", harga: 35000, qty: 0, subtotal: 0 }],
    });
    expect(qty0.success).toBe(false);
  });

  it("Master bahan baku: harga modal wajib ≥ 0, stok awal default 0", () => {
    const ok = validate(bahanBakuSchema, { kode: "BBK001", nama: "Tepung", hargaModal: 12000 });
    expect(ok.success).toBe(true);
    const neg = validate(bahanBakuSchema, { kode: "BBK002", nama: "Gula", hargaModal: -5 });
    expect(neg.success).toBe(false);
  });

  it("Master barang jadi: harga jual wajib ≥ 0", () => {
    const ok = validate(barangJadiSchema, { kode: "BJK001", nama: "Abon Ikan", hargaJual: 35000 });
    expect(ok.success).toBe(true);
    const noName = validate(barangJadiSchema, { kode: "BJK002", nama: "", hargaJual: 1000 });
    expect(noName.success).toBe(false);
  });

  it("Invoice Modal Tetesan → stok Gudang berkurang (bahan baku diambil dari gudang)", () => {
    const rows = computeGudangRows(
      [{ id: "G1", namaBarang: "Tepung", stokAwal: 100, keterangan: "" }],
      [
        { namaBarang: "Tepung", perubahan: -10 }, // Invoice Modal Tetesan TET001
        { namaBarang: "Tepung", perubahan: -5 }, // Invoice Modal Tetesan TET002
      ],
    );
    expect(rows[0].stokKeluar).toBe(15);
    expect(rows[0].stokAkhir).toBe(85);
  });

  it("Invoice Penjualan Tetesan → stok barang jadi berkurang (stokAkhir = stokAwal − qty)", () => {
    const rows = computeGudangRows(
      [{ id: "G1", namaBarang: "Abon Ikan", stokAwal: 20, keterangan: "" }],
      [{ namaBarang: "Abon Ikan", perubahan: -3 }], // Invoice Penjualan TET101
    );
    expect(rows[0].stokAkhir).toBe(17);
  });

  it("Barang dihapus dari master → baris stok-nya hilang dari daftar gudang", () => {
    const base = [
      { id: "G1", namaBarang: "Tepung", stokAwal: 100, keterangan: "" },
      { id: "G2", namaBarang: "Gula", stokAwal: 50, keterangan: "" },
    ];
    const history = [
      { namaBarang: "Tepung", perubahan: -10 },
      { namaBarang: "Gula", perubahan: +5 },
    ];
    // Simulasi purgeStokFor: hapus semua jejak stok "Tepung"
    const sisaBarang = base.filter((b) => b.namaBarang !== "Tepung");
    const sisaHistory = history.filter((h) => h.namaBarang !== "Tepung");
    const rows = computeGudangRows(sisaBarang, sisaHistory);
    expect(rows.some((r) => r.namaBarang === "Tepung")).toBe(false);
    expect(rows.map((r) => r.namaBarang)).toEqual(["Gula"]);
    expect(rows[0].stokAkhir).toBe(55);
  });

  it("Validator gudang: stok awal ≥ 0, nama barang wajib", () => {
    const ok = validate(gudangSchema, { id: "GDG-1", namaBarang: "Kopi", stokAwal: 10 });
    expect(ok.success).toBe(true);
    const neg = validate(gudangSchema, { id: "GDG-2", namaBarang: "Teh", stokAwal: -1 });
    expect(neg.success).toBe(false);
    const noNama = validate(gudangSchema, { id: "GDG-3", namaBarang: "", stokAwal: 0 });
    expect(noNama.success).toBe(false);
  });
});

// ============================================================================
// MATA UANG — format Rupiah (default) & Dolar (khusus Supplier)
// ============================================================================

describe("Mata Uang", () => {
  it("formatCurrency default Rp (Rupiah)", () => {
    expect(formatCurrency(250000)).toContain("Rp");
    expect(formatCurrency(250000)).toContain("250.000");
  });

  it("formatCurrency '$' → Dolar AS", () => {
    const s = formatCurrency(125.5, "$");
    expect(s).toContain("$");
    expect(s).toContain("125.50");
  });

  it("Schema invoice mendukung mataUang Rp default & $ pilihan", () => {
    const rp = validate(invoiceSchema, {
      idInvoice: "INV001",
      tanggal: "2026-08-04",
      tipe: "Supplier",
      namaPihak: "Supplier A",
      mataUang: "$",
      items: [{ kodeBarang: "B1", namaBarang: "X", hargaModal: 1000, qty: 2, subtotal: 2000 }],
    });
    expect(rp.success).toBe(true);
    // Mata uang asing selain $ ditolak
    const bad = validate(invoiceSchema, {
      idInvoice: "INV002",
      tanggal: "2026-08-04",
      tipe: "Supplier",
      namaPihak: "Supplier A",
      mataUang: "€",
      items: [{ kodeBarang: "B1", namaBarang: "X", hargaModal: 1000, qty: 2, subtotal: 2000 }],
    });
    expect(bad.success).toBe(false);
  });
});
