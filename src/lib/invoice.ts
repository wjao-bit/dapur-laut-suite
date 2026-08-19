import { formatDate, parseNum } from "@/lib/format";
import { formatCurrency, type MataUang } from "@/lib/business";

/** Total tagihan invoice (penjualan untuk non-Supplier, pembelian untuk Supplier). */
export function invoiceTotal(r: any): number {
  return r.totalPenjualan || r.total || 0;
}

/** Total yang sudah dibayar (default 0; invoice berstatus Lunas dianggap lunas). */
export function invoiceDibayar(r: any): number {
  if (typeof r?.dibayar === "number" && r.dibayar > 0) return r.dibayar;
  return (r?.statusPembayaran ?? "Pending") === "Lunas" ? invoiceTotal(r) : 0;
}

/** Sisa tagihan (total − sudah dibayar). */
export function invoiceSisa(r: any): number {
  return Math.max(0, invoiceTotal(r) - invoiceDibayar(r));
}

/** Teks ringkasan invoice untuk dikirim ke WhatsApp (tombol Kirim WA di print). */
export function buildInvoiceWaText(inv: any): string {
  const mu: MataUang = inv.mataUang === "$" ? "$" : "Rp";
  const lines: string[] = [];
  lines.push("*PT DAPUR LAUT*");
  lines.push(`Invoice: ${inv.idInvoice}`);
  lines.push(`Tanggal: ${formatDate(inv.tanggal)}`);
  lines.push(`Tipe: ${inv.tipe} | Pihak: ${inv.namaPihak}`);
  if (inv.tenggat) lines.push(`Tenggat: ${formatDate(inv.tenggat)}`);
  lines.push("------------------------------");
  for (const [i, it] of (inv.items ?? []).entries()) {
    const terjual =
      inv.tipe === "Pasar"
        ? parseNum(it.stokAwal) - parseNum(it.stokAkhir)
        : parseNum(it.qty);
    const harga = inv.tipe === "Supplier" ? parseNum(it.hargaModal) : parseNum(it.hargaJual);
    lines.push(`${i + 1}. ${it.namaBarang}`);
    lines.push(`   ${terjual} x ${formatCurrency(harga, mu)} = ${formatCurrency(terjual * harga, mu)}`);
  }
  lines.push("------------------------------");
  lines.push(`Total: ${formatCurrency(invoiceTotal(inv), mu)}`);
  lines.push(`Sisa: ${formatCurrency(invoiceSisa(inv), mu)}`);
  lines.push("Terima kasih 🙏");
  return lines.join("\n");
}
