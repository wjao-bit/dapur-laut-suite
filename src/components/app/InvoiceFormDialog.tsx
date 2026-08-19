import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
import { Plus, Trash2, Wand2, Tags } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BarangSearch } from "@/components/app/BarangSearch";
import { NumInput } from "@/components/app/NumInput";
import { todayStr, genId, parseNum, nextSeqKode, roundNum, formatNum } from "@/lib/format";
import { formatCurrency, computeInvoiceTotals, INVOICE_TIPES, type MataUang } from "@/lib/business";
import type { InvoiceItem, InvoiceTipe } from "@/lib/business";

const TIPE_LABEL: Record<string, string> = {
  Supplier: "Pembelian (Stok Masuk)",
  Reseller: "Penjualan (Stok Keluar)",
  DPL: "Penjualan (Stok Keluar)",
  Pasar: "Penjualan Pasar (Awal−Akhir)",
};

/** Hitung subtotal satu baris item sesuai tipe invoice (dibulatkan anti-noise-float). */
export function itemSubtotal(tipe: string, it: any): number {
  const qty =
    tipe === "Pasar"
      ? parseNum(it.stokAwal) - parseNum(it.stokAkhir)
      : parseNum(it.qty);
  const harga =
    tipe === "Supplier" ? parseNum(it.hargaModal) : parseNum(it.hargaJual);
  const st = roundNum(qty * harga);
  // Pasar: Terjual BOLEH minus (stok akhir > stok awal) → subtotal ikut minus.
  return tipe === "Pasar" ? st : Math.max(0, st);
}

/** Margin satu baris (hanya Pasar — dari selisih harga jual − modal × terjual). */
export function itemMargin(tipe: string, it: any): number {
  if (tipe !== "Pasar") return 0;
  const terjual = roundNum(parseNum(it.stokAwal) - parseNum(it.stokAkhir));
  return roundNum(terjual * (parseNum(it.hargaJual) - parseNum(it.hargaModal)));
}

function emptyItem(): InvoiceItem {
  return { kodeBarang: "", namaBarang: "", hargaModal: 0, qty: 1, hargaJual: 0, subtotal: 0 };
}

function isRowEmpty(it: InvoiceItem): boolean {
  return (
    !it.kodeBarang &&
    !it.namaBarang &&
    parseNum(it.qty) <= 0 &&
    parseNum(it.hargaModal) <= 0 &&
    parseNum(it.hargaJual) <= 0 &&
    parseNum(it.stokAwal) <= 0 &&
    parseNum(it.stokAkhir) <= 0
  );
}

interface InvoiceFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editInv: any;
  duplicateInv?: any;
  nextInvoiceId: string;
  barang: any[] | undefined;
  katalogs: any[] | undefined;
  suppliers: any[] | undefined;
  resellers: any[] | undefined;
  dpls: any[] | undefined;
  pasars: any[] | undefined;
  onSaved: (res: any) => void;
}

/**
 * Form invoice multi-barang (Supplier/Reseller/DPL/Pasar).
 *
 * Menggunakan tampilan KARTU (card-based) di SEMUA ukuran layar — baik di HP
 * maupun desktop penuh. Setiap barang ditampilkan sebagai satu blok terpisah
 * dengan label kolom (Kode, Nama, Harga Modal, Qty, Harga Jual, Subtotal)
 * sehingga mudah diisi di ukuran layar mana pun.
 */
