/**
 * Audit UI Dapur Laut — berjalan penuh di dalam WebContainer (tanpa Chrome).
 *
 * Bagian A: audit statis 20 halaman aplikasi (pola responsif Android).
 * Bagian B: render sungguhan DataTable via react-dom/server + happy-dom.
 * Bagian C: halaman publik (Landing, Auth, Dashboard, NotFound) — responsif &
 *           aksesibilitas dasar (aria-label untuk tombol ikon-only).
 * Bagian D: komponen UI — focus state (focus-visible) & kontras warna (WCAG).
 * Bagian E: token tema index.css (light & dark) — kontras teks vs latar.
 *
 * Cara jalan: npm run audit:responsive
 */
import { readdirSync, readFileSync, writeFileSync, existsSync, rmSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const require = createRequire(import.meta.url);
let fail = 0;
const reportIssue = (issues, msg) => issues.push(msg);

// ============================================================================
// BANTUAN WARNA & KONTRAS (WCAG)
// ============================================================================
// Palet Tailwind standar (hex) untuk penghitungan kontras pasangan text-/bg-.
const TAILWIND = {
  slate: ["#f8fafc","#f1f5f9","#e2e8f0","#cbd5e1","#94a3b8","#64748b","#475569","#334155","#1e293b","#0f172a"],
  gray: ["#f9fafb","#f3f4f6","#e5e7eb","#d1d5db","#9ca3af","#6b7280","#4b5563","#374151","#1f2937","#111827"],
  zinc: ["#fafafa","#f4f4f5","#e4e4e7","#d4d4d8","#a1a1aa","#71717a","#52525b","#3f3f46","#27272a","#18181b"],
  neutral: ["#fafafa","#f5f5f5","#e5e5e5","#d4d4d4","#a3a3a3","#737373","#525252","#404040","#262626","#171717"],
  stone: ["#fafaf9","#f5f5f4","#e7e5e4","#d6d3d1","#a8a29e","#78716c","#57534e","#44403c","#292524","#1c1917"],
  red: ["#fef2f2","#fee2e2","#fecaca","#fca5a5","#f87171","#ef4444","#dc2626","#b91c1c","#991b1b","#7f1d1d"],
  orange: ["#fff7ed","#ffedd5","#fed7aa","#fdba74","#fb923c","#f97316","#ea580c","#c2410c","#9a3412","#7c2d12"],
  amber: ["#fffbeb","#fef3c7","#fde68a","#fcd34d","#fbbf24","#f59e0b","#d97706","#b45309","#92400e","#78350f"],
  yellow: ["#fefce8","#fef9c3","#fef08a","#fde047","#facc15","#eab308","#ca8a04","#a16207","#854d0e","#713f12"],
  lime: ["#f7fee7","#ecfccb","#d9f99d","#bef264","#a3e635","#65a30d","#4d7c0f","#3f6212","#365314"],
  green: ["#f0fdf4","#dcfce7","#bbf7d0","#86efac","#4ade80","#22c55e","#16a34a","#15803d","#166534","#14532d"],
  emerald: ["#ecfdf5","#d1fae5","#a7f3d0","#6ee7b7","#34d399","#10b981","#059669","#047857","#065f46","#064e3b"],
  teal: ["#f0fdfa","#ccfbf1","#99f6e4","#5eead4","#2dd4bf","#14b8a6","#0d9488","#0f766e","#115e59","#134e4a"],
  cyan: ["#ecfeff","#cffafe","#a5f3fc","#67e8f9","#22d3ee","#06b6d4","#0891b2","#0e7490","#155e75","#164e63"],
  sky: ["#f0f9ff","#e0f2fe","#bae6fd","#7dd3fc","#38bdf8","#0ea5e9","#0284c7","#0369a1","#075985","#0c4a6e"],
  blue: ["#eff6ff","#dbeafe","#bfdbfe","#93c5fd","#60a5fa","#3b82f6","#2563eb","#1d4ed8","#1e40af","#1e3a8a"],
  indigo: ["#eef2ff","#e0e7ff","#c7d2fe","#a5b4fc","#818cf8","#6366f1","#4f46e5","#4338ca","#3730a3","#312e81"],
  violet: ["#f5f3ff","#ede9fe","#ddd6fe","#c4b5fd","#a78bfa","#8b5cf6","#7c3aed","#6d28d9","#5b21b6","#4c1d95"],
  purple: ["#faf5ff","#f3e8ff","#e9d5ff","#d8b4fe","#c084fc","#a855f7","#9333ea","#7e22ce","#6b21a8","#581c87"],
  fuchsia: ["#fdf4ff","#fae8ff","#f5d0fe","#f0abfc","#e879f9","#d946ef","#c026d3","#a21caf","#86198f","#701a75"],
  pink: ["#fdf2f8","#fce7f3","#fbcfe8","#f9a8d4","#f472b6","#ec4899","#db2777","#be185d","#9d174d","#831843"],
  rose: ["#fff1f2","#ffe4e6","#fecdd3","#fda4af","#fb7185","#f43f5e","#e11d48","#be123c","#9f1239","#881337"],
};
const SHADES = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900];

