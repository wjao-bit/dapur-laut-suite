import { Toaster } from "@/components/ui/sonner";
import { RequireAuth } from "@/components/RequireAuth";
import { VlyToolbar } from "../vly-toolbar-readonly.tsx";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import React, { StrictMode, useEffect, lazy, Suspense, useState } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes, useLocation, Navigate } from "react-router";
import { LogoMark } from "@/components/Brand";
import "./index.css";

// Lazy load route components for better code splitting
const Landing = lazy(() => import("./pages/Landing.tsx"));
const AuthPage = lazy(() => import("./pages/Auth.tsx"));
const AppLayout = lazy(() => import("./components/app/AppLayout.tsx"));
const NotFound = lazy(() => import("./pages/NotFound.tsx"));

const DashboardPage = lazy(() => import("./pages/app/DashboardPage.tsx"));
const BarangPage = lazy(() => import("./pages/app/BarangPage.tsx"));
const SupplierPage = lazy(() => import("./pages/app/SupplierPage.tsx"));
const ResellerPage = lazy(() => import("./pages/app/ResellerPage.tsx"));
const DplPage = lazy(() => import("./pages/app/DplPage.tsx"));
const PasarPage = lazy(() => import("./pages/app/PasarPage.tsx"));
const KaryawanPage = lazy(() => import("./pages/app/KaryawanPage.tsx"));
const AbsensiPage = lazy(() => import("./pages/app/AbsensiPage.tsx"));
const UtangPage = lazy(() => import("./pages/app/UtangPage.tsx"));
const InvoicePage = lazy(() => import("./pages/app/InvoicePage.tsx"));
const ReturPage = lazy(() => import("./pages/app/ReturPage.tsx"));
const GudangPage = lazy(() => import("./pages/app/GudangPage.tsx"));
const KasPage = lazy(() => import("./pages/app/KasPage.tsx"));
const SlipGajiPage = lazy(() => import("./pages/app/SlipGajiPage.tsx"));
const PengeluaranPage = lazy(() => import("./pages/app/PengeluaranPage.tsx"));
const LaporanPage = lazy(() => import("./pages/app/LaporanPage.tsx"));
const AdminPage = lazy(() => import("./pages/app/AdminPage.tsx"));
const TetesanPage = lazy(() => import("./pages/app/TetesanPage.tsx"));
const MasterTetesanPage = lazy(() => import("./pages/app/MasterTetesanPage.tsx"));
const LaporanTetesanPage = lazy(() => import("./pages/app/LaporanTetesanPage.tsx"));
const KatalogPage = lazy(() => import("./pages/app/KatalogPage.tsx"));

// Simple loading fallback for route transitions
function RouteLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-pulse text-muted-foreground">Loading...</div>
    </div>
  );
}

/** Silent error boundary — if VlyToolbar crashes it renders nothing instead of
 *  crashing the whole app (e.g. hook errors in WebContainer environment). */
class ToolbarErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(err: Error) {
    console.warn("[VlyToolbar] Caught error, toolbar disabled:", err.message);
  }
  render() {
    return this.state.hasError ? null : this.props.children;
  }
}

