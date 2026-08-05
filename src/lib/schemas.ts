// ============================================================================
// Zod validation schemas shared between Convex backend & frontend.
// All payloads are validated here so that invalid requests get a clear
// {"error": "Payload tidak sesuai schema"} response.
// ============================================================================

import { z } from "zod";
import {
  ABSENSI_STATUSES,
  INVOICE_TIPES,
  PENGELUARAN_JENISES,
  UTANG_JENISES,
  UTANG_STATUSES,
} from "./business";

// ---------------------------------------------------------------------------
// Master data
// ---------------------------------------------------------------------------

const idSchema = z.string().min(1, "ID wajib diisi");
const tanggalSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Tanggal harus format YYYY-MM-DD");

export const barangSchema = z.object({
  kode: idSchema,
  nama: z.string().min(1, "Nama barang wajib diisi"),
  harga: z.number().min(0, "Harga tidak boleh negatif"),
  kategori: z.string().optional().default(""),
});

export const supplierSchema = z.object({
  id: idSchema,
  nama: z.string().min(1, "Nama supplier wajib diisi"),
  alamat: z.string().optional().default(""),
  kontak: z.string().optional().default(""),
});

export const resellerSchema = z.object({
  id: idSchema,
  nama: z.string().min(1, "Nama reseller wajib diisi"),
  alamat: z.string().optional().default(""),
  kontak: z.string().optional().default(""),
});

export const dplSchema = z.object({
  id: idSchema,
  namaPasar: z.string().min(1, "Nama pasar wajib diisi"),
  alamat: z.string().optional().default(""),
  kontak: z.string().optional().default(""),
});

export const pasarSchema = z.object({
  id: idSchema,
  namaPasar: z.string().min(1, "Nama pasar (Victoria/Tunas) wajib diisi"),
  alamat: z.string().optional().default(""),
  kontak: z.string().optional().default(""),
});

export const karyawanSchema = z.object({
  id: idSchema,
  nama: z.string().min(1, "Nama karyawan wajib diisi"),
  jabatan: z.string().optional().default(""),
  gajiPokok: z.number().min(0).default(0),
  utangTotal: z.number().min(0).default(0),
});

// ---------------------------------------------------------------------------
// Absensi & Utang
// ---------------------------------------------------------------------------

export const absensiSchema = z.object({
  id: idSchema,
  idKaryawan: idSchema,
  tanggal: tanggalSchema,
  status: z.enum(ABSENSI_STATUSES as [string, ...string[]]),
  jamMasuk: z.string().optional().default(""),
  jamKeluar: z.string().optional().default(""),
});

export const utangSchema = z.object({
  id: idSchema,
  idKaryawan: idSchema,
  tanggal: tanggalSchema,
  nominal: z.number().min(0),
  status: z.enum(UTANG_STATUSES as [string, ...string[]]).default("Belum"),
  dibayar: z.number().min(0).default(0),
  tglBayar: z.string().optional().default(""),
  sisaUtang: z.number().min(0).default(0),
  keterangan: z.string().optional().default(""),
  jenis: z.enum(UTANG_JENISES as [string, ...string[]]).default("Utang"),
});

// ---------------------------------------------------------------------------
// Invoice (multi-barang)
// ---------------------------------------------------------------------------

export const invoiceItemSchema = z.object({
  kodeBarang: z.string().min(1, "Kode barang wajib diisi"),
  namaBarang: z.string().min(1, "Nama barang wajib diisi"),
  hargaModal: z.number().min(0),
  qty: z.number().min(0),
  hargaJual: z.number().min(0).optional(),
  stokAwal: z.number().min(0).optional(),
  stokAkhir: z.number().min(0).optional(),
  subtotal: z.number().min(0),
});

export const invoiceSchema = z
  .object({
    idInvoice: idSchema,
    tanggal: tanggalSchema,
    tipe: z.enum(INVOICE_TIPES as [string, ...string[]]),
    namaPihak: z.string().min(1, "Nama pihak wajib diisi"),
    tenggat: tanggalSchema.optional().default(""),
    // Mata uang: default Rupiah (Rp); khusus Supplier bisa pilih Dolar ($)
    mataUang: z.enum(["Rp", "$"]).default("Rp"),
    // Status pembayaran: default Pending; bisa diubah jadi Lunas setelah invoice jadi
    statusPembayaran: z.enum(["Lunas", "Pending"]).optional().default("Pending"),
    items: z.array(invoiceItemSchema).min(1, "Invoice minimal berisi 1 barang"),
  })
  .superRefine((data, ctx) => {
    if (data.tipe === "Pasar") {
      for (let i = 0; i < data.items.length; i++) {
        const it = data.items[i];
        if ((it.stokAwal ?? 0) <= 0) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["items", i, "stokAwal"],
            message: "Stok awal untuk pasar harus lebih dari 0",
          });
        }
        if ((it.stokAkhir ?? 0) > (it.stokAwal ?? 0)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["items", i, "stokAkhir"],
            message: "Stok akhir tidak boleh melebihi stok awal",
          });
        }
      }
    } else {
      for (let i = 0; i < data.items.length; i++) {
        const it = data.items[i];
        if (it.qty <= 0) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["items", i, "qty"],
            message: "Qty harus lebih dari 0",
          });
        }
      }
    }
  });

// ---------------------------------------------------------------------------
// Retur, Kas, Pengeluaran, Gudang
// ---------------------------------------------------------------------------

