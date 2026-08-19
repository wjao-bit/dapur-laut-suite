import { v } from "convex/values";
import { internalQuery, query } from "./_generated/server";
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
} from "\./_business";
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
// TETESAN — master bahan baku, barang jadi, stok, invoice modal/penjualan
// ============================================================================

export const listBahanBaku = query({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db.query("bahanBaku").collect();
    return rows.sort((a, b) => a.kode.localeCompare(b.kode));
  },
});

export const listBarangJadi = query({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db.query("barangJadi").collect();
    return rows.sort((a, b) => a.kode.localeCompare(b.kode));
  },
});

/** Stok Tetesan: stokAkhir = stokAwal + Σ riwayat (asal: Invoice Modal/Penjualan). */
export const listTetesanStok = query({
  args: {},
  handler: async (ctx) => {
    const [base, history] = await Promise.all([
      ctx.db.query("tetesanStok").collect(),
      ctx.db.query("tetesanStokHistory").collect(),
    ]);
    const net = new Map<string, number>();
    const masuk = new Map<string, number>();
    const keluar = new Map<string, number>();
    for (const h of history) {
      net.set(h.namaBarang, (net.get(h.namaBarang) ?? 0) + h.perubahan);
      if (h.perubahan > 0) masuk.set(h.namaBarang, (masuk.get(h.namaBarang) ?? 0) + h.perubahan);
      else keluar.set(h.namaBarang, (keluar.get(h.namaBarang) ?? 0) + Math.abs(h.perubahan));
    }
    return base
      .map((b) => ({
        id: b.id,
        namaBarang: b.namaBarang,
        tipe: b.tipe,
        stokAwal: b.stokAwal,
        stokMasuk: masuk.get(b.namaBarang) ?? 0,
        stokKeluar: keluar.get(b.namaBarang) ?? 0,
        stokAkhir: b.stokAwal + (net.get(b.namaBarang) ?? 0),
        tanggalStokAwal: b.tanggalStokAwal ?? "",
        keterangan: b.keterangan ?? "",
      }))
      .sort((a, b) => a.namaBarang.localeCompare(b.namaBarang));
  },
});

export const listTetesanStokHistory = query({
  args: { namaBarang: v.optional(v.string()), from: v.optional(v.string()), to: v.optional(v.string()) },
  handler: async (ctx, { namaBarang, from, to }) => {
    let rows = await ctx.db.query("tetesanStokHistory").collect();
    if (namaBarang) rows = rows.filter((r) => r.namaBarang === namaBarang);
    if (from || to) rows = rows.filter((r) => inRange(r.tanggal, from, to));
    return rows.sort((a, b) => b.tanggal.localeCompare(a.tanggal) || (b._creationTime - a._creationTime));
  },
});

export const listInvoiceTetesan = query({
  args: { tipe: v.optional(v.string()) },
  handler: async (ctx, { tipe }) => {
    let rows = await ctx.db.query("invoiceTetesan").collect();
    if (tipe) rows = rows.filter((r) => r.tipe === tipe);
    return rows.sort((a, b) => b.tanggal.localeCompare(a.tanggal) || a.idInvoice.localeCompare(b.idInvoice));
  },
});

/**
 * Laporan Tetesan: total modal (invoice Modal), total penjualan (invoice
 * Penjualan), perbandingan modal vs penjualan, rekap per item, dan stok
 * otomatis dari transaksi. Bisa difilter tanggal, kategori, atau nama item.
 */
