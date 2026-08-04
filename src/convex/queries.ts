import { v } from "convex/values";
import { query } from "./_generated/server";
import {
  aggregateMarginByProduk,
  aggregateRekapBarang,
  aggregateRekapPihak,
  computeGudangRows,
  computeKasBalances,
  daysUntil,
  inRange,
  todayStr,
  thisMonthStr,
} from "../lib/business";
import { formatDateDisplay, formatRupiah } from "./lib";

// ============================================================================
// MASTER LISTS
// ============================================================================

export const listBarang = query({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db.query("barang").collect();
    return rows.sort((a, b) => a.kode.localeCompare(b.kode));
  },
});

export const listSupplier = query({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db.query("supplier").collect();
    return rows.sort((a, b) => a.nama.localeCompare(b.nama));
  },
});

export const listReseller = query({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db.query("reseller").collect();
    return rows.sort((a, b) => a.nama.localeCompare(b.nama));
  },
});

export const listDpl = query({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db.query("dpl").collect();
    return rows.sort((a, b) => a.namaPasar.localeCompare(b.namaPasar));
  },
});

export const listPasar = query({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db.query("pasar").collect();
    return rows.sort((a, b) => a.namaPasar.localeCompare(b.namaPasar));
  },
});

export const listKaryawan = query({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db.query("karyawan").collect();
    return rows.sort((a, b) => a.nama.localeCompare(b.nama));
  },
});

// ============================================================================
// OPERASIONAL LISTS (filter periode)
// ============================================================================

export const listAbsensi = query({
  args: { idKaryawan: v.optional(v.string()), from: v.optional(v.string()), to: v.optional(v.string()) },
  handler: async (ctx, { idKaryawan, from, to }) => {
    let rows = await ctx.db.query("absensi").collect();
    if (idKaryawan) rows = rows.filter((r) => r.idKaryawan === idKaryawan);
    if (from || to) rows = rows.filter((r) => inRange(r.tanggal, from, to));
    return rows.sort((a, b) => b.tanggal.localeCompare(a.tanggal) || a.idKaryawan.localeCompare(b.idKaryawan));
  },
});

export const listUtang = query({
  args: { idKaryawan: v.optional(v.string()), status: v.optional(v.string()) },
  handler: async (ctx, { idKaryawan, status }) => {
    let rows = await ctx.db.query("utang").collect();
    if (idKaryawan) rows = rows.filter((r) => r.idKaryawan === idKaryawan);
    if (status) rows = rows.filter((r) => r.status === status);
    return rows.sort((a, b) => b.tanggal.localeCompare(a.tanggal));
  },
});

export const listInvoice = query({
  args: { tipe: v.optional(v.string()), namaPihak: v.optional(v.string()), from: v.optional(v.string()), to: v.optional(v.string()) },
  handler: async (ctx, { tipe, namaPihak, from, to }) => {
    let rows = await ctx.db.query("invoice").collect();
    if (tipe) rows = rows.filter((r) => r.tipe === tipe);
    if (namaPihak) rows = rows.filter((r) => r.namaPihak === namaPihak);
    if (from || to) rows = rows.filter((r) => inRange(r.tanggal, from, to));
    return rows.sort((a, b) => b.tanggal.localeCompare(a.tanggal) || a.idInvoice.localeCompare(b.idInvoice));
  },
});

/** Daftar (tipe, namaPihak) unik untuk filter pengelompokan invoice per pihak. */
export const listInvoicePihak = query({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db.query("invoice").collect();
    const seen = new Set<string>();
    const out: { tipe: string; namaPihak: string }[] = [];
    for (const r of rows) {
      const key = `${r.tipe}|${r.namaPihak}`;
      if (!seen.has(key)) {
        seen.add(key);
        out.push({ tipe: r.tipe, namaPihak: r.namaPihak });
      }
    }
    return out.sort((a, b) => a.tipe.localeCompare(b.tipe) || a.namaPihak.localeCompare(b.namaPihak));
  },
});

/**
 * Invoice Reseller/Supplier yang tenggatnya ≤ 3 hari (H-3) atau sudah lewat.
 * Dipakai notifikasi otomatis di header aplikasi.
 */
