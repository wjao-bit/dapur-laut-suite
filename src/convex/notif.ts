"use node";

// ============================================================================
// NOTIFIKASI WEB PUSH (PWA) — kirim notifikasi ke HP/PC lewat push service
// browser (FCM/Web Push protocol), bahkan saat aplikasi sedang TIDAK dibuka.
//
// Alur:
//   1. ensureVapidKeys : buat kunci VAPID sekali (disimpan di tabel appSettings,
//      kunci privat TIDAK pernah dikirim ke klien).
//   2. Frontend        : subscribe pushManager + simpan endpoint (mutation
//      business.savePushSubscription).
//   3. checkTenggatAndNotify (dipanggil cron 6 jam sekali + saat app dibuka):
//      kirim pengingat invoice Reseller/Supplier yang mendekati/lewat jatuh
//      tempo, sekali per invoice per tanggal tenggat (tidak spam).
//   4. checkStokMenipisAndNotify (cron 6 jam sekali): kirim peringatan barang
//      dengan stok ≤ batas minimum, sekali per barang per hari (tidak spam).
//
// Catatan: file ini "use node" → HANYA boleh berisi action (bukan query/
// mutation). Semua akses DB lewat internal queries/mutations.
// ============================================================================

import { setVapidDetails, generateVAPIDKeys, sendNotification } from "web-push";
import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { daysUntil, todayStr } from "\./_business";
import { formatRupiah } from "\./_format";

const VAPID_SUBJECT = "mailto:admin@dapurlaut.id";

async function getSetting(ctx: any, key: string): Promise<string | null> {
  const row = await ctx.runQuery(internal.queries.internalGetAppSetting, { key });
  return row?.value ?? null;
}

async function setSetting(ctx: any, key: string, value: string): Promise<void> {
  await ctx.runMutation(internal.business.internalSetAppSetting, { key, value });
}

/**
 * Pastikan kunci VAPID ada (dibuat otomatis sekali), lalu kembalikan kunci
 * PUBLIK untuk dipakai pushManager.subscribe di browser. Kunci privat hanya
 * tersimpan di server (tabel appSettings) dan tidak pernah bocor ke klien.
 */
export const ensureVapidKeys = action({
  args: {},
  handler: async (ctx): Promise<{ publicKey: string; ready: boolean }> => {
    let publicKey = await getSetting(ctx, "vapid_public");
    if (!publicKey) {
      const keys = generateVAPIDKeys();
      await setSetting(ctx, "vapid_public", keys.publicKey);
      await setSetting(ctx, "vapid_private", keys.privateKey);
      await setSetting(ctx, "vapid_subject", VAPID_SUBJECT);
      publicKey = keys.publicKey;
    }
    return { publicKey, ready: true };
  },
});

type PushPayload = { title: string; body: string; url?: string; tag?: string };

/** Kirim notifikasi ke SEMUA perangkat yang sudah subscribe. */
async function sendToSubscriptions(ctx: any, payload: PushPayload): Promise<{ sent: number; total: number }> {
  const subs: any[] = await ctx.runQuery(internal.queries.internalListPushSubscriptions, {});
  if (subs.length === 0) return { sent: 0, total: 0 };
  const vapidPublic = await getSetting(ctx, "vapid_public");
  const vapidPrivate = await getSetting(ctx, "vapid_private");
  const vapidSubject = (await getSetting(ctx, "vapid_subject")) ?? VAPID_SUBJECT;
  if (!vapidPublic || !vapidPrivate) return { sent: 0, total: subs.length };
  setVapidDetails(vapidSubject, vapidPublic, vapidPrivate);
  let sent = 0;
  for (const sub of subs) {
    try {
      await sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.keys.p256dh, auth: sub.keys.auth } },
        JSON.stringify(payload),
        { TTL: 60 * 60 * 24 }, // pesan kedaluwarsa setelah 1 hari
      );
      sent++;
    } catch (e: any) {
      // Endpoint sudah tidak berlaku (410/404) → hapus langganan agar tidak
      // gagal terus menerus di pengiriman berikutnya.
      if (e?.statusCode === 404 || e?.statusCode === 410) {
        try {
          await ctx.runMutation(internal.business.internalRemovePushSubscriptionByEndpoint, {
            endpoint: sub.endpoint,
          });
        } catch {
          /* abaikan */
        }
      } else {
        console.error("[Push] Gagal kirim ke", String(sub.endpoint).slice(0, 60), e?.statusCode ?? e?.message);
      }
    }
  }
  return { sent, total: subs.length };
}

