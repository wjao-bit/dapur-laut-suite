import { v } from "convex/values";
import { mutation } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import {
  badRequest,
  findOneByKey,
  genBusinessId,
  logRequest,
  logResponse,
  recordKas,
  recomputeKas,
  upsertByKey,
  addStokHistory,
  ensureGudangRow,
  monthOf,
  purgeStokFor,
} from "./lib";
import {
  computeInvoiceTotals,
  computeSlipGaji,
  computeTetesanTotals,
  countAbsensi,
  todayStr,
  type InvoiceItem,
  type InvoiceTipe,
  type TetesanItem,
  type TetesanTipe,
} from "../lib/business";
import {
  validate,
  barangSchema,
  supplierSchema,
  resellerSchema,
  dplSchema,
  pasarSchema,
  karyawanSchema,
  absensiSchema,
  utangSchema,
  invoiceSchema,
  returSchema,
  kasSchema,
  pengeluaranSchema,
  gudangSchema,
} from "../lib/schemas";

// ============================================================================
// MASTER DATA — semua upsert memakai semantik PRIMARY KEY (ON CONFLICT)
// ============================================================================

export const upsertBarang = mutation({
  args: { doc: v.any() },
  handler: async (ctx, { doc }) => {
    logRequest("upsertBarang", doc);
    const parsed = validate(barangSchema, doc);
    if (!parsed.success) return badRequest("Data barang tidak valid", parsed.errors);
    const d = parsed.data;
    const res = await upsertByKey(ctx, "barang", "kode", d.kode, {
      nama: d.nama,
      harga: d.harga,
      kategori: d.kategori ?? "",
    });
    logResponse("upsertBarang", res);
    return res;
  },
});

export const upsertSupplier = mutation({
  args: { doc: v.any() },
  handler: async (ctx, { doc }) => {
    logRequest("upsertSupplier", doc);
    const parsed = validate(supplierSchema, doc);
    if (!parsed.success) return badRequest("Data supplier tidak valid", parsed.errors);
    const d = parsed.data;
    const res = await upsertByKey(ctx, "supplier", "id", d.id, {
      nama: d.nama,
      alamat: d.alamat ?? "",
      kontak: d.kontak ?? "",
    });
    logResponse("upsertSupplier", res);
    return res;
  },
});

export const upsertReseller = mutation({
  args: { doc: v.any() },
  handler: async (ctx, { doc }) => {
    logRequest("upsertReseller", doc);
    const parsed = validate(resellerSchema, doc);
    if (!parsed.success) return badRequest("Data reseller tidak valid", parsed.errors);
    const d = parsed.data;
    const res = await upsertByKey(ctx, "reseller", "id", d.id, {
      nama: d.nama,
      alamat: d.alamat ?? "",
      kontak: d.kontak ?? "",
    });
    logResponse("upsertReseller", res);
    return res;
  },
});

export const upsertDpl = mutation({
  args: { doc: v.any() },
  handler: async (ctx, { doc }) => {
    logRequest("upsertDpl", doc);
    const parsed = validate(dplSchema, doc);
    if (!parsed.success) return badRequest("Data DPL tidak valid", parsed.errors);
    const d = parsed.data;
    const res = await upsertByKey(ctx, "dpl", "id", d.id, {
      namaPasar: d.namaPasar,
      alamat: d.alamat ?? "",
      kontak: d.kontak ?? "",
    });
    logResponse("upsertDpl", res);
    return res;
  },
});

export const upsertPasar = mutation({
  args: { doc: v.any() },
  handler: async (ctx, { doc }) => {
    logRequest("upsertPasar", doc);
    const parsed = validate(pasarSchema, doc);
    if (!parsed.success) return badRequest("Data pasar tidak valid", parsed.errors);
    const d = parsed.data;
    const res = await upsertByKey(ctx, "pasar", "id", d.id, {
      namaPasar: d.namaPasar,
      alamat: d.alamat ?? "",
      kontak: d.kontak ?? "",
    });
    logResponse("upsertPasar", res);
    return res;
  },
});

export const upsertKaryawan = mutation({
  args: { doc: v.any() },
  handler: async (ctx, { doc }) => {
    logRequest("upsertKaryawan", doc);
    const parsed = validate(karyawanSchema, doc);
    if (!parsed.success) return badRequest("Data karyawan tidak valid", parsed.errors);
    const d = parsed.data;
    // utangTotal TIDAK diambil dari form — selalu disinkronkan dari record utang,
    // agar mengedit karyawan tidak menghapus saldo utang yang sudah tersinkron.
    const res = await upsertByKey(ctx, "karyawan", "id", d.id, {
      nama: d.nama,
      jabatan: d.jabatan ?? "",
      gajiPokok: d.gajiPokok,
    });
    await syncKaryawanUtangTotal(ctx, d.id);
    logResponse("upsertKaryawan", res);
    return res;
  },
});

