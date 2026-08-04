import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { logRequest, logResponse, badRequest } from "./lib";

// ============================================================================
// AUTH ADMIN — login nomor HP + password (private, hanya admin).
// - Akun pertama otomatis disetujui (bootstrap admin).
// - Akun baru wajib disetujui lewat menu Admin oleh admin yang sudah aktif.
// - Semua request memakai token sesi yang disimpan di localStorage.
// ============================================================================

const DEFAULT_ADMIN_PHONE = "082100000000";
const DEFAULT_ADMIN_PASSWORD = "admin123";

async function hashPassword(password: string): Promise<string> {
  const data = new TextEncoder().encode(`dapurlaut::${password}`);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function genToken(): string {
  try {
    return `dl_${crypto.randomUUID().replace(/-/g, "")}`;
  } catch {
    return `dl_${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`;
  }
}

async function findAkun(ctx: { db: any }, phone: string) {
  return (ctx.db.query as any)("akun")
    .filter((q: any) => q.eq(q.field("id"), phone))
    .first();
}

async function findSession(ctx: { db: any }, token: string) {
  return (ctx.db.query as any)("sessions")
    .filter((q: any) => q.eq(q.field("token"), token))
    .first();
}

/** Pastikan sesi valid & akun sudah disetujui (dipakai admin menu). */
async function requireApproved(ctx: { db: any }, token?: string) {
  if (!token) throw new ConvexError({ error: "Sesi tidak valid. Silakan login kembali." });
  const session = await findSession(ctx, token);
  if (!session) throw new ConvexError({ error: "Sesi tidak valid. Silakan login kembali." });
  const akun = await findAkun(ctx, session.phone);
  if (!akun || akun.status !== "approved") {
    throw new ConvexError({ error: "Akses ditolak. Akun belum disetujui admin." });
  }
  return akun;
}

/** Daftar akun admin baru (wajib verifikasi via menu Admin, kecuali akun pertama). */
export const registerAkun = mutation({
  args: { nama: v.string(), phone: v.string(), password: v.string() },
  handler: async (ctx, { nama, phone, password }) => {
    logRequest("registerAkun", { nama, phone });
    const p = phone.trim();
    if (!/^[0-9+]{9,15}$/.test(p)) return badRequest("Nomor HP tidak valid");
    if (password.length < 6) return badRequest("Password minimal 6 karakter");
    if (await findAkun(ctx, p)) return badRequest("Nomor HP sudah terdaftar");
    const all = await (ctx.db.query as any)("akun").collect();
    const status = all.length === 0 ? "approved" : "pending"; // akun pertama = bootstrap admin
    await (ctx.db as any).insert("akun", {
      id: p,
      nama: nama.trim() || p,
      password: await hashPassword(password),
      status,
      createdAt: Date.now(),
    });
    logResponse("registerAkun", { phone: p, status });
    return { ok: true, phone: p, status };
  },
});

/** Login admin: nomor HP + password. Salah → {"error": "Nomor HP atau password salah"}. */
export const adminLogin = mutation({
  args: { phone: v.string(), password: v.string() },
  handler: async (ctx, { phone, password }) => {
    logRequest("adminLogin", { phone });
    const akun = await findAkun(ctx, phone.trim());
    const hash = await hashPassword(password);
    if (!akun || akun.password !== hash) {
      throw new ConvexError({ error: "Nomor HP atau password salah" });
    }
    if (akun.status === "pending") {
      throw new ConvexError({ error: "Akun Anda masih menunggu persetujuan admin." });
    }
    if (akun.status === "rejected") {
      throw new ConvexError({ error: "Akun Anda ditolak admin. Hubungi administrator." });
    }
    const token = genToken();
    await (ctx.db as any).insert("sessions", { token, phone: akun.id, createdAt: Date.now() });
    logResponse("adminLogin", { phone: akun.id, nama: akun.nama });
    return { token, akun: { phone: akun.id, nama: akun.nama, status: akun.status } };
  },
});

export const adminLogout = mutation({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const session = await findSession(ctx, token);
    if (session) await ctx.db.delete(session._id);
    return { ok: true };
  },
});

/** Ambil sesi aktif dari token (untuk RequireAuth). */
export const getSession = query({
  args: { token: v.optional(v.string()) },
  handler: async (ctx, { token }) => {
    if (!token) return null;
    const session = await findSession(ctx, token);
    if (!session) return null;
    const akun = await findAkun(ctx, session.phone);
    if (!akun) return null;
    return { phone: akun.id, nama: akun.nama, status: akun.status };
  },
});

/** Bootstrap: buat akun admin default bila tabel akun kosong (dipanggil halaman Auth). */
export const ensureDefaultAdmin = mutation({
  args: {},
  handler: async (ctx) => {
    const all = await (ctx.db.query as any)("akun").collect();
    if (all.length > 0) return { created: false };
    await (ctx.db as any).insert("akun", {
      id: DEFAULT_ADMIN_PHONE,
      nama: "Admin PT Dapur Laut",
      password: await hashPassword(DEFAULT_ADMIN_PASSWORD),
      status: "approved",
      createdAt: Date.now(),
    });
    logResponse("ensureDefaultAdmin", { created: true, phone: DEFAULT_ADMIN_PHONE });
    return { created: true, phone: DEFAULT_ADMIN_PHONE, password: DEFAULT_ADMIN_PASSWORD };
  },
});

/** Daftar semua akun (admin menu). */
export const listAkun = query({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    await requireApproved(ctx, token);
    const rows = await (ctx.db.query as any)("akun").collect();
    return rows
      .sort((a: any, b: any) => a.createdAt - b.createdAt)
      .map((a: any) => ({ phone: a.id, nama: a.nama, status: a.status, createdAt: a.createdAt }));
  },
});

export const approveAkun = mutation({
  args: { token: v.string(), phone: v.string() },
  handler: async (ctx, { token, phone }) => {
    logRequest("approveAkun", { phone });
    await requireApproved(ctx, token);
    const akun = await findAkun(ctx, phone);
    if (!akun) return badRequest("Akun tidak ditemukan");
    await (ctx.db as any).patch(akun._id, { status: "approved" });
    logResponse("approveAkun", { phone });
    return { ok: true, phone };
  },
});

export const rejectAkun = mutation({
  args: { token: v.string(), phone: v.string() },
  handler: async (ctx, { token, phone }) => {
    logRequest("rejectAkun", { phone });
    await requireApproved(ctx, token);
    const akun = await findAkun(ctx, phone);
    if (!akun) return badRequest("Akun tidak ditemukan");
    await (ctx.db as any).patch(akun._id, { status: "rejected" });
    logResponse("rejectAkun", { phone });
    return { ok: true, phone };
  },
});