function hexToRgb(hex) {
  const h = hex.replace("#", "");
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}
function srgbToLinear(c) {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
}
function luminance(rgb) {
  const [r, g, b] = rgb.map(srgbToLinear);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function contrastRatio(fgHex, bgHex) {
  const l1 = luminance(hexToRgb(fgHex));
  const l2 = luminance(hexToRgb(bgHex));
  const [hi, lo] = l1 >= l2 ? [l1, l2] : [l2, l1];
  return (hi + 0.05) / (lo + 0.05);
}
/** Cari hex warna Tailwind dari kelas seperti text-sky-700 / bg-rose-50. */
function twColor(cls, prefix) {
  const match = cls.match(new RegExp(`${prefix}-([a-z]+)-(\\d+)`));
  if (!match) return null;
  const color = match[1];
  const shade = Number(match[2]);
  const idx = SHADES.indexOf(shade);
  if (!TAILWIND[color] || idx < 0) return null;
  return TAILWIND[color][idx];
}
/** Parse nilai oklch(...) → hex sRGB (OkLab→LMS→linear→gamma sRGB). */
function oklchToHex(oklchStr) {
  const match = oklchStr.match(/oklch\(([\d.]+)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*[\d.%]+)?\)/);
  if (!match) return null;
  const L = Number(match[1]);
  const C = Number(match[2]);
  const H = (Number(match[3]) * Math.PI) / 180;
  const a = C * Math.cos(H);
  const b = C * Math.sin(H);
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;
  const lc = l_ ** 3;
  const mc = m_ ** 3;
  const sc = s_ ** 3;
  const rLin = 4.0767416621 * lc - 3.3077115913 * mc + 0.2309699292 * sc;
  const gLin = -1.2684380046 * lc + 2.6097574011 * mc - 0.3413193965 * sc;
  const bLin = -0.0041960863 * lc - 0.7034186147 * mc + 1.707614701 * sc;
  const toSrgb = (v) => (v <= 0.0031308 ? 12.92 * v : 1.055 * Math.pow(v, 1 / 2.4) - 0.055);
  const clamp = (v) => Math.max(0, Math.min(255, Math.round(v * 255)));
  return `#${[rLin, gLin, bLin].map((v) => clamp(toSrgb(v)).toString(16).padStart(2, "0")).join("")}`;
}
function ratioLabel(ratio) {
  return ratio.toFixed(2) + (ratio >= 4.5 ? " ✅" : ratio >= 3 ? " ⚠️" : " ❌");
}

// ============================================================================
// BAGIAN A — 20 halaman aplikasi
// ============================================================================
const pagesDir = join(root, "src/pages/app");
const files = readdirSync(pagesDir).filter((f) => f.endsWith(".tsx"));
console.log(`\n=== A. AUDIT STATIS ${files.length} HALAMAN APLIKASI (${pagesDir}) ===\n`);

const report = [];
for (const f of files) {
  const src = readFileSync(join(pagesDir, f), "utf8");
  const ui = src
    .replace(/<PrintFrame[\s\S]*?<\/PrintFrame>/g, "")
    .split(/(?:export\s+)?function\s+\w*(?:Print|Laporan)Doc/)[0];
  const issues = [];

  const hasDataTable = src.includes("<DataTable");
  if (/<table/.test(ui) && !hasDataTable && !ui.includes("overflow-x-auto")) {
    reportIssue(issues, "Tabel mentah tanpa wadah overflow-x-auto (scroll horizontal hilang di Android)");
  }

  const inputBlocks = src.split(/<Input\b/g).slice(1);
  inputBlocks.forEach((b, i) => {
    const head = b.slice(0, 500);
    if (/type="number"/.test(head) && !/inputMode/.test(head)) {
      reportIssue(issues, `Input angka #${i + 1} tanpa inputMode (keyboard teks muncul di Android)`);
    }
  });

  ui.split("\n").forEach((ln, i) => {
    if (/grid-cols-(?:[3-9]|1[0-2])/.test(ln) && !/(?:sm|md|lg|xl):grid-cols/.test(ln) && !/print|hidden/.test(ln)) {
      reportIssue(issues, `Grid ${ln.match(/grid-cols-\d+/)?.[0]} tetap di mobile (baris ${i + 1}): ${ln.trim().slice(0, 60)}`);
    }
  });

  const inputCount = inputBlocks.filter((b) => /text-base/.test(b.slice(0, 500))).length;
  report.push({ file: f, issues, inputCount, totalInputs: inputBlocks.length });
}

