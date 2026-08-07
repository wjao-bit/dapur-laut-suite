import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const roots = [
  "node_modules/vitest/dist",
  "node_modules/vite/dist",
  "node_modules/tinypool",
  "node_modules/@vly-ai/integrations",
];

const needles = ["new Console", "Startup Error", "Console is not a constructor"];

const seen = new Set();
function walk(dir) {
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return;
  }
  for (const e of entries) {
    const p = join(dir, e);
    let st;
    try {
      st = statSync(p);
    } catch {
      continue;
    }
    if (st.isDirectory()) walk(p);
    else if (e.endsWith(".js") || e.endsWith(".mjs") || e.endsWith(".cjs")) {
      if (seen.has(p)) continue;
      seen.add(p);
      try {
        const s = readFileSync(p, "utf8");
        for (const n of needles) {
          if (s.includes(n)) {
            const i = s.indexOf(n);
            console.log(`\n### ${p}\n  ${n} => ${JSON.stringify(s.slice(Math.max(0, i - 120), i + 220))}`);
          }
        }
      } catch {
        /* skip */
      }
    }
  }
}

for (const r of roots) walk(r);
console.log("\nDONE");
