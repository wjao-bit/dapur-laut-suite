import { writeFileSync, existsSync, rmSync } from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);

const ENTRY = `
import { createInvoice, createInvoiceTetesan } from "@/convex/business.ts";
export function shape() {
  return {
    type: typeof createInvoice,
    keys: Object.keys(createInvoice || {}),
    hasHandler: !!(createInvoice && typeof createInvoice.handler === "function"),
    handlerType: typeof (createInvoice && createInvoice.handler),
    tetesanType: typeof createInvoiceTetesan,
  };
}
`;

const entryOut = join(root, "scripts/.dbg-entry.tsx");
const bundleOut = join(root, "scripts/.dbg-bundle.cjs");
writeFileSync(entryOut, ENTRY);

const { build } = require("esbuild");
await build({
  entryPoints: [entryOut],
  outfile: bundleOut,
  bundle: true,
  platform: "node",
  format: "cjs",
  jsx: "automatic",
  loader: { ".tsx": "tsx", ".ts": "ts" },
  plugins: [{
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
  }],
  packages: "external",
  logLevel: "silent",
});

const mod = require(bundleOut);
console.log(JSON.stringify(mod.shape(), null, 2));
try {
  rmSync(entryOut, { force: true });
  rmSync(bundleOut, { force: true });
} catch {}
