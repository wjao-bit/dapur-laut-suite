const to = setTimeout(() => {
  console.log("TIMEOUT");
  process.exit(0);
}, 60000);

const base = "https://apkku01.freebuff.app";
const r = await fetch(base + "/", { headers: { "User-Agent": "Mozilla/5.0" } });
const html = await r.text();
const cssRefs = html.match(/\/assets\/[^"']+\.css/g) || [];
console.log("CSS_REFS", JSON.stringify(cssRefs));

for (const ref of cssRefs) {
  const rr = await fetch(base + ref, { headers: { "User-Agent": "Mozilla/5.0" } });
  const tt = await rr.text();
  console.log("CSS", ref, "STATUS", rr.status, "LEN", tt.length);
  const mdBlock = tt.indexOf("md\\:block") >= 0 || tt.includes("md\\:block");
  const mdPl = tt.includes("md\\:pl-64") || tt.indexOf("pl-64") >= 0;
  console.log("  HAS_MD_BLOCK_RULE", mdBlock);
  console.log("  HAS_PL64", mdPl);
  const i = tt.indexOf("pl-64");
  if (i >= 0) console.log("  PL64_SNIPPET", tt.slice(i - 60, i + 60).replace(/\n/g, " "));
}
