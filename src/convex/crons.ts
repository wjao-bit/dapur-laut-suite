import { cronJobs } from "convex/server";
import { api } from "./_generated/api";

// ============================================================================
// CRON — tugas terjadwal otomatis
// ============================================================================
// Setiap 6 jam:
//   1. Periksa invoice Reseller/Supplier yang mendekati (H-3) atau lewat
//      jatuh tempo, lalu kirim notifikasi push ke perangkat yang subscribe.
//      Pengiriman dibatasi sekali per invoice per tanggal tenggat (dedupe di
//      notif.checkTenggatAndNotify) sehingga tidak spam.
//   2. Periksa barang dengan stok ≤ batas minimum (stok menipis), kirim
//      peringatan push sekali per barang per hari (dedupe di
//      notif.checkStokMenipisAndNotify).
const crons = cronJobs();

crons.interval(
  "cek-tenggat-push",
  { hours: 6 },
  api.notif.checkTenggatAndNotify,
  {},
);

crons.interval(
  "cek-stok-menipis-push",
  { hours: 6 },
  api.notif.checkStokMenipisAndNotify,
  {},
);

export default crons;
