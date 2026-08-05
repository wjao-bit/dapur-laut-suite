import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { sha256 } from "@oslojs/crypto/sha2";
import { badRequest, logRequest, logResponse } from "./lib";

// ============================================================================
// AKUN ADMIN & SESI — login nomor HP + password (hash SHA-256).
//
// Role:
//   - "Admin Master" : nomor master 082100000000, hak penuh, mengelola user
//     lain (setujui / tolak / kick), TIDAK BISA di-kick oleh user lain.
//   - "Admin"        : role biasa, hanya bisa melihat daftar akun.
//
// Semua operasi kelola akun (list/approve/reject/kick) divalidasi di backend:
// hanya Admin Master yang boleh menjalankannya, dan Admin Master tidak pernah
// bisa di-kick / ditolak oleh siapa pun.
// ============================================================================

/** Nomor master tetap PT Dapur Laut — Admin Master. */
export const MASTER_PHONE = "082100000000";
export const MASTER_DEFAULT_PASSWORD = "admin123";

/** SHA-256 hex (matching schema `akun.password`). */
function sha256Hex(input: string): string {
  const bytes = new TextEncoder().encode(input);
  const digest = sha256(bytes);
  return Array.from(digest, (b) => b.toString(16).padStart(2, "0")).join("");
}

/** Token sesi acak — tidak bisa ditebak. */
function genToken(phone: string): string {
  return sha256Hex(`${phone}|${Date.now().toString(36)}|${Math.random().toString(36).slice(2)}|${Math.random()}`);
}

async function findAkun(ctx: any, phone: string) {
  return (ctx.db.query("akun") as any)
    .filter((q: any) => q.eq(q.field("id"), phone))
    .first();
}

async function findSession(ctx: any, token: string) {
  return (ctx.db.query("sessions") as any)
    .filter((q: any) => q.eq(q.field("token"), token))
    .first();
}

/** Validasi token sesi → akun aktif (approved). Throw bila tidak valid. */
async function requireSession(ctx: any, token: string) {
  const sesi = await findSession(ctx, token);
  if (!sesi) return badRequest("Sesi tidak valid — silakan masuk kembali");
  const akun = await findAkun(ctx, sesi.phone);
  if (!akun || akun.status !== "approved") return badRequest("Akun tidak aktif — silakan masuk kembali");
  return { sesi, akun };
}

/** Validasi bahwa yang bertindak adalah Admin Master. */
async function requireMaster(ctx: any, token: string) {
  const { akun } = await requireSession(ctx, token);
  if ((akun.role ?? "Admin") !== "Admin Master") {
    return badRequest("Hanya Admin Master yang dapat melakukan aksi ini");
  }
  return akun;
}

// ============================================================================
// SESI — getSession / adminLogin / adminLogout
// ============================================================================

export const getSession = query({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    logRequest("getSession", { token: token ? "***" : "" });
    const sesi = await findSession(ctx, token);
    if (!sesi) return null;
    const akun = await findAkun(ctx, sesi.phone);
    if (!akun) return null;
    const out = { phone: akun.id, nama: akun.nama, status: akun.status, role: akun.role ?? "Admin" };
    logResponse("getSession", { phone: out.phone });
    return out;
  },
});

export const adminLogin = mutation({
  args: { phone: v.string(), password: v.string() },
  handler: async (ctx, { phone, password }) => {
    logRequest("adminLogin", { phone });
    const akun = await findAkun(ctx, phone);
    if (!akun || akun.password !== sha256Hex(password)) {
      return badRequest("Nomor HP atau password salah");
    }
    if (akun.status === "pending") return badRequest("Akun belum disetujui — tunggu persetujuan Admin Master");
    if (akun.status === "rejected") return badRequest("Akun ditolak — hubungi Admin Master");
    const token = genToken(phone);
    await ctx.db.insert("sessions", { token, phone, createdAt: Date.now() });
    logResponse("adminLogin", { phone, nama: akun.nama });
    return { token, phone, nama: akun.nama, role: akun.role ?? "Admin" };
  },
});

export const adminLogout = mutation({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    logRequest("adminLogout", {});
    const sesi = await findSession(ctx, token);
    if (sesi) await ctx.db.delete(sesi._id);
    return { ok: true };
  },
});

// ============================================================================
// PENDAFTARAN — akun pertama (Admin Master) otomatis dibuat
// ============================================================================

/** Bootstrap: buat akun Admin Master (082100000000) hanya bila tabel kosong. */
export const ensureDefaultAdmin = mutation({
  args: {},
  handler: async (ctx) => {
    logRequest("ensureDefaultAdmin", {});
    const existing = await findAkun(ctx, MASTER_PHONE);
    if (existing) return { created: false, phone: MASTER_PHONE, password: "" };
    const all = await ctx.db.query("akun").collect();
    if (all.length > 0) return { created: false, phone: MASTER_PHONE, password: "" };
    await ctx.db.insert("akun", {
      id: MASTER_PHONE,
      nama: "Admin Master",
      password: sha256Hex(MASTER_DEFAULT_PASSWORD),
      status: "approved",
      role: "Admin Master",
      createdAt: Date.now(),
    });
    logResponse("ensureDefaultAdmin", { created: true });
    return { created: true, phone: MASTER_PHONE, password: MASTER_DEFAULT_PASSWORD };
  },
});

