import { describe, it, expect } from "vitest";
import { computeGudangRows } from "../business";

// ============================================================================
// REGRESI GUDANG — daftar gudang tidak boleh kosong ketika riwayat stok ada
// tetapi barisnya belum ada di tabel `gudang` (mis. perubahan berasal dari
// invoice/retur yang dibuat lebih dulu).
// ============================================================================
describe("Gudang — barang dari riwayat stok tetap tampil", () => {
  it("barang yang hanya ada di riwayat stok muncul dengan stok awal 0", () => {
    const rows = computeGudangRows(
      [],
      [
        { namaBarang: "Tongkol", perubahan: 10 }, // pembelian Supplier
        { namaBarang: "Tongkol", perubahan: -4 }, // penjualan Reseller
      ],
    );
    expect(rows.length).toBe(1);
    expect(rows[0].namaBarang).toBe("Tongkol");
    expect(rows[0].stokAwal).toBe(0);
    expect(rows[0].stokMasuk).toBe(10);
    expect(rows[0].stokKeluar).toBe(4);
    expect(rows[0].stokAkhir).toBe(6);
  });

  it("menggabungkan baris tabel gudang dengan barang dari riwayat saja", () => {
    const rows = computeGudangRows(
      [{ id: "G1", namaBarang: "Kopi", stokAwal: 20, keterangan: "" }],
      [
        { namaBarang: "Kopi", perubahan: -5 },
        { namaBarang: "Cumi", perubahan: -3 },
      ],
    );
    const names = rows.map((r) => r.namaBarang).sort();
    expect(names).toEqual(["Cumi", "Kopi"]);
    const kopi = rows.find((r) => r.namaBarang === "Kopi")!;
    expect(kopi.stokAwal).toBe(20);
    expect(kopi.stokAkhir).toBe(15);
    const cumi = rows.find((r) => r.namaBarang === "Cumi")!;
    expect(cumi.stokAwal).toBe(0);
    expect(cumi.stokAkhir).toBe(-3);
  });

  it("barang yang dihapus dari tabel gudang DAN riwayatnya hilang dari daftar", () => {
    const rows = computeGudangRows(
      [{ id: "G2", namaBarang: "Gula", stokAwal: 50, keterangan: "" }],
      [{ namaBarang: "Gula", perubahan: 5 }],
    );
    expect(rows.map((r) => r.namaBarang)).toEqual(["Gula"]);
    expect(rows[0].stokAkhir).toBe(55);
  });
});
