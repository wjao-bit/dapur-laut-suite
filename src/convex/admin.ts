import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { logRequest, logResponse, badRequest } from "./lib";

// ============================================================================
// AUTH ADMIN — login nomor HP + password (private, hanya admin).
// - Role "Admin Master": hak penuh (setujui/tolak/kick akun lain).
//   TIDAK BISA di-kick oleh user lain.
// - Role "Admin": user biasa, hanya bisa login & pakai menu.
// - Akun pertama otomatis menjadi Admin Master (bootstrap).
// - Login self-bootstrap: bila tabel akun kosong, akun default dibuat
//   langsung di dalam adminLogin → login pertama TIDAK PERNAH gagal (race fix).
// ============================================================================

const DEFAULT_ADMIN_PHONE = "082100000000";
const DEFAULT_ADMIN_PASSWORD = "admin123";
const ROLE_MASTER = "Admin Master";
const ROLE_ADMIN = "Admin";

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

/** Pastikan sesi valid & akun disetujui. Return akun (dengan role). */
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

/** Khusus Admin Master — validasi role di backend agar hak akses konsisten. */
async function requireMaster(ctx: { db: any }, token?: string) {
  const akun = await requireApproved(ctx, token);
  if ((akun.role ?? ROLE_ADMIN) !== ROLE_MASTER) {
    throw new ConvexError({ error: "Akses ditolak. Hanya Admin Master yang bisa melakukan ini." });
  }
  return akun;
}

/** Bootstrap: pastikan akun default ada (dipanggil di dalam adminLogin). */
async function bootstrapDefaultAdmin(ctx: { db: any }): Promise<void> {
  const all = await (ctx.db.query as any)("akun").collect();
  if (all.length > 0) return;
  await (ctx.db as any).insert("akun", {
    id: DEFAULT_ADMIN_PHONE,
    nama: "Admin Master Dapur Laut",
    password: await hashPassword(DEFAULT_ADMIN_PASSWORD),
    status: "approved",
    role: ROLE_MASTER,
    createdAt: Date.now(),
  });
  logResponse("bootstrapDefaultAdmin", { created: true, phone: DEFAULT_ADMIN_PHONE });
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
    // Akun pertama = Admin Master; akun berikutnya = Admin biasa (pending)
    const isFirst = all.length === 0;
    await (ctx.db as any).insert("akun", {
      id: p,
      nama: nama.trim() || p,
      password: await hashPassword(password),
      status: isFirst ? "approved" : "pending",
      role: isFirst ? ROLE_MASTER : ROLE_ADMIN,
      createdAt: Date.now(),
    });
    logResponse("registerAkun", { phone: p, status: isFirst ? "approved" : "pending" });
    return { ok: true, phone: p, status: isFirst ? "approved" : "pending" };
  },
});

/** Login admin: nomor HP + password. Self-bootstrap → login pertama tak pernah gagal. */
export const adminLogin = mutation({
  args: { phone: v.string(), password: v.string() },
  handler: async (ctx, { phone, password }) => {
    logRequest("adminLogin", { phone });
    // Bootstrap akun default bila tabel kosong (fix race login pertama)
    await bootstrapDefaultAdmin(ctx);
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
    logResponse("adminLogin", { phone: akun.id, nama: akun.nama, role: akun.role ?? ROLE_ADMIN });
    return {
      token,
      akun: { phone: akun.id, nama: akun.nama, status: akun.status, role: akun.role ?? ROLE_ADMIN },
    };
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
    return { phone: akun.id, nama: akun.nama, status: akun.status, role: akun.role ?? ROLE_ADMIN };
  },
});

/** Bootstrap eksplisit (dipanggil halaman Auth) — tetap aman dipanggil berulang. */
export const ensureDefaultAdmin = mutation({
  args: {},
  handler: async (ctx) => {
    const all = await (ctx.db.query as any)("akun").collect();
    if (all.length > 0) return { created: false };
    await bootstrapDefaultAdmin(ctx);
    return { created: true, phone: DEFAULT_ADMIN_PHONE, password: DEFAULT_ADMIN_PASSWORD };
  },
});

/** Daftar semua akun (Admin Master menu). */
export const listAkun = query({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    await requireApproved(ctx, token);
    const rows = await (ctx.db.query as any)("akun").collect();
    return rows
      .sort((a: any, b: any) => a.createdAt - b.createdAt)
      .map((a: any) => ({
        phone: a.id,
        nama: a.nama,
        status: a.status,
        role: a.role ?? ROLE_ADMIN,
        createdAt: a.createdAt,
      }));
  },
});

export const approveAkun = mutation({
  args: { token: v.string(), phone: v.string() },
  handler: async (ctx, { token, phone }) => {
    logRequest("approveAkun", { phone });
    await requireMaster(ctx, token);
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
    await requireMaster(ctx, token);
    const akun = await findAkun(ctx, phone);
    if (!akun) return badRequest("Akun tidak ditemukan");
    if ((akun.role ?? ROLE_ADMIN) === ROLE_MASTER) {
      return badRequest("Admin Master tidak bisa ditolak oleh user lain");
    }
    await (ctx.db as any).patch(akun._id, { status: "rejected" });
    // Hapus semua sesi akun yang ditolak
    await deleteSessionsOf(ctx, phone);
    logResponse("rejectAkun", { phone });
    return { ok: true, phone };
  },
});

/** Kick user: Admin Master melepaskan akses user biasa (hapus sesi + tolak akun). */
export const kickAkun = mutation({
  args: { token: v.string(), phone: v.string() },
  handler: async (ctx, { token, phone }) => {
    logRequest("kickAkun", { phone });
    const master = await requireMaster(ctx, token);
    if (master.id === phone) {
      return badRequest("Anda tidak bisa meng-kick diri sendiri");
    }
    const akun = await findAkun(ctx, phone);
    if (!akun) return badRequest("Akun tidak ditemukan");
    if ((akun.role ?? ROLE_ADMIN) === ROLE_MASTER) {
      return badRequest("Admin Master tidak bisa di-kick oleh user lain");
    }
    // Hapus sesi & tolak akun → user langsung kehilangan akses
    await deleteSessionsOf(ctx, phone);
    await (ctx.db as any).patch(akun._id, { status: "rejected" });
    logResponse("kickAkun", { phone, kicked: true });
    return { ok: true, phone, kicked: true };
  },
});

/** Hapus semua sesi milik nomor HP tertentu. */
async function deleteSessionsOf(ctx: { db: any }, phone: string) {
  const sessions = await (ctx.db.query as any)("sessions")
    .filter((q: any) => q.eq(q.field("phone"), phone))
    .collect();
  for (const s of sessions) await ctx.db.delete(s._id);
}