export const deleteMaster = mutation({
  args: { table: v.string(), id: v.string() },
  handler: async (ctx, { table, id }) => {
    logRequest("deleteMaster", { table, id });
    const validTables = [
      "barang", "supplier", "reseller", "dpl", "pasar", "karyawan", "absensi", "utang",
      "retur", "pengeluaran", "gudang", "slipgaji", "bahanBaku", "barangJadi",
    ] as const;
    if (!(validTables as readonly string[]).includes(table)) return badRequest("Tabel tidak dikenal", { table });
    const keyField = table === "barang" || table === "bahanBaku" || table === "barangJadi" ? "kode" : table === "gudang" ? "namaBarang" : "id";
    const existing = await findOneByKey(ctx, table as any, keyField as any, id);
    if (!existing) return { deleted: false, id };

    // Hapus slip gaji → bersihkan entri kas (KAS-SLP-* + KAS-DND-*) dan
    // kembalikan potongan utang/casbon ke record utang (agar tidak hilang
    // saat slip dihitung ulang), lalu re-sinkron utangTotal karyawan.
    if (table === "slipgaji") {
      const slip = existing as any;
      await ctx.db.delete(existing._id);
      // Kembalikan potongan utang & casbon yang sudah dipotong slip ini
      if ((slip.potonganUtang || 0) > 0 || (slip.potonganCasbon || 0) > 0) {
        const allUtang = await ctx.db.query("utang").filter((q) => q.eq(q.field("idKaryawan"), slip.idKaryawan)).collect();
        let sisaPotonganUtang = slip.potonganUtang || 0;
        for (const u of allUtang.filter((x) => x.jenis === "Utang" && (x.sisaUtang || 0) > 0)) {
          if (sisaPotonganUtang <= 0) break;
          const restore = Math.min(sisaPotonganUtang, u.sisaUtang || 0);
          sisaPotonganUtang -= restore;
          const dibayar = Math.max(0, (u.dibayar || 0) - restore);
          const sisa = Math.min(u.nominal, (u.sisaUtang || 0) + restore);
          await ctx.db.patch(u._id, {
            dibayar,
            sisaUtang: sisa,
            status: sisa >= u.nominal ? "Belum" : dibayar > 0 ? "Parsial" : "Belum",
            tglBayar: dibayar > 0 ? (u.tglBayar ?? "") : "",
          });
        }
        let sisaPotonganCasbon = slip.potonganCasbon || 0;
        for (const u of allUtang.filter((x) => x.jenis === "Casbon" && (x.sisaUtang || 0) > 0)) {
          if (sisaPotonganCasbon <= 0) break;
          const restore = Math.min(sisaPotonganCasbon, u.sisaUtang || 0);
          sisaPotonganCasbon -= restore;
          const dibayar = Math.max(0, (u.dibayar || 0) - restore);
          const sisa = Math.min(u.nominal, (u.sisaUtang || 0) + restore);
          await ctx.db.patch(u._id, {
            dibayar,
            sisaUtang: sisa,
            status: sisa >= u.nominal ? "Belum" : dibayar > 0 ? "Parsial" : "Belum",
            tglBayar: dibayar > 0 ? (u.tglBayar ?? "") : "",
          });
        }
        await syncKaryawanUtangTotal(ctx, slip.idKaryawan);
      }
      // Hapus entri kas milik slip (gaji keluar + denda masuk)
      const kasSlip = await findOneByKey(ctx, "kas", "id", `KAS-SLP-${id}`);
      if (kasSlip) await ctx.db.delete(kasSlip._id);
      const kasDenda = await findOneByKey(ctx, "kas", "id", `KAS-DND-${id}`);
      if (kasDenda) await ctx.db.delete(kasDenda._id);
      await recomputeKas(ctx);
      logResponse("deleteMaster", { deleted: true, id, table });
      return { deleted: true, id };
    }

    // Hapus utang → re-sinkron utangTotal karyawan
    if (table === "utang") {
      const idKaryawan = (existing as any).idKaryawan;
      await ctx.db.delete(existing._id);
      if (idKaryawan) await syncKaryawanUtangTotal(ctx, idKaryawan);
      logResponse("deleteMaster", { deleted: true, id, table });
      return { deleted: true, id };
    }

    // Hapus pengeluaran → bersihkan utang otomatis (UTG-PEN-*) + kas + re-sync
    if (table === "pengeluaran") {
      const idKaryawan = (existing as any).idKaryawan;
      await ctx.db.delete(existing._id);
      const autoUtang = await findOneByKey(ctx, "utang", "id", `UTG-PEN-${id}`);
      if (autoUtang) {
        await ctx.db.delete(autoUtang._id);
        if (idKaryawan) await syncKaryawanUtangTotal(ctx, idKaryawan);
      }
      const kas = await findOneByKey(ctx, "kas", "id", `KAS-PEN-${id}`);
      if (kas) await ctx.db.delete(kas._id);
      await recomputeKas(ctx);
      logResponse("deleteMaster", { deleted: true, id, table });
      return { deleted: true, id };
    }

    // Hapus master barang / bahan baku / barang jadi → stok otomatis hilang
    // dari Gudang & Tetesan (baris stok + riwayat perubahan).
    if (table === "barang" || table === "bahanBaku" || table === "barangJadi") {
      const nama = (existing as any).nama;
      await ctx.db.delete(existing._id);
      if (nama) await purgeStokFor(ctx, nama);
      logResponse("deleteMaster", { deleted: true, id, table });
      return { deleted: true, id };
    }

    await ctx.db.delete(existing._id);
    logResponse("deleteMaster", { deleted: true, id });
    return { deleted: true, id };
  },
});

// ============================================================================
// ABSENSI — data otomatis dipakai slip gaji (potongan absensi)
// ============================================================================

export const upsertAbsensi = mutation({
  args: { doc: v.any() },
  handler: async (ctx, { doc }) => {
    logRequest("upsertAbsensi", doc);
    const parsed = validate(absensiSchema, doc);
    if (!parsed.success) return badRequest("Data absensi tidak valid", parsed.errors);
    const d = parsed.data;
    const res = await upsertByKey(ctx, "absensi", "id", d.id, {
      idKaryawan: d.idKaryawan,
      tanggal: d.tanggal,
      status: d.status,
      jamMasuk: d.jamMasuk ?? "",
      jamKeluar: d.jamKeluar ?? "",
    });
    logResponse("upsertAbsensi", res);
    return res;
  },
});

// ============================================================================
// UTANG — otomatis terpotong di slip gaji; pengeluaran "Utang Karyawan"
// otomatis menambah record utang. Setiap perubahan utang → sinkron utangTotal.
// ============================================================================

/** Rekalkulasi utangTotal karyawan = Σ sisaUtang semua utang karyawan tsb. */
export async function syncKaryawanUtangTotal(ctx: any, idKaryawan: string) {
  const all = await ctx.db.query("utang").filter((q: any) => q.eq(q.field("idKaryawan"), idKaryawan)).collect();
  const total = all.reduce((s: number, u: any) => s + (u.sisaUtang || 0), 0);
  const karyawan = await ctx.db.query("karyawan").filter((q: any) => q.eq(q.field("id"), idKaryawan)).first();
  if (karyawan && karyawan.utangTotal !== total) {
    await ctx.db.patch(karyawan._id, { utangTotal: total });
  }
}

export const upsertUtang = mutation({
  args: { doc: v.any() },
  handler: async (ctx, { doc }) => {
    logRequest("upsertUtang", doc);
    const parsed = validate(utangSchema, doc);
    if (!parsed.success) return badRequest("Data utang tidak valid", parsed.errors);
    const d = parsed.data;
    // Bila pindah karyawan saat edit, re-sinkron karyawan lama juga
    const prev = await findOneByKey(ctx, "utang", "id", d.id);
    const prevKaryawan = prev ? (prev as any).idKaryawan : undefined;
    const res = await upsertByKey(ctx, "utang", "id", d.id, {
      idKaryawan: d.idKaryawan,
      tanggal: d.tanggal,
      nominal: d.nominal,
      status: d.status,
      dibayar: d.dibayar,
      tglBayar: d.tglBayar ?? "",
      sisaUtang: d.sisaUtang,
      keterangan: d.keterangan ?? "",
      jenis: d.jenis ?? "Utang",
    });
    await syncKaryawanUtangTotal(ctx, d.idKaryawan);
    if (prevKaryawan && prevKaryawan !== d.idKaryawan) await syncKaryawanUtangTotal(ctx, prevKaryawan);
    logResponse("upsertUtang", res);
    return res;
  },
});

/** Pembayaran utang manual oleh karyawan (kas masuk) — otomatis kurangi utangTotal. */
export const bayarUtang = mutation({
  args: { id: v.string(), jumlah: v.number(), tglBayar: v.optional(v.string()) },
  handler: async (ctx, { id, jumlah, tglBayar }) => {
    logRequest("bayarUtang", { id, jumlah, tglBayar });
    if (jumlah <= 0) return badRequest("Jumlah pembayaran harus lebih dari 0");
    const utang = await findOneByKey(ctx, "utang", "id", id);
    if (!utang) return badRequest("Utang tidak ditemukan", { id });
    const dibayar = utang.dibayar + jumlah;
    const sisaUtang = Math.max(0, utang.nominal - dibayar);
    const status = sisaUtang <= 0 ? "Lunas" : dibayar > 0 ? "Parsial" : "Belum";
    const tgl = tglBayar || todayStr();
    await ctx.db.patch(utang._id, { dibayar, sisaUtang, status, tglBayar: tgl });
    // Kas masuk dari pembayaran utang
    await recordKas(ctx, `KAS-UTG-${id}-${Date.now().toString(36)}`, tgl, jumlah, 0, `Pembayaran utang ${utang.keterangan || utang.id}`, "Pembayaran Utang");
    await syncKaryawanUtangTotal(ctx, utang.idKaryawan);
    logResponse("bayarUtang", { id, dibayar, sisaUtang, status });
    return { id, dibayar, sisaUtang, status };
  },
});

