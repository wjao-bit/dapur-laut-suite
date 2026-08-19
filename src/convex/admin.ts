import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// ============================================================================
// AKUN ADMIN & SESI — login nomor HP + password (hash SHA-256).
// Fully self-contained — no imports from lib.ts to avoid esbuild bundling issues.
// ============================================================================

export const MASTER_PHONE = "082100000000";
export const MASTER_DEFAULT_PASSWORD = "makan123";
export const MASTER_OLD_DEFAULT_PASSWORD = "admin123";

// ---- Inline helpers (from lib.ts) to keep this module self-contained ----

function logRequest(route: string, payload: unknown) {
  console.log(`[Dapur Laut] ${route} request:`, JSON.stringify(payload, null, 2));
}

function logResponse(route: string, payload: unknown) {
  console.log(`[Dapur Laut] ${route} response:`, JSON.stringify(payload, null, 2));
}

function badRequest(message: string, extra?: unknown): never {
  console.error(`[Dapur Laut] Invalid request:`, message, extra ?? "");
  throw new (Error as any)(message);
}

function genId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

async function logAktivitas(
  ctx: any,
  phone: string,
  nama: string,
  aksi: string,
  detail?: string,
) {
  try {
    await ctx.db.insert("aktivitas", {
      id: genId("AKT"),
      phone,
      nama: nama || phone,
      aksi,
      detail: detail ?? "",
      createdAt: Date.now(),
    });
  } catch {
    // aktivitas table might not exist yet — ignore
  }
}

// ---- Pure JavaScript SHA-256 (FIPS 180-4 compliant) ----

function sha256Hex(input: string): string {
  const K = [
    0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,
    0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,
    0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,
    0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,
    0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,
    0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,
    0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,
    0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2,
  ];
  const rotR = (x: number, n: number) => (x >>> n) | (x << (32 - n));
  const ch = (x: number, y: number, z: number) => (x & y) ^ (~x & z);
  const maj = (x: number, y: number, z: number) => (x & y) ^ (x & z) ^ (y & z);
  const bigS0 = (x: number) => rotR(x, 2) ^ rotR(x, 13) ^ rotR(x, 22);
  const bigS1 = (x: number) => rotR(x, 6) ^ rotR(x, 11) ^ rotR(x, 25);
  const smS0 = (x: number) => rotR(x, 7) ^ rotR(x, 18) ^ (x >>> 3);
  const smS1 = (x: number) => rotR(x, 17) ^ rotR(x, 19) ^ (x >>> 10);

  const bytes = new TextEncoder().encode(input);
  const bitLen = bytes.length * 8;
  const padLen = (64 - ((bytes.length + 9) % 64)) % 64;
  const msg = new Uint8Array(bytes.length + 1 + padLen + 8);
  msg.set(bytes);
  msg[bytes.length] = 0x80;
  const dv = new DataView(msg.buffer);
  dv.setUint32(msg.length - 8, Math.floor(bitLen / 0x100000000), false);
  dv.setUint32(msg.length - 4, bitLen >>> 0, false);

  let h0 = 0x6a09e667, h1 = 0xbb67ae85, h2 = 0x3c6ef372, h3 = 0xa54ff53a;
  let h4 = 0x510e527f, h5 = 0x9b05688c, h6 = 0x1f83d9ab, h7 = 0x5be0cd19;

  for (let i = 0; i < msg.length; i += 64) {
    const W = new Array<number>(64);
    for (let j = 0; j < 16; j++) W[j] = dv.getUint32(i + j * 4, false);
    for (let j = 16; j < 64; j++) W[j] = (smS1(W[j - 2]) + W[j - 7] + smS0(W[j - 15]) + W[j - 16]) | 0;

    let a = h0, b = h1, c = h2, d = h3, e = h4, f = h5, g = h6, h = h7;
    for (let j = 0; j < 64; j++) {
      const T1 = (h + bigS1(e) + ch(e, f, g) + K[j] + W[j]) | 0;
      const T2 = (bigS0(a) + maj(a, b, c)) | 0;
      h = g; g = f; f = e; e = (d + T1) | 0;
      d = c; c = b; b = a; a = (T1 + T2) | 0;
    }
    h0 = (h0 + a) | 0; h1 = (h1 + b) | 0; h2 = (h2 + c) | 0; h3 = (h3 + d) | 0;
    h4 = (h4 + e) | 0; h5 = (h5 + f) | 0; h6 = (h6 + g) | 0; h7 = (h7 + h) | 0;
  }
  return [h0, h1, h2, h3, h4, h5, h6, h7]
    .map((v) => (v >>> 0).toString(16).padStart(8, "0"))
    .join("");
}

// ---- Helper functions ----

function normalizePhone(raw: string): string {
  return String(raw || "").replace(/[^\d]/g, "").trim();
}

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

async function requireSession(ctx: any, token: string) {
  const sesi = await findSession(ctx, token);
  if (!sesi) return badRequest("Sesi tidak valid — silakan masuk kembali");
  const akun = await findAkun(ctx, sesi.phone);
  if (!akun || akun.status !== "approved") return badRequest("Akun tidak aktif — silakan masuk kembali");
  return { sesi, akun };
}

export async function requireMaster(ctx: any, token: string) {
  const { akun } = await requireSession(ctx, token);
  if ((akun.role ?? "Admin") !== "Admin Master") {
    return badRequest("Hanya Admin Master yang dapat melakukan aksi ini");
  }
  return akun;
}

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
// PENDAFTARAN
// ============================================================================