export const listInvoiceTenggat = query({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db.query("invoice").collect();
    const today = todayStr();
    return rows
      .filter((r) => (r.tipe === "Reseller" || r.tipe === "Supplier") && !!r.tenggat)
      .map((r) => ({
        idInvoice: r.idInvoice,
        tipe: r.tipe,
        namaPihak: r.namaPihak,
        tenggat: r.tenggat,
        total: r.totalPenjualan || r.total,
        daysLeft: daysUntil(r.tenggat!, today),
      }))
      .filter((r) => !Number.isNaN(r.daysLeft) && r.daysLeft <= 3)
      .sort((a, b) => a.daysLeft - b.daysLeft);
  },
});

export const listRetur = query({
  args: { from: v.optional(v.string()), to: v.optional(v.string()) },
  handler: async (ctx, { from, to }) => {
    let rows = await ctx.db.query("retur").collect();
    if (from || to) rows = rows.filter((r) => inRange(r.tanggal, from, to));
    return rows.sort((a, b) => b.tanggal.localeCompare(a.tanggal));
  },
});

export const listKas = query({
  args: { from: v.optional(v.string()), to: v.optional(v.string()) },
  handler: async (ctx, { from, to }) => {
    let rows = await ctx.db.query("kas").collect();
    if (from || to) rows = rows.filter((r) => inRange(r.tanggal, from, to));
    const withBal = computeKasBalances(
      rows.map((r) => ({
        id: r.id,
        tanggal: r.tanggal,
        kasMasuk: r.kasMasuk,
        kasKeluar: r.kasKeluar,
        saldoAwal: r.saldoAwal,
        saldoAkhir: r.saldoAkhir,
        createdAt: r._creationTime,
      })),
    );
    return rows
      .map((r) => {
        const b = withBal.find((x) => x.id === r.id);
        return { ...r, saldoAwal: b?.saldoAwal ?? 0, saldoAkhir: b?.saldoAkhir ?? 0 };
      })
      .sort((a, b) => b.tanggal.localeCompare(a.tanggal) || (b._creationTime - a._creationTime));
  },
});

export const listPengeluaran = query({
  args: { jenis: v.optional(v.string()), from: v.optional(v.string()), to: v.optional(v.string()) },
  handler: async (ctx, { jenis, from, to }) => {
    let rows = await ctx.db.query("pengeluaran").collect();
    if (jenis) rows = rows.filter((r) => r.jenis === jenis);
    if (from || to) rows = rows.filter((r) => inRange(r.tanggal, from, to));
    return rows.sort((a, b) => b.tanggal.localeCompare(a.tanggal));
  },
});

export const listSlipGaji = query({
  args: { idKaryawan: v.optional(v.string()), periode: v.optional(v.string()) },
  handler: async (ctx, { idKaryawan, periode }) => {
    let rows = await ctx.db.query("slipgaji").collect();
    if (idKaryawan) rows = rows.filter((r) => r.idKaryawan === idKaryawan);
    if (periode) rows = rows.filter((r) => r.periode === periode);
    return rows.sort((a, b) => b.periode.localeCompare(a.periode) || a.idKaryawan.localeCompare(b.idKaryawan));
  },
});

// ============================================================================
// GUDANG — stok dihitung dari riwayat (asal perubahan: Supplier/Reseller/DPL/Pasar/Retur)
// ============================================================================

export const listGudang = query({
  args: {},
  handler: async (ctx) => {
    const base = await ctx.db.query("gudang").collect();
    const history = await ctx.db.query("stokHistory").collect();
    const rows = computeGudangRows(
      base.map((b) => ({ id: b.id, namaBarang: b.namaBarang, stokAwal: b.stokAwal, keterangan: b.keterangan ?? "" })),
      history.map((h) => ({ namaBarang: h.namaBarang, perubahan: h.perubahan })),
    );
    return rows.sort((a, b) => a.namaBarang.localeCompare(b.namaBarang));
  },
});

export const listStokHistory = query({
  args: { namaBarang: v.optional(v.string()), from: v.optional(v.string()), to: v.optional(v.string()) },
  handler: async (ctx, { namaBarang, from, to }) => {
    let rows = await ctx.db.query("stokHistory").collect();
    if (namaBarang) rows = rows.filter((r) => r.namaBarang === namaBarang);
    if (from || to) rows = rows.filter((r) => inRange(r.tanggal, from, to));
    return rows.sort((a, b) => b.tanggal.localeCompare(a.tanggal) || (b._creationTime - a._creationTime));
  },
});

