import { mutation } from "./_generated/server";
import { upsertByKey, recordKas, addStokHistory, ensureGudangRow } from "./lib";
import { todayStr } from "./_shared/business";

// ============================================================================
// Seed data demo PT Dapur Laut (idempotent — hanya berjalan jika kosong)
// ============================================================================

export const seedDemo = mutation({
  args: {},
  handler: async (ctx) => {
    const count = await ctx.db.query("barang").collect();
    if (count.length > 0) {
      return { seeded: false, reason: "Data sudah ada" };
    }
    const t = todayStr();

    // --- Barang ---
    const barang = [
      { kode: "BRG001", nama: "Kopi Bubuk", harga: 28000, kategori: "Bahan Pokok" },
      { kode: "BRG002", nama: "Teh Hijau", harga: 18000, kategori: "Bahan Pokok" },
      { kode: "BRG003", nama: "Ikan Tuna Segar", harga: 65000, kategori: "Ikan" },
      { kode: "BRG004", nama: "Udang Vannamei", harga: 85000, kategori: "Seafood" },
      { kode: "BRG005", nama: "Cumi-Cumi", harga: 72000, kategori: "Seafood" },
      { kode: "BRG006", nama: "Rumput Laut Kering", harga: 45000, kategori: "Olahan" },
    ];
    for (const b of barang) {
      await upsertByKey(ctx, "barang", "kode", b.kode, { nama: b.nama, harga: b.harga, kategori: b.kategori });
      await ensureGudangRow(ctx, b.nama);
    }

    // --- Supplier / Reseller / DPL / Pasar ---
    await upsertByKey(ctx, "supplier", "id", "SUP001", { nama: "CV Samudra Jaya", alamat: "Jl. Pelabuhan No. 12, Surabaya", kontak: "0812-3456-7890" });
    await upsertByKey(ctx, "supplier", "id", "SUP002", { nama: "PT Lautan Indonesia", alamat: "Jl. Raya Muncar No. 8, Banyuwangi", kontak: "0813-2222-1111" });
    await upsertByKey(ctx, "supplier", "id", "SUP003", { nama: "UD Mina Bahari", alamat: "Jl. Muara Baru No. 3, Jakarta", kontak: "0856-9876-5432" });

    await upsertByKey(ctx, "reseller", "id", "RSL001", { nama: "Reseller A", alamat: "Jl. Merdeka No. 1, Bandung", kontak: "0812-1111-2222" });
    await upsertByKey(ctx, "reseller", "id", "RSL002", { nama: "Reseller B", alamat: "Jl. Sudirman No. 21, Jakarta", kontak: "0813-3333-4444" });
    await upsertByKey(ctx, "reseller", "id", "RSL003", { nama: "Reseller C", alamat: "Jl. Malioboro No. 5, Yogyakarta", kontak: "0857-5555-6666" });

    await upsertByKey(ctx, "dpl", "id", "DPL001", { namaPasar: "Pasar Induk Kramat Jati", alamat: "Jakarta Timur", kontak: "021-8088-1000" });
    await upsertByKey(ctx, "dpl", "id", "DPL002", { namaPasar: "Pasar Induk Gedebage", alamat: "Bandung", kontak: "022-7800-2000" });

    await upsertByKey(ctx, "pasar", "id", "PAS001", { namaPasar: "Victoria", alamat: "Pasar Victoria, Jakarta", kontak: "021-5555-0001" });
    await upsertByKey(ctx, "pasar", "id", "PAS002", { namaPasar: "Tunas", alamat: "Pasar Tunas, Tangerang", kontak: "021-5555-0002" });

    // --- Karyawan ---
    const karyawan = [
      { id: "KRY001", nama: "Andi Wijaya", jabatan: "Kepala Gudang", gajiPokok: 4500000, utangTotal: 0 },
      { id: "KRY002", nama: "Budi Santoso", jabatan: "Admin Keuangan", gajiPokok: 4000000, utangTotal: 0 },
      { id: "KRY003", nama: "Citra Lestari", jabatan: "Sales", gajiPokok: 3800000, utangTotal: 0 },
      { id: "KRY004", nama: "Dedi Kurniawan", jabatan: "Kurir", gajiPokok: 3200000, utangTotal: 0 },
    ];
    for (const k of karyawan) {
      await upsertByKey(ctx, "karyawan", "id", k.id, {
        nama: k.nama,
        jabatan: k.jabatan,
        gajiPokok: k.gajiPokok,
        utangTotal: 0,
      });
    }

    // --- Absensi (7 hari terakhir) ---
    for (let day = 6; day >= 0; day--) {
      const d = new Date();
      d.setDate(d.getDate() - day);
      const ds = `${d.getFullYear()}-${`${d.getMonth() + 1}`.padStart(2, "0")}-${`${d.getDate()}`.padStart(2, "0")}`;
      for (const k of karyawan) {
        const status = day === 0 ? "Hadir" : day % 3 === 0 ? "Alpa" : "Hadir";
        await ctx.db.insert("absensi", {
          id: `ABS-${ds}-${k.id}`,
          idKaryawan: k.id,
          tanggal: ds,
          status,
          jamMasuk: status === "Hadir" ? "08:00" : "",
          jamKeluar: status === "Hadir" ? "17:00" : "",
        });
      }
    }

    // --- Utang & Casbon ---
    await upsertByKey(ctx, "utang", "id", "UTG001", {
      idKaryawan: "KRY004",
      tanggal: t,
      nominal: 500000,
      status: "Belum",
      dibayar: 0,
      tglBayar: "",
      sisaUtang: 500000,
      keterangan: "Pinjaman tunai",
      jenis: "Utang",
    });
    await upsertByKey(ctx, "utang", "id", "UTG002", {
      idKaryawan: "KRY003",
      tanggal: t,
      nominal: 300000,
      status: "Belum",
      dibayar: 0,
      tglBayar: "",
      sisaUtang: 300000,
      keterangan: "Casbon mingguan",
      jenis: "Casbon",
    });

    // Sinkronkan utangTotal karyawan agar konsisten dengan record utang
    for (const k of karyawan) {
      const utangs = await ctx.db.query("utang").filter((q) => q.eq(q.field("idKaryawan"), k.id)).collect();
      const total = utangs.reduce((s: number, u: any) => s + (u.sisaUtang || 0), 0);
      const row = await ctx.db.query("karyawan").filter((q) => q.eq(q.field("id"), k.id)).first();
      if (row && row.utangTotal !== total) await ctx.db.patch(row._id, { utangTotal: total });
    }

    // --- Invoice Supplier (pembelian, stok masuk) ---
    await ctx.db.insert("invoice", {
      idInvoice: "INV001",
      tanggal: t,
      tipe: "Supplier",
      mataUang: "Rp",
      namaPihak: "CV Samudra Jaya",
      items: [
        { kodeBarang: "BRG001", namaBarang: "Kopi Bubuk", hargaModal: 25000, qty: 10, subtotal: 250000 },
        { kodeBarang: "BRG002", namaBarang: "Teh Hijau", hargaModal: 15000, qty: 5, subtotal: 75000 },
      ],
      total: 325000,
      totalModal: 325000,
      totalPenjualan: 325000,
      margin: 0,
    });
    await addStokHistory(ctx, "Kopi Bubuk", t, 10, "Supplier", "Invoice INV001");
    await addStokHistory(ctx, "Teh Hijau", t, 5, "Supplier", "Invoice INV001");
    await recordKas(ctx, "KAS-INV-INV001", t, 0, 325000, "Pembelian dari CV Samudra Jaya (INV001)", "Invoice Supplier");

    // --- Invoice Reseller (penjualan, stok keluar, kas masuk) ---
    await ctx.db.insert("invoice", {
      idInvoice: "INV002",
      tanggal: t,
      tipe: "Reseller",
      mataUang: "Rp",
      namaPihak: "Reseller A",
      items: [
        { kodeBarang: "BRG001", namaBarang: "Kopi Bubuk", hargaModal: 25000, qty: 4, hargaJual: 28000, subtotal: 112000 },
        { kodeBarang: "BRG002", namaBarang: "Teh Hijau", hargaModal: 15000, qty: 3, hargaJual: 18000, subtotal: 54000 },
      ],
      total: 166000,
      totalModal: 145000,
      totalPenjualan: 166000,
      margin: 21000,
    });
    await addStokHistory(ctx, "Kopi Bubuk", t, -4, "Reseller", "Invoice INV002");
    await addStokHistory(ctx, "Teh Hijau", t, -3, "Reseller", "Invoice INV002");
    await recordKas(ctx, "KAS-INV-INV002", t, 166000, 0, "Penjualan ke Reseller A (INV002)", "Invoice Reseller");

    // --- Invoice DPL ---
    await ctx.db.insert("invoice", {
      idInvoice: "INV003",
      tanggal: t,
      tipe: "DPL",
      mataUang: "Rp",
      namaPihak: "Pasar Induk Kramat Jati",
      items: [
        { kodeBarang: "BRG003", namaBarang: "Ikan Tuna Segar", hargaModal: 55000, qty: 20, hargaJual: 65000, subtotal: 1300000 },
      ],
      total: 1300000,
      totalModal: 1100000,
      totalPenjualan: 1300000,
      margin: 200000,
    });
    await addStokHistory(ctx, "Ikan Tuna Segar", t, -20, "DPL", "Invoice INV003");
    await recordKas(ctx, "KAS-INV-INV003", t, 1300000, 0, "Penjualan ke Pasar Induk Kramat Jati (INV003)", "Invoice DPL");

    // --- Invoice Pasar (Victoria): stok awal 30, sisa 5 → terjual 25 ---
    await ctx.db.insert("invoice", {
      idInvoice: "INV004",
      tanggal: t,
      tipe: "Pasar",
      mataUang: "Rp",
      namaPihak: "Victoria",
      items: [
        { kodeBarang: "BRG004", namaBarang: "Udang Vannamei", hargaModal: 75000, qty: 30, hargaJual: 95000, stokAwal: 30, stokAkhir: 5, subtotal: 2375000 },
      ],
      total: 2375000,
      totalModal: 1875000,
      totalPenjualan: 2375000,
      margin: 500000,
    });
    await addStokHistory(ctx, "Udang Vannamei", t, -30, "Pasar", "Kirim stok awal ke Victoria (INV004)");
    await addStokHistory(ctx, "Udang Vannamei", t, 5, "Pasar", "Stok akhir kembali dari Victoria (INV004)");
    await recordKas(ctx, "KAS-INV-INV004", t, 2375000, 0, "Penjualan di Pasar Victoria (INV004)", "Invoice Pasar");

    // --- Retur ---
    await upsertByKey(ctx, "retur", "id", "RET001", {
      tanggal: t,
      tipe: "Reseller",
      namaPihak: "Reseller B",
      namaBarang: "Kopi Bubuk",
      qty: 2,
      keterangan: "Barang rusak dikembalikan",
    });
    await addStokHistory(ctx, "Kopi Bubuk", t, 2, "Retur", "Retur dari Reseller B (RET001)");

    // --- Pengeluaran ---
    await ctx.db.insert("pengeluaran", {
      id: "PEN001",
      tanggal: t,
      jenis: "Operasional",
      nominal: 250000,
      keterangan: "Bensin kendaraan operasional",
      idKaryawan: "",
    });
    await recordKas(ctx, "KAS-PEN-PEN001", t, 0, 250000, "Pengeluaran Operasional: Bensin kendaraan operasional (PEN001)", "Pengeluaran");

    // --- Saldo awal kas ---
    await recordKas(ctx, "KAS-AWAL", t, 10000000, 0, "Saldo awal kas", "Saldo Awal");

    return { seeded: true, barang: barang.length, karyawan: karyawan.length };
  },
});