/** Hard guard so runtime errors never leave the preview as a blank page. */
class RootErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; message: string; stack: string }
> {
  state = { hasError: false, message: "", stack: "" };
  static getDerivedStateFromError(error: Error) {
    return {
      hasError: true,
      message: error.message || "Unknown runtime error",
      stack: error.stack || "",
    };
  }
  componentDidCatch(err: Error) {
    console.error("[WebContainer preview] Root crash:", err);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background text-foreground p-6">
          <div className="max-w-lg text-center">
            <p className="text-sm font-semibold">Preview runtime error</p>
            <p className="mt-2 text-xs text-muted-foreground break-words">
              {this.state.message}
            </p>
            {this.state.stack && (
              <pre className="mt-3 text-left text-[10px] leading-4 text-muted-foreground/80 max-h-40 overflow-auto rounded border border-border/60 p-2">
                {this.state.stack}
              </pre>
            )}
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

/**
 * Deployment Convex yang dipakai aplikasi.
 *
 * PENTING: build publish Freebuff menginjeksi VITE_CONVEX_URL ke deployment
 * produksi (enchanted-kangaroo-934) yang TIDAK berisi fungsi backend, sehingga
 * web publish tampil putih (semua query gagal dengan "Server Error"). Deployment
 * dev (resilient-hawk-825) berisi seluruh fungsi + data dan terbukti berfungsi.
 *
 * Strategi: gunakan nilai env bila tersedia DAN bukan deployment yang
 * diketahui rusak/kosong; selain itu selalu pakai deployment dev yang berisi
 * seluruh fungsi.
 */
const FALLBACK_CONVEX_URL = "https://resilient-hawk-825.convex.cloud";

// Deployment yang DIBUKTIKAN rusak/kosong (tidak berisi fungsi backend) atau
// deployment lama yang sudah tidak dipakai — jangan pernah dipakai, selalu
// fallback ke deployment dev yang berisi seluruh fungsi + data.
const BROKEN_CONVEX_URLS = [
  "https://enchanted-kangaroo-934.convex.cloud",
  "https://happy-otter-123.convex.cloud",
];

const envConvexUrl: string | undefined = (import.meta.env.VITE_CONVEX_URL as string | undefined)?.trim();
const convexUrl: string =
  envConvexUrl && !BROKEN_CONVEX_URLS.includes(envConvexUrl)
    ? envConvexUrl
    : FALLBACK_CONVEX_URL;

function ConvexConfigScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6 text-foreground">
      <div className="w-full max-w-md rounded-2xl border bg-card p-8 text-center shadow-sm">
        <LogoMark className="mx-auto size-14" />
        <h1 className="mt-6 text-xl font-bold tracking-tight">
          Dapur Laut belum terhubung
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Koneksi ke server data (Convex) belum dikonfigurasi. Variabel lingkungan{" "}
          <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[12px]">
            VITE_CONVEX_URL
          </code>{" "}
          belum terisi di menu <b>Keys / API keys</b> proyek ini.
        </p>
        <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
          Tempel URL deployment Convex (contoh:{" "}
          <code className="rounded bg-muted px-1 py-0.5 font-mono">
            https://xxxxxxxx.convex.cloud
          </code>
          ) ke variabel tersebut, lalu muat ulang preview.
        </p>
      </div>
    </div>
  );
}

function Root() {
  const [client] = useState<ConvexReactClient | null>(() => {
    if (!convexUrl) return null;
    try {
      return new ConvexReactClient(convexUrl);
    } catch (err) {
      console.error("[Convex] Gagal menginisialisasi client:", err);
      return null;
    }
  });

  if (!client) {
    return <ConvexConfigScreen />;
  }

  return (
    <ConvexProvider client={client}>
      <BrowserRouter>
        <RouteSyncer />
        <Suspense fallback={<RouteLoading />}>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route
              path="/auth"
              element={<AuthPage redirectAfterAuth="/dashboard" />}
            />
            <Route
              path="/dashboard"
              element={
                <RequireAuth>
                  <AppLayout />
                </RequireAuth>
              }
            >
              <Route index element={<Navigate to="overview" replace />} />
              <Route path="overview" element={<DashboardPage />} />
              <Route path="barang" element={<BarangPage />} />
              <Route path="supplier" element={<SupplierPage />} />
              <Route path="reseller" element={<ResellerPage />} />
              <Route path="dpl" element={<DplPage />} />
              <Route path="pasar" element={<PasarPage />} />
              <Route path="karyawan" element={<KaryawanPage />} />
              <Route path="katalog" element={<KatalogPage />} />
              <Route path="absensi" element={<AbsensiPage />} />
              <Route path="utang" element={<UtangPage />} />
              <Route path="invoice" element={<InvoicePage />} />
              <Route path="retur" element={<ReturPage />} />
              <Route path="gudang" element={<GudangPage />} />
              <Route path="kas" element={<KasPage />} />
              <Route path="slipgaji" element={<SlipGajiPage />} />
              <Route path="pengeluaran" element={<PengeluaranPage />} />
              <Route path="laporan" element={<LaporanPage />} />
              <Route path="admin" element={<AdminPage />} />
              <Route path="tetesan" element={<TetesanPage />} />
              <Route path="master-tetesan" element={<MasterTetesanPage />} />
              <Route path="laporan-tetesan" element={<LaporanTetesanPage />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
      <Toaster />
    </ConvexProvider>
  );
}

function RouteSyncer() {
  const location = useLocation();
  useEffect(() => {
    window.parent.postMessage(
      { type: "iframe-route-change", path: location.pathname },
      "*",
    );
  }, [location.pathname]);

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (event.data?.type === "navigate") {
        if (event.data.direction === "back") window.history.back();
        if (event.data.direction === "forward") window.history.forward();
      }
    }
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  return null;
}

// Hapus fallback statis index.html begitu React siap mount — supaya pengguna
// tidak pernah melihat layar putih/loading palsu setelah app berjalan.
const fallbackEl = document.getElementById("root-fallback");
if (fallbackEl) fallbackEl.remove();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RootErrorBoundary>
      <ToolbarErrorBoundary>
        <VlyToolbar />
      </ToolbarErrorBoundary>
      <Root />
    </RootErrorBoundary>
  </StrictMode>,
);