// ============================================================================
// DASHBOARD
// ============================================================================

export const dashboardStats = query({
  args: {},
  handler: async (ctx) => {
    const [barang, kas, invoices, pengeluaran, gudang, history, karyawan] = await Promise.all([
      ctx.db.query("barang").collect(),
      ctx.db.query("kas").collect(),
      ctx.db.query("invoice").collect(),
      ctx.db.query("pengeluaran").collect(),
      ctx.db.query("gudang").collect(),
      ctx.db.query("stokHistory").collect(),
      ctx.db.query("karyawan").collect(),
    ]);

    // Saldo kas sekarang
    const withBal = computeKasBalances(
      kas.map((r) => ({ id: r.id, tanggal: r.tanggal, kasMasuk: r.kasMasuk, kasKeluar: r.kasKeluar, saldoAwal: r.saldoAwal, saldoAkhir: r.saldoAkhir, createdAt: r._creationTime })),
    );
    const saldoKas = withBal.length ? withBal[withBal.length - 1].saldoAkhir : 0;

    // Bulan ini
    const month = thisMonthStr();
    const inMonth = (t: string) => t.slice(0, 7) === month;

    const pendapatanBulanIni = invoices
      .filter((i) => inMonth(i.tanggal) && i.tipe !== "Supplier")
      .reduce((s, i) => s + i.totalPenjualan, 0);
    const pembelianBulanIni = invoices
      .filter((i) => inMonth(i.tanggal) && i.tipe === "Supplier")
      .reduce((s, i) => s + i.total, 0);
    const pengeluaranBulanIni =
      pembelianBulanIni +
      pengeluaran.filter((p) => inMonth(p.tanggal)).reduce((s, p) => s + p.nominal, 0);
    const marginBulanIni = invoices
      .filter((i) => inMonth(i.tanggal) && i.tipe !== "Supplier")
      .reduce((s, i) => s + i.margin, 0);

    // Nilai stok (stok akhir × harga terakhir dari master barang / invoice).
    // Gudang di-stok per NamaBarang, jadi peta harga dikunci per nama (fallback kode).
    const gudangRows = computeGudangRows(
      gudang.map((g) => ({ id: g.id, namaBarang: g.namaBarang, stokAwal: g.stokAwal, keterangan: g.keterangan ?? "" })),
      history.map((h) => ({ namaBarang: h.namaBarang, perubahan: h.perubahan })),
    );
    const hargaPerNama = new Map<string, number>();
    for (const b of barang) {
      if (b.nama) hargaPerNama.set(b.nama, b.harga);
      if (!b.nama && b.kode) hargaPerNama.set(b.kode, b.harga);
    }
    for (const inv of invoices) {
      for (const it of inv.items) {
        const harga = it.hargaJual ?? it.hargaModal;
        if (it.namaBarang) hargaPerNama.set(it.namaBarang, harga);
        if (!it.namaBarang && it.kodeBarang) hargaPerNama.set(it.kodeBarang, harga);
      }
    }
    const nilaiStok = gudangRows.reduce((s, g) => s + Math.max(0, g.stokAkhir) * (hargaPerNama.get(g.namaBarang) ?? 0), 0);

    // Grafik kas 14 hari terakhir
    const kasByDay = new Map<string, { masuk: number; keluar: number }>();
    for (const k of kas) {
      const day = kasByDay.get(k.tanggal) ?? { masuk: 0, keluar: 0 };
      day.masuk += k.kasMasuk;
      day.keluar += k.kasKeluar;
      kasByDay.set(k.tanggal, day);
    }
    const last14 = Array.from({ length: 14 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (13 - i));
      const t = `${d.getFullYear()}-${`${d.getMonth() + 1}`.padStart(2, "0")}-${`${d.getDate()}`.padStart(2, "0")}`;
      return { tanggal: t, ...(kasByDay.get(t) ?? { masuk: 0, keluar: 0 }) };
    });

    // Margin per tipe
    const marginPerTipe = (["Reseller", "DPL", "Pasar"] as const).map((tipe) => ({
      tipe,
      margin: invoices.filter((i) => i.tipe === tipe).reduce((s, i) => s + i.margin, 0),
      penjualan: invoices.filter((i) => i.tipe === tipe).reduce((s, i) => s + i.totalPenjualan, 0),
    }));

    // Stok teratas
    const stokTop = gudangRows
      .map((g) => ({ namaBarang: g.namaBarang, stokAkhir: g.stokAkhir }))
      .sort((a, b) => b.stokAkhir - a.stokAkhir)
      .slice(0, 6);

    return {
      saldoKas,
      pendapatanBulanIni,
      pengeluaranBulanIni,
      marginBulanIni,
      nilaiStok,
      jumlahBarang: barang.length,
      jumlahKaryawan: karyawan.length,
      jumlahInvoice: invoices.length,
      kas14Hari: last14,
      marginPerTipe,
      stokTop,
      invoiceTerbaru: invoices
        .sort((a, b) => b.tanggal.localeCompare(a.tanggal))
        .slice(0, 5)
        .map((i) => ({ idInvoice: i.idInvoice, tanggal: i.tanggal, tipe: i.tipe, namaPihak: i.namaPihak, total: i.total, totalPenjualan: i.totalPenjualan, margin: i.margin })),
    };
  },
});

