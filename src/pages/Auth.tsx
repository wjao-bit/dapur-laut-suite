import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { useAuth } from "@/hooks/use-auth";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import logo from "@/assets/logo.svg";
import { AlertCircle, ArrowRight, Loader2, LockKeyhole, Phone, Ship, UserPlus } from "lucide-react";
import { Suspense, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";

interface AuthProps {
  redirectAfterAuth?: string;
}

function resolveRedirectAfterAuth(returnTo: string | null, fallback = "/dashboard") {
  if (returnTo?.startsWith("/") && !returnTo.startsWith("//")) {
    return returnTo;
  }
  return fallback;
}

function Auth({ redirectAfterAuth }: AuthProps = {}) {
  const { isLoading: authLoading, isAuthenticated, login } = useAuth();
  const registerAkun = useMutation(api.admin.registerAkun);
  const ensureDefaultAdmin = useMutation(api.admin.ensureDefaultAdmin);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = resolveRedirectAfterAuth(searchParams.get("returnTo"), redirectAfterAuth);

  const [mode, setMode] = useState<"login" | "register">("login");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Bootstrap admin pertama (hanya bila tabel akun kosong)
  useEffect(() => {
    let mounted = true;
    ensureDefaultAdmin()
      .then((res) => {
        if (mounted && res.created) {
          setNotice(`Akun admin pertama dibuat otomatis — HP: ${res.phone} · Password: ${res.password}`);
        }
      })
      .catch(() => undefined);
    return () => {
      mounted = false;
    };
  }, [ensureDefaultAdmin]);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      navigate(redirect);
    }
  }, [authLoading, isAuthenticated, navigate, redirect]);

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const fd = new FormData(event.currentTarget);
      await login(String(fd.get("phone") || ""), String(fd.get("password") || ""));
      navigate(redirect);
    } catch (err: any) {
      console.error("Login error:", err);
      setError(err?.data?.error ?? err?.message ?? "Gagal masuk. Coba lagi.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    setNotice(null);
    try {
      const fd = new FormData(event.currentTarget);
      const res = await registerAkun({
        nama: String(fd.get("nama") || ""),
        phone: String(fd.get("phone") || ""),
        password: String(fd.get("password") || ""),
      });
      if (res.status === "approved") {
        setNotice("Akun admin pertama dibuat dan otomatis disetujui. Silakan masuk.");
      } else {
        setNotice("Akun terdaftar. Menunggu persetujuan admin di menu Admin & Akun.");
      }
      setMode("login");
    } catch (err: any) {
      console.error("Register error:", err);
      setError(err?.data?.error ?? err?.message ?? "Gagal mendaftar. Coba lagi.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-gradient-to-br from-sky-950 via-slate-900 to-slate-950">
      {/* Dekorasi laut */}
      <div className="pointer-events-none absolute inset-0 opacity-30">
        <div className="absolute -top-24 -left-24 size-96 rounded-full bg-sky-500/20 blur-3xl" />
        <div className="absolute -right-24 -bottom-24 size-96 rounded-full bg-teal-400/10 blur-3xl" />
      </div>

      <div className="relative flex flex-1 items-center justify-center p-4">
        <Card className="w-full max-w-sm border-white/10 bg-white/95 shadow-2xl backdrop-blur">
          <CardHeader className="text-center">
            <button
              type="button"
              onClick={() => navigate("/")}
              className="mx-auto cursor-pointer rounded-xl transition-transform hover:scale-105"
              aria-label="Ke beranda"
            >
              <img src={logo} alt="Logo PT Dapur Laut" width={64} height={64} className="rounded-lg" />
            </button>
            <div className="mt-3 flex items-center justify-center gap-1.5 text-xs font-semibold tracking-wide text-sky-700 uppercase">
              <Ship className="size-3.5" />
              PT Dapur Laut
            </div>
            <CardTitle className="text-xl tracking-tight">
              {mode === "login" ? "Masuk Admin" : "Daftar Akun Admin"}
            </CardTitle>
            <CardDescription>
              {mode === "login"
                ? "Aplikasi privat — hanya admin yang disetujui yang dapat mengakses."
                : "Akun baru wajib diverifikasi lewat menu Admin oleh admin aktif."}
            </CardDescription>
          </CardHeader>

          {notice && (
            <div className="mx-6 mb-2 rounded-md border border-sky-200 bg-sky-50 px-3 py-2 text-xs text-sky-800">
              {notice}
            </div>
          )}
          {error && (
            <div className="mx-6 mb-2 flex items-start gap-2 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
              <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {mode === "login" ? (
            <form onSubmit={handleLogin}>
              <CardContent className="space-y-3">
                <div>
                  <Label htmlFor="phone" className="text-xs font-medium">
                    Nomor HP
                  </Label>
                  <div className="relative mt-1.5">
                    <Phone className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="phone"
                      name="phone"
                      inputMode="tel"
                      placeholder="082100000000"
                      className="pl-9"
                      disabled={isLoading}
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="password" className="text-xs font-medium">
                    Password
                  </Label>
                  <div className="relative mt-1.5">
                    <LockKeyhole className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      placeholder="••••••••"
                      className="pl-9"
                      disabled={isLoading}
                      required
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex-col gap-2">
                <Button type="submit" className="w-full cursor-pointer" disabled={isLoading}>
                  {isLoading ? <Loader2 className="mr-2 size-4 animate-spin" /> : <ArrowRight className="mr-2 size-4" />}
                  Masuk
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full cursor-pointer text-xs"
                  onClick={() => {
                    setMode("register");
                    setError(null);
                  }}
                  disabled={isLoading}
                >
                  <UserPlus className="mr-2 size-3.5" />
                  Belum punya akun? Daftar sebagai admin baru
                </Button>
              </CardFooter>
            </form>
          ) : (
            <form onSubmit={handleRegister}>
              <CardContent className="space-y-3">
                <div>
                  <Label htmlFor="nama" className="text-xs font-medium">
                    Nama Lengkap
                  </Label>
                  <Input
                    id="nama"
                    name="nama"
                    placeholder="Andi Wijaya"
                    className="mt-1.5"
                    disabled={isLoading}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="reg-phone" className="text-xs font-medium">
                    Nomor HP
                  </Label>
                  <div className="relative mt-1.5">
                    <Phone className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="reg-phone"
                      name="phone"
                      inputMode="tel"
                      placeholder="08xxxxxxxxxx"
                      className="pl-9"
                      disabled={isLoading}
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="reg-password" className="text-xs font-medium">
                    Password (min. 6 karakter)
                  </Label>
                  <Input
                    id="reg-password"
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    className="mt-1.5"
                    disabled={isLoading}
                    minLength={6}
                    required
                  />
                </div>
              </CardContent>
              <CardFooter className="flex-col gap-2">
                <Button type="submit" className="w-full cursor-pointer" disabled={isLoading}>
                  {isLoading ? <Loader2 className="mr-2 size-4 animate-spin" /> : <UserPlus className="mr-2 size-4" />}
                  Daftar & Tunggu Persetujuan
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full cursor-pointer text-xs"
                  onClick={() => {
                    setMode("login");
                    setError(null);
                  }}
                  disabled={isLoading}
                >
                  Sudah punya akun? Masuk
                </Button>
              </CardFooter>
            </form>
          )}

          <div className="border-t px-6 py-3 text-center text-[11px] text-muted-foreground">
            Sistem Manajemen Bisnis PT Dapur Laut — akses khusus admin
          </div>
        </Card>
      </div>
    </div>
  );
}

export default function AuthPage(props: AuthProps) {
  return (
    <Suspense>
      <Auth {...props} />
    </Suspense>
  );
}