for (const r of report) {
  console.log(`${r.issues.length ? "❌" : "✅"} ${r.file}`);
  for (const i of r.issues) console.log(`     - ${i}`);
  if (r.totalInputs > 0 && r.inputCount < r.totalInputs) {
    console.log(`     ⚠  Input dengan text-base: ${r.inputCount}/${r.totalInputs} (sisanya tanpa text-base)`);
  }
  if (r.issues.length) fail++;
}
console.log(`\nA: ${report.filter((r) => r.issues.length === 0).length}/${report.length} halaman lolos\n`);

// ============================================================================
// BAGIAN B — render sungguhan DataTable
// ============================================================================
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
  console.log(`\nB: ${ok}/${checks.length} pemeriksaan render lolos\n`);
  try {
    rmSync(entryOut, { force: true });
    rmSync(bundleOut, { force: true });
  } catch {
    /* abaikan */
  }
} catch (e) {
  fail++;
  console.log("❌ Render DataTable GAGAL:", e?.message ?? e, "\n");
}

// ============================================================================
// BAGIAN C — halaman publik (Landing, Auth, Dashboard, NotFound)
// ============================================================================
console.log("=== C. HALAMAN PUBLIK (Landing / Auth / Dashboard / NotFound) ===\n");
const publicPages = ["Landing.tsx", "Auth.tsx", "Dashboard.tsx", "NotFound.tsx"];
const publicDir = join(root, "src/pages");
for (const f of publicPages) {
  const p = join(publicDir, f);
  if (!existsSync(p)) continue;
  const src = readFileSync(p, "utf8");
  const issues = [];

  src.split("\n").forEach((ln, i) => {
    if (/grid-cols-(?:[3-9]|1[0-2])/.test(ln) && !/(?:sm|md|lg|xl):grid-cols/.test(ln) && !/print|hidden/.test(ln)) {
      reportIssue(issues, `Grid ${ln.match(/grid-cols-\d+/)?.[0]} tetap di mobile (baris ${i + 1}): ${ln.trim().slice(0, 60)}`);
    }
  });

  const btns = src.split(/<Button\b/g).slice(1);
  btns.forEach((b, i) => {
    const head = b.slice(0, 300);
    if (/size="icon"/.test(head) && !/aria-label/.test(head)) {
      reportIssue(issues, `Button ikon-only #${i + 1} tanpa aria-label (tidak terbaca screen reader)`);
    }
  });
  const rawBtns = src.split(/<button\b/g).slice(1);
  rawBtns.forEach((b, i) => {
    const head = b.slice(0, 300);
    if (!/aria-label|aria-labelledby/.test(head) && !/>[^<]*[A-Za-z]{2,}/.test(head)) {
      reportIssue(issues, `<button> #${i + 1} tanpa teks & tanpa aria-label`);
    }
  });

  console.log(`${issues.length ? "❌" : "✅"} ${f}`);
  for (const i of issues) console.log(`     - ${i}`);
  if (issues.length) fail++;
}
console.log("");

// ============================================================================
// BAGIAN D — komponen UI: focus state & kontras warna
// ============================================================================
console.log("=== D. KOMPONEN UI (focus-visible & kontras warna WCAG) ===\n");

const uiDirs = [
  join(root, "src/components/ui"),
  join(root, "src/components/app"),
];
const componentFiles = [];
for (const d of uiDirs) {
  if (!existsSync(d)) continue;
  for (const f of readdirSync(d)) {
    if (f.endsWith(".tsx")) componentFiles.push(join(d, f));
  }
}

// 1. Focus state: HANYA elemen HTML mentah (<button>, <a>, <input>, dll.)
//    yang wajib punya focus-visible — komponen <Button>/<Input> sudah punya
//    focus ring bawaan, jadi tidak dihitung di sini.
console.log("D1. Focus state (elemen HTML mentah interaktif wajib punya fokus terlihat):");
let focusChecked = 0;
for (const p of componentFiles) {
  const src = readFileSync(p, "utf8");
  const rawInteractive = /<(button|input|select|textarea)\b|<a\s+href|onClick=/.test(src);
  if (!rawInteractive) continue;
  // File yang memakai komponen <Button>/<Input> tanpa <button>/<input> mentah → aman.
  const hasRawHtmlEl = /<button\b|<input\b|<select\b|<textarea\b|<a\s+href/.test(src);
  if (!hasRawHtmlEl) continue;
  focusChecked++;
  const hasFocus = /focus-visible/.test(src);
  const hasRing = /focus-visible:ring|focus-visible:outline|:focus-visible/.test(src);
  const bareOutline = /outline-none/.test(src) && !/focus-visible:outline|focus-visible:ring/.test(src);
  const issues = [];
  if (!hasFocus) reportIssue(issues, "elemen HTML mentah interaktif tanpa focus-visible sama sekali");
  if (hasFocus && !hasRing) reportIssue(issues, "focus-visible tanpa ring/outline terlihat");
  if (bareOutline) reportIssue(issues, "outline-none tanpa focus-visible ring (fokus hilang saat Tab)");
  if (issues.length) {
    console.log(`❌ ${p.replace(root + "/", "")}`);
    for (const i of issues) console.log(`     - ${i}`);
    fail++;
  }
}
console.log(`     ${focusChecked} komponen dengan elemen mentah diperiksa — yang tidak disebutkan di atas lolos ✅\n`);