// ============================================================================
// LAPORAN & REKAP
// ============================================================================

export const laporanKeuangan = query({
  args: { from: v.optional(v.string()), to: v.optional(v.string()) },
  handler: async (ctx, { from, to }) => {
    const [invoices, pengeluaran, slipgaji] = await Promise.all([
      ctx.db.query("invoice").collect(),
      ctx.db.query("pengeluaran").collect(),
      ctx.db.query("slipgaji").collect(),
    ]);
    const inv = invoices.filter((i) => inRange(i.tanggal, from, to));
    const pen = pengeluaran.filter((p) => inRange(p.tanggal, from, to));
    const slp = slipgaji.filter((s) => inRange(s.tanggal, from, to));

    const pendapatan = {
      reseller: inv.filter((i) => i.tipe === "Reseller").reduce((s, i) => s + i.totalPenjualan, 0),
      dpl: inv.filter((i) => i.tipe === "DPL").reduce((s, i) => s + i.totalPenjualan, 0),
      pasar: inv.filter((i) => i.tipe === "Pasar").reduce((s, i) => s + i.totalPenjualan, 0),
      total: 0,
    };
    pendapatan.total = pendapatan.reseller + pendapatan.dpl + pendapatan.pasar;

    const pengeluaranReport = {
      manual: pen.reduce((s, p) => s + p.nominal, 0),
      invoiceSupplier: inv.filter((i) => i.tipe === "Supplier").reduce((s, i) => s + i.total, 0),
      slipGaji: slp.reduce((s, x) => s + x.gajiBersih, 0),
      utangDibayar: 0, // utang dibayar sudah masuk melalui slip gaji / pembayaran kas
      total: 0,
    };
    pengeluaranReport.total = pengeluaranReport.manual + pengeluaranReport.invoiceSupplier + pengeluaranReport.slipGaji + pengeluaranReport.utangDibayar;

    return {
      from: from || "",
      to: to || "",
      pendapatan,
      pengeluaran: pengeluaranReport,
      laba: pendapatan.total - pengeluaranReport.total,
      rincianPendapatan: inv
        .filter((i) => i.tipe !== "Supplier")
        .map((i) => ({ id: i.idInvoice, tanggal: i.tanggal, tipe: i.tipe, pihak: i.namaPihak, nominal: i.totalPenjualan }))
        .sort((a, b) => b.tanggal.localeCompare(a.tanggal)),
      rincianPengeluaran: [
        ...pen.map((p) => ({ id: p.id, tanggal: p.tanggal, tipe: "Manual", pihak: p.jenis, nominal: p.nominal })),
        ...inv.filter((i) => i.tipe === "Supplier").map((i) => ({ id: i.idInvoice, tanggal: i.tanggal, tipe: "Invoice Supplier", pihak: i.namaPihak, nominal: i.total })),
        ...slp.map((s) => ({ id: s.id, tanggal: s.tanggal, tipe: "Slip Gaji", pihak: s.idKaryawan, nominal: s.gajiBersih })),
      ].sort((a, b) => b.tanggal.localeCompare(a.tanggal)),
    };
  },
});

