"use strict";
try {
  require("/scripts/vitest-console-shim.cjs");
  console.log("PROBE abs require ok, globalThis.Console=" + typeof globalThis.Console);
} catch (e) {
  console.log("PROBE abs require FAILED: " + e.message);
}
try {
  require("./scripts/vitest-console-shim.cjs");
  console.log("PROBE rel require ok, globalThis.Console=" + typeof globalThis.Console);
} catch (e) {
  console.log("PROBE rel require FAILED: " + e.message);
}
