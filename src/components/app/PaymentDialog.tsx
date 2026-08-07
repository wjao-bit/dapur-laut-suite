import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Wallet, History, CheckCircle2, CalendarClock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatCurrency, type MataUang } from "@/lib/business";
import { formatDate, parseNum, todayStr } from "@/lib/format";

export interface RiwayatBayarItem {
  tanggal: string;
  nominal: number;
  keterangan?: string;
}

/**
 * Dialog pembayaran invoice (dipakai halaman Invoice & Invoice Tetesan).
 * Menampilkan total, sudah dibayar, sisa; pengguna memasukkan nominal
 * pembayaran lalu otomatis mengurangi sisa tagihan. Riwayat pembayaran
 * ditampilkan agar riwayat lengkap (multi-bayar) terlihat.
 */
export function PaymentDialog({
  open,
  onOpenChange,
  idInvoice,
  pihak,
  total,
  dibayar,
  sisa,
  mataUang = "Rp",
  riwayat = [],
  saving,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  idInvoice: string;
  pihak?: string;
  total: number;
  dibayar: number;
  sisa: number;
  mataUang?: MataUang;
  riwayat?: RiwayatBayarItem[];
  saving?: boolean;
  onSave: (nominal: number, tanggal: string, keterangan: string) => Promise<void>;
}) {
  const [nominal, setNominal] = useState("");
  const [tanggal, setTanggal] = useState(todayStr());
  const [keterangan, setKeterangan] = useState("");

  // Reset form setiap kali dialog dibuka
  useEffect(() => {
    if (open) {
      setNominal("");
      setTanggal(todayStr());
      setKeterangan("");
    }
  }, [open]);

  const pct = total > 0 ? Math.min(100, Math.round((dibayar / total) * 1000) / 10) : 0;
  const lunas = sisa <= 0;

  const quickAmounts = useMemo(() => {
    if (total <= 0) return [];
    const amounts: number[] = [];
    for (const p of [0.25, 0.5, 0.75]) {
      const v = Math.round(total * p);
      if (v > 0 && v < sisa) amounts.push(v);
    }
    if (sisa > 0) amounts.push(sisa);
    return [...new Set(amounts)].sort((a, b) => a - b);
  }, [total, sisa]);

  const handleSave = async () => {
    const n = parseNum(nominal);
    if (!(n > 0)) {
      toast.error("Masukkan nominal pembayaran yang valid (lebih dari 0)");
      return;
    }
    if (n > sisa) {
      toast.error(`Nominal melebihi sisa tagihan (${formatCurrency(sisa, mataUang)})`);
      return;
    }
    await onSave(n, tanggal, keterangan);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="size-5 text-emerald-600" />
            Pembayaran Invoice
          </DialogTitle>
          <DialogDescription>
            Catat pembayaran untuk {idInvoice}
            {pihak ? ` — ${pihak}` : ""}. Saldo otomatis berkurang dan status menjadi Lunas bila sisa habis.
          </DialogDescription>
        </DialogHeader>

        {/* Ringkasan pembayaran */}
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-lg border bg-muted/30 p-3 text-center">
            <p className="text-[11px] text-muted-foreground">Total</p>
            <p className="mt-1 text-sm font-bold tabular-nums">{formatCurrency(total, mataUang)}</p>
          </div>
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-center">
            <p className="text-[11px] font-medium text-emerald-700">Dibayar</p>
            <p className="mt-1 text-sm font-bold text-emerald-700 tabular-nums">{formatCurrency(dibayar, mataUang)}</p>
          </div>
          <div
            className={`rounded-lg border p-3 text-center ${
              lunas ? "border-emerald-300 bg-emerald-50" : "border-rose-200 bg-rose-50"
            }`}
          >
            <p className={`text-[11px] font-medium ${lunas ? "text-emerald-700" : "text-rose-600"}`}>Sisa</p>
            <p className={`mt-1 text-sm font-bold tabular-nums ${lunas ? "text-emerald-700" : "text-rose-600"}`}>
              {formatCurrency(sisa, mataUang)}
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <div>
          <div className="mb-1 flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Progress pembayaran</span>
            <span className="font-semibold text-foreground tabular-nums">{pct}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all duration-300"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        {/* Form nominal */}
        <div>
          <Label className="text-xs font-medium">Nominal Pembayaran *</Label>
          <Input
            className="mt-1.5 text-right text-base font-bold tabular-nums"
            type="number"
            inputMode="decimal"
            min={0}
            step="any"
            placeholder="0"
            value={nominal}
            onChange={(e) => setNominal(e.target.value)}
            autoFocus
          />
          {quickAmounts.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {quickAmounts.map((v) => (
                <Button
                  key={v}
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-7 cursor-pointer px-2.5 text-xs tabular-nums"
                  onClick={() => setNominal(String(v))}
                >
                  {v === sisa ? "Lunasi sisa" : formatCurrency(v, mataUang)}
                </Button>
              ))}
            </div>
          )}
          {lunas && (
            <p className="mt-2 flex items-center gap-1 text-xs font-medium text-emerald-600">
              <CheckCircle2 className="size-3.5" />
              Invoice sudah lunas — tidak ada sisa tagihan.
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs font-medium">Tanggal Bayar</Label>
            <Input className="mt-1.5" type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} />
          </div>
          <div>
            <Label className="text-xs font-medium">
              Keterangan <span className="text-muted-foreground">(opsional)</span>
            </Label>
            <Input
              className="mt-1.5"
              placeholder="mis. Transfer, Tunai…"
              value={keterangan}
              onChange={(e) => setKeterangan(e.target.value)}
            />
          </div>
        </div>

        {/* Riwayat pembayaran */}
        {riwayat.length > 0 && (
          <div className="rounded-lg border bg-muted/20 p-3">
            <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
              <History className="size-3.5" />
              Riwayat Pembayaran
            </p>
            <ul className="space-y-1.5">
              {[...riwayat].reverse().map((r, i) => (
                <li key={i} className="flex items-center justify-between gap-2 text-sm">
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <CalendarClock className="size-3" />
                    {formatDate(r.tanggal)}
                    {r.keterangan ? <span className="text-xs">· {r.keterangan}</span> : null}
                  </span>
                  <span className="font-semibold text-emerald-700 tabular-nums">{formatCurrency(r.nominal, mataUang)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button onClick={handleSave} disabled={saving || lunas}>
            {saving ? "Menyimpan..." : "Simpan Pembayaran"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