export function InvoiceFormDialog({
  open,
  onOpenChange,
  editInv,
  duplicateInv,
  nextInvoiceId,
  barang,
  katalogs,
  suppliers,
  resellers,
  dpls,
  pasars,
  onSaved,
}: InvoiceFormDialogProps) {
  const createInvoice = useMutation(api.business.createInvoice);
  const editInvoice = useMutation(api.business.editInvoice);
  const upsertBarang = useMutation(api.business.upsertBarang);
  const upsertKatalog = useMutation(api.katalog.upsertKatalog);

  const [tipe, setTipe] = useState<InvoiceTipe>("Reseller");
  const [tanggal, setTanggal] = useState(todayStr());
  const [idInvoice, setIdInvoice] = useState(() => genId("INV"));
  const [namaPihak, setNamaPihak] = useState("");
  const [tenggat, setTenggat] = useState("");
  const [mataUang, setMataUang] = useState<MataUang>("Rp");
  const [statusPembayaran, setStatusPembayaran] = useState<"Lunas" | "Pending">("Pending");
  const [items, setItems] = useState<InvoiceItem[]>([emptyItem()]);
  const [saving, setSaving] = useState(false);
  const [creatingBarangIdx, setCreatingBarangIdx] = useState<number | null>(null);
  const [quickSearch, setQuickSearch] = useState("");
  const [quickCreating, setQuickCreating] = useState(false);

  const lastAutoParty = useRef<string | null>(null);
  const idTouched = useRef(false);

  const nextBarangKode = useMemo(
    () => nextSeqKode((barang ?? []).map((b: any) => b.kode), "BRG"),
    [barang],
  );

  const katalogForParty = useMemo(() => {
    if (!katalogs) return null;
    const party = String(namaPihak ?? "").trim().toLowerCase();
    if (!party) return null;
    return (
      (katalogs as any[]).find(
        (k: any) =>
          k.tipe === tipe &&
          String(k.namaPihak ?? "").trim().toLowerCase() === party,
      ) ?? null
    );
  }, [katalogs, tipe, namaPihak]);

  const katalogItemFor = (it: InvoiceItem): any | null => {
    const kat = katalogForParty;
    if (!kat) return null;
    return (
      (kat.items ?? []).find(
        (x: any) =>
          (it.kodeBarang &&
            String(x.kodeBarang ?? "") === String(it.kodeBarang ?? "")) ||
          (it.namaBarang &&
            String(x.namaBarang ?? "").toLowerCase().trim() ===
              String(it.namaBarang ?? "").toLowerCase().trim()),
      ) ?? null
    );
  };

  const applyKatalogToItem = (it: InvoiceItem): InvoiceItem => {
    const ki = katalogItemFor(it);
    if (!ki) return it;
    const harga = parseNum(ki.harga);
    const hargaModal =
      parseNum(it.hargaModal) > 0 ? it.hargaModal : tipe === "Supplier" ? harga : it.hargaModal;
    const hargaJual =
      parseNum(it.hargaJual) > 0 ? it.hargaJual : tipe === "Reseller" ? harga : it.hargaJual;
    return {
      ...it,
      kodeBarang: it.kodeBarang || ki.kodeBarang,
      namaBarang: it.namaBarang || ki.namaBarang,
      hargaModal,
      hargaJual,
    };
  };

  useEffect(() => {
    if (!open) return;
    lastAutoParty.current = null;
    idTouched.current = false;
    const src = editInv ?? duplicateInv;
    setTipe(src?.tipe ?? "Reseller");
    setTanggal(editInv ? src.tanggal : todayStr());
    setIdInvoice(editInv ? editInv.idInvoice : nextInvoiceId);
    setNamaPihak(src?.namaPihak ?? "");
    setTenggat(src?.tenggat ?? "");
    setMataUang(src ? (src.mataUang === "$" ? "$" : "Rp") : "Rp");
    setStatusPembayaran(src ? ((src.statusPembayaran ?? "Pending") === "Lunas" ? "Lunas" : "Pending") : "Pending");
    setItems(
      src
        ? (src.items ?? []).map((it: any) => {
            const isPasar = src.tipe === "Pasar";
            const stokAwal = isPasar
              ? it.stokAwal != null
                ? parseNum(it.stokAwal)
                : parseNum(it.qty) || 0
              : undefined;
            const stokAkhir = isPasar
              ? it.stokAkhir != null
                ? parseNum(it.stokAkhir)
                : 0
              : undefined;
            return {
              kodeBarang: it.kodeBarang ?? "",
              namaBarang: it.namaBarang ?? "",
              hargaModal: parseNum(it.hargaModal),
              qty: stokAwal || parseNum(it.qty) || 1,
              hargaJual: parseNum(it.hargaJual),
              stokAwal,
              stokAkhir,
              subtotal: parseNum(it.subtotal),
            };
          })
        : [emptyItem()],
    );
    setQuickSearch("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editInv, duplicateInv]);

  useEffect(() => {
    if (open && !editInv && !duplicateInv && !idTouched.current) setIdInvoice(nextInvoiceId);
  }, [open, editInv, duplicateInv, nextInvoiceId]);

  useEffect(() => {
    if (!open || editInv || duplicateInv) return;
    const party = String(namaPihak ?? "").trim().toLowerCase();
    const kat = katalogForParty;
    if (!party || !kat || lastAutoParty.current === party) return;
    lastAutoParty.current = party;
    let filled = 0;
    const next = items.map((it) => {
      const ki = katalogItemFor(it);
      if (!ki) return it;
      const harga = parseNum(ki.harga);
      const baruModal = parseNum(it.hargaModal) > 0 ? it.hargaModal : tipe === "Supplier" ? harga : it.hargaModal;
      const baruJual = parseNum(it.hargaJual) > 0 ? it.hargaJual : tipe === "Reseller" ? harga : it.hargaJual;
      if (tipe === "Supplier" ? parseNum(it.hargaModal) <= 0 : parseNum(it.hargaJual) <= 0) filled++;
      return {
        ...it,
        kodeBarang: it.kodeBarang || ki.kodeBarang,
        namaBarang: it.namaBarang || ki.namaBarang,
        hargaModal: baruModal,
        hargaJual: baruJual,
      };
    });
    setItems(next);
    if (filled > 0) {
      toast.success(`Harga ${filled} kolom diisi otomatis dari katalog ${kat.namaPihak}.`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editInv, duplicateInv, namaPihak, katalogForParty]);

  const pihakOptions = useMemo(() => {
    if (tipe === "Supplier") return suppliers?.map((s: any) => s.nama) ?? [];
    if (tipe === "Reseller") return resellers?.map((s: any) => s.nama) ?? [];
    if (tipe === "DPL") return dpls?.map((s: any) => s.namaPasar) ?? [];
    return pasars?.map((s: any) => s.namaPasar) ?? [];
  }, [tipe, suppliers, resellers, dpls, pasars]);

  const totals = useMemo(() => computeInvoiceTotals(tipe, items), [tipe, items]);

  const selectBarang = (idx: number, kode: string) => {
    const b = barang?.find((x: any) => x.kode === kode);
    setItems((prev) =>
      prev.map((it, i) => {
        if (i !== idx) return it;
        const next: InvoiceItem = {
          ...it,
          kodeBarang: kode,
          ...(b ? { namaBarang: b.nama } : {}),
        };
        const ki = katalogItemFor(next);
        if (ki) {
          const harga = parseNum(ki.harga);
          if (tipe === "Supplier") next.hargaModal = parseNum(next.hargaModal) > 0 ? next.hargaModal : harga;
          else if (tipe === "Reseller") next.hargaJual = parseNum(next.hargaJual) > 0 ? next.hargaJual : harga;
        } else if (b && tipe !== "Supplier") {
          next.hargaJual = b.harga ?? next.hargaJual;
        }
        return next;
      }),
    );
  };

  const updateItem = (idx: number, patch: Partial<InvoiceItem>) => {
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  };

  const addRow = () => setItems((prev) => [...prev, emptyItem()]);
  const removeRow = (idx: number) =>
    setItems((prev) => (prev.length === 1 ? prev : prev.filter((_, i) => i !== idx)));

  const handleCreateBarang = async (idx: number, nama: string) => {
    const name = String(nama ?? "").trim();
    if (!name) return;
    setCreatingBarangIdx(idx);
    try {
      const kode = nextBarangKode;
      const harga = items[idx] ? parseNum(items[idx].hargaJual) : 0;
      await upsertBarang({ doc: { kode, nama: name, harga, kategori: "" } });
      updateItem(idx, { kodeBarang: kode, namaBarang: name });
      toast.success(`Barang "${name}" ditambahkan ke database (${kode})`);
    } catch (e: any) {
      toast.error(e?.data?.message ?? e?.message ?? "Gagal menambahkan barang ke database");
    } finally {
      setCreatingBarangIdx(null);
    }
  };

  const addQuickItem = (b: any) => {
    const base: InvoiceItem = {
      kodeBarang: b.kode,
      namaBarang: b.nama,
      hargaModal: parseNum(b.harga) || 0,
      qty: 1,
      hargaJual: parseNum(b.harga) || 0,
      subtotal: 0,
    };
    const newItem = applyKatalogToItem(base);
    setItems((prev) => {
      const emptyIdx = prev.findIndex(isRowEmpty);
      if (emptyIdx >= 0) return prev.map((it, i) => (i === emptyIdx ? newItem : it));
      return [...prev, newItem];
    });
    setQuickSearch("");
    toast.success(`${b.nama} masuk daftar invoice`);
  };

  const fillAllPrices = () => {
    if (!barang) {
      toast.error("Data barang belum termuat — coba lagi sebentar.");
      return;
    }
    let matched = 0;
    let filled = 0;
    const next = items.map((it) => {
      const b = (barang as any[]).find(
        (x: any) =>
          String(x.kode ?? "") === String(it.kodeBarang ?? "") ||
          String(x.nama ?? "").toLowerCase().trim() === String(it.namaBarang ?? "").toLowerCase().trim(),
      );
      if (!b) return it;
      matched++;
      const hargaDb = parseNum(b.harga);
      const baruModal = parseNum(it.hargaModal) > 0 ? it.hargaModal : hargaDb;
      const baruJual = parseNum(it.hargaJual) > 0 ? it.hargaJual : hargaDb;
      if (parseNum(it.hargaModal) <= 0 && hargaDb > 0) filled++;
      if (parseNum(it.hargaJual) <= 0 && hargaDb > 0) filled++;
      return {
        ...it,
        kodeBarang: it.kodeBarang || b.kode,
        namaBarang: it.namaBarang || b.nama,
        hargaModal: baruModal,
        hargaJual: baruJual,
      };
    });
    setItems(next);
    if (matched === 0) {
      toast.info("Tidak ada barang yang cocok dengan database — isi harga secara manual.");
    } else if (filled === 0) {
      toast.success(`Semua ${matched} barang sudah punya harga dari database.`);
    } else {
      toast.success(`Harga ${filled} kolom diisi otomatis dari database (${matched} barang).`);
    }
  };

  const applyKatalogPrices = () => {
    const kat = katalogForParty;
    if (!kat) {
      toast.info(
        tipe === "Supplier" || tipe === "Reseller"
          ? "Belum ada katalog untuk pihak ini — buat di menu Katalog Harga, atau isi manual."
          : "Katalog harga hanya untuk Reseller & Supplier.",
      );
      return;
    }
    let matched = 0;
    let filled = 0;
    const next = items.map((it) => {
      const ki = katalogItemFor(it);
      if (!ki) return it;
      matched++;
      const harga = parseNum(ki.harga);
      const baruModal = parseNum(it.hargaModal) > 0 ? it.hargaModal : tipe === "Supplier" ? harga : it.hargaModal;
      const baruJual = parseNum(it.hargaJual) > 0 ? it.hargaJual : tipe === "Reseller" ? harga : it.hargaJual;
      if (tipe === "Supplier" ? parseNum(it.hargaModal) <= 0 : parseNum(it.hargaJual) <= 0) filled++;
      return {
        ...it,
        kodeBarang: it.kodeBarang || ki.kodeBarang,
        namaBarang: it.namaBarang || ki.namaBarang,
        hargaModal: baruModal,
        hargaJual: baruJual,
      };
    });
    setItems(next);
    if (matched === 0) {
      toast.info(`Katalog ${kat.namaPihak} ada, tapi tidak ada barang yang cocok — isi manual.`);
    } else if (filled === 0) {
      toast.success(`Semua ${matched} barang sudah memakai harga dari katalog ${kat.namaPihak}.`);
    } else {
      toast.success(`Harga ${filled} kolom diisi dari katalog ${kat.namaPihak} (${matched} barang).`);
    }
  };

  const quickCreateBarang = async (nama: string) => {
    const name = String(nama ?? "").trim();
    if (!name) return;
    setQuickCreating(true);
    try {
      const kode = nextBarangKode;
      await upsertBarang({ doc: { kode, nama: name, harga: 0, kategori: "" } });
      addQuickItem({ kode, nama: name, harga: 0 });
      toast.success(`Barang "${name}" ditambahkan ke database (${kode})`);
    } catch (e: any) {
      toast.error(e?.data?.message ?? e?.message ?? "Gagal menambahkan barang ke database");
    } finally {
      setQuickCreating(false);
    }
  };

  const changeTipe = (t: InvoiceTipe) => {
    lastAutoParty.current = null;
    setTipe(t);
    setNamaPihak("");
    setTenggat("");
    if (t !== "Supplier") setMataUang("Rp");
    setItems([emptyItem()]);
  };

  const resetForm = () => {
    setTipe("Reseller");
    setTanggal(todayStr());
    setIdInvoice(nextInvoiceId);
    setNamaPihak("");
    setTenggat("");
    setMataUang("Rp");
    setStatusPembayaran("Pending");
    setItems([emptyItem()]);
  };

  const handleOpenChange = (o: boolean) => {
    onOpenChange(o);
    if (!o) resetForm();
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const cleanItems = items
        .filter((it) => {
          const hasName = !!it.kodeBarang || !!it.namaBarang;
          const hasVal =
            parseNum(it.qty) > 0 ||
            parseNum(it.hargaModal) > 0 ||
            parseNum(it.hargaJual) > 0 ||
            parseNum(it.stokAwal) > 0 ||
            parseNum(it.stokAkhir) > 0;
          return hasName || hasVal;
        })
        .map((it) => {
          const stokAwal = tipe === "Pasar" ? parseNum(it.stokAwal) : 0;
          const stokAkhir = tipe === "Pasar" ? parseNum(it.stokAkhir) : 0;
          return {
            kodeBarang: it.kodeBarang,
            namaBarang: it.namaBarang,
            hargaModal: parseNum(it.hargaModal),
            hargaJual: parseNum(it.hargaJual),
            qty: stokAwal || parseNum(it.qty),
            subtotal: itemSubtotal(tipe, it),
            stokAwal: tipe === "Pasar" ? stokAwal : undefined,
            stokAkhir: tipe === "Pasar" ? stokAkhir : undefined,
          };
        });
      if (cleanItems.length === 0) {
        toast.error("Tambahkan minimal 1 barang sebelum menyimpan invoice.");
        return;
      }
      const docPayload = {
        idInvoice,
        tanggal,
        tipe,
        namaPihak,
        tenggat,
        mataUang,
        statusPembayaran,
        items: cleanItems,
      };
      const res = editInv
        ? await editInvoice({ doc: docPayload })
        : await createInvoice({ doc: docPayload });
      if (tipe === "Supplier" || tipe === "Reseller") {
        try {
          await upsertKatalog({
            tipe,
            namaPihak,
            items: cleanItems.map((it) => ({
              kodeBarang: it.kodeBarang,
              namaBarang: it.namaBarang,
              harga: it.hargaJual || it.hargaModal,
            })),
          });
        } catch {
          /* katalog pelengkap — gagal sinkron tidak menggagalkan invoice */
        }
      }
      toast.success(
        editInv
          ? `Invoice ${res.idInvoice} diperbarui — ${formatCurrency(res.totalPenjualan || res.total, mataUang)}`
          : duplicateInv
            ? `Duplikat tersimpan sebagai ${res.idInvoice} — ${formatCurrency(res.totalPenjualan || res.total, mataUang)}`
            : `Invoice ${res.idInvoice} tersimpan — ${formatCurrency(res.totalPenjualan || res.total, mataUang)}`,
      );
      onSaved(res);
      onOpenChange(false);
      resetForm();
    } catch (e: any) {
      const data = e?.data ?? e;
      const detail: string[] = Array.isArray(data?.detail) ? data.detail : [];
      const ringkas = detail
        .slice(0, 3)
        .map((s: string) => s.replace(/^items\.\d+\./, "").replace(/\./g, " "))
        .join(" · ");
      const msg = data?.message ?? e?.message ?? "Terjadi kesalahan";
      toast.error(ringkas ? `Gagal simpan — ${ringkas}` : msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-6xl">
        <DialogHeader>
          <DialogTitle>
            {editInv
              ? `Edit Invoice ${editInv.idInvoice}`
              : duplicateInv
                ? `Duplikat Invoice ${duplicateInv.idInvoice}`
                : "Buat Invoice"}
          </DialogTitle>
          <DialogDescription>
            {editInv
              ? "Ubah isi invoice (tanggal, pihak, barang, harga, qty). Efek stok & kas lama otomatis dibatalkan lalu diterapkan ulang."
              : duplicateInv
                ? "Isi form disalin dari invoice lama — tinggal ubah yang perlu, lalu simpan sebagai invoice BARU."
                : "Pilih tipe, isi pihak & barang. Harga ditarik otomatis dari katalog saat pihak dipilih."}
          </DialogDescription>
        </DialogHeader>

        <datalist id="invoice-barang-all">
          {(barang ?? []).map((b: any) => (
            <option key={b.kode} value={b.kode}>
              {b.nama}
            </option>
          ))}
        </datalist>

        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <Label className="text-xs font-medium">Tipe Invoice *</Label>
            <Select value={tipe} onValueChange={(v) => changeTipe(v as InvoiceTipe)}>
              <SelectTrigger className="mt-1.5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {INVOICE_TIPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t} — {TIPE_LABEL[t]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs font-medium">No. Invoice *</Label>
            <Input
              className="mt-1.5"
              value={idInvoice}
              onChange={(e) => {
                idTouched.current = true;
                setIdInvoice(e.target.value);
              }}
              disabled={!!editInv}
            />
            <p className="mt-1 text-[11px] text-muted-foreground">
              {editInv ? "Nomor invoice tidak bisa diubah saat edit." : `Otomatis: ${nextInvoiceId} (unik)`}
            </p>
          </div>
          <div>
            <Label className="text-xs font-medium">Tanggal *</Label>
            <Input className="mt-1.5" type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} />
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label className="text-xs font-medium">Nama {tipe === "Supplier" ? "Supplier" : "Pihak"} *</Label>
            <div className="mt-1.5 flex gap-2">
              <Input
                className="flex-1"
                list="pihak-options"
                placeholder={tipe === "Supplier" ? "CV Samudra Jaya" : tipe === "Pasar" ? "Victoria / Tunas" : "Nama pihak"}
                value={namaPihak}
                onChange={(e) => setNamaPihak(e.target.value)}
              />
              <datalist id="pihak-options">
                {pihakOptions.map((p: string, i: number) => (
                  <option key={`${p}-${i}`} value={p} />
                ))}
              </datalist>
            </div>
            {katalogForParty && (
              <p className="mt-1 text-[11px] text-teal-600">
                Katalog {katalogForParty.tipe} ditemukan ({katalogForParty.items.length} barang) — harga diisi otomatis.
              </p>
            )}
          </div>
          {tipe === "Supplier" ? (
            <div>
              <Label className="text-xs font-medium">Mata Uang *</Label>
              <Select value={mataUang} onValueChange={(v) => setMataUang(v as MataUang)}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Rp">Rupiah (Rp)</SelectItem>
                  <SelectItem value="$">Dolar ($)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          ) : (
            (tipe === "Reseller" || tipe === "DPL") && (
              <div>
                <Label className="text-xs font-medium">
                  Tenggat Pembayaran <span className="text-muted-foreground">(opsional)</span>
                </Label>
                <Input
                  className="mt-1.5"
                  type="date"
                  min={tanggal}
                  value={tenggat}
                  onChange={(e) => setTenggat(e.target.value)}
                />
              </div>
            )
          )}
          <div>
            <Label className="text-xs font-medium">Status Pembayaran *</Label>
            <Select value={statusPembayaran} onValueChange={(v) => setStatusPembayaran(v as "Lunas" | "Pending")}>
              <SelectTrigger className="mt-1.5 cursor-pointer">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Pending">Pending — belum dibayar</SelectItem>
                <SelectItem value="Lunas">Lunas — sudah dibayar</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Multi-item: KARTU per barang — tampil di SEMUA ukuran layar (HP & desktop) */}
        <div className="rounded-lg border">
          <div className="border-b bg-muted/20 px-3 py-2.5">
            <Label className="text-xs font-medium">Cari / Pilih Barang</Label>
            <div className="mt-1.5 flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-3">
              <BarangSearch
                className="w-full sm:w-96"
                barang={(barang ?? []) as any}
                value={quickSearch}
                onChange={setQuickSearch}
                onPick={addQuickItem}
                onCreateNew={quickCreateBarang}
                creatingNew={quickCreating}
                nextKode={nextBarangKode}
                placeholder="Cari / Pilih Barang…"
              />
              <p className="text-[11px] text-muted-foreground">
                Ketuk hasil untuk menambah ke daftar. Barang baru langsung dibuat ke database.
              </p>
            </div>
          </div>

          {/* Kartu per barang — tampil di SEMUA layar (HP, tablet, desktop) */}
          <div className="divide-y">
            {items.map((it, idx) => {
              const subtotal = itemSubtotal(tipe, it);
              const margin = itemMargin(tipe, it);
              const terjual = tipe === "Pasar" ? parseNum(it.stokAwal) - parseNum(it.stokAkhir) : parseNum(it.qty);
              return (
                <div key={`item-${idx}`} className="space-y-2.5 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-muted-foreground uppercase">
                      Barang {idx + 1}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7 cursor-pointer text-rose-500"
                      onClick={() => removeRow(idx)}
                      title="Hapus baris"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    <div>
                      <Label className="text-[11px] font-medium text-muted-foreground">Kode</Label>
                      <Input
                        className="mt-1 h-9 text-base"
                        list="invoice-barang-all"
                        placeholder="Kode"
                        value={it.kodeBarang}
                        onChange={(e) => selectBarang(idx, e.target.value)}
                      />
                    </div>
                    <div className="col-span-2 sm:col-span-3">
                      <Label className="text-[11px] font-medium text-muted-foreground">Nama Barang</Label>
                      <div className="mt-1">
                        <BarangSearch
                          className="w-full"
                          barang={(barang ?? []) as any}
                          value={it.namaBarang}
                          onChange={(v) => updateItem(idx, { namaBarang: v })}
                          onPick={(b) => {
                            const patch: Partial<InvoiceItem> = {
                              kodeBarang: b.kode,
                              namaBarang: b.nama,
                              hargaModal: it.hargaModal || (b.harga ?? 0),
                              hargaJual: b.harga ?? it.hargaJual,
                            };
                            const ki = katalogItemFor({ ...it, kodeBarang: b.kode, namaBarang: b.nama } as InvoiceItem);
                            if (ki) {
                              const h = parseNum(ki.harga);
                              if (tipe === "Supplier") patch.hargaModal = h;
                              else if (tipe === "Reseller") patch.hargaJual = h;
                            }
                            updateItem(idx, patch);
                          }}
                          onCreateNew={(nama) => handleCreateBarang(idx, nama)}
                          creatingNew={creatingBarangIdx === idx}
                          nextKode={nextBarangKode}
                          placeholder="Ketik nama barang…"
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="text-[11px] font-medium text-muted-foreground">Harga Modal</Label>
                      <NumInput
                        className="mt-1 h-9 text-base text-right"
                        value={it.hargaModal}
                        onValue={(n) => updateItem(idx, { hargaModal: n })}
                      />
                    </div>
                    {tipe === "Pasar" ? (
                      <>
                        <div>
                          <Label className="text-[11px] font-medium text-muted-foreground">Stok Awal</Label>
                          <NumInput
                            className="mt-1 h-9 text-base text-right"
                            value={it.stokAwal}
                            onValue={(n) => updateItem(idx, { stokAwal: n, qty: n })}
                          />
                        </div>
                        <div>
                          <Label className="text-[11px] font-medium text-muted-foreground">Stok Akhir</Label>
                          <NumInput
                            className="mt-1 h-9 text-base text-right"
                            value={it.stokAkhir}
                            onValue={(n) => updateItem(idx, { stokAkhir: n })}
                          />
                        </div>
                        <div className="flex flex-col justify-end">
                          <Label className="text-[11px] font-medium text-muted-foreground">Terjual</Label>
                          <p
                            className={`mt-1 text-base font-semibold tabular-nums ${
                              terjual < 0 ? "text-rose-600" : "text-teal-600"
                            }`}
                          >
                            {formatNum(terjual)}
                          </p>
                        </div>
                      </>
                    ) : (
                      <div>
                        <Label className="text-[11px] font-medium text-muted-foreground">Qty</Label>
                        <NumInput
                          className="mt-1 h-9 text-base text-right"
                          value={it.qty}
                          onValue={(n) => updateItem(idx, { qty: n })}
                        />
                      </div>
                    )}
                    {tipe !== "Supplier" && (
                      <div>
                        <Label className="text-[11px] font-medium text-muted-foreground">Harga Jual</Label>
                        <NumInput
                          className="mt-1 h-9 text-base text-right"
                          value={it.hargaJual}
                          onValue={(n) => updateItem(idx, { hargaJual: n })}
                        />
                      </div>
                    )}
                    <div>
                      <Label className="text-[11px] font-medium text-muted-foreground">Subtotal</Label>
                      <p
                        className={`mt-1 text-base font-semibold tabular-nums ${
                          subtotal < 0 ? "text-rose-600" : "text-foreground"
                        }`}
                      >
                        {formatCurrency(subtotal, mataUang)}
                      </p>
                    </div>
                    {tipe === "Pasar" && (
                      <div>
                        <Label className="text-[11px] font-medium text-muted-foreground">Margin</Label>
                        <p
                          className={`mt-1 text-base font-semibold tabular-nums ${
                            margin >= 0 ? "text-sky-600" : "text-rose-600"
                          }`}
                        >
                          {formatCurrency(margin, mataUang)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex flex-col gap-2 border-t bg-muted/20 px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" size="sm" onClick={addRow}>
                <Plus className="mr-1.5 size-3.5" />
                Tambah Barang
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={fillAllPrices}
                title="Isi harga modal & jual semua baris dari database"
              >
                <Wand2 className="mr-1.5 size-3.5" />
                Isi Semua (DB)
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={applyKatalogPrices}
                disabled={!katalogForParty}
                title="Isi harga dari katalog pihak ini"
              >
                <Tags className="mr-1.5 size-3.5" />
                Isi Katalog
              </Button>
            </div>
            <div className="text-right text-xs">
              <div className="text-muted-foreground">
                Total Modal: <span className="font-semibold text-foreground tabular-nums">{formatCurrency(totals.totalModal, mataUang)}</span>
              </div>
              {tipe !== "Supplier" && (
                <div className="text-muted-foreground">
                  Total Penjualan:{" "}
                  <span className="font-semibold text-emerald-600 tabular-nums">{formatCurrency(totals.totalPenjualan, mataUang)}</span>
                </div>
              )}
              {tipe !== "Supplier" && (
                <div className="text-muted-foreground">
                  Margin:{" "}
                  <span className={totals.margin >= 0 ? "font-semibold text-sky-600 tabular-nums" : "font-semibold text-rose-600 tabular-nums"}>
                    {formatCurrency(totals.margin, mataUang)}
                  </span>
                </div>
              )}
              <div className="mt-0.5 text-sm">
                Total: <span className="font-bold text-foreground tabular-nums">{formatCurrency(totals.total, mataUang)}</span>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button onClick={handleSubmit} disabled={saving || !namaPihak || items.length === 0}>
            {saving ? "Menyimpan..." : editInv ? "Simpan Perubahan" : "Simpan Invoice"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
