/**
 * Audit responsif Android — verifikasi yang berjalan di dalam WebContainer.
 *
 * Bagian A: audit statis semua halaman (pola CSS responsif).
 * Bagian B: render sungguhan komponen DataTable via react-dom/server + happy-dom,
 *           memastikan DOM hasil render punya wadah scroll & tidak error.
 *
 * Cara jalan: node scripts/audit-responsive.mjs
 */
import { readdirSync, readFileSync, writeFileSync, existsSync, rmSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const pagesDir = join(root, "src/pages/app");
const require = createRequire(import.meta.url);

let fail = 0;

// ---------- Bagian A: audit statis ----------
const files = readdirSync(pagesDir).filter((f) => f.endsWith(".tsx"));
console.log(`\n=== A. AUDIT STATIS ${files.length} HALAMAN (${pagesDir}) ===\n`);

const report = [];
for (const f of files) {
  const src = readFileSync(join(pagesDir, f), "utf8");
  // Hapus dokumen cetak (fungsi *PrintDoc / *LaporanDoc) & blok <PrintFrame ...>:
  // tabel & grid di sana dirancang untuk kertas A4, bukan tampilan mobile.
  const ui = src
    .replace(/<PrintFrame[\s\S]*?<\/PrintFrame>/g, "")
    .split(/(?:export\s+)?function\s+\w*(?:Print|Laporan)Doc/)[0];
  const issues = [];

  // 1. Tabel UI bermasalah hanya jika halaman memakai <table> mentah TANPA <DataTable>
  //    (DataTable sudah punya wadah overflow-x-auto bawaan).
  const hasDataTable = src.includes("<DataTable");
  if (/<table/.test(ui) && !hasDataTable && !ui.includes("overflow-x-auto")) {
    issues.push("Tabel mentah tanpa wadah overflow-x-auto (scroll horizontal hilang di Android)");
  }

  // 2. Setiap <Input type="number"> harus punya inputMode (keyboard angka di Android).
  const inputBlocks = src.split(/<Input\b/g).slice(1);
  inputBlocks.forEach((b, i) => {
    const head = b.slice(0, 500);
    if (/type="number"/.test(head) && !/inputMode/.test(head)) {
      issues.push(`Input angka #${i + 1} tanpa inputMode (keyboard teks muncul di Android)`);
    }
  });

  // 3. Grid 3+ kolom tanpa prefix responsive berisiko sempit di layar kecil.
  ui.split("\n").forEach((ln, i) => {
    if (/grid-cols-(?:[3-9]|1[0-2])/.test(ln) && !/(?:sm|md|lg|xl):grid-cols/.test(ln) && !/print|hidden/.test(ln)) {
      issues.push(`Grid ${ln.match(/grid-cols-\d+/)?.[0]} tetap di mobile (baris ${i + 1}): ${ln.trim().slice(0, 70)}`);
    }
  });

  // 4. Info: berapa input yang sudah text-base di mobile (anti auto-zoom).
  const inputCount = inputBlocks.filter((b) => /text-base/.test(b.slice(0, 500))).length;
  const totalInputs = inputBlocks.length;

  report.push({ file: f, issues, inputCount, totalInputs });
}

for (const r of report) {
  const badge = r.issues.length ? "❌" : "✅";
  console.log(`${badge} ${r.file}`);
  for (const i of r.issues) console.log(`     - ${i}`);
  if (r.totalInputs > 0 && r.inputCount < r.totalInputs) {
    console.log(`     ⚠  Input dengan text-base: ${r.inputCount}/${r.totalInputs} (sisanya tanpa text-base)`);
  }
  if (r.issues.length) fail++;
}
console.log(`\nA: ${report.length - fail}/${report.length} halaman lolos audit statis\n`);

// ---------- Bagian B: render sungguhan DataTable ----------
console.log("=== B. RENDER SUNG GUHAN DataTable (react-dom/server + happy-dom) ===\n");
try {
  const { Window } = require("happy-dom");
  const window = new Window();
  globalThis.window = window;
  globalThis.document = window.document;
  globalThis.navigator = window.navigator;
  globalThis.HTMLElement = window.HTMLElement;
  globalThis.HTMLTableElement = window.HTMLTableElement;

  const entryOut = join(root, "scripts/.audit-entry.tsx");
  const bundleOut = join(root, "scripts/.audit-bundle.cjs");

  // entry yang me-render DataTable dengan data contoh
  const entrySrc = `
import { renderToString } from "react-dom/server";
import { DataTable } from "@/components/app/DataTable.tsx";
export function renderTable() {
  return renderToString(
    <DataTable
      columns={[
        { key: "id", label: "ID", render: (r) => <span>{r.id}</span> },
        { key: "nama", label: "Nama", render: (r) => r.nama },
        { key: "total", label: "Total", align: "right", render: (r) => r.total },
      ]}
      rows={[{ id: "INV001", nama: "Reseller A", total: 250000 }]}
      keyField={(r) => r.id}
      emptyTitle="Kosong"
      emptyDescription="Tidak ada data."
    />
  );
}
`;
  writeFileSync(entryOut, entrySrc);

  const { build } = require("esbuild");
  const aliasPlugin = {
    name: "alias",
    setup(build) {
      build.onResolve({ filter: /^@\// }, (args) => {
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
    jsx: "automatic",
    loader: { ".tsx": "tsx", ".ts": "ts" },
    plugins: [aliasPlugin],
    packages: "external",
    logLevel: "silent",
  });

  const mod = require(bundleOut);
  const html = mod.renderTable();

  const checks = [
    ["render tanpa error", () => typeof html === "string" && html.length > 0],
    ["membuat <table>", () => html.includes("<table")],
    ["wadah overflow-x-auto", () => html.includes("overflow-x-auto")],
    ["header kolom (ID, Nama, Total)", () => ["ID", "Nama", "Total"].every((h) => html.includes(h))],
    ["data baris (INV001, Reseller A)", () => html.includes("INV001") && html.includes("Reseller A")],
  ];

  let ok = 0;
  for (const [name, fn] of checks) {
    const pass = fn();
    console.log(`${pass ? "✅" : "❌"} ${name}`);
    if (pass) ok++;
    else fail++;
  }
  console.log(`\nB: ${ok}/${checks.length} pemeriksaan render lolos`);

  // Bersihkan file audit sementara
  try {
    rmSync(entryOut, { force: true });
    rmSync(bundleOut, { force: true });
  } catch {
    /* abaikan */
  }
} catch (e) {
  fail++;
  console.log("❌ Render DataTable GAGAL:", e?.message ?? e);
}

console.log(`\n=== HASIL AKHIR: ${fail === 0 ? "SEMUA LULUS ✅" : fail + " masalah ditemukan ❌"} ===\n`);
process.exit(fail === 0 ? 0 : 1);
