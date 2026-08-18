"use node";

import { action } from "./_generated/server";

/**
 * Diagnostik kunci AI — dipanggil dari dialog Scan Invoice (tombol "Tes Kunci AI").
 *
 * Menjalankan di backend Convex (yang punya akses internet), jadi bisa
 * memverifikasi token Cloudflare secara NYATA, bukan hanya mengecek apakah
 * variabel terisi. Alur scan (aiOcr.ts) memakai urutan: Gemini (gratis) →
 * Cloudflare Workers AI (gratis) → OpenAI (berbayar).
 *
 * PENTING: action ini TIDAK PERNAH mengembalikan nilai kunci — hanya status
 * boolean + pesan ramah, supaya token rahasia tidak bocor ke frontend.
 */
export const checkAiKeys = action({
  args: {},
  handler: async (): Promise<{
    ok: boolean;
    keys: { gemini: boolean; cloudflare: boolean; openai: boolean };
    messages: string[];
  }> => {
    const geminiKey = process.env.GEMINI_API_KEY;
    const cfToken = process.env.CF_API_TOKEN;
    const cfAccount = process.env.CF_ACCOUNT_ID;
    const openAiKey = process.env.OPENAI_API_KEY;

    const keys = {
      gemini: !!geminiKey,
      cloudflare: !!(cfToken && cfAccount),
      openai: !!openAiKey,
    };
    const messages: string[] = [];

    if (geminiKey) messages.push("✅ GEMINI_API_KEY terpasang di proyek.");
    else messages.push("ℹ️ GEMINI_API_KEY belum terpasang — Cloudflare bisa jadi jalur utama.");

    if (openAiKey) messages.push("✅ OPENAI_API_KEY terpasang (cadangan berbayar).");
    else messages.push("ℹ️ OPENAI_API_KEY belum terpasang (tidak wajib).");

    if (cfToken && cfAccount) {
      messages.push("ℹ️ CF_API_TOKEN & CF_ACCOUNT_ID terpasang — memverifikasi ke Cloudflare…");
      // 1) Apakah token valid?
      try {
        const r = await fetch("https://api.cloudflare.com/client/v4/user/tokens/verify", {
          headers: { Authorization: `Bearer ${cfToken}` },
        });
        const j: any = await r.json();
        if (r.ok && j?.success) {
          messages.push(`✅ Token Cloudflare VALID (status: ${j?.result?.status ?? "active"}).`);
        } else {
          messages.push(
            `❌ Token Cloudflare TIDAK VALID — ${j?.errors?.[0]?.message ?? `HTTP ${r.status}`}. Buat token baru di dash.cloudflare.com → My Profile → API Tokens.`,
          );
        }
      } catch (e: any) {
        messages.push(`❌ Gagal menghubungi Cloudflare: ${e?.message ?? "koneksi"}.`);
      }
      // 2) Apakah token punya izin Workers AI untuk account ini?
      try {
        const r2 = await fetch(
          `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(cfAccount)}/ai/models/search?per_page=1`,
          { headers: { Authorization: `Bearer ${cfToken}` } },
        );
        const j2: any = await r2.json();
        if (r2.ok && j2?.success) {
          messages.push(`✅ Token bisa akses Workers AI (account ${String(cfAccount).slice(0, 8)}…).`);
        } else {
          messages.push(
            `❌ Token TIDAK punya izin Workers AI — ${j2?.errors?.[0]?.message ?? `HTTP ${r2.status}`}. Edit token → tambahkan permission "Workers AI — Edit".`,
          );
        }
      } catch (e: any) {
        messages.push(`❌ Gagal cek izin Workers AI: ${e?.message ?? "koneksi"}.`);
      }
    } else {
      messages.push("ℹ️ CF_API_TOKEN & CF_ACCOUNT_ID belum lengkap di menu Keys proyek.");
    }

    if (messages.length === 0) {
      messages.push("ℹ️ Belum ada kunci AI terpasang — lihat menu Keys / API keys proyek.");
    }

    return { ok: keys.gemini || keys.cloudflare || keys.openai, keys, messages };
  },
});
