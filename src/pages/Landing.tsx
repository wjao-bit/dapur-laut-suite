import { Link } from "react-router";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Boxes,
  Wallet,
  FileText,
  Banknote,
  BarChart3,
  ShieldCheck,
  Sparkles,
  Users,
  CalendarCheck,
  Ship,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { LogoMark } from "@/components/Brand";
import { InstallAppButton } from "@/components/app/InstallAppButton";
import { cn } from "@/lib/utils";

const FEATURES = [
  {
    icon: FileText,
    title: "Invoice Multi-Barang",
    desc: "Satu invoice bisa berisi banyak barang untuk Supplier, Reseller, DPL, dan Pasar — stok & kas ter-update otomatis.",
    tone: "text-sky-600 bg-sky-50",
  },
  {
    icon: Boxes,
    title: "Gudang & Stok Real-time",
    desc: "Setiap pembelian, penjualan, dan retur langsung tercatat. Riwayat stok menampilkan asal perubahan dengan jelas.",
    tone: "text-emerald-600 bg-emerald-50",
  },
  {
    icon: Wallet,
    title: "Kas Harian Terkontrol",
    desc: "Kas masuk & keluar tercatat otomatis dari semua transaksi. SaldoAkhir = SaldoAwal + Masuk − Keluar, tanpa duplikasi.",
    tone: "text-teal-600 bg-teal-50",
  },
  {
    icon: Banknote,
    title: "Slip Gaji Otomatis",
    desc: "Tarik absensi, utang, dan casbon karyawan — potongan dihitung otomatis, slip gaji siap cetak dengan branding.",
    tone: "text-indigo-600 bg-indigo-50",
  },
  {
    icon: Users,
    title: "Utang Karyawan Terpadu",
    desc: "Pengeluaran jenis 'Utang Karyawan' otomatis menjadi record utang, lalu terpotong pada slip gaji berikutnya.",
    tone: "text-amber-600 bg-amber-50",
  },
  {
    icon: BarChart3,
    title: "Laporan & Analisis Margin",
    desc: "Laporan keuangan, rekap per pihak, dan analisis margin per produk/pasar/reseller — semua bisa dicetak sebagai PDF.",
    tone: "text-rose-600 bg-rose-50",
  },
];

const STATS = [
  { value: "16+", label: "Menu Terpadu" },
  { value: "5", label: "Jenis Transaksi" },
  { value: "100%", label: "Stok Terkontrol" },
  { value: "PDF", label: "Cetak Dokumen" },
];

