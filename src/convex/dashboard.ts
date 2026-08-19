import { query } from "./_generated/server";
import { computeGudangRows, computeKasBalances, todayStr, thisMonthStr, daysUntil } from "./_business";

// ============================================================================
// LIVE DASHBOARD — data real-time untuk Dashboard Cerdas
// ============================================================================

export const liveStats = query({
  args: {},
  handler: async (ctx) => {
    const [barang, kas, allInvoices, pengeluaran, gudang, history, karyawan, piutang] = await Promise.all([
      ctx.db.query("barang").collect(),
      ctx.db.query("kas").collect(),
      ctx.db.query("invoice").collect(),
      ctx.db.query("pengeluaran").collect(),
      ctx.db.query("gudang").collect(),
      ctx.db.query("stokHistory").collect(),
      ctx.db.query("karyawan").collect(),
      ctx.db.query("piutang").collect().catch(() => []),
    ]);

    const invoices = allInvoices.filter((i: any) => !i.deletedAt);

    // === TODAY ===
    const today = todayStr();
    const todayInvoices = invoices.filter((i) => i.tanggal === today);
    const todayKas = kas.filter((k) => k.tanggal === today);
    const todayMasuk = todayKas.reduce((s, k) => s + k.kasMasuk, 0);
    const todayKeluar = todayKas.reduce((s, k) => s + k.kasKeluar, 0);

    // === 7 HARI TREND ===
    const salesByDay = new Map<string, { penjualan: number; pembelian: number }>();
    for (const inv of invoices) {
      const day = salesByDay.get(inv.tanggal) ?? { penjualan: 0, pembelian: 0 };
      if (inv.tipe === "Supplier") {
        day.pembelian += inv.total;
      } else {
        day.penjualan += inv.totalPenjualan;
      }
      salesByDay.set(inv.tanggal, day);
    }
    const last7 = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const t = `${d.getFullYear()}-${`${d.getMonth() + 1}`.padStart(2, "0")}-${`${d.getDate()}`.padStart(2, "0")}`;
      const label = d.toLocaleDateString("id-ID", { weekday: "short", day: "numeric", month: "short" });
      return {
        tanggal: t,
        label,
        ...(salesByDay.get(t) ?? { penjualan: 0, pembelian: 0 }),
        margin: (salesByDay.get(t)?.penjualan ?? 0) - (salesByDay.get(t)?.pembelian ?? 0),
      };
    });

    // === TOP 5 BARANG TERLARIS (7 hari) ===
    const sevenDaysAgo = (() => {
      const d = new Date();
      d.setDate(d.getDate() - 7);
      return `${d.getFullYear()}-${`${d.getMonth() + 1}`.padStart(2, "0")}-${`${d.getDate()}`.padStart(2, "0")}`;
    })();
    const recentInvoices = invoices.filter((i) => i.tanggal >= sevenDaysAgo);
    const barangSold = new Map<string, { nama: string; qty: number; total: number }>();
    for (const inv of recentInvoices) {
      if (inv.tipe === "Supplier") continue;
      for (const it of inv.items) {
        const key = it.namaBarang || it.kodeBarang;
        const e = barangSold.get(key) ?? { nama: it.namaBarang || it.kodeBarang, qty: 0, total: 0 };
        e.qty += it.qty;
        e.total += it.subtotal;
        barangSold.set(key, e);
      }
    }
    const topBarang = [...barangSold.values()]
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    // === ALERTS ===
    const alerts: { type: "danger" | "warning" | "info"; msg: string }[] = [];

    // Piutang lewat tempo
    const overdueInvoices = invoices.filter(
      (i) => !!i.tenggat && (i.statusPembayaran ?? "Pending") !== "Lunas" && daysUntil(i.tenggat, today) < 0,
    );
    if (overdueInvoices.length > 0) {
      const totalOverdue = overdueInvoices.reduce((s, i) => s + (i.sisa ?? i.totalPenjualan ?? i.total), 0);
      alerts.push({ type: "danger", msg: `${overdueInvoices.length} invoice lewat tempo — total Rp ${totalOverdue.toLocaleString("id-ID")}` });
    }

    // Piutang mendekati tempo (H-3)
    const almostDue = invoices.filter(
      (i) => !!i.tenggat && (i.statusPembayaran ?? "Pending") !== "Lunas" && { days: daysUntil(i.tenggat, today) }.days >= 0 && { days: daysUntil(i.tenggat, today) }.days <= 3,
    );
    if (almostDue.length > 0) {
      alerts.push({ type: "warning", msg: `${almostDue.length} invoice mendekati jatuh tempo (H-3)` });
    }

    // Stok menipis
    const gudangRows = computeGudangRows(
      gudang.map((g) => ({ id: g.id, namaBarang: g.namaBarang, stokAwal: g.stokAwal, keterangan: g.keterangan ?? "", stokMin: (g as any).stokMin ?? 5 })),
      history.map((h) => ({ namaBarang: h.namaBarang, perubahan: h.perubahan })),
    );
    const lowStock = gudangRows.filter((g) => g.stokAkhir <= (g as any).stokMin);
    if (lowStock.length > 0) {
      alerts.push({ type: "warning", msg: `${lowStock.length} barang stok menipis — ${lowStock.slice(0, 3).map((g) => `${g.namaBarang}(${g.stokAkhir})`).join(", ")}${lowStock.length > 3 ? "..." : ""}` });
    }

    // Kas negatif
    const withBal = computeKasBalances(
      kas.map((r) => ({ id: r.id, tanggal: r.tanggal, kasMasuk: r.kasMasuk, kasKeluar: r.kasKeluar, saldoAwal: r.saldoAwal, saldoAkhir: r.saldoAkhir, createdAt: r._creationTime })),
    );
    const negKas = withBal.filter((b) => b.saldoAkhir < 0);
    if (negKas.length > 0) {
      alerts.push({ type: "danger", msg: `Saldo kas negatif pada ${negKas.length} hari — periksa pencatatan kas` });
    }

    // Karyawan utang besar
    const karyawanWithUtang = karyawan.filter((k) => k.utangTotal > 1000000);
    if (karyawanWithUtang.length > 0) {
      alerts.push({ type: "info", msg: `${karyawanWithUtang.length} karyawan memiliki utang > Rp 1.000.000` });
    }

    return {
      today: {
        tanggal: today,
        jumlahInvoice: todayInvoices.length,
        kasMasuk: todayMasuk,
        kasKeluar: todayKeluar,
        totalPenjualan: todayInvoices.filter((i) => i.tipe !== "Supplier").reduce((s, i) => s + i.totalPenjualan, 0),
      },
      trend7Hari: last7,
      topBarang,
      alerts,
      summary: {
        totalPiutang: invoices.filter((i) => (i.statusPembayaran ?? "Pending") === "Pending" && i.tipe !== "Supplier").reduce((s, i) => s + (i.sisa ?? i.totalPenjualan ?? 0), 0),
        jumlahPending: invoices.filter((i) => (i.statusPembayaran ?? "Pending") === "Pending").length,
        jumlahLunas: invoices.filter((i) => (i.statusPembayaran ?? "Pending") === "Lunas").length,
        stokMenipis: lowStock.length,
      },
    };
  },
});

