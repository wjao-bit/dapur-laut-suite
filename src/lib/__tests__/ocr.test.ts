import { describe, it, expect } from "vitest";
import { parseOcrText } from "../ocr";

// ============================================================================
// OCR — parseOcrText: teks hasil scan invoice → draft item
// ============================================================================

describe("OCR — parseOcrText", () => {
  it("baris sederhana: '2 x Kopi Bubuk 25000' → qty 2, harga 25000", () => {
    const r = parseOcrText("2 x Kopi Bubuk 25000");
    expect(r).toEqual([{ namaBarang: "Kopi Bubuk", qty: 2, harga: 25000 }]);
  });

  it("baris tanpa pengali: 'Teh Hijau 15000' → qty 1, harga 15000", () => {
    const r = parseOcrText("Teh Hijau 15000");
    expect(r).toEqual([{ namaBarang: "Teh Hijau", qty: 1, harga: 15000 }]);
  });

  it("angka ribuan & desimal Indonesia: '2,5 kg Udang 30.000' → qty 2.5, harga 30000, satuan dibersihkan", () => {
    const r = parseOcrText("2,5 kg Udang 30.000");
    expect(r).toEqual([{ namaBarang: "Udang", qty: 2.5, harga: 30000 }]);
  });

  it("pemisah '@' dibersihkan: '3 @ Abon Ikan 20000'", () => {
    const r = parseOcrText("3 @ Abon Ikan 20000");
    expect(r).toEqual([{ namaBarang: "Abon Ikan", qty: 3, harga: 20000 }]);
  });

  it("3 angka (qty, harga, subtotal): harga pakai angka kedua", () => {
    const r = parseOcrText("2 Kopi Bubuk 25000 50000");
    expect(r).toEqual([{ namaBarang: "Kopi Bubuk", qty: 2, harga: 25000 }]);
  });

  it("header dokumen disaring (INVOICE, FAKTUR, Tanggal, No, Kepada, Total)", () => {
    const text = [
      "INVOICE / FAKTUR",
      "No. : INV-001",
      "Tanggal: 04-08-2026",
      "Kepada Yth: Toko Makmur",
      "2 x Kopi Bubuk 25000",
      "Total: Rp 50.000",
    ].join("\n");
    const r = parseOcrText(text);
    expect(r).toEqual([{ namaBarang: "Kopi Bubuk", qty: 2, harga: 25000 }]);
  });

  it("baris total/subtotal/terbilang disaring walau ada angka", () => {
    const r = parseOcrText("Terbilang: Lima Puluh Ribu Rupiah\nSubtotal 50000\nDibayar 50000\n1 Teh 15000");
    expect(r).toEqual([{ namaBarang: "Teh", qty: 1, harga: 15000 }]);
  });

  it("baris tanpa angka disaring", () => {
    const r = parseOcrText("Catatan: barang dikirim besok\n2 x Kopi 25000");
    expect(r).toEqual([{ namaBarang: "Kopi", qty: 2, harga: 25000 }]);
  });

  it("baris hanya kata tak bermakna disaring (dll, dan lain-lain)", () => {
    const r = parseOcrText("dll\n2 x Kopi 25000\ndan lain-lain 1000");
    expect(r).toEqual([{ namaBarang: "Kopi", qty: 2, harga: 25000 }]);
  });

  it("nama sama digabung: qty dijumlah, harga pakai terakhir", () => {
    const r = parseOcrText("2 x Kopi 25000\n3 Kopi 26000");
    expect(r).toEqual([{ namaBarang: "Kopi", qty: 5, harga: 26000 }]);
  });

  it("gabungan case-insensitive: 'KOPI' + 'kopi' jadi satu baris", () => {
    const r = parseOcrText("2 KOPI 25000\n1 kopi 25000");
    expect(r.length).toBe(1);
    expect(r[0].qty).toBe(3);
  });

  it("teks kosong / null → []", () => {
    expect(parseOcrText("")).toEqual([]);
    expect(parseOcrText(null as any)).toEqual([]);
    expect(parseOcrText(undefined as any)).toEqual([]);
  });

  it("baris angka negatif diabaikan (bukan barang)", () => {
    const r = parseOcrText("-3 5\n1 Ikan 10000");
    expect(r).toEqual([{ namaBarang: "Ikan", qty: 1, harga: 10000 }]);
  });

  it("contoh invoice multi-barang utuh → 2 item benar", () => {
    const text = [
      "INVOICE",
      "No. : INV001",
      "Tanggal: 2026-08-04",
      "Kepada: Reseller A",
      "10 Kopi Bubuk 25000 250000",
      "5 Teh Hijau 15000 75000",
      "Total 325000",
      "Terbilang: Tiga Ratus Dua Puluh Lima Ribu",
    ].join("\n");
    const r = parseOcrText(text);
    expect(r).toEqual([
      { namaBarang: "Kopi Bubuk", qty: 10, harga: 25000 },
      { namaBarang: "Teh Hijau", qty: 5, harga: 15000 },
    ]);
  });
});
