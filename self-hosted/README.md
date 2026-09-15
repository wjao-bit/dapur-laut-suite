# Self-Host Convex (tanpa batas biaya Convex Cloud)

Setup ini menjalankan backend + database Convex open-source di server Anda
sendiri (VPS/docker), sehingga aplikasi tidak lagi bergantung pada deployment
Convex Cloud yang bisa dinonaktifkan karena melewati batas biaya
("You have exceeded your spending limits").

Kode aplikasi TIDAK berubah — hanya alamat servernya (`VITE_CONVEX_URL`) yang
diarahkan ke backend milik Anda.

## Kebutuhan

- Server/VPS Linux dengan Docker + Docker Compose (RAM 1–2 GB cukup untuk awal)
- Node.js 18+ di mesin yang dipakai untuk deploy fungsi (bisa laptop sendiri)
- Untuk produksi: domain + HTTPS (lihat bagian Produksi)

## 1. Jalankan backend

```bash
cd self-hosted
cp .env.example .env
# isi INSTANCE_SECRET: openssl rand -hex 32
docker compose up -d
```

Backend berjalan di port `3210` (API) dan `3211` (HTTP actions/auth),
dashboard admin di port `6791`.

## 2. Buat admin key

```bash
docker compose exec backend ./generate_admin_key.sh
```

Simpan hasilnya (format `nama-instance|xxxx...`). Key ini dipakai untuk deploy
dan untuk login ke dashboard (http://IP-server:6791).

## 3. Deploy fungsi + setup auth

Dari root repo (setelah `npm install`):

```bash
CONVEX_SELF_HOSTED_URL=http://127.0.0.1:3210 \
CONVEX_SELF_HOSTED_ADMIN_KEY='<admin key dari langkah 2>' \
SITE_URL=https://domain-aplikasi-anda.com \
node scripts/setup-self-hosted.mjs
```

Skrip ini otomatis:
- membuat kunci JWT (RS256) untuk Convex Auth dan menyimpannya sebagai
  `JWT_PRIVATE_KEY` + `JWKS`
- mengeset `SITE_URL`, `VLY_CONVEX_AUTH_ISSUER`, `VLY_APP_NAME`
- men-deploy seluruh fungsi di `src/convex/`

Env var opsional lain (mis. `OPENAI_API_KEY`, `GEMINI_API_KEY`,
`CF_ACCOUNT_ID`, `CF_API_TOKEN` untuk fitur OCR/AI) bisa diset dengan:

```bash
CONVEX_SELF_HOSTED_URL=... CONVEX_SELF_HOSTED_ADMIN_KEY=... \
npx convex env set OPENAI_API_KEY sk-...
```

## 4. Arahkan aplikasi ke backend baru

Set `VITE_CONVEX_URL` ke URL backend Anda, lalu build/jalankan frontend:

```bash
# development lokal
VITE_CONVEX_URL=http://127.0.0.1:3210 npm run dev

# build produksi
VITE_CONVEX_URL=https://convex.domain-anda.com npm run build
```

Jika frontend masih dipublish lewat Freebuff/vly, isi `VITE_CONVEX_URL` di
menu **Keys / API keys** proyek dengan URL backend self-hosted Anda.

## Produksi (domain + HTTPS)

Browser memblokir koneksi `http://` dari situs `https://`, jadi untuk
produksi backend WAJIB di belakang HTTPS. Cara umum: reverse proxy
(Caddy/Nginx/Traefik) dengan dua subdomain:

- `https://convex.domain-anda.com` → port `3210`
- `https://convex-site.domain-anda.com` → port `3211`

Lalu di `self-hosted/.env` set:

```
CONVEX_CLOUD_ORIGIN=https://convex.domain-anda.com
CONVEX_SITE_ORIGIN=https://convex-site.domain-anda.com
NEXT_PUBLIC_DEPLOYMENT_URL=https://convex.domain-anda.com
```

dan restart: `docker compose up -d`. `VITE_CONVEX_URL` diisi
`https://convex.domain-anda.com`.

Contoh Caddyfile:

```
convex.domain-anda.com {
  reverse_proxy 127.0.0.1:3210
}
convex-site.domain-anda.com {
  reverse_proxy 127.0.0.1:3211
}
```

## Memindahkan data lama (opsional)

Jika deployment Convex Cloud lama sudah aktif kembali (atau sebelum
dinonaktifkan), data bisa dipindah dengan export/import:

```bash
# export dari cloud (perlu deployment lama aktif)
npx convex export --path backup.zip

# import ke self-hosted
CONVEX_SELF_HOSTED_URL=... CONVEX_SELF_HOSTED_ADMIN_KEY=... \
npx convex import backup.zip
```

## Catatan

- Data tersimpan di volume Docker `data` (SQLite bawaan). Backup rutin:
  `docker compose exec backend tar czf - /convex/data > backup.tgz`,
  atau gunakan Postgres dengan mengisi `POSTGRES_URL` di `.env`.
- Dokumentasi resmi: https://github.com/get-convex/convex-backend/tree/main/self-hosted