// ============================================================================
// DEBUG CHECKER — scan data integrity, hanya dipanggil saat tombol Debug ditekan
// ============================================================================

export const debugCheck = query({
  args: {},
  handler: async (ctx) => {
    const issues: { level: "error" | "warning" | "ok"; category: string; msg: string }[] = [];

    const [invoices, barang, gudang, history, kas, karyawan, supplier, reseller] = await Promise.all([
      ctx.db.query("invoice").collect(),
      ctx.db.query("barang").collect(),
      ctx.db.query("gudang").collect(),
      ctx.db.query("stokHistory").collect(),
      ctx.db.query("kas").collect(),
      ctx.db.query("karyawan").collect(),
      ctx.db.query("supplier").collect(),
      ctx.db.query("reseller").collect(),
    ]);

    const activeInvoices = invoices.filter((i: any) => !i.deletedAt);

    // 1. Invoice tanpa items atau qty 0
    const emptyInvoices = activeInvoices.filter((i) => !i.items || i.items.length === 0);
    if (emptyInvoices.length > 0) {
      issues.push({ level: "error", category: "Invoice", msg: `${emptyInvoices.length} invoice tanpa barang: ${emptyInvoices.map((i) => i.idInvoice).join(", ")}` });
    } else {
      issues.push({ level: "ok", category: "Invoice", msg: `Semua ${activeInvoices.length} invoice memiliki data barang` });
    }

    // 2. Item dengan harga 0
    let itemsWithZeroPrice = 0;
    for (const inv of activeInvoices) {
      for (const it of inv.items) {
        if ((it.hargaModal ?? 0) === 0 || it.subtotal === 0) itemsWithZeroPrice++;
      }
    }
    if (itemsWithZeroPrice > 0) {
      issues.push({ level: "warning", category: "Invoice", msg: `${itemsWithZeroPrice} item memiliki harga atau subtotal Rp 0` });
    } else {
      issues.push({ level: "ok", category: "Invoice", msg: "Semua item invoice memiliki harga > 0" });
    }

    // 3. Duplikat ID invoice
    const invIds = activeInvoices.map((i) => i.idInvoice);
    const dupInv = invIds.filter((id, idx) => invIds.indexOf(id) !== idx);
    if (dupInv.length > 0) {
      issues.push({ level: "error", category: "Invoice", msg: `ID invoice duplikat: ${[...new Set(dupInv)].join(", ")}` });
    } else {
      issues.push({ level: "ok", category: "Invoice", msg: "Tidak ada ID invoice duplikat" });
    }

    // 4. Stok negatif
    const gudangRows = computeGudangRows(
      gudang.map((g) => ({ id: g.id, namaBarang: g.namaBarang, stokAwal: g.stokAwal })),
      history.map((h) => ({ namaBarang: h.namaBarang, perubahan: h.perubahan })),
    );
    const negStok = gudangRows.filter((g) => g.stokAkhir < 0);
    if (negStok.length > 0) {
      issues.push({ level: "warning", category: "Stok", msg: `${negStok.length} barang stok negatif: ${negStok.slice(0, 3).map((g) => `${g.namaBarang}(${g.stokAkhir})`).join(", ")}` });
    } else {
      issues.push({ level: "ok", category: "Stok", msg: `Semua ${gudangRows.length} barang stok >= 0` });
    }

    // 5. Kas saldo tidak konsisten
    const withBal = computeKasBalances(
      kas.map((r) => ({ id: r.id, tanggal: r.tanggal, kasMasuk: r.kasMasuk, kasKeluar: r.kasKeluar, saldoAwal: r.saldoAwal, saldoAkhir: r.saldoAkhir, createdAt: r._creationTime })),
    );
    const inconsistentKas = withBal.filter((b) => {
      const expected = b.saldoAwal + b.kasMasuk - b.kasKeluar;
      return Math.abs(expected - b.saldoAkhir) > 1;
    });
    if (inconsistentKas.length > 0) {
      issues.push({ level: "error", category: "Kas", msg: `${inconsistentKas.length} catatan kas saldo tidak konsisten` });
    } else {
      issues.push({ level: "ok", category: "Kas", msg: `Semua ${withBal.length} catatan kas saldo konsisten` });
    }

    // 6. Invoice Pending tanpa tenggat
    const pendingNoTenggat = activeInvoices.filter(
      (i) => (i.statusPembayaran ?? "Pending") === "Pending" && !i.tenggat,
    );
    if (pendingNoTenggat.length > 0) {
      issues.push({ level: "warning", category: "Piutang", msg: `${pendingNoTenggat.length} invoice Pending tanpa tenggat: ${pendingNoTenggat.slice(0, 3).map((i) => i.idInvoice).join(", ")}` });
    } else {
      issues.push({ level: "ok", category: "Piutang", msg: "Semua invoice Pending memiliki tenggat" });
    }

    // 7. Karyawan utang > gaji
    const utangLebihGaji = karyawan.filter((k) => k.utangTotal > k.gajiPokok && k.utangTotal > 0);
    if (utangLebihGaji.length > 0) {
      issues.push({ level: "warning", category: "Karyawan", msg: `${utangLebihGaji.length} karyawan utang melebihi gaji: ${utangLebihGaji.slice(0, 3).map((k) => `${k.nama}(utang:${k.utangTotal})`).join(", ")}` });
    } else {
      issues.push({ level: "ok", category: "Karyawan", msg: `Semua ${karyawan.length} karyawan utang dalam batas wajar` });
    }

    // 8. Master data integrity
    const supplierIds = new Set(supplier.map((s) => s.id));
    const resellerIds = new Set(reseller.map((r) => r.id));
    const missingRef = activeInvoices.filter((i) => {
      if (i.tipe === "Supplier") return !supplierIds.has(i.namaPihak);
      if (i.tipe === "Reseller") return !resellerIds.has(i.namaPihak);
      return false;
    });
    if (missingRef.length > 0) {
      issues.push({ level: "warning", category: "Master Data", msg: `${missingRef.length} invoice merujuk pihak yang tidak ada di master: ${missingRef.slice(0, 3).map((i) => `${i.idInvoice}(${i.namaPihak})`).join(", ")}` });
    } else {
      issues.push({ level: "ok", category: "Master Data", msg: "Semua referensi pihak invoice valid" });
    }

    // 9. Barang di gudang tapi tidak ada di master barang
    const barangNames = new Set(barang.map((b) => b.nama));
    const orphanGudang = gudangRows.filter((g) => !barangNames.has(g.namaBarang));
    if (orphanGudang.length > 0) {
      issues.push({ level: "warning", category: "Stok", msg: `${orphanGudang.length} barang di gudang tidak ada di master: ${orphanGudang.slice(0, 3).map((g) => g.namaBarang).join(", ")}` });
    } else {
      issues.push({ level: "ok", category: "Stok", msg: "Semua barang gudang terdaftar di master" });
    }

    // Summary
    const errors = issues.filter((i) => i.level === "error").length;
    const warnings = issues.filter((i) => i.level === "warning").length;
    const oks = issues.filter((i) => i.level === "ok").length;

    return { issues, summary: { errors, warnings, oks, total: issues.length } };
  },
});



