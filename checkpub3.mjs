const to = setTimeout(() => {
  console.log("TIMEOUT");
  process.exit(0);
}, 60000);

const res = await fetch("https://apkku01.freebuff.app/", {
  headers: { "User-Agent": "Mozilla/5.0" },
});
const html = await res.text();
console.log("HTML_STATUS", res.status, "LEN", html.length);

const jsRefs = html.match(/\/assets\/[^"']+\.js/g) || [];
console.log("JS_REFS", JSON.stringify(jsRefs));

for (const ref of jsRefs.slice(0, 2)) {
  try {
    const r = await fetch("https://apkku01.freebuff.app" + ref, {
      headers: { "User-Agent": "Mozilla/5.0" },
    });
    const t = await r.text();
    console.log("BUNDLE", ref, "STATUS", r.status, "LEN", t.length);
    console.log("  HAS_MD_BLOCK", t.includes("md:block print:hidden"));
    console.log("  HAS_LG_ONLY", t.includes("lg:block print:hidden"));
    console.log("  HAS_MENU_LABEL", t.includes('">Menu</span>') || t.includes('>Menu<'));
    console.log("  HAS_KANGAROO", t.includes("enchanted-kangaroo-934"));
    console.log("  HAS_RESILIENT", t.includes("resilient-hawk-825"));
  } catch (e) {
    console.log("BUNDLE_ERR", ref, e.code || e.message);
  }
}
