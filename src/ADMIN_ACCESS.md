# 🔐 DOKUMEN AKSES & BUKU PANDUAN — PT Dapur Laut
**Sistem Manajemen Bisnis** | Dibuat: Agustus 2026

---

## 1. 🔑 AKUN ADMIN (Login Utama)

| Field | Nilai |
|-------|-------|
| **Nomor HP** | `082100000000` |
| **Password** | `makan123` |
| **Role** | Admin Master |
| **Status** | Aktif |

> ⚠️ **Ganti password** setelah pertama kali login untuk keamanan.

---

## 2. 🌐 DOMAIN & HOSTING

| Komponen | URL / Nilai |
|----------|-------------|
| **Domain Utama** | `https://dapurlaut.freebuff.app` |
| **Convex Backend** | `https://resilient-hawk-825.convex.cloud` |
| **Convex Site** | `https://resilient-hawk-825.convex.site` |
| **Convex Deployment** | `dev:resilient-hawk-825` |
| **Platform** | Freebuff WebContainer |

---

## 3. 🗄️ DATABASE (Convex)

| Item | Detail |
|------|--------|
| **Platform** | Convex (serverless) |
| **Deployment URL** | `https://resilient-hawk-825.convex.cloud` |
| **Deploy Key** | Ada di `.env.local` (variabel `CONVEX_DEPLOY_KEY`) |
| **Dashboard** | https://dashboard.convex.dev → pilih project `resilient-hawk-825` |

### Tabel Database (20 tabel):
1. `barang` — Master barang dagangan
2. `supplier` — Data supplier
3. `reseller` — Data reseller
4. `dpl` — Data DPL (Pasar grosir)
5. `pasar` — Data Pasar (Victoria/Tunas)
6. `karyawan` — Data karyawan
7. `absensi` — Rekap absensi harian
8. `utang` — Utang & Casbon karyawan
9. `invoice` — Invoice multi-barang (Supplier/Reseller/DPL/Pasar)
10. `retur` — Retur barang
11. `kas` — Kas harian (saldo berjalan)
12. `pengeluaran` — Pengeluaran operasional
13. `gudang` — Data stok gudang
14. `stokHistory` — Riwayat perubahan stok
15. `slipgaji` — Slip gaji karyawan
16. `katalog` — Katalog harga per pihak
17. `piutang` — Piutang (legacy)
18. `monitor` — Audit log aktivitas
19. `auditLog` — Log detail aktivitas
20. `aktivitas` — Aktivitas pengguna
21. `appSettings` — Pengaturan aplikasi
22. `pushSubscription` — Web push notification

---

## 4. 📦 BACKUP DATA

### Backup Manual (Convex Dashboard):
1. Buka https://dashboard.convex.dev
2. Pilih project `resilient-hawk-825`
3. Tab **Data** → klik **Export** → unduh ZIP
4. Simpan file ZIP sebagai backup

### Backup via CLI:
```bash
npx convex export --url https://resilient-hawk-825.convex.cloud
```

### Restore:
```bash
npx convex import --url https://resilient-hawk-825.convex.cloud <backup-file.zip>
```

---

## 5. 🛠️ API & LAYANAN PIHAK KETIGA

| Layanan | Kegunaan | Status |
|---------|----------|--------|
| **Convex** | Backend, Database, Realtime | ✅ Aktif |
| **Freebuff** | Hosting & Deploy | ✅ Aktif |
| **Cloudflare Workers AI** | OCR/AI untuk scan invoice | ✅ Terintegrasi |

### API Keys yang Digunakan:
- **CONVEX_DEPLOY_KEY** — Untuk deploy fungsi backend
- **VITE_CONVEX_URL** — URL backend Convex untuk frontend

> 💡 API keys disimpan di `.env.local` (tidak di-commit ke git)

---

## 6. 👥 AKUN PENGGUNA (Default)

