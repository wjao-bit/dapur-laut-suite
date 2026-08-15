"use node";

// ============================================================================
// AI OCR — baca invoice dari foto dengan model vision OpenAI (gpt-4o-mini).
//
// Dipanggil dari dialog "Scan Invoice" sebagai alternatif yang jauh lebih
// akurat daripada Tesseract. Hasilnya SELALU berupa draft yang diverifikasi
// user sebelum disimpan (tidak pernah langsung masuk database).
//
// Kunci API dibaca dari environment variable OPENAI_API_KEY (atur lewat
// menu Keys / API keys proyek, atau dashboard Convex → Environment Variables).
// Kalau kunci belum ada, action mengembalikan { ok: false, error: ... } dan
// dialog tetap memakai Tesseract sebagai cadangan.
// ============================================================================

import { action } from "./_generated/server";
import { v } from "convex/values";

export interface AiOcrItem {
  namaBarang: string;
  qty: number;
  harga: number;
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

export const scanInvoiceWithAi = action({
  args: {
    imageDataUrl: v.string(),
  },
  handler: async (_ctx, { imageDataUrl }): Promise<AiOcrResult> => {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return {
        ok: false,
        error:
          "OPENAI_API_KEY belum diatur. Tambahkan kunci OpenAI (tombol Scan AI memakai model vision gpt-4o-mini) di menu Keys/API keys proyek — atau gunakan tombol OCR biasa (Tesseract).",
      };
    }
    if (!imageDataUrl || !imageDataUrl.startsWith("data:image")) {
      return { ok: false, error: "Gambar tidak valid — coba pilih foto lagi." };
    }

    const system =
      "Kamu adalah pembaca invoice (OCR) untuk perusahaan PT Dapur Laut (perdagangan ikan & bahan laut). " +
      "Baca foto invoice dan keluarkan HANYA JSON valid, tanpa teks lain, dengan bentuk: " +
      '{"tipe": "Reseller|Supplier|DPL|Pasar", "namaPihak": "nama pelanggan/pemasok", "tanggal": "YYYY-MM-DD", "items": [{"namaBarang": "...", "qty": jumlah, "harga": harga satuan}]}. ' +
      "Aturan: baca SEMUA baris barang (nama, jumlah/qty, harga satuan). Bila kolom tidak jelas, tulis nilai 0 atau string kosong. " +
      "Jangan menebak total; cukup daftar items. Untuk pasar (awal-akhir), qty = stok awal bila terbaca, dan tulis stokAkhir pada properti 'stokAkhir' bila ada (opsional). " +
      "Tanggal pakai format YYYY-MM-DD; bila tidak terbaca, kosongkan.";

    const user =
      "Baca invoice pada foto ini dan keluarkan JSON sesuai instruksi. " +
      "Utamakan nama barang, qty, dan harga satuan yang benar-benar terbaca.";

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
            { role: "system", content: system },
            {
              role: "user",
              content: [
                { type: "text", text: user },
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
          return {
            namaBarang: String(it.namaBarang ?? it.nama ?? "").trim(),
            qty: Math.max(0, toNum(it.qty)),
            harga: Math.max(0, toNum(it.harga ?? it.hargaSatuan ?? it.price)),
          };
        })
        .filter((it) => it.namaBarang.length > 0)
        .slice(0, 60);

      const tipeRaw = String(p.tipe ?? "").trim();
      const tipe = ["Reseller", "Supplier", "DPL", "Pasar"].includes(tipeRaw) ? tipeRaw : undefined;

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
          tipe,
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
