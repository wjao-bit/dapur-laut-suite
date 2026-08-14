// ============================================================================
// Runner unit test untuk src/lib/__tests__/*.test.ts TANPA vitest.
//
// Mengapa: sandbox WebContainer ini tidak menyediakan global `Console` (dan
// modul `node:console` di-mock tanpa properti Console), sehingga worker vitest
// tidak bisa start ("TypeError: Console is not a constructor") baik dengan
// pool forks maupun threads — preload --require untuk polyfill diabaikan oleh
// runtime. Solusi: bundle semua file test dengan esbuild (pola yang sama
// dengan scripts/test-invoice.mjs & test-next-kode.mjs), sediakan API
// describe/it/expect minimal yang kompatibel, lalu jalankan murni di Node.
//
// File test TIDAK diubah: tetap memakai `import { describe, it, expect } from
// "vitest"` dan tetap bisa dijalankan dengan vitest di lingkungan normal.
// ============================================================================
import { writeFileSync, rmSync, existsSync, readdirSync } from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { inspect } from "node:util";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);

// ---------------------------------------------------------------------------
// Mini framework test (permukaan API mirip vitest)
// ---------------------------------------------------------------------------
const tests = [];
let currentSuite = [];

globalThis.describe = (name, fn) => {
  currentSuite.push(String(name));
  try {
    fn();
  } finally {
    currentSuite.pop();
  }
};

function fmt(v) {
  if (typeof v === "string") return JSON.stringify(v);
  try {
    return inspect(v, { depth: 5, breakLength: 120 });
  } catch {
    return String(v);
  }
}

function deepEqual(a, b) {
  if (Object.is(a, b)) return true;
  if (typeof a !== typeof b) return false;
  if (a === null || b === null) return false;
  if (typeof a !== "object") return false;
  const aArr = Array.isArray(a);
  const bArr = Array.isArray(b);
  if (aArr !== bArr) return false;
  if (aArr) {
    if (a.length !== b.length) return false;
    return a.every((v, i) => deepEqual(v, b[i]));
  }
  const ka = Object.keys(a);
  const kb = Object.keys(b);
  if (ka.length !== kb.length) return false;
  return ka.every(
    (k) => Object.prototype.hasOwnProperty.call(b, k) && deepEqual(a[k], b[k]),
  );
}

function makeMatchers(actual, negate) {
  const fail = (msg) => {
    throw new Error(msg);
  };
  const ok = (cond, msg) => {
    if (negate ? cond : !cond) fail(msg);
  };
  return {
    toBe(expected) {
      ok(
        Object.is(actual, expected),
        `expected ${fmt(actual)} ${negate ? "to not be" : "to be"} ${fmt(expected)}`,
      );
    },
    toEqual(expected) {
      ok(
        deepEqual(actual, expected),
        `expected ${fmt(actual)} ${negate ? "to not deep-equal" : "to deep-equal"} ${fmt(expected)}`,
      );
    },
    toContain(expected) {
      let contains = false;
      if (typeof actual === "string") contains = actual.includes(String(expected));
      else if (Array.isArray(actual))
        contains = actual.some((x) => deepEqual(x, expected));
      ok(
        contains,
        `expected ${fmt(actual)} ${negate ? "to not contain" : "to contain"} ${fmt(expected)}`,
      );
    },
    toBeLessThan(expected) {
      ok(
        actual < expected,
        `expected ${fmt(actual)} ${negate ? "to not be less than" : "to be less than"} ${fmt(expected)}`,
      );
    },
    toBeLessThanOrEqual(expected) {
      ok(
        actual <= expected,
        `expected ${fmt(actual)} ${negate ? "to not be ≤" : "to be ≤"} ${fmt(expected)}`,
      );
    },
    toBeGreaterThan(expected) {
      ok(
        actual > expected,
        `expected ${fmt(actual)} ${negate ? "to not be greater than" : "to be greater than"} ${fmt(expected)}`,
      );
    },
    toBeGreaterThanOrEqual(expected) {
      ok(
        actual >= expected,
        `expected ${fmt(actual)} ${negate ? "to not be ≥" : "to be ≥"} ${fmt(expected)}`,
      );
    },
    toBeTruthy() {
      ok(Boolean(actual), `expected ${fmt(actual)} ${negate ? "to be falsy" : "to be truthy"}`);
    },
    toBeFalsy() {
      ok(!actual, `expected ${fmt(actual)} ${negate ? "to be truthy" : "to be falsy"}`);
    },
  };
}

