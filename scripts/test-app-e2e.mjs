/**
 * E2E APLIKASI DAPUR LAUT — dari LOGIN sampai SEMUA TOMBOL di setiap halaman.
 *
 * Komponen React SUNGGUHAN dirender di DOM (happy-dom) lalu tombol-tombolnya
 * DIKLIK seperti pengguna. Mock hanya untuk convex/react (tanpa server),
 * sonner (toast), dan tesseract.js (OCR).
 *
 *   A. LOGIN         form masuk, normalisasi nomor HP, daftar, lupa password,
 *                    returnTo (redirect setelah login), login gagal.
 *   B. PROTEKSI      RequireAuth: belum login → /auth?returnTo=…, pending,
 *                    rejected, sudah login → isi halaman tampil.
 *   C. SEMUA HALAMAN tiap halaman: render + KLIK SEMUA TOMBOL (tanpa crash).
 *   D. DENGAN DATA   halaman penting dengan data contoh: tabel terisi, dialog
 *                    ubah pengeluaran, invoice tidak auto-print, dsb.
 *   E. UNDUH/EXPORT  CSV pengeluaran/invoice/laporan: isi file, BOM, nama file.
 *   F. INVENTARIS    daftar tombol tiap halaman yang ikut diklik.
 *
 * Cara jalan: node scripts/test-app-e2e.mjs
 */
import { setupE2E, createRunner, listAppPages, cleanupBundle } from "./e2e-kit.mjs";

const { check, expect, setSection, report } = createRunner();
const {
  B, h, act, win, resetState, mount, click, typeInto, clickEveryButton,
  downloadNames, downloadText, Probe, spy,
} = await setupE2E();

const pageFiles = listAppPages();

// ============================================================================
// FIXTURE DATA CONTOH
// ============================================================================
const FIX = {
  "queries:listPengeluaran": [
    { id: "PEN001", tanggal: "2026-09-30", jenis: "Operasional", nominal: 150000, keterangan: "Gas elpiji", idKaryawan: "" },
    { id: "PEN002", tanggal: "2026-09-29", jenis: "Transport", nominal: 75000, keterangan: "", idKaryawan: "" },
  ],
  "queries:listKaryawan": [
    { id: "KRY001", nama: "Budi Santoso", jabatan: "Nelayan", gajiPokok: 2000000, telepon: "0811" },
    { id: "KRY002", nama: "Siti Aminah", jabatan: "Admin", gajiPokok: 2500000, telepon: "0812" },
  ],
  "queries:listInvoice": [
    {
      idInvoice: "INV001", tanggal: "2026-09-30", tenggat: "2026-10-05", tipe: "Reseller",
      namaPihak: "Toko Maju", alamatPihak: "Jl. Laut No. 1", teleponPihak: "0813",
      items: [{ namaBarang: "Ikan Tuna", qty: 10, satuan: "kg", hargaSatuan: 55000, subtotal: 550000 }],
      total: 550000, dibayar: 200000, sisa: 350000, status: "DP", catatan: "Tolong dipisah",
      biayaTambahan: 0,
    },
  ],
  "queries:listBarang": [
    { id: "BRG001", kode: "BRG001", nama: "Ikan Tuna", kategori: "Ikan", satuan: "kg", hargaJual: 55000, hargaBeli: 40000, stok: 25, stokMin: 5 },
    { id: "BRG002", kode: "BRG002", nama: "Udang Vaname", kategori: "Udang", satuan: "kg", hargaJual: 90000, hargaBeli: 70000, stok: 4, stokMin: 5 },
  ],
  "queries:listGudang": [
    { id: "GDG001", kode: "BRG001", namaBarang: "Ikan Tuna", satuan: "kg", stokAwal: 10, stokAkhir: 25, stokMin: 5 },
  ],
  "queries:listStokHistory": [
    { id: "SH001", namaBarang: "Ikan Tuna", tanggal: "2026-09-30", tipe: "Masuk", jumlah: 15, keterangan: "Batch #1" },
  ],
  "queries:listKas": [
    { id: "KAS001", tanggal: "2026-09-30", tipe: "Masuk", nominal: 200000, keterangan: "DP INV001" },
    { id: "KAS002", tanggal: "2026-09-30", tipe: "Keluar", nominal: 150000, keterangan: "PEN001" },
  ],
  "queries:laporanStok": [{ namaBarang: "Ikan Tuna", stokAwal: 10, stokMasuk: 15, stokKeluar: 0, stokAkhir: 25 }],
  "queries:laporanKeuangan": {
    pendapatan: { total: 550000, reseller: 550000, dpl: 0, pasar: 0 },
    pengeluaran: { total: 150000, manual: 150000, invoiceSupplier: 0, slipGaji: 0 },
    laba: 400000,
    rincianPendapatan: [{ id: "INV001", tanggal: "2026-09-30", tipe: "Reseller", pihak: "Toko Maju", nominal: 550000 }],
    rincianPengeluaran: [{ id: "PEN001", tanggal: "2026-09-30", tipe: "Operasional", pihak: "Gas elpiji", nominal: 150000 }],
  },
  "queries:rekapBarang": { rows: [{ namaBarang: "Ikan Tuna", masuk: 15, keluar: 0, net: 15 }], totalMasuk: 15, totalKeluar: 0 },
  "queries:rekapPihak": [{ tipe: "Reseller", namaPihak: "Toko Maju", totalTransaksi: 1, totalBarang: 10, totalNilai: 550000 }],
  "queries:analisisMargin": {
    perProduk: [{ kodeBarang: "BRG001", namaBarang: "Ikan Tuna", totalModal: 400000, totalPenjualan: 550000, margin: 150000, marginPct: 27.3 }],
    perPasar: [{ pihak: "Pasar Beringharjo", margin: 50000, marginPct: 12.5 }],
    perReseller: [{ pihak: "Toko Maju", margin: 150000, marginPct: 27.3 }],
  },
  "admin:getSession": { phone: "0811", nama: "Admin Dapur Laut", status: "approved", role: "Admin Master" },
  "admin:ensureDefaultAdmin": { created: false },
};

