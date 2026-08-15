"use node";

// ============================================================================
// AI OCR — baca invoice/nota dari foto dengan model vision OpenAI (gpt-4o-mini).
//
// Dipanggil dari dialog "Scan Invoice". Hasilnya SELALU berupa draft yang
// diverifikasi user sebelum disimpan (tidak pernah langsung masuk database).
//
// Kunci API dibaca dari environment variable OPENAI_API_KEY (atur lewat menu
// Keys / API keys proyek). Kalau kunci belum ada, action mengembalikan
// { ok: false, error: ... } dan dialog tetap memakai Tesseract sebagai
// cadangan (tanpa biaya & tanpa kunci).
//
// `tipe` (opsional) dipilih user SEBELUM scan supaya perintah pembacaan
// diarahkan: Supplier → harga beli/modal, Reseller/DPL → harga jual,
// Pasar → qty = stok awal & baca stok akhir.
// `instruksi` (opsional) = perintah tambahan bebas dari user, ditambahkan
// ke perintah AI (mis. "hanya baca 5 baris pertama", "abaikan yang tanpa harga").
// ============================================================================

import { action } from "./_generated/server";
import { v } from "convex/values";

export interface AiOcrItem {
  namaBarang: string;
  qty: number;
  harga: number;
  /** Khusus Pasar: stok yang kembali (bila terbaca). */
  stokAkhir?: number;
}

export interface AiOcrResult {
  ok: boolean;
  error?: string;
  data?: {
    tipe?: string;
    namaPihak?: string;
    tanggal?: string;
    items: AiOcrItem[];
  };
}

/** Ubah teks angka (bisa "12.500", "12,5", "Rp 25.000") menjadi angka. */
function toNum(s: unknown): number {
  if (typeof s === "number") return Number.isFinite(s) ? s : 0;
  if (typeof s !== "string") return 0;
  let t = s.replace(/[^0-9.,-]/g, "");
  const neg = t.startsWith("-");
  t = t.replace(/-/g, "");
  // "1.500" (ribuan) vs "1.5" (desimal): jika ada titik & koma, titik = ribuan
  if (t.includes(",") && t.includes(".")) t = t.replace(/\./g, "").replace(",", ".");
  else if (t.includes(",")) t = t.replace(",", ".");
  else if (t.includes(".")) {
    const parts = t.split(".");
    // 3 digit di belakang → ribuan (12.500); selain itu → desimal (12.5)
    if (parts.length === 2 && parts[1].length === 3) t = parts.join("");
  }
  const n = parseFloat(t);
  if (!Number.isFinite(n)) return 0;
  return neg ? -n : n;
}

/** Ekstrak JSON pertama dari teks (menangani model yang membungkus JSON). */
function extractJson(raw: string): unknown {
  const text = String(raw ?? "").trim();
  try {
    return JSON.parse(text);
  } catch {
    /* lanjut cari blok JSON */
  }
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start >= 0 && end > start) {
    try {
      return JSON.parse(text.slice(start, end + 1));
    } catch {
      /* bukan JSON valid */
    }
  }
  return null;
}

const TIPE_VALID = ["Reseller", "Supplier", "DPL", "Pasar"] as const;

/** Perintah sistem — disusun agar AI membaca SEMUA baris dengan benar. */
const SYSTEM_PROMPT = `Kamu adalah pembaca nota/invoice untuk PT Dapur Laut (perusahaan ikan & bahan laut di Indonesia). Tugasmu: melihat FOTO nota dan menyalin SEMUA baris barang ke JSON.

Keluarkan HANYA satu objek JSON valid, tanpa teks lain, tanpa markdown, dengan bentuk TEPAT:
{"namaPihak": "nama toko/pemasok bila terbaca, atau ''", "tanggal": "YYYY-MM-DD bila terbaca, atau ''", "items": [{"namaBarang": "...", "qty": 2, "harga": 25000}]}

ATURAN WAJIB:
1. Satu baris barang = satu item. Baca SEMUA baris — jangan ada yang terlewat, meskipun barisnya banyak.
2. "harga" adalah HARGA SATUAN (harga per unit/ekor/kg), BUKAN subtotal. Kalau yang terlihat hanya subtotal dan qty, hitung harga satuan = subtotal ÷ qty (bulatkan wajar, jangan sampai 0).
3. qty boleh desimal (mis. "2,5 kg" → qty 2.5). Cara baca angka Indonesia: "1.500" = seribu lima ratus, "1,5" = satu koma lima, "Rp 25.000" = 25000.
4. ABaIKAN: judul dokumen, header tabel (No / Kode / Nama / Qty / Harga / Subtotal / Jumlah), baris TOTAL / SUBTOTAL / TERBILANG / BAYAR / KEMBALI, potongan diskon, ongkir, tanda tangan, stempel, alamat, nomor telepon, catatan kaki.
5. JANGAN mengarang barang yang tidak jelas terbaca. Kalau nama barang kabur, lewati baris itu.
6. Tulis angka sebagai angka murni (tanpa "Rp", tanpa titik ribuan, tanpa satuan).
7. Nama barang ditulis persis seperti di nota (pertahankan singkatan yang ada, mis. "Cumi", "Ikan Kembung", "Teri 1/4").
8. Bila TIDAK ada satu pun barang terbaca dengan jelas, kembalikan {"items": []} — JANGAN menebak.`;

