import { useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { BarChart3, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { PageHeader, SectionCard, BadgeStatus } from "@/components/app/ui";
import { PrintFrame, SignatureRow } from "@/components/app/PrintFrame";
import { formatRupiah, formatDate, formatMonth, formatNum } from "@/lib/format";
import { cn } from "@/lib/utils";

type Tab = "stok" | "keuangan" | "rekapBarang" | "rekapPihak" | "margin";

export default function LaporanPage() {
  const [tab, setTab] = useState<Tab>("stok");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [printTab, setPrintTab] = useState<Tab | null>(null);

  const laporanStok = useQuery(api.queries.laporanStok);
  const keuangan = useQuery(api.queries.laporanKeuangan, { from: from || undefined, to: to || undefined });
  const rekapBarang = useQuery(api.queries.rekapBarang, { from: from || undefined, to: to || undefined });
  const rekapPihak = useQuery(api.queries.rekapPihak, { from: from || undefined, to: to || undefined });
  const margin = useQuery(api.queries.analisisMargin, { from: from || undefined, to: to || undefined });
  const karyawan = useQuery(api.queries.listKaryawan);

  const namaKaryawan = (id: string) => karyawan?.find((k: any) => k.id === id)?.nama ?? id;

  const periodLabel = useMemo(() => {
    if (!from && !to) return "Semua periode";
    return `${from || "awal"} — ${to || "sekarang"}`;
  }, [from, to]);

  const th = "border border-slate-200 px-2 py-1.5 text-left text-xs text-slate-600 uppercase";
  const thr = "border border-slate-200 px-2 py-1.5 text-right text-xs text-slate-600 uppercase";
  const td = "border border-slate-200 px-2 py-1.5 text-[13px]";
  const tdr = "border border-slate-200 px-2 py-1.5 text-right text-[13px] tabular-nums";

  return (
    <div>
      <PageHeader
        title="Laporan & Rekap"
        description="Laporan stok, keuangan, rekap barang, rekap per pihak, dan analisis margin — dapat dicetak sebagai PDF."
        icon={BarChart3}
        actions={
          <Button onClick={() => setPrintTab(tab)}>
            <Printer className="mr-2 size-4" />
            Cetak Laporan Ini
          </Button>
        }
      />

      <div className="mb-4 flex flex-wrap items-end gap-2">
        <div>
          <Label className="text-xs font-medium">Dari</Label>
          <Input type="date" className="mt-1.5 w-40" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div>
          <Label className="text-xs font-medium">Sampai</Label>
          <Input type="date" className="mt-1.5 w-40" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
        {(from || to) && (
          <Button variant="ghost" size="sm" onClick={() => { setFrom(""); setTo(""); }}>
            Reset
          </Button>
        )}
        <span className="ml-auto text-xs text-muted-foreground">{periodLabel}</span>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)}>
        <TabsList className="flex-wrap">
          <TabsTrigger value="stok">Laporan Stok</TabsTrigger>
          <TabsTrigger value="keuangan">Keuangan</TabsTrigger>
          <TabsTrigger value="rekapBarang">Rekap Barang</TabsTrigger>
          <TabsTrigger value="rekapPihak">Rekap Pihak</TabsTrigger>
          <TabsTrigger value="margin">Analisis Margin</TabsTrigger>
        </TabsList>

        {/* Stok */}
        <TabsContent value="stok">
          <SectionCard title="Laporan Stok Gudang" description="Posisi stok saat ini berdasarkan riwayat perubahan">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className={th}>Barang</th>
                    <th className={thr}>Stok Awal</th>
                    <th className={thr}>Masuk</th>
                    <th className={thr}>Keluar</th>
                    <th className={thr}>Stok Akhir</th>
                  </tr>
                </thead>
                <tbody>
                  {(laporanStok ?? []).map((r: any) => (
                    <tr key={r.namaBarang}>
                      <td className={td + " font-medium"}>{r.namaBarang}</td>
                      <td className={tdr}>{formatNum(r.stokAwal)}</td>
                      <td className={tdr + " text-emerald-600"}>+{formatNum(r.stokMasuk)}</td>
                      <td className={tdr + " text-rose-600"}>-{formatNum(r.stokKeluar)}</td>
                      <td className={cn(tdr, "font-bold", r.stokAkhir < 0 ? "text-rose-600" : "text-emerald-700")}>{formatNum(r.stokAkhir)}</td>
                    </tr>
                  ))}
                  {(laporanStok ?? []).length === 0 && (
                    <tr>
                      <td colSpan={5} className={td + " text-center text-muted-foreground"}>Gudang kosong.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </SectionCard>
        </TabsContent>

        {/* Keuangan */}
        <TabsContent value="keuangan">
          <div className="grid gap-3 md:grid-cols-3">
            <SectionCard title="Pendapatan" className="border-sky-200">
              <p className="text-2xl font-bold text-sky-600 tabular-nums">{formatRupiah(keuangan?.pendapatan.total)}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Reseller {formatRupiah(keuangan?.pendapatan.reseller)} · DPL {formatRupiah(keuangan?.pendapatan.dpl)} · Pasar {formatRupiah(keuangan?.pendapatan.pasar)}
              </p>
            </SectionCard>
            <SectionCard title="Pengeluaran" className="border-rose-200">
              <p className="text-2xl font-bold text-rose-600 tabular-nums">{formatRupiah(keuangan?.pengeluaran.total)}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Manual {formatRupiah(keuangan?.pengeluaran.manual)} · Pembelian {formatRupiah(keuangan?.pengeluaran.invoiceSupplier)} · Gaji {formatRupiah(keuangan?.pengeluaran.slipGaji)}
              </p>
            </SectionCard>
            <SectionCard title="Laba Bersih" className={cn(keuangan && keuangan.laba >= 0 ? "border-emerald-200" : "border-rose-200")}>
              <p className={cn("text-2xl font-bold tabular-nums", keuangan && keuangan.laba >= 0 ? "text-emerald-600" : "text-rose-600")}>
                {formatRupiah(keuangan?.laba)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">Pendapatan − Pengeluaran</p>
            </SectionCard>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <SectionCard title="Rincian Pendapatan">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      <th className={th}>Tanggal</th>
                      <th className={th}>Tipe</th>
                      <th className={th}>Pihak</th>
                      <th className={thr}>Nominal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(keuangan?.rincianPendapatan ?? []).map((r: any) => (
                      <tr key={r.id}>
                        <td className={td}>{formatDate(r.tanggal)}</td>
                        <td className={td}><BadgeStatus status={r.tipe} /></td>
                        <td className={td}>{r.pihak}</td>
                        <td className={tdr + " text-sky-700"}>{formatRupiah(r.nominal)}</td>
                      </tr>
                    ))}
                    {(keuangan?.rincianPendapatan ?? []).length === 0 && (
                      <tr><td colSpan={4} className={td + " text-center text-muted-foreground"}>Tidak ada pendapatan.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </SectionCard>
            <SectionCard title="Rincian Pengeluaran">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      <th className={th}>Tanggal</th>
                      <th className={th}>Tipe</th>
                      <th className={th}>Pihak</th>
                      <th className={thr}>Nominal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(keuangan?.rincianPengeluaran ?? []).map((r: any) => (
                      <tr key={r.id}>
                        <td className={td}>{formatDate(r.tanggal)}</td>
                        <td className={td}><BadgeStatus status={r.tipe} /></td>
                        <td className={td}>{r.tipe === "Slip Gaji" ? namaKaryawan(r.pihak) : r.pihak}</td>
                        <td className={tdr + " text-rose-700"}>{formatRupiah(r.nominal)}</td>
                      </tr>
                    ))}
                    {(keuangan?.rincianPengeluaran ?? []).length === 0 && (
                      <tr><td colSpan={4} className={td + " text-center text-muted-foreground"}>Tidak ada pengeluaran.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </SectionCard>
          </div>
        </TabsContent>

        {/* Rekap barang */}
        <TabsContent value="rekapBarang">
          <SectionCard title="Rekap Barang Keluar/Masuk" description={`Semua pergerakan stok · ${periodLabel}`}>
            <div className="mb-3 flex gap-4 text-sm">
              <span className="text-emerald-600 font-medium">Total Masuk: {formatNum(rekapBarang?.totalMasuk ?? 0)}</span>
              <span className="text-rose-600 font-medium">Total Keluar: {formatNum(rekapBarang?.totalKeluar ?? 0)}</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className={th}>Barang</th>
                    <th className={thr}>Masuk</th>
                    <th className={thr}>Keluar</th>
                    <th className={thr}>Net</th>
                  </tr>
                </thead>
                <tbody>
                  {(rekapBarang?.rows ?? []).map((r: any) => (
                    <tr key={r.namaBarang}>
                      <td className={td + " font-medium"}>{r.namaBarang}</td>
                      <td className={tdr + " text-emerald-600"}>+{formatNum(r.masuk)}</td>
                      <td className={tdr + " text-rose-600"}>-{formatNum(r.keluar)}</td>
                      <td className={cn(tdr, "font-semibold", r.net >= 0 ? "text-emerald-700" : "text-rose-600")}>{r.net > 0 ? `+${formatNum(r.net)}` : formatNum(r.net)}</td>
                    </tr>
                  ))}
                  {(rekapBarang?.rows ?? []).length === 0 && (
                    <tr><td colSpan={4} className={td + " text-center text-muted-foreground"}>Tidak ada pergerakan stok pada periode ini.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </SectionCard>
        </TabsContent>

        {/* Rekap pihak */}
        <TabsContent value="rekapPihak">
          <SectionCard title="Rekap Per Pihak" description="Total transaksi, total barang, dan total nilai per Supplier/Reseller/DPL/Pasar">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className={th}>Tipe</th>
                    <th className={th}>Pihak</th>
                    <th className={thr}>Jml Transaksi</th>
                    <th className={thr}>Jml Barang</th>
                    <th className={thr}>Total Nilai</th>
                  </tr>
                </thead>
                <tbody>
                  {(rekapPihak ?? []).map((r: any) => (
                    <tr key={`${r.tipe}-${r.namaPihak}`}>
                      <td className={td}><BadgeStatus status={r.tipe} /></td>
                      <td className={td + " font-medium"}>{r.namaPihak}</td>
                      <td className={tdr}>{r.totalTransaksi}</td>
                      <td className={tdr}>{formatNum(r.totalBarang)}</td>
                      <td className={tdr + " font-semibold"}>{formatRupiah(r.totalNilai)}</td>
                    </tr>
                  ))}
                  {(rekapPihak ?? []).length === 0 && (
                    <tr><td colSpan={5} className={td + " text-center text-muted-foreground"}>Belum ada transaksi pada periode ini.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </SectionCard>
        </TabsContent>

        {/* Margin */}
        <TabsContent value="margin">
          <div className="grid gap-4 lg:grid-cols-3">
            <SectionCard title="Margin per Produk" className="lg:col-span-3">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      <th className={th}>Kode</th>
                      <th className={th}>Produk</th>
                      <th className={thr}>Total Modal</th>
                      <th className={thr}>Total Penjualan</th>
                      <th className={thr}>Margin</th>
                      <th className={thr}>Margin %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(margin?.perProduk ?? []).map((r: any) => (
                      <tr key={r.kodeBarang}>
                        <td className={td}>{r.kodeBarang}</td>
                        <td className={td + " font-medium"}>{r.namaBarang}</td>
                        <td className={tdr}>{formatRupiah(r.totalModal)}</td>
                        <td className={tdr}>{formatRupiah(r.totalPenjualan)}</td>
                        <td className={cn(tdr, "font-semibold", r.margin >= 0 ? "text-emerald-600" : "text-rose-600")}>{formatRupiah(r.margin)}</td>
                        <td className={tdr + " font-semibold"}>{r.marginPct}%</td>
                      </tr>
                    ))}
                    {(margin?.perProduk ?? []).length === 0 && (
                      <tr><td colSpan={6} className={td + " text-center text-muted-foreground"}>Belum ada data margin.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </SectionCard>

            <SectionCard title="Margin per Pasar">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr><th className={th}>Pasar</th><th className={thr}>Margin</th><th className={thr}>%</th></tr>
                  </thead>
                  <tbody>
                    {(margin?.perPasar ?? []).map((r: any) => (
                      <tr key={r.pihak}>
                        <td className={td + " font-medium"}>{r.pihak}</td>
                        <td className={tdr + " text-emerald-600"}>{formatRupiah(r.margin)}</td>
                        <td className={tdr}>{r.marginPct}%</td>
                      </tr>
                    ))}
                    {(margin?.perPasar ?? []).length === 0 && (
                      <tr><td colSpan={3} className={td + " text-center text-muted-foreground"}>Tidak ada data.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </SectionCard>

            <SectionCard title="Margin per Reseller">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr><th className={th}>Reseller</th><th className={thr}>Margin</th><th className={thr}>%</th></tr>
                  </thead>
                  <tbody>
                    {(margin?.perReseller ?? []).map((r: any) => (
                      <tr key={r.pihak}>
                        <td className={td + " font-medium"}>{r.pihak}</td>
                        <td className={tdr + " text-emerald-600"}>{formatRupiah(r.margin)}</td>
                        <td className={tdr}>{r.marginPct}%</td>
                      </tr>
                    ))}
                    {(margin?.perReseller ?? []).length === 0 && (
                      <tr><td colSpan={3} className={td + " text-center text-muted-foreground"}>Tidak ada data.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </SectionCard>
          </div>
        </TabsContent>
      </Tabs>

      {/* Print dokumen laporan */}
      <PrintFrame
        open={!!printTab}
        onClose={() => setPrintTab(null)}
        title={`Laporan ${printTab ?? ""} — Dapur Laut`}
      >
        {printTab === "stok" && (
          <LaporanDoc title="Laporan Stok Gudang" period={periodLabel}>
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className={th}>Barang</th>
                  <th className={thr}>Stok Awal</th>
                  <th className={thr}>Masuk</th>
                  <th className={thr}>Keluar</th>
                  <th className={thr}>Stok Akhir</th>
                </tr>
              </thead>
              <tbody>
                {(laporanStok ?? []).map((r: any) => (
                  <tr key={r.namaBarang}>
                    <td className={td + " font-medium"}>{r.namaBarang}</td>
                    <td className={tdr}>{formatNum(r.stokAwal)}</td>
                    <td className={tdr}>{formatNum(r.stokMasuk)}</td>
                    <td className={tdr}>{formatNum(r.stokKeluar)}</td>
                    <td className={tdr + " font-bold"}>{formatNum(r.stokAkhir)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </LaporanDoc>
        )}
        {printTab === "keuangan" && (
          <LaporanDoc title="Laporan Keuangan" period={periodLabel}>
            <div className="mb-4 grid grid-cols-3 gap-3 text-center">
              <div className="rounded-md border border-sky-200 bg-sky-50 p-3">
                <p className="text-xs text-slate-500">Pendapatan</p>
                <p className="text-lg font-bold text-sky-700 tabular-nums">{formatRupiah(keuangan?.pendapatan.total)}</p>
              </div>
              <div className="rounded-md border border-rose-200 bg-rose-50 p-3">
                <p className="text-xs text-slate-500">Pengeluaran</p>
                <p className="text-lg font-bold text-rose-700 tabular-nums">{formatRupiah(keuangan?.pengeluaran.total)}</p>
              </div>
              <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3">
                <p className="text-xs text-slate-500">Laba</p>
                <p className="text-lg font-bold text-emerald-700 tabular-nums">{formatRupiah(keuangan?.laba)}</p>
              </div>
            </div>
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className={th}>Tanggal</th>
                  <th className={th}>Tipe</th>
                  <th className={th}>Pihak</th>
                  <th className={thr}>Nominal</th>
                </tr>
              </thead>
              <tbody>
                {(keuangan?.rincianPendapatan ?? []).map((r: any) => (
                  <tr key={`p-${r.id}`}>
                    <td className={td}>{formatDate(r.tanggal)}</td>
                    <td className={td}>{r.tipe}</td>
                    <td className={td}>{r.pihak}</td>
                    <td className={tdr}>{formatRupiah(r.nominal)}</td>
                  </tr>
                ))}
                {(keuangan?.rincianPengeluaran ?? []).map((r: any) => (
                  <tr key={`k-${r.id}`}>
                    <td className={td}>{formatDate(r.tanggal)}</td>
                    <td className={td}>{r.tipe}</td>
                    <td className={td}>{r.tipe === "Slip Gaji" ? namaKaryawan(r.pihak) : r.pihak}</td>
                    <td className={tdr}>{formatRupiah(r.nominal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </LaporanDoc>
        )}
        {printTab === "rekapBarang" && (
          <LaporanDoc title="Rekap Barang Keluar/Masuk" period={periodLabel}>
            <table className="w-full border-collapse">
              <thead>
                <tr><th className={th}>Barang</th><th className={thr}>Masuk</th><th className={thr}>Keluar</th><th className={thr}>Net</th></tr>
              </thead>
              <tbody>
                {(rekapBarang?.rows ?? []).map((r: any) => (
                  <tr key={r.namaBarang}>
                    <td className={td + " font-medium"}>{r.namaBarang}</td>
                    <td className={tdr}>{formatNum(r.masuk)}</td>
                    <td className={tdr}>{formatNum(r.keluar)}</td>
                    <td className={tdr + " font-bold"}>{formatNum(r.net)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </LaporanDoc>
        )}
        {printTab === "rekapPihak" && (
          <LaporanDoc title="Rekap Per Pihak" period={periodLabel}>
            <table className="w-full border-collapse">
              <thead>
                <tr><th className={th}>Tipe</th><th className={th}>Pihak</th><th className={thr}>Jml Transaksi</th><th className={thr}>Jml Barang</th><th className={thr}>Total Nilai</th></tr>
              </thead>
              <tbody>
                {(rekapPihak ?? []).map((r: any) => (
                  <tr key={`${r.tipe}-${r.namaPihak}`}>
                    <td className={td}>{r.tipe}</td>
                    <td className={td + " font-medium"}>{r.namaPihak}</td>
                    <td className={tdr}>{r.totalTransaksi}</td>
                    <td className={tdr}>{formatNum(r.totalBarang)}</td>
                    <td className={tdr + " font-bold"}>{formatRupiah(r.totalNilai)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </LaporanDoc>
        )}
        {printTab === "margin" && (
          <LaporanDoc title="Analisis Margin" period={periodLabel}>
            <h3 className="mb-2 text-sm font-bold">Margin per Produk</h3>
            <table className="mb-6 w-full border-collapse">
              <thead>
                <tr><th className={th}>Produk</th><th className={thr}>Modal</th><th className={thr}>Penjualan</th><th className={thr}>Margin</th><th className={thr}>%</th></tr>
              </thead>
              <tbody>
                {(margin?.perProduk ?? []).map((r: any) => (
                  <tr key={r.kodeBarang}>
                    <td className={td}>{r.namaBarang}</td>
                    <td className={tdr}>{formatRupiah(r.totalModal)}</td>
                    <td className={tdr}>{formatRupiah(r.totalPenjualan)}</td>
                    <td className={tdr + " font-semibold"}>{formatRupiah(r.margin)}</td>
                    <td className={tdr}>{r.marginPct}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <h3 className="mb-2 text-sm font-bold">Margin per Pasar</h3>
            <table className="mb-6 w-full border-collapse">
              <thead>
                <tr><th className={th}>Pasar</th><th className={thr}>Margin</th><th className={thr}>%</th></tr>
              </thead>
              <tbody>
                {(margin?.perPasar ?? []).map((r: any) => (
                  <tr key={r.pihak}>
                    <td className={td}>{r.pihak}</td>
                    <td className={tdr}>{formatRupiah(r.margin)}</td>
                    <td className={tdr}>{r.marginPct}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <h3 className="mb-2 text-sm font-bold">Margin per Reseller</h3>
            <table className="w-full border-collapse">
              <thead>
                <tr><th className={th}>Reseller</th><th className={thr}>Margin</th><th className={thr}>%</th></tr>
              </thead>
              <tbody>
                {(margin?.perReseller ?? []).map((r: any) => (
                  <tr key={r.pihak}>
                    <td className={td}>{r.pihak}</td>
                    <td className={tdr}>{formatRupiah(r.margin)}</td>
                    <td className={tdr}>{r.marginPct}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </LaporanDoc>
        )}
      </PrintFrame>
    </div>
  );
}

function LaporanDoc({ title, period, children }: { title: string; period: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-4 flex items-center justify-between text-sm">
        <div>
          <p className="text-xs text-slate-500">Laporan Resmi</p>
          <p className="text-lg font-bold text-slate-900">{title}</p>
        </div>
        <div className="text-right text-xs text-slate-500">
          <p>Periode: {period}</p>
          <p>Tgl Cetak: {formatDate(new Date().toISOString().slice(0, 10))}</p>
        </div>
      </div>
      {children}
      <div className="mt-10">
        <SignatureRow label="Mengetahui" />
      </div>
    </div>
  );
}