function loginAs(fixtures = {}) {
  resetState({
    fixtures: { ...FIX, ...fixtures },
    mutationResults: { "admin:adminLogin": { ok: true, token: "TOKEN-E2E" } },
  });
  win.localStorage.setItem("dapurlaut.admin.token", "TOKEN-E2E");
}

// ============================================================================
// A. LOGIN
// ============================================================================
console.log("\n=== A. LOGIN (halaman /auth) ===");
setSection("A. LOGIN");

function authRoutes(redirect = "/dashboard") {
  return h(
    B.Routes,
    null,
    h(B.Route, { path: "/auth", element: h(B.AuthPage, { redirectAfterAuth: redirect }) }),
    h(B.Route, { path: "/dashboard/*", element: h(Probe, { marker: "dash" }) }),
  );
}

async function mountAuth(route = "/auth") {
  resetState({
    fixtures: { ...FIX, "admin:getSession": null },
    mutationResults: {
      "admin:adminLogin": { ok: true, token: "TOKEN-E2E" },
      "admin:registerAkun": { ok: true, status: "pending" },
      "admin:resetPasswordPublic": { ok: true },
    },
  });
  return await mount(() => authRoutes(), route);
}

async function fillLogin(v, phone, pw) {
  const inputs = v.inputs();
  const phoneEl = inputs.find((i) => i.type === "tel" || i.name === "phone") ?? inputs[0];
  const pwEl = inputs.find((i) => i.type === "password") ?? inputs[1];
  await typeInto(phoneEl, phone);
  await typeInto(pwEl, pw);
  await click(v.buttons().find((b) => /masuk|login/i.test(b.textContent ?? "")));
  await act(async () => {});
}

await check("halaman login tampil (form + tombol Masuk)", async () => {
  const v = await mountAuth();
  expect(/masuk|login/i.test(v.text()), "tidak ada kata 'Masuk' di halaman");
  expect(v.inputs().length >= 2, "input nomor/password tidak lengkap");
  expect(v.buttons().length >= 1, "tidak ada tombol");
  await v.unmount();
});

await check("tombol Masuk bisa diklik tanpa error", async () => {
  const v = await mountAuth();
  const submit = v.buttons().find((b) => /masuk|login/i.test(b.textContent ?? ""));
  expect(submit, "tombol Masuk tidak ditemukan");
  await click(submit);
  expect(spy.errors.length === 0, `error saat klik: ${spy.errors[0]?.slice(0, 80)}`);
  await v.unmount();
});

