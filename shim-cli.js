// Shim untuk membuat CLI Convex berjalan di runtime sandbox:
// 1. netralkan panggilan dns/net yang mungkin melempar di sini.
// 2. tangkap unhandled rejection agar tidak hilang diam-diam.
const dns = require("node:dns");
if (dns.setDefaultResultOrder) dns.setDefaultResultOrder = () => {};
try {
  const net = require("node:net");
  if (net.setDefaultAutoSelectFamilyAttemptTimeout)
    net.setDefaultAutoSelectFamilyAttemptTimeout = () => {};
} catch {}

process.on("unhandledRejection", (e) => {
  console.error(">>> UNHANDLED REJECTION:", e && e.stack ? e.stack : String(e));
});
process.on("uncaughtException", (e) => {
  console.error(">>> UNCAUGHT EXCEPTION:", e && e.stack ? e.stack : String(e));
});
