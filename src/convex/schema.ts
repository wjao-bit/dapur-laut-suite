import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// ============================================================================
// Database PT Dapur Laut
//
// Semua kolom ID bisnis (KodeBarang, IDSupplier, ...) diberi index unik dan
// di-upsert lewat helper `upsertByKey` di convex/lib.ts sehingga perilakunya
// setara dengan PRIMARY KEY + ON CONFLICT DO UPDATE (tanpa error duplikat).
//
// CATATAN: nama index "by_id" TIDAK BOLEH dipakai (reserved oleh Convex),
// jadi index ID bisnis memakai "by_bisnis_id" / "by_ref_id".
// ============================================================================

export const INVOICE_TIPES = ["Supplier", "Reseller", "DPL", "Pasar"] as const;
export const ABSENSI_STATUSES = ["Hadir", "Izin", "Sakit", "Alpa"] as const;
export const UTANG_STATUSES = ["Belum", "Lunas", "Parsial"] as const;
export const UTANG_JENISES = ["Utang", "Casbon"] as const;
export const PENGELUARAN_JENISES = [
  "Operasional",
  "Gaji",
  "Utang Karyawan",
  "Transportasi",
  "Listrik & Air",
  "Pembelian Perlengkapan",
  "Lainnya",
] as const;

export const MATA_UANG = ["Rp", "$"] as const;
export const TETESAN_TIPES = ["Modal", "Penjualan"] as const;
export const TETESAN_TIPE_BARANG = ["Baku", "Jadi"] as const;
export const INVOICE_STATUS_PEMBAYARAN = ["Lunas", "Pending"] as const;

