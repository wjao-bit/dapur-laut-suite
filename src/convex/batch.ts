import { v } from "convex/values";
import { ConvexError } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import {
  badRequest,
  genBusinessId,
  logRequest,
  logResponse,
  recordKas,
  addStokHistory,
  recomputeKas,
  findOneByKey,
} from "./lib";
import { computeInvoiceTotals, todayStr, type InvoiceItem, type InvoiceTipe } from "./_business";

// ============================================================================
// BARANG MASUK — batch barang datang dari supplier + pemecahan ke
// Reseller/DPL/Pasar. Setiap alokasi otomatis membuat invoice sehingga nota
// muncul di menu Invoice seperti biasa; rekap per batch bisa menelusuri asal.
//
// KEAMANAN: semua mutasi wajib login (getAuthUserId).
// CATATAN: akses db untuk tabel batchMasuk/batchAlokasi memakai (ctx.db as any)
// mengikuti pola lib.ts agar aman terhadap tipe _generated yang belum regen.
// ============================================================================

/** Semua mutasi wajib login (email OTP / anonim sama-sama punya userId). */
async function requireLogin(ctx: unknown): Promise<string> {
  const userId = await getAuthUserId(ctx as any);
  if (!userId) {
    throw new ConvexError({ error: "Harus login dulu", message: "Harus login dulu" });
  }
  return userId;
}

/**
 * Terapkan efek gudang & kas untuk invoice hasil pemecahan batch.
 * Logika identik dengan efek invoice manual di business.ts:
 * - Reseller/DPL : stok berkurang, kas masuk sebesar penjualan.
 * - Pasar        : stok awal dikirim & stok akhir kembali; kas masuk
 *                  sebesar penjualan (stokAwal − stokAkhir).
 */
async function applyBatchInvoiceEffects(
  ctx: any,
  d: { idInvoice: string; tanggal: string; tipe: InvoiceTipe; namaPihak: string; items: InvoiceItem[] },
  totalPenjualan: number,
) {
  const tipe = d.tipe;
  const refKey = `INV-${d.idInvoice}`;

  if (tipe === "Reseller" || tipe === "DPL") {
    for (const it of d.items) {
      await addStokHistory(ctx, it.namaBarang, d.tanggal, -it.qty, tipe, `Invoice ${d.idInvoice}`);
    }
    await recordKas(
      ctx,
      refKey,
      d.tanggal,
      totalPenjualan,
      0,
      `Penjualan ke ${d.namaPihak} (${d.idInvoice})`,
      `Invoice ${tipe}`,
    );
  } else if (tipe === "Pasar") {
    for (const it of d.items) {
      const stokAwal = it.stokAwal ?? 0;
      const stokAkhir = it.stokAkhir ?? 0;
      await addStokHistory(
        ctx,
        it.namaBarang,
        d.tanggal,
        -stokAwal,
        "Pasar",
        `Kirim stok awal ke ${d.namaPihak} (${d.idInvoice})`,
      );
      if (stokAkhir > 0) {
        await addStokHistory(
          ctx,
          it.namaBarang,
          d.tanggal,
          stokAkhir,
          "Pasar",
          `Stok akhir kembali dari ${d.namaPihak} (${d.idInvoice})`,
        );
      }
    }
    await recordKas(
      ctx,
      refKey,
      d.tanggal,
      totalPenjualan,
      0,
      `Penjualan di Pasar ${d.namaPihak} (${d.idInvoice})`,
      "Invoice Pasar",
    );
  }
  // Supplier tidak dibuat lewat pemecahan batch → tidak ada cabang lain.
}

/** Semua batch barang masuk + ringkasan alokasi & sisa per batch. */
export const listBatchMasuk = query({
  args: {},
  handler: async (ctx) => {
    const batches = await (ctx.db as any).query("batchMasuk").order("desc").collect();
    const allAlokasi = await (ctx.db as any).query("batchAlokasi").collect();
    return batches.map((b: any) => {
      const alokasi = allAlokasi.filter((a: any) => a.batchId === b.id);
      const totalQty = b.items.reduce((s: number, it: any) => s + (it.qty || 0), 0);
      const totalModal = b.items.reduce(
        (s: number, it: any) => s + (it.qty || 0) * (it.hargaModal || 0),
        0,
      );
      // Sisa per barang = qty batch − jumlah alokasi barang tsb.
      const sisaPerBarang = b.items.map((it: any) => {
        const dipakai = alokasi
          .filter((a: any) => a.namaBarang === it.namaBarang)
          .reduce((s: number, a: any) => s + a.qty, 0);
        return {
          namaBarang: it.namaBarang,
          qty: it.qty,
          hargaModal: it.hargaModal,
          teralokasi: dipakai,
          sisa: Math.round(((it.qty || 0) - dipakai) * 1000) / 1000,
        };
      });
      const sisaTotal = sisaPerBarang.reduce((s: number, x: any) => s + Math.max(0, x.sisa), 0);
      return { ...b, alokasi, totalQty, totalModal, sisaPerBarang, sisaTotal };
    });
  },
});