export const rekapBarang = query({
  args: { from: v.optional(v.string()), to: v.optional(v.string()) },
  handler: async (ctx, { from, to }) => {
    let rows = await ctx.db.query("stokHistory").collect();
    if (from || to) rows = rows.filter((r) => inRange(r.tanggal, from, to));
    return {
      rows: aggregateRekapBarang(rows.map((r) => ({ namaBarang: r.namaBarang, perubahan: r.perubahan }))),
      totalMasuk: rows.filter((r) => r.perubahan > 0).reduce((s, r) => s + r.perubahan, 0),
      totalKeluar: Math.abs(rows.filter((r) => r.perubahan < 0).reduce((s, r) => s + r.perubahan, 0)),
    };
  },
});

export const rekapPihak = query({
  args: { from: v.optional(v.string()), to: v.optional(v.string()) },
  handler: async (ctx, { from, to }) => {
    let rows = await ctx.db.query("invoice").collect();
    if (from || to) rows = rows.filter((r) => inRange(r.tanggal, from, to));
    return aggregateRekapPihak(
      rows.map((r) => ({
        tipe: r.tipe,
        namaPihak: r.namaPihak,
        items: r.items,
        total: r.total,
        totalPenjualan: r.totalPenjualan,
      })),
    );
  },
});

export const analisisMargin = query({
  args: { from: v.optional(v.string()), to: v.optional(v.string()) },
  handler: async (ctx, { from, to }) => {
    let rows = await ctx.db.query("invoice").collect();
    if (from || to) rows = rows.filter((r) => inRange(r.tanggal, from, to));

    const perProduk = aggregateMarginByProduk(
      rows.map((r) => ({ tipe: r.tipe, items: r.items })),
    );

    // Margin per pasar & per reseller (dari invoice masing-masing)
    const byPasar = new Map<string, { pihak: string; modal: number; penjualan: number; margin: number }>();
    const byReseller = new Map<string, { pihak: string; modal: number; penjualan: number; margin: number }>();
    for (const r of rows) {
      if (r.tipe === "Pasar") {
        const e = byPasar.get(r.namaPihak) ?? { pihak: r.namaPihak, modal: 0, penjualan: 0, margin: 0 };
        e.modal += r.totalModal;
        e.penjualan += r.totalPenjualan;
        e.margin += r.margin;
        byPasar.set(r.namaPihak, e);
      }
      if (r.tipe === "Reseller") {
        const e = byReseller.get(r.namaPihak) ?? { pihak: r.namaPihak, modal: 0, penjualan: 0, margin: 0 };
        e.modal += r.totalModal;
        e.penjualan += r.totalPenjualan;
        e.margin += r.margin;
        byReseller.set(r.namaPihak, e);
      }
    }
    const withPct = (rows: { pihak: string; modal: number; penjualan: number; margin: number }[]) =>
      rows
        .map((r) => ({
          ...r,
          marginPct: r.penjualan > 0 ? Math.round((r.margin / r.penjualan) * 1000) / 10 : 0,
        }))
        .sort((a, b) => b.margin - a.margin);

    return {
      perProduk,
      perPasar: withPct([...byPasar.values()]),
      perReseller: withPct([...byReseller.values()]),
    };
  },
});

export const laporanStok = query({
  args: {},
  handler: async (ctx) => {
    const base = await ctx.db.query("gudang").collect();
    const history = await ctx.db.query("stokHistory").collect();
    return computeGudangRows(
      base.map((b) => ({ id: b.id, namaBarang: b.namaBarang, stokAwal: b.stokAwal, keterangan: b.keterangan ?? "" })),
      history.map((h) => ({ namaBarang: h.namaBarang, perubahan: h.perubahan })),
    ).sort((a, b) => a.namaBarang.localeCompare(b.namaBarang));
  },
});

// ============================================================================
// Helper publik untuk frontend (formatting)
// ============================================================================

export const formatHelpers = query({
  args: {},
  handler: async () => ({ formatDateDisplay, formatRupiah, today: todayStr() }),
});
