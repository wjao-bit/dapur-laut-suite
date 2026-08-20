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

  // Grand total qty
  const grandQty = isPasar
    ? (invoice.items ?? []).reduce((s: number, it: any) => s + (parseNum(it.stokAwal) - parseNum(it.stokAkhir)), 0)
    : (invoice.items ?? []).reduce((s: number, it: any) => s + parseNum(it.qty), 0);

  return (
    <div className="relative">
      {/* Watermark status pembayaran (BELUM LUNAS / LUNAS) */}
      <div className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center">
        <div
          className={`-rotate-12 rounded-xl border-4 px-5 py-3 text-2xl font-black uppercase tracking-[0.25em] opacity-20 sm:px-8 sm:py-4 sm:text-3xl print:px-4 print:py-2 print:text-2xl ${
            lunas ? "border-emerald-600 text-emerald-600" : "border-rose-600 text-rose-600"
          }`}
        >
          {lunas ? "LUNAS" : "BELUM LUNAS"}
        </div>
      </div>

      <div className="relative z-10">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 text-sm print:mb-2">
          <div>
            <p className="text-xs text-slate-500">Nomor Invoice</p>
            <p className="text-lg font-bold text-slate-900">{invoice.idInvoice}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-500">Tanggal</p>
            <p className="font-semibold">{formatDate(invoice.tanggal)}</p>
          </div>
        </div>

        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-md bg-slate-50 px-4 py-3 text-sm print:mb-2 print:px-3 print:py-2">
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
        <div className="mb-4 grid grid-cols-3 gap-1.5 text-sm sm:gap-2 print:mb-2">
          <div className="rounded-md border border-slate-200 px-2 py-2 sm:px-3 print:px-2 print:py-1">
            <p className="text-[11px] text-slate-500 sm:text-xs">Total Tagihan</p>
            <p className="font-bold tabular-nums">{formatCurrency(invoiceTotal(invoice), mu)}</p>
          </div>
          <div className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-2 sm:px-3 print:px-2 print:py-1">
            <p className="text-[11px] text-emerald-700 sm:text-xs">Sudah Dibayar</p>
            <p className="font-bold text-emerald-700 tabular-nums">{formatCurrency(dibayar, mu)}</p>
          </div>
          <div className={`rounded-md border px-2 py-2 sm:px-3 print:px-2 print:py-1 ${lunas ? "border-emerald-200 bg-emerald-50" : "border-rose-200 bg-rose-50"}`}>
            <p className={`text-[11px] sm:text-xs ${lunas ? "text-emerald-700" : "text-rose-600"}`}>Sisa Tagihan</p>
            <p className={`font-bold tabular-nums ${lunas ? "text-emerald-700" : "text-rose-600"}`}>{formatCurrency(sisa, mu)}</p>
          </div>
        </div>

        {/* Riwayat pembayaran */}
        {Array.isArray(invoice.riwayatBayar) && invoice.riwayatBayar.length > 0 && (
          <div className="mb-4 rounded-md border border-slate-200 px-4 py-2 text-sm print:mb-2 print:px-3 print:py-1">
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

        {/* Tabel barang.
            LAYAR: semua kolom tampil (No, Kode, Nama, Qty, Harga, Subtotal, Margin).
            CETAK: kolom Kode & Margin DISEMBUNYIKAN → hanya: No, Nama, Qty, Harga, Subtotal. */}
        <div className="overflow-x-auto touch-pan-x overscroll-x-contain [-webkit-overflow-scrolling:touch] print:overflow-visible">
          <table className="w-full min-w-[580px] border-collapse text-xs sm:text-sm print:min-w-0 print:w-full print:table-fixed print:text-[10px]">
            {isPasar ? (
              <colgroup>
                <col className="print:w-[5%]" />
                <col className="print:hidden" />
                <col className="print:w-[22%]" />
                <col className="print:w-[10%]" />
                <col className="print:w-[10%]" />
                <col className="print:w-[10%]" />
                <col className="print:w-[12%]" />
                <col className="print:w-[12%]" />
                <col className="print:w-[13%]" />
                <col className="print:hidden" />
              </colgroup>
            ) : (
              <colgroup>
                <col className="print:w-[7%]" />
                <col className="print:hidden" />
                <col className="print:w-[40%]" />
                <col className="print:w-[12%]" />
                <col className="print:w-[18%]" />
                <col className="print:w-[23%]" />
              </colgroup>
            )}
            <thead>
              <tr className="bg-slate-100 text-left text-xs text-slate-600 uppercase">
                <th className="border border-slate-200 px-1.5 py-1.5 sm:px-2 sm:py-2 print:px-1 print:py-0.5">No</th>
                <th className="border border-slate-200 px-1.5 py-1.5 print:hidden sm:px-2 sm:py-2 print:px-1 print:py-0.5">Kode</th>
                <th className="border border-slate-200 px-1.5 py-1.5 sm:px-2 sm:py-2 print:px-1 print:py-0.5">Nama Barang</th>
                {isPasar ? (
                  <>
                    <th className="border border-slate-200 px-1.5 py-1.5 text-right sm:px-2 sm:py-2 print:px-1 print:py-0.5">Stok Awal</th>
                    <th className="border border-slate-200 px-1.5 py-1.5 text-right sm:px-2 sm:py-2 print:px-1 print:py-0.5">Stok Akhir</th>
                    <th className="border border-slate-200 px-1.5 py-1.5 text-right sm:px-2 sm:py-2 print:px-1 print:py-0.5">Terjual</th>
                    <th className="border border-slate-200 px-1.5 py-1.5 text-right sm:px-2 sm:py-2 print:px-1 print:py-0.5">Harga Modal</th>
                    <th className="border border-slate-200 px-1.5 py-1.5 text-right sm:px-2 sm:py-2 print:px-1 print:py-0.5">Harga Jual</th>
                  </>
                ) : (
                  <>
                    <th className="border border-slate-200 px-1.5 py-1.5 text-right sm:px-2 sm:py-2 print:px-1 print:py-0.5">Qty</th>
                    <th className="border border-slate-200 px-1.5 py-1.5 text-right sm:px-2 sm:py-2 print:px-1 print:py-0.5">Harga</th>
                  </>
                )}
                <th className="border border-slate-200 px-1.5 py-1.5 text-right sm:px-2 sm:py-2 print:px-1 print:py-0.5">Subtotal</th>
                {isPasar && (
                  <th className="hidden border border-slate-200 px-1.5 py-1.5 text-right print:hidden sm:px-2 sm:py-2 print:px-1 print:py-0.5">Margin</th>
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
                  <tr key={i} className="print:break-inside-avoid">
                    <td className="border border-slate-200 px-1.5 py-1 sm:px-2 sm:py-1.5 print:px-1 print:py-[2px]">{i + 1}</td>
                    <td className="border border-slate-200 px-1.5 py-1 print:hidden sm:px-2 sm:py-1.5 print:px-1 print:py-[2px] print:whitespace-nowrap">{it.kodeBarang}</td>
                    <td className="border border-slate-200 px-1.5 py-1 break-words sm:px-2 sm:py-1.5 print:px-1 print:py-[2px]">{it.namaBarang}</td>
                    {isPasar ? (
                      <>
                        <td className="border border-slate-200 px-1.5 py-1 text-right sm:px-2 sm:py-1.5 print:px-1 print:py-[2px]">{formatNum(it.stokAwal ?? 0)}</td>
                        <td className="border border-slate-200 px-1.5 py-1 text-right sm:px-2 sm:py-1.5 print:px-1 print:py-[2px]">{formatNum(it.stokAkhir ?? 0)}</td>
                        <td className={`border border-slate-200 px-1.5 py-1 text-right sm:px-2 sm:py-1.5 print:px-1 print:py-[2px] ${terjual < 0 ? "font-bold text-rose-600" : ""}`}>{formatNum(terjual)}</td>
                        <td className="border border-slate-200 px-1.5 py-1 text-right sm:px-2 sm:py-1.5 print:px-1 print:py-[2px]">{formatCurrency(it.hargaModal, mu)}</td>
                        <td className="border border-slate-200 px-1.5 py-1 text-right sm:px-2 sm:py-1.5 print:px-1 print:py-[2px]">{formatCurrency(it.hargaJual, mu)}</td>
                      </>
                    ) : (
                      <>
                        <td className="border border-slate-200 px-1.5 py-1 text-right sm:px-2 sm:py-1.5 print:px-1 print:py-[2px]">{formatNum(terjual)}</td>
                        <td className="border border-slate-200 px-1.5 py-1 text-right sm:px-2 sm:py-1.5 print:px-1 print:py-[2px]">{formatCurrency(harga, mu)}</td>
                      </>
                    )}
                    <td className="border border-slate-200 px-1.5 py-1 text-right sm:px-2 sm:py-1.5 print:px-1 print:py-[2px]">{formatCurrency(subtotal, mu)}</td>
                    {isPasar && (
                      <td className={`hidden border border-slate-200 px-1.5 py-1 text-right font-semibold print:hidden sm:px-2 sm:py-1.5 print:px-1 print:py-[2px] ${m >= 0 ? "text-sky-700" : "text-rose-600"}`}>
                        {formatCurrency(m, mu)}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Ringkasan nilai — NOTA: Total Qty, Sudah Dibayar, Sisa, Total */}
        <div className="mt-4 flex justify-end print:break-inside-avoid print:mt-3">
          <div className="w-full space-y-1 text-sm sm:w-64">
            {/* Grand Total Qty */}
            <div className="flex justify-between text-slate-600">
              <span>Total Qty</span>
              <span className="font-semibold tabular-nums">{formatNum(grandQty)}</span>
            </div>
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

        <div className="mt-12 print:break-inside-avoid print:mt-8">
          <div className="grid grid-cols-2 gap-8 text-sm">
            <div>
              <p>Diterima oleh,</p>
              <div className="mt-14 print:mt-10" />
              <p className="font-semibold">____________________</p>
              <p className="text-xs text-slate-500">({invoice.namaPihak})</p>
            </div>
            <div>
              <p>Hormat kami,</p>
              <div className="mt-14 print:mt-10" />
              <p className="font-semibold">____________________</p>
              <p className="text-xs text-slate-500">(Pimpinan Dapur Laut)</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}




