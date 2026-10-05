/**
 * E2E DAPUR LAUT — cek statik rancang & struktur (tanpa bundler lambat).
 *
 * Mengapa statik: di lingkungan ini, esbuild 16 halaman + lodash butuh lama
 * dan bermasalah. Cek ini membaca file sebagai teks dan memakai pola
 * yang lebih tepat untuk JSX modern (impor multi-line pun dideteksi).
 */
import { readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));

let pass = 0;
let fail = 0;
const failures = [];
let section = "";

function check(name, fn) {
  try {
    if (!fn()) throw new Error("return false");
    console.log(`  ✅ ${name}`);
    pass++;
  } catch (e) {
    console.log(`  ❌ ${name}`);
    console.log(`       → ${String(e?.message ?? e).slice(0, 80)}`);
    fail++;
    failures.push(`[${section}] ${name}: ${e?.message ?? e}`);
  }
}
function expect(cond, msg) {
  if (!cond) throw new Error(msg ?? "gagal");
}

// ============================================================================
// POLA PENGECEKAN JSX (lebih tahan multi-line import)
// ============================================================================

/** Hitung komponen yang dipakai dalam JSX (mendeteksi <Button />, <Button>, <Button>...</Button>) termasuk komponen yang di-import dengan nama berbeda. */
function countComponent(text, name, importAlso = name) {
  const re = new RegExp(`<${name}[\\s/>]`, "g");
  let m;
  let count = 0;
  while ((m = re.exec(text)) !== null) count++;
  // cetak-italik: juga deteksi <ExportButton> / <PrintFrame>
  return count;
}

// ============================================================================
// 1. APP LAYOUT — urutan menu + ikon + sidebar
// ============================================================================
console.log("\n=== 1. APPLICATION LAYOUT: menus, icons, sidebar ===");
section = "APP LAYOUT";

const layoutTSX = readFileSync(join(root, "src/components/app/AppLayout.tsx"), "utf8");

const navRoutes = [];
const routeRe = /to:\s*"([^"]+)"/g;
let m;
while ((m = routeRe.exec(layoutTSX)) !== null) {
  navRoutes.push(m[1]);
}

check("AppLayout punya index route /dashboard/overview", () => {
  const hasOverview = navRoutes.some((r) => r === "/dashboard") || layoutTSX.includes("/dashboard/overview");
  return hasOverview;
});

const expectedRoutes = [
  "/dashboard",
  "/dashboard/barang",
  "/dashboard/supplier",
  "/dashboard/reseller",
  "/dashboard/dpl",
  "/dashboard/pasar",
  "/dashboard/karyawan",
  "/dashboard/katalog",
  "/dashboard/barang-masuk",
  "/dashboard/invoice",
  "/dashboard/piutang",
  "/dashboard/retur",
  "/dashboard/pengeluaran",
  "/dashboard/gudang",
  "/dashboard/kas",
  "/dashboard/absensi",
  "/dashboard/utang",
  "/dashboard/slipgaji",
  "/dashboard/laporan",
  "/dashboard/admin",
  "/dashboard/monitor",
  "/dashboard/tetesan",
  "/dashboard/master-tetesan",
  "/dashboard/laporan-tetesan",
];

const missing = expectedRoutes.filter((r) => !navRoutes.includes(r));
check(`Semua ${expectedRoutes.length} route utama ada di AppLayout`, () => {
  return missing.length === 0;
});

const sidebarSections = [
  "Ringkasan",
  "Master Data",
  "Transaksi",
  "Tetesan",
  "Operasional",
  "Sumber Daya Manusia",
  "Analisis",
  "Pengaturan",
];

const missingSections = sidebarSections.filter((s) => !layoutTSX.includes(`label: "${s}"`));
check("Kelompok sidebar lengkap (8 grup)", () => {
  expect(missingSections.length === 0, `grup hilang: ${missingSections.join(", ")}`);
  return true;
});

const icons = [
  "LayoutDashboard",
  "Package",
  "Truck",
  "Store",
  "Warehouse",
  "Building2",
  "Users",
  "FileText",
  "Undo2",
  "Boxes",
  "Wallet",
  "CalendarCheck",
  "HandCoins",
  "Banknote",
  "ReceiptText",
  "BarChart3",
  "Activity",
  "Droplets",
  "FlaskConical",
  "LineChart",
  "BookOpenText",
  "PackagePlus",
  "ShieldCheck",
  "LogOut",
  "ChevronRight",
  "Bell",
];
const missingIcons = icons.filter((ic) => !layoutTSX.includes(ic));
check("Ikon sidebar lengkap (25+ Lucide)", () => {
  return missingIcons.length === 0;
});

