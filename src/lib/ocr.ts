// ============================================================================
// OCR — pengurai teks hasil scan invoice menjadi draft item.
//
// Modul murni (tanpa React/Convex) agar mudah diuji unit. Dipakai oleh
// OcrInvoiceDialog: hasil OCR hanyalah DRAFT — user wajib memverifikasi,
// mengedit, atau menghapus baris sebelum disimpan ke database.
// ============================================================================
import { parseNum } from "./format";

export interface OcrItem {
  namaBarang: string;
  qty: number;
  harga: number;
}

const HEADER_RE =
  /^(invoice|faktur|nota|bon|kwitansi|tanggal|tgl|no\.?|nomor|kepada|yth|hal|terbilang|total|jumlah|bayar|dibayar|kembali|uang|muka|dp|ppn|pph|disc|diskon|kasir|alamat|telp|fax|npwp|halaman|page|qty|harga|subtotal|satuan|keterangan|pcs|kg|gram|liter|lembar|dus|sak|pak|botol|cup|plastik|karton|jual|beli|barang|item|produk|metode|pembayaran|tunai|transfer|piutang|sisa|grand|potongan|ongkir|biaya|dapur|laut|pt|cv|ud|toko|kios|warung)/i;

// Satuan/unit yang boleh muncul di awal nama barang hasil OCR (dibersihkan).
const UNIT_WORDS =
  /^(pcs|kg|gram|gr|liter|ltr|lembar|lbr|dus|sak|pak|paket|botol|cup|plastik|karton|zak|pack|bungkus|ikat|ekor|strip|tube|roll)\s+/i;

/**
 * Heuristik pengurai teks hasil OCR menjadi baris item invoice.
 * Baris berisi nama barang + angka (qty & harga). Header/total dokumen
 * disaring agar tidak masuk sebagai barang. Aturan per baris:
 *   - tanpa angka          → dilewati
 *   - 1 angka              → qty = 1, harga = angka tsb
 *   - ≥2 angka             → qty = angka pertama, harga = angka kedua
 *     (angka ketiga dst, mis. subtotal, diabaikan)
 *   - nama sama (ci)       → digabung (qty dijumlah, harga pakai terakhir)
 * Hasilnya HANYA draft — user wajib memverifikasi sebelum disimpan.
 */
export function parseOcrText(text: string): OcrItem[] {
  const lines = String(text ?? "")
    .split(/\n/)
    .map((l) => l.replace(/\s+/g, " ").trim())
    .filter(Boolean);
  const out: OcrItem[] = [];
  for (const line of lines) {
    const lower = line.toLowerCase();
    if (HEADER_RE.test(lower)) continue;
    if (/\b(terbilang|subtotal|diskon|dibayar|kembalian|total|jumlah)\b/i.test(lower)) continue;

    // Ekstrak semua angka (dukung "25.000", "1.500,75", "0,7", "25000")
    const numRe = /\d{1,3}(?:[.,]\d{3})+(?:[.,]\d+)?|\d+(?:[.,]\d+)?/g;
    const rawNums: string[] = line.match(numRe) ?? [];
    const parsed = rawNums.map((n) => parseNum(n)).filter((n) => n > 0);
    if (parsed.length === 0) continue;

    // Sisa teks setelah angka dihapus = nama barang
    let nama = line.replace(numRe, " ").replace(/\s+/g, " ").trim();
    // Buang pemisah qty ("2 x Kopi" / "2 @ Kopi" → "Kopi")
    nama = nama.replace(/[x×@]/gi, " ").replace(/\s+/g, " ").trim();
    nama = nama.replace(/^\d+\s+/, "").trim();
    nama = nama.replace(/^(barang|item|nama|produk)\s+/i, "").trim();
    // Buang satuan di awal nama ("2,5 kg Udang" → "Udang")
    nama = nama.replace(UNIT_WORDS, "").trim();
    // Baris yang hanya berisi kata tak bermakna
    if (!nama || nama.length < 2) continue;
    if (/^(dll|dan lain|rp|harga|total|jumlah|bayar)/i.test(nama)) continue;

    let qty = 1;
    let harga = parsed[parsed.length - 1];
    if (parsed.length >= 2) {
      qty = parsed[0];
      harga = parsed[1];
    }
    out.push({ namaBarang: nama, qty: qty > 0 ? qty : 1, harga: harga > 0 ? harga : 0 });
  }
  // Gabungkan nama yang sama (jumlah qty, harga pakai yang terakhir)
  const map = new Map<string, OcrItem>();
  for (const it of out) {
    const key = it.namaBarang.toLowerCase();
    const prev = map.get(key);
    if (prev) {
      prev.qty += it.qty;
      prev.harga = it.harga;
    } else {
      map.set(key, { ...it });
    }
  }
  return [...map.values()];
}
