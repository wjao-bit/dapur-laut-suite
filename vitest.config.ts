// Memuat polyfill Console di proses UTAMA vitest SEBELUM logger dibuat.
// Sandbox WebContainer tidak menyediakan `Console`, jadi tanpa ini vitest
// gagal start ("Console is not a constructor").
import { createRequire } from "node:module";
import path from "path";
import { defineConfig } from "vitest/config";

const require = createRequire(import.meta.url);
require("./scripts/vitest-console-shim.cjs");

export default defineConfig({
  test: {
    environment: "node",
    // Worker juga butuh Console tersedia sejak awal.
    setupFiles: ["./scripts/vitest-console-shim.cjs"],
    // Matikan interceptor console bawaan vitest (membuat `new Console` di
    // worker) — test unit ini murni logika tanpa butuh menangkap console.log.
    disableConsoleIntercept: true,
    pool: "forks",
    poolOptions: {
      forks: {
        execArgv: ["--require", path.resolve(__dirname, "scripts/vitest-console-shim.cjs")],
      },
    },
  },
});
