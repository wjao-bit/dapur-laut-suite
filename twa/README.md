# APK Android — PT Dapur Laut (TWA / Bubblewrap)

Folder ini berisi konfigurasi untuk membuat **APK Android sungguhan** yang
membungkus aplikasi web Dapur Laut. Hasilnya satu file `app-release-signed.apk`
yang bisa di-install manual dan dikirim lewat WhatsApp.

> Prasyarat terpenting: **situs publish harus hidup dan normal**
> (`https://dapurlaut.freebuff.app`), karena APK ini hanya "pembungkus" yang
> membuka situs tersebut. Pastikan halaman login di URL publish sudah bisa
> dipakai sebelum membagikan APK.

---

## Cara 1 — Otomatis dengan GitHub Actions (paling mudah, tanpa install apa pun)

1. **Upload proyek ini ke GitHub**
   - Buka https://github.com/new → buat repo baru (boleh Private) → jangan centang apa pun.
   - Di PC: `git init`, `git add .`, `git commit -m "init"`, lalu
     `git remote add origin https://github.com/<namamu>/<nama-repo>.git`,
     `git push -u origin main`.
   - (Atau upload lewat web GitHub: tombol "uploading an existing file" lalu
     seret semua file proyek.)

2. **Jalankan workflow**
   - Buka repo → tab **Actions** → klik workflow **"Build APK — PT Dapur Laut"**.
   - Klik **"Run workflow"** → tunggu ±5–10 menit (pertama kali mengunduh
     Android SDK + Gradle).

3. **Unduh APK**
   - Setelah hijau (✅), buka hasilnya → bagian **Artifacts** →
     unduh **`dapurlaut-apk`** → di dalamnya ada **`app-release-signed.apk`**.
   - Kirim file itu via WhatsApp ke HP Android yang mau dipasang.

4. **Install di Android**
   - Buka file APK di HP (dari WhatsApp).
   - Kalau muncul peringatan "Instal dari sumber tidak dikenal", izinkan
     (Setelan → Keamanan → **Instal aplikasi tidak dikenal** → izinkan WhatsApp/File Manager).
   - Ikon **Dapur Laut** muncul di layar utama — buka seperti aplikasi biasa.

---

## Cara 2 — Build di PC sendiri (opsional, butuh Java + Android SDK)

```
npm install -g @bubblewrap/cli
cd twa
# siapkan android.keystore sekali (lihat di bawah)
keytool -genkeypair -v -keystore android.keystore -alias dapurlaut \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -storepass dapurlaut123 -keypass dapurlaut123 \
  -dname "CN=PT Dapur Laut, OU=IT, O=PT Dapur Laut, L=Batam, ST=Kepulauan Riau, C=ID"
bubblewrap build --skipPwaValidation \
  --keystorePath android.keystore --keystorePass dapurlaut123 \
  --keyPass dapurlaut123 --keyAlias dapurlaut
```

Hasil: `twa/app-release-signed.apk`.

---

## Membuat aplikasi tampil FULLSCREEN tanpa address bar (assetlinks)

Tanpa langkah ini APK tetap jalan, tapi Android akan membuka situs lewat
Chrome (dengan UI browser). Supaya benar-benar seperti aplikasi native
(fullscreen, tanpa URL bar), pasang **Digital Asset Links**:

1. Dari hasil workflow, lihat log langkah **"Cetak fingerprint SHA-256"** →
   salin nilai `SHA256:` (contoh `AA:BB:...:FF`).
2. Ganti isi `public/.well-known/assetlinks.json` di proyek ini dengan template
   di bawah (ganti `GANTI_DENGAN_SHA256_FINGERPRINT`):

```json
[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "com.dapurlaut.bisnis",
      "sha256_cert_fingerprints": ["GANTI_DENGAN_SHA256_FINGERPRINT"]
    }
  }
]
```

3. Simpan → publish ulang situs → cek di browser:
   `https://dapurlaut.freebuff.app/.well-known/assetlinks.json`
   (harus menampilkan JSON di atas).
4. Reinstall APK. Verifikasi berhasil kalau aplikasi terbuka fullscreen
   tanpa alamat URL.

**Tips:** kirim saja fingerprint-nya ke asisten yang mengerjakan aplikasi ini —
dia bisa memasang file assetlinks-nya untuk kamu.

---

## Keystore & update versi berikutnya (PENTING)

- File `android.keystore` adalah **kunci tanda tangan** APK. Simpan baik-baik
  (artefak `android-keystore` di hasil workflow, atau salin ke tempat aman).
- **Update APK**: APK versi baru HANYA bisa di-install di atas versi lama jika
  ditandatangani dengan keystore yang SAMA. Cara:
  1. Konversi keystore lama ke base64: `base64 -w0 android.keystore`
  2. GitHub → Settings → Secrets and variables → Actions → **New secret**:
     nama `KEYSTORE_BASE64`, isi hasil base64.
  3. Workflow berikutnya otomatis memakai secret itu. Naikkan
     `appVersion` (versi kode) di `twa/twa-manifest.json` saat rilis baru.

- Password keystore bawaan workflow: `dapurlaut123`.
  Untuk produksi sebaiknya ganti — sesuaikan di workflow dan di perintah build.

---

## Ganti alamat situs

Kalau URL publish berubah, edit `twa/twa-manifest.json`:
`host`, `webManifestUrl`, `iconUrl`, `maskableIconUrl`, `monochromeIconUrl` →
sesuaikan dengan domain baru, lalu build ulang.

## Troubleshooting

| Masalah | Solusi |
|---|---|
| Workflow gagal di langkah "Install Bubblewrap" | Coba jalankan ulang (jaringan GitHub sesaat) |
| APK terpasang tapi tampil putih | Situs publish-nya yang rusak — perbaiki dulu publish-nya, lalu install APK baru |
| APK tidak bisa di-update ("app not installed") | Keystore tidak sama — pakai `KEYSTORE_BASE64` dari keystore pertama |
| Tidak fullscreen / ada URL bar | assetlinks belum benar — cek langkah fullscreen di atas |
