const to = setTimeout(() => {
  console.log("TIMEOUT");
  process.exit(0);
}, 90000);

for (const host of ["dapurlaut.freebuff.app", "apkku01.freebuff.app"]) {
  const base = "https://" + host;
  try {
    const r = await fetch(base + "/", { headers: { "User-Agent": "Mozilla/5.0" } });
    const html = await r.text();
    const entry = (html.match(/\/assets\/(index-[^"']+\.js)/) || [])[1];
    console.log("HOST", host, "HTML", r.status, "ENTRY", entry);

    // find AppLayout chunk ref
    const er = await fetch(base + "/assets/" + entry, { headers: { "User-Agent": "Mozilla/5.0" } });
    const et = await er.text();
    const layout = (et.match(/(AppLayout-[A-Za-z0-9_-]+\.js)/) || [])[1];
    console.log("  ENTRY_LEN", et.length, "APP_LAYOUT", layout);

    if (layout) {
      const lr = await fetch(base + "/assets/" + layout, { headers: { "User-Agent": "Mozilla/5.0" } });
      const lt = await lr.text();
      console.log("  LAYOUT_LEN", lt.length);
      console.log("  HAS_md_block", lt.includes("md:block"));
      console.log("  HAS_lg_block", lt.includes("lg:block"));
      console.log("  HAS_MenuLabel", lt.includes(">Menu<") || lt.includes("Menu</span>"));
      console.log("  HAS_resilient", lt.includes("resilient-hawk-825"));
    }
  } catch (e) {
    console.log("HOST", host, "ERR", e.code || e.message);
  }
}
