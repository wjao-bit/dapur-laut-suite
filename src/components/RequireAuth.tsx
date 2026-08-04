import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Loader2, ShieldX, Hourglass } from "lucide-react";
import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router";

function GateScreen({
  icon,
  title,
  description,
  onLogout,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  onLogout?: () => void;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="w-full max-w-sm rounded-2xl border bg-card p-8 text-center">
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
          {icon}
        </div>
        <h1 className="mt-4 text-lg font-bold tracking-tight">{title}</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p>
        {onLogout && (
          <Button variant="outline" className="mt-6 w-full" onClick={onLogout}>
            Keluar
          </Button>
        )}
      </div>
    </main>
  );
}

export function RequireAuth({ children }: { children: ReactNode }) {
  const { isLoading, isAuthenticated, session, signOut } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </main>
    );
  }

  // Akun disetujui → akses penuh
  if (isAuthenticated) {
    return children;
  }

  // Ada sesi tapi akun belum/tidak disetujui
  if (session && session.status === "pending") {
    return (
      <GateScreen
        icon={<Hourglass className="size-5" />}
        title="Menunggu Persetujuan Admin"
        description={`Akun ${session.phone} masih menunggu diverifikasi oleh administrator. Silakan hubungi admin PT Dapur Laut, lalu coba masuk lagi.`}
        onLogout={signOut}
      />
    );
  }
  if (session && session.status === "rejected") {
    return (
      <GateScreen
        icon={<ShieldX className="size-5" />}
        title="Akses Ditolak"
        description={`Akun ${session.phone} ditolak oleh administrator. Hubungi admin untuk keterangan lebih lanjut.`}
        onLogout={signOut}
      />
    );
  }

  // Belum login → arahkan ke halaman auth dengan returnTo
  const returnTo = `${location.pathname}${location.search}`;
  return <Navigate to={`/auth?returnTo=${encodeURIComponent(returnTo)}`} replace />;
}
