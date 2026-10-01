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
// S1. Auth: missing toast
// ===========================================================================
check("Auth pahami notifikasi toast (toast.success/error)", () => {
  const authTSX = readFileSync(join(root, "src/pages/Auth.tsx"), "utf8");
  return /toast\.(success|error|info|warning|message)/.test(authTSX);
});

// ===========================================================================
// S2. AppLayout: missing "grup sidebar" label
// ===========================================================================
check("AppLayout bikin grup rigi kategoris sidebar", () => {
  const appLayoutTSX = readFileSync(join(root, "src/components/app/AppLayout.tsx"), "utf8");
  const groups = ["Ringkasan", "Master Data", "Transaksi", "Operasional",
    "Sumber Daya Manusia", "Analisis", "Pengaturan", "Tetesan"];
  return groups.every((g) => appLayoutTSX.includes(g));
});

// ===========================================================================
// S3. Komponen: ExportButton bisa digunakan & berfungsi
// ===========================================================================
check("ExportButton: fungsi export berfungsi (berisi downloadCsv dengan BOM)", () => {
  const exportTSX = readFileSync(join(root, "src/components/app/ExportButton.tsx"), "utf8");
  const exportLib = readFileSync(join(root, "src/lib/export.ts"), "utf8");
  const hasBOM = exportLib.includes("\uFEFF");
  const hasDownloadCsvFn = exportLib.includes("function downloadCsv") || exportTSX.includes("downloadCsv");
  const hasExportButtonComponent = exportTSX.includes("function ExportButton") &&
    exportTSX.includes("downloadCsv") && hasDownloadCsvFn && hasBOM;
  return hasExportButtonComponent;
});

// ===========================================================================
// S4. Gudang: fitur export CSV tersedia (exportButton present)
// ===========================================================================
check("GudangComponent : fitur export CSV tersedia (penanda ExportButton)", () => {
  const gdg = readFileSync(join(root, "src/pages/app/GudangPage.tsx"), "utf8");
  const hasExportFn = gdg.includes("ExportButton") || gdg.includes("downloadCsv") || gdg.includes("Unduh CSV");
  return hasExportFn;
});

// ===========================================================================
// S5. KasPage fitur cetak (printFrame)
// ===========================================================================
check("KasPage: mempunyai fitur cetak padahal ExportButton dapat didesain", () => {
  const kas = readFileSync(join(root, "src/pages/app/KasPage.tsx"), "utf8");
  const hasPrintFn = kas.includes("PrintFrame") || kas.includes("Cetak") || kas.includes("Printer");
  return hasPrintFn;
});

// ===========================================================================
// SISANYA
// ===========================================================================
console.log("\n" + "=".repeat(75));
console.log(`Hasil khusus: ${pass} lulus, ${fail} gagal`);
console.log("=".repeat(75));
for (const f of failures) console.log(`  ❌ ${f}`);