// ============================================================================
// INVOICE (multi-barang) — efek stok + kas otomatis; mataUang Rp/$ (Supplier);
// status pembayaran Lunas/Pending; aksi Bayar mencatat pembayaran (dibayar,
// sisa, riwayatBayar) dan mengurangi sisa tagihan otomatis. Edit invoice yang
// sudah jadi: efek lama dibatalkan lalu diterapkan ulang (editInvoice).
// ============================================================================

export const createInvoice = mutation({
  args: { doc: v.any() },
  handler: async (ctx, { doc }) => {
    logRequest("createInvoice", doc);
    const parsed = validate(invoiceSchema, doc);
    if (!parsed.success) return badRequest("Payload invoice tidak sesuai schema", parsed.errors);
    const d = parsed.data;
    const totals = computeInvoiceTotals(d.tipe as InvoiceTipe, d.items as InvoiceItem[]);
    const mataUang = (doc as any)?.mataUang === "$" ? "$" : "Rp"; // default Rupiah; Supplier bisa pilih "$"
    const statusPembayaran = d.statusPembayaran === "Lunas" ? "Lunas" : "Pending";
    // Jumlah yang harus dibayar: penjualan utk Reseller/DPL/Pasar, pembelian utk Supplier
    const totalTagihan = totals.totalPenjualan || totals.total || 0;

    const existing = await findOneByKey(ctx, "invoice", "idInvoice", d.idInvoice);
    const id: Id<"invoice"> | undefined = existing ? (existing._id as Id<"invoice">) : undefined;

    // Simpan invoice (upsert by idInvoice → ON CONFLICT DO UPDATE)
    if (id) {
      // Re-save: jangan timpa status pembayaran / dibayar / riwayat yang sudah
      // tercatat (aksi Bayar & setStatusInvoice). Sisa dihitung ulang bila
      // total berubah karena item diedit.
      const prevDibayar = (existing as any).dibayar ?? 0;
      await ctx.db.patch(id, {
        tanggal: d.tanggal,
        tipe: d.tipe as InvoiceTipe,
        namaPihak: d.namaPihak,
        tenggat: d.tenggat ?? "",
        mataUang,
        items: d.items,
        total: totals.total,
        totalModal: totals.totalModal,
        totalPenjualan: totals.totalPenjualan,
        margin: totals.margin,
        sisa: Math.max(0, totalTagihan - prevDibayar),
      });
    } else {
      await ctx.db.insert("invoice", {
        idInvoice: d.idInvoice,
        tanggal: d.tanggal,
        tipe: d.tipe as InvoiceTipe,
        namaPihak: d.namaPihak,
        tenggat: d.tenggat ?? "",
        mataUang,
        statusPembayaran,
        items: d.items,
        total: totals.total,
        totalModal: totals.totalModal,
        totalPenjualan: totals.totalPenjualan,
        margin: totals.margin,
        dibayar: 0,
        sisa: totalTagihan,
        riwayatBayar: [],
      });
    }

    // -----------------------------------------------------------------
    // Efek stok & kas per tipe invoice
    // -----------------------------------------------------------------
    await applyInvoiceStokKas(ctx, d, totals);

    // Sinkronisasi harga & barang baru ke master Barang bila belum ada
    for (const it of d.items) {
      const b = await findOneByKey(ctx, "barang", "kode", it.kodeBarang);
      if (!b) {
        await ctx.db.insert("barang", {
          kode: it.kodeBarang,
          nama: it.namaBarang,
          harga: it.hargaJual ?? it.hargaModal,
          kategori: "",
        });
      }
    }

    logResponse("createInvoice", { idInvoice: d.idInvoice, ...totals });
    return { idInvoice: d.idInvoice, ...totals };
  },
});

/**
 * Terapkan efek stok & kas invoice ke Gudang (dipakai createInvoice &
 * editInvoice). Dijalankan SETELAH efek lama dibatalkan (edit) atau pada
 * invoice baru (create).
 */
async function applyInvoiceStokKas(ctx: any, d: any, totals: any) {
  const tipe = d.tipe as InvoiceTipe;
  const refKey = `INV-${d.idInvoice}`;
  if (tipe === "Supplier") {
    // Stok bertambah di Gudang; Kas keluar (pembelian)
    for (const it of d.items) {
      await addStokHistory(ctx, it.namaBarang, d.tanggal, it.qty, "Supplier", `Invoice ${d.idInvoice}`);
    }
    await recordKas(ctx, refKey, d.tanggal, 0, totals.total, `Pembelian dari ${d.namaPihak} (${d.idInvoice})`, "Invoice Supplier");
  } else if (tipe === "Reseller" || tipe === "DPL") {
    // Stok berkurang di Gudang; Kas masuk (penjualan)
    for (const it of d.items) {
      await addStokHistory(ctx, it.namaBarang, d.tanggal, -it.qty, tipe, `Invoice ${d.idInvoice}`);
    }
    await recordKas(ctx, refKey, d.tanggal, totals.totalPenjualan, 0, `Penjualan ke ${d.namaPihak} (${d.idInvoice})`, `Invoice ${tipe}`);
  } else {
    // Pasar (Victoria/Tunas): stok awal dikirim, stok akhir dikembalikan ke gudang.
    // Penjualan = stokAwal - stokAkhir.
    for (const it of d.items) {
      const stokAwal = it.stokAwal ?? 0;
      const stokAkhir = it.stokAkhir ?? 0;
      const terjual = stokAwal - stokAkhir;
      await addStokHistory(ctx, it.namaBarang, d.tanggal, -stokAwal, "Pasar", `Kirim stok awal ke ${d.namaPihak} (${d.idInvoice})`);
      if (stokAkhir > 0) {
        await addStokHistory(ctx, it.namaBarang, d.tanggal, stokAkhir, "Pasar", `Stok akhir kembali dari ${d.namaPihak} (${d.idInvoice})`);
      }
      if (terjual < 0) return badRequest("Stok akhir tidak boleh melebihi stok awal", { item: it });
    }
    await recordKas(ctx, refKey, d.tanggal, totals.totalPenjualan, 0, `Penjualan di Pasar ${d.namaPihak} (${d.idInvoice})`, "Invoice Pasar");
  }
}

/**
 * Batalkan seluruh efek invoice lama dari Gudang & kas (dipakai editInvoice):
 * hapus riwayat stok milik invoice ini lalu hapus entri kas, dan hitung ulang
 * saldo kas. Efek baru diterapkan setelahnya oleh applyInvoiceStokKas.
 */
