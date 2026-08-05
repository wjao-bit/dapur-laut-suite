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
      id: v.string(),
      nama: v.string(),
      alamat: v.optional(v.string()),
      kontak: v.optional(v.string()),
    }).index("by_bisnis_id", ["id"]),

    // ------------------------------------------------------------------ 4.
    // DPL (Pasar grosir) — IDDPL PRIMARY KEY / UNIQUE
    dpl: defineTable({
      id: v.string(),
      namaPasar: v.string(),
      alamat: v.optional(v.string()),
      kontak: v.optional(v.string()),
    }).index("by_bisnis_id", ["id"]),

    // ------------------------------------------------------------------ 5.
    // Pasar (Victoria/Tunas) — IDPasar PRIMARY KEY / UNIQUE
    pasar: defineTable({
      id: v.string(),
      namaPasar: v.string(),
      alamat: v.optional(v.string()),
      kontak: v.optional(v.string()),
    }).index("by_bisnis_id", ["id"]),

    // ------------------------------------------------------------------ 6.
    // Karyawan — IDKaryawan PRIMARY KEY / UNIQUE
    karyawan: defineTable({
      id: v.string(),
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
    // Invoice (multi-barang) — idInvoice UNIQUE, mataUang default "Rp"
    invoice: defineTable({
      idInvoice: v.string(), // UNIQUE
      tanggal: v.string(),
      tipe: v.union(v.literal("Supplier"), v.literal("Reseller"), v.literal("DPL"), v.literal("Pasar")),
      namaPihak: v.string(),
      tenggat: v.optional(v.string()), // jatuh tempo pembayaran (manual input)
      mataUang: v.union(v.literal("Rp"), v.literal("$")), // default "Rp"; Supplier bisa pilih "$"
      items: v.array(
        v.object({
          kodeBarang: v.string(),
          namaBarang: v.string(),
          hargaModal: v.number(),
          qty: v.number(),
          hargaJual: v.optional(v.number()),
          stokAwal: v.optional(v.number()),
          stokAkhir: v.optional(v.number()),
          subtotal: v.number(),
        }),
      ),
      total: v.number(),
      totalModal: v.number(),
      totalPenjualan: v.number(),
      margin: v.number(),
      statusPembayaran: v.optional(v.string()), // "Lunas" | "Pending" (default Pending)
    })
      .index("by_idInvoice", ["idInvoice"])
      .index("by_tanggal", ["tanggal"])
      .index("by_tipe", ["tipe"]),

    // ------------------------------------------------------------------ 10.
    // Retur Barang
    retur: defineTable({
      id: v.string(), // IDRetur
      tanggal: v.string(),
      tipe: v.union(v.literal("Reseller"), v.literal("DPL"), v.literal("Pasar")),
      namaPihak: v.string(),
      namaBarang: v.string(),
      qty: v.number(),
      keterangan: v.optional(v.string()),
    })
      .index("by_tanggal", ["tanggal"])
      .index("by_namaBarang", ["namaBarang"]),

    // ------------------------------------------------------------------ 11.
    // Kas Harian — id = sumber unik (mis. KAS-INV-xxx) agar tidak duplikasi
    kas: defineTable({
      id: v.string(), // IDKas / refKey unik per transaksi
      tanggal: v.string(),
      kasMasuk: v.number(),
      kasKeluar: v.number(),
      saldoAwal: v.number(),
      saldoAkhir: v.number(),
      keterangan: v.string(),
      sumber: v.string(), // Invoice Supplier / Invoice Reseller / Slip Gaji / Pengeluaran / Manual / Saldo Awal
    })
      .index("by_tanggal", ["tanggal"])
      .index("by_ref_id", ["id"]),

    // ------------------------------------------------------------------ 12.
    // Slip Gaji — bonus kerajinan, bonus bulanan, dan denda
    slipgaji: defineTable({
      id: v.string(), // IDSlip
      idKaryawan: v.string(),
      periode: v.string(), // YYYY-MM
      tanggal: v.string(),
      gajiPokok: v.number(),
      bonusKerajinan: v.number(),
      bonusBulanan: v.number(),
      denda: v.number(),
      hadir: v.number(),
      izin: v.number(),
      sakit: v.number(),
      alpa: v.number(),
      potonganAbsensi: v.number(),
      potonganUtang: v.number(),
      potonganCasbon: v.number(),
      gajiBersih: v.number(),
      // Sisa utang/casbon setelah slip (untuk notifikasi utang tersisa)
      sisaUtang: v.optional(v.number()),
      sisaCasbon: v.optional(v.number()),
    })
      .index("by_idKaryawan", ["idKaryawan"])
      .index("by_periode", ["periode"]),

    // ------------------------------------------------------------------ 13.
    // Gudang & Stok — satu baris per NamaBarang (stok bisa minus)
    gudang: defineTable({
      id: v.string(), // IDGudang
      namaBarang: v.string(), // unique per barang
      stokAwal: v.number(),
      tanggalStokAwal: v.optional(v.string()), // tanggal penetapan stok awal
      keterangan: v.optional(v.string()),
    }).index("by_namaBarang", ["namaBarang"]),

    // Riwayat perubahan stok (asal: Supplier/Reseller/DPL/Pasar/Retur/Manual)
    stokHistory: defineTable({
      id: v.string(),
      tanggal: v.string(),
      namaBarang: v.string(),
      perubahan: v.number(), // +masuk / -keluar
      tipe: v.string(), // asal perubahan
      keterangan: v.optional(v.string()),
    })
      .index("by_namaBarang", ["namaBarang"])
      .index("by_tanggal", ["tanggal"]),

    // ------------------------------------------------------------------ 14.
    // Pengeluaran
    pengeluaran: defineTable({
      id: v.string(), // IDPengeluaran
      tanggal: v.string(),
      jenis: v.string(),
      nominal: v.number(),
      keterangan: v.optional(v.string()),
      idKaryawan: v.optional(v.string()),
    })
      .index("by_tanggal", ["tanggal"])
      .index("by_jenis", ["jenis"]),

    // ------------------------------------------------------------------ 15.
    // Akun Admin — login nomor HP + password, wajib disetujui admin.
    // Role: "Admin Master" (penuh) atau "Admin" (biasa).
    akun: defineTable({
      id: v.string(), // nomor HP (PRIMARY KEY / UNIQUE)
      nama: v.string(),
      password: v.string(), // hash SHA-256
      status: v.union(v.literal("pending"), v.literal("approved"), v.literal("rejected")),
      role: v.optional(v.string()), // "Admin Master" | "Admin"
      createdAt: v.number(),
    }).index("by_bisnis_id", ["id"]),

    // ------------------------------------------------------------------ 16.
    // Sesi login admin
    sessions: defineTable({
      token: v.string(),
      phone: v.string(),
      createdAt: v.number(),
    })
      .index("by_token", ["token"])
      .index("by_phone", ["phone"]),

    // ====================================================================
    // MENU TETESAN — bahan baku, barang jadi, invoice modal/penjualan, stok
    // ====================================================================

    // Master Data Bahan Baku (modal)
    bahanBaku: defineTable({
      kode: v.string(), // unique
      nama: v.string(),
      hargaModal: v.number(),
      stokAwal: v.number(),
      kategori: v.optional(v.string()),
    }).index("by_kode", ["kode"]),

    // Master Data Barang Jadi (penjualan)
    barangJadi: defineTable({
      kode: v.string(), // unique
      nama: v.string(),
      hargaJual: v.number(),
      stokAwal: v.number(),
      kategori: v.optional(v.string()),
    }).index("by_kode", ["kode"]),

    // Invoice Tetesan — tipe Modal / Penjualan (idInvoice UNIQUE)
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
  },
  { schemaValidation: false },
);

export default schema;