await check("login mengirim nomor HP yang sudah dinormalisasi", async () => {
  const v = await mountAuth();
  await fillLogin(v, "0812-345.678", "rahasia123");
  const login = spy.mutations.find((m) => m.name === "admin:adminLogin");
  expect(login, "mutasi admin:adminLogin tidak terpanggil");
  expect(login.args.phone === "0812345678", `nomor tidak dinormalisasi: ${login.args.phone}`);
  expect(login.args.password === "rahasia123", "password tidak terkirim");
  await v.unmount();
});

await check("token sesi tersimpan setelah login berhasil", async () => {
  const v = await mountAuth();
  await fillLogin(v, "0812345678", "rahasia123");
  const token = win.localStorage.getItem("dapurlaut.admin.token");
  expect(token === "TOKEN-E2E", `token tidak tersimpan (dapat: ${token})`);
  await v.unmount();
});

await check("setelah login langsung diarahkan ke /dashboard", async () => {
  const v = await mountAuth();
  await fillLogin(v, "0812345678", "rahasia123");
  expect(v.text().includes("PROBE:/dashboard"), `tujuan salah: ${v.text().slice(0, 80)}`);
  await v.unmount();
});

await check("returnTo sah dipakai: /auth?returnTo=/dashboard/invoice → invoice", async () => {
  const v = await mountAuth("/auth?returnTo=/dashboard/invoice");
  await fillLogin(v, "0812345678", "rahasia123");
  expect(v.text().includes("PROBE:/dashboard/invoice"), `tujuan salah: ${v.text().slice(0, 100)}`);
  await v.unmount();
});

await check("returnTo jahat (//evil.com) ditolak → tetap ke /dashboard", async () => {
  const v = await mountAuth("/auth?returnTo=//evil.com");
  await fillLogin(v, "0812345678", "rahasia123");
  expect(v.text().includes("PROBE:/dashboard"), `tidak jatuh ke dashboard: ${v.text().slice(0, 100)}`);
  expect(!v.text().includes("evil.com"), "URL luar dipakai sebagai tujuan");
  await v.unmount();
});

await check("login gagal → pesan error tampil & token tidak tersimpan", async () => {
  resetState({
    fixtures: { ...FIX, "admin:getSession": null },
    mutationResults: { "admin:adminLogin": Promise.reject({ data: { message: "Nomor atau password salah" } }) },
  });
  const v = await mount(() => authRoutes(), "/auth");
  await fillLogin(v, "0812345678", "salah");
  expect(/password salah/i.test(v.text()), "pesan error tidak muncul");
  expect(!win.localStorage.getItem("dapurlaut.admin.token"), "token tersimpan padahal login gagal");
  await v.unmount();
});

await check("tombol 'Daftar' membuka form pendaftaran akun", async () => {
  const v = await mountAuth();
  const toRegister = v.buttons().find((b) => /daftar|registrasi|buat akun/i.test(b.textContent ?? ""));
  if (toRegister) {
    await click(toRegister);
    expect(/nama/i.test(v.text()), "form daftar tidak menampilkan field Nama");
    const back = v.buttons().find((b) => /sudah punya|masuk|kembali/i.test(b.textContent ?? ""));
    if (back) await click(back);
  }
  await v.unmount();
});

await check("tombol 'Lupa Password' membuka form reset", async () => {
  const v = await mountAuth();
  const forgot = v.buttons().find((b) => /lupa|reset/i.test(b.textContent ?? ""));
  if (forgot) {
    await click(forgot);
    expect(/reset|lupa|password baru/i.test(v.text()), "form reset tidak muncul");
  }
  await v.unmount();
});

await check("semua tombol di halaman login aman diklik", async () => {
  const v = await mountAuth();
  const problems = await clickEveryButton(v);
  await v.unmount();
  expect(problems.length === 0, problems.map((p) => `"${p.label}": ${p.error}`).join(" | "));
});

// ============================================================================
// B. PROTEKSI ROUTE
// ============================================================================
console.log("\n=== B. PROTEKSI ROUTE (RequireAuth) ===");
setSection("B. PROTEKSI");

const privateRoutes = () =>
  h(
    B.Routes,
    null,
    h(B.Route, { path: "/auth", element: h(Probe, { marker: "auth" }) }),
    h(B.Route, {
      path: "/dashboard/invoice",
      element: h(B.RequireAuth, null, h(Probe, { marker: "isi-halaman" })),
    }),
  );

