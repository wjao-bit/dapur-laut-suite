/**
 * Cadangan Otomatis (Mode B): Convex = sumber utama → Supabase = cadangan.
 *
 * Strategi: "snapshot berkala" (bukan dual-write real-time). Setiap interval,
 * tabel-tabel di bawah dibaca dari Convex (sumber kebenaran) lalu ditulis
 * ulang ke Supabase dengan pola WIPE + INSERT:
 *
 *   1. Hapus seluruh isi tabel Supabase tujuan.
 *   2. Sisipkan salinan baris Convex (field di-map camelCase → snake_case,
 *      kolom `id` UUID dibiarkan dibuatkan Supabase).
 *
 * Pola ini idempoten (aman dijalankan berulang) dan tidak akan menumpuk
 * duplikat, tidak peduli seberapa sering backup berjalan. Tabel cadangan
 * TIDAK boleh diubah manual dari UI/dashboard Supabase.
 *
 * Catatan: tabel batch/stok_history/tetesan sengaja BELUM dicadangkan karena
 * halaman Barang Masuk (batch) masih menulis langsung ke Supabase — akan
 * dikonversi ke Convex dulu pada tahap berikutnya.
 */
import { api } from "@/convex/_generated/api";
import { supabase, isSupabaseReady } from "./supabase";
import type { ConvexReactClient } from "convex/react";

export const BACKUP_INTERVAL_MS = 5 * 60 * 1000; // 5 menit
const STATUS_KEY = "dl-auto-backup-v1";
const INSERT_CHUNK = 400;

export interface BackupTableStatus {
  ok: boolean;
  count: number;
  at: string;
  error?: string;
}

export interface BackupStatus {
  lastRun: string | null;
  running: boolean;
  tables: Record<string, BackupTableStatus>;
}

interface BackupSource {
  /** Nama tabel Supabase tujuan. */
  supa: string;
  /** Query Convex sumber data (dipanggil imperatif lewat client). */
  fn: any;
  /** Argumen query Convex (default: tanpa argumen). */
  args?: any[];
}

/** Field map camelCase (Convex) → snake_case (Supabase) — subset yang dicadangkan. */
const FIELD_MAP: Record<string, Record<string, string>> = {
  barang: { kode: "kode", nama: "nama", harga: "harga", kategori: "kategori" },
  supplier: { nama: "nama", alamat: "alamat", kontak: "telepon" },
  reseller: { nama: "nama", alamat: "alamat", kontak: "telepon" },
  dpl: { namaPasar: "nama_pasar", alamat: "alamat", kontak: "telepon" },
  pasar: { namaPasar: "nama_pasar", alamat: "alamat", kontak: "telepon" },
  karyawan: { nama: "nama", jabatan: "jabatan", gajiPokok: "gaji" },
  retur: {
    tanggal: "tanggal",
    tipe: "tipe",
    namaPihak: "nama_pihak",
    namaBarang: "nama_barang",
    qty: "qty",
    keterangan: "keterangan",
  },
  kas: {
    tanggal: "tanggal",
    kasMasuk: "kas_masuk",
    kasKeluar: "kas_keluar",
    saldoAwal: "saldo_awal",
    saldoAkhir: "saldo_akhir",
    keterangan: "keterangan",
    sumber: "sumber",
  },
  pengeluaran: {
    tanggal: "tanggal",
    jenis: "jenis",
    nominal: "nominal",
    keterangan: "keterangan",
    idKaryawan: "id_karyawan",
  },
  absensi: {
    idKaryawan: "id_karyawan",
    tanggal: "tanggal",
    status: "status",
    jamMasuk: "jam_masuk",
    jamKeluar: "jam_keluar",
  },
  utang: {
    idKaryawan: "id_karyawan",
    tanggal: "tanggal",
    nominal: "nominal",
    status: "status",
    dibayar: "dibayar",
    tglBayar: "tgl_bayar",
    sisaUtang: "sisa_utang",
    keterangan: "keterangan",
    jenis: "jenis",
  },
  slipgaji: {
    idKaryawan: "id_karyawan",
    periode: "periode",
    tanggal: "tanggal",
    gajiPokok: "gaji_pokok",
    bonusKerajinan: "bonus_kerajinan",
    bonusBulanan: "bonus_bulanan",
    denda: "denda",
    hadir: "hadir",
    izin: "izin",
    sakit: "sakit",
    alpa: "alpa",
    potonganAbsensi: "potongan_absensi",
    potonganUtang: "potongan_utang",
    potonganCasbon: "potongan_casbon",
    gajiBersih: "gaji_bersih",
    sisaUtang: "sisa_utang",
    sisaCasbon: "sisa_casbon",
  },
  invoice: {
    idInvoice: "id_invoice",
    tanggal: "tanggal",
    tipe: "tipe",
    namaPihak: "nama_pihak",
    tenggat: "tenggat",
    mataUang: "mata_uang",
    statusPembayaran: "status_pembayaran",
    items: "items",
    total: "total",
    totalModal: "total_modal",
    totalPenjualan: "total_penjualan",
    margin: "margin",
    dibayar: "dibayar",
    sisa: "sisa",
    riwayatBayar: "riwayat_bayar",
    deletedAt: "deleted_at",
  },
  gudang: {
    namaBarang: "nama_barang",
    stokAwal: "stok_awal",
    tanggalStokAwal: "tanggal_stok_awal",
    keterangan: "keterangan",
    stokMin: "stok_min",
  },
  bahan_baku: { kode: "kode", nama: "nama", hargaModal: "harga", kategori: "kategori" },
  barang_jadi: { kode: "kode", nama: "nama", hargaJual: "harga_jual", kategori: "kategori" },
};

