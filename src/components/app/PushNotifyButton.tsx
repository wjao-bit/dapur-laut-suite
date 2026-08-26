import { useCallback, useEffect, useState } from "react";
import { useAction, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
import { Bell, BellOff, BellRing, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Tombol Notifikasi di header aplikasi — mengaktifkan/menonaktifkan Web Push
 * di perangkat ini (HP/PC). Alur:
 *
 *   1. User menekan tombol → minta izin notifikasi browser.
 *   2. Daftarkan service worker (bila belum), ambil kunci VAPID PUBLIK dari
 *      server (action notif.ensureVapidKeys — kunci dibuat otomatis sekali),
 *      lalu subscribe pushManager browser.
 *   3. Simpan langganan (endpoint + kunci) ke database via
 *      business.savePushSubscription.
 *   4. Server (cron + saat app dibuka) mengirim pengingat tenggat invoice
 *      ke perangkat ini — notifikasi muncul walau aplikasi sedang ditutup.
 *
 * Saat user menonaktifkan, langganan dibatalkan di browser & database.
 */
type PushState =
  | "unsupported" // browser tidak mendukung push
  | "idle" // siap diaktifkan (belum subscribe)
  | "enabled" // sudah subscribe + tersimpan
  | "denied" // izin ditolak browser
  | "busy"; // sedang memproses

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(new ArrayBuffer(rawData.length));
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function PushNotifyButton() {
  const ensureVapidKeys = useAction(api.notif.ensureVapidKeys);
  const checkTenggat = useAction(api.notif.checkTenggatAndNotify);
  const saveSub = useMutation(api.business.savePushSubscription);
  const removeSub = useMutation(api.business.removePushSubscription);

  const [state, setState] = useState<PushState>("idle");

  const supported =
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window;

  /** Periksa kondisi nyata: izin + langganan push yang sudah ada. */
  const syncState = useCallback(async () => {
    if (!supported) {
      setState("unsupported");
      return;
    }
    if (Notification.permission === "denied") {
      setState("denied");
      return;
    }
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg && Notification.permission === "granted") {
        const sub = await reg.pushManager.getSubscription();
        setState(sub ? "enabled" : "idle");
        return;
      }
    } catch {
      /* abaikan — dianggap belum subscribe */
    }
    setState("idle");
  }, [supported]);

  useEffect(() => {
    void syncState();
  }, [syncState]);

  const handleEnable = async () => {
    if (!supported) {
      toast.error("Browser/perangkat ini tidak mendukung notifikasi push.");
      return;
    }
    setState("busy");
    try {
      // 1) Izin notifikasi
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setState("denied");
        toast.error("Izin notifikasi ditolak — aktifkan lewat pengaturan browser (ikon 🔒 di address bar).");
        return;
      }

      // 2) Service worker (sudah didaftarkan otomatis di build produksi)
      let reg = await navigator.serviceWorker.getRegistration();
      if (!reg) {
        reg = await navigator.serviceWorker.register("/sw.js");
      }

      // 3) Kunci VAPID publik dari server (kunci privat hanya di server)
      const { publicKey } = await ensureVapidKeys();
      if (!publicKey) {
        throw new Error("Server belum menghasilkan kunci notifikasi — coba lagi sebentar.");
      }

      // 4) Subscribe push browser
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });

      // 5) Simpan langganan ke database (endpoint + kunci enkripsi)
      await saveSub({
        endpoint: sub.endpoint,
        keys: { p256dh: sub.toJSON().keys!.p256dh, auth: sub.toJSON().keys!.auth },
      });

      setState("enabled");
      toast.success("Notifikasi aktif — pengingat tenggat invoice akan muncul di perangkat ini.");

      // Kirim pengingat yang sudah jatuh tempo SEKARANG (tanpa menunggu cron)
      void checkTenggat().catch(() => {});
    } catch (e: any) {
      const name = e?.name ?? "";
      if (name === "NotAllowedError") {
        setState("denied");
        toast.error("Izin notifikasi ditolak.");
      } else if (name === "NotSupportedError" || name === "AbortError") {
        // iOS Safari lama / browser tanpa dukungan push
        setState("unsupported");
        toast.error("Push tidak didukung browser ini. Gunakan Chrome/Edge, atau install dulu aplikasinya di HP.");
      } else {
        setState("idle");
        toast.error(e?.message ?? "Gagal mengaktifkan notifikasi — coba lagi.");
      }
    }
  };

  const handleDisable = async () => {
    setState("busy");
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg) {
        const sub = await reg.pushManager.getSubscription();
        if (sub) {
          const endpoint = sub.endpoint;
          await sub.unsubscribe();
          await removeSub({ endpoint });
        }
      }
      setState("idle");
      toast.success("Notifikasi dimatikan untuk perangkat ini.");
    } catch (e: any) {
      toast.error(e?.message ?? "Gagal mematikan notifikasi.");
      setState("enabled");
    }
  };

  const onClick = () => {
    if (state === "enabled") void handleDisable();
    else void handleEnable();
  };

  if (!supported) return null;

  const enabled = state === "enabled";
  const busy = state === "busy";
  const denied = state === "denied";

  const title = denied
    ? "Izin notifikasi ditolak browser"
    : enabled
      ? "Notifikasi aktif — klik untuk mematikan"
      : "Aktifkan notifikasi di perangkat ini";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy || denied}
      title={title}
      aria-label={title}
      className={cn(
        "relative cursor-pointer rounded-md p-2 transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:outline-none disabled:cursor-not-allowed",
        enabled
          ? "text-teal-600"
          : denied
            ? "text-muted-foreground/50"
            : "text-muted-foreground hover:text-foreground",
      )}
    >
      {busy ? (
        <Loader2 className="size-4 animate-spin" />
      ) : enabled ? (
        <BellRing className="size-4" />
      ) : denied ? (
        <BellOff className="size-4" />
      ) : (
        <Bell className="size-4" />
      )}
      {enabled && (
        <span className="absolute top-0.5 right-0.5 size-1.5 rounded-full bg-teal-500" />
      )}
    </button>
  );
}
