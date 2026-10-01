/**
 * E2E BUILD — bundling aplikasi untuk dites di Node (tanpa browser).
 *
 * Memakai esbuild dengan:
 *  - mock `convex/react`, `sonner`, `tesseract.js` (tanpa server),
 *  - stub untuk aset (svg/css/font) yang tidak ada di runtime Node,
 *  - paket node_modules dibiarkan EXTERNAL → di-require Node apa adanya
 *    (dipaksa bundle, lodash & kawan-kawan rusak karena require dinamis).
 *
 * Set E2E_REUSE=1 untuk memakai bundle lama (iterasi cepat).
 */
import { readdirSync, writeFileSync, existsSync, rmSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

export const root = dirname(dirname(fileURLToPath(import.meta.url)));
const require = createRequire(import.meta.url);

const ENTRY_OUT = join(root, "scripts/.e2e-entry.tsx");
const BUNDLE_OUT = join(root, "scripts/.e2e-bundle.cjs");

const MODULE_STUBS = {
  "convex/react": `
import { getFunctionName } from "convex/server";
function cfg() { return globalThis.__E2E__ ?? {}; }
function nameOf(ref) { try { return getFunctionName(ref); } catch (e) { return "?"; } }
export function useQuery(ref) {
  const n = nameOf(ref);
  cfg().spy?.queries.push(n);
  const fixtures = cfg().fixtures ?? {};
  if (Object.prototype.hasOwnProperty.call(fixtures, n)) return fixtures[n];
  return cfg().loadingState ?? undefined;
}
export function useMutation(ref) {
  const n = nameOf(ref);
  const fn = async (args) => {
    cfg().spy?.mutations.push({ name: n, args });
    const results = cfg().mutationResults ?? {};
    return Object.prototype.hasOwnProperty.call(results, n) ? results[n] : { ok: true };
  };
  fn.withOptimisticUpdate = () => fn;
  return fn;
}
export function useAction(ref) {
  const n = nameOf(ref);
  return async (args) => {
    cfg().spy?.mutations.push({ name: n, args });
    const results = cfg().actionResults ?? {};
    return Object.prototype.hasOwnProperty.call(results, n) ? results[n] : {};
  };
}
export function useConvex() {
  return {
    query: async () => null, mutation: async () => null, action: async () => null,
    onUpdate: () => () => {}, watchQuery: () => () => {}, close: () => {},
  };
}
export function useConvexAuth() { return { isLoading: false, isAuthenticated: true }; }
export function ConvexProvider({ children }) { return children; }
export function ConvexProviderWithAuth({ children }) { return children; }
export class ConvexReactClient { constructor() {} }
export function usePaginatedQuery() { return { results: [], status: "Exhausted", loadMore: () => {} }; }
export const AuthLoading = () => null;
`,
  sonner: `
function push(level, msg) { globalThis.__E2E__?.spy?.toasts.push({ level, msg }); }
const toast = (m) => push("default", m);
toast.success = (m) => push("success", m);
toast.error = (m) => push("error", m);
toast.info = (m) => push("info", m);
toast.warning = (m) => push("warning", m);
toast.message = (m) => push("message", m);
toast.loading = (m) => push("loading", m);
toast.promise = (p) => p;
toast.dismiss = () => {};
export { toast };
export const Toaster = () => null;
export default { toast };
`,
  "tesseract.js": `
export async function createWorker() { return { recognize: async () => ({ data: { text: "" } }), terminate: async () => {} }; }
export default { createWorker };
`,
};

export function listAppPages() {
  return readdirSync(join(root, "src/pages/app"))
    .filter((f) => f.endsWith(".tsx"))
    .sort();
}

export async function buildBundle() {
  if (process.env.E2E_REUSE === "1" && existsSync(BUNDLE_OUT)) return BUNDLE_OUT;

  const pageFiles = listAppPages();
  writeFileSync(
    ENTRY_OUT,
    `import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { MemoryRouter, Routes, Route, useLocation, Navigate, Link } from "react-router";
import AuthPage from "@/pages/Auth.tsx";
import { RequireAuth } from "@/components/RequireAuth.tsx";
import LandingPage from "@/pages/Landing.tsx";
import NotFoundPage from "@/pages/NotFound.tsx";
import { ExportButton } from "@/components/app/ExportButton.tsx";
import { rowsToCsv, downloadCsv, datedFilename, autoColumns } from "@/lib/export.ts";
import { computeGudangRows, PENGELUARAN_JENISES } from "@/lib/business.ts";
${pageFiles.map((f, i) => `import P${i} from "@/pages/app/${f}";`).join("\n")}

export {
  React, act, createRoot, renderToString, MemoryRouter, Routes, Route,
  useLocation, Navigate, Link, AuthPage, RequireAuth, LandingPage, NotFoundPage,
  ExportButton, rowsToCsv, downloadCsv, datedFilename, autoColumns,
  computeGudangRows, PENGELUARAN_JENISES,
};
export const PAGES = {
${pageFiles.map((f, i) => `  ${JSON.stringify(f.replace(/\.tsx$/, ""))}: P${i},`).join("\n")}
};
`,
  );

  const moduleStubs = {
    name: "e2e-module-stubs",
    setup(build) {
      build.onResolve({ filter: /^(convex\/react|sonner|tesseract\.js)$/ }, (a) => ({
        path: a.path,
        namespace: "e2e-stub",
      }));
      build.onLoad({ filter: /.*/, namespace: "e2e-stub" }, (a) => ({
        contents: MODULE_STUBS[a.path],
        loader: "js",
        resolveDir: root,
      }));
    },
  };
  /** Aset (svg/css/font/gambar) tidak dibaca dari disk — cukup jadi string. */
  const assetStubs = {
    name: "e2e-assets",
    setup(build) {
      build.onResolve(
        { filter: /\.(svg|png|jpe?g|gif|webp|avif|ico|bmp|woff2?|ttf|eot|otf|mp3|mp4|webm|css)$/i },
        (a) => ({ path: a.path, namespace: "e2e-asset" }),
      );
      build.onLoad({ filter: /.*/, namespace: "e2e-asset" }, (a) => ({
        contents: a.path.endsWith(".css")
          ? "export default {};"
          : `export default "data:e2e;base64,${Buffer.from(a.path).toString("base64")}";`,
        loader: "js",
      }));
    },
  };
  const alias = {
    name: "e2e-alias",
    setup(build) {
      build.onResolve({ filter: /^@\// }, (a) => {
        const base = join(root, "src", a.path.slice(2));
        for (const ext of [".tsx", ".ts", ".jsx", ".js"]) {
          if (existsSync(base + ext)) return { path: base + ext };
        }
        if (existsSync(join(base, "index.tsx"))) return { path: join(base, "index.tsx") };
        return { path: base };
      });
    },
  };

  const { build } = require("esbuild");
  await build({
    entryPoints: [ENTRY_OUT],
    outfile: BUNDLE_OUT,
    bundle: true,
    platform: "node",
    format: "cjs",
    jsx: "automatic",
    loader: { ".tsx": "tsx", ".ts": "ts", ".jsx": "jsx" },
    define: { "import.meta.env": "{}" },
    packages: "external",
    plugins: [moduleStubs, assetStubs, alias],
    logLevel: "silent",
    logOverride: { "empty-import-meta": "silent" },
  });
  return BUNDLE_OUT;
}

export function cleanupBundle() {
  rmSync(ENTRY_OUT, { force: true });
  rmSync(BUNDLE_OUT, { force: true });
}

export const BUNDLE_PATH = BUNDLE_OUT;