async function purgeInvoiceEffects(ctx: any, idInvoice: string) {
  const allHist = await ctx.db.query("stokHistory").collect();
  const hist = allHist.filter(
    (h: any) =>
      h.keterangan === `Invoice ${idInvoice}` ||
      (h.keterangan ?? "").includes(`(${idInvoice})`),
  );
  for (const h of hist) await ctx.db.delete(h._id);
  const kas = await findOneByKey(ctx, "kas", "id", `INV-${idInvoice}`);
  if (kas) await ctx.db.delete(kas._id);
  await recomputeKas(ctx);
}

/**
 * Edit invoice yang sudah jadi: ganti isi (tanggal, pihak, barang, harga,
 * qty, tenggat, mata uang). Efek stok & kas invoice lama otomatis dibatalkan
 * lalu diterapkan ulang sesuai isi baru (tidak ada double-count). Status
 * pembayaran, dibayar, dan riwayat pembayaran yang sudah tercatat dipertahankan;
 * sisa tagihan dihitung ulang dari total baru.
 */
export const editInvoice = mutation({
  args: { doc: v.any() },
  handler: async (ctx, { doc }) => {
    logRequest("editInvoice", doc);
    const parsed = validate(invoiceSchema, doc);
    if (!parsed.success) return badRequest("Payload invoice tidak sesuai schema", parsed.errors);
    const d = parsed.data;
    const existing = await findOneByKey(ctx, "invoice", "idInvoice", d.idInvoice);
    if (!existing) {
      return badRequest("Invoice tidak ditemukan — gunakan 'Buat Invoice' untuk invoice baru", { idInvoice: d.idInvoice });
    }
    const totals = computeInvoiceTotals(d.tipe as InvoiceTipe, d.items as InvoiceItem[]);
    const mataUang = (doc as any)?.mataUang === "$" ? "$" : "Rp";
    const totalTagihan = totals.totalPenjualan || totals.total || 0;
    const prevDibayar = (existing as any).dibayar ?? 0;

    // 1) Batalkan efek lama (stok & kas invoice lama dikembalikan)
    await purgeInvoiceEffects(ctx, d.idInvoice);

    // 2) Update data invoice — status/dibayar/riwayat yang sudah tercatat
    //    dipertahankan; sisa dihitung ulang dari total baru.
    await ctx.db.patch(existing._id, {
      tanggal: d.tanggal,
      tipe: d.tipe as InvoiceTipe,
      namaPihak: d.namaPihak,
      tenggat: d.tenggat ?? "",
      mataUang,
      items: d.items,
      total: totals.total,
      totalModal: totals.totalModal,
      totalPenjualan: totals.totalPenjualan,
      margin: totals.margin,
      sisa: Math.max(0, totalTagihan - prevDibayar),
    });

    // 3) Terapkan efek stok & kas baru
    await applyInvoiceStokKas(ctx, d, totals);

    // Sinkronisasi harga & barang baru ke master Barang bila belum ada
    for (const it of d.items) {
      const b = await findOneByKey(ctx, "barang", "kode", it.kodeBarang);
      if (!b) {
        await ctx.db.insert("barang", {
          kode: it.kodeBarang,
          nama: it.namaBarang,
          harga: it.hargaJual ?? it.hargaModal,
          kategori: "",
        });
      }
    }

    logResponse("editInvoice", { idInvoice: d.idInvoice, ...totals });
    return { idInvoice: d.idInvoice, ...totals, edited: true };
  },
});

/**
 * Ubah status pembayaran invoice (Lunas/Pending) — bisa diubah kapan saja.
 * Bila diset Lunas, dibayar/sisa ikut disinkronkan (dibayar = tagihan, sisa = 0)
 * agar konsisten dengan aksi Bayar.
 */
export const setStatusInvoice = mutation({
  args: { idInvoice: v.string(), status: v.string() },
  handler: async (ctx, { idInvoice, status }) => {
    logRequest("setStatusInvoice", { idInvoice, status });
    if (status !== "Lunas" && status !== "Pending") {
      return badRequest("Status pembayaran harus 'Lunas' atau 'Pending'", { status });
    }
    const inv = await findOneByKey(ctx, "invoice", "idInvoice", idInvoice);
    if (!inv) return badRequest("Invoice tidak ditemukan", { idInvoice });
    if (status === "Lunas") {
      const totalTagihan = (inv as any).totalPenjualan || (inv as any).total || 0;
      await ctx.db.patch(inv._id, { statusPembayaran: "Lunas", dibayar: totalTagihan, sisa: 0 });
    } else {
      // Pending: pertahankan pembayaran yg sudah tercatat (dibayar/sisa/riwayat)
      await ctx.db.patch(inv._id, { statusPembayaran: "Pending" });
    }
    logResponse("setStatusInvoice", { idInvoice, status });
    return { idInvoice, status };
  },
});

export const deleteInvoice = mutation({
  args: { idInvoice: v.string() },
  handler: async (ctx, { idInvoice }) => {
    logRequest("deleteInvoice", { idInvoice });
    const inv = await findOneByKey(ctx, "invoice", "idInvoice", idInvoice);
    if (!inv) return { deleted: false };
    // Hapus riwayat stok yang berasal dari invoice ini.
    const allHist = await ctx.db.query("stokHistory").collect();
    const hist = allHist.filter(
      (h) =>
        h.keterangan === `Invoice ${idInvoice}` ||
        (h.keterangan ?? "").includes(`(${idInvoice})`),
    );
    for (const h of hist) await ctx.db.delete(h._id);
    // Hapus entri kas milik invoice
    const kas = await findOneByKey(ctx, "kas", "id", `INV-${idInvoice}`);
    if (kas) await ctx.db.delete(kas._id);
    await recomputeKas(ctx);
    await ctx.db.delete(inv._id);
    logResponse("deleteInvoice", { deleted: true });
    return { deleted: true };
  },
});

// ============================================================================
// RETUR — otomatis menambah stok ke Gudang
// ============================================================================

export const upsertRetur = mutation({
  args: { doc: v.any() },
  handler: async (ctx, { doc }) => {
    logRequest("upsertRetur", doc);
    const parsed = validate(returSchema, doc);
    if (!parsed.success) return badRequest("Data retur tidak valid", parsed.errors);
    const d = parsed.data;
    // Normalisasi qty desimal (mis. 0,7 kg) agar riwayat stok & gudang konsisten
    const qty = Math.round((Number(d.qty) || 0) * 100) / 100;
    const res = await upsertByKey(ctx, "retur", "id", d.id, {
      tanggal: d.tanggal,
      tipe: d.tipe,
      namaPihak: d.namaPihak,
      namaBarang: d.namaBarang,
      qty,
      keterangan: d.keterangan ?? "",
    });
    // Retur menambah stok gudang
    await addStokHistory(ctx, d.namaBarang, d.tanggal, qty, "Retur", `Retur dari ${d.tipe} ${d.namaPihak} (${d.id})`);
    logResponse("upsertRetur", res);
    return res;
  },
});