/**
 * Periksa invoice Reseller/Supplier yang mendekati (H-3) atau lewat jatuh
 * tempo, lalu kirim pengingat push SEKALI per invoice per tanggal tenggat
 * (penanda di appSettings). Dipanggil oleh cron setiap 6 jam dan juga saat
 * aplikasi dibuka (agar pengingat langsung terkirim tanpa menunggu cron).
 */
export const checkTenggatAndNotify = action({
  args: {},
  handler: async (ctx): Promise<{ notified: number; checked: number }> => {
    const invoices: any[] = await ctx.runQuery(internal.queries.internalListInvoicesForNotif, {});
    const today = todayStr();
    const due = invoices.filter((i: any) => {
      const d = daysUntil(i.tenggat, today);
      return !Number.isNaN(d) && d <= 3;
    });
    if (due.length === 0) return { notified: 0, checked: invoices.length };

    let notified = 0;
    for (const i of due) {
      const marker = "tenggat:" + i.idInvoice + ":" + i.tenggat;
      const sentBefore = await getSetting(ctx, marker);
      if (sentBefore) continue;
      const d = daysUntil(i.tenggat, today);
      const label =
        d < 0
          ? "Terlambat " + Math.abs(d) + " hari"
          : d === 0
            ? "Jatuh tempo hari ini!"
            : "H-" + d;
      const res = await sendToSubscriptions(ctx, {
        title: "Tenggat " + i.idInvoice + " · " + i.tipe,
        body:
          i.namaPihak +
          " — " +
          label +
          ". Sisa tagihan " +
          formatRupiah(i.total) +
          ".",
        url: "/dashboard/invoice?view=" + encodeURIComponent(i.idInvoice),
        tag: "tenggat-" + i.idInvoice,
      });
      if (res.sent > 0) {
        await setSetting(ctx, marker, "1");
        notified++;
      }
    }
    return { notified, checked: invoices.length };
  },
});

/**
 * Periksa barang di gudang yang stoknya sudah ≤ batas minimum (stok menipis),
 * lalu kirim peringatan push SEKALI per barang per HARI (penanda di
 * appSettings). Dipanggil cron setiap 6 jam — begitu barang di-restok, stok
 * naik melewati batas dan peringatan berhenti otomatis.
 */
export const checkStokMenipisAndNotify = action({
  args: {},
  handler: async (ctx): Promise<{ notified: number; checked: number }> => {
    const rows: any[] = await ctx.runQuery(internal.gudang.internalListGudangForNotif, {});
    if (rows.length === 0) return { notified: 0, checked: 0 };
    const today = todayStr();
    const low = rows.filter((r) => r.stokAkhir <= r.stokMin);
    if (low.length === 0) return { notified: 0, checked: rows.length };

    let notified = 0;
    for (const r of low) {
      const marker = "stokmenipis:" + r.namaBarang + ":" + today;
      const sentBefore = await getSetting(ctx, marker);
      if (sentBefore) continue;
      const res = await sendToSubscriptions(ctx, {
        title: "Stok menipis: " + r.namaBarang,
        body:
          "Sisa stok " +
          r.stokAkhir +
          " unit (batas minimal " +
          r.stokMin +
          "). Segera restok dari supplier.",
        url: "/dashboard/gudang",
        tag: "stokmenipis-" + r.namaBarang,
      });
      if (res.sent > 0) {
        await setSetting(ctx, marker, "1");
        notified++;
      }
    }
    return { notified, checked: rows.length };
  },
});