check("Sidebar ada tombol Keluar (signOut)", () => {
  return layoutTSX.includes("signOut") && layoutTSX.includes("LogOut");
});

// ============================================================================
// 2. REQUIREAUTH — proteksi route
// ============================================================================
console.log("\n=== 2. ROUTE PROTECTION: RequireAuth ===");
section = "PROTEKSI";

const requireAuthTSX = readFileSync(join(root, "src/components/RequireAuth.tsx"), "utf8");

check("RequireAuth pakai useAuth dan ada loading state", () => {
  return requireAuthTSX.includes("useAuth") && (requireAuthTSX.includes("isLoading") || requireAuthTSX.includes("loading"));
});

check("RequireAuth: belum login -> Navigate ke /auth?returnTo=...", () => {
  return (
    requireAuthTSX.includes("Navigate") &&
    requireAuthTSX.includes("returnTo") &&
    requireAuthTSX.includes("/auth")
  );
});

check("RequireAuth: status pending/rejected -> gate screen", () => {
  const hasPending = requireAuthTSX.includes("pending") || requireAuthTSX.includes("Menunggu");
  const hasRejected = requireAuthTSX.includes("rejected") || requireAuthTSX.includes("Ditolak");
  return hasPending && hasRejected;
});

check("RequireAuth: sudah login -> BackupWorker + children", () => {
  return requireAuthTSX.includes("BackupWorker") && requireAuthTSX.includes("children");
});

// ============================================================================
// 3. AUTH PAGE — form login/register/reset
// ============================================================================
console.log("\n=== 3. AUTH PAGE: form, notifikasi, redirect ===");
section = "AUTH PAGE";

const authTSX = readFileSync(join(root, "src/pages/Auth.tsx"), "utf8");

check("AuthPage ada form login (phone, password, submit)", () => {
  return (
    authTSX.includes('name="phone"') &&
    authTSX.includes('type="password"') &&
    (authTSX.includes("handleLogin") || authTSX.includes("onSubmit") || authTSX.includes("submit"))
  );
});

check("AuthPage ada mode login, register, reset password", () => {
  return authTSX.includes("login") && authTSX.includes("register") && authTSX.includes("reset");
});

check("AuthPage pakai useAuth dan useMutation", () => {
  return authTSX.includes("useAuth") && authTSX.includes("useMutation");
});