const schema = defineSchema(
  {
    ...authTables, // jangan dihapus

    users: defineTable({
      name: v.optional(v.string()),
      image: v.optional(v.string()),
      email: v.optional(v.string()),
      emailVerificationTime: v.optional(v.number()),
      isAnonymous: v.optional(v.boolean()),
      role: v.optional(v.string()),
    }).index("email", ["email"]),

    // ------------------------------------------------------------------ 1.
    // Barang — KodeBarang PRIMARY KEY / UNIQUE
    barang: defineTable({
      kode: v.string(), // KodeBarang (unique)
      nama: v.string(), // NamaBarang
      harga: v.number(), // Harga
      kategori: v.optional(v.string()),
    }).index("by_kode", ["kode"]),

    // ------------------------------------------------------------------ 2.
    // Supplier — IDSupplier PRIMARY KEY / UNIQUE
    supplier: defineTable({
      id: v.string(), // IDSupplier (unique)
      nama: v.string(),
      alamat: v.optional(v.string()),
      kontak: v.optional(v.string()),
    }).index("by_bisnis_id", ["id"]),

    // ------------------------------------------------------------------ 3.
    // Reseller — IDReseller PRIMARY KEY / UNIQUE
    reseller: defineTable({
      id: v.string(), // IDReseller (unique)
      nama: v.string(),
      alamat: v.optional(v.string()),
      kontak: v.optional(v.string()),
    }).index("by_bisnis_id", ["id"]),

    // ------------------------------------------------------------------ 4.
    // DPL (Pasar grosir) — IDDPL PRIMARY KEY / UNIQUE
    dpl: defineTable({
      id: v.string(), // IDDPL (unique)
      namaPasar: v.string(),
      alamat: v.optional(v.string()),
      kontak: v.optional(v.string()),
    }).index("by_bisnis_id", ["id"]),

    // ------------------------------------------------------------------ 5.
    // Pasar (Victoria/Tunas) — IDPasar PRIMARY KEY / UNIQUE
    pasar: defineTable({
      id: v.string(), // IDPasar (unique)
      namaPasar: v.string(),
      alamat: v.optional(v.string()),
      kontak: v.optional(v.string()),
    }).index("by_bisnis_id", ["id"]),

    // ------------------------------------------------------------------ 6.
    // Karyawan — IDKaryawan PRIMARY KEY / UNIQUE
    karyawan: defineTable({
      id: v.string(), // IDKaryawan (unique)
      nama: v.string(),
      jabatan: v.optional(v.string()),
      gajiPokok: v.number(),
      utangTotal: v.number(),
    }).index("by_bisnis_id", ["id"]),

    // ------------------------------------------------------------------ 7.
    // Absensi Harian
    absensi: defineTable({
      id: v.string(), // IDAbsensi
      idKaryawan: v.string(),
      tanggal: v.string(), // YYYY-MM-DD
      status: v.union(v.literal("Hadir"), v.literal("Izin"), v.literal("Sakit"), v.literal("Alpa")),
      jamMasuk: v.optional(v.string()),
      jamKeluar: v.optional(v.string()),
    })
      .index("by_idKaryawan", ["idKaryawan"])
      .index("by_tanggal", ["tanggal"])
      .index("by_karyawan_tanggal", ["idKaryawan", "tanggal"]),

    // ------------------------------------------------------------------ 8.
    // Utang Karyawan
    utang: defineTable({
      id: v.string(), // IDUtang
      idKaryawan: v.string(),
      tanggal: v.string(),
      nominal: v.number(),
      status: v.union(v.literal("Belum"), v.literal("Lunas"), v.literal("Parsial")),
      dibayar: v.number(),
      tglBayar: v.optional(v.string()),
      sisaUtang: v.number(),
      keterangan: v.optional(v.string()),
      jenis: v.union(v.literal("Utang"), v.literal("Casbon")),
    })
      .index("by_idKaryawan", ["idKaryawan"])
      .index("by_tanggal", ["tanggal"]),

    // ------------------------------------------------------------------ 9.
    // Invoice (multi-barang)
    invoice: defineTable({
      idInvoice: v.string(), // UNIQUE
      tanggal: v.string(),
      tipe: v.union(v.literal("Supplier"), v.literal("Reseller"), v.literal("DPL"), v.literal("Pasar")),
      namaPihak: v.string(),
      items: v.array(
        v.object({
          kodeBarang: v.string(),
          namaBarang: v.string(),
          hargaModal: v.number(),
          hargaJual: v.optional(v.number()),
          qty: v.number(),
          subtotal: v.number(),
        }),
      ),
      total: v.number(),
      totalModal: v.number(),
      totalPenjualan: v.number(),
      margin: v.number(),
      mataUang: v.union(v.literal("Rp"), v.literal("$")),
      statusPembayaran: v.optional(v.string()), // "Lunas" | "Pending"
      dibayar: v.optional(v.number()),
      sisa: v.optional(v.number()),
      tenggat: v.optional(v.string()),
      riwayatBayar: v.optional(
        v.array(
          v.object({
            tanggal: v.string(),
            nominal: v.number(),
            keterangan: v.optional(v.string()),
          }),
        ),
      ),
      deletedAt: v.optional(v.string()), // soft-delete (recycle bin)
    })
      .index("by_idInvoice", ["idInvoice"])
      .index("by_tanggal", ["tanggal"])
      .index("by_tipe", ["tipe"])
      .index("by_namaPihak", ["namaPihak"]),

    // ------------------------------------------------------------------ 10.
    // Retur Barang
    retur: defineTable({
      id: v.string(),
      tanggal: v.string(),
      tipe: v.string(),
      namaPihak: v.string(),
      namaBarang: v.string(),
      qty: v.number(),
      keterangan: v.optional(v.string()),
    })
      .index("by_tanggal", ["tanggal"])
      .index("by_tipe", ["tipe"]),

    // ------------------------------------------------------------------ 11.
    // Kas Harian
    kas: defineTable({
      id: v.string(),
      tanggal: v.string(),
      kasMasuk: v.number(),
      kasKeluar: v.number(),
      saldoAwal: v.number(),
      saldoAkhir: v.number(),
      keterangan: v.optional(v.string()),
    }).index("by_tanggal", ["tanggal"]),

    // ------------------------------------------------------------------ 12.
    // Pengeluaran
    pengeluaran: defineTable({
      id: v.string(),
      tanggal: v.string(),
      jenis: v.string(),
      nominal: v.number(),
      keterangan: v.optional(v.string()),
    }).index("by_tanggal", ["tanggal"]),

    // ------------------------------------------------------------------ 13.
    // Gudang & Stok
    gudang: defineTable({
      id: v.string(),
      namaBarang: v.string(),
      stokAwal: v.number(),
      stokMin: v.optional(v.number()), // batas minimum stok
      keterangan: v.optional(v.string()),
    }).index("by_namaBarang", ["namaBarang"]),

    stokHistory: defineTable({
      id: v.string(),
      tanggal: v.string(),
      namaBarang: v.string(),
      perubahan: v.number(),
      tipe: v.string(),
      keterangan: v.optional(v.string()),
    })
      .index("by_namaBarang", ["namaBarang"])
      .index("by_tanggal", ["tanggal"]),

    // ------------------------------------------------------------------ 14.
    // Slip Gaji
    slipgaji: defineTable({
      id: v.string(),
      idKaryawan: v.string(),
      bulan: v.string(),
      gajiPokok: v.number(),
      bonus: v.number(),
      potonganAbsensi: v.number(),
      potonganUtang: v.number(),
      totalBersih: v.number(),
      status: v.string(),
      tanggal: v.string(),
    })
      .index("by_idKaryawan", ["idKaryawan"])
      .index("by_bulan", ["bulan"]),

    // ------------------------------------------------------------------ 15.
    // Katalog Harga per Pihak (Supplier / Reseller / DPL / Pasar)
    katalog: defineTable({
      tipe: v.string(), // Supplier | Reseller | DPL | Pasar
      namaPihak: v.string(),
      items: v.array(
        v.object({
          kodeBarang: v.string(),
          namaBarang: v.string(),
          harga: v.number(),
        }),
      ),
    })
      .index("by_tipe_namaPihak", ["tipe", "namaPihak"])
      .index("by_namaPihak", ["namaPihak"]),

    // ------------------------------------------------------------------ 16.
    // Monitoring / Audit Log
    monitor: defineTable({
      aksi: v.string(),
     oleh: v.optional(v.string()),
      detail: v.optional(v.string()),
      tanggal: v.string(),
    }).index("by_tanggal", ["tanggal"]),

    // ------------------------------------------------------------------ 17.
    // Tetesan (drip/wholesale)
    invoiceTetesan: defineTable({
      idInvoice: v.string(), // UNIQUE
      tanggal: v.string(),
      tipe: v.union(v.literal("Modal"), v.literal("Penjualan")),
      namaPihak: v.string(),
      mataUang: v.union(v.literal("Rp"), v.literal("$")),
      items: v.array(
        v.object({
          kodeBarang: v.string(),
          namaBarang: v.string(),
          harga: v.number(), // harga modal (Modal) / harga jual (Penjualan)
          qty: v.number(),
          subtotal: v.number(),
        }),
      ),
      total: v.number(),
      statusPembayaran: v.optional(v.string()), // "Lunas" | "Pending"
      dibayar: v.optional(v.number()),
      sisa: v.optional(v.number()),
      riwayatBayar: v.optional(
        v.array(
          v.object({
            tanggal: v.string(),
            nominal: v.number(),
            keterangan: v.optional(v.string()),
          }),
        ),
      ),
    })
      .index("by_idInvoice", ["idInvoice"])
      .index("by_tanggal", ["tanggal"])
      .index("by_tipe", ["tipe"]),

    // Stok Tetesan — satu baris per nama barang (tipe: Baku | Jadi)
    tetesanStok: defineTable({
      id: v.string(), // IDTetesanStok
      namaBarang: v.string(), // unique per barang
      tipe: v.union(v.literal("Baku"), v.literal("Jadi")),
      stokAwal: v.number(),
      tanggalStokAwal: v.optional(v.string()),
      keterangan: v.optional(v.string()),
    }).index("by_namaBarang", ["namaBarang"]),

    // Riwayat perubahan stok tetesan (asal: Invoice Modal / Invoice Penjualan / Stok Awal / Manual)
    tetesanStokHistory: defineTable({
      id: v.string(),
      tanggal: v.string(),
      namaBarang: v.string(),
      perubahan: v.number(), // +masuk / -keluar
      tipe: v.string(), // asal perubahan
      keterangan: v.optional(v.string()),
    })
      .index("by_namaBarang", ["namaBarang"])
      .index("by_tanggal", ["tanggal"]),

    // ------------------------------------------------------------------ 18.
    // Audit Log (Riwayat Aktivitas)
    auditLog: defineTable({
      aksi: v.string(), // "create_invoice", "edit_invoice", "delete_invoice", dsb
      oleh: v.string(), // nama/phone user
      target: v.string(), // mis. "INV055", "BRG001"
      detail: v.optional(v.string()), // ringkasan singkat
      timestamp: v.number(), // Date.now()
    })
      .index("by_timestamp", ["timestamp"])
      .index("by_aksi", ["aksi"]),
  },
  { schemaValidation: false },
);

export default schema;