const SOURCES: BackupSource[] = [
  { supa: "barang", fn: api.queries.listBarang },
  { supa: "supplier", fn: api.queries.listSupplier },
  { supa: "reseller", fn: api.queries.listReseller },
  { supa: "dpl", fn: api.queries.listDpl },
  { supa: "pasar", fn: api.queries.listPasar },
  { supa: "karyawan", fn: api.queries.listKaryawan },
  { supa: "bahan_baku", fn: api.queries.listBahanBaku },
  { supa: "barang_jadi", fn: api.queries.listBarangJadi },
  { supa: "gudang", fn: api.queries.listGudang },
  { supa: "invoice", fn: api.queries.listInvoice, args: [{}] },
  { supa: "retur", fn: api.queries.listRetur, args: [{}] },
  { supa: "kas", fn: api.queries.listKas, args: [{}] },
  { supa: "pengeluaran", fn: api.queries.listPengeluaran, args: [{}] },
  { supa: "absensi", fn: api.queries.listAbsensi, args: [{}] },
  { supa: "utang", fn: api.queries.listUtang, args: [{}] },
  { supa: "slipgaji", fn: api.queries.listSlipGaji, args: [{}] },
];

export function readBackupStatus(): BackupStatus {
  const empty: BackupStatus = { lastRun: null, running: false, tables: {} };
  try {
    const raw = localStorage.getItem(STATUS_KEY);
    if (!raw) return empty;
    const parsed = JSON.parse(raw);
    return { ...empty, ...(parsed ?? {}) };
  } catch {
    return empty;
  }
}

function saveStatus(s: BackupStatus) {
  try {
    localStorage.setItem(STATUS_KEY, JSON.stringify(s));
  } catch {
    /* localStorage tidak tersedia — backup tetap berjalan, status hanya di memori */
  }
}

/** Map baris Convex (camelCase) → bentuk Supabase (snake_case), tanpa kolom UUID `id`. */
function toSupabaseRow(supa: string, row: Record<string, any>): Record<string, any> {
  const fieldMap = FIELD_MAP[supa];
  if (!fieldMap) return {};
  const out: Record<string, any> = {};
  for (const [convexKey, supaKey] of Object.entries(fieldMap)) {
    const val = row[convexKey];
    if (val !== undefined && val !== null) out[supaKey] = val;
  }
  delete (out as any).id; // biarkan Supabase meng-generate UUID
  return out;
}

async function wipeAndInsert(supa: string, rows: Record<string, any>[]): Promise<number> {
  // Hapus seluruh isi tabel tujuan dulu (pola idempoten).
  await supabase.from(supa).delete().not("id", "is", null);
  if (rows.length === 0) return 0;
  let inserted = 0;
  for (let i = 0; i < rows.length; i += INSERT_CHUNK) {
    const chunk = rows.slice(i, i + INSERT_CHUNK);
    const { error } = await supabase.from(supa).insert(chunk);
    if (error) throw new Error(error.message);
    inserted += chunk.length;
  }
  return inserted;
}

/**
 * Jalankan snapshot cadangan sekali: baca semua tabel dari Convex lalu
 * tulis ulang ke Supabase. Status disimpan di localStorage.
 */
export async function runBackupSnapshot(client: ConvexReactClient): Promise<BackupStatus> {
  const status = readBackupStatus();
  if (status.running) return status; // jangan tabrakan dengan run lain

  status.running = true;
  status.lastRun = status.lastRun ?? null;
  saveStatus(status);

  try {
    for (const src of SOURCES) {
      const tableStatus: BackupTableStatus = {
        ok: false,
        count: 0,
        at: new Date().toISOString(),
      };
      try {
        const convexRows: any[] = ((await (client.query as any)(src.fn, ...(src.args ?? []))) ?? []) as any[];
        const rows = convexRows
          .map((r) => toSupabaseRow(src.supa, r))
          .filter((r) => Object.keys(r).length > 0);
        tableStatus.count = await wipeAndInsert(src.supa, rows);
        tableStatus.ok = true;
      } catch (e: any) {
        tableStatus.error = e?.message ?? String(e);
        console.warn(`[Backup] gagal mencadangkan ${src.supa}:`, e?.message ?? e);
      }
      status.tables[src.supa] = tableStatus;
      status.lastRun = new Date().toISOString();
      saveStatus(status);
    }
  } finally {
    status.running = false;
    status.lastRun = new Date().toISOString();
    saveStatus(status);
  }
  return status;
}

/** True kalau Supabase terkonfigurasi (cek dari env). */
export function isBackupReady(): boolean {
  return isSupabaseReady();
}