/** Perintah user — diarahkan sesuai tipe transaksi & instruksi khusus dari user. */
function buildUserPrompt(tipe?: string, instruksi?: string): string {
  let arah = "";
  if (tipe === "Supplier") {
    arah =
      'Tipe transaksi: SUPPLIER (pembelian dari pemasok). Artinya "harga" = HARGA BELI / HARGA MODAL per satuan yang tertulis di nota.';
  } else if (tipe === "Pasar") {
    arah =
      'Tipe transaksi: PASAR (Victoria/Tunas — stok dibawa ke pasar lalu sebagian kembali). "qty" = STOK AWAL (jumlah barang yang dibawa). "harga" = HARGA JUAL per satuan. Kalau ada kolom stok akhir / sisa / kembali, tulis angkanya pada properti "stokAkhir" (opsional).';
  } else if (tipe === "DPL") {
    arah =
      'Tipe transaksi: DPL (penjualan grosir ke pasar). Artinya "harga" = HARGA JUAL per satuan yang tertulis di nota.';
  } else {
    arah =
      'Tipe transaksi: RESELLER (penjualan ke toko/reseller). Artinya "harga" = HARGA JUAL per satuan yang tertulis di nota.';
  }
  let teks =
    arah +
    "\n\nBaca SEMUA baris barang pada foto ini sekarang, lalu keluarkan JSON sesuai aturan di atas. Prioritaskan kebenaran nama barang, qty, dan HARGA SATUAN.";
  if (instruksi && instruksi.trim()) {
    teks += `\n\nINSTRUKSI TAMBAHAN DARI PENGGUNA (ikuti ini lebih dulu — jika bertentangan dengan aturan umum, ikuti instruksi ini): ${instruksi.trim()}`;
  }
  return teks;
}

export const scanInvoiceWithAi = action({
  args: {
    imageDataUrl: v.string(),
    tipe: v.optional(v.string()),
    instruksi: v.optional(v.string()),
  },
  handler: async (_ctx, { imageDataUrl, tipe, instruksi }): Promise<AiOcrResult> => {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return {
        ok: false,
        error:
          "OPENAI_API_KEY belum diatur. Scan AI memakai model vision OpenAI (gpt-4o-mini) — tambahkan kunci di menu Keys / API keys proyek. Tanpa kunci, tombol 'OCR Biasa' tetap bisa dipakai.",
      };
    }
    if (!imageDataUrl || !imageDataUrl.startsWith("data:image")) {
      return { ok: false, error: "Gambar tidak valid — coba pilih foto lagi." };
    }
    const tipeValid = TIPE_VALID.includes(tipe as any) ? tipe : undefined;

    try {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          max_tokens: 1800,
          temperature: 0,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            {
              role: "user",
              content: [
                { type: "text", text: buildUserPrompt(tipeValid, instruksi) },
                { type: "image_url", image_url: { url: imageDataUrl } },
              ],
            },
          ],
        }),
      });

      if (!res.ok) {
        const body = await res.text().catch(() => "");
        let msg = `OpenAI gagal (${res.status})`;
        try {
          const j = JSON.parse(body);
          msg = j?.error?.message ?? msg;
        } catch {
          /* body bukan JSON */
        }
        return { ok: false, error: msg };
      }

      const json = await res.json();
      const content: string = json?.choices?.[0]?.message?.content ?? "";
      const parsed = extractJson(content);

      if (!parsed || typeof parsed !== "object") {
        return { ok: false, error: "AI tidak mengembalikan JSON yang valid — coba lagi atau gunakan OCR biasa." };
      }

      const p = parsed as Record<string, unknown>;
      const rawItems = Array.isArray(p.items) ? (p.items as unknown[]) : [];
      const items: AiOcrItem[] = rawItems
        .map((raw) => {
          const it = (raw ?? {}) as Record<string, unknown>;
          const stokAkhir = toNum(it.stokAkhir);
          return {
            namaBarang: String(it.namaBarang ?? it.nama ?? "").trim(),
            qty: Math.max(0, toNum(it.qty)),
            harga: Math.max(0, toNum(it.harga ?? it.hargaSatuan ?? it.price)),
            ...(stokAkhir > 0 ? { stokAkhir } : {}),
          };
        })
        .filter((it) => it.namaBarang.length > 0)
        .slice(0, 60);

      const tipeRaw = String(p.tipe ?? "").trim();
      const tipeAi = TIPE_VALID.includes(tipeRaw as any) ? tipeRaw : undefined;

      let tanggal = String(p.tanggal ?? "").trim();
      if (tanggal && !/^\d{4}-\d{2}-\d{2}$/.test(tanggal)) {
        // Coba konversi DD/MM/YYYY atau DD-MM-YYYY
        const m = tanggal.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})$/);
        if (m) tanggal = `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
        else tanggal = "";
      }
      if (tanggal && Number.isNaN(new Date(tanggal).getTime())) tanggal = "";

      return {
        ok: true,
        data: {
          // Tipe dari user (dipilih sebelum scan) menang; AI hanya memberi saran.
          tipe: tipeValid ?? tipeAi,
          namaPihak: String(p.namaPihak ?? "").trim() || undefined,
          tanggal: tanggal || undefined,
          items,
        },
      };
    } catch (e: any) {
      return {
        ok: false,
        error: `Gagal memanggil AI: ${e?.message ?? "koneksi"}. Periksa koneksi internet, atau pakai OCR biasa.`,
      };
    }
  },
});
