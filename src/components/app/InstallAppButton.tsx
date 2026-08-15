import { useEffect, useState } from "react";
import type { VariantProps } from "class-variance-authority";
import { Download, MonitorSmartphone, Smartphone } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/**
 * Tombol "Instal Aplikasi" (PWA) — dipakai di landing page.
 *
 * - Saat browser mendukung `beforeinstallprompt` (Android Chrome / PC),
 *   klik tombol memunculkan dialog install bawaan browser.
 * - Di iOS Safari (tanpa dukungan prompt), atau bila prompt tidak tersedia,
 *   tombol membuka dialog panduan manual: Android (Chrome → ⋮ → "Add to
 *   Home screen"), iPhone (Share → "Add to Home Screen"), PC (ikon install
 *   di address bar).
 * - Setelah aplikasi terpasang (standalone) tombol otomatis disembunyikan.
 */
type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

interface InstallAppButtonProps
  extends Omit<React.ComponentProps<"button">, "onClick">,
    VariantProps<typeof buttonVariants> {
  /** Teks tombol. Default: "Instal Aplikasi". */
  label?: string;
}

const isStandalone = () =>
  typeof window !== "undefined" &&
  (window.matchMedia?.("(display-mode: standalone)").matches ||
    (navigator as unknown as { standalone?: boolean }).standalone === true);

export function InstallAppButton({
  label = "Instal Aplikasi",
  variant = "default",
  size = "default",
  className,
  ...rest
}: InstallAppButtonProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(() => isStandalone());
  const [helpOpen, setHelpOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (installed) return;

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, [installed]);

  const handleClick = async () => {
    if (deferredPrompt) {
      setBusy(true);
      try {
        await deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === "accepted") setInstalled(true);
      } catch {
        // prompt gagal/dibatalkan — fallback ke panduan manual
        setHelpOpen(true);
      } finally {
        setDeferredPrompt(null);
        setBusy(false);
      }
      return;
    }
    // Tidak ada prompt bawaan (iOS Safari, browser lain) → tampilkan panduan
    setHelpOpen(true);
  };

  // Sudah terpasang sebagai aplikasi → tidak perlu tombol
  if (installed) return null;

  return (
    <>
      <Button
        type="button"
        variant={variant}
        size={size}
        className={className}
        onClick={handleClick}
        disabled={busy}
        {...rest}
      >
        <Download className="size-4" />
        {label}
      </Button>

      <Dialog open={helpOpen} onOpenChange={setHelpOpen}>
        <DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MonitorSmartphone className="size-5 text-teal-600" />
              Pasang Aplikasi Dapur Laut
            </DialogTitle>
            <DialogDescription>
              Aplikasi bisa dipasang di Android, iPhone, dan PC seperti aplikasi
              biasa. Pilih langkah sesuai perangkat Anda:
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="flex gap-3 rounded-xl border bg-muted/40 p-3.5">
              <Smartphone className="mt-0.5 size-4 shrink-0 text-teal-600" />
              <div className="text-sm leading-relaxed">
                <p className="font-semibold">Android (Chrome)</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Buka ⋮ (titik tiga) di pojok kanan atas → pilih{" "}
                  <b>“Tambahkan ke layar utama”</b> /{" "}
                  <b>“Add to Home screen”</b> → ketuk <b>“Install”</b>.
                  Ikon Dapur Laut langsung muncul di layar utama HP.
                </p>
              </div>
            </div>

            <div className="flex gap-3 rounded-xl border bg-muted/40 p-3.5">
              <Smartphone className="mt-0.5 size-4 shrink-0 text-sky-600" />
              <div className="text-sm leading-relaxed">
                <p className="font-semibold">iPhone / iPad (Safari)</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Ketuk tombol <b>Bagikan (⬆️)</b> di bawah layar → gulir dan
                  pilih <b>“Tambahkan ke Layar Utama”</b> /{" "}
                  <b>“Add to Home Screen”</b> → ketuk <b>“Tambah”</b>.
                </p>
              </div>
            </div>

            <div className="flex gap-3 rounded-xl border bg-muted/40 p-3.5">
              <MonitorSmartphone className="mt-0.5 size-4 shrink-0 text-emerald-600" />
              <div className="text-sm leading-relaxed">
                <p className="font-semibold">PC / Laptop</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Klik ikon <b>install (⬇)</b> di ujung kanan address bar Chrome
                  / Edge, lalu pilih <b>“Install”</b>. Aplikasi terbuka penuh
                  tanpa address bar.
                </p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default InstallAppButton;
