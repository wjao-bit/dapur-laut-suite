// ============================================================================
// Test regresi: nextSeqKode — kode otomatis fitur "Tambah barang ke database"
// (BRG001, BBK001, BJK001 …) di form invoice. Menjamin kode selalu unik &
// menyesuaikan dengan kode yang sudah ada di database.
// ============================================================================
import { writeFileSync, rmSync, existsSync } from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);

const ENTRY_SRC = `
import { nextSeqKode } from "@/lib/format.ts";
export const nextSeqKodeFn = nextSeqKode;
`;

const entryOut = join(root, "scripts/.test-kode-entry.tsx");
const bundleOut = join(root, "scripts/.test-kode-bundle.cjs");
writeFileSync(entryOut, ENTRY_SRC);

const { build } = require("esbuild");
const aliasPlugin = {
  name: "alias",
  setup(b) {
    b.onResolve({ filter: /^@\// }, (args) => {
      const base = join(root, "src", args.path.slice(2));
      for (const ext of [".tsx", ".ts"]) {
        if (existsSync(base + ext)) return { path: base + ext };
      }
      return { path: base };
    });
  },
};
await build({
  entryPoints: [entryOut],
  outfile: bundleOut,
  bundle: true,
  platform: "node",
  format: "cjs",
  loader: { ".tsx": "tsx", ".ts": "ts" },
  plugins: [aliasPlugin],
  packages: "external",
  logLevel: "silent",
});

const mod = require(bundleOut);
const f = mod.nextSeqKodeFn;

let pass = 0;
let fail = 0;
const check = (name, ok, detail = "") => {
  if (ok) {
    pass++;
    console.log(`  ✅ ${name}`);
  } else {
    fail++;
    console.log(`  ❌ ${name}${detail ? " — " + detail : ""}`);
  }
};

console.log("=".repeat(70));
console.log("nextSeqKode — kode otomatis barang baru");
console.log("=".repeat(70));

check('database kosong → BRG001', f([], "BRG") === "BRG001");
check('["BRG012"] → BRG013', f(["BRG012"], "BRG") === "BRG013");
check('["BRG001","BRG002","BRG005"] → BRG006', f(["BRG001", "BRG002", "BRG005"], "BRG") === "BRG006");
check('["BRG-XXX123"] (suffix angka 123) → BRG124', f(["BRG-XXX123"], "BRG") === "BRG124");
check('kode tanpa angka → BRG001', f(["BRG-ABCDEF"], "BRG") === "BRG001");
check('bahan baku: ["BBK003"] → BBK004', f(["BBK003"], "BBK") === "BBK004");
check('barang jadi: ["BJK009"] → BJK010', f(["BJK009"], "BJK") === "BJK010");
// Kode numerik murni (mis. "100236") → suffix angka utuh 100236 → BRG100237
// (selalu lebih besar dari kode mana pun → dijamin unik)
check('campuran BRG012 + 100236 → BRG100237', f(["BRG012", "100236"], "BRG") === "BRG100237");
check('undefined/null → BRG001', f(undefined, "BRG") === "BRG001" && f(null, "BRG") === "BRG001");
check('angka 999 → 1000', f(["BRG999"], "BRG") === "BRG1000");

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
