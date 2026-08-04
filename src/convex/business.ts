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
  upsertByKey,
  addStokHistory,
  ensureGudangRow,
  monthOf,
} from "./lib";
import {
  computeInvoiceTotals,
  computeSlipGaji,
  countAbsensi,
  todayStr,
  type InvoiceItem,
  type InvoiceTipe,
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
    const validTables = ["barang", "supplier", "reseller", "dpl", "pasar", "karyawan", "absensi", "utang", "retur", "pengeluaran", "gudang", "slipgaji"] as const;
    if (!(validTables as readonly string[]).includes(table)) return badRequest("Tabel tidak dikenal", { table });
    const keyField = table === "barang" ? "kode" : table === "gudang" ? "namaBarang" : "id";
    const existing = await findOneByKey(ctx, table as any, keyField as any, id);
    if (!existing) return { deleted: false, id };

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
      await recomputeKasAfterDelete(ctx);
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
// INVOICE (multi-barang) — efek stok + kas otomatis
// ============================================================================

export const createInvoice = mutation({
  args: { doc: v.any() },
  handler: async (ctx, { doc }) => {
    logRequest("createInvoice", doc);
    const parsed = validate(invoiceSchema, doc);
    if (!parsed.success) return badRequest("Payload invoice tidak sesuai schema", parsed.errors);
    const d = parsed.data;
    const totals = computeInvoiceTotals(d.tipe as InvoiceTipe, d.items as InvoiceItem[]);

    const existing = await findOneByKey(ctx, "invoice", "idInvoice", d.idInvoice);
    const id: Id<"invoice"> | undefined = existing ? (existing._id as Id<"invoice">) : undefined;

    // Simpan invoice (upsert by idInvoice → ON CONFLICT DO UPDATE)
    if (id) {
      await ctx.db.patch(id, {
        tanggal: d.tanggal,
        tipe: d.tipe as InvoiceTipe,
        namaPihak: d.namaPihak,
        tenggat: d.tenggat ?? "",
        items: d.items,
        total: totals.total,
        totalModal: totals.totalModal,
        totalPenjualan: totals.totalPenjualan,
        margin: totals.margin,
      });
    } else {
      await ctx.db.insert("invoice", {
        idInvoice: d.idInvoice,
        tanggal: d.tanggal,
        tipe: d.tipe as InvoiceTipe,
        namaPihak: d.namaPihak,
        tenggat: d.tenggat ?? "",
        items: d.items,
        total: totals.total,
        totalModal: totals.totalModal,
        totalPenjualan: totals.totalPenjualan,
        margin: totals.margin,
      });
    }

    // -----------------------------------------------------------------
    // Efek stok & kas per tipe invoice
    // -----------------------------------------------------------------
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

export const deleteInvoice = mutation({
  args: { idInvoice: v.string() },
  handler: async (ctx, { idInvoice }) => {
    logRequest("deleteInvoice", { idInvoice });
    const inv = await findOneByKey(ctx, "invoice", "idInvoice", idInvoice);
    if (!inv) return { deleted: false };
    // Hapus riwayat stok yang berasal dari invoice ini.
    // Supplier/Reseller/DPL memakai keterangan "Invoice <id>";
    // Pasar memakai "Kirim stok awal ... (<id>)" / "Stok akhir kembali ... (<id>)".
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
    await recomputeKasAfterDelete(ctx);
    await ctx.db.delete(inv._id);
    logResponse("deleteInvoice", { deleted: true });
    return { deleted: true };
  },
});

async function recomputeKasAfterDelete(ctx: any) {
  const { recomputeKas } = await import("./lib");
  await recomputeKas(ctx);
}

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
    const res = await upsertByKey(ctx, "retur", "id", d.id, {
      tanggal: d.tanggal,
      tipe: d.tipe,
      namaPihak: d.namaPihak,
      namaBarang: d.namaBarang,
      qty: d.qty,
      keterangan: d.keterangan ?? "",
    });
    // Retur menambah stok gudang
    await addStokHistory(ctx, d.namaBarang, d.tanggal, d.qty, "Retur", `Retur dari ${d.tipe} ${d.namaPihak} (${d.id})`);
    logResponse("upsertRetur", res);
    return res;
  },
});

// ============================================================================
// KAS HARIAN — manual + saldo awal
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
    await recomputeKasAfterDelete(ctx);
    logResponse("upsertKasManual", res);
    return res;
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
    await recomputeKasAfterDelete(ctx);
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
  },
  handler: async (ctx, { idKaryawan, periode, bonusKerajinan, bonusBulanan, denda }) => {
    logRequest("createSlipGaji", { idKaryawan, periode, bonusKerajinan, bonusBulanan, denda });
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
    });

    const slipId = `SLP-${periode}-${idKaryawan}`;
    const existing = await findOneByKey(ctx, "slipgaji", "id", slipId);
    if (existing) {
      await ctx.db.patch(existing._id, {
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
      });
    } else {
      await ctx.db.insert("slipgaji", {
        id: slipId,
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
      });
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
    return { id: slipId, ...gaji, nama: karyawan.nama };
  },
});
