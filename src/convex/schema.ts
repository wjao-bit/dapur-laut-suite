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

    // ------------------------------------------------------------------
    // Akun (phone-based auth)
    // ------------------------------------------------------------------
    akun: defineTable({
      id: v.string(),
      nama: v.string(),
      password: v.string(),
      status: v.string(),
      role: v.optional(v.string()),
      createdAt: v.number(),
    }).index("by_akun_id", ["id"]),

    // ------------------------------------------------------------------
    // Sesi login custom (phone-based)
    // ------------------------------------------------------------------
    sessions: defineTable({
      token: v.string(),
      phone: v.string(),
      createdAt: v.number(),
    }).index("by_token", ["token"]).index("by_phone", ["phone"]),

    // ------------------------------------------------------------------
    // Aktivitas / Audit Log
    // ------------------------------------------------------------------
    aktivitas: defineTable({
      id: v.string(),
      phone: v.string(),
      nama: v.string(),
      aksi: v.string(),
      detail: v.optional(v.string()),
      createdAt: v.number(),
    }).index("by_createdAt", ["createdAt"]),

    // ------------------------------------------------------------------
    // 1. Barang — KodeBarang PRIMARY KEY / UNIQUE
    // ------------------------------------------------------------------
    barang: defineTable({
      kode: v.string(),
      nama: v.string(),
      harga: v.number(),
      kategori: v.optional(v.string()),
    }).index("by_kode", ["kode"]),

    // ------------------------------------------------------------------
    // 2. Supplier — IDSupplier PRIMARY KEY / UNIQUE
    // ------------------------------------------------------------------
    supplier: defineTable({
      id: v.string(),
      nama: v.string(),
      alamat: v.optional(v.string()),
      kontak: v.optional(v.string()),
    }).index("by_bisnis_id", ["id"]),

    // ------------------------------------------------------------------
    // 3. Reseller — IDReseller PRIMARY KEY / UNIQUE
    // ------------------------------------------------------------------
    reseller: defineTable({
      id: v.string(),
      nama: v.string(),
      alamat: v.optional(v.string()),
      kontak: v.optional(v.string()),
    }).index("by_bisnis_id", ["id"]),

    // ------------------------------------------------------------------
    // 4. DPL (Pasar grosir) — IDDPL PRIMARY KEY / UNIQUE
    // ------------------------------------------------------------------
    dpl: defineTable({
      id: v.string(),
      namaPasar: v.string(),
      alamat: v.optional(v.string()),
      kontak: v.optional(v.string()),
    }).index("by_bisnis_id", ["id"]),

    // ------------------------------------------------------------------
    // 5. Pasar (Victoria/Tunas) — IDPasar PRIMARY KEY / UNIQUE
    // ------------------------------------------------------------------
    pasar: defineTable({
      id: v.string(),
      namaPasar: v.string(),
      alamat: v.optional(v.string()),
      kontak: v.optional(v.string()),
    }).index("by_bisnis_id", ["id"]),

    // ------------------------------------------------------------------
    // 6. Karyawan — IDKaryawan PRIMARY KEY / UNIQUE
    // ------------------------------------------------------------------
    karyawan: defineTable({
      id: v.string(),
      nama: v.string(),
      jabatan: v.optional(v.string()),
      gajiPokok: v.number(),
      utangTotal: v.number(),
    }).index("by_bisnis_id", ["id"]),

    // ------------------------------------------------------------------
    // 7. Absensi Harian
    // ------------------------------------------------------------------
    absensi: defineTable({
      id: v.string(),
      idKaryawan: v.string(),
      tanggal: v.string(),
      status: v.union(v.literal("Hadir"), v.literal("Izin"), v.literal("Sakit"), v.literal("Alpa")),
      jamMasuk: v.optional(v.string()),
      jamKeluar: v.optional(v.string()),
    })
      .index("by_idKaryawan", ["idKaryawan"])
      .index("by_tanggal", ["tanggal"])
      .index("by_karyawan_tanggal", ["idKaryawan", "tanggal"]),

    // ------------------------------------------------------------------
    // 8. Utang Karyawan
    // ------------------------------------------------------------------
    utang: defineTable({
      id: v.string(),
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

    // ------------------------------------------------------------------
    // 9. Invoice (multi-barang)
    // ------------------------------------------------------------------
    invoice: defineTable({
      idInvoice: v.string(),
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
          stokAwal: v.optional(v.number()),
          stokAkhir: v.optional(v.number()),
        }),
      ),
      total: v.number(),
      totalModal: v.number(),
      totalPenjualan: v.number(),
      margin: v.number(),
      mataUang: v.union(v.literal("Rp"), v.literal("$")),
      statusPembayaran: v.optional(v.string()),
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
      deletedAt: v.optional(v.string()),
    })
      .index("by_idInvoice", ["idInvoice"])
      .index("by_tanggal", ["tanggal"])
      .index("by_tipe", ["tipe"])
      .index("by_namaPihak", ["namaPihak"]),

    // ------------------------------------------------------------------
    // 10. Retur Barang
    // ------------------------------------------------------------------
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

    // ------------------------------------------------------------------
    // 11. Kas Harian
    // ------------------------------------------------------------------
    kas: defineTable({
      id: v.string(),
      tanggal: v.string(),
      kasMasuk: v.number(),
      kasKeluar: v.number(),
      saldoAwal: v.number(),
      saldoAkhir: v.number(),
      keterangan: v.optional(v.string()),
      sumber: v.optional(v.string()),
    }).index("by_tanggal", ["tanggal"]),

    // ------------------------------------------------------------------
    // 12. Pengeluaran
    // ------------------------------------------------------------------
    pengeluaran: defineTable({
      id: v.string(),
      tanggal: v.string(),
      jenis: v.string(),
      nominal: v.number(),
      keterangan: v.optional(v.string()),
      idKaryawan: v.optional(v.string()),
    }).index("by_tanggal", ["tanggal"]),

    // ------------------------------------------------------------------
    // 13. Gudang & Stok
    // ------------------------------------------------------------------
    gudang: defineTable({
      id: v.string(),
      namaBarang: v.string(),
      stokAwal: v.number(),
      stokMin: v.optional(v.number()),
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

    // ------------------------------------------------------------------
    // 14. Slip Gaji
    // ------------------------------------------------------------------
    slipgaji: defineTable({
      id: v.string(),
      idKaryawan: v.string(),
      bulan: v.optional(v.string()),
      periode: v.optional(v.string()),
      gajiPokok: v.number(),
      bonus: v.optional(v.number()),
      bonusKerajinan: v.optional(v.number()),
      bonusBulanan: v.optional(v.number()),
      denda: v.optional(v.number()),
      potonganAbsensi: v.number(),
      potonganUtang: v.number(),
      potonganCasbon: v.optional(v.number()),
      totalBersih: v.optional(v.number()),
      gajiBersih: v.optional(v.number()),
      status: v.optional(v.string()),
      tanggal: v.string(),
      hadir: v.optional(v.number()),
      izin: v.optional(v.number()),
      sakit: v.optional(v.number()),
      alpa: v.optional(v.number()),
    })
      .index("by_idKaryawan", ["idKaryawan"])
      .index("by_bulan", ["bulan"]),

    // ------------------------------------------------------------------
    // 15. Katalog Harga per Pihak
    // ------------------------------------------------------------------
    katalog: defineTable({
      id: v.optional(v.string()),
      tipe: v.string(),
      namaPihak: v.string(),
      items: v.array(
        v.object({
          kodeBarang: v.string(),
          namaBarang: v.string(),
          harga: v.number(),
          kategori: v.optional(v.string()),
          satuan: v.optional(v.string()),
          deskripsi: v.optional(v.string()),
        }),
      ),
      updatedAt: v.optional(v.number()),
    })
      .index("by_tipe_namaPihak", ["tipe", "namaPihak"])
      .index("by_namaPihak", ["namaPihak"]),

    // ------------------------------------------------------------------
    // 16. Monitoring / Audit Log
    // ------------------------------------------------------------------
    monitor: defineTable({
      aksi: v.string(),
      oleh: v.optional(v.string()),
      detail: v.optional(v.string()),
      tanggal: v.string(),
    }).index("by_tanggal", ["tanggal"]),

    // ------------------------------------------------------------------
    // 17. Tetesan (drip/wholesale)
    // ------------------------------------------------------------------
    invoiceTetesan: defineTable({
      idInvoice: v.string(),
      tanggal: v.string(),
      tipe: v.union(v.literal("Modal"), v.literal("Penjualan")),
      namaPihak: v.string(),
      mataUang: v.union(v.literal("Rp"), v.literal("$")),
      items: v.array(
        v.object({
          kodeBarang: v.string(),
          namaBarang: v.string(),
          harga: v.number(),
          qty: v.number(),
          subtotal: v.number(),
        }),
      ),
      total: v.number(),
      statusPembayaran: v.optional(v.string()),
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

    tetesanStok: defineTable({
      id: v.string(),
      namaBarang: v.string(),
      tipe: v.union(v.literal("Baku"), v.literal("Jadi")),
      stokAwal: v.number(),
      tanggalStokAwal: v.optional(v.string()),
      keterangan: v.optional(v.string()),
    }).index("by_namaBarang", ["namaBarang"]),

    tetesanStokHistory: defineTable({
      id: v.string(),
      tanggal: v.string(),
      namaBarang: v.string(),
      perubahan: v.number(),
      tipe: v.string(),
      keterangan: v.optional(v.string()),
    })
      .index("by_namaBarang", ["namaBarang"])
      .index("by_tanggal", ["tanggal"]),

    // ------------------------------------------------------------------
    // Master Bahan Baku (Tetesan)
    // ------------------------------------------------------------------
    bahanBaku: defineTable({
      kode: v.string(),
      nama: v.string(),
      hargaModal: v.number(),
      stokAwal: v.number(),
      kategori: v.optional(v.string()),
    }).index("by_kode", ["kode"]),

    // ------------------------------------------------------------------
    // Master Barang Jadi (Tetesan)
    // ------------------------------------------------------------------
    barangJadi: defineTable({
      kode: v.string(),
      nama: v.string(),
      hargaJual: v.number(),
      stokAwal: v.number(),
      kategori: v.optional(v.string()),
    }).index("by_kode", ["kode"]),

    // ------------------------------------------------------------------
    // Audit Log (detail aktivitas pengguna)
    // ------------------------------------------------------------------
    auditLog: defineTable({
      aksi: v.string(),
      oleh: v.string(),
      target: v.string(),
      detail: v.optional(v.string()),
      timestamp: v.number(),
    })
      .index("by_timestamp", ["timestamp"])
      .index("by_aksi", ["aksi"]),

    // ------------------------------------------------------------------
    // Push Subscriptions (web push notification)
    // ------------------------------------------------------------------
    pushSubscription: defineTable({
      endpoint: v.string(),
      keys: v.object({
        p256dh: v.string(),
        auth: v.string(),
      }),
      createdAt: v.number(),
    }).index("by_endpoint", ["endpoint"]),

    // ------------------------------------------------------------------
    // App Settings (key-value store)
    // ------------------------------------------------------------------
    appSettings: defineTable({
      key: v.string(),
      value: v.string(),
    }).index("by_key", ["key"]),

    // ------------------------------------------------------------------
    // Piutang (legacy — diakses oleh dashboard)
    // ------------------------------------------------------------------
    piutang: defineTable({
      id: v.string(),
      idInvoice: v.optional(v.string()),
      namaPihak: v.string(),
      tipe: v.optional(v.string()),
      nominal: v.number(),
      dibayar: v.optional(v.number()),
      sisa: v.optional(v.number()),
      tanggal: v.string(),
      tenggat: v.optional(v.string()),
      status: v.optional(v.string()),
      keterangan: v.optional(v.string()),
    })
      .index("by_tanggal", ["tanggal"])
      .index("by_namaPihak", ["namaPihak"]),
  },
  { schemaValidation: false },
);

export default schema;