// 2. Kontras: pasangan text-<c>-<s> pada bg-<c>-<s> dalam className yang sama.
console.log("D2. Kontras warna (pasangan text-* + bg-* dalam satu className):");
const contrastPairs = [];
for (const p of componentFiles) {
  const src = readFileSync(p, "utf8");
  const clsMatches = src.match(/className=["'`][^"'`]+["'`]/g) ?? [];
  for (const cm of clsMatches) {
    const cls = cm.slice(11, -1);
    const fg = twColor(cls, "text");
    const bg = twColor(cls, "bg");
    if (fg && bg) contrastPairs.push({ fg, bg, cls: cls.slice(0, 90), file: p.replace(root + "/", "") });
  }
}
const uiSrc = existsSync(join(root, "src/components/app/ui.tsx"))
  ? readFileSync(join(root, "src/components/app/ui.tsx"), "utf8")
  : "";
for (const valMatch of uiSrc.matchAll(/"[a-z0-9 -]+text-[a-z]+-\d+[a-z0-9 -]*"/g)) {
  const cls = valMatch[0].slice(1, -1);
  const fg = twColor(cls, "text");
  const bg = twColor(cls, "bg");
  if (fg && bg) contrastPairs.push({ fg, bg, cls: cls.slice(0, 90), file: "src/components/app/ui.tsx (map)" });
}

const seen = new Set();
for (const cp of contrastPairs) {
  const key = cp.fg + "|" + cp.bg;
  if (seen.has(key)) continue;
  seen.add(key);
  const ratio = contrastRatio(cp.fg, cp.bg);
  if (ratio < 4.5) {
    console.log(`❌ ${cp.fg} di atas ${cp.bg} = ${ratioLabel(ratio)}  (${cp.file})`);
    console.log(`     kelas: ${cp.cls}`);
    fail++;
  }
}
console.log(`     ${seen.size} pasangan warna unik diperiksa — yang tidak disebutkan di atas lolos ✅\n`);

// ============================================================================
// BAGIAN E — token tema index.css (light & dark) kontras
// ============================================================================
console.log("=== E. TOKEN TEMA index.css (kontras teks vs latar, light & dark) ===\n");
const cssPath = join(root, "src/index.css");
const css = existsSync(cssPath) ? readFileSync(cssPath, "utf8") : "";
const rootBlock = css.match(/:root\s*{([^}]*)}/)?.[1] ?? "";
const darkBlock = css.match(/\.dark\s*{([^}]*)}/)?.[1] ?? "";

function parseTokens(block) {
  const t = {};
  for (const tok of block.matchAll(/--([a-z-]+):\s*(oklch\([^;]+\))/g)) {
    const hex = oklchToHex(tok[2]);
    if (hex) t[tok[1]] = hex;
  }
  return t;
}
const light = parseTokens(rootBlock);
const dark = parseTokens(darkBlock);

const pairs = [
  ["background", "foreground", "teks utama"],
  ["card", "card-foreground", "teks kartu"],
  ["popover", "popover-foreground", "teks popover"],
  ["muted", "muted-foreground", "teks redup"],
  ["primary", "primary-foreground", "tombol utama"],
  ["secondary", "secondary-foreground", "tombol sekunder"],
  ["accent", "accent-foreground", "aksen"],
  ["sidebar", "sidebar-foreground", "teks sidebar"],
];
for (const [mode, tokens] of [["light", light], ["dark", dark]]) {
  console.log(`Mode ${mode}:`);
  for (const [bgName, fgName, label] of pairs) {
    const bg = tokens[bgName];
    const fg = tokens[fgName];
    if (!bg || !fg) continue;
    const ratio = contrastRatio(fg, bg);
    const bad = ratio < 4.5;
    if (bad) fail++;
    console.log(`  ${bad ? "❌" : "✅"} ${label} (${fgName} on ${bgName}): ${ratioLabel(ratio)}`);
  }
  console.log("");
}

console.log(`\n=== HASIL AKHIR: ${fail === 0 ? "SEMUA LULUS ✅" : fail + " masalah ditemukan ❌"} ===\n`);
process.exit(fail === 0 ? 0 : 1);