export const returSchema = z.object({
  id: idSchema,
  tanggal: tanggalSchema,
  tipe: z.enum(INVOICE_TIPES as [string, ...string[]]).refine((t) => t !== "Supplier", {
    message: "Tipe retur harus Reseller/DPL/Pasar",
  }),
  namaPihak: z.string().min(1, "Nama pihak wajib diisi"),
  namaBarang: z.string().min(1, "Nama barang wajib diisi"),
  qty: z.number().min(1, "Qty retur minimal 1"),
  keterangan: z.string().optional().default(""),
});

export const kasSchema = z.object({
  id: idSchema,
  tanggal: tanggalSchema,
  kasMasuk: z.number().min(0).default(0),
  kasKeluar: z.number().min(0).default(0),
  keterangan: z.string().optional().default(""),
});

export const pengeluaranSchema = z.object({
  id: idSchema,
  tanggal: tanggalSchema,
  jenis: z.enum(PENGELUARAN_JENISES),
  nominal: z.number().min(0, "Nominal tidak boleh negatif"),
  keterangan: z.string().optional().default(""),
  idKaryawan: z.string().optional().default(""),
});

export const gudangSchema = z.object({
  id: idSchema,
  namaBarang: z.string().min(1, "Nama barang wajib diisi"),
  stokAwal: z.number().min(0).default(0),
  tanggalStokAwal: tanggalSchema.optional().default(""),
  keterangan: z.string().optional().default(""),
});

export const stokHistorySchema = z.object({
  id: idSchema,
  tanggal: tanggalSchema,
  namaBarang: z.string().min(1),
  perubahan: z.number(),
  tipe: z.string(),
  keterangan: z.string().optional().default(""),
});

export const slipGajiSchema = z.object({
  id: idSchema,
  idKaryawan: idSchema,
  periode: z.string().regex(/^\d{4}-\d{2}$/, "Periode harus format YYYY-MM"),
  bonusKerajinan: z.number().min(0).default(0),
  bonusBulanan: z.number().min(0).default(0),
  denda: z.number().min(0).default(0),
  keterangan: z.string().optional().default(""),
});

// ---------------------------------------------------------------------------
// TETESAN — bahan baku, barang jadi, stok, invoice modal & penjualan
// ---------------------------------------------------------------------------

export const bahanBakuSchema = z.object({
  kode: idSchema,
  nama: z.string().min(1, "Nama bahan baku wajib diisi"),
  hargaModal: z.number().min(0, "Harga modal tidak boleh negatif"),
  stokAwal: z.number().min(0).default(0),
  kategori: z.string().optional().default(""),
});

export const barangJadiSchema = z.object({
  kode: idSchema,
  nama: z.string().min(1, "Nama barang jadi wajib diisi"),
  hargaJual: z.number().min(0, "Harga jual tidak boleh negatif"),
  stokAwal: z.number().min(0).default(0),
  kategori: z.string().optional().default(""),
});

export const tetesanStokSchema = z.object({
  id: idSchema,
  namaBarang: z.string().min(1, "Nama barang wajib diisi"),
  tipe: z.enum(["Baku", "Jadi"]),
  stokAwal: z.number().min(0).default(0),
  tanggalStokAwal: tanggalSchema.optional().default(""),
  keterangan: z.string().optional().default(""),
});

export const tetesanItemSchema = z.object({
  kodeBarang: z.string().min(1, "Kode barang wajib diisi"),
  namaBarang: z.string().min(1, "Nama barang wajib diisi"),
  harga: z.number().min(0, "Harga wajib diisi (0 atau lebih)"),
  qty: z.number().min(1, "Qty wajib diisi minimal 1"),
  subtotal: z.number().min(0),
});

export const invoiceTetesanSchema = z.object({
  idInvoice: idSchema,
  tanggal: tanggalSchema,
  tipe: z.enum(["Modal", "Penjualan"]),
  namaPihak: z.string().min(1, "Nama pihak wajib diisi"),
  mataUang: z.enum(["Rp", "$"]).default("Rp"),
  items: z.array(tetesanItemSchema).min(1, "Invoice minimal berisi 1 barang"),
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Ringkas error zod menjadi pesan pertama yang mudah dibaca. */
export function zodErrorMessages(result: z.ZodError): string[] {
  return result.issues.map((i) => `${i.path.join(".")}: ${i.message}`);
}

/** Validasi payload; return { success, data?, errors? }. */
export function validate<T>(schema: z.ZodSchema<T>, data: unknown) {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true as const, data: result.data };
  }
  return {
    success: false as const,
    errors: zodErrorMessages(result.error),
  };
}

export type Barang = z.infer<typeof barangSchema>;
export type Supplier = z.infer<typeof supplierSchema>;
export type Reseller = z.infer<typeof resellerSchema>;
export type Dpl = z.infer<typeof dplSchema>;
export type Pasar = z.infer<typeof pasarSchema>;
export type Karyawan = z.infer<typeof karyawanSchema>;
export type Absensi = z.infer<typeof absensiSchema>;
export type Utang = z.infer<typeof utangSchema>;
export type InvoiceItemPayload = z.infer<typeof invoiceItemSchema>;
export type InvoicePayload = z.infer<typeof invoiceSchema>;
export type Retur = z.infer<typeof returSchema>;
export type Kas = z.infer<typeof kasSchema>;
export type Pengeluaran = z.infer<typeof pengeluaranSchema>;
export type Gudang = z.infer<typeof gudangSchema>;
export type SlipGajiPayload = z.infer<typeof slipGajiSchema>;
export type BahanBaku = z.infer<typeof bahanBakuSchema>;
export type BarangJadi = z.infer<typeof barangJadiSchema>;
export type TetesanStok = z.infer<typeof tetesanStokSchema>;
export type TetesanItemPayload = z.infer<typeof tetesanItemSchema>;
export type InvoiceTetesanPayload = z.infer<typeof invoiceTetesanSchema>;
