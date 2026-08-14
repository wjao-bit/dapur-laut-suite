import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Download, Monitor, Smartphone, CheckCircle2, Apple, Chrome } from "lucide-react";
import { LogoMark } from "@/components/Brand";
import { cn } from "@/lib/utils";

/** Event "pasang aplikasi" bawaan browser (Chrome/Edge Android & PC). */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function isStandalone(): boolean {
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    (navigator as any)?.standalone === true
  );
}

/**
 * Tombol "Instal Aplikasi" — aplikasi bisa dipasang seperti APK di Android /
 * aplikasi desktop di PC. Memakai beforeinstallprompt bila tersedia, dan
 * menampilkan panduan langkah demi langkah untuk perangkat yang tidak
 * mendukung prompt otomatis (iPhone Safari, browser lain).
 */
export function InstallAppButton({
  className,
  variant = "outline",
  size = "lg",
  label = "Instal Aplikasi",
}: {
  className?: string;
  variant?: "default" | "outline" | "ghost" | "secondary";
  size?: "default" | "sm" | "lg";
  label?: string;
}) {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(isStandalone());
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferred(null);
    };
    const onVisibility = () => {
      if (isStandalone()) setInstalled(true);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  // Sudah terpasang sebagai aplikasi → tombol tidak perlu tampil.
  if (installed) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
        <CheckCircle2 className="size-3.5" />
        Aplikasi terpasang
      </span>
    );
  }

  const handleClick = async () => {
    // Browser mendukung prompt instalasi langsung (Chrome Android/PC) →
    // tampilkan dialog instal bawaan browser.
    if (deferred) {
      const ev = deferred;
      setDeferred(null);
      await ev.prompt();
      const choice = await ev.userChoice;
      if (choice.outcome === "accepted") setInstalled(true);
      return;
    }
    // Tanpa prompt otomatis → panduan manual per perangkat.
    setOpen(true);
  };

  return (
    <>
      <Button
        type="button"
        variant={variant}
        size={size}
        onClick={handleClick}
        className={cn("cursor-pointer", className)}
      >
        <Download className="mr-2 size-4" />
        {label}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <LogoMark className="size-8" />
              Instal Aplikasi Dapur Laut
            </DialogTitle>
            <DialogDescription>
              Pasang aplikasi di perangkat apa pun — ikon seperti aplikasi biasa, tanpa perlu Play
              Store. Semua data tetap tersinkron dari server yang sama.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2.5">
            {/* Android */}
            <div className="rounded-xl border p-3.5">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Smartphone className="size-4 text-teal-600" />
                Android (Chrome)
              </div>
              <ol className="mt-1.5 list-decimal space-y-1 pl-5 text-xs text-muted-foreground">
                <li>Buka menu <b>⋯</b> di pojok kanan atas Chrome</li>
                <li>Ketuk <b>"Instal aplikasi"</b> atau <b>"Add to Home screen"</b></li>
                <li>Ikon Dapur Laut muncul di layar utama — langsung dipakai seperti APK</li>
              </ol>
            </div>

            {/* iPhone */}
            <div className="rounded-xl border p-3.5">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Apple className="size-4 text-slate-600" />
                iPhone / iPad (Safari)
              </div>
              <ol className="mt-1.5 list-decimal space-y-1 pl-5 text-xs text-muted-foreground">
                <li>Ketuk tombol <b>Bagikan</b> (kotak dengan panah ↑) di Safari</li>
                <li>Gulir lalu ketuk <b>"Add to Home Screen"</b></li>
                <li>Ketuk <b>Tambah</b> — aplikasi terbuka fullscreen tanpa address bar</li>
              </ol>
            </div>

            {/* PC */}
            <div className="rounded-xl border p-3.5">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Monitor className="size-4 text-sky-600" />
                PC (Chrome / Edge / Windows)
              </div>
              <ol className="mt-1.5 list-decimal space-y-1 pl-5 text-xs text-muted-foreground">
                <li>Klik ikon <b>Instal</b> (⊕ atau monitor) di kanan address bar</li>
                <li>Atau: menu <b>⋯</b> → <b>"Cast, save, and share"</b> → <b>"Install page as app"</b></li>
                <li>Alternatif Windows: Edge menu ⋯ → <b>Apps</b> → <b>"Install this site as an app"</b></li>
              </ol>
            </div>

            {/* Chrome */}
            <div className="rounded-xl border border-teal-200 bg-teal-50/60 p-3.5">
              <div className="flex items-center gap-2 text-sm font-semibold text-teal-800">
                <Chrome className="size-4" />
                Cara termudah
              </div>
              <p className="mt-1.5 text-xs leading-relaxed text-teal-800/90">
                Di Chrome Android/PC, ikon <b>⊕ Instal</b> muncul otomatis di address bar saat
                halaman ini dibuka — sekali ketuk, aplikasi langsung terpasang.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