/**
 * Pecahkan sebagian/seluruh stok satu barang dari batch ke sebuah tujuan
 * (Reseller / DPL / Pasar). Untuk Reseller & DPL dibuat invoice penjualan;
 * untuk Pasar dibuat invoice titipan (stokAwal = stokAkhir → belum terjual).
 */
export const splitBatch = mutation({
  args: {
    batchId: v.string(),
    namaBarang: v.string(),
    tujuan: v.union(v.literal("Reseller"), v.literal("DPL"), v.literal("Pasar")),
    namaTujuan: v.string(),
    qty: v.number(),
    hargaJual: v.number(),
    catatan: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireLogin(ctx);
    logRequest("splitBatch", args);
    const { batchId, namaBarang, tujuan, namaTujuan, qty, hargaJual } = args;

    if (!namaTujuan.trim()) return badRequest("Nama tujuan wajib diisi");
    if (!(qty > 0)) return badRequest("Qty harus lebih dari 0");
    if (hargaJual < 0) return badRequest("Harga jual tidak valid");

    const batch = await (ctx.db as any)
      .query("batchMasuk")
      .filter((q: any) => q.eq(q.field("id"), batchId))
      .first();
    if (!batch) return badRequest(`Batch ${batchId} tidak ditemukan`);

    const item = (batch.items as any[]).find((it: any) => it.namaBarang === namaBarang);
    if (!item) return badRequest(`Barang "${namaBarang}" tidak ada di batch ini`);

    const semuaAlokasi = await (ctx.db as any).query("batchAlokasi").collect();
    const dipakai = (semuaAlokasi as any[])
      .filter((a: any) => a.batchId === batchId && a.namaBarang === namaBarang)
      .reduce((s: number, a: any) => s + a.qty, 0);
    const sisa = (item.qty || 0) - dipakai;
    if (qty > sisa + 1e-9) {
      return badRequest(`Stok tidak cukup: sisa ${namaBarang} hanya ${sisa}`);
    }

    const tanggal = todayStr();

    // ------------------------------------------------------------------
    // Buat invoice otomatis sesuai tipe tujuan
    // ------------------------------------------------------------------
    const idInvoice = `B${Date.now().toString(36).toUpperCase()}${Math.random()
      .toString(36)
      .slice(2, 5)
      .toUpperCase()}`;
    const invItem: InvoiceItem =
      tujuan === "Pasar"
        ? {
            kodeBarang: namaBarang,
            namaBarang,
            hargaModal: item.hargaModal || 0,
            hargaJual,
            qty,
            subtotal: 0,
            stokAwal: qty,
            stokAkhir: qty, // titipan awal — belum ada laporan penjualan
          }
        : {
            kodeBarang: namaBarang,
            namaBarang,
            hargaModal: item.hargaModal || 0,
            hargaJual,
            qty,
            subtotal: Math.round(hargaJual * qty * 1000) / 1000,
          };

    const totals = computeInvoiceTotals(tujuan as InvoiceTipe, [invItem]);

    await (ctx.db as any).insert("invoice", {
      idInvoice,
      tanggal,
      tipe: tujuan,
      namaPihak: namaTujuan.trim(),
      tenggat: "",
      mataUang: "Rp",
      statusPembayaran: "Pending",
      items: [invItem],
      total: totals.total,
      totalModal: totals.totalModal,
      totalPenjualan: totals.totalPenjualan,
      margin: totals.margin,
      dibayar: 0,
      sisa: totals.total,
      riwayatBayar: [],
    });

    // Efek gudang & kas sama seperti invoice buatan manual
    await applyBatchInvoiceEffects(
      ctx as any,
      { idInvoice, tanggal, tipe: tujuan, namaPihak: namaTujuan.trim(), items: [invItem] },
      totals.totalPenjualan,
    );

    // ------------------------------------------------------------------
    // Catat alokasi
    // ------------------------------------------------------------------
    const alokasiId = genBusinessId("ALK");
    await (ctx.db as any).insert("batchAlokasi", {
      id: alokasiId,
      batchId,
      namaBarang,
      tujuan,
      namaTujuan: namaTujuan.trim(),
      qty,
      hargaJual,
      idInvoice,
      status: "Dikirim",
      tanggal,
    });

    logResponse("splitBatch", { alokasiId, idInvoice, ...totals });
    return { alokasiId, idInvoice, ...totals };
  },
});