export const ensureDefaultAdmin = mutation({
  args: {},
  handler: async (ctx) => {
    logRequest("ensureDefaultAdmin", {});
    const { created } = await syncMasterAccount(ctx);
    logResponse("ensureDefaultAdmin", { phone: MASTER_PHONE, created });
    return { created, phone: MASTER_PHONE, password: "" };
  },
});

export const registerAkun = mutation({
  args: { nama: v.string(), phone: v.string(), password: v.string() },
  handler: async (ctx, { nama, phone, password }) => {
    const cleanPhone = normalizePhone(phone);
    logRequest("registerAkun", { nama, phone: cleanPhone });
    if (!nama?.trim()) return badRequest("Nama wajib diisi");
    if (!/^0\d{8,13}$/.test(cleanPhone)) return badRequest("Nomor HP tidak valid");
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
    await logAktivitas(ctx, cleanPhone, nama.trim(),
      isMaster ? "Daftar (Admin Master)" : "Daftar Akun Baru",
      isMaster ? "Disetujui otomatis" : "Menunggu persetujuan Admin Master");
    return { status: isMaster ? "approved" : "pending", phone: cleanPhone };
  },
});

// ============================================================================
// GANTI PASSWORD
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
    return { ok: true, phone: akun.id };
  },
});

export const resetPasswordPublic = mutation({
  args: { phone: v.string(), newPassword: v.string() },
  handler: async (ctx, { phone, newPassword }) => {
    const cleanPhone = normalizePhone(phone);
    logRequest("resetPasswordPublic", { phone: cleanPhone });
    if (!cleanPhone) return badRequest("Nomor HP wajib diisi");
    if (!newPassword || newPassword.length < 6) return badRequest("Password baru minimal 6 karakter");
    const akun = await findAkun(ctx, cleanPhone);
    if (!akun) return badRequest("Nomor HP tidak terdaftar di sistem");
    if (akun.status !== "approved") return badRequest("Akun belum disetujui admin");
    await ctx.db.patch(akun._id, { password: sha256Hex(newPassword) });
    await logAktivitas(ctx, akun.id, akun.nama, "Reset Password (lupa)", "Password direset dari halaman login");
    return { ok: true, phone: akun.id };
  },
});

// ============================================================================
// KELOLA AKUN (KHUSUS ADMIN MASTER)
// ============================================================================

export const listAkun = query({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    logRequest("listAkun", {});
    await requireMaster(ctx, token);
    const rows = await ctx.db.query("akun").collect();
    const out = rows
      .map((a: any) => ({ phone: a.id, nama: a.nama, status: a.status, role: a.role ?? "Admin", createdAt: a.createdAt }))
      .sort((a: any, b: any) => b.createdAt - a.createdAt);
    return out;
  },
});

export const approveAkun = mutation({
  args: { token: v.string(), phone: v.string() },
  handler: async (ctx, { token, phone }) => {
    const cleanPhone = normalizePhone(phone);
    const master = await requireMaster(ctx, token);
    const target = await findAkun(ctx, cleanPhone);
    if (!target) return badRequest("Akun tidak ditemukan");
    if (target.id === MASTER_PHONE) return badRequest("Akun Admin Master tidak dapat diubah");
    await ctx.db.patch(target._id, { status: "approved" });
    await logAktivitas(ctx, master.id, master.nama, "Setujui Akun", `${target.nama} (${cleanPhone})`);
    return { phone: cleanPhone, status: "approved" };
  },
});

export const rejectAkun = mutation({
  args: { token: v.string(), phone: v.string() },
  handler: async (ctx, { token, phone }) => {
    const cleanPhone = normalizePhone(phone);
    const master = await requireMaster(ctx, token);
    const target = await findAkun(ctx, cleanPhone);
    if (!target) return badRequest("Akun tidak ditemukan");
    if (target.id === MASTER_PHONE) return badRequest("Admin Master tidak dapat ditolak");
    await ctx.db.patch(target._id, { status: "rejected" });
    const sesi = await (ctx.db.query("sessions") as any)
      .filter((q: any) => q.eq(q.field("phone"), cleanPhone))
      .collect();
    for (const s of sesi) await ctx.db.delete(s._id);
    await logAktivitas(ctx, master.id, master.nama, "Tolak Akun", `${target.nama} (${cleanPhone})`);
    return { phone: cleanPhone, status: "rejected" };
  },
});

export const kickAkun = mutation({
  args: { token: v.string(), phone: v.string() },
  handler: async (ctx, { token, phone }) => {
    const cleanPhone = normalizePhone(phone);
    const master = await requireMaster(ctx, token);
    const target = await findAkun(ctx, cleanPhone);
    if (!target) return badRequest("Akun tidak ditemukan");
    if (target.id === MASTER_PHONE) return badRequest("Admin Master tidak dapat di-kick");
    const sesi = await (ctx.db.query("sessions") as any)
      .filter((q: any) => q.eq(q.field("phone"), cleanPhone))
      .collect();
    for (const s of sesi) await ctx.db.delete(s._id);
    await ctx.db.patch(target._id, { status: "rejected" });
    await logAktivitas(ctx, master.id, master.nama, "Kick Akun", `${target.nama} (${cleanPhone})`);
    return { phone: cleanPhone, status: "rejected" };
  },
});