function expect(actual) {
  const base = makeMatchers(actual, false);
  Object.defineProperty(base, "not", {
    get() {
      return makeMatchers(actual, true);
    },
  });
  return base;
}
globalThis.expect = expect;

globalThis.it = (name, fn) => {
  tests.push({ suite: currentSuite.join(" › ") || "root", name: String(name), fn });
};
globalThis.test = globalThis.it;

// ---------------------------------------------------------------------------
// Bundle SEMUA file test di src/lib/__tests__ (vitest → shim lokal,
// package eksternal) lalu jalankan.
// ---------------------------------------------------------------------------
const TESTS_DIR = join(root, "src/lib/__tests__");
const testFiles = readdirSync(TESTS_DIR)
  .filter((f) => f.endsWith(".test.ts"))
  .sort()
  .map((f) => join(TESTS_DIR, f));

if (testFiles.length === 0) {
  console.error("Tidak ada file *.test.ts di", TESTS_DIR);
  process.exit(1);
}

const entryOut = join(root, "scripts/.unit-tests-entry.tsx");
const bundleOut = join(root, "scripts/.unit-tests-bundle.cjs");
const shimFile = join(root, "scripts/test-vitest-shim.cjs");

writeFileSync(
  entryOut,
  testFiles.map((f) => `import ${JSON.stringify(f)};`).join("\n") + "\n",
);

const { build } = require("esbuild");
await build({
  entryPoints: [entryOut],
  outfile: bundleOut,
  bundle: true,
  platform: "node",
  format: "cjs",
  loader: { ".ts": "ts", ".tsx": "tsx" },
  packages: "external",
  logLevel: "silent",
  plugins: [
    {
      name: "local-alias",
      setup(b) {
        b.onResolve({ filter: /^vitest$/ }, () => ({ path: shimFile }));
        b.onResolve({ filter: /^@\// }, (args) => {
          const base = join(root, "src", args.path.slice(2));
          for (const ext of [".tsx", ".ts", ".js", ".jsx"]) {
            if (existsSync(base + ext)) return { path: base + ext };
          }
          return { path: base };
        });
      },
    },
  ],
});

// ---------------------------------------------------------------------------
// Jalankan test
// ---------------------------------------------------------------------------
const filter = process.argv[2];
let pass = 0;
let fail = 0;
try {
  require(bundleOut);
} catch (e) {
  console.error(`GAGAL memuat bundle test: ${e?.stack ?? e}`);
  process.exit(1);
}

for (const t of tests) {
  if (filter && !t.name.includes(filter) && !t.suite.includes(filter)) continue;
  const label = `${t.suite} › ${t.name}`;
  try {
    await t.fn();
    pass++;
    console.log(`  ✅ ${label}`);
  } catch (e) {
    fail++;
    console.log(`  ❌ ${label}`);
    console.log(`      ${String(e?.message ?? e).split("\n").join("\n      ")}`);
  }
}

console.log("\n" + "=".repeat(70));
console.log(`HASIL: ${pass} lulus, ${fail} gagal — ${fail === 0 ? "SEMUA LULUS ✅" : "ADA KEGAGALAN ❌"}`);
console.log("=".repeat(70));

try {
  rmSync(entryOut, { force: true });
  rmSync(bundleOut, { force: true });
} catch {
  /* abaikan */
}
process.exit(fail === 0 ? 0 : 1);
