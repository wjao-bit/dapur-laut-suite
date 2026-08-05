import { useCallback } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { clearToken, getToken, setToken, useTokenState } from "@/lib/auth-storage";

/**
 * Auth kustom PT Dapur Laut — hanya Admin (nomor HP + password).
 * Sesi disimpan sebagai token di localStorage, diverifikasi lewat
 * api.admin.getSession (reaktif).
 */
export function useAuth() {
  const token = useTokenState();
  const session = useQuery(
    api.admin.getSession,
    token ? { token } : "skip",
  ) as
    | {
        phone: string;
        nama: string;
        status: "pending" | "approved" | "rejected";
        role: "Admin Master" | "Admin";
      }
    | null
    | undefined;

  const adminLogin = useMutation(api.admin.adminLogin);
  const adminLogout = useMutation(api.admin.adminLogout);

  const login = useCallback(
    async (phone: string, password: string) => {
      const res = await adminLogin({ phone, password });
      setToken(res.token);
      return res;
    },
    [adminLogin],
  );

  const signOut = useCallback(async () => {
    const t = getToken();
    if (t) {
      try {
        await adminLogout({ token: t });
      } catch {
        /* tetap log out lokal */
      }
    }
    clearToken();
  }, [adminLogout]);

  const isAuthenticated = !!session && session.status === "approved";
  // Loading hanya jika ada token tapi sesi belum ter-resolve
  const isLoading = !!token && session === undefined;

  return {
    isLoading,
    isAuthenticated,
    session,
    user: session,
    token,
    login,
    signOut,
  };
}
