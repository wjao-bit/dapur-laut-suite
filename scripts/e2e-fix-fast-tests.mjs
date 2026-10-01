import { readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));

const failures = [];
let pass = 0;
let fail = 0;
function check(name, fn) {
  try {
    if (!fn()) throw new Error("return false");
    console.log(`  ✅ ${name}`);
    pass++;
  } catch (e) {
    console.log(`  ❌ ${name}`);
    console.log(`       → ${String(e?.message ?? e).slice(0,80)}`);
    fail++;
    failures.push(`[${fn.name || "check"}] ${name}: ${e?.message ?? e}`);
  }
}

// ===========================================================================
// F1. Auth: toast
// ===========================================================================
check("Auth pahami notifikasi toast (toast.success/error)", () => {
  const authTSX = readFileSync(join(root, "src/pages/Auth.tsx"), "utf8");
  return /toast\.(success|error)/.test(authTSX);
});

// ===========================================================================
// F2. AppLayout: grup sidebar lengkap
// ===========================================================================
check("AppLayout sidebar: grup lengkap (8+ label)", () => {
  const appLayoutTSX = readFileSync(join(root, "src/components/app/AppLayout.tsx"), "utf8");
  const groups = ["Ringkasan", "Master Data", "Transaksi",
    "Operasional", "Sumber Daya Manusia", "Analisis",
    "Pengaturan", "Tetesan"];
  return groups.every((g) => appLayoutTSX.includes(g));
});

// ===========================================================================
// F3. ExportButton: ada export berfungsi (downloadCsv + BOM)
// ===========================================================================
check("ExportButton berfungsi: ada downloadCsv + BOM UTF-8", () => {
  const expLib = readFileSync(join(root, "src/lib/export.ts"), "utf8");
  const hasBOM = expLib.includes("\uFEFF");
  const hasDownloadFn = /function downloadCsv/.test(expLib) || expLib.includes("export function downloadCsv") ||
    /downloadCsv\s*=/.test(expLib);
  return hasBOM && hasDownloadFn;
});

// ===========================================================================
// F4. GudangPage: fitur export CSV tersedia
// ===========================================================================
check("GudangPage punya fitur export CSV (ExportButton/downloadCsv)", () => {
  const gdg = readFileSync(join(root, "src/pages/app/GudangPage.tsx"), "utf8");
  const hasExportFn = gdg.includes("exportfunction") || /downloadCsv|ExportButton|Unduh LCS/i.test(gdg);
  const hasButtonComponent = gdg.includes("ExportButton");
  const hasAnyExport = hasButtonComponent || hasExportFn || gdg.includes("downloadCsv");
  return hasAnyExport;
});

// ===========================================================================
// F5. KasPage: fitur cetak tersedia (PrintFrame)
// ===========================================================================
check("KasPage punya fitur cetak (PrintFrame/Cetak)", () => {
  const kas = readFileSync(join(root, "src/pages/app/KasPage.tsx"), "utf8");
  const hasPrintFn = kas.includes("PrintFrame") || /cetak|Cetak|Printer/i.test(kas) ||
    kas.includes("<PrintFrame");
  return hasPrintFn;
});

console.log("\n" + "=".repeat(75));
console.log(`Hasil khusus: ${pass} lulus, ${fail} gagal`);
console.log("=".repeat(75));
for (const f of failures) console.log(`  ❌ ${f}`);