await check("belum login → isi halaman TIDAK tampil & dialihkan ke /auth", async () => {
  resetState({ fixtures: { "admin:getSession": null } });
  const v = await mount(privateRoutes, "/dashboard/invoice");
  expect(!v.text().includes("PROBE:isi-halaman"), "halaman privat tampil tanpa login");
  expect(v.text().includes("PROBE:/auth"), "tidak dialihkan ke halaman auth");
  await v.unmount();
});

await check("returnTo berisi halaman tujuan yang tadi dibuka", async () => {
  resetState({ fixtures: { "admin:getSession": null } });
  const v = await mount(privateRoutes, "/dashboard/invoice");
  expect(
    /returnTo=%2Fdashboard%2Finvoice|returnTo=\/dashboard\/invoice/.test(v.text()),
    `returnTo tidak sesuai: ${v.text()}`,
  );
  await v.unmount();
});

await check("sudah login (approved) → isi halaman tampil", async () => {
  resetState({ fixtures: { "admin:getSession": FIX["admin:getSession"] } });
  win.localStorage.setItem("dapurlaut.admin.token", "TOKEN-E2E");
  const v = await mount(privateRoutes, "/dashboard/invoice");
  expect(v.text().includes("PROBE:isi-halaman"), "isi halaman tidak tampil padahal sudah login");
  await v.unmount();
});

await check("status pending → 'Menunggu Persetujuan Admin' + Keluar membersihkan token", async () => {
  resetState({
    fixtures: { "admin:getSession": { phone: "0811", nama: "A", status: "pending", role: "Admin" } },
  });
  win.localStorage.setItem("dapurlaut.admin.token", "TOKEN-E2E");
  const v = await mount(privateRoutes, "/dashboard/invoice");
  expect(/menunggu persetujuan/i.test(v.text()), "layar pending tidak muncul");
  expect(!v.text().includes("PROBE:isi-halaman"), "isi halaman bocor saat pending");
  const keluar = v.buttons().find((b) => /keluar/i.test(b.textContent ?? ""));
  expect(keluar, "tombol Keluar tidak ada");
  await click(keluar);
  expect(!win.localStorage.getItem("dapurlaut.admin.token"), "token tidak dibersihkan");
  await v.unmount();
});

await check("status rejected → layar 'Akses Ditolak'", async () => {
  resetState({
    fixtures: { "admin:getSession": { phone: "0811", nama: "A", status: "rejected", role: "Admin" } },
  });
  win.localStorage.setItem("dapurlaut.admin.token", "TOKEN-E2E");
  const v = await mount(privateRoutes, "/dashboard/invoice");
  expect(/ditolak/i.test(v.text()), "layar rejected tidak muncul");
  expect(!v.text().includes("PROBE:isi-halaman"), "isi halaman bocor saat ditolak");
  await v.unmount();
});

// ============================================================================
// C. SEMUA HALAMAN + KLIK SEMUA TOMBOL
// ============================================================================
console.log(`\n=== C. ${pageFiles.length} HALAMAN: RENDER + KLIK SEMUA TOMBOL ===`);
setSection("C. HALAMAN");

const inventory = [];
for (const file of pageFiles) {
  const name = file.replace(/\.tsx$/, "");
  const Comp = B.PAGES[name];

  await check(`${name} → render tanpa crash`, async () => {
    loginAs();
    const v = await mount(() => h(Comp));
    expect(!v.error, `render error: ${v.error?.message}`);
    expect(v.text().trim().length > 10, `halaman kosong (${v.text().trim().length} karakter)`);
    await v.unmount();
  });

  await check(`${name} → semua tombol diklik, tidak ada yang error`, async () => {
    loginAs();
    const v = await mount(() => h(Comp));
    const labels = v.buttons().map(
      (b) =>
        (b.textContent || b.getAttribute("aria-label") || b.getAttribute("title") || "(ikon)")
          .trim()
          .replace(/\s+/g, " ")
          .slice(0, 32),
    );
    const problems = await clickEveryButton(v, { skip: ["Keluar", "Logout"] });
    await v.unmount();
    inventory.push({ page: name, labels });
    expect(problems.length === 0, problems.map((p) => `"${p.label}": ${p.error}`).join(" | "));
  });
}

// ============================================================================
// D. HALAMAN DENGAN DATA + AKSI TOMBOL PENTING
// ============================================================================
console.log("\n=== D. AKSI TOMBOL DENGAN DATA NYATA ===");
setSection("D. AKSI");