| Nama | ID | Jabatan | Gaji Pokok |
|------|----|---------|------------|
| Andi Wijaya | KRY001 | Kepala Gudang | Rp 4.500.000 |
| Budi Santoso | KRY002 | Admin Keuangan | Rp 4.000.000 |
| Citra Lestari | KRY003 | Sales | Rp 3.800.000 |
| Dedi Kurniawan | KRY004 | Kurir | Rp 3.200.000 |

---

## 7. 📱 CARA AKSES

### Via Browser (Desktop/Mobile):
1. Buka `https://dapurlaut.freebuff.app`
2. Login dengan `082100000000` / `makan123`
3. Akses dashboard dan semua fitur

### Via APK Android (TWA):
1. Download APK dari GitHub Actions (lihat `twa/README.md`)
2. Install di HP Android
3. Login dengan kredensial yang sama

---

## 8. ⚙️ PENGATURAN SISTEM

### Server Environment Variables:
Variabel ini diatur di Convex Dashboard → Settings → Environment Variables:
- `JWT_PRIVATE_KEY` — Kunci privat JWT untuk autentikasi
- `SITE_URL` — URL aplikasi

### Frontend Environment Variables:
Diatur di Freebuff → Keys/API Keys:
- `VITE_CONVEX_URL` — URL backend Convex

---

## 9. 🔄 CARA DEPLOY UPDATE

### Otomatis (Freebuff):
- Edit kode → save → otomatis deploy ke production

### Manual (Convex):
```bash
# Deploy fungsi backend
npx convex dev --once

# Type check
npx tsc -b --noEmit
```

---

## 10. 🚨 TROUBLESHOOTING

| Masalah | Solusi |
|---------|--------|
| **Login gagal** | Hard refresh browser (Ctrl+Shift+R) |
| **Data tidak muncul** | Cek koneksi internet, lalu refresh |
| **Error "Server Error"** | Tunggu 1-2 menit (server mungkin restart) |
| **Stok salah** | Cek menu Gudang → Riwayat Stok |
| **Kas tidak balance** | Sistem otomatis rekalkulasi setiap perubahan |

---

## 11. 📞 KONTAK

| Role | Detail |
|------|--------|
| **PT Dapur Laut** | Perusahaan pemilik sistem |
| **Developer** | Buffy (Codebuff AI Assistant) |
| **Platform** | Freebuff WebContainer |

---

## 12. 📋 FITUR APLIKASI

| Menu | Fungsi |
|------|--------|
| **Dashboard** | Overview bisnis real-time |
| **Barang** | CRUD master barang |
| **Supplier** | Data supplier |
| **Reseller** | Data reseller |
| **DPL** | Data pasar grosir |
| **Pasar** | Data pasar retail (Victoria/Tunas) |
| **Karyawan** | Data karyawan |
| **Katalog Harga** | Harga khusus per pihak |
| **Absensi** | Absensi harian karyawan |
| **Utang** | Utang & Casbon karyawan |
| **Invoice** | Invoice multi-barang (Supplier/Reseller/DPL/Pasar) |
| **Piutang** | Tagihan outstanding |
| **Retur** | Retur barang |
| **Gudang** | Stok & riwayat perubahan |
| **Kas** | Kas harian (saldo berjalan) |
| **Slip Gaji** | Gaji karyawan (auto dari absensi/utang) |
| **Pengeluaran** | Pengeluaran operasional |
| **Laporan** | Laporan keuangan & stok |
| **Admin** | Manajemen akun pengguna |
| **Monitor** | Audit log & monitoring |
| **Tetesan** | Sistem drip/wholesale |

---

## 13. 🔐 KEAMANAN

1. **Ganti password default** setelah pertama kali login
2. **Backup data** secara berkala (minimal seminggu sekali)
3. **Jangan share** deploy key atau API keys ke orang lain
4. **Audit log** tersimpan di menu Monitor → bisa dicek kapan saja
5. **Semua transaksi** tercatat otomatis (tidak bisa dihapus tanpa jejak)

---

**Dokumen ini dibuat oleh Buffy (Codebuff AI) — Agustus 2026**
**Simpan dokumen ini di tempat aman! 🔒**
