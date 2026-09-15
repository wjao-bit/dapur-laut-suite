# Panduan Deploy ke VPS + Domain Sendiri (Web + APK)

Setelah PR self-hosted Convex di-merge, ikuti langkah ini untuk
memindahkan seluruh aplikasi ke domain Anda sendiri.

## 0. Yang Anda butuhkan

- VPS Ubuntu 24.04 (RAM 2 GB) — rekomendasi: Hetzner CX21 / DigitalOcean $6–$12
- Domain Anda sendiri, contoh: `dapurlaut.com`
- Akses DNS untuk bikin 3 record A:
  - `app.dapurlaut.com` → IP VPS
  - `convex.dapurlaut.com` → IP VPS
  - `convex-site.dapurlaut.com` → IP VPS

## 1. Setup VPS

SSH ke VPS, lalu:

```bash
# 1.1 Install Docker Engine + Docker Compose plugin
sudo apt update
sudo apt install -y ca-certificates curl gnupg
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo $VERSION_CODENAME) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# 1.2 Install Caddy
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update
sudo apt install -y caddy
```

## 2. Clone repo + persiapkan environment

```bash
git clone https://github.com/wjao-bit/dapur-laut-suite.git
cd dapur-laut-suite
npm install
```

Salin konfigurasi backend:

```bash
cp self-hosted/.env.example self-hosted/.env
# Edit self-hosted/.env — ganti domain & buat INSTANCE_SECRET (openssl rand -hex 32)
```

Minimal yang WAJIB diisi:

```
CONVEX_CLOUD_ORIGIN=https://convex.dapurlaut.com
CONVEX_SITE_ORIGIN=https://convex-site.dapurlaut.com
NEXT_PUBLIC_DEPLOYMENT_URL=https://convex.dapurlaut.com
INSTANCE_NAME=dapur-laut
INSTANCE_SECRET=<isi>
DISABLE_BEACON=true
```

## 3. Jalankan backend Convex self-hosted

```bash
cd self-hosted
sudo docker compose up -d
cd ..
```

Ambil admin key:

```bash
sudo docker compose -f self-hosted/docker-compose.yml exec backend ./generate_admin_key.sh
```

## 4. Deploy fungsi + seed demo

```bash
# Ganti domain dan admin key sesuai milik Anda
CONVEX_SELF_HOSTED_URL=https://convex.dapurlaut.com \
CONVEX_SELF_HOSTED_ADMIN_KEY='<admin key>' \
SITE_URL=https://app.dapurlaut.com \
node scripts/setup-self-hosted.mjs

# Seed data demo (opsional — termasuk akun Admin Master: 082100000000 / makan123)
CONVEX_SELF_HOSTED_URL=https://convex.dapurlaut.com \
CONVEX_SELF_HOSTED_ADMIN_KEY='<admin key>' \
npx convex run seed:seedDemo
```

## 5. Setup web server (Caddy)

```bash
# Pilih domain Anda
DOMAIN=dapurlaut.com

# Siapkan direktori web
sudo mkdir -p /var/www/dapurlaut
echo "<!DOCTYPE html><html><body>Belum build</body></html>" | sudo tee /var/www/dapurlaut/index.html

# Ganti domain di Caddyfile.example, lalu salin
sed -e "s/app\.domain-anda\.com/app.${DOMAIN}/g" \
    -e "s/convex\.domain-anda\.com/convex.${DOMAIN}/g" \
    -e "s/convex-site\.domain-anda\.com/convex-site.${DOMAIN}/g" \
    self-hosted/Caddyfile.example | sudo tee /etc/caddy/Caddyfile

sudo systemctl reload caddy
```

## 6. Build & deploy frontend

```bash
DOMAIN=dapurlaut.com
VITE_CONVEX_URL=https://convex.${DOMAIN} npm run build
sudo cp -r dist/* /var/www/dapurlaut/
sudo chown -R caddy:caddy /var/www/dapurlaut
```

Sekarang buka `https://app.dapurlaut.com` dan login dengan akun Owner Anda.

## 7. Buat APK Android (TWA) untuk domain baru

### 7.1 Update konfigurasi APK

```bash
DOMAIN=dapurlaut.com
node scripts/configure-domain.mjs --domain ${DOMAIN}
```

Skrip ini otomatis memperbarui:
- `public/manifest.webmanifest` (start_url, scope, id)
- `twa/twa-manifest.json` (host, icons, manifest URL)
- `public/.well-known/assetlinks.json` (placeholder fingerprint)

### 7.2 Build & sign APK

Di lokal (bukan VPS):

```bash
npm install -g @bubblewrap/cli
cd twa

# Buat keystore — catat passphrase!
keytool -genkeypair -v -keystore android.keystore -alias dapurlaut \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -storepass dapurlaut123 -keypass dapurlaut123 \
  -dname "CN=PT Dapur Laut, OU=IT, O=PT Dapur Laut, L=Batam, ST=Kepulauan Riau, C=ID"

bubblewrap build --skipPwaValidation \
  --keystorePath android.keystore --keystorePass dapurlaut123 \
  --keyPass dapurlaut123 --keyAlias dapurlaut
```

Hasil: `twa/app-release-signed.apk`.

### 7.3 Tangkap SHA-256 fingerprint

```bash
keytool -list -v -keystore twa/android.keystore -alias dapurlaut -storepass dapurlaut123 | grep "SHA256"
```

Salin nilai `SHA256:` (misal `AA:BB:...:FF`) kemudian:

```bash
node scripts/configure-domain.mjs --domain dapurlaut.com --fingerprint "AA:BB:...:FF"
```

Rebuild web + upload ulang ke VPS. Reinstall APK di HP.

## 8. Backup data

```bash
# Cadangkan volume backend
sudo docker compose -f self-hosted/docker-compose.yml exec backend tar czf - /convex/data > dapur-laut-data-$(date +%Y%m%d).tgz

# Export Convex (rekomendasi rutin)
CONVEX_SELF_HOSTED_URL=https://convex.dapurlaut.com \
CONVEX_SELF_HOSTED_ADMIN_KEY='<admin key>' \
npx convex export --path backup-$(date +%Y%m%d).zip
```

## Troubleshooting

| Masalah | Solusi |
|---|---|
| Web putih / semua query error | Cek `VITE_CONVEX_URL` di build; cek Caddy reverse proxy ke port 3210/3211 |
| APK tampil URL bar | Fingerprint SHA-256 belum benar atau assetlinks.json belum terdeploy |
| APK tidak bisa install/update | Keystore berbeda — gunakan keystore yang sama dari rilis pertama |
| Backend tidak jalan | Cek log: `sudo docker compose -f self-hosted/docker-compose.yml logs -f backend` |
