// Keepalive: cegah proses keluar sebelum kerja async CLI selesai di sandbox.
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

const origExit = process.exit.bind(process);
process.exit = (code) => {
  console.error(">>> process.exit called with code:", code);
  origExit(code);
};

// Keep event loop alive hingga 180 detik agar kerja async sempat selesai.
setInterval(() => {}, 1000);
setTimeout(() => {}, 180000);
