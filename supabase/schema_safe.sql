-- ============================================================
-- DAPUR LAUT — Schema Supabase (SAFE VERSION)
-- Bisa dijalankan berulang kali tanpa error
-- ============================================================

-- Helper function to drop policies safely
CREATE OR REPLACE FUNCTION drop_policy_if_exists(table_name TEXT, policy_name TEXT)
RETURNS void AS $$
BEGIN
  EXECUTE format('DROP POLICY IF EXISTS %I ON %I', policy_name, table_name);
EXCEPTION WHEN OTHERS THEN NULL;
END;
$$ LANGUAGE plpgsql;

-- 1. Users
DROP TABLE IF EXISTS users CASCADE;
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE,
  nama TEXT DEFAULT '',
  role TEXT DEFAULT 'user' CHECK (role IN ('Admin Master', 'Admin', 'user')),
  status TEXT DEFAULT 'approved' CHECK (status IN ('pending', 'approved', 'rejected')),
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read users" ON users FOR SELECT USING (true);
CREATE POLICY "Insert own user" ON users FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Update own user" ON users FOR UPDATE USING (auth.uid() = id);

-- 2. Barang
DROP TABLE IF EXISTS barang CASCADE;
CREATE TABLE barang (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kode TEXT UNIQUE NOT NULL,
  nama TEXT NOT NULL,
  satuan TEXT DEFAULT 'kg',
  harga_modal NUMERIC DEFAULT 0,
  kategori TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE barang ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all barang" ON barang FOR ALL USING (true);

-- 3. Supplier
DROP TABLE IF EXISTS supplier CASCADE;
CREATE TABLE supplier (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nama TEXT NOT NULL,
  alamat TEXT DEFAULT '',
  telepon TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE supplier ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all supplier" ON supplier FOR ALL USING (true);

-- 4. Reseller
DROP TABLE IF EXISTS reseller CASCADE;
CREATE TABLE reseller (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nama TEXT NOT NULL,
  alamat TEXT DEFAULT '',
  telepon TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE reseller ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all reseller" ON reseller FOR ALL USING (true);

-- 5. DPL
DROP TABLE IF EXISTS dpl CASCADE;
CREATE TABLE dpl (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nama_pasar TEXT NOT NULL,
  alamat TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE dpl ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all dpl" ON dpl FOR ALL USING (true);

-- 6. Pasar
DROP TABLE IF EXISTS pasar CASCADE;
CREATE TABLE pasar (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nama_pasar TEXT NOT NULL,
  alamat TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE pasar ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all pasar" ON pasar FOR ALL USING (true);

-- 7. Karyawan
DROP TABLE IF EXISTS karyawan CASCADE;
CREATE TABLE karyawan (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nama TEXT NOT NULL,
  jabatan TEXT DEFAULT '',
  gaji NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE karyawan ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all karyawan" ON karyawan FOR ALL USING (true);

-- 8. Invoice
DROP TABLE IF EXISTS invoice CASCADE;
CREATE TABLE invoice (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_invoice TEXT UNIQUE NOT NULL,
  tanggal TEXT NOT NULL,
  tipe TEXT NOT NULL,
  nama_pihak TEXT NOT NULL,
  items JSONB DEFAULT '[]'::jsonb,
  total NUMERIC DEFAULT 0,
  total_penjualan NUMERIC DEFAULT 0,
  margin NUMERIC DEFAULT 0,
  status_pembayaran TEXT DEFAULT 'Pending',
  tenggat TEXT,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE invoice ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all invoice" ON invoice FOR ALL USING (true);

-- 9. Batch Masuk
DROP TABLE IF EXISTS batch_masuk CASCADE;
CREATE TABLE batch_masuk (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_batch TEXT UNIQUE NOT NULL,
  tanggal TEXT NOT NULL,
  nama_supplier TEXT NOT NULL,
  items JSONB DEFAULT '[]'::jsonb,
  total_modal NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE batch_masuk ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all batch_masuk" ON batch_masuk FOR ALL USING (true);

-- 10. Batch Alokasi
DROP TABLE IF EXISTS batch_alokasi CASCADE;
CREATE TABLE batch_alokasi (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_batch TEXT NOT NULL,
  nama_pihak TEXT NOT NULL,
  tipe_pihak TEXT NOT NULL,
  items JSONB DEFAULT '[]'::jsonb,
  total NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE batch_alokasi ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all batch_alokasi" ON batch_alokasi FOR ALL USING (true);

-- 11. Kas
DROP TABLE IF EXISTS kas CASCADE;
CREATE TABLE kas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_kas TEXT UNIQUE NOT NULL,
  tanggal TEXT NOT NULL,
  keterangan TEXT DEFAULT '',
  kas_masuk NUMERIC DEFAULT 0,
  kas_keluar NUMERIC DEFAULT 0,
  saldo_awal NUMERIC DEFAULT 0,
  saldo_akhir NUMERIC DEFAULT 0,
  sumber TEXT DEFAULT 'Manual',
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE kas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all kas" ON kas FOR ALL USING (true);

-- 12. Pengeluaran
DROP TABLE IF EXISTS pengeluaran CASCADE;
CREATE TABLE pengeluaran (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_pengeluaran TEXT UNIQUE NOT NULL,
  tanggal TEXT NOT NULL,
  jenis TEXT DEFAULT 'Operasional',
  nominal NUMERIC DEFAULT 0,
  keterangan TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE pengeluaran ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all pengeluaran" ON pengeluaran FOR ALL USING (true);

-- 13. Stok History
DROP TABLE IF EXISTS stok_history CASCADE;
CREATE TABLE stok_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nama_barang TEXT NOT NULL,
  perubahan NUMERIC NOT NULL,
  keterangan TEXT DEFAULT '',
  tanggal TEXT NOT NULL,
  asal TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE stok_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all stok_history" ON stok_history FOR ALL USING (true);

-- 14. Gudang
DROP TABLE IF EXISTS gudang CASCADE;
CREATE TABLE gudang (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nama_barang TEXT UNIQUE NOT NULL,
  stok_awal NUMERIC DEFAULT 0,
  stok_min NUMERIC DEFAULT 5,
  keterangan TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE gudang ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all gudang" ON gudang FOR ALL USING (true);

-- 15. Retur
DROP TABLE IF EXISTS retur CASCADE;
CREATE TABLE retur (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_retur TEXT UNIQUE NOT NULL,
  tanggal TEXT NOT NULL,
  tipe TEXT NOT NULL,
  nama_pihak TEXT NOT NULL,
  items JSONB DEFAULT '[]'::jsonb,
  total NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE retur ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all retur" ON retur FOR ALL USING (true);

-- 16. Absensi
DROP TABLE IF EXISTS absensi CASCADE;
CREATE TABLE absensi (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_karyawan TEXT NOT NULL,
  tanggal TEXT NOT NULL,
  status TEXT DEFAULT 'Hadir',
  jam_masuk TEXT DEFAULT '',
  jam_keluar TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE absensi ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all absensi" ON absensi FOR ALL USING (true);

-- 17. Utang
DROP TABLE IF EXISTS utang CASCADE;
CREATE TABLE utang (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_karyawan TEXT NOT NULL,
  tanggal TEXT NOT NULL,
  nominal NUMERIC DEFAULT 0,
  keterangan TEXT DEFAULT '',
  status TEXT DEFAULT 'Belum Lunas',
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE utang ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all utang" ON utang FOR ALL USING (true);

-- 18. Slip Gaji
DROP TABLE IF EXISTS slipgaji CASCADE;
CREATE TABLE slipgaji (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_karyawan TEXT NOT NULL,
  periode TEXT NOT NULL,
  gaji_pokok NUMERIC DEFAULT 0,
  bonus NUMERIC DEFAULT 0,
  potongan NUMERIC DEFAULT 0,
  total NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE slipgaji ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all slipgaji" ON slipgaji FOR ALL USING (true);

-- 19. Piutang
DROP TABLE IF EXISTS piutang CASCADE;
CREATE TABLE piutang (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_invoice TEXT NOT NULL,
  tanggal TEXT NOT NULL,
  nama_pihak TEXT NOT NULL,
  total NUMERIC DEFAULT 0,
  dibayar NUMERIC DEFAULT 0,
  sisa NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'Belum Lunas',
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE piutang ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all piutang" ON piutang FOR ALL USING (true);

-- 20. Audit Log
DROP TABLE IF EXISTS audit_log CASCADE;
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT DEFAULT '',
  aksi TEXT NOT NULL,
  detail JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all audit_log" ON audit_log FOR ALL USING (true);

-- 21. Push Subscription
DROP TABLE IF EXISTS push_subscription CASCADE;
CREATE TABLE push_subscription (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint TEXT NOT NULL,
  keys JSONB DEFAULT '{}'::jsonb,
  user_id TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE push_subscription ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all push_subscription" ON push_subscription FOR ALL USING (true);

-- 22. Bahan Baku (Tetesan)
DROP TABLE IF EXISTS bahan_baku CASCADE;
CREATE TABLE bahan_baku (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kode TEXT UNIQUE NOT NULL,
  nama TEXT NOT NULL,
  satuan TEXT DEFAULT 'kg',
  harga NUMERIC DEFAULT 0,
  kategori TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE bahan_baku ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all bahan_baku" ON bahan_baku FOR ALL USING (true);

-- 23. Barang Jadi (Tetesan)
DROP TABLE IF EXISTS barang_jadi CASCADE;
CREATE TABLE barang_jadi (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kode TEXT UNIQUE NOT NULL,
  nama TEXT NOT NULL,
  satuan TEXT DEFAULT 'kg',
  harga_jual NUMERIC DEFAULT 0,
  kategori TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE barang_jadi ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all barang_jadi" ON barang_jadi FOR ALL USING (true);

-- 24. Tetesan Stok
DROP TABLE IF EXISTS tetesan_stok CASCADE;
CREATE TABLE tetesan_stok (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nama_barang TEXT UNIQUE NOT NULL,
  tipe TEXT DEFAULT 'Bahan Baku',
  stok_awal NUMERIC DEFAULT 0,
  tanggal_stok_awal TEXT,
  keterangan TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE tetesan_stok ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all tetesan_stok" ON tetesan_stok FOR ALL USING (true);

-- 25. Tetesan Stok History
DROP TABLE IF EXISTS tetesan_stok_history CASCADE;
CREATE TABLE tetesan_stok_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nama_barang TEXT NOT NULL,
  perubahan NUMERIC NOT NULL,
  keterangan TEXT DEFAULT '',
  tanggal TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE tetesan_stok_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all tetesan_stok_history" ON tetesan_stok_history FOR ALL USING (true);

-- 26. Invoice Tetesan
DROP TABLE IF EXISTS invoice_tetesan CASCADE;
CREATE TABLE invoice_tetesan (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_invoice TEXT UNIQUE NOT NULL,
  tanggal TEXT NOT NULL,
  tipe TEXT NOT NULL,
  nama_pihak TEXT DEFAULT '',
  items JSONB DEFAULT '[]'::jsonb,
  total NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE invoice_tetesan ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all invoice_tetesan" ON invoice_tetesan FOR ALL USING (true);

-- 27. Katalog
DROP TABLE IF EXISTS katalog CASCADE;
CREATE TABLE katalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nama TEXT NOT NULL,
  keterangan TEXT DEFAULT '',
  items JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE katalog ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all katalog" ON katalog FOR ALL USING (true);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_invoice_tanggal ON invoice(tanggal);
CREATE INDEX IF NOT EXISTS idx_invoice_tipe ON invoice(tipe);
CREATE INDEX IF NOT EXISTS idx_invoice_pihak ON invoice(nama_pihak);
CREATE INDEX IF NOT EXISTS idx_kas_tanggal ON kas(tanggal);
CREATE INDEX IF NOT EXISTS idx_stok_history_tanggal ON stok_history(tanggal);
CREATE INDEX IF NOT EXISTS idx_stok_history_barang ON stok_history(nama_barang);
CREATE INDEX IF NOT EXISTS idx_batch_masuk_tanggal ON batch_masuk(tanggal);
CREATE INDEX IF NOT EXISTS idx_batch_alokasi_batch ON batch_alokasi(id_batch);
CREATE INDEX IF NOT EXISTS idx_pengeluaran_tanggal ON pengeluaran(tanggal);
CREATE INDEX IF NOT EXISTS idx_retur_tanggal ON retur(tanggal);

-- ============================================================
-- ENABLE REALTIME
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE barang;
ALTER PUBLICATION supabase_realtime ADD TABLE supplier;
ALTER PUBLICATION supabase_realtime ADD TABLE reseller;
ALTER PUBLICATION supabase_realtime ADD TABLE dpl;
ALTER PUBLICATION supabase_realtime ADD TABLE pasar;
ALTER PUBLICATION supabase_realtime ADD TABLE karyawan;
ALTER PUBLICATION supabase_realtime ADD TABLE invoice;
ALTER PUBLICATION supabase_realtime ADD TABLE batch_masuk;
ALTER PUBLICATION supabase_realtime ADD TABLE batch_alokasi;
ALTER PUBLICATION supabase_realtime ADD TABLE kas;
ALTER PUBLICATION supabase_realtime ADD TABLE pengeluaran;
ALTER PUBLICATION supabase_realtime ADD TABLE stok_history;
ALTER PUBLICATION supabase_realtime ADD TABLE gudang;
ALTER PUBLICATION supabase_realtime ADD TABLE retur;
ALTER PUBLICATION supabase_realtime ADD TABLE users;