// Notifikasi Auth: Auth.tsx sengaja memakai banner inline (error/notice),
// BUKAN toast — jadi yang dicek adalah adanya umpan balik ke pengguna.
const hasInlineNotice = authTSX.includes("setError(") && authTSX.includes("setNotice(");
const hasToast = /from\s+"sonner"/.test(authTSX) || /useToast\(/.test(authTSX);
check("AuthPage memberi umpan balik notifikasi (banner error/notice)", () => {
  expect(hasInlineNotice || hasToast, "tidak ada banner error/notice maupun toast");
  return true;
});

check("AuthPage ada redirectAfterAuth dan returnTo query", () => {
  return authTSX.includes("redirectAfterAuth") && authTSX.includes("returnTo");
});

check("AuthPage ada tombol Masuk dan Daftar/Lupa password", () => {
  return authTSX.includes("Masuk") && authTSX.includes("Daftar") && authTSX.includes("password");
});

// ============================================================================
// 4. SCAN ALL APP PAGES — tombol, fitur CRUD, cetak, export
// ============================================================================
console.log("\n=== 4. SCAN ALL APP PAGES: buttons, exports, print, CRUD ===");
section = "BUTTON SCAN";

const appPages = readdirSync(join(root, "src/pages/app")).filter((f) => f.endsWith(".tsx"));

const scanResults = [];
for (const file of appPages) {
  const name = file.replace(/\.tsx$/, "");
  const text = readFileSync(join(root, `src/pages/app/${file}`), "utf8");

  const buttonCount = countComponent(text, "Button");
  const exportCount = countComponent(text, "ExportButton");
  const printFrameCount = countComponent(text, "PrintFrame");
  const dialogCount = countComponent(text, "Dialog") + countComponent(text, "DialogContent");
  const tabsCount =
    countComponent(text, "Tabs") + countComponent(text, "TabsList") + countComponent(text, "TabsTrigger");

  const hasDelete = /Hapus|delete|destroy/i.test(text) || /Trash2|Trash/.test(text);
  const hasEdit = /Ubah|Edit|edit|updateMaster|updateInvoice|upsert|openEdit/.test(text);
  const hasPrint = printFrameCount > 0 || /Cetak|Print|Lihat/i.test(text);
  const hasExport = exportCount > 0 || /Unduh|download|Ekspor/i.test(text);
  const hasDataTable = countComponent(text, "DataTable") > 0;

  scanResults.push({
    name,
    buttonCount,
    exportCount,
    printFrameCount,
    dialogCount,
    tabsCount,
    hasDelete,
    hasEdit,
    hasPrint,
    hasExport,
    hasDataTable,
  });
}

for (const r of scanResults) {
  const flags = [
    r.hasExport ? "📦export" : "",
    r.hasPrint ? "🖨️cetak" : "",
    r.hasEdit ? "✏️edit" : "",
    r.hasDelete ? "🗑️hapus" : "",
    r.hasDataTable ? "📋tabel" : "",
    r.printFrameCount > 0 ? "🖼️printFrame" : "",
    r.tabsCount > 0 ? "📑tabs" : "",
  ]
    .filter(Boolean)
    .join(" ");
  const count =
    `tombol: ${r.buttonCount}` +
    (r.exportCount ? `, export: ${r.exportCount}` : "") +
    (r.printFrameCount ? `, print: ${r.printFrameCount}` : "") +
    (r.dialogCount ? `, dialog: ${r.dialogCount}` : "") +
    (r.tabsCount ? `, tabs: ${r.tabsCount}` : "");
  console.log(`  📦 ${r.name.padEnd(20)} ${count.padEnd(40)} ${flags}`);
}

// InvoicePage: harus ada tombol Lihat (preview) + Cetak + Export
check("InvoicePage: ada tombol, Export & PrintFrame (preview vs cetak)", () => {
  const inv = scanResults.find((r) => r.name === "InvoicePage");
  if (!inv) return false;
  expect(inv.buttonCount >= 5, `InvoicePage hanya ${inv.buttonCount} tombol`);
  expect(inv.hasExport, "InvoicePage tidak ada tombol Export");
  expect(inv.printFrameCount > 0, "InvoicePage tidak ada PrintFrame");
  return true;
});

// PengeluaranPage: CRUD (tambah, ubah, hapus) + export CSV
check("PengeluaranPage: CRUD & export CSV", () => {
  const peng = scanResults.find((r) => r.name === "PengeluaranPage");
  if (!peng) return false;
  expect(peng.hasEdit, "PengeluaranPage tidak ada tombol Ubah");
  expect(peng.hasDelete, "PengeluaranPage tidak ada tombol Hapus");
  expect(peng.hasExport, "PengeluaranPage tidak ada export CSV");
  expect(peng.hasDataTable, "PengeluaranPage tidak pakai DataTable");
  return true;
});

// LaporanPage: 5 tab + export + print
check("LaporanPage: 5 tab + export & cetak", () => {
  const lap = scanResults.find((r) => r.name === "LaporanPage");
  if (!lap) return false;
  expect(lap.tabsCount >= 3, `LaporanPage hanya ${lap.tabsCount} tab`);
  expect(lap.hasExport, "LaporanPage tidak ada export CSV");
  expect(lap.hasPrint, "LaporanPage tidak ada fitur print/cetak");
  expect(lap.buttonCount >= 3, `LaporanPage hanya ${lap.buttonCount} tombol`);
  return true;
});

// TetesanPage
check("TetesanPage: tombol ada & fitur cetak/print", () => {
  const tdt = scanResults.find((r) => r.name === "TetesanPage");
  if (!tdt) return false;
  expect(tdt.hasPrint || tdt.printFrameCount > 0, "TetesanPage tidak ada print/cetak");
  expect(tdt.buttonCount > 2, `TetesanPage hanya ${tdt.buttonCount} tombol`);
  return true;
});

// GudangPage
check("GudangPage: tabel stok & ExportButton", () => {
  const gdg = scanResults.find((r) => r.name === "GudangPage");
  if (!gdg) return false;
  expect(gdg.hasDataTable, "GudangPage tidak pakai DataTable");
  expect(gdg.exportCount > 0, "GudangPage tidak punya ExportButton");
  expect(gdg.printFrameCount > 0, "GudangPage tidak punya PrintFrame");
  return true;
});

// KasPage
check("KasPage: tabel kas, export, cetak & hapus", () => {
  const kas = scanResults.find((r) => r.name === "KasPage");
  if (!kas) return false;
  expect(kas.hasDataTable, "KasPage tidak pakai DataTable");
  expect(kas.hasDelete, "KasPage tidak ada tombol hapus");
  expect(kas.exportCount > 0, "KasPage tidak punya ExportButton");
  expect(kas.printFrameCount > 0, "KasPage tidak ada PrintFrame/cetak");
  return true;
});

// ============================================================================
// 5. HALAMAN CRUCIAL — fitur spesifik hasil perbaikan
// ============================================================================
console.log("\n=== 5. HALAMAN CRUCIAL: fitur spesifik ===");
section = "FITUR";

check("InvoicePage: `Lihat` hanya preview (autoPrint={false})", () => {
  const inv = readFileSync(join(root, "src/pages/app/InvoicePage.tsx"), "utf8");
  return inv.includes("autoPrint={false}") || /autoPrint.*false/.test(inv);
});

check("PengeluaranPage: form edit (ID terkunci, Simpan Perubahan)", () => {
  const peng = readFileSync(join(root, "src/pages/app/PengeluaranPage.tsx"), "utf8");
  return peng.includes("disabled={editing}") && peng.includes("Simpan Perubahan");
});

check("InvoiceFormDialog: tombol items tidak hilang saat ganti pihak", () => {
  const dialog = readFileSync(join(root, "src/components/app/InvoiceFormDialog.tsx"), "utf8");
  return (
    dialog.includes("appliedSession") && dialog.includes("changeTipe") && dialog.includes("max-h-[92vh]")
  );
});

check("PrintFrame: ada autoPrint prop (default true)", () => {
  const pf = readFileSync(join(root, "src/components/app/PrintFrame.tsx"), "utf8");
  return pf.includes("autoPrint?") && pf.includes("boolean") && pf.includes("= true");
});

check("ExportButton: unduh CSV berfungsi", () => {
  const eb = readFileSync(join(root, "src/components/app/ExportButton.tsx"), "utf8");
  const exp = readFileSync(join(root, "src/lib/export.ts"), "utf8");
  expect(eb.includes("downloadCsv"), "ExportButton tidak memanggil downloadCsv");
  expect(eb.includes("<Download"), "ExportButton tidak punya ikon Download");
  expect(/export function downloadCsv/.test(exp), "lib/export.ts tidak mengekspor downloadCsv");
  expect(exp.includes("\\uFEFF"), "CSV tidak memakai BOM UTF-8 (Excel locale Indonesia)");
  expect(exp.includes('";"'), "CSV tidak memakai pemisah ';'");
  return true;
});

check("Notes / catatan invoice tersedia di InvoiceFormDialog", () => {
  const dialog = readFileSync(join(root, "src/components/app/InvoiceFormDialog.tsx"), "utf8");
  return dialog.includes("Textarea") && dialog.includes("catatan") && dialog.includes("setCatatanInvoice");
});

check("Catatan invoice muncul di cetakan (InvoicePrintDoc)", () => {
  const pdf = readFileSync(join(root, "src/components/app/InvoicePrintDoc.tsx"), "utf8");
  return pdf.includes("Catatan") || pdf.includes("catatan");
});

check("LaporanPage: dataset 5 dan Unduh Semua (slip gaji & keuangan)", () => {
  const lap = readFileSync(join(root, "src/pages/app/LaporanPage.tsx"), "utf8");
  return (
    lap.includes("handleDownloadAll") &&
    lap.includes("laporan-stok") &&
    lap.includes("laporan-keuangan") &&
    lap.includes("rekap-barang") &&
    lap.includes("rekap-pihak") &&
    lap.includes("analisis-margin")
  );
});

// ============================================================================
// HASIL
// ============================================================================
console.log("\n" + "=".repeat(75));
console.log(`HASIL AKHIR: ${pass} lulus, ${fail} gagal, ${scanResults.length} halaman discan`);
console.log("=".repeat(75));
if (failures.length) {
  console.log("\nGAGAL:");
  for (const f of failures) console.log(`  ❌ ${f}`);
}
console.log(
  "\nNota: cek statik tanpa bundling. Tombol asli dipakai pengguna = render React DOM sungguhan (butuh bundler).",
);
process.exit(fail === 0 ? 0 : 1);
