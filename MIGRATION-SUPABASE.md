# 📋 Panduan Migrasi: Convex → Supabase

## Langkah 1: Setup Supabase

1. Buka [supabase.com](https://supabase.com) → Sign up
2. Buat project baru (region Singapore)
3. Buka **SQL Editor** → Paste seluruh isi `supabase/schema.sql` → Run
4. Catat **Project URL** dan **Anon Key** dari Settings → API

## Langkah 2: Tambah Environment Variables

Di menu **Keys/API keys** platform ini, tambah:
- `VITE_SUPABASE_URL` = `https://xxxxx.supabase.co`
- `VITE_SUPABASE_ANON_KEY` = `eyJhbGciOiJIUzI1NiIs...`

## Langkah 3: Impor Data

### Export dari Convex (jika deployment masih aktif)
```bash
npx convex export --path backup.zip
```

### Import ke Supabase
Gunakan script Node.js untuk konversi backup Convex → SQL INSERT.
Atau import manual via dashboard Supabase (Table Editor → Import).

## Langkah 4: Konversi Halaman

### Pola Umum

**Sebelum (Convex):**
```typescript
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

const data = useQuery(api.queries.listBarang);
const create = useMutation(api.business.createBarang);
```

**Sesudah (Supabase):**
```typescript
import { useSupabaseQuery, useSupabaseMutation } from "@/hooks/use-supabase-query";

const data = useSupabaseQuery("barang");
const { insert, update, remove } = useSupabaseMutation("barang");
```

### Mapping Tabel Convex → Supabase

| Convex Table | Supabase Table | Catatan |
|---|---|---|
| `barang` | `barang` | Sama |
| `supplier` | `supplier` | Sama |
| `reseller` | `reseller` | Sama |
| `dpl` | `dpl` | field `namaPasar` → `nama_pasar` |
| `pasar` | `pasar` | field `namaPasar` → `nama_pasar` |
| `karyawan` | `karyawan` | Sama |
| `invoice` | `invoice` | field `namaPihak` → `nama_pihak`, dll |
| `batchMasuk` | `batch_masuk` | snake_case |
| `batchAlokasi` | `batch_alokasi` | snake_case |
| `kas` | `kas` | field `kasMasuk` → `kas_masuk`, dll |
| `pengeluaran` | `pengeluaran` | Sama |
| `stokHistory` | `stok_history` | snake_case |
| `gudang` | `gudang` | Sama |
| `retur` | `retur` | Sama |
| `absensi` | `absensi` | Sama |
| `utang` | `utang` | Sama |
| `slipgaji` | `slipgaji` | Sama |
| `piutang` | `piutang` | Sama |
| `bahanBaku` | `bahan_baku` | snake_case |
| `barangJadi` | `barang_jadi` | snake_case |
| `tetesanStok` | `tetesan_stok` | snake_case |
| `tetesanStokHistory` | `tetesan_stok_history` | snake_case |
| `invoiceTetesan` | `invoice_tetesan` | snake_case |
| `katalog` | `katalog` | Sama |

### Mapping Query Convex → Supabase

| Convex Query | Supabase Equivalent |
|---|---|
| `api.queries.listBarang` | `useSupabaseQuery("barang")` |
| `api.queries.listSupplier` | `useSupabaseQuery("supplier")` |
| `api.queries.listReseller` | `useSupabaseQuery("reseller")` |
| `api.queries.listDpl` | `useSupabaseQuery("dpl")` |
| `api.queries.listPasar` | `useSupabaseQuery("pasar")` |
| `api.queries.listKaryawan` | `useSupabaseQuery("karyawan")` |
| `api.queries.listInvoice` | `useSupabaseQuery("invoice", { filters: {...} })` |
| `api.queries.listKas` | `useSupabaseQuery("kas", { limit: 200 })` |
| `api.queries.listStokHistory` | `useSupabaseQuery("stok_history", { limit: 200 })` |
| `api.queries.listPengeluaran` | `useSupabaseQuery("pengeluaran", { limit: 100 })` |
| `api.queries.listRetur` | `useSupabaseQuery("retur", { limit: 100 })` |
| `api.queries.listGudang` | `useSupabaseQuery("gudang")` |
| `api.queries.listAbsensi` | `useSupabaseQuery("absensi")` |
| `api.queries.listUtang` | `useSupabaseQuery("utang")` |
| `api.queries.listSlipGaji` | `useSupabaseQuery("slipgaji")` |
| `api.queries.listBatchMasuk` | `useSupabaseQuery("batch_masuk")` |
| `api.batch.listBatchMasuk` | `useSupabaseQuery("batch_masuk")` |
| `api.queries.dashboardStats` | Buat query SQL terpisah atau fetch manual |
| `api.queries.laporanKeuangan` | Buat query SQL terpisah atau fetch manual |

### Mapping Mutation Convex → Supabase

| Convex Mutation | Supabase Equivalent |
|---|---|
| `api.business.createInvoice` | `supabase.from("invoice").insert({...})` |
| `api.business.upsertKasManual` | `supabase.from("kas").upsert({...})` |
| `api.business.upsertPengeluaran` | `supabase.from("pengeluaran").insert({...})` |
| `api.business.upsertRetur` | `supabase.from("retur").insert({...})` |
| `api.business.deleteMaster` | `supabase.from("table").delete().eq("id", id)` |
| `api.batch.createBatchMasuk` | `supabase.from("batch_masuk").insert({...})` |
| `api.batch.splitBatch` | Buat stored function atau RPC |
| `api.batch.confirmAlokasi` | Buat stored function atau RPC |
| `api.batch.deleteAlokasi` | `supabase.from("batch_alokasi").delete()...` |

### Contoh Konversi Halaman

#### BarangPage (Mudah)
```typescript
// SEBELUM
const rows = useQuery(api.queries.listBarang);
const upsertBarang = useMutation(api.business.upsertBarang);

// SESUDAH
const rows = useSupabaseQuery("barang", { orderBy: { column: "kode", ascending: true } });
const { insert, update, remove } = useSupabaseMutation("barang");

// Insert
await insert({ kode: "T001", nama: "Tongkol", satuan: "kg", harga_modal: 15000 });
// Update
await update(someId, { harga_modal: 16000 });
// Delete
await remove(someId);
```

#### InvoicePage (Kompleks)
```typescript
// SEBELUM
const invoices = useQuery(api.queries.listInvoice, {});
const barang = useQuery(api.queries.listBarang);
const suppliers = useQuery(api.queries.listSupplier);
// ... 8 queries

// SESUDAH
const invoices = useSupabaseQuery("invoice", { limit: 200 });
const barang = useSupabaseQuery("barang");
const suppliers = useSupabaseQuery("supplier");
// Pola sama, tinggal ganti import + hook name
```

## Halaman yang Perlu Dikonversi (20 file)

| # | File | Kompleksitas |
|---|---|---|
| 1 | `DashboardPage.tsx` | 🔴 Kompleks (aggregasi stats) |
| 2 | `BarangPage.tsx` | 🟢 Mudah |
| 3 | `SupplierPage.tsx` | 🟢 Mudah |
| 4 | `ResellerPage.tsx` | 🟢 Mudah |
| 5 | `DplPage.tsx` | 🟢 Mudah |
| 6 | `PasarPage.tsx` | 🟢 Mudah |
| 7 | `KaryawanPage.tsx` | 🟢 Mudah |
| 8 | `AbsensiPage.tsx` | 🟡 Sedang |
| 9 | `UtangPage.tsx` | 🟡 Sedang |
| 10 | `InvoicePage.tsx` | 🔴 Kompleks (8 query + business logic) |
| 11 | `BarangMasukPage.tsx` | 🔴 Kompleks (batch logic) |
| 12 | `PiutangPage.tsx` | 🟡 Sedang |
| 13 | `ReturPage.tsx` | 🟡 Sedang |
| 14 | `GudangPage.tsx` | 🟡 Sedang |
| 15 | `KasPage.tsx` | 🟡 Sedang |
| 16 | `SlipGajiPage.tsx` | 🟡 Sedang |
| 17 | `PengeluaranPage.tsx` | 🟢 Mudah |
| 18 | `LaporanPage.tsx` | 🔴 Kompleks (aggregasi) |
| 19 | `AdminPage.tsx` | 🟡 Sedang |
| 20 | `MonitorPage.tsx` | 🟡 Sedang |
| 21 | `TetesanPage.tsx` | 🟡 Sedang |
| 22 | `MasterTetesanPage.tsx` | 🟢 Mudah |
| 23 | `LaporanTetesanPage.tsx` | 🟡 Sedang |
| 24 | `KatalogPage.tsx` | 🟡 Sedang |

## Komponen yang Perlu Dikonversi

| File | Perubahan |
|---|---|
| `AppLayout.tsx` | Ganti useQuery → useSupabaseQuery |
| `OcrInvoiceDialog.tsx` | Ganti useQuery + useAction → useSupabaseQuery + Supabase RPC |
| `InvoiceTrashDialog.tsx` | Ganti useQuery → useSupabaseQuery |
| `BarangSearch.tsx` | Ganti useQuery → useSupabaseQuery |
| `RequireAuth.tsx` | Ganti useAuth → useAuthSupabase |

## Auth: Convex Auth → Supabase Auth

```typescript
// SEBELUM
import { useAuth } from "@/hooks/use-auth";
const { isLoading, isAuthenticated, user, login, signOut } = useAuth();

// SESUDAH
import { useAuthSupabase } from "@/hooks/use-auth-supabase";
const { isLoading, isAuthenticated, user, login, signOut } = useAuthSupabase();
```

### Auth Page (Login)
Convex: Email OTP → Supabase: Email + Password atau Magic Link

### User Profile
Convex: Query `api.admin.getSession` → Supabase: `supabase.from("users").select()`

## Tips Penting

1. **snake_case vs camelCase**: Supabase pakai snake_case (`nama_pihak`), Convex pakai camelCase (`namaPihak`). Saat query, gunakan nama kolom snake_case.

2. **ID**: Convex pakai string ID unik, Supabase pakai UUID. Saat import data, perlu mapping ID.

3. **Realtime**: Supabase realtime sudah diaktifkan di schema.sql. Hook `useSupabaseQuery` otomatis subscribe ke perubahan.

4. **Aggregasi**: Query seperti `dashboardStats` dan `laporanKeuangan` perlu dihitung di frontend atau dibuat sebagai Supabase RPC (stored function).

5. **Business Logic**: Fungsi seperti `splitBatch`, `confirmAlokasi`, `createInvoice` yang ada di Convex backend perlu dipindahkan ke Supabase Edge Functions atau RPC.

6. **File Convex yang dihapus**: Setelah migrasi selesai, hapus seluruh folder `src/convex/` kecuali yang masih dipakai untuk referensi.
