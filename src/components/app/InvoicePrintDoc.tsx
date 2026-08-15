import { formatDate, parseNum, formatNum, roundNum } from "@/lib/format";
import { formatCurrency, type MataUang } from "@/lib/business";
import { invoiceTotal, invoiceDibayar, invoiceSisa } from "@/lib/invoice";

/** Margin satu baris (khusus Pasar): (harga jual − harga modal) × terjual. */
function rowMargin(it: any): number {
  const terjual = parseNum(it.stokAwal) - parseNum(it.stokAkhir);
  return roundNum(terjual * (parseNum(it.hargaJual) - parseNum(it.hargaModal)));
}

/** Margin total invoice Pasar: jumlah margin semua baris. */
function totalMargin(invoice: any): number {
  return (invoice.items ?? []).reduce((s: number, it: any) => s + rowMargin(it), 0);
}

export function InvoicePrintDoc({ invoice }: { invoice: any }) {
  const mu: MataUang = invoice.mataUang === "$" ? "$" : "Rp";
  const dibayar = invoiceDibayar(invoice);
  const sisa = invoiceSisa(invoice);
  const lunas = sisa <= 0;
  const isPasar = invoice.tipe === "Pasar";
  const margin = isPasar ? totalMargin(invoice) : 0;
  return (
    <div className="relative">
      {/* Watermark status pembayaran (BELUM LUNAS / LUNAS) */}
      <div className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center">
        <div
          className={`-rotate-12 rounded-xl border-4 px-5 py-3 text-2xl font-black uppercase tracking-[0.25em] opacity-20 sm:px-8 sm:py-4 sm:text-3xl ${
            lunas ? "border-emerald-600 text-emerald-600" : "border-rose-600 text-rose-600"
          }`}
        >
          {lunas ? "LUNAS" : "BELUM LUNAS"}
        </div>
      </div>

      <div className="relative z-10">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 text-sm">
          <div>
            <p className="text-xs text-slate-500">Nomor Invoice</p>
            <p className="text-lg font-bold text-slate-900">{invoice.idInvoice}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-500">Tanggal</p>
            <p className="font-semibold">{formatDate(invoice.tanggal)}</p>
          </div>
        </div>

        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-md bg-slate-50 px-4 py-3 text-sm">
          <div>
            <p className="text-xs text-slate-500">Tipe Transaksi</p>
            <p className="font-semibold">{invoice.tipe}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Pihak</p>
            <p className="font-semibold">{invoice.namaPihak}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Mata Uang</p>
            <p className="font-semibold">{mu}</p>
          </div>
          {invoice.tenggat && (
            <div>
              <p className="text-xs text-slate-500">Tenggat Pembayaran</p>
              <p className="font-semibold">{formatDate(invoice.tenggat)}</p>
            </div>
          )}
          <div>
            <p className="text-xs text-slate-500">Status Pembayaran</p>
            <p className={`font-semibold ${lunas ? "text-emerald-700" : "text-rose-600"}`}>
              {lunas ? "Lunas" : "Belum Lunas"}
            </p>
          </div>
        </div>

        {/* Ringkasan pembayaran */}
        <div className="mb-4 grid grid-cols-3 gap-1.5 text-sm sm:gap-2">
          <div className="rounded-md border border-slate-200 px-2 py-2 sm:px-3">
            <p className="text-[11px] text-slate-500 sm:text-xs">Total Tagihan</p>
            <p className="font-bold tabular-nums">{formatCurrency(invoiceTotal(invoice), mu)}</p>
          </div>
          <div className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-2 sm:px-3">
            <p className="text-[11px] text-emerald-700 sm:text-xs">Sudah Dibayar</p>
            <p className="font-bold text-emerald-700 tabular-nums">{formatCurrency(dibayar, mu)}</p>
          </div>
          <div className={`rounded-md border px-2 py-2 sm:px-3 ${lunas ? "border-emerald-200 bg-emerald-50" : "border-rose-200 bg-rose-50"}`}>
            <p className={`text-[11px] sm:text-xs ${lunas ? "text-emerald-700" : "text-rose-600"}`}>Sisa Tagihan</p>
            <p className={`font-bold tabular-nums ${lunas ? "text-emerald-700" : "text-rose-600"}`}>{formatCurrency(sisa, mu)}</p>
          </div>
        </div>

        {/* Riwayat pembayaran */}
        {Array.isArray(invoice.riwayatBayar) && invoice.riwayatBayar.length > 0 && (
          <div className="mb-4 rounded-md border border-slate-200 px-4 py-2 text-sm">
            <p className="mb-1 text-xs font-semibold text-slate-500">Riwayat Pembayaran</p>
            {invoice.riwayatBayar.map((r: any, i: number) => (
              <div key={i} className="flex justify-between border-t border-slate-100 py-1 text-xs first:border-0">
                <span className="text-slate-600">
                  {formatDate(r.tanggal)}
                  {r.keterangan ? ` · ${r.keterangan}` : ""}
                </span>
                <span className="font-semibold tabular-nums">{formatCurrency(r.nominal, mu)}</span>
              </div>
            ))}
          </div>
        )}

        {/* Tabel barang — geser horizontal tetap lancar di Android (touch-pan-x) */}
        <div className="overflow-x-auto touch-pan-x overscroll-x-contain [-webkit-overflow-scrolling:touch]">
          <table className="w-full min-w-[580px] border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="bg-slate-100 text-left text-xs text-slate-600 uppercase">
                <th className="border border-slate-200 px-1.5 py-1.5 sm:px-2 sm:py-2">No</th>
                <th className="border border-slate-200 px-1.5 py-1.5 sm:px-2 sm:py-2">Kode</th>
                <th className="border border-slate-200 px-1.5 py-1.5 sm:px-2 sm:py-2">Nama Barang</th>
                {isPasar ? (
                  <>
                    <th className="border border-slate-200 px-1.5 py-1.5 text-right sm:px-2 sm:py-2">Stok Awal</th>
                    <th className="border border-slate-200 px-1.5 py-1.5 text-right sm:px-2 sm:py-2">Stok Akhir</th>
                    <th className="border border-slate-200 px-1.5 py-1.5 text-right sm:px-2 sm:py-2">Terjual</th>
                    <th className="border border-slate-200 px-1.5 py-1.5 text-right sm:px-2 sm:py-2">Harga Modal</th>
                    <th className="border border-slate-200 px-1.5 py-1.5 text-right sm:px-2 sm:py-2">Harga Jual</th>
                  </>
                ) : (
                  <>
                    <th className="border border-slate-200 px-1.5 py-1.5 text-right sm:px-2 sm:py-2">Qty</th>
                    <th className="border border-slate-200 px-1.5 py-1.5 text-right sm:px-2 sm:py-2">Harga</th>
                  </>
                )}
                <th className="border border-slate-200 px-1.5 py-1.5 text-right sm:px-2 sm:py-2">Subtotal</th>
                {isPasar && (
                  <th className="border border-slate-200 px-1.5 py-1.5 text-right sm:px-2 sm:py-2">Margin</th>
                )}
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((it: any, i: number) => {
                const terjual = isPasar
                  ? parseNum(it.stokAwal) - parseNum(it.stokAkhir)
                  : it.qty;
                const harga = invoice.tipe === "Supplier" ? it.hargaModal : it.hargaJual;
                const hasStored = it.subtotal != null && String(it.subtotal).trim() !== "";
                // Fallback kalau subtotal tidak tersimpan (data lama): hitung ulang.
                // Pasar: subtotal tersimpan bisa NEGATIF (terjual minus) — dipakai apa adanya.
                const subtotal = hasStored ? parseNum(it.subtotal) : Math.max(0, roundNum(parseNum(terjual) * parseNum(harga)));
                const m = isPasar ? rowMargin(it) : 0;
                return (
                  <tr key={i}>
                    <td className="border border-slate-200 px-1.5 py-1 sm:px-2 sm:py-1.5">{i + 1}</td>
                    <td className="border border-slate-200 px-1.5 py-1 sm:px-2 sm:py-1.5">{it.kodeBarang}</td>
                    <td className="border border-slate-200 px-1.5 py-1 sm:px-2 sm:py-1.5">{it.namaBarang}</td>
                    {isPasar ? (
                      <>
                        <td className="border border-slate-200 px-1.5 py-1 text-right sm:px-2 sm:py-1.5">{formatNum(it.stokAwal ?? 0)}</td>
                        <td className="border border-slate-200 px-1.5 py-1 text-right sm:px-2 sm:py-1.5">{formatNum(it.stokAkhir ?? 0)}</td>
                        <td className={`border border-slate-200 px-1.5 py-1 text-right sm:px-2 sm:py-1.5 ${terjual < 0 ? "font-bold text-rose-600" : ""}`}>{formatNum(terjual)}</td>
                        <td className="border border-slate-200 px-1.5 py-1 text-right sm:px-2 sm:py-1.5">{formatCurrency(it.hargaModal, mu)}</td>
                        <td className="border border-slate-200 px-1.5 py-1 text-right sm:px-2 sm:py-1.5">{formatCurrency(it.hargaJual, mu)}</td>
                      </>
                    ) : (
                      <>
                        <td className="border border-slate-200 px-1.5 py-1 text-right sm:px-2 sm:py-1.5">{formatNum(terjual)}</td>
                        <td className="border border-slate-200 px-1.5 py-1 text-right sm:px-2 sm:py-1.5">{formatCurrency(harga, mu)}</td>
                      </>
                    )}
                    <td className="border border-slate-200 px-1.5 py-1 text-right sm:px-2 sm:py-1.5">{formatCurrency(subtotal, mu)}</td>
                    {isPasar && (
                      <td className={`border border-slate-200 px-1.5 py-1 text-right font-semibold sm:px-2 sm:py-1.5 ${m >= 0 ? "text-sky-700" : "text-rose-600"}`}>
                        {formatCurrency(m, mu)}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Ringkasan nilai: Pasar menampilkan margin (per barang ada di kolom Margin);
            nota lain hanya total akhir. */}
        <div className="mt-4 flex justify-end">
          <div className="w-full space-y-1 text-sm sm:w-64">
            {isPasar && (
              <div className="flex justify-between text-slate-600">
                <span>Margin</span>
                <span className={`font-semibold tabular-nums ${margin >= 0 ? "text-sky-700" : "text-rose-600"}`}>
                  {formatCurrency(margin, mu)}
                </span>
              </div>
            )}
            <div className="flex justify-between text-slate-600">
              <span>Sudah Dibayar</span>
              <span className="tabular-nums">{formatCurrency(dibayar, mu)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Sisa</span>
              <span className={`font-semibold tabular-nums ${lunas ? "text-emerald-700" : "text-rose-600"}`}>
                {formatCurrency(sisa, mu)}
              </span>
            </div>
            <div className="flex justify-between border-t border-slate-300 pt-1 text-base font-bold">
              <span>Total</span>
              <span className="tabular-nums">{formatCurrency(invoice.tipe === "Supplier" ? invoice.total : invoice.totalPenjualan, mu)}</span>
            </div>
          </div>
        </div>

        <div className="mt-12">
          <div className="grid grid-cols-2 gap-8 text-sm">
            <div>
              <p>Diterima oleh,</p>
              <div className="mt-14" />
              <p className="font-semibold">____________________</p>
              <p className="text-xs text-slate-500">({invoice.namaPihak})</p>
            </div>
            <div>
              <p>Hormat kami,</p>
              <div className="mt-14" />
              <p className="font-semibold">____________________</p>
              <p className="text-xs text-slate-500">(Pimpinan Dapur Laut)</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