/** Tandai alokasi sudah diterima tujuan. */
export const confirmAlokasi = mutation({
  args: { alokasiId: v.string() },
  handler: async (ctx, { alokasiId }) => {
    await requireLogin(ctx);
    const alokasi = await (ctx.db as any)
      .query("batchAlokasi")
      .filter((q: any) => q.eq(q.field("id"), alokasiId))
      .first();
    if (!alokasi) return badRequest("Alokasi tidak ditemukan");
    await (ctx.db as any).patch(alokasi._id, { status: "Diterima" });
    return { ok: true };
  },
});

/**
 * Hapus alokasi — invoice BESERTA seluruh efek kas & stoknya dibatalkan
 * bila masih belum dibayar, supaya tidak ada angka dobel saat dipecah ulang.
 */
export const deleteAlokasi = mutation({
  args: { alokasiId: v.string() },
  handler: async (ctx, { alokasiId }) => {
    await requireLogin(ctx);
    const alokasi = await (ctx.db as any)
      .query("batchAlokasi")
      .filter((q: any) => q.eq(q.field("id"), alokasiId))
      .first();
    if (!alokasi) return badRequest("Alokasi tidak ditemukan");
    if ((alokasi.status ?? "") === "Diterima") {
      return badRequest("Alokasi sudah dikonfirmasi diterima — tidak bisa dihapus");
    }
    if (alokasi.idInvoice) {
      const inv = await (ctx.db as any)
        .query("invoice")
        .filter((q: any) => q.eq(q.field("idInvoice"), alokasi.idInvoice))
        .first();
      if (inv && (inv.dibayar ?? 0) <= 0) {
        // --- Batalkan seluruh jejak invoice ini supaya tidak dobel hitung ---
        // 1) Hapus entri kas dengan ref INV-<idInvoice>, lalu hitung ulang saldo
        const kasRow = await findOneByKey(ctx as any, "kas", "id", `INV-${alokasi.idInvoice}`);
        if (kasRow) await (ctx.db as any).delete(kasRow._id);
        await recomputeKas(ctx as any);
        // 2) Hapus riwayat stok milik invoice ini (keterangan mengandung idInvoice)
        const semuaHist = await (ctx.db as any).query("stokHistory").collect();
        for (const h of semuaHist as any[]) {
          const ket = String(h.keterangan ?? "");
          if (
            ket.includes(`(${alokasi.idInvoice})`) ||
            ket.includes(`Invoice ${alokasi.idInvoice}`)
          ) {
            await (ctx.db as any).delete(h._id);
          }
        }
        // 3) Baru hapus invoice-nya
        await (ctx.db as any).delete(inv._id);
      }
    }
    await (ctx.db as any).delete(alokasi._id);
    return { ok: true };
  },
});

/** Hapus batch (hanya bila belum punya alokasi). */
export const deleteBatchMasuk = mutation({
  args: { batchId: v.string() },
  handler: async (ctx, { batchId }) => {
    await requireLogin(ctx);
    const batch = await (ctx.db as any)
      .query("batchMasuk")
      .filter((q: any) => q.eq(q.field("id"), batchId))
      .first();
    if (!batch) return badRequest("Batch tidak ditemukan");
    const alokasi = await (ctx.db as any)
      .query("batchAlokasi")
      .filter((q: any) => q.eq(q.field("batchId"), batchId))
      .first();
    if (alokasi) return badRequest("Batch sudah punya alokasi — hapus alokasinya dulu");
    await (ctx.db as any).delete(batch._id);
    return { ok: true };
  },
});

/** Catat barang masuk baru dari supplier. */
export const createBatchMasuk = mutation({
  args: {
    tanggal: v.string(),
    namaSupplier: v.string(),
    petugas: v.optional(v.string()),
    catatan: v.optional(v.string()),
    items: v.array(
      v.object({
        namaBarang: v.string(),
        qty: v.number(),
        hargaModal: v.number(),
      }),
    ),
  },
  handler: async (ctx, args) => {
    await requireLogin(ctx);
    logRequest("createBatchMasuk", args);
    if (!args.namaSupplier.trim()) return badRequest("Nama supplier wajib diisi");
    const items = args.items.filter((it) => it.namaBarang.trim() && it.qty > 0);
    if (items.length === 0) return badRequest("Minimal satu barang dengan qty > 0");

    const id = genBusinessId("BM");
    await (ctx.db as any).insert("batchMasuk", {
      id,
      tanggal: args.tanggal || todayStr(),
      namaSupplier: args.namaSupplier.trim(),
      petugas: args.petugas?.trim() || undefined,
      catatan: args.catatan?.trim() || undefined,
      items: items.map((it) => ({
        namaBarang: it.namaBarang.trim(),
        qty: it.qty,
        hargaModal: it.hargaModal || 0,
      })),
    });
    logResponse("createBatchMasuk", { id });
    return { id };
  },
});
