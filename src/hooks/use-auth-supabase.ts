import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import type { Session, User } from "@supabase/supabase-js";

interface AuthUser {
  id: string;
  email: string;
  nama: string;
  role: "Admin Master" | "Admin" | "user";
  status: "pending" | "approved" | "rejected";
}

/**
 * Auth hook menggunakan Supabase — interface sama dengan useAuth() Convex.
 *
 * Penggunaan:
 *   const { isLoading, isAuthenticated, user, login, signOut } = useAuthSupabase();
 *
 * Supabase Auth support:
 * - Email + password login
 * - Magic link (OTP)
 * - Anonymous auth (opsional)
 */
export function useAuthSupabase() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Listen for auth state changes
  useEffect(() => {
    if (!supabase) {
      setIsLoading(false);
      return;
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      if (s?.user) {
        fetchUserProfile(s.user);
      } else {
        setIsLoading(false);
      }
    });

    // Listen for changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, s) => {
        setSession(s);
        if (s?.user) {
          fetchUserProfile(s.user);
        } else {
          setUser(null);
          setIsLoading(false);
        }
      },
    );

    return () => subscription.unsubscribe();
  }, []);

  /** Ambil profile dari tabel users */
  const fetchUserProfile = async (authUser: User) => {
    if (!supabase) return;
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", authUser.id)
        .single();

      if (error || !data) {
        // User belum ada di tabel users → buat baru
        const { error: insertError } = await supabase.from("users").insert({
          id: authUser.id,
          email: authUser.email ?? "",
          nama: authUser.email?.split("@")[0] ?? "User",
          role: "user",
          status: "approved",
        });

        if (!insertError) {
          setUser({
            id: authUser.id,
            email: authUser.email ?? "",
            nama: authUser.email?.split("@")[0] ?? "User",
            role: "user",
            status: "approved",
          });
        }
      } else {
        setUser({
          id: data.id,
          email: data.email ?? "",
          nama: data.nama ?? data.email?.split("@")[0] ?? "User",
          role: data.role ?? "user",
          status: data.status ?? "approved",
        });
      }
    } catch (err) {
      console.error("[useAuthSupabase] Error fetching profile:", err);
    } finally {
      setIsLoading(false);
    }
  };

  /** Login dengan email + password */
  const login = useCallback(
    async (email: string, password: string) => {
      if (!supabase) throw new Error("Supabase belum terkonfigurasi");

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      return { success: true, user: data.user };
    },
    [],
  );

  /** Login dengan magic link (OTP) */
  const loginWithOtp = useCallback(
    async (email: string) => {
      if (!supabase) throw new Error("Supabase belum terkonfigurasi");

      const { error } = await supabase.auth.signInWithOtp({ email });
      if (error) throw error;
      return { success: true, message: "Kode OTP telah dikirim ke email" };
    },
    [],
  );

  /** Register akun baru */
  const register = useCallback(
    async (email: string, password: string, nama: string) => {
      if (!supabase) throw new Error("Supabase belum terkonfigurasi");

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { nama } },
      });

      if (error) throw error;

      // Buat profile di tabel users
      if (data.user) {
        await supabase.from("users").insert({
          id: data.user.id,
          email,
          nama,
          role: "user",
          status: "approved",
        });
      }

      return { success: true, user: data.user };
    },
    [],
  );

  /** Logout */
  const signOut = useCallback(async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  }, []);

  const isAuthenticated = !!session && !!user && user.status === "approved";

  return {
    isLoading,
    isAuthenticated,
    session,
    user,
    login,
    loginWithOtp,
    register,
    signOut,
  };
}