// ============================================================================
// KAS HARIAN — manual + saldo awal + hapus transaksi
// ============================================================================

export const upsertKasManual = mutation({
  args: { doc: v.any() },
  handler: async (ctx, { doc }) => {
    logRequest("upsertKasManual", doc);
    const parsed = validate(kasSchema, doc);
    if (!parsed.success) return badRequest("Data kas tidak valid", parsed.errors);
    const d = parsed.data;
    if (d.kasMasuk > 0 && d.kasKeluar > 0) return badRequest("Pilih salah satu: kas masuk ATAU kas keluar");
    const refKey = d.id;
    const res = await upsertByKey(ctx, "kas", "id", refKey, {
      tanggal: d.tanggal,
      kasMasuk: d.kasMasuk,
      kasKeluar: d.kasKeluar,
      saldoAwal: 0,
      saldoAkhir: 0,
      keterangan: d.keterangan ?? "",
      sumber: "Manual",
    });
    await recomputeKas(ctx);
    logResponse("upsertKasManual", res);
    return res;
  },
});

/**
 * Hapus transaksi kas harian.
 * Hanya entri Manual / Saldo Awal yang boleh dihapus langsung; entri otomatis
 * (invoice, pengeluaran, slip gaji) harus dihapus dari sumbernya agar konsisten.
 * Saldo otomatis dihitung ulang → uang kembali ke saldo kas.
 */
export const deleteKas = mutation({
  args: { id: v.string() },
  handler: async (ctx, { id }) => {
    logRequest("deleteKas", { id });
    const row = await findOneByKey(ctx, "kas", "id", id);
    if (!row) return { deleted: false, id };
    const sumber = (row as any).sumber;
    if (sumber !== "Manual" && sumber !== "Saldo Awal") {
      return badRequest(
        `Transaksi ${sumber} tidak bisa dihapus langsung — hapus dari sumbernya (invoice/pengeluaran/slip gaji)`,
        { id, sumber },
      );
    }
    await ctx.db.delete(row._id);
    await recomputeKas(ctx);
    logResponse("deleteKas", { deleted: true, id });
    return { deleted: true, id };
  },
});

/** Set saldo awal kas (entri khusus, ID KAS-AWAL). */
export const setSaldoAwalKas = mutation({
  args: { nominal: v.number(), tanggal: v.optional(v.string()) },
  handler: async (ctx, { nominal, tanggal }) => {
    logRequest("setSaldoAwalKas", { nominal, tanggal });
    if (nominal < 0) return badRequest("Saldo awal tidak boleh negatif");
    const existing = await findOneByKey(ctx, "kas", "id", "KAS-AWAL");
    if (existing) {
      await ctx.db.patch(existing._id, { kasMasuk: nominal, kasKeluar: 0, tanggal: tanggal || todayStr(), keterangan: "Saldo awal kas" });
    } else {
      await ctx.db.insert("kas", {
        id: "KAS-AWAL",
        tanggal: tanggal || todayStr(),
        kasMasuk: nominal,
        kasKeluar: 0,
        saldoAwal: 0,
        saldoAkhir: 0,
        keterangan: "Saldo awal kas",
        sumber: "Saldo Awal",
      });
    }
    await recomputeKas(ctx);
    logResponse("setSaldoAwalKas", { ok: true });
    return { ok: true };
  },
});

// ============================================================================
// PENGELUARAN — integrasi utang karyawan & kas
// ============================================================================

export const upsertPengeluaran = mutation({
  args: { doc: v.any() },
  handler: async (ctx, { doc }) => {
    logRequest("upsertPengeluaran", doc);
    const parsed = validate(pengeluaranSchema, doc);
    if (!parsed.success) return badRequest("Data pengeluaran tidak valid", parsed.errors);
    const d = parsed.data;

    const existing = await findOneByKey(ctx, "pengeluaran", "id", d.id);
    if (existing) {
      await ctx.db.patch(existing._id, {
        tanggal: d.tanggal,
        jenis: d.jenis,
        nominal: d.nominal,
        keterangan: d.keterangan ?? "",
        idKaryawan: d.idKaryawan ?? "",
      });
    } else {
      await ctx.db.insert("pengeluaran", {
        id: d.id,
        tanggal: d.tanggal,
        jenis: d.jenis,
        nominal: d.nominal,
        keterangan: d.keterangan ?? "",
        idKaryawan: d.idKaryawan ?? "",
      });
    }

    // Kas keluar
    await recordKas(ctx, `KAS-PEN-${d.id}`, d.tanggal, 0, d.nominal, `Pengeluaran ${d.jenis}${d.keterangan ? `: ${d.keterangan}` : ""} (${d.id})`, "Pengeluaran");

    // Integrasi: pengeluaran jenis "Utang Karyawan" → tambah record utang + utangTotal
    if (d.jenis === "Utang Karyawan" && d.idKaryawan) {
      const utangId = `UTG-PEN-${d.id}`;
      await upsertByKey(ctx, "utang", "id", utangId, {
        idKaryawan: d.idKaryawan,
        tanggal: d.tanggal,
        nominal: d.nominal,
        status: "Belum",
        dibayar: 0,
        tglBayar: "",
        sisaUtang: d.nominal,
        keterangan: `Pengeluaran utang karyawan ${d.keterangan || ""}`.trim(),
        jenis: "Utang",
      });
      await syncKaryawanUtangTotal(ctx, d.idKaryawan);
    }

    logResponse("upsertPengeluaran", { id: d.id });
    return { id: d.id };
  },
});

// ============================================================================
// GUDANG — stok manual (stok awal per tanggal, bisa minus)
// ============================================================================

export const upsertGudang = mutation({
  args: { doc: v.any() },
  handler: async (ctx, { doc }) => {
    logRequest("upsertGudang", doc);
    const parsed = validate(gudangSchema, doc);
    if (!parsed.success) return badRequest("Data gudang tidak valid", parsed.errors);
    const d = parsed.data;
    const res = await upsertByKey(ctx, "gudang", "namaBarang", d.namaBarang, {
      id: d.id,
      stokAwal: d.stokAwal,
      tanggalStokAwal: d.tanggalStokAwal ?? "",
      keterangan: d.keterangan ?? "",
    });
    logResponse("upsertGudang", res);
    return res;
  },
});