/**
 * Daftar akun admin baru. Nomor master 082100000000 otomatis dibuat sebagai
 * Admin Master (langsung disetujui); nomor lain menjadi "Admin" pending dan
 * wajib disetujui oleh Admin Master di menu Admin & Akun.
 */
export const registerAkun = mutation({
  args: { nama: v.string(), phone: v.string(), password: v.string() },
  handler: async (ctx, { nama, phone, password }) => {
    logRequest("registerAkun", { nama, phone });
    if (!nama?.trim()) return badRequest("Nama wajib diisi");
    if (!/^0\d{8,13}$/.test(phone)) return badRequest("Nomor HP tidak valid — contoh: 082100000000");
    if (!password || password.length < 6) return badRequest("Password minimal 6 karakter");
    const existing = await findAkun(ctx, phone);
    if (existing) return badRequest("Nomor HP sudah terdaftar", { phone });
    const isMaster = phone === MASTER_PHONE;
    await ctx.db.insert("akun", {
      id: phone,
      nama: nama.trim(),
      password: sha256Hex(password),
      status: isMaster ? "approved" : "pending",
      role: isMaster ? "Admin Master" : "Admin",
      createdAt: Date.now(),
    });
    logResponse("registerAkun", { phone, status: isMaster ? "approved" : "pending" });
    return { status: isMaster ? "approved" : "pending", phone };
  },
});

// ============================================================================
// KELOLA AKUN (KHUSUS ADMIN MASTER) — list / approve / reject / kick
// ============================================================================

export const listAkun = query({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    logRequest("listAkun", {});
    await requireMaster(ctx, token);
    const rows = await ctx.db.query("akun").collect();
    const out = rows
      .map((a) => ({ phone: a.id, nama: a.nama, status: a.status, role: a.role ?? "Admin", createdAt: a.createdAt }))
      .sort((a, b) => b.createdAt - a.createdAt);
    logResponse("listAkun", { count: out.length });
    return out;
  },
});

export const approveAkun = mutation({
  args: { token: v.string(), phone: v.string() },
  handler: async (ctx, { token, phone }) => {
    logRequest("approveAkun", { phone });
    await requireMaster(ctx, token);
    const target = await findAkun(ctx, phone);
    if (!target) return badRequest("Akun tidak ditemukan", { phone });
    if (target.id === MASTER_PHONE) return badRequest("Akun Admin Master tidak dapat diubah");
    await ctx.db.patch(target._id, { status: "approved" });
    logResponse("approveAkun", { phone });
    return { phone, status: "approved" };
  },
});

export const rejectAkun = mutation({
  args: { token: v.string(), phone: v.string() },
  handler: async (ctx, { token, phone }) => {
    logRequest("rejectAkun", { phone });
    await requireMaster(ctx, token);
    const target = await findAkun(ctx, phone);
    if (!target) return badRequest("Akun tidak ditemukan", { phone });
    if (target.id === MASTER_PHONE) return badRequest("Admin Master tidak dapat ditolak");
    await ctx.db.patch(target._id, { status: "rejected" });
    // Cabut semua sesi akun tsb
    const sesi = await (ctx.db.query("sessions") as any)
      .filter((q: any) => q.eq(q.field("phone"), phone))
      .collect();
    for (const s of sesi) await ctx.db.delete(s._id);
    logResponse("rejectAkun", { phone });
    return { phone, status: "rejected" };
  },
});

/**
 * Kick user biasa: cabut sesi aktif + tolak akun agar tidak bisa login lagi.
 * Admin Master tidak pernah bisa di-kick (validasi di sini).
 */
export const kickAkun = mutation({
  args: { token: v.string(), phone: v.string() },
  handler: async (ctx, { token, phone }) => {
    logRequest("kickAkun", { phone });
    await requireMaster(ctx, token);
    const target = await findAkun(ctx, phone);
    if (!target) return badRequest("Akun tidak ditemukan", { phone });
    if (target.id === MASTER_PHONE) return badRequest("Admin Master tidak dapat di-kick");
    const sesi = await (ctx.db.query("sessions") as any)
      .filter((q: any) => q.eq(q.field("phone"), phone))
      .collect();
    for (const s of sesi) await ctx.db.delete(s._id);
    await ctx.db.patch(target._id, { status: "rejected" });
    logResponse("kickAkun", { phone });
    return { phone, status: "rejected" };
  },
});
