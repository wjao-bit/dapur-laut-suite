const to = setTimeout(() => {
  console.log("TIMEOUT");
  process.exit(0);
}, 90000);

const base = "https://apkku01.freebuff.app";
const r = await fetch(base + "/assets/index-4GFR5r-T.js", {
  headers: { "User-Agent": "Mozilla/5.0" },
});
const t = await r.text();
console.log("ENTRY_LEN", t.length);

// find referenced asset chunk names like "AppLayout-XXXX.js"
const names = [...new Set(t.match(/[A-Za-z0-9_-]+-[A-Za-z0-9_-]{8}\.js/g) || [])];
console.log("CHUNKS", JSON.stringify(names.slice(0, 40)));

for (const n of names) {
  if (!/layout|Layout|app/i.test(n)) continue;
  try {
    const rr = await fetch(base + "/assets/" + n, {
      headers: { "User-Agent": "Mozilla/5.0" },
    });
    const tt = await rr.text();
    console.log("CHUNK", n, "STATUS", rr.status, "LEN", tt.length);
    const probes = ["md:block", "lg:block", "md:pl-64", "lg:pl-64", "md:hidden", "lg:hidden", "Gudang & Stok", "Slip Gaji", "Menu", "Buka menu"];
    for (const p of probes) {
      const i = tt.indexOf(p);
      if (i >= 0) console.log("  HAS", JSON.stringify(p), "@" + i);
    }
  } catch (e) {
    console.log("ERR", n, e.code || e.message);
  }
}
