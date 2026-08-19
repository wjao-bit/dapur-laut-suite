// ============================================================================
// SERVICE WORKER — PT Dapur Laut
//
// Membuat aplikasi bisa DIINSTAL (PWA) di Android, iPhone, dan PC, plus akses
// offline untuk aset yang sudah pernah dimuat, dan MENERIMA NOTIFIKASI WEB
// PUSH dari server (pengingat tenggat invoice) walau aplikasi sedang ditutup.
//
// Strategi cache:
//   - Navigasi (mode "navigate") : network-first dengan `cache: "no-store"`,
//     jadi index.html SELALU diambil versi terbaru dari server saat online.
//     Ini mencegah "chunk basi": halaman lama yang mereferensikan file
//     AppLayout-xxx.js yang sudah tidak ada setelah rilis baru. Bila offline,
//     fallback ke halaman utama yang tersimpan.
//   - Aset statis (hashed /assets/*, ikon, manifest) : cache-first, diperbarui
//     di latar belakang.
//   - API Convex / domain lain : selalu lewat jaringan (tidak di-cache).
//
// Notifikasi push:
//   - "push"           : server mengirim pesan JSON { title, body, url, tag } →
//     tampilkan notifikasi di perangkat.
//   - "notificationclick" : pengguna mengetuk notifikasi → buka/fokus aplikasi
//     lalu arahkan ke URL yang dikirim server (mis. detail invoice).
//
// PENTING: file ini harus JavaScript MURNI (tanpa anotasi TypeScript) karena
// disajikan mentah ke browser. Anotasi tipe ("let x: string = ...") membuat
// seluruh service worker GAGAL dipasang (SyntaxError) — notifikasi push dan
// cache pun ikut mati.
// ============================================================================
var CACHE = "dapur-laut-v2";

self.addEventListener("install", function (event) {
  self.skipWaiting();
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches
      .keys()
      .then(function (keys) {
        return Promise.all(
          keys
            .filter(function (k) {
              return k !== CACHE;
            })
            .map(function (k) {
              return caches.delete(k);
            }),
        );
      })
      .then(function () {
        return self.clients.claim();
      }),
  );
});

/** Buat Response offline minimal supaya respondWith tidak pernah dapat undefined. */
function offlineResponse(msg) {
  return new Response(msg || "Offline", {
    status: 503,
    statusText: "Service Unavailable",
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}

self.addEventListener("fetch", function (event) {
  var req = event.request;
  if (req.method !== "GET") return;

  var url = new URL(req.url);
  // Hanya tangani aset dari domain sendiri — API Convex & layanan lain
  // (mis. OCR tesseract, WA) selalu lewat jaringan.
  if (url.origin !== self.location.origin) return;

  // Navigasi SPA: selalu minta dokumen terbaru dari jaringan (no-store,
  // jangan ambil dari HTTP cache browser). Bila gagal (offline), buka
  // halaman utama yang sudah di-cache.
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req, { cache: "no-store" })
        .then(function (res) {
          if (res && res.status === 200) {
            var copy = res.clone();
            caches
              .open(CACHE)
              .then(function (c) {
                return c.put("/", copy);
              })
              .catch(function () {});
          }
          return res;
        })
        .catch(function () {
          return caches
            .match("/")
            .then(function (r) {
              return r || caches.match(req.url);
            })
            .then(function (r) {
              return r || offlineResponse("Anda sedang offline. Muat ulang saat online.");
            });
        }),
    );
    return;
  }

  // Aset statis: cache-first + refresh latar belakang.
  event.respondWith(
    caches.match(req).then(function (cached) {
      var fetchPromise = fetch(req)
        .then(function (res) {
          if (res && res.status === 200 && res.type === "basic") {
            var copy = res.clone();
            caches
              .open(CACHE)
              .then(function (c) {
                return c.put(req, copy);
              })
              .catch(function () {});
          }
          return res;
        })
        .catch(function () {
          return cached || offlineResponse();
        });
      return cached || fetchPromise;
    }),
  );
});

// ----------------------------------------------------------------------------
// WEB PUSH — tampilkan notifikasi di HP/PC walau aplikasi sedang tidak dibuka
// ----------------------------------------------------------------------------

self.addEventListener("push", function (event) {
  var payload = {};
  try {
    if (event.data) payload = event.data.json();
  } catch (e) {
    /* payload bukan JSON — pakai fallback */
  }

  var title = payload.title || "Dapur Laut";
  var options = {
    body: payload.body || "Ada pembaruan di aplikasi Dapur Laut.",
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    data: { url: payload.url || "/dashboard" },
    tag: payload.tag || undefined,
    renotify: !!payload.tag,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();

  var url =
    (event.notification.data && event.notification.data.url) || "/dashboard";

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then(function (windowClients) {
        // Bila aplikasi sudah terbuka: fokus + arahkan ke halaman tujuan
        for (var i = 0; i < windowClients.length; i++) {
          var client = windowClients[i];
          if ("focus" in client) {
            client.focus();
            if ("navigate" in client) {
              client.navigate(url).catch(function () {});
            }
            return;
          }
        }
        // Aplikasi belum terbuka: buka jendela baru
        return self.clients.openWindow(url);
      }),
  );
});
