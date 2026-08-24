# 📦 Dokumen Serah Terima — Dapur Laut (Sistem Manajemen Bisnis)

Tanggal: 24 Agustus 2026

---

## 1. Source Code Aplikasi

Seluruh source code ada di root project ini:

| Folder/File | Isi |
|---|---|
| `src/pages/` | Semua halaman (landing, auth, dashboard, invoice, barang masuk, dll.) |
| `src/components/` | Komponen UI (shadcn/ui + komponen app) |
| `src/convex/` | **Backend + database schema** (Convex functions) |
| `src/main.tsx` | Router & entry point |
| `src/index.css` | Tema warna (Tailwind v4, oklch) |
| `scripts/test-*.cjs` | Test logika bisnis (`node scripts/test-batch-masuk.cjs`) |
| `package.json` | Daftar dependensi |

**Cara menjalankan sendiri** (di luar Freebuff):
```bash
npm install
npx convex dev        # butuh akses Convex deployment
npm run dev           # frontend Vite
```

---

## 2. Database dan Backup

### Struktur
Database = **Convex Cloud**, deployment `resilient-hawk-825.convex.cloud`.
Schema didefinisikan di `src/convex/schema.ts` — tabel utama antara lain:
users, invoice (+items), batchMasuk, batchAlokasi, kas, stokHistory, piutang,
supplier/reseller/dpl/pasar, barang, notif/pushSubscription, auditLog.

### Cara backup (ambil seluruh data)
Jalankan dari folder project dengan CLI Convex yang sudah login:
```bash
npx convex export --path backup-$(date +%Y%m%d).zip
```
Hasilnya file `.zip` berisi seluruh dokumen semua tabel (format JSONL per tabel).
Untuk restore:
```bash
npx convex import --replace-all backup-YYYYMMDD.zip
```
> ⚠️ `--replace-all` menimpa data lama — jangan dijalankan tanpa yakin.

Backup juga bisa dijadwalkan otomatis lewat fitur snapshot Convex Dashboard
(convex.cloud → Settings → Snapshots).

---

## 3. Hosting / Server

| Komponen | Penyedia | Akses |
|---|---|---|
| Frontend (web app) | Freebuff (Vite, di-build otomatis tiap perubahan) | Akun Freebuff Anda |
| Backend + Database | Convex Cloud (`resilient-hawk-825`) | Akun Convex Anda (dashboard.convex.dev → project "resilient-hawk") |

Tidak ada server VPS yang dikelola manual — semuanya managed.
Kredensial hosting hanya bisa diberikan oleh pemilik akun Freebuff/Convex
(yaitu Anda), bukan dari dalam aplikasi.

---

## 4. Domain

Saat ini **belum ada domain kustom** — aplikasi berjalan di URL preview
Freebuff. Kalau ingin pakai domain sendiri (mis. `dapurlaut.com`):
1. Beli domain di registrar mana pun.
2. Hubungkan lewat pengaturan publishing Freebuff (custom domain).

---

## 5. Akun OWNER / Administrator Utama

- Login memakai **Email OTP** (kode 6 digit dikirim ke email) — tidak ada password.
- Akun pertama yang mendaftar adalah pemilik; role user disimpan di tabel
  `users` (field `role`).
- Untuk mengangkat/menurunkan admin lain: ubah field `role` user tersebut
  lewat menu manajemen pengguna di dashboard, atau via Convex Dashboard
  (Data → users).
- Kalau kehilangan akses email owner, akses dipulihkan lewat email asli
  (login OTP ke email yang sama).

## 6. Email / Akun yang Terhubung

- Email hanya dipakai untuk **kirim kode OTP login** (via Convex Auth).
- Belum ada integrasi layanan email pihak ketiga (SMTP/SendGrid dsb.) yang aktif.
- Notifikasi push browser memakai Web Push (tabel `pushSubscription`),
  kunci VAPID dibaca dari environment variable backend.

## 7. API Key / Layanan Pihak Ketiga

Semua key dikelola lewat menu **Keys/API keys** di platform (jangan ditulis di .env manual):

| Key | Fungsi |
|---|---|
| `VLY_INTEGRATION_KEY` | Gateway AI/email/payment bawaan platform (lihat `integrations.md`) |
| `CONVEX_DEPLOY_KEY` | Push fungsi Convex (otomatis, internal) |
| JWKS / JWT_PRIVATE_KEY / SITE_URL | Kunci signing auth Convex (internal) |

Aplikasi saat ini **tidak memanggil layanan eksternal berbayar** selain
gateway platform di atas.

## 8. Masalah "Client Not Found" (kadang-kadang)

Pesan itu **tidak berasal dari kode aplikasi** — ini error sementara dari
lapisan Convex di sisi klien. Pemicu yang paling umum:

1. **Push/deploy Convex sedang berlangsung** — sesaat fungsi belum siap,
   koneksi WebSocket klien putus lalu menyambung lagi sendiri.
2. **Jaringan Android tidak stabil** — Chrome menahan request sampai online lagi.
3. **Cache PWA lama** di HP petugas — solusi: tutup tab/app, buka lagi;
   kalau bandel: Chrome → Setelan → Site settings → hapus data situs tsb.

Yang sudah/sedang dilakukan agar jarang terjadi:
- Pastikan push Convex selalu sukses sebelum dipakai (status build terlihat
  di panel Freebuff).
- Halaman punya fallback statis ("sedang dimuat…") supaya tidak blank.

**Kalau mau, saya bisa tambahkan auto-retry + pesan ramah bahasa Indonesia**
("Koneksi tersambung ulang, coba klik lagi") untuk kondisi ini — tinggal bilang.

---

## 9. Ringkasan Checklist Serah Terima

- [x] Source code — folder project ini (bisa diunduh/export)
- [ ] Backup data — jalankan `npx convex export` (butuh login Convex milik Anda)
- [x] Info hosting — Freebuff (frontend) + Convex Cloud (backend/DB)
- [ ] Akses hosting — lewat akun Freebuff & Convex milik Anda
- [x] Domain — belum ada; opsional beli & hubungkan
- [x] Akun owner — email OTP ke email pendaftar; role di tabel users
- [x] Email terhubung — hanya untuk OTP login
- [x] API key — dikelola di menu Keys platform (daftar di atas)
