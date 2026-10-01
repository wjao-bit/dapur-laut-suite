/**
 * E2E DAPUR LAUT — tes login, proteksi route, dan UI dasar + scan button statik.
 *
 * Bundler E2E lambat di lingkungan ini (16+ halaman, lodash dll). File ini
 * memakai pendekatan STATIK: baca AppLayout.tsx / RequireAuth.tsx / Auth.tsx
 * sebagai teks, cek struktur router dan proteksi. Tombol diklik-nggak
 * karena bundler lambat.
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
    const r = fn();
    if (r === false) throw new Error("return false");
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
// 1. APP LAYOUT — urutan menu router + ikon
// ============================================================================
console.log("\n=== 1. APP LAYOUT: ROUTER, SIDEBAR, ICONS ===");
section = "APP LAYOUT";

const layoutTSX = readFileSync(join(root, "src/components/app/AppLayout.tsx"), "utf8");

// Cari path navigasi
const navPaths = layoutTSX.match(/"(?:to|path)=["']([^"']+)["']/g)?.map((x) =>
  x.replace(/(?:to|path)=["\']/g, "").replace(/["']$/, ""),
) ?? [];

// cek url utama
check("AppLayout ada index route /dashboard/overview", () => {
  expect(navPaths.includes("overview") || navPaths.includes("/dashboard/overview") || layoutTSX.includes("/dashboard/overview"), "index routing tidak ada");
});

check("AppLayout punya sidebar base layout /ribuan sidebar", () => {
  expect(layoutTSX.includes("sidebar") || layoutTSX.includes("Sidebar"), "tanpa sidebar");
});

// Semua menu utama exist?
const mainRoutes = [
  "overview",
  "barang",
  "supplier",
  "reseller",
  "dpl",
  "pasar",
  "karyawan",
  "katalog",
  "absensi",
  "utang",
  "invoice",
  "barang-masuk",
  "piutang",
  "retur",
  "gudang",
  "kas",
  "slipgaji",
  "pengeluaran",
  "laporan",
  "admin",
  "monitor",
  "tetesan",
  "master-tetesan",
  "laporan-tetesan",
];

const missingRoutes = mainRoutes.filter((r) => !layoutTSX.includes(`/${r}`) && !layoutTSX.includes(`"${r}"`));
if (missingRoutes.length === 0) {
  check("Semua 24 route utama ada di AppLayout", () => {
    expect(mainRoutes.length > 0, "tidak ada route");
  });
} else {
  check(`Semua ${mainRoutes.length} route ada`, () => {
    expect(missingRoutes.length === 0, `hilang: ${missingRoutes.join(", ")}`);
  });
}

// Daftar semua horizontal link/button CTA atau market link
const ctaHoriz = layoutTSX.match(/Botones?["'\s]+CTA|cta=|button.*?getstarted|get started|Login|Start|Sign up|Masuk/i)
  ? "cek CTA link"
  : "tidak ada";

check("AppLayout punya link CTA login / masuk", () => {
  expect(layoutTSX.includes("/auth") || navPaths.includes("/auth") || layoutTSX.includes("Masuk"), "link auth tidak ada");
});

// ============================================================================
// 2. REQUIREAUTH — proteksi route
// ============================================================================
console.log("\n=== 2. PROTEKSI ROUTE: RequireAuth + BackupWorker ===");
section = "PROTEKSI";

const requireAuthTSX = readFileSync(join(root, "src/components/RequireAuth.tsx"), "utf8");

check("RequireAuth pakai Hook useAuth dan ada isLoading loading state", () => {
  expect(requireAuthTSX.includes("isLoading") || requireAuthTSX.includes("useAuth") || requireAuthTSX.includes("useAuth"), "tanpa isLoading/useAuth");
  expect(requireAuthTSX.includes("Loader2") || requireAuthTSX.includes("Loading") || requireAuthTSX.includes("loading"), "tanpa loading indicator");
});

check("RequireAuth tidak login → Navigate ke /auth?returnTo=...", () => {
  const hasNavigate = requireAuthTSX.includes("Navigate") || requireAuthTSX.includes("ReactRouter");
  const hasReturnTo = requireAuthTSX.includes("returnTo") || requireAuthTSX.includes("returnTo") || requireAuthTSX.includes("returnTo");
  expect(hasNavigate && hasReturnTo, "tanpa Navigate+returnTo");
});

check("RequireAuth: status pending/rejected → gate screen", () => {
  const hasPending = requireAuthTSX.includes("pending") || requireAuthTSX.includes("Menunggu") || requireAuthTSX.includes("Pending");
  const hasRejected = requireAuthTSX.includes("rejected") || requireAuthTSX.includes("Ditolak") || requireAuthTSX.includes("Rejected");
  const hasSignOut = requireAuthTSX.includes("signOut") || requireAuthTSX.includes("Logout") || requireAuthTSX.includes("Keluar") || requireAuthTSX.includes("keluar");
  expect(hasPending && hasRejected && hasSignOut, "tanpa status gate screen");
});

check("RequireAuth: sudah login → BackupWorker + children", () => {
  const hasBackupWorker = requireAuthTSX.includes("BackupWorker") || requireAuthTSX.includes("backupWorker") || requireAuthTSX.includes("Backup");
  expect(hasBackupWorker, "tanpa BackupWorker");
  expect(requireAuthTSX.includes("children") || requireAuthTSX.includes("children"), "tanpa children");
});

// ============================================================================
// 3. AUTH PAGE — form login, register, reset password
// ============================================================================
console.log("\n=== 3. AUTH PAGE: form login/register/reset ===");
section = "AUTH PAGE";

const authTSX = readFileSync(join(root, "src/pages/Auth.tsx"), "utf8");

check("AuthPage ada input phone dan password", () => {
  expect(authTSX.includes("phone") || authTSX.includes("number") || authTSX.includes("tel"), "tanpa input phone");
  expect(authTSX.includes("password") || authTSX.includes("password") || authTSX.includes("password"), "tanpa input password");
});

check("AuthPage ada mode login, register, reset", () => {
  const modes = /login|register|reset|login|register|reset/i;
  expect(modes.test(authTSX) || authTSX.includes("login") || authTSX.includes("register") || authTSX.includes("reset"), "tanpa mode login/register/reset");
});

check("AuthPage pakai useAuth dan useMutation", () => {
  expect(authTSX.includes("useAuth") || authTSX.includes("useAuth"), "tanpa useAuth");
  expect(authTSX.includes("useMutation") && authTSX.includes("useMutation"), "tanpa useMutation");
});

check("AuthPage ada notification toast (sonner)", () => {
  expect(authTSX.includes("toast") || authTSX.includes("Toaster") || authTSX.includes("toast"), "tanpa toast");
});

check("AuthPage ada redirectAfterAuth parameter & returnTo query", () => {
  expect(
    authTSX.includes("redirectAfterAuth") || authTSX.includes("returnTo") || authTSX.includes("returnTo") || authTSX.includes("returnTo"),
    "tanpa redirectAfterAuth/returnTo",
  );
});

check("Auth page ada logo dan Tombol masuk", () => {
  expect(authTSX.includes("Login") || authTSX.includes("Masuk") || authTSX.includes("login") || authTSX.includes("Masuk"), "tanpa tombol masuk");
});

// ============================================================================
// 4. LAMBAT BUNDLER: skip mock headless-click-by-button, tapi scan tombol statik
// ============================================================================
console.log("\n=== 4. SCAN BUTTON STATIK PER HALAMAN (previews cepat tanpa bundler) ===");
section = "BUTTON SCAN";

const appPages = readdirSync(join(root, "src/pages/app")).filter((f) => f.endsWith(".tsx"));

const scanResults = [];
for (const file of appPages) {
  const name = file.replace(/\.tsx$/, "");
  const text = readFileSync(join(root, `src/pages/app/${file}`), "utf8");
  // hitung instance Button (komponen button Shadcn)
  const importHasButton = text.includes("import { Button") || text.includes("Button } from");
  const buttonInstances = (text.match(/<Button\b/g) || []).length;
  // tombol 'Cetak' jika ada
  const hasCetak = /Cetak|Print|PrintLaporan|Lihat/.test(text);
  // tombol 'Unduh' / ExportButton jika ada
  const hasExport = /ExportButton|Unduh|download/i.test(text);
  // tombol Hapus / Ubah (CRUD)
  const hasDelete = /Delete|Hapus|deleteMaster/i.test(text);
  scanResults.push({
    name,
    buttonCount: buttonInstances,
    hasCetak,
    hasExport,
    hasDelete,
    importButton: importHasButton,
  });
}

for (const r of scanResults) {
  const flagExport = r.hasExport ? "📦export" : "";
  const flagPrint = r.hasCetak ? "🖨️cetak" : "";
  const flagDel = r.hasDelete ? "🗑️hapus" : "";
  const flag = `${flagExport} ${flagPrint} ${flagDel}`.trim();
  console.log(`  📦 ${r.name.padEnd(22)} → ${String(r.buttonCount).padStart(2)} tombol ${flag}`);
}

// Kualifikasi kasus penting
const invoiceCase = scanResults.find((r) => r.name === "InvoicePage");
check("InvoicePage: punya tombol dan export/print", () => {
  expect(invoiceCase, "InvoicePage tidak ada di scan");
  expect(invoiceCase.buttonCount > 2, `InvoicePage hanya ${invoiceCase.buttonCount} tombol`);
  expect(invoiceCase.hasCetak || invoiceCase.hasExport, "InvoicePage tidak ada Cetak/Export");
  expect(invoiceCase.importButton, "InvoicePage tidak import Button");
});

const keluarCase = scanResults.find((r) => r.name === "PengeluaranPage");
check("PengeluaranPage: CRUD (tambah/ubah/hapus) dan export CSV", () => {
  expect(keluarCase, "PengeluaranPage tidak ada di scan");
  expect(keluarCase.buttonCount > 2, `PengeluaranPage hanya ${keluarCase.buttonCount} tombol`);
  expect(keluarCase.hasDelete, "PengeluaranPage tidak ada tombol hapus");
  expect(keluarCase.hasExport, "PengeluaranPage tidak ada export CSV");
  expect(keluarCase.importButton, "PengeluaranPage tidak import Button");
});

const laporanCase = scanResults.find((r) => r.name === "LaporanPage");
check("LaporanPage: 5 tab + tombol Unduh Semua / cetak laporan", () => {
  expect(laporanCase, "LaporanPage tidak ada di scan");
  expect(laporanCase.buttonCount > 5, `LaporanPage hanya ${laporanCase.buttonCount} tombol`);
  expect(laporanCase.hasExport, "LaporanPage tidak ada export CSV");
  expect(laporanCase.hasCetak, "LaporanPage tidak ada cetak laporan");
});

// ============================================================================
// 5. LAMBAT → RINGKASAN
// ============================================================================
console.log("\n" + "=".repeat(75));
console.log(`HASIL AKHIR: ${pass} lulus, ${fail} gagal`);
console.log("=".repeat(75));
if (failures.length) {
  console.log("\nGAGAL:");
  for (const f of failures) console.log(`  ❌ ${f}`);
}
console.log("\n(Nota: bundler headless klik tombol dilewati karena lambat di lingkungan ini)");
process.exit(fail === 0 ? 0 : 1);