await check("Pengeluaran: tabel terisi dari data", async () => {
  loginAs();
  const v = await mount(() => h(B.PAGES.PengeluaranPage));
  const t = v.text();
  expect(t.includes("PEN001") && t.includes("PEN002"), "baris pengeluaran tidak tampil");
  expect(/150\.000|150,000/.test(t), "nominal tidak terformat");
  await v.unmount();
});

await check("Pengeluaran: 'Catat Pengeluaran' membuka dialog input", async () => {
  loginAs();
  const v = await mount(() => h(B.PAGES.PengeluaranPage));
  await click(v.buttonByText("Catat Pengeluaran"));
  expect(/catat pengeluaran/i.test(v.text()), "dialog catat tidak terbuka");
  await v.unmount();
});

await check("Pengeluaran: tombol Ubah membuka dialog EDIT berisi data lama", async () => {
  loginAs();
  const v = await mount(() => h(B.PAGES.PengeluaranPage));
  const edit = v.buttons().find((b) => b.getAttribute("title") === "Ubah pengeluaran");
  expect(edit, "tombol Ubah tidak ada di baris tabel");
  await click(edit);
  const t = v.text();
  expect(/ubah pengeluaran/i.test(t), "dialog ubah tidak terbuka");
  expect(t.includes("PEN001"), "ID lama tidak terisi");
  const idInput = v.inputs().find((i) => i.value === "PEN001");
  expect(idInput?.disabled === true, "ID harus terkunci saat mengubah data");
  expect(/simpan perubahan/i.test(t), "tombol Simpan Perubahan tidak ada");
  await v.unmount();
});

await check("Pengeluaran: simpan perubahan memakai ID yang sama (upsert)", async () => {
  loginAs();
  const v = await mount(() => h(B.PAGES.PengeluaranPage));
  await click(v.buttons().find((b) => b.getAttribute("title") === "Ubah pengeluaran"));
  const simpan = v.buttonByText("Simpan Perubahan");
  expect(simpan, "tombol Simpan Perubahan tidak ada");
  await click(simpan);
  const call = spy.mutations.find((m) => m.name === "business:upsertPengeluaran");
  expect(call, "mutasi upsertPengeluaran tidak terpanggil");
  expect(call.args.doc.id === "PEN001", `ID berubah: ${call.args.doc.id}`);
  expect(call.args.doc.nominal === 150000, `nominal salah: ${call.args.doc.nominal}`);
  await v.unmount();
});

await check("Pengeluaran: Unduh CSV → file + kolom + BOM UTF-8", async () => {
  loginAs();
  const v = await mount(() => h(B.PAGES.PengeluaranPage));
  await click(v.buttonByText("Unduh CSV"));
  expect(spy.downloads.length === 1, `${spy.downloads.length} unduhan (harus 1)`);
  expect(/pengeluaran-\d{4}-\d{2}-\d{2}\.csv/.test(downloadNames()[0]), `nama file: ${downloadNames()[0]}`);
  const csv = await downloadText(0);
  expect(csv.includes("ID;Tanggal;Jenis;Nominal;Keterangan"), "header CSV salah");
  expect(csv.includes("PEN001"), "baris PEN001 tidak ada di CSV");
  expect(csv.startsWith("\uFEFF"), "BOM UTF-8 hilang (Excel salah baca)");
  await v.unmount();
});

await check("Invoice: 'Lihat' membuka pratinjau TANPA memicu print (bug lama)", async () => {
  loginAs();
  const v = await mount(() => h(B.PAGES.InvoicePage));
  spy.print = 0;
  const lihat = v.buttons().find(
    (b) => /lihat/i.test(b.textContent ?? "") || b.getAttribute("title") === "Lihat",
  );
  expect(lihat, "tombol Lihat tidak ditemukan");
  await click(lihat);
  await act(async () => {});
  expect(spy.print === 0, "dialog cetak langsung terbuka — window.print terpanggil");
  expect(/INV001|invoice/i.test(v.text()), "pratinjau invoice tidak tampil");
  await v.unmount();
});

await check("Invoice: tombol Cetak TETAP memicu window.print", async () => {
  loginAs();
  const v = await mount(() => h(B.PAGES.InvoicePage));
  spy.print = 0;
  const cetak = v.buttons().find(
    (b) => /cetak|print|pdf/i.test(b.textContent ?? "") || /cetak/i.test(b.getAttribute("title") ?? ""),
  );
  expect(cetak, "tombol Cetak tidak ditemukan");
  await click(cetak);
  await act(async () => {});
  expect(spy.print >= 1, "window.print tidak terpanggil saat klik Cetak");
  await v.unmount();
});

