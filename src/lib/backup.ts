/**
 * Cadangan Otomatis (Mode B): Convex = sumber utama → Supabase = cadangan.
 *
 * Strategi "snapshot berkala": tabel-tabel di bawah dibaca dari Convex
 * (sumber kebenaran) lalu ditulis ulang ke Supabase dengan pola
 * WIPE + INSERT (hapus isi tabel tujuan, sisipkan salinan baris Convex).
 * Pola ini idempoten — aman dijalankan berulang tanpa menumpuk duplikat.
 *
 * PENTING:
 * 1. Cadangan ini adalah JARING PENGAMAN (salinan data), bukan cara untuk
 *    mengurangi pemakaian limit Convex. Selama halaman masih baca/tulis
 *    Convex, kuota Convex tetap terpakai. Satu-satunya cara mengurangi
 *    pemakaian Convex adalah memindahkan pembacaan data ke Supabase
 *    (lihat MIGRATION-SUPABASE.md / Opsi A).
 * 2. Kolom yang disalin hanya kolom yang BENAR-BENAR ada di tabel Supabase
 *    (dicek terhadap supabase/schema_safe.sql). Kolom tanpa tempat di
 *    Supabase tetap tersimpan utuh di Convex. Tabel Supabase cadangan
 *    TIDAK boleh diedit manual.
 * 3. Interval dijaga tidak terlalu rapat supaya backup sendiri tidak
 *    membebani Convex (setiap snapshot = satu kali baca semua tabel).
 *
 * Belum dicadangkan (schema tidak mewakili): retur (kolom items/total vs
 * single-barang), stok_history, batch_alokasi, piutang, tetesan_*, katalog.
 */
import { api } from "@/convex/_generated/api";
import { supabase, isSupabaseReady } from "./supabase";
import type { ConvexReactClient } from "convex/react";

/** Interval cadangan otomatis: 10 menit (cukup jarang agar tidak membebani Convex). */
export const BACKUP_INTERVAL_MS = 10 * 60 * 1000;
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
  /** Builder baris khusus (bila bentuk baris ≠ map sederhana). */
  build?: (row: any) => Record<string, any> | null;
}

/** Field map camelCase (Convex) → snake_case (Supabase) — hanya kolom yang ADA di schema. */
const FIELD_MAP: Record<string, Record<string, string>> = {
  barang: { kode: "kode", nama: "nama", harga: "harga_modal", kategori: "kategori" },
  supplier: { nama: "nama", alamat: "alamat", kontak: "telepon" },
  reseller: { nama: "nama", alamat: "alamat", kontak: "telepon" },
  dpl: { namaPasar: "nama_pasar", alamat: "alamat" },
  pasar: { namaPasar: "nama_pasar", alamat: "alamat" },
  karyawan: { nama: "nama", jabatan: "jabatan", gajiPokok: "gaji" },
  kas: {
    id: "id_kas",
    tanggal: "tanggal",
    keterangan: "keterangan",
    kasMasuk: "kas_masuk",
    kasKeluar: "kas_keluar",
    saldoAwal: "saldo_awal",
    saldoAkhir: "saldo_akhir",
    sumber: "sumber",
  },
  pengeluaran: {
    id: "id_pengeluaran",
    tanggal: "tanggal",
    jenis: "jenis",
    nominal: "nominal",
    keterangan: "keterangan",
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
    keterangan: "keterangan",
  },
  invoice: {
    idInvoice: "id_invoice",
    tanggal: "tanggal",
    tipe: "tipe",
    namaPihak: "nama_pihak",
    items: "items",
    total: "total",
    totalPenjualan: "total_penjualan",
    margin: "margin",
    statusPembayaran: "status_pembayaran",
    tenggat: "tenggat",
  },
  gudang: {
    namaBarang: "nama_barang",
    stokAwal: "stok_awal",
    stokMin: "stok_min",
    keterangan: "keterangan",
  },
  batch_masuk: {
    id: "id_batch",
    tanggal: "tanggal",
    namaSupplier: "nama_supplier",
    items: "items",
    totalModal: "total_modal",
  },
  bahan_baku: { kode: "kode", nama: "nama", hargaModal: "harga", kategori: "kategori" },
  barang_jadi: { kode: "kode", nama: "nama", hargaJual: "harga_jual", kategori: "kategori" },
};

/** Builder khusus untuk slipgaji: kolom Supabase hanya bonus/potongan/total agregat. */
function buildSlipGaji(row: any): Record<string, any> | null {
  const bonus =
    (Number(row.bonusKerajinan) || 0) + (Number(row.bonusBulanan) || 0);
  const potongan =
    (Number(row.potonganAbsensi) || 0) +
    (Number(row.potonganUtang) || 0) +
    (Number(row.potonganCasbon) || 0) +
    (Number(row.denda) || 0);
  return {
    id_karyawan: row.idKaryawan ?? "",
    periode: row.periode ?? "",
    gaji_pokok: Number(row.gajiPokok) || 0,
    bonus,
    potongan,
    total: Number(row.gajiBersih) || 0,
  };
}

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
  { supa: "kas", fn: api.queries.listKas, args: [{}] },
  { supa: "pengeluaran", fn: api.queries.listPengeluaran, args: [{}] },
  { supa: "absensi", fn: api.queries.listAbsensi, args: [{}] },
  { supa: "utang", fn: api.queries.listUtang, args: [{}] },
  { supa: "slipgaji", fn: api.queries.listSlipGaji, args: [{}], build: buildSlipGaji },
  { supa: "batch_masuk", fn: api.batch.listBatchMasuk },
];

/** Nama-nama tabel (Supabase) yang ikut dicadangkan — untuk panel status. */
export function backupTableNames(): string[] {
  return SOURCES.map((s) => s.supa);
}

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

/** Map baris Convex (camelCase) → bentuk Supabase (snake_case) sesuai kolom aktual. */
function toSupabaseRow(src: BackupSource, row: Record<string, any>): Record<string, any> | null {
  if (src.build) return src.build(row);
  const fieldMap = FIELD_MAP[src.supa];
  if (!fieldMap) return null;
  const out: Record<string, any> = {};
  for (const [convexKey, supaKey] of Object.entries(fieldMap)) {
    const val = row[convexKey];
    if (val !== undefined && val !== null) out[supaKey] = val;
  }
  delete (out as any).id; // sisa kolom `id` (kalau ada) bukan UUID — hapus, UUID dibuatkan Supabase
  return Object.keys(out).length > 0 ? out : null;
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
          .map((r) => toSupabaseRow(src, r))
          .filter((r): r is Record<string, any> => !!r);
        tableStatus.count = await wipeAndInsert(src.supa, rows);
        tableStatus.ok = true;
      } catch (e: any) {
        tableStatus.error = e?.message ?? String(e);
        console.warn(`[Backup] gagal mencadangkan ${src.supa}:`, e?.message ?? e);
      }
      status.tables[src.supa] = tableStatus;
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
