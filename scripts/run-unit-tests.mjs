// ============================================================================
// TEST UNIT — logika murni Dapur Laut (business / schemas / ocr / format)
//
// Sandbox WebContainer tidak bisa menjalankan vitest (Console tidak tersedia),
// jadi runner ini mem-bundle file test .ts dengan esbuild dan mengganti import
// "vitest" dengan stub in-memory (describe/it/expect) — pendekatan yang sama
// dengan scripts/test-invoice.mjs dan scripts/test-katalog.mjs.
//
// Cara jalan:  node scripts/run-unit-tests.mjs
// ============================================================================
import { writeFileSync, rmSync, readFileSync, readdirSync } from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);

// ---------------------------------------------------------------------------
// Stub vitest — mengumpulkan describe/it lalu menjalankannya di akhir.
// Global state dipasang ke globalThis agar runner bisa membaca suite-nya.
// ---------------------------------------------------------------------------
const STUB_SRC = `
const state = { suites: [], current: null };
globalThis.__UNIT_STATE__ = state;

function describe(name, fn) {
  const suite = { name, tests: [] };
  state.suites.push(suite);
  const prev = state.current;
  state.current = suite;
  fn();
  state.current = prev;
}

function it(name, fn) {
  if (!state.current) throw new Error("it() dipanggil di luar describe");
  state.current.tests.push({ name, fn });
}

function fmt(v) {
  if (typeof v === "string") return JSON.stringify(v);
  try { return JSON.stringify(v); } catch { return String(v); }
}

function expect(actual) {
  const m = {
    toBe(expected) {
      if (actual !== expected) throw new Error(\`expected \${fmt(expected)}, got \${fmt(actual)}\`);
    },
    toEqual(expected) {
      const a = JSON.stringify(actual);
      const e = JSON.stringify(expected);
      if (a !== e) throw new Error(\`expected \${e}, got \${a}\`);
    },
    toContain(sub) {
      if (!String(actual).includes(String(sub)))
        throw new Error(\`expected "\${actual}" to contain "\${sub}"\`);
    },
    toHaveLength(n) {
      if (!actual || actual.length !== n)
        throw new Error(\`expected length \${n}, got \${actual && actual.length}\`);
    },
    toBeTruthy() { if (!actual) throw new Error(\`expected truthy, got \${fmt(actual)}\`); },
    toBeFalsy() { if (actual) throw new Error(\`expected falsy, got \${fmt(actual)}\`); },
    toBeNull() { if (actual !== null) throw new Error(\`expected null, got \${fmt(actual)}\`); },
    toBeUndefined() { if (actual !== undefined) throw new Error(\`expected undefined, got \${fmt(actual)}\`); },
    toBeDefined() { if (actual === undefined) throw new Error("expected defined"); },
    toBeGreaterThan(n) { if (!(actual > n)) throw new Error(\`expected > \${n}, got \${fmt(actual)}\`); },
    toBeGreaterThanOrEqual(n) { if (!(actual >= n)) throw new Error(\`expected >= \${n}, got \${fmt(actual)}\`); },
    toBeLessThan(n) { if (!(actual < n)) throw new Error(\`expected < \${n}, got \${fmt(actual)}\`); },
    toBeLessThanOrEqual(n) { if (!(actual <= n)) throw new Error(\`expected <= \${n}, got \${fmt(actual)}\`); },
    toMatch(re) { if (!re.test(actual)) throw new Error(\`expected "\${actual}" to match \${re}\`); },
    not: {
      toContain(sub) {
        if (String(actual).includes(String(sub)))
          throw new Error(\`expected "\${actual}" NOT to contain "\${sub}"\`);
      },
      toBe(v) {
        if (actual === v) throw new Error(\`expected NOT \${fmt(v)}, got \${fmt(actual)}\`);
      },
    },
  };
  return m;
}

module.exports = { describe, it, test: it, expect };
`;

const stubPath = join(root, "scripts/.unit-vitest-stub.cjs");
writeFileSync(stubPath, STUB_SRC);

// ---------------------------------------------------------------------------
// Bundle & jalankan tiap file test
// ---------------------------------------------------------------------------
const testDir = join(root, "src", "lib", "__tests__");
const files = readdirSync(testDir)
  .filter((f) => f.endsWith(".test.ts"))
  .sort();

let pass = 0;
let fail = 0;

const { build } = require("esbuild");

for (const file of files) {
  const bundleOut = join(root, `scripts/.unit-bundle-${file.replace(/\.ts$/, "")}.cjs`);
  // Ganti import "vitest" dengan path absolut ke stub. resolveDir = folder test
  // agar import relatif (../business, ../schemas, ../ocr) tetap terselesaikan.
  const src = readFileSync(join(testDir, file), "utf8").replace(
    /from ["']vitest["']/g,
    `from ${JSON.stringify(stubPath)}`,
  );
  await build({
    stdin: { contents: src, resolveDir: testDir, sourcefile: file, loader: "ts" },
    outfile: bundleOut,
    bundle: true,
    platform: "node",
    format: "cjs",
    jsx: "automatic",
    packages: "external",
    logLevel: "silent",
  });

  // Bersihkan state global sebelum bundle di-require
  globalThis.__UNIT_STATE__ = { suites: [], current: null };

  try {
    require(bundleOut);
  } catch (e) {
    fail++;
    console.log(`❌ ${file}: GAGAL MEMUAT BUNDLE — ${String((e && e.message) || e)}`);
    continue;
  }

  const state = globalThis.__UNIT_STATE__ || { suites: [] };
  console.log("=".repeat(70));
  console.log(`UNIT TEST — ${file}`);
  console.log("=".repeat(70));

  for (const suite of state.suites) {
    console.log(`\n  ▸ ${suite.name}`);
    for (const t of suite.tests) {
      try {
        const res = t.fn();
        if (res && typeof res.then === "function") await res;
        pass++;
        console.log(`    ✅ ${t.name}`);
      } catch (e) {
        fail++;
        console.log(`    ❌ ${t.name}`);
        console.log(`       ${String((e && e.message) || e)}`);
      }
    }
  }
}

console.log("\n" + "=".repeat(70));
console.log(`HASIL: ${pass} lulus, ${fail} gagal — ${fail === 0 ? "SEMUA LULUS ✅" : "ADA KEGAGALAN ❌"}`);
console.log("=".repeat(70));

try {
  rmSync(stubPath, { force: true });
  for (const file of files) rmSync(join(root, `scripts/.unit-bundle-${file.replace(/\.ts$/, "")}.cjs`), { force: true });
} catch {
  /* abaikan */
}
process.exit(fail === 0 ? 0 : 1);
