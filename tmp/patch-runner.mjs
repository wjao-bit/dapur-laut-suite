import { readFileSync, writeFileSync } from "node:fs";

const REPLACEMENTS = [
  { file: "src/convex/business.ts", oldFile: "tmp/p1-old.txt", newFile: "tmp/p1-new.txt" },
  { file: "src/convex/business.ts", oldFile: "tmp/p2-old.txt", newFile: "tmp/p2-new.txt" },
  { file: "src/convex/business.ts", oldFile: "tmp/p3-old.txt", newFile: "tmp/p3-new.txt" },
];

let failed = false;
for (const r of REPLACEMENTS) {
  const src = readFileSync(r.file, "utf8");
  const o = readFileSync(r.oldFile, "utf8").replace(/\n$/, "");
  const n = readFileSync(r.newFile, "utf8").replace(/\n$/, "");
  const idx = src.indexOf(o);
  if (idx < 0) {
    console.error("MISS: " + r.file + " :: " + JSON.stringify(o.slice(0, 60)));
    failed = true;
    continue;
  }
  const idx2 = src.indexOf(o, idx + 1);
  if (idx2 >= 0) {
    console.error("AMBIGUOUS: " + r.file + " :: " + JSON.stringify(o.slice(0, 60)));
    failed = true;
    continue;
  }
  writeFileSync(r.file, src.slice(0, idx) + n + src.slice(idx + o.length));
  console.log("OK: " + r.file + " (patch +" + (n.length - o.length) + " chars)");
}
if (failed) process.exit(1);
