import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { badRequest, findOneByKey, logRequest, logResponse } from "./lib";
import { todayStr, computeInvoicePayment } from "../lib/business";

// ============================================================================
// PEMBAYARAN INVOICE
//
// Aksi pembayaran untuk setiap invoice yang sudah jadi:
//   - bayarInvoice        : invoice biasa (Supplier/Reseller/DPL/Pasar)
//   - bayarInvoiceTetesan : invoice tetesan (Modal/Penjualan)
//
// Setiap pembayaran otomatis:
//   dibayar += nominal (tidak melebihi total)
//   sisa    = max(0, total - dibayar)
//   status  = "Lunas" bila sisa <= 0, selain itu "Pending"
// dan riwayat pembayaran (tanggal, nominal, keterangan) disimpan di
// `riwayatBayar` agar riwayat lengkap (multi-bayar) terlihat di tabel & nota.
// ============================================================================

/** Catat pembayaran invoice biasa (Supplier/Reseller/DPL/Pasar). */
export const bayarInvoice = mutation({
  args: {
    idInvoice: v.string(),
    nominal: v.number(),
    tanggal: v.optional(v.string()),
    keterangan: v.optional(v.string()),
  },
  handler: async (ctx, { idInvoice, nominal, tanggal, keterangan }) => {
    logRequest("bayarInvoice", { idInvoice, nominal, tanggal, keterangan });
    if (!(nominal > 0)) return badRequest("Nominal pembayaran harus lebih dari 0", { nominal });
    const inv = (await findOneByKey(ctx, "invoice", "idInvoice", idInvoice)) as any;
    if (!inv) return badRequest("Invoice tidak ditemukan", { idInvoice });

    // Jumlah yang dibayar: penjualan utk Reseller/DPL/Pasar, pembelian utk Supplier
    const total = inv.totalPenjualan || inv.total || 0;
    const prevDibayar = inv.dibayar ?? 0;
    const { dibayar, sisa, status, tercatat } = computeInvoicePayment(total, prevDibayar, nominal);

    const riwayat = Array.isArray(inv.riwayatBayar) ? [...inv.riwayatBayar] : [];
    riwayat.push({
      tanggal: tanggal || todayStr(),
      nominal: tercatat,
      keterangan: keterangan ?? "",
    });

    await ctx.db.patch(inv._id, { dibayar, sisa, statusPembayaran: status, riwayatBayar: riwayat });
    logResponse("bayarInvoice", { idInvoice, dibayar, sisa, status, total });
    return { idInvoice, dibayar, sisa, status, total };
  },
});

/** Catat pembayaran invoice tetesan (Modal/Penjualan). */
export const bayarInvoiceTetesan = mutation({
  args: {
    idInvoice: v.string(),
    nominal: v.number(),
    tanggal: v.optional(v.string()),
    keterangan: v.optional(v.string()),
  },
  handler: async (ctx, { idInvoice, nominal, tanggal, keterangan }) => {
    logRequest("bayarInvoiceTetesan", { idInvoice, nominal, tanggal, keterangan });
    if (!(nominal > 0)) return badRequest("Nominal pembayaran harus lebih dari 0", { nominal });
    const inv = (await findOneByKey(ctx, "invoiceTetesan", "idInvoice", idInvoice)) as any;
    if (!inv) return badRequest("Invoice tidak ditemukan", { idInvoice });

    const total = inv.total || 0;
    const prevDibayar = inv.dibayar ?? 0;
    const { dibayar, sisa, status, tercatat } = computeInvoicePayment(total, prevDibayar, nominal);

    const riwayat = Array.isArray(inv.riwayatBayar) ? [...inv.riwayatBayar] : [];
    riwayat.push({
      tanggal: tanggal || todayStr(),
      nominal: tercatat,
      keterangan: keterangan ?? "",
    });

    await ctx.db.patch(inv._id, { dibayar, sisa, statusPembayaran: status, riwayatBayar: riwayat });
    logResponse("bayarInvoiceTetesan", { idInvoice, dibayar, sisa, status, total });
    return { idInvoice, dibayar, sisa, status, total };
  },
});
