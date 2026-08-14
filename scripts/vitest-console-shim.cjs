// ============================================================================
// Polyfill global `Console` untuk sandbox WebContainer.
//
// Di lingkungan WebContainer ini:
//   - `globalThis.Console` TIDAK terdefinisi, dan
//   - modul `node:console` di-mock (tanpa properti `Console`),
// sehingga kode apa pun yang memakai `new Console(...)` (vitest/vite)
// gagal dengan "TypeError: Console is not a constructor".
//
// File ini menyediakan implementasi Console sederhana dan memasangnya di:
//   - globalThis.Console
//   - properti `Console` pada instance console
//   - properti `Console` pada modul node:console (untuk jalur ESM/CJS lain)
//
// Dipakai oleh vitest.config.ts (import di proses utama, setupFiles di worker)
// dan bisa juga via NODE_OPTIONS="--require=<abs path>".
// ============================================================================
"use strict";

function makeFakeConsole() {
  const util = require("node:util");

  function write(stream, args) {
    try {
      stream.write(util.format(...args) + "\n");
    } catch {
      try {
        stream.write(args.map((a) => String(a)).join(" ") + "\n");
      } catch {
        /* abaikan */
      }
    }
  }

  function Console(stdout, stderr) {
    // Dukung dua bentuk: (stdout, stderr) dan { stdout, stderr }.
    if (stdout && typeof stdout === "object" && typeof stdout.write !== "function") {
      this._stdout = stdout.stdout || process.stdout;
      this._stderr = stdout.stderr || process.stderr;
    } else {
      this._stdout = stdout || process.stdout;
      this._stderr = stderr || process.stderr;
    }
  }

  Console.prototype.log = function (...args) {
    write(this._stdout, args);
  };
  Console.prototype.info = function (...args) {
    write(this._stdout, args);
  };
  Console.prototype.debug = function (...args) {
    write(this._stdout, args);
  };
  Console.prototype.warn = function (...args) {
    write(this._stderr, args);
  };
  Console.prototype.error = function (...args) {
    write(this._stderr, args);
  };
  Console.prototype.trace = function (...args) {
    write(this._stderr, args);
    try {
      this._stderr.write(new Error("Trace").stack + "\n");
    } catch {
      /* abaikan */
    }
  };
  Console.prototype.dir = function (obj) {
    write(this._stdout, [util.inspect(obj, { depth: 3, colors: false })]);
  };
  Console.prototype.assert = function (value, ...args) {
    if (!value) write(this._stderr, ["Assertion failed:", ...args]);
  };
  Console.prototype.time = function (label) {
    this._times = this._times || {};
    this._times[label || "default"] = Date.now();
  };
  Console.prototype.timeEnd = function (label) {
    const key = label || "default";
    if (this._times && this._times[key] != null) {
      write(this._stdout, [`${key}: ${Date.now() - this._times[key]}ms`]);
      delete this._times[key];
    }
  };
  Console.prototype.count = function (label) {
    const key = label || "default";
    this._counts = this._counts || {};
    this._counts[key] = (this._counts[key] || 0) + 1;
    write(this._stdout, [`${key}: ${this._counts[key]}`]);
  };
  Console.prototype.countReset = function (label) {
    this._counts = this._counts || {};
    this._counts[label || "default"] = 0;
  };
  Console.prototype.clear = function () {};
  Console.prototype.group = function () {};
  Console.prototype.groupCollapsed = function () {};
  Console.prototype.groupEnd = function () {};
  Console.prototype.table = function (data) {
    write(this._stdout, [util.inspect(data, { depth: 4 })]);
  };

  return Console;
}

const needPolyfill =
  typeof globalThis.Console === "undefined" || typeof console.Console === "undefined";

if (needPolyfill) {
  const FakeConsole = makeFakeConsole();

  if (typeof globalThis.Console === "undefined") {
    globalThis.Console = FakeConsole;
  }
  try {
    if (console && typeof console.Console === "undefined") {
      console.Console = FakeConsole;
    }
  } catch {
    /* abaikan */
  }
  try {
    // Modul node:console di-mock di WebContainer tanpa properti `Console`.
    const consoleMod = require("node:console");
    if (consoleMod && typeof consoleMod.Console === "undefined") {
      consoleMod.Console = FakeConsole;
    }
  } catch {
    /* abaikan */
  }

  try {
    process.stderr.write("[SHIM-LOADED]\n");
  } catch {
    /* abaikan */
  }
}