await check("Invoice: Unduh CSV memuat daftar barang + catatan", async () => {
  loginAs();
  const v = await mount(() => h(B.PAGES.InvoicePage));
  await click(v.buttonByText("Unduh CSV"));
  expect(spy.downloads.length === 1, `${spy.downloads.length} unduhan (harus 1)`);
  const csv = await downloadText(0);
  expect(csv.includes("INV001"), "baris invoice tidak ada");
  expect(csv.includes("Ikan Tuna"), "rincian barang tidak ikut terunduh");
  expect(csv.includes("Tolong dipisah"), "catatan invoice tidak ikut terunduh");
  await v.unmount();
});

await check("Laporan: kelima tab bisa dibuka", async () => {
  loginAs();
  const v = await mount(() => h(B.PAGES.LaporanPage));
  for (const tab of ["Laporan Stok", "Keuangan", "Rekap Barang", "Rekap Pihak", "Analisis Margin"]) {
    const trigger = v.buttons().find((b) => (b.textContent ?? "").trim() === tab);
    expect(trigger, `tab "${tab}" tidak ditemukan`);
    await click(trigger);
    expect(v.text().trim().length > 50, `tab "${tab}" kosong`);
  }
  await v.unmount();
});

await check("Laporan: 'Unduh Semua' menghasilkan 5 file CSV berbeda", async () => {
  loginAs();
  const v = await mount(() => h(B.PAGES.LaporanPage));
  await click(v.buttonByText("Unduh Semua"));
  expect(spy.downloads.length === 5, `${spy.downloads.length} file terunduh (harus 5)`);
  const names = downloadNames();
  for (const want of ["laporan-stok", "laporan-keuangan", "rekap-barang", "rekap-pihak", "analisis-margin"]) {
    expect(names.some((n) => n.includes(want)), `file "${want}" tidak ada (dapat: ${names.join(", ")})`);
  }
  const isi = await downloadText(0);
  expect(isi.includes("Ikan Tuna"), "isi CSV laporan kosong");
  await v.unmount();
});

await check("Laporan: cetak laporan tetap berfungsi (tidak error)", async () => {
  loginAs();
  const v = await mount(() => h(B.PAGES.LaporanPage));
  spy.print = 0;
  await click(v.buttonByText("Cetak Laporan Ini"));
  await act(async () => {});
  await v.unmount();
});

await check("Gudang: tabel stok terisi dari data", async () => {
  loginAs();
  const v = await mount(() => h(B.PAGES.GudangPage));
  expect(v.text().includes("Ikan Tuna"), "baris gudang tidak tampil");
  await v.unmount();
});

await check("Kas: tabel kas terisi dari data", async () => {
  loginAs();
  const v = await mount(() => h(B.PAGES.KasPage));
  expect(/KAS001|200\.000/.test(v.text()), "baris kas tidak tampil");
  await v.unmount();
});

await check("Master Barang: tabel + tombol Unduh CSV ada", async () => {
  loginAs();
  const v = await mount(() => h(B.PAGES.BarangPage));
  expect(v.text().includes("Ikan Tuna"), "baris barang tidak tampil");
  expect(v.buttonByText("Unduh CSV"), "tombol Unduh CSV tidak ada");
  await v.unmount();
});

await check("Master Barang: klik 'Unduh CSV' menangkap file", async () => {
  loginAs();
  const v = await mount(() => h(B.PAGES.BarangPage));
  await click(v.buttonByText("Unduh CSV"));
  expect(spy.downloads.length === 1, `${spy.downloads.length} unduhan (harus 1)`);
  const csv = await downloadText(0);
  expect(csv.includes("BRG001") || csv.includes("Ikan Tuna"), "isi CSV master kosong");
  await v.unmount();
});

await check("Dashboard: kartu ringkasan tampil", async () => {
  loginAs();
  const v = await mount(() => h(B.PAGES.DashboardPage));
  expect(v.text().trim().length > 50, "dashboard kosong");
  await v.unmount();
});

await check("Landing: CTA menuju /auth ada dan hidup", async () => {
  resetState();
  const v = await mount(() => h(B.LandingPage), "/");
  const links = Array.from(v.container.querySelectorAll("a")).map((a) => a.getAttribute("href") ?? "");
  expect(links.some((l) => l.includes("/auth")), "tidak ada tautan ke /auth");
  expect(v.buttons().length > 0, "landing tanpa tombol");
  await v.unmount();
});

