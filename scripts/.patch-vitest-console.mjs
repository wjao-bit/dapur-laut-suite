// Patch vitest dist chunks: ganti `new Console(` -> `new globalThis.Console(`.
// Sandbox WebContainer ini tidak menyediakan `Console` (global maupun ekspor
// node:console), sehingga vitest gagal start. Setelah patch, polyfill di
// scripts/vitest-console-shim.cjs yang menyediakan globalThis.Console.
import { readFileSync, writeFileSync } from "node:fs";

const files = [
  "node_modules/vitest/dist/chunks/cli-api.BK8pd4xc.js",
  "node_modules/vitest/dist/chunks/console.3WNpx0tS.js",
  "node_modules/vitest/dist/chunks/index.UpGiHP7g.js",
];

for (const f of files) {
  try {
    const s = readFileSync(f, "utf8");
    if (s.includes("new globalThis.Console(")) {
      console.log(`SKIP (already patched): ${f}`);
      continue;
    }
    const count = s.split("new Console(").length - 1;
    if (count === 0) {
      console.log(`NO-OCCURRENCE: ${f}`);
      continue;
    }
    const n = s.replaceAll("new Console(", "new globalThis.Console(");
    writeFileSync(f, n);
    console.log(`PATCHED ${count}x: ${f}`);
  } catch (e) {
    console.log(`ERROR ${f}: ${e.message}`);
  }
}
