import { useMemo, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
import {
  PackagePlus,
  Plus,
  Trash2,
  Scissors,
  Truck,
  CheckCircle2,
  FileText,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
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

interface BatchItem {
  namaBarang: string;
  qty: number;
  hargaModal: number;
}

const emptyItem = (): BatchItem => ({ namaBarang: "", qty: 0, hargaModal: 0 });

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function formatRp(n: number) {
  return `Rp ${new Intl.NumberFormat("id-ID").format(Math.round(n || 0))}`;
}

export default function BarangMasukPage() {
  const batches = useQuery(api.batch.listBatchMasuk) as any[] | undefined;
  const resellers = useQuery(api.queries.listReseller) as any[] | undefined;
  const dpls = useQuery(api.queries.listDpl) as any[] | undefined;
  const pasars = useQuery(api.queries.listPasar) as any[] | undefined;

  const createBatch = useMutation(api.batch.createBatchMasuk);
  const splitBatch = useMutation(api.batch.splitBatch);
  const deleteBatch = useMutation(api.batch.deleteBatchMasuk);
  const confirmAlokasi = useMutation(api.batch.confirmAlokasi);
  const deleteAlokasi = useMutation(api.batch.deleteAlokasi);

  // ---- state form catat barang masuk ----
  const [createOpen, setCreateOpen] = useState(false);
  const [tanggal, setTanggal] = useState(todayStr());
  const [namaSupplier, setNamaSupplier] = useState("");
  const [petugas, setPetugas] = useState("");
  const [catatan, setCatatan] = useState("");
  const [items, setItems] = useState<BatchItem[]>([emptyItem()]);
  const [saving, setSaving] = useState(false);

  // ---- state dialog pecah ----
  const [splitFor, setSplitFor] = useState<any>(null);
  const [splitBarang, setSplitBarang] = useState("");
  const [tujuan, setTujuan] = useState<"Reseller" | "DPL" | "Pasar">("Reseller");
  const [namaTujuan, setNamaTujuan] = useState("");
  const [qtySplit, setQtySplit] = useState(0);
  const [hargaJual, setHargaJual] = useState(0);

  const loading = batches === undefined;

  const pihakOptions = useMemo(() => {
    if (tujuan === "Reseller") return (resellers ?? []).map((r) => r.nama);
    if (tujuan === "DPL") return (dpls ?? []).map((d) => d.namaPasar ?? d.nama);
    return (pasars ?? []).map((p) => p.namaPasar ?? p.nama);
  }, [tujuan, resellers, dpls, pasars]);

  const resetCreateForm = () => {
    setTanggal(todayStr());
    setNamaSupplier("");
    setPetugas("");
    setCatatan("");
    setItems([emptyItem()]);
  };

  const handleCreate = async () => {
    if (!namaSupplier.trim()) {
      toast.error("Nama supplier wajib diisi");
      return;
    }
    if (!items.some((it) => it.namaBarang.trim() && it.qty > 0)) {
      toast.error("Minimal satu barang dengan qty lebih dari 0");
      return;
    }
    setSaving(true);
    try {
      await createBatch({ tanggal, namaSupplier, petugas, catatan, items });
      toast.success("Barang masuk tercatat 📦");
      resetCreateForm();
      setCreateOpen(false);
    } catch (e: any) {
      toast.error(e?.message ?? "Gagal menyimpan");
    } finally {
      setSaving(false);
    }
  };

  const openSplit = (batch: any) => {
    setSplitFor(batch);
    const firstSisa = (batch.sisaPerBarang ?? []).find((x: any) => x.sisa > 0);
    setSplitBarang(firstSisa?.namaBarang ?? "");
    setTujuan("Reseller");
    setNamaTujuan("");
    setQtySplit(firstSisa?.sisa ?? 0);
    setHargaJual(0);
  };

  const handleSplit = async () => {
    if (!splitFor) return;
    if (!namaTujuan.trim()) {
      toast.error("Pilih / isi nama tujuan");
      return;
    }
    if (!(qtySplit > 0)) {
      toast.error("Qty harus lebih dari 0");
      return;
    }
    try {
      const res = await splitBatch({
        batchId: splitFor.id,
        namaBarang: splitBarang,
        tujuan,
        namaTujuan,
        qty: qtySplit,
        hargaJual,
      });
      toast.success(`Invoice ${res?.idInvoice ?? ""} otomatis dibuat ✅`);
      setSplitFor(null);
    } catch (e: any) {
      toast.error(e?.message ?? "Gagal memecah barang");
    }
  };

  const handleDeleteBatch = async (batchId: string) => {
    try {
      await deleteBatch({ batchId });
      toast.success("Batch dihapus");
    } catch (e: any) {
      toast.error(e?.message ?? "Gagal menghapus");
    }
  };

  const sisaBarangTerpilih =
    splitFor?.sisaPerBarang?.find((x: any) => x.namaBarang === splitBarang)?.sisa ?? 0;
  const modalPerKg =
    splitFor?.sisaPerBarang?.find((x: any) => x.namaBarang === splitBarang)?.hargaModal ?? 0;

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <PackagePlus className="size-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Barang Masuk</h1>
            <p className="text-sm text-muted-foreground">
              Catat barang datang dari supplier, lalu pecahkan ke Reseller/DPL/Pasar — invoice
              otomatis jadi.
            </p>
          </div>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="gap-2 cursor-pointer">
          <Plus className="size-4" />
          Catat Barang Masuk
        </Button>
      </div>

      {/* Daftar batch */}
      {loading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="mr-2 size-4 animate-spin" />
          Memuat…
        </div>
      ) : (batches ?? []).length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center">
          <Truck className="mx-auto mb-3 size-8 text-muted-foreground/50" />
          <p className="font-medium">Belum ada barang masuk</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Tekan “Catat Barang Masuk” saat barang dari supplier tiba di gudang.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {(batches ?? []).map((b: any) => {
            const persen =
              b.totalQty > 0 ? Math.min(100, ((b.totalQty - b.sisaTotal) / b.totalQty) * 100) : 0;
            return (
              <div key={b._id} className="rounded-lg border bg-card p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="flex flex-wrap items-center gap-2 font-semibold tracking-tight">
                      <Truck className="size-4 text-muted-foreground" />
                      {b.namaSupplier}
                      <span className="rounded-full bg-muted px-2 py-0.5 font-mono text-[11px] text-muted-foreground">
                        {b.id}
                      </span>
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {b.tanggal}
                      {b.petugas ? ` · Dicatat: ${b.petugas}` : ""}
                      {` · Modal total ${formatRp(b.totalModal)}`}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {b.alokasi.length === 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="cursor-pointer gap-1.5 text-destructive hover:text-destructive"
                        onClick={() => handleDeleteBatch(b.id)}
                      >
                        <Trash2 className="size-3.5" /> Hapus
                      </Button>
                    )}
                    <Button size="sm" className="cursor-pointer gap-1.5" onClick={() => openSplit(b)}>
                      <Scissors className="size-3.5" /> Pecahkan
                    </Button>
                  </div>
                </div>

                {/* Barang dalam batch */}
                <div className="mt-3 grid gap-1.5 sm:grid-cols-2">
                  {(b.sisaPerBarang ?? []).map((x: any) => (
                    <div
                      key={x.namaBarang}
                      className="flex flex-wrap items-center justify-between gap-x-2 rounded-md border px-3 py-1.5 text-sm"
                    >
                      <span>{x.namaBarang}</span>
                      <span className="text-xs text-muted-foreground tabular-nums">
                        masuk {x.qty} · alokasi {x.teralokasi} ·{" "}
                        <span className={x.sisa > 0 ? "font-semibold text-emerald-600" : ""}>
                          sisa {x.sisa}
                        </span>
                      </span>
                    </div>
                  ))}
                </div>

                {/* Progress pemakaian */}
                <div className="mt-3">
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-emerald-500 transition-all"
                      style={{ width: `${persen}%` }}
                    />
                  </div>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    Terpecah {Math.round(persen)}% · Sisa gudang {b.sisaTotal}
                  </p>
                </div>

                {/* Alokasi */}
                {b.alokasi.length > 0 && (
                  <div className="mt-3 space-y-1 border-t pt-3">
                    <p className="text-[11px] font-semibold tracking-widest text-muted-foreground uppercase">
                      Alokasi
                    </p>
                    {b.alokasi.map((a: any) => (
                      <div
                        key={a._id}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-muted/40 px-3 py-1.5 text-xs"
                      >
                        <span>
                          <b>{a.namaBarang}</b> → {a.tujuan} <b>{a.namaTujuan}</b>: {a.qty} ×{" "}
                          {formatRp(a.hargaJual)}
                        </span>
                        <span className="flex flex-wrap items-center gap-2">
                          {a.status === "Diterima" ? (
                            <span className="flex items-center gap-1 font-medium text-emerald-600">
                              <CheckCircle2 className="size-3.5" /> Diterima
                            </span>
                          ) : (
                            <>
                              <button
                                type="button"
                                className="cursor-pointer font-medium text-primary hover:underline"
                                onClick={async () => {
                                  try {
                                    await confirmAlokasi({ alokasiId: a.id });
                                    toast.success("Alokasi ditandai diterima");
                                  } catch (e: any) {
                                    toast.error(e?.message ?? "Gagal");
                                  }
                                }}
                              >
                                Tandai diterima
                              </button>
                              <button
                                type="button"
                                className="cursor-pointer font-medium text-destructive hover:underline"
                                onClick={async () => {
                                  try {
                                    await deleteAlokasi({ alokasiId: a.id });
                                    toast.success("Alokasi dibatalkan");
                                  } catch (e: any) {
                                    toast.error(e?.message ?? "Gagal");
                                  }
                                }}
                              >
                                Batal
                              </button>
                            </>
                          )}
                          {a.idInvoice && (
                            <span className="flex items-center gap-1 rounded-full border px-2 py-0.5 font-mono text-[10px] text-muted-foreground">
                              <FileText className="size-3" />
                              {a.idInvoice}
                            </span>
                          )}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {b.catatan && (
                  <p className="mt-2 text-xs italic text-muted-foreground">📝 {b.catatan}</p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Dialog catat barang masuk */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Catat Barang Masuk</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Tanggal</Label>
                <Input
                  type="date"
                  value={tanggal}
                  onChange={(e) => setTanggal(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Nama Supplier *</Label>
                <Input
                  placeholder="cth. Aga"
                  value={namaSupplier}
                  onChange={(e) => setNamaSupplier(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Petugas</Label>
                <Input
                  placeholder="Nama pencatat"
                  value={petugas}
                  onChange={(e) => setPetugas(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Catatan</Label>
                <Input
                  placeholder="cth. 1 karung rusak"
                  value={catatan}
                  onChange={(e) => setCatatan(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Barang</Label>
              {items.map((it, idx) => (
                <div key={idx} className="grid grid-cols-[1fr_72px_110px_36px] items-end gap-2">
                  <Input
                    placeholder="Nama barang"
                    value={it.namaBarang}
                    onChange={(e) =>
                      setItems((prev) =>
                        prev.map((p, i) => (i === idx ? { ...p, namaBarang: e.target.value } : p)),
                      )
                    }
                  />
                  <Input
                    type="number"
                    inputMode="decimal"
                    min={0}
                    placeholder="Qty"
                    value={it.qty || ""}
                    onChange={(e) =>
                      setItems((prev) =>
                        prev.map((p, i) =>
                          i === idx ? { ...p, qty: Number(e.target.value) || 0 } : p,
                        ),
                      )
                    }
                  />
                  <Input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    placeholder="Modal/kg"
                    value={it.hargaModal || ""}
                    onChange={(e) =>
                      setItems((prev) =>
                        prev.map((p, i) =>
                          i === idx ? { ...p, hargaModal: Number(e.target.value) || 0 } : p,
                        ),
                      )
                    }
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="cursor-pointer text-destructive"
                    disabled={items.length === 1}
                    onClick={() => setItems((prev) => prev.filter((_, i) => i !== idx))}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="cursor-pointer gap-1.5"
                onClick={() => setItems((prev) => [...prev, emptyItem()])}
              >
                <Plus className="size-3.5" /> Tambah barang
              </Button>
            </div>

            <Button className="w-full cursor-pointer" onClick={handleCreate} disabled={saving}>
              {saving ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
              Simpan Barang Masuk
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog pecah batch */}
      <Dialog open={!!splitFor} onOpenChange={(v) => !v && setSplitFor(null)}>
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Pecahkan Barang — {splitFor?.namaSupplier}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Barang</Label>
              <Select
                value={splitBarang}
                onValueChange={(v) => {
                  setSplitBarang(v);
                  const row = splitFor?.sisaPerBarang?.find((x: any) => x.namaBarang === v);
                  setQtySplit(row?.sisa ?? 0);
                }}
              >
                <SelectTrigger className="mt-1 w-full cursor-pointer">
                  <SelectValue placeholder="Pilih barang" />
                </SelectTrigger>
                <SelectContent>
                  {(splitFor?.sisaPerBarang ?? [])
                    .filter((x: any) => x.sisa > 0)
                    .map((x: any) => (
                      <SelectItem key={x.namaBarang} value={x.namaBarang}>
                        {x.namaBarang} (sisa {x.sisa})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <p className="mt-1 text-xs text-muted-foreground">
                Sisa: <b>{sisaBarangTerpilih}</b> · Modal {formatRp(modalPerKg)}/kg
              </p>
            </div>

            <div>
              <Label>Tujuan</Label>
              <Select
                value={tujuan}
                onValueChange={(v) => {
                  setTujuan(v as any);
                  setNamaTujuan("");
                }}
              >
                <SelectTrigger className="mt-1 w-full cursor-pointer">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Reseller">Reseller</SelectItem>
                  <SelectItem value="DPL">DPL</SelectItem>
                  <SelectItem value="Pasar">Pasar</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Nama Tujuan</Label>
              <Input
                list="pihak-options"
                placeholder={`cth. ${tujuan === "Pasar" ? "Victoria" : tujuan === "DPL" ? "Pasar Grosir" : "Budi"}`}
                value={namaTujuan}
                onChange={(e) => setNamaTujuan(e.target.value)}
                className="mt-1"
              />
              <datalist id="pihak-options">
                {pihakOptions.map((n: string) => (
                  <option key={n} value={n} />
                ))}
              </datalist>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Qty</Label>
                <Input
                  type="number"
                  inputMode="decimal"
                  min={0}
                  value={qtySplit || ""}
                  onChange={(e) => setQtySplit(Number(e.target.value) || 0)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Harga Jual</Label>
                <Input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  value={hargaJual || ""}
                  onChange={(e) => setHargaJual(Number(e.target.value) || 0)}
                  className="mt-1"
                />
              </div>
            </div>

            <div className="rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
              Subtotal: <b className="text-foreground">{formatRp(qtySplit * hargaJual)}</b>
              {" · "}Estimasi margin:{" "}
              <b className="text-foreground">{formatRp((hargaJual - modalPerKg) * qtySplit)}</b>
              {tujuan === "Pasar" && " · Titipan: margin muncul setelah laporan stok akhir"}
            </div>

            <Button className="w-full cursor-pointer" onClick={handleSplit}>
              <Scissors className="mr-2 size-4" /> Pecah & Buat Invoice
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
