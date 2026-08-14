// ============================================================================
// Shim "vitest" → globals yang disediakan scripts/run-unit-tests.mjs.
// File test (business.test.ts) tetap memakai `import { describe, it, expect }
// from "vitest"` — di sini import itu diarahkan ke file ini supaya bisa
// dijalankan murni di Node (tanpa worker vitest yang tidak bisa start di
// sandbox WebContainer karena global `Console` tidak tersedia).
// ============================================================================
"use strict";

if (typeof globalThis.describe !== "function" || typeof globalThis.it !== "function") {
  throw new Error(
    "test-vitest-shim.cjs harus dijalankan lewat scripts/run-unit-tests.mjs " +
      "(globals describe/it/expect belum terpasang).",
  );
}

module.exports = {
  describe: globalThis.describe,
  it: globalThis.it,
  test: globalThis.it,
  expect: globalThis.expect,
};
