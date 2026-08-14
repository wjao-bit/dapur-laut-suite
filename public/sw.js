// ============================================================================
// SERVICE WORKER — PT Dapur Laut
//
// Membuat aplikasi bisa DIINSTAL (PWA) di Android, iPhone, dan PC, plus akses
// offline untuk aset yang sudah pernah dimuat.
//
// Strategi cache:
//   - Navigasi (mode "navigate") : network-first, fallback ke halaman utama
//     yang tersimpan — SPA bisa dibuka walau offline.
//   - Aset statis (hashed /assets/*, ikon, manifest) : cache-first, diperbarui
//     di latar belakang.
//   - API Convex / domain lain : selalu lewat jaringan (tidak di-cache).
// ============================================================================
const CACHE = "dapur-laut-v1";

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  // Hanya tangani aset dari domain sendiri — API Convex & layanan lain
  // (mis. OCR tesseract, WA) selalu lewat jaringan.
  if (url.origin !== self.location.origin) return;

  // Navigasi SPA: coba jaringan dulu; bila gagal, buka halaman utama yang
  // sudah di-cache agar aplikasi tetap bisa dibuka saat offline.
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res && res.status === 200) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put("/", copy)).catch(() => {});
          }
          return res;
        })
        .catch(() =>
          caches.match("/").then((r) => r || caches.match(req.url)),
        ),
    );
    return;
  }

  // Aset statis: cache-first + refresh latar belakang.
  event.respondWith(
    caches.match(req).then((cached) => {
      const fetchPromise = fetch(req)
        .then((res) => {
          if (res && res.status === 200 && res.type === "basic") {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
          }
          return res;
        })
        .catch(() => cached);
      return cached || fetchPromise;
    }),
  );
});