export default function Landing() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2.5">
            <LogoMark className="size-9" />
            <div className="leading-tight">
              <p className="text-[15px] font-bold tracking-tight">Dapur Laut</p>
              <p className="text-[10px] font-medium tracking-wide text-muted-foreground uppercase">Manajemen Bisnis</p>
            </div>
          </Link>

          <nav className="hidden items-center gap-6 text-sm font-medium text-muted-foreground md:flex">
            <a href="#fitur" className="transition-colors hover:text-foreground">Fitur</a>
            <a href="#modul" className="transition-colors hover:text-foreground">Modul</a>
            <a href="#laporan" className="transition-colors hover:text-foreground">Laporan</a>
          </nav>

          <div className="hidden items-center gap-2 md:flex">
            <InstallAppButton variant="ghost" size="sm" label="Instal" />
            <Button asChild variant="ghost">
              <Link to="/auth">Masuk</Link>
            </Button>
            <Button asChild>
              <Link to="/auth">
                Mulai Sekarang
                <ArrowRight className="ml-2 size-4" />
              </Link>
            </Button>
          </div>

          <button
            className="rounded-md p-2 text-muted-foreground hover:bg-muted md:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Menu"
          >
            {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>

        {mobileOpen && (
          <div className="border-t bg-background px-4 py-4 md:hidden">
            <nav className="flex flex-col gap-1">
              <a href="#fitur" className="rounded-lg px-3 py-2 text-sm font-medium hover:bg-muted">Fitur</a>
              <a href="#modul" className="rounded-lg px-3 py-2 text-sm font-medium hover:bg-muted">Modul</a>
              <a href="#laporan" className="rounded-lg px-3 py-2 text-sm font-medium hover:bg-muted">Laporan</a>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <Button asChild variant="outline">
                  <Link to="/auth">Masuk</Link>
                </Button>
                <Button asChild>
                  <Link to="/auth">Mulai</Link>
                </Button>
              </div>
              <div className="mt-1">
                <InstallAppButton variant="outline" size="default" className="w-full" label="Instal Aplikasi" />
              </div>
            </nav>
          </div>
        )}
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        {/* dekorasi gradien */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-32 right-0 size-96 rounded-full bg-teal-200/30 blur-3xl" />
          <div className="absolute top-40 -left-24 size-80 rounded-full bg-sky-200/40 blur-3xl" />
          <div className="absolute right-1/3 -bottom-24 size-72 rounded-full bg-emerald-200/30 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 pt-20 pb-16 sm:px-6 lg:pt-28 lg:pb-24">
          <div className="mx-auto max-w-3xl text-center">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-3.5 py-1.5 text-xs font-semibold text-teal-700">
                <Sparkles className="size-3.5" />
                Sistem Manajemen Bisnis Terpadu
              </div>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.08 }}
              className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl"
            >
              Kelola Bisnis <span className="text-teal-600">Dapur Laut</span> dalam Satu Aplikasi
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.16 }}
              className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg"
            >
              Dari invoice multi-barang, gudang & stok, kas harian, absensi, utang karyawan, hingga slip gaji dan
              laporan keuangan — semua terotomatisasi, akurat, dan siap cetak PDF dengan branding resmi perusahaan.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.24 }}
              className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row"
            >
              <Button asChild size="lg" className="w-full sm:w-auto">
                <Link to="/auth">
                  Buka Aplikasi
                  <ArrowRight className="ml-2 size-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="w-full sm:w-auto">
                <Link to="/auth">Lihat Dashboard Demo</Link>
              </Button>
              <InstallAppButton className="w-full sm:w-auto" />
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.35 }}
              className="mt-6 flex items-center justify-center gap-1.5 text-xs text-muted-foreground"
            >
              <ShieldCheck className="size-3.5 text-emerald-600" />
              Validasi otomatis setiap transaksi · Tanpa duplikasi data · Bisa dipasang di Android, iPhone & PC
            </motion.p>
          </div>

          {/* Statistik */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.35 }}
            className="mx-auto mt-16 grid max-w-4xl grid-cols-2 gap-3 sm:grid-cols-4"
          >
            {STATS.map((s) => (
              <div key={s.label} className="rounded-2xl border bg-card p-5 text-center shadow-sm">
                <p className="text-2xl font-bold tracking-tight text-teal-600">{s.value}</p>
                <p className="mt-1 text-xs font-medium text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Fitur */}
      <section id="fitur" className="border-t bg-card/40 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-bold tracking-widest text-teal-600 uppercase">Fitur Unggulan</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              Semua Kebutuhan Operasional, Terotomasi
            </h2>
            <p className="mt-4 text-muted-foreground">
              Setiap transaksi langsung memperbarui stok, kas, dan laporan — tanpa input ulang.
            </p>
          </div>

          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
                className="group rounded-2xl border bg-card p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className={cn("mb-4 flex size-11 items-center justify-center rounded-xl", f.tone)}>
                  <f.icon className="size-5" />
                </div>
                <h3 className="text-base font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Modul */}
      <section id="modul" className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <p className="text-xs font-bold tracking-widest text-teal-600 uppercase">16 Modul Lengkap</p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
                Dari Barang hingga Laporan, Satu Navigasi
              </h2>
              <p className="mt-4 leading-relaxed text-muted-foreground">
                Sidebar terorganisir memudahkan akses ke setiap modul: master data, transaksi, operasional,
                SDM, hingga analisis. Semua form mendukung input multi-barang dan filter tanggal.
              </p>
              <ul className="mt-6 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                {[
                  "Barang, Supplier, Reseller",
                  "DPL & Pasar (Victoria/Tunas)",
                  "Invoice Multi-Barang",
                  "Retur Barang",
                  "Gudang & Riwayat Stok",
                  "Kas Harian",
                  "Absensi Harian",
                  "Utang & Casbon Karyawan",
                  "Slip Gaji Otomatis",
                  "Pengeluaran",
                  "Laporan & Rekap",
                  "Analisis Margin",
                ].map((m) => (
                  <li key={m} className="flex items-center gap-2">
                    <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                      <Ship className="size-2.5" />
                    </span>
                    <span className="text-muted-foreground">{m}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="relative">
              <div className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-teal-100 via-sky-50 to-emerald-100 blur-2xl" />
              <div className="relative rounded-2xl border bg-card p-6 shadow-xl">
                <div className="mb-4 flex items-center gap-2 border-b pb-4">
                  <LogoMark className="size-8" />
                  <div>
                    <p className="text-sm font-bold">Dashboard Dapur Laut</p>
                    <p className="text-[10px] text-muted-foreground">Ringkasan kas, stok & margin</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border bg-muted/30 p-4">
                    <p className="text-[10px] font-medium text-muted-foreground uppercase">Saldo Kas</p>
                    <p className="mt-1 text-lg font-bold text-teal-700 tabular-nums">Rp 12.480.000</p>
                    <div className="mt-3 h-10 rounded-md bg-gradient-to-r from-teal-400/60 via-sky-400/50 to-teal-400/60" />
                  </div>
                  <div className="rounded-xl border bg-muted/30 p-4">
                    <p className="text-[10px] font-medium text-muted-foreground uppercase">Margin Bulan Ini</p>
                    <p className="mt-1 text-lg font-bold text-sky-700 tabular-nums">Rp 3.250.000</p>
                    <div className="mt-3 h-10 rounded-md bg-gradient-to-r from-emerald-400/60 via-teal-400/50 to-emerald-400/60" />
                  </div>
                  <div className="col-span-2 rounded-xl border bg-muted/30 p-4">
                    <p className="mb-2 text-[10px] font-medium text-muted-foreground uppercase">Kas 14 Hari Terakhir</p>
                    <div className="flex h-16 items-end gap-1.5">
                      {[35, 55, 40, 70, 45, 60, 80, 50, 65, 42, 72, 58, 88, 66].map((h, i) => (
                        <div key={i} className="flex-1 rounded-t bg-gradient-to-t from-teal-500/70 to-sky-400/70" style={{ height: `${h}%` }} />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Laporan */}
      <section id="laporan" className="border-t bg-card/40 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div className="order-2 lg:order-1">
              <div className="rounded-2xl border bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between border-b pb-3">
                  <div>
                    <p className="text-sm font-bold text-slate-900">Laporan Keuangan</p>
                    <p className="text-[10px] text-slate-500">Dapur Laut · Periode bulan ini</p>
                  </div>
                  <span className="rounded-full bg-teal-100 px-2.5 py-1 text-[10px] font-bold text-teal-700">PDF READY</span>
                </div>
                <div className="mt-4 space-y-2 text-sm">
                  <div className="flex justify-between rounded-lg bg-sky-50 px-3 py-2">
                    <span className="text-sky-800">Pendapatan</span>
                    <span className="font-semibold text-sky-700 tabular-nums">Rp 8.450.000</span>
                  </div>
                  <div className="flex justify-between rounded-lg bg-rose-50 px-3 py-2">
                    <span className="text-rose-800">Pengeluaran</span>
                    <span className="font-semibold text-rose-700 tabular-nums">Rp 5.200.000</span>
                  </div>
                  <div className="flex justify-between rounded-lg bg-emerald-50 px-3 py-2">
                    <span className="text-emerald-800">Laba Bersih</span>
                    <span className="font-bold text-emerald-700 tabular-nums">Rp 3.250.000</span>
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-2 border-t pt-3 text-[10px] text-slate-400">
                  <CalendarCheck className="size-3.5" />
                  Stok, rekap barang/pihak, dan analisis margin juga dapat dicetak.
                </div>
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <p className="text-xs font-bold tracking-widest text-teal-600 uppercase">Cetak PDF</p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
                Dokumen Resmi dengan Branding Dapur Laut
              </h2>
              <p className="mt-4 leading-relaxed text-muted-foreground">
                Invoice, slip gaji, dan laporan dicetak dalam format rapi dengan logo, tabel multi-baris, total,
                margin, dan kolom tanda tangan — siap diarsipkan atau dibagikan.
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                {["Invoice Multi-Baris", "Slip Gaji", "Laporan Stok", "Rekap Per Pihak", "Analisis Margin"].map((t) => (
                  <span key={t} className="rounded-full border bg-white px-3 py-1.5 text-xs font-medium text-muted-foreground">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-teal-700 via-teal-600 to-sky-700 px-6 py-14 text-center text-white shadow-xl">
            <div className="pointer-events-none absolute -top-16 right-0 size-64 rounded-full bg-white/10 blur-2xl" />
            <div className="pointer-events-none absolute -bottom-20 left-0 size-72 rounded-full bg-sky-300/20 blur-2xl" />
            <Ship className="mx-auto size-10 opacity-80" />
            <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
              Siap Mengelola Bisnis Dapur Laut Anda?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-sm text-teal-50/90 sm:text-base">
              Mulai sekarang — data contoh otomatis dimuat agar Anda langsung bisa menjelajahi semua modul.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button
                asChild
                size="lg"
                className="bg-white text-teal-800 shadow-lg hover:bg-teal-50"
              >
                <Link to="/auth">
                  Buka Aplikasi Sekarang
                  <ArrowRight className="ml-2 size-4" />
                </Link>
              </Button>
              <InstallAppButton variant="secondary" className="border-white/30 bg-white/10 text-white hover:bg-white/20" />
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6">
          <div className="flex items-center gap-2.5">
            <LogoMark className="size-7" />
            <p className="text-sm font-semibold">Dapur Laut</p>
          </div>
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Dapur Laut · Sistem Manajemen Bisnis Terpadu
          </p>
        </div>
      </footer>
    </div>
  );
}