/** Penyesuaian stok manual (catat riwayat tipe Manual). */
export const adjustStok = mutation({
  args: { namaBarang: v.string(), stokBaru: v.number(), keterangan: v.optional(v.string()) },
  handler: async (ctx, { namaBarang, stokBaru, keterangan }) => {
    logRequest("adjustStok", { namaBarang, stokBaru, keterangan });
    await ensureGudangRow(ctx, namaBarang);
    const history = await ctx.db.query("stokHistory").filter((q) => q.eq(q.field("namaBarang"), namaBarang)).collect();
    const gudang = await findOneByKey(ctx, "gudang", "namaBarang", namaBarang);
    const net = history.reduce((s, h) => s + h.perubahan, 0);
    const current = (gudang?.stokAwal ?? 0) + net;
    const delta = stokBaru - current;
    await ctx.db.insert("stokHistory", {
      id: `STK-${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
      tanggal: todayStr(),
      namaBarang,
      perubahan: delta,
      tipe: "Manual",
      keterangan: keterangan ?? "Penyesuaian stok",
    });
    logResponse("adjustStok", { namaBarang, delta, stokBaru });
    return { namaBarang, delta, stokBaru };
  },
});

// ============================================================================
// SLIP GAJI — tarik absensi, utang, casbon; bonus & denda; hitung gaji bersih
// GajiBersih = GajiPokok − PotonganAbsensi + BonusKerajinan + BonusBulanan
//              − (PotonganUtang + PotonganCasbon + Denda)
// ============================================================================

export const createSlipGaji = mutation({
  args: {
    idKaryawan: v.string(),
    periode: v.string(), // YYYY-MM
    bonusKerajinan: v.optional(v.number()),
    bonusBulanan: v.optional(v.number()),
    denda: v.optional(v.number()),
    // Potongan utang/casbon manual (0/kosong = otomatis dari sisa)
    potonganUtangManual: v.optional(v.number()),
    potonganCasbonManual: v.optional(v.number()),
  },
  handler: async (ctx, { idKaryawan, periode, bonusKerajinan, bonusBulanan, denda, potonganUtangManual, potonganCasbonManual }) => {
    logRequest("createSlipGaji", { idKaryawan, periode, bonusKerajinan, bonusBulanan, denda, potonganUtangManual, potonganCasbonManual });
    const karyawan = await ctx.db.query("karyawan").filter((q) => q.eq(q.field("id"), idKaryawan)).first();
    if (!karyawan) return badRequest("Karyawan tidak ditemukan", { idKaryawan });

    // Absensi bulan ini
    const absensi = await ctx.db.query("absensi").filter((q) => q.eq(q.field("idKaryawan"), idKaryawan)).collect();
    const absensiBulan = absensi.filter((a) => monthOf(a.tanggal) === periode);
    const counts = countAbsensi(absensiBulan);

    // Utang & casbon
    const utang = await ctx.db.query("utang").filter((q) => q.eq(q.field("idKaryawan"), idKaryawan)).collect();
    const sisaUtang = utang.filter((u) => u.jenis === "Utang").reduce((s, u) => s + u.sisaUtang, 0);
    const sisaCasbon = utang.filter((u) => u.jenis === "Casbon").reduce((s, u) => s + u.sisaUtang, 0);

    const gaji = computeSlipGaji({
      gajiPokok: karyawan.gajiPokok,
      bonusKerajinan: bonusKerajinan ?? 0,
      bonusBulanan: bonusBulanan ?? 0,
      denda: denda ?? 0,
      absensi: counts,
      sisaUtang,
      sisaCasbon,
      potonganUtangManual: potonganUtangManual ?? 0,
      potonganCasbonManual: potonganCasbonManual ?? 0,
    });

    const slipId = `SLP-${periode}-${idKaryawan}`;
    const existing = await findOneByKey(ctx, "slipgaji", "id", slipId);
    const slipData = {
      idKaryawan,
      periode,
      tanggal: todayStr(),
      gajiPokok: karyawan.gajiPokok,
      bonusKerajinan: bonusKerajinan ?? 0,
      bonusBulanan: bonusBulanan ?? 0,
      denda: gaji.denda,
      hadir: counts.hadir,
      izin: counts.izin,
      sakit: counts.sakit,
      alpa: counts.alpa,
      potonganAbsensi: gaji.potonganAbsensi,
      potonganUtang: gaji.potonganUtang,
      potonganCasbon: gaji.potonganCasbon,
      gajiBersih: gaji.gajiBersih,
      sisaUtang: gaji.sisaUtangAkhir,
      sisaCasbon: gaji.sisaCasbonAkhir,
    };
    if (existing) {
      await ctx.db.patch(existing._id, slipData);
    } else {
      await ctx.db.insert("slipgaji", { id: slipId, ...slipData });
    }

    // Kas keluar slip gaji (gaji bersih)
    await recordKas(ctx, `KAS-SLP-${slipId}`, todayStr(), 0, gaji.gajiBersih, `Slip gaji ${karyawan.nama} periode ${periode}`, "Slip Gaji");
    // Denda otomatis masuk ke Kas (kas bertambah)
    if (gaji.denda > 0) {
      await recordKas(ctx, `KAS-DND-${slipId}`, todayStr(), gaji.denda, 0, `Denda ${karyawan.nama} periode ${periode}`, "Denda");
    }

    // Tandai utang & casbon yang terpotong sebagai dibayar
    let sisaPotonganUtang = gaji.potonganUtang;
    for (const u of utang.filter((x) => x.jenis === "Utang" && x.sisaUtang > 0)) {
      if (sisaPotonganUtang <= 0) break;
      const potong = Math.min(sisaPotonganUtang, u.sisaUtang);
      sisaPotonganUtang -= potong;
      const dibayar = u.dibayar + potong;
      const sisa = u.nominal - dibayar;
      await ctx.db.patch(u._id, {
        dibayar,
        sisaUtang: sisa,
        status: sisa <= 0 ? "Lunas" : "Parsial",
        tglBayar: todayStr(),
      });
    }
    let sisaPotonganCasbon = gaji.potonganCasbon;
    for (const u of utang.filter((x) => x.jenis === "Casbon" && x.sisaUtang > 0)) {
      if (sisaPotonganCasbon <= 0) break;
      const potong = Math.min(sisaPotonganCasbon, u.sisaUtang);
      sisaPotonganCasbon -= potong;
      const dibayar = u.dibayar + potong;
      const sisa = u.nominal - dibayar;
      await ctx.db.patch(u._id, {
        dibayar,
        sisaUtang: sisa,
        status: sisa <= 0 ? "Lunas" : "Parsial",
        tglBayar: todayStr(),
      });
    }
    await syncKaryawanUtangTotal(ctx, idKaryawan);

    logResponse("createSlipGaji", { slipId, ...gaji });
    return {
      id: slipId,
      ...gaji,
      nama: karyawan.nama,
      sisaUtangAkhir: gaji.sisaUtangAkhir,
      sisaCasbonAkhir: gaji.sisaCasbonAkhir,
    };
  },
});

// ============================================================================
// MENU TETESAN — Master Bahan Baku, Barang Jadi, Invoice Modal/Penjualan, Stok
// ============================================================================

/** Pastikan baris stok tetesan ada (bila belum, buat dengan stokAwal master). */
async function ensureTetesanStokRow(ctx: any, namaBarang: string, tipe: "Baku" | "Jadi", stokAwal = 0) {
  const existing = await findOneByKey(ctx, "tetesanStok", "namaBarang", namaBarang);
  if (!existing) {
    await ctx.db.insert("tetesanStok", {
      id: `TSTK-${Date.now().toString(36).toUpperCase()}`,
      namaBarang,
      tipe,
      stokAwal,
      keterangan: "",
    });
  }
}

/** Tambah riwayat stok tetesan + pastikan baris ada. */
async function addTetesanStokHistory(
  ctx: any,
  namaBarang: string,
  tipe: "Baku" | "Jadi",
  tanggal: string,
  perubahan: number,
  asal: string,
  keterangan?: string,
) {
  await ensureTetesanStokRow(ctx, namaBarang, tipe);
  await ctx.db.insert("tetesanStokHistory", {
    id: `TSTK-${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
    tanggal,
    namaBarang,
    perubahan,
    tipe: asal,
    keterangan: keterangan ?? "",
  });
}

/** Validasi ringan payload tetesan (zod penuh ada di lib/schemas). */
function tetesanDoc(doc: unknown): any {
  if (!doc || typeof doc !== "object") return badRequest("Payload tidak sesuai schema", { doc });
  return doc as any;
}

export const upsertBahanBaku = mutation({
  args: { doc: v.any() },
  handler: async (ctx, { doc }) => {
    logRequest("upsertBahanBaku", doc);
    const d = tetesanDoc(doc);
    if (!d.kode || !d.nama) return badRequest("Kode & nama bahan baku wajib diisi");
    if ((Number(d.hargaModal) || 0) < 0) return badRequest("Harga modal tidak boleh negatif");
    const res = await upsertByKey(ctx, "bahanBaku", "kode", d.kode, {
      nama: d.nama,
      hargaModal: Number(d.hargaModal) || 0,
      stokAwal: Number(d.stokAwal) || 0,
      kategori: d.kategori ?? "",
    });
    await ensureTetesanStokRow(ctx, d.nama, "Baku", Number(d.stokAwal) || 0);
    logResponse("upsertBahanBaku", res);
    return res;
  },
});

export const upsertBarangJadi = mutation({
  args: { doc: v.any() },
  handler: async (ctx, { doc }) => {
    logRequest("upsertBarangJadi", doc);
    const d = tetesanDoc(doc);
    if (!d.kode || !d.nama) return badRequest("Kode & nama barang jadi wajib diisi");
    if ((Number(d.hargaJual) || 0) < 0) return badRequest("Harga jual tidak boleh negatif");
    const res = await upsertByKey(ctx, "barangJadi", "kode", d.kode, {
      nama: d.nama,
      hargaJual: Number(d.hargaJual) || 0,
      stokAwal: Number(d.stokAwal) || 0,
      kategori: d.kategori ?? "",
    });
    await ensureTetesanStokRow(ctx, d.nama, "Jadi", Number(d.stokAwal) || 0);
    logResponse("upsertBarangJadi", res);
    return res;
  },
});

/** Setting stok awal barang Tetesan (Baku/Jadi) dengan tanggal. */
export const upsertTetesanStok = mutation({
  args: { doc: v.any() },
  handler: async (ctx, { doc }) => {
    logRequest("upsertTetesanStok", doc);
    const d = tetesanDoc(doc);
    if (!d.namaBarang) return badRequest("Nama barang wajib diisi");
    if ((Number(d.stokAwal) || 0) < 0) return badRequest("Stok awal tidak boleh negatif");
    const res = await upsertByKey(ctx, "tetesanStok", "namaBarang", d.namaBarang, {
      id: d.id ?? `TSTK-${Date.now().toString(36).toUpperCase()}`,
      tipe: d.tipe === "Jadi" ? "Jadi" : "Baku",
      stokAwal: Number(d.stokAwal) || 0,
      tanggalStokAwal: d.tanggalStokAwal ?? "",
      keterangan: d.keterangan ?? "",
    });
    logResponse("upsertTetesanStok", res);
    return res;
  },
});

/**
 * Invoice Tetesan:
 * - Modal     : beli bahan baku (harga modal) → stok Baku bertambah & stok
 *   Gudang berkurang (bahan baku diambil dari gudang), kas keluar.
 * - Penjualan : jual barang jadi (harga jual) → stok Jadi berkurang, kas masuk.
 *   Harga modal TIDAK tampil di invoice penjualan (hanya tersimpan di DB).
 * Pembayaran: dibayar/sisa/riwayatBayar diinisialisasi saat buat & diperbarui
 * oleh aksi Bayar (payment.bayarInvoiceTetesan). Edit invoice yang sudah jadi
 * dibatalkan lalu diterapkan ulang efeknya (editInvoiceTetesan).
 */
export const createInvoiceTetesan = mutation({
  args: { doc: v.any() },
  handler: async (ctx, { doc }) => {
    logRequest("createInvoiceTetesan", doc);
    const d = tetesanDoc(doc);
    const norm = normalizeTetesanInvoice(d);
    if (!norm.ok) return badRequest(norm.error);
    const { tipe, items, mataUang } = norm;
    const totals = computeTetesanTotals(tipe, items);

    const existing = await findOneByKey(ctx, "invoiceTetesan", "idInvoice", d.idInvoice);
    if (existing) {
      // Re-save: jangan timpa status/dibayar/riwayat pembayaran yang sudah tercatat.
      const prevDibayar = (existing as any).dibayar ?? 0;
      await ctx.db.patch(existing._id, {
        tanggal: d.tanggal,
        tipe,
        namaPihak: d.namaPihak,
        mataUang,
        items,
        total: totals.total,
        sisa: Math.max(0, totals.total - prevDibayar),
      });
    } else {
      await ctx.db.insert("invoiceTetesan", {
        idInvoice: d.idInvoice,
        tanggal: d.tanggal,
        tipe,
        namaPihak: d.namaPihak,
        mataUang,
        items,
        total: totals.total,
        statusPembayaran: "Pending",
        dibayar: 0,
        sisa: totals.total,
        riwayatBayar: [],
      });
    }

    // -----------------------------------------------------------------
    // Efek stok & kas
    // -----------------------------------------------------------------
    await applyTetesanStokKas(ctx, d, tipe, items, totals);

    logResponse("createInvoiceTetesan", { idInvoice: d.idInvoice, total: totals.total });
    return { idInvoice: d.idInvoice, total: totals.total };
  },
});

/** Validasi & normalisasi payload invoice tetesan (dipakai create & edit). */
function normalizeTetesanInvoice(d: any):
  | { ok: true; tipe: TetesanTipe; items: TetesanItem[]; mataUang: "Rp" | "$" }
  | { ok: false; error: string } {
  if (!d.idInvoice || !d.tanggal || !d.namaPihak) {
    return { ok: false, error: "Payload invoice tetesan tidak sesuai schema — butuh idInvoice, tanggal, namaPihak" };
  }
  const tipe: TetesanTipe = d.tipe === "Penjualan" ? "Penjualan" : "Modal";
  const items: TetesanItem[] = Array.isArray(d.items)
    ? d.items.map((it: any) => ({
        kodeBarang: String(it.kodeBarang ?? ""),
        namaBarang: String(it.namaBarang ?? ""),
        harga: Number(it.harga) || 0,
        qty: Number(it.qty) || 0,
        subtotal: Number(it.subtotal) || 0,
      }))
    : [];
  if (items.length === 0) return { ok: false, error: "Invoice minimal berisi 1 barang" };
  for (const it of items) {
    if (!it.kodeBarang || !it.namaBarang) return { ok: false, error: "Kode & nama barang wajib diisi" };
    if (it.qty <= 0) return { ok: false, error: "Qty harus lebih dari 0" };
  }
  return { ok: true, tipe, items, mataUang: d.mataUang === "$" ? "$" : "Rp" };
}

/**
 * Terapkan efek stok & kas invoice tetesan (dipakai createInvoiceTetesan &
 * editInvoiceTetesan). Dijalankan SETELAH efek lama dibatalkan (edit) atau
 * pada invoice baru (create).
 */
async function applyTetesanStokKas(ctx: any, d: any, tipe: TetesanTipe, items: TetesanItem[], totals: any) {
  if (tipe === "Modal") {
    // Stok bahan baku bertambah di Tetesan; stok Gudang berkurang (bahan
    // baku diambil dari gudang); kas keluar (pembelian)
    for (const it of items) {
      await addTetesanStokHistory(ctx, it.namaBarang, "Baku", d.tanggal, it.qty, "Invoice Modal", `Invoice Modal ${d.idInvoice}`);
      await addStokHistory(ctx, it.namaBarang, d.tanggal, -it.qty, "Tetesan Modal", `Invoice Modal Tetesan ${d.idInvoice}`);
      const b = await findOneByKey(ctx, "bahanBaku", "kode", it.kodeBarang);
      if (!b) {
        await ctx.db.insert("bahanBaku", {
          kode: it.kodeBarang,
          nama: it.namaBarang,
          hargaModal: it.harga,
          stokAwal: 0,
          kategori: "",
        });
      }
    }
    await recordKas(ctx, `KAS-TET-${d.idInvoice}`, d.tanggal, 0, totals.total, `Invoice Modal Tetesan ${d.namaPihak} (${d.idInvoice})`, "Invoice Modal Tetesan");
  } else {
    // Stok barang jadi berkurang; kas masuk (penjualan).
    // Stok BOLEH minus (konsisten dengan Gudang: "barang tetap bisa masuk,
    // stok bisa minus") sehingga invoice penjualan tidak pernah gagal
    // disimpan hanya karena stok 0/belum di-set.
    for (const it of items) {
      await addTetesanStokHistory(ctx, it.namaBarang, "Jadi", d.tanggal, -it.qty, "Invoice Penjualan", `Invoice Penjualan ${d.idInvoice}`);
      const b = await findOneByKey(ctx, "barangJadi", "kode", it.kodeBarang);
      if (!b) {
        await ctx.db.insert("barangJadi", {
          kode: it.kodeBarang,
          nama: it.namaBarang,
          hargaJual: it.harga,
          stokAwal: 0,
          kategori: "",
        });
      }
    }
    await recordKas(ctx, `KAS-TET-${d.idInvoice}`, d.tanggal, totals.total, 0, `Invoice Penjualan Tetesan ${d.namaPihak} (${d.idInvoice})`, "Invoice Penjualan Tetesan");
  }
}

/**
 * Batalkan seluruh efek invoice tetesan lama (stok Tetesan, stok Gudang dari
 * Invoice Modal, dan kas) — dipakai editInvoiceTetesan.
 */
async function purgeTetesanEffects(ctx: any, idInvoice: string) {
  const allHist = await ctx.db.query("tetesanStokHistory").collect();
  const hist = allHist.filter((h: any) => (h.keterangan ?? "").includes(idInvoice));
  for (const h of hist) await ctx.db.delete(h._id);
  const allGudangHist = await ctx.db.query("stokHistory").collect();
  const gHist = allGudangHist.filter((h: any) => h.tipe === "Tetesan Modal" && (h.keterangan ?? "").includes(idInvoice));
  for (const h of gHist) await ctx.db.delete(h._id);
  const kas = await findOneByKey(ctx, "kas", "id", `KAS-TET-${idInvoice}`);
  if (kas) await ctx.db.delete(kas._id);
  await recomputeKas(ctx);
}

/**
 * Edit invoice tetesan yang sudah jadi: ganti isi (tanggal, pihak, barang,
 * harga, qty). Efek stok & kas lama otomatis dibatalkan lalu diterapkan ulang
 * sesuai isi baru. Pembayaran yang sudah tercatat dipertahankan; sisa tagihan
 * dihitung ulang dari total baru.
 */
export const editInvoiceTetesan = mutation({
  args: { doc: v.any() },
  handler: async (ctx, { doc }) => {
    logRequest("editInvoiceTetesan", doc);
    const d = tetesanDoc(doc);
    const norm = normalizeTetesanInvoice(d);
    if (!norm.ok) return badRequest(norm.error);
    const { tipe, items, mataUang } = norm;
    const existing = await findOneByKey(ctx, "invoiceTetesan", "idInvoice", d.idInvoice);
    if (!existing) {
      return badRequest("Invoice tidak ditemukan — buat invoice baru untuk transaksi baru", { idInvoice: d.idInvoice });
    }
    const totals = computeTetesanTotals(tipe, items);
    const prevDibayar = (existing as any).dibayar ?? 0;

    // 1) Batalkan efek lama (stok Tetesan + stok Gudang + kas)
    await purgeTetesanEffects(ctx, d.idInvoice);

    // 2) Update data invoice — status/dibayar/riwayat yang sudah tercatat
    //    dipertahankan; sisa dihitung ulang dari total baru.
    await ctx.db.patch(existing._id, {
      tanggal: d.tanggal,
      tipe,
      namaPihak: d.namaPihak,
      mataUang,
      items,
      total: totals.total,
      sisa: Math.max(0, totals.total - prevDibayar),
    });

    // 3) Terapkan efek stok & kas baru
    await applyTetesanStokKas(ctx, d, tipe, items, totals);

    logResponse("editInvoiceTetesan", { idInvoice: d.idInvoice, total: totals.total });
    return { idInvoice: d.idInvoice, total: totals.total, edited: true };
  },
});

export const deleteInvoiceTetesan = mutation({
  args: { idInvoice: v.string() },
  handler: async (ctx, { idInvoice }) => {
    logRequest("deleteInvoiceTetesan", { idInvoice });
    const inv = await findOneByKey(ctx, "invoiceTetesan", "idInvoice", idInvoice);
    if (!inv) return { deleted: false };
    // Hapus riwayat stok dari invoice ini (stok Tetesan + stok Gudang yang
    // dibuat invoice Modal → stok gudang kembali normal)
    const allHist = await ctx.db.query("tetesanStokHistory").collect();
    const hist = allHist.filter((h) => (h.keterangan ?? "").includes(idInvoice));
    for (const h of hist) await ctx.db.delete(h._id);
    const allGudangHist = await ctx.db.query("stokHistory").collect();
    const gHist = allGudangHist.filter((h) => h.tipe === "Tetesan Modal" && (h.keterangan ?? "").includes(idInvoice));
    for (const h of gHist) await ctx.db.delete(h._id);
    // Hapus entri kas milik invoice
    const kas = await findOneByKey(ctx, "kas", "id", `KAS-TET-${idInvoice}`);
    if (kas) await ctx.db.delete(kas._id);
    await recomputeKas(ctx);
    await ctx.db.delete(inv._id);
    logResponse("deleteInvoiceTetesan", { deleted: true });
    return { deleted: true };
  },
});