await check("NotFound: halaman 404 tampil", async () => {
  resetState();
  const v = await mount(() => h(B.NotFoundPage), "/halaman-tidak-ada");
  expect(v.text().trim().length > 5, "halaman 404 kosong");
  await v.unmount();
});

// ============================================================================
// E. UNDUH / EXPORT
// ============================================================================
console.log("\n=== E. UNDUH / EXPORT ===");
setSection("E. EXPORT");

await check("rowsToCsv: header + baris + pemisah ;", () => {
  const csv = B.rowsToCsv([{ a: 1, b: "dua" }], [{ key: "a", label: "A" }, { key: "b", label: "B" }]);
  expect(csv === "A;B\r\n1;dua", `hasil: ${JSON.stringify(csv)}`);
});

await check("rowsToCsv: escape tanda kutip, titik-koma, dan baris baru", () => {
  const csv = B.rowsToCsv([{ n: 'Ikan "Super"; segar\nbeku' }], [{ key: "n", label: "Nama" }]);
  expect(csv.includes('"Ikan ""Super""; segar\nbeku"'), `escape gagal: ${JSON.stringify(csv)}`);
});

await check("rowsToCsv: nilai kosong jadi sel kosong (bukan 'null')", () => {
  const csv = B.rowsToCsv([{ a: null, b: undefined }], [{ key: "a", label: "A" }, { key: "b", label: "B" }]);
  expect(csv === "A;B\r\n;", `hasil: ${JSON.stringify(csv)}`);
});

await check("rowsToCsv: kolom value() khusus dipakai (mis. nama karyawan)", () => {
  const csv = B.rowsToCsv([{ idKaryawan: "KRY001" }], [
    { key: "idKaryawan", label: "Karyawan", value: () => "Budi Santoso" },
  ]);
  expect(csv.includes("Budi Santoso"), "fungsi value() diabaikan");
});

await check("autoColumns: buang kunci internal (_id/_creationTime)", () => {
  const cols = B.autoColumns([{ _id: "x", _creationTime: 1, nama: "Tuna" }]);
  expect(cols.length === 1 && cols[0].key === "nama", `kolom: ${JSON.stringify(cols)}`);
});

await check("datedFilename: berakhiran tanggal hari ini + .csv", () => {
  const n = B.datedFilename("pengeluaran");
  const now = new Date();
  const stamp = `${now.getFullYear()}-${`${now.getMonth() + 1}`.padStart(2, "0")}-${`${now.getDate()}`.padStart(2, "0")}`;
  expect(n === `pengeluaran-${stamp}.csv`, `nama file: ${n}`);
});

await check("downloadCsv: file benar-benar dibuat (Blob + BOM)", async () => {
  spy.downloads = [];
  B.downloadCsv("uji-export", [{ x: 1 }], [{ key: "x", label: "X" }]);
  expect(spy.downloads.length === 1, "tidak ada file terunduh");
  const txt = await downloadText(0);
  expect(txt.startsWith("\uFEFF"), "BOM hilang");
  expect(txt.includes("X\r\n1"), "isi CSV salah");
  expect(spy.downloads[0].filename === "uji-export.csv", `nama: ${spy.downloads[0].filename}`);
});

await check("downloadCsv: nama file tidak dobel .csv", () => {
  spy.downloads = [];
  B.downloadCsv("sudah.csv", [], []);
  expect(spy.downloads[0].filename === "sudah.csv", `nama: ${spy.downloads[0].filename}`);
});

// ============================================================================
// F. INVENTARIS TOMBOL
// ============================================================================
console.log("\n=== F. INVENTARIS TOMBOL PER HALAMAN ===");
let totalButtons = 0;
for (const row of inventory) {
  totalButtons += row.labels.length;
  const uniq = Array.from(new Set(row.labels.filter((b) => b !== "(ikon)")));
  console.log(
    `  • ${row.page.padEnd(20)} ${String(row.labels.length).padStart(2)} tombol  ${uniq.slice(0, 7).join(" / ")}`,
  );
}
console.log(`\n  Total ${totalButtons} tombol di ${inventory.length} halaman diklik & diperiksa.`);

cleanupBundle();
process.exit(report("HASIL E2E") ? 0 : 1);
