import React from "react";

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  isPaused: boolean;
}

/**
 * Error boundary untuk menangkap error "Convex deployment is paused".
 * Saat paused, tetap tampilkan navigasi supaya user bisa ke halaman Supabase.
 */
export class ConvexErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false, isPaused: false };

  static getDerivedStateFromError(error: Error): Partial<State> {
    const msg = String(error?.message ?? error ?? "");
    const isPaused =
      msg.includes("paused") ||
      msg.includes("Cannot run functions") ||
      msg.includes("deployment is paused");
    return { hasError: true, isPaused };
  }

  componentDidCatch(error: Error) {
    console.warn("[ConvexErrorBoundary] Caught:", error.message);
  }

  handleRetry = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.state.isPaused) {
        return (
          <div className="flex min-h-screen items-center justify-center bg-background p-6">
            <div className="w-full max-w-sm rounded-2xl border bg-card p-8 text-center shadow-sm">
              <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-amber-100">
                <span className="text-2xl">⚠️</span>
              </div>
              <h1 className="mt-6 text-lg font-bold tracking-tight text-foreground">
                Server Sedang Dalam Perbaikan
              </h1>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                Sementara waktu, akses aplikasi terbatas karena server data sedang menjalani
                pemeliharaan. Coba lagi beberapa menit.
              </p>
              <div className="mt-4 space-y-2">
                <button
                  type="button"
                  onClick={this.handleRetry}
                  className="w-full rounded-xl bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-800 active:scale-[0.98]"
                >
                  Coba Lagi
                </button>
                <p className="text-[11px] text-muted-foreground/60">
                  Convex deployment paused (limit free tier)
                </p>
              </div>
            </div>
          </div>
        );
      }

      // Error non-paused — tampilkan error info
      return (
        <div className="flex min-h-screen items-center justify-center bg-background p-6">
          <div className="w-full max-w-md rounded-2xl border bg-card p-8 text-center shadow-sm">
            <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-red-100">
              <span className="text-2xl">❌</span>
            </div>
            <h1 className="mt-6 text-lg font-bold tracking-tight text-foreground">
              Terjadi Kesalahan
            </h1>
            <p className="mt-3 text-sm text-muted-foreground">
              Aplikasi mengalami error yang tidak terduga.
            </p>
            <button
              type="button"
              onClick={this.handleRetry}
              className="mt-6 w-full rounded-xl bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-800 active:scale-[0.98]"
            >
              Muat Ulang
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
