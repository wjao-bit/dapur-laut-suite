const to = setTimeout(() => {
  console.log("TIMEOUT");
  process.exit(0);
}, 60000);

const r = await fetch("https://apkku01.freebuff.app/assets/index-4GFR5r-T.js", {
  headers: { "User-Agent": "Mozilla/5.0" },
});
const t = await r.text();
console.log("STATUS", r.status, "LEN", t.length);

const probes = [
  "md:block",
  "lg:block",
  "md:pl-64",
  "lg:pl-64",
  "md:hidden",
  "lg:hidden",
  ">Menu<",
  "Menu</span>",
  "Buka menu navigasi",
  "Buka menu",
  "Dashboard",
  "Gudang & Stok",
  "Slip Gaji",
  "Keluar",
  "Aplikasi > Dashboard",
  "root-fallback",
];
for (const p of probes) {
  const idx = t.indexOf(p);
  console.log("PROBE", JSON.stringify(p), "->", idx >= 0 ? "FOUND@" + idx : "missing");
}