export const laporanTetesan = query({
  args: {
    from: v.optional(v.string()),
    to: v.optional(v.string()),
    kategori: v.optional(v.string()),
    namaItem: v.optional(v.string()),
  },
  handler: async (ctx, { from, to, kategori, namaItem }) => {
    const [invoices, bahanBaku, barangJadi, stok, history] = await Promise.all([
      ctx.db.query("invoiceTetesan").collect(),
      ctx.db.query("bahanBaku").collect(),
      ctx.db.query("barangJadi").collect(),
      ctx.db.query("tetesanStok").collect(),
      ctx.db.query("tetesanStokHistory").collect(),
    ]);

    let inv = invoices;
    if (from || to) inv = inv.filter((i) => inRange(i.tanggal, from, to));
    if (namaItem) {
      const q = namaItem.toLowerCase();
      inv = inv.filter((i) => i.items.some((it) => it.namaBarang.toLowerCase().includes(q)));
    }
    // Filter kategori: cocokkan item invoice ke master (bahan baku / barang jadi)
    if (kategori) {
      const k = kategori.toLowerCase();
      const kodeBaku = new Set(bahanBaku.filter((b) => (b.kategori ?? "").toLowerCase().includes(k)).map((b) => b.kode));
      const kodeJadi = new Set(barangJadi.filter((b) => (b.kategori ?? "").toLowerCase().includes(k)).map((b) => b.kode));
      const kodeNama = new Set([
        ...bahanBaku.filter((b) => (b.kategori ?? "").toLowerCase().includes(k)).map((b) => b.nama.toLowerCase()),
        ...barangJadi.filter((b) => (b.kategori ?? "").toLowerCase().includes(k)).map((b) => b.nama.toLowerCase()),
      ]);
      inv = inv.filter((i) =>
        i.items.some((it) => kodeBaku.has(it.kodeBarang) || kodeJadi.has(it.kodeBarang) || kodeNama.has(it.namaBarang.toLowerCase())),
      );
    }

    const modalInvoices = inv.filter((i) => i.tipe === "Modal");
    const jualInvoices = inv.filter((i) => i.tipe === "Penjualan");
    const totalModal = modalInvoices.reduce((s, i) => s + i.total, 0);
    const totalPenjualan = jualInvoices.reduce((s, i) => s + i.total, 0);
    const margin = totalPenjualan - totalModal;
    const marginPct = totalPenjualan > 0 ? Math.round((margin / totalPenjualan) * 1000) / 10 : 0;

    // Rekap per item
    const itemMap = new Map<string, { namaBarang: string; qtyModal: number; qtyJual: number; totalModal: number; totalPenjualan: number }>();
    for (const i of modalInvoices) {
      for (const it of i.items) {
        const e = itemMap.get(it.namaBarang) ?? { namaBarang: it.namaBarang, qtyModal: 0, qtyJual: 0, totalModal: 0, totalPenjualan: 0 };
        e.qtyModal += it.qty;
        e.totalModal += it.subtotal;
        itemMap.set(it.namaBarang, e);
      }
    }
    for (const i of jualInvoices) {
      for (const it of i.items) {
        const e = itemMap.get(it.namaBarang) ?? { namaBarang: it.namaBarang, qtyModal: 0, qtyJual: 0, totalModal: 0, totalPenjualan: 0 };
        e.qtyJual += it.qty;
        e.totalPenjualan += it.subtotal;
        itemMap.set(it.namaBarang, e);
      }
    }
    const itemRekap = [...itemMap.values()].sort((a, b) => b.totalPenjualan - a.totalPenjualan);

    // Stok otomatis (stokAwal + Σ riwayat)
    const net = new Map<string, number>();
    const masukMap = new Map<string, number>();
    const keluarMap = new Map<string, number>();
    for (const h of history) {
      net.set(h.namaBarang, (net.get(h.namaBarang) ?? 0) + h.perubahan);
      if (h.perubahan > 0) masukMap.set(h.namaBarang, (masukMap.get(h.namaBarang) ?? 0) + h.perubahan);
      else keluarMap.set(h.namaBarang, (keluarMap.get(h.namaBarang) ?? 0) + Math.abs(h.perubahan));
    }
    const kategoriByNama = new Map<string, string>();
    for (const b of bahanBaku) kategoriByNama.set(b.nama, b.kategori ?? "");
    for (const b of barangJadi) kategoriByNama.set(b.nama, b.kategori ?? "");
    const stokRows = stok
      .map((b) => ({
        namaBarang: b.namaBarang,
        tipe: b.tipe,
        kategori: kategoriByNama.get(b.namaBarang) ?? "",
        stokAwal: b.stokAwal,
        stokMasuk: masukMap.get(b.namaBarang) ?? 0,
        stokKeluar: keluarMap.get(b.namaBarang) ?? 0,
        stokAkhir: b.stokAwal + (net.get(b.namaBarang) ?? 0),
      }))
      .filter((r) => !kategori || r.kategori.toLowerCase().includes(kategori.toLowerCase()))
      .sort((a, b) => a.namaBarang.localeCompare(b.namaBarang));

    return {
      from: from || "",
      to: to || "",
      totalModal,
      totalPenjualan,
      margin,
      marginPct,
      jumlahInvoiceModal: modalInvoices.length,
      jumlahInvoicePenjualan: jualInvoices.length,
      rincianModal: modalInvoices
        .map((i) => ({ idInvoice: i.idInvoice, tanggal: i.tanggal, namaPihak: i.namaPihak, total: i.total, items: i.items }))
        .sort((a, b) => b.tanggal.localeCompare(a.tanggal)),
      rincianPenjualan: jualInvoices
        .map((i) => ({ idInvoice: i.idInvoice, tanggal: i.tanggal, namaPihak: i.namaPihak, total: i.total, items: i.items }))
        .sort((a, b) => b.tanggal.localeCompare(a.tanggal)),
      itemRekap,
      stok: stokRows,
    };
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
    rows = rows.filter((r) => !(r as any).deletedAt); // kecuali yang di Sampah
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
      if ((r as any).deletedAt) continue; // abaikan yang di Sampah
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
 * Hanya invoice berstatus Pending (belum lunas) yang diingatkan.
 * Dipakai notifikasi otomatis di header aplikasi.
 */
export const listInvoiceTenggat = query({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db.query("invoice").collect();
    const today = todayStr();
    return rows
      .filter(
        (r) =>
          !(r as any).deletedAt &&
          (r.tipe === "Reseller" || r.tipe === "Supplier") &&
          !!r.tenggat &&
          (r.statusPembayaran ?? "Pending") !== "Lunas",
      )
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

/** Invoice yang ada di Sampah (recycle bin) — dihapus tapi belum permanen. */
export const listInvoiceTrash = query({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db.query("invoice").collect();
    return rows
      .filter((r) => (r as any).deletedAt)
      .map((r) => ({
        idInvoice: r.idInvoice,
        tanggal: r.tanggal,
        tipe: r.tipe,
        namaPihak: r.namaPihak,
        total: r.totalPenjualan || r.total,
        totalPenjualan: r.totalPenjualan,
        margin: r.margin,
        deletedAt: (r as any).deletedAt as number,
      }))
      .sort((a, b) => b.deletedAt - a.deletedAt);
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
    return rows.sort((a, b) => (b.periode ?? "").localeCompare(a.periode ?? "") || a.idKaryawan.localeCompare(b.idKaryawan));
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
    const [barang, kas, allInvoices, pengeluaran, gudang, history, karyawan] = await Promise.all([
      ctx.db.query("barang").collect(),
      ctx.db.query("kas").collect(),
      ctx.db.query("invoice").collect(),
      ctx.db.query("pengeluaran").collect(),
      ctx.db.query("gudang").collect(),
      ctx.db.query("stokHistory").collect(),
      ctx.db.query("karyawan").collect(),
    ]);

    // Abaikan invoice yang sedang di Sampah (recycle bin) dari statistik.
    const invoices = allInvoices.filter((i: any) => !i.deletedAt);

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
    const [allInvoices, pengeluaran, slipgaji] = await Promise.all([
      ctx.db.query("invoice").collect(),
      ctx.db.query("pengeluaran").collect(),
      ctx.db.query("slipgaji").collect(),
    ]);
    // Abaikan invoice yang sedang di Sampah dari laporan keuangan.
    const invoices = allInvoices.filter((i: any) => !i.deletedAt);
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
      slipGaji: slp.reduce((s, x) => s + (x.gajiBersih ?? 0), 0),
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
    rows = rows.filter((r: any) => !r.deletedAt); // kecuali yang di Sampah
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
    rows = rows.filter((r: any) => !r.deletedAt); // kecuali yang di Sampah
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

// ============================================================================
// INTERNAL QUERIES — hanya bisa dipanggil dari dalam action (ctx.runQuery),
// tidak bisa dipanggil langsung oleh klien. Dipakai aksi notifikasi (notif.ts)
// untuk membaca pengaturan VAPID, daftar langganan push, dan invoice tenggat.
// ============================================================================

/** Baca satu pengaturan (key-value). Akses dibatasi: fungsi INTERNAL. */
export const internalGetAppSetting = internalQuery({
  args: { key: v.string() },
  handler: async (ctx, { key }) => {
    return ((await (ctx.db.query("appSettings") as any)
      .filter((q: any) => q.eq(q.field("key"), key))
      .first()) ?? null) as { key: string; value: string } | null;
  },
});

/** Daftar langganan push aktif (endpoint + kunci enkripsi). */
export const internalListPushSubscriptions = internalQuery({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db.query("pushSubscription").collect();
    return rows.map((r) => ({
      endpoint: r.endpoint,
      keys: { p256dh: r.keys.p256dh, auth: r.keys.auth },
    }));
  },
});

/** Invoice aktif (bukan Sampah) ber-tenggat yang belum lunas — untuk pengingat push. */
export const internalListInvoicesForNotif = internalQuery({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db.query("invoice").collect();
    return rows
      .filter(
        (r: any) =>
          !r.deletedAt &&
          !!r.tenggat &&
          (r.statusPembayaran ?? "Pending") !== "Lunas",
      )
      .map((r) => ({
        idInvoice: r.idInvoice,
        tipe: r.tipe,
        namaPihak: r.namaPihak,
        tenggat: r.tenggat as string,
        total: r.totalPenjualan || r.total || 0,
      }));
  },
});


