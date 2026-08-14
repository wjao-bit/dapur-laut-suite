import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { sha256 } from "@oslojs/crypto/sha2";
import { badRequest, logAktivitas, logRequest, logResponse } from "./lib";

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
//
// Password: setiap user (termasuk Admin Master) bisa mengganti password-nya
// sendiri lewat mutation changePassword. Password Admin Master yang SUDAH
// diganti TIDAK pernah di-reset otomatis ke bawaan lagi (fitur keamanan).
// ============================================================================

/** Nomor master tetap PT Dapur Laut — Admin Master. */
export const MASTER_PHONE = "082100000000";
export const MASTER_DEFAULT_PASSWORD = "makan123";
/** Password bawaan lama — dipakai untuk migrasi otomatis ke password baru. */
export const MASTER_OLD_DEFAULT_PASSWORD = "admin123";

/** SHA-256 hex (matching schema `akun.password`). */
function sha256Hex(input: string): string {
  const bytes = new TextEncoder().encode(input);
  const digest = sha256(bytes);
  return Array.from(digest, (b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Bersihkan nomor HP: buang spasi, strip, titik, kurung → angka saja.
 * Contoh: "0821 0000-0000" → "082100000000".
 */
function normalizePhone(raw: string): string {
  return String(raw || "")
    .replace(/[^\d]/g, "")
    .trim();
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
export async function requireMaster(ctx: any, token: string) {
  const { akun } = await requireSession(ctx, token);
  if ((akun.role ?? "Admin") !== "Admin Master") {
    return badRequest("Hanya Admin Master yang dapat melakukan aksi ini");
  }
  return akun;
}

/**
 * Bootstrap/sinkron akun Admin Master. Dipanggil dari adminLogin dan
 * ensureDefaultAdmin: akun 082100000000 DIJAMIN ada dengan role "Admin Master"
 * (approved) — apa pun kondisi data lama di database, pemilik tidak pernah
 * terkunci keluar dari sistem.
 *
 * PENTING (keamanan): password master TIDAK di-reset paksa lagi. Akun dibuat
 * dengan password bawaan (makan123) HANYA saat baru dibuat; password lama
 * bawaan (admin123) hanya dimigrasikan sekali ke makan123. Password yang
 * sudah diganti pemilik lewat menu Ganti Password tidak pernah ditimpa.
 *
 * Mengembalikan { akun, created } — created=true bila akun baru dibuat.
 */
async function syncMasterAccount(ctx: any): Promise<{ akun: any; created: boolean }> {
  let akun = await findAkun(ctx, MASTER_PHONE);
  if (!akun) {
    await ctx.db.insert("akun", {
      id: MASTER_PHONE,
      nama: "Admin Master",
      password: sha256Hex(MASTER_DEFAULT_PASSWORD),
      status: "approved",
      role: "Admin Master",
      createdAt: Date.now(),
    });
    akun = await findAkun(ctx, MASTER_PHONE);
    return { akun, created: true };
  }
  const patch: Record<string, unknown> = {};
  // Migrasi password bawaan LAMA (admin123) → bawaan baru (makan123) sekali.
  // Password lain (sudah diganti pemilik) TIDAK disentuh.
  if (akun.password === sha256Hex(MASTER_OLD_DEFAULT_PASSWORD)) {
    patch.password = sha256Hex(MASTER_DEFAULT_PASSWORD);
  }
  if (akun.role !== "Admin Master") patch.role = "Admin Master";
  if (akun.status !== "approved") patch.status = "approved";
  if (Object.keys(patch).length > 0) {
    await ctx.db.patch(akun._id, patch);
    akun = await findAkun(ctx, MASTER_PHONE);
  }
  return { akun, created: false };
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
    const cleanPhone = normalizePhone(phone);
    logRequest("adminLogin", { phone: cleanPhone });
    // Login dengan nomor master → pastikan akun master ada (dibuat bila belum
    // pernah ada). Password bawaan HANYA berlaku saat akun belum pernah
    // diganti — syncMasterAccount tidak lagi menimpa password yang diganti.
    let akun = await findAkun(ctx, cleanPhone);
    if (cleanPhone === MASTER_PHONE) {
      akun = (await syncMasterAccount(ctx)).akun;
    }
    if (!akun || akun.password !== sha256Hex(password || "")) {
      return badRequest("Nomor HP atau password salah");
    }
    if (akun.status === "pending") return badRequest("Akun belum disetujui — tunggu persetujuan Admin Master");
    if (akun.status === "rejected") return badRequest("Akun ditolak — hubungi Admin Master");
    const token = genToken(cleanPhone);
    await ctx.db.insert("sessions", { token, phone: cleanPhone, createdAt: Date.now() });
    await logAktivitas(ctx, cleanPhone, akun.nama, "Login", "Login berhasil");
    logResponse("adminLogin", { phone: cleanPhone, nama: akun.nama });
    return { token, phone: cleanPhone, nama: akun.nama, role: akun.role ?? "Admin" };
  },
});

export const adminLogout = mutation({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    logRequest("adminLogout", {});
    const sesi = await findSession(ctx, token);
    if (sesi) {
      const akun = await findAkun(ctx, sesi.phone);
      await ctx.db.delete(sesi._id);
      if (akun) await logAktivitas(ctx, akun.id, akun.nama, "Logout", "Keluar dari aplikasi");
    }
    return { ok: true };
  },
});

// ============================================================================
// PENDAFTARAN — akun Admin Master otomatis dibuat/dirawat
// ============================================================================

/**
 * Bootstrap Admin Master (082100000000 / makan123).
 *
 * Admin Master otomatis dibuat/dirawat setiap kali halaman login dibuka:
 * dibuat bila belum ada, dan role/status disinkronkan bila data lama tidak
 * sesuai. Password TIDAK ditampilkan di layar (halaman login menampilkan info
 * generik saja) dan password yang sudah diganti tidak di-reset.
 */
export const ensureDefaultAdmin = mutation({
  args: {},
  handler: async (ctx) => {
    logRequest("ensureDefaultAdmin", {});
    const { created } = await syncMasterAccount(ctx);
    logResponse("ensureDefaultAdmin", { phone: MASTER_PHONE, created });
    return { created, phone: MASTER_PHONE, password: "" };
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
    const cleanPhone = normalizePhone(phone);
    logRequest("registerAkun", { nama, phone: cleanPhone });
    if (!nama?.trim()) return badRequest("Nama wajib diisi");
    if (!/^0\d{8,13}$/.test(cleanPhone)) return badRequest("Nomor HP tidak valid — contoh: 082100000000");
    if (!password || password.length < 6) return badRequest("Password minimal 6 karakter");
    const existing = await findAkun(ctx, cleanPhone);
    if (existing) return badRequest("Nomor HP sudah terdaftar", { phone: cleanPhone });
    const isMaster = cleanPhone === MASTER_PHONE;
    await ctx.db.insert("akun", {
      id: cleanPhone,
      nama: nama.trim(),
      password: sha256Hex(password),
      status: isMaster ? "approved" : "pending",
      role: isMaster ? "Admin Master" : "Admin",
      createdAt: Date.now(),
    });
    await logAktivitas(
      ctx,
      cleanPhone,
      nama.trim(),
      isMaster ? "Daftar (Admin Master)" : "Daftar Akun Baru",
      isMaster ? "Disetujui otomatis" : "Menunggu persetujuan Admin Master",
    );
    logResponse("registerAkun", { phone: cleanPhone, status: isMaster ? "approved" : "pending" });
    return { status: isMaster ? "approved" : "pending", phone: cleanPhone };
  },
});

// ============================================================================
// GANTI PASSWORD — setiap user (Admin & Admin Master) mengganti password sendiri
// ============================================================================

export const changePassword = mutation({
  args: { token: v.string(), oldPassword: v.string(), newPassword: v.string() },
  handler: async (ctx, { token, oldPassword, newPassword }) => {
    logRequest("changePassword", {});
    const { akun } = await requireSession(ctx, token);
    if (!oldPassword) return badRequest("Password lama wajib diisi");
    if (!newPassword || newPassword.length < 6) return badRequest("Password baru minimal 6 karakter");
    if (akun.password !== sha256Hex(oldPassword)) return badRequest("Password lama salah");
    if (newPassword === oldPassword) return badRequest("Password baru harus berbeda dari password lama");
    await ctx.db.patch(akun._id, { password: sha256Hex(newPassword) });
    await logAktivitas(ctx, akun.id, akun.nama, "Ganti Password", "Password berhasil diganti");
    logResponse("changePassword", { phone: akun.id });
    return { ok: true, phone: akun.id };
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
    const cleanPhone = normalizePhone(phone);
    logRequest("approveAkun", { phone: cleanPhone });
    const master = await requireMaster(ctx, token);
    const target = await findAkun(ctx, cleanPhone);
    if (!target) return badRequest("Akun tidak ditemukan", { phone: cleanPhone });
    if (target.id === MASTER_PHONE) return badRequest("Akun Admin Master tidak dapat diubah");
    await ctx.db.patch(target._id, { status: "approved" });
    await logAktivitas(ctx, master.id, master.nama, "Setujui Akun", `${target.nama} (${cleanPhone})`);
    logResponse("approveAkun", { phone: cleanPhone });
    return { phone: cleanPhone, status: "approved" };
  },
});

export const rejectAkun = mutation({
  args: { token: v.string(), phone: v.string() },
  handler: async (ctx, { token, phone }) => {
    const cleanPhone = normalizePhone(phone);
    logRequest("rejectAkun", { phone: cleanPhone });
    const master = await requireMaster(ctx, token);
    const target = await findAkun(ctx, cleanPhone);
    if (!target) return badRequest("Akun tidak ditemukan", { phone: cleanPhone });
    if (target.id === MASTER_PHONE) return badRequest("Admin Master tidak dapat ditolak");
    await ctx.db.patch(target._id, { status: "rejected" });
    // Cabut semua sesi akun tsb
    const sesi = await (ctx.db.query("sessions") as any)
      .filter((q: any) => q.eq(q.field("phone"), cleanPhone))
      .collect();
    for (const s of sesi) await ctx.db.delete(s._id);
    await logAktivitas(ctx, master.id, master.nama, "Tolak Akun", `${target.nama} (${cleanPhone})`);
    logResponse("rejectAkun", { phone: cleanPhone });
    return { phone: cleanPhone, status: "rejected" };
  },
});

/**
 * Kick user biasa: cabut sesi aktif + tolak akun agar tidak bisa login lagi.
 * Admin Master tidak pernah bisa di-kick (validasi di sini).
 */
export const kickAkun = mutation({
  args: { token: v.string(), phone: v.string() },
  handler: async (ctx, { token, phone }) => {
    const cleanPhone = normalizePhone(phone);
    logRequest("kickAkun", { phone: cleanPhone });
    const master = await requireMaster(ctx, token);
    const target = await findAkun(ctx, cleanPhone);
    if (!target) return badRequest("Akun tidak ditemukan", { phone: cleanPhone });
    if (target.id === MASTER_PHONE) return badRequest("Admin Master tidak dapat di-kick");
    const sesi = await (ctx.db.query("sessions") as any)
      .filter((q: any) => q.eq(q.field("phone"), cleanPhone))
      .collect();
    for (const s of sesi) await ctx.db.delete(s._id);
    await ctx.db.patch(target._id, { status: "rejected" });
    await logAktivitas(ctx, master.id, master.nama, "Kick Akun", `${target.nama} (${cleanPhone})`);
    logResponse("kickAkun", { phone: cleanPhone });
    return { phone: cleanPhone, status: "rejected" };
  },
});
