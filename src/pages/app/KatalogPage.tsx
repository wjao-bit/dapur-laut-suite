import { useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
import { BookOpenText, Loader2, Plus, Save, Store, Trash2, Truck, Tags } from "lucide-react";
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
import { PageHeader } from "@/components/app/ui";
import { BarangSearch, type BarangOption } from "@/components/app/BarangSearch";
import { NumInput } from "@/components/app/NumInput";
import { formatRupiah, parseNum } from "@/lib/format";

type KatalogTipe = "Reseller" | "Supplier";

interface KatalogItem {
  kodeBarang: string;
  namaBarang: string;
  harga: number;
}

interface KatalogRow {
  _id: string;
  id: string;
  tipe: KatalogTipe;
  namaPihak: string;
  items: KatalogItem[];
  updatedAt: number;
}

function itemKey(it: KatalogItem): string {
  return String(it.kodeBarang || it.namaBarang || "").toLowerCase();
}

export default function KatalogPage() {
  const katalogs = useQuery(api.katalog.listKatalog);
  const barang = useQuery(api.queries.listBarang);
  const suppliers = useQuery(api.queries.listSupplier);
  const resellers = useQuery(api.queries.listReseller);

  const upsertKatalog = useMutation(api.katalog.upsertKatalog);
  const addKatalogItem = useMutation(api.katalog.addKatalogItem);
  const removeKatalogItem = useMutation(api.katalog.removeKatalogItem);
  const deleteKatalog = useMutation(api.katalog.deleteKatalog);

  const [filterTipe, setFilterTipe] = useState<string>("");
  const [openNew, setOpenNew] = useState(false);
  const [newTipe, setNewTipe] = useState<KatalogTipe>("Reseller");
  const [newPihak, setNewPihak] = useState("");
  const [savingNew, setSavingNew] = useState(false);

  const [addFor, setAddFor] = useState<KatalogRow | null>(null);
  const [addName, setAddName] = useState("");
  const [addHarga, setAddHarga] = useState<number>(0);
  const [addSaving, setAddSaving] = useState(false);

  const [drafts, setDrafts] = useState<Record<string, number>>({});
  const [savingIdx, setSavingIdx] = useState<string | null>(null);

  const pihakOptions = useMemo(() => {
    if (newTipe === "Supplier") return suppliers?.map((s: any) => s.nama) ?? [];
    return resellers?.map((s: any) => s.nama) ?? [];
  }, [newTipe, suppliers, resellers]);

  const filtered = useMemo(() => {
    if (!katalogs) return katalogs;
    return katalogs.filter((k: any) => !filterTipe || k.tipe === filterTipe);
  }, [katalogs, filterTipe]);

  const handleCreateKatalog = async () => {
    const party = newPihak.trim();
    if (!party) {
      toast.error("Isi nama pihak terlebih dahulu");
      return;
    }
    setSavingNew(true);
    try {
      await upsertKatalog({ tipe: newTipe, namaPihak: party, items: [] });
      toast.success(`Katalog ${newTipe} "${party}" dibuat`);
      setOpenNew(false);
      setNewPihak("");
    } catch (e: any) {
      toast.error(e?.data?.message ?? e?.message ?? "Gagal membuat katalog");
    } finally {
      setSavingNew(false);
    }
  };

  const handleAddItem = async () => {
    if (!addFor) return;
    const name = addName.trim();
    if (!name) { toast.error("Isi nama barang"); return; }
    if (parseNum(addHarga) <= 0) { toast.error("Isi harga barang"); return; }
    setAddSaving(true);
    try {
      await addKatalogItem({
        tipe: addFor.tipe,
        namaPihak: addFor.namaPihak,
        kodeBarang: "",
        namaBarang: name,
        harga: parseNum(addHarga),
      });
      toast.success(`"${name}" ditambahkan ke katalog ${addFor.namaPihak}`);
      setAddFor(null);
      setAddName("");
      setAddHarga(0);
    } catch (e: any) {
      toast.error(e?.data?.message ?? e?.message ?? "Gagal menambah barang");
    } finally {
      setAddSaving(false);
    }
  };

  const handleSavePrice = async (k: KatalogRow, it: KatalogItem, idx: number) => {
    const key = k.id + "|" + idx + "-" + itemKey(it);
    const harga = parseNum(drafts[key]);
    if (harga <= 0) { toast.error("Harga harus lebih dari 0"); return; }
    if (harga === it.harga) {
      setDrafts((prev) => { const next = { ...prev }; delete next[key]; return next; });
      return;
    }
    setSavingIdx(key);
    try {
      await addKatalogItem({
        tipe: k.tipe,
        namaPihak: k.namaPihak,
        kodeBarang: it.kodeBarang,
        namaBarang: it.namaBarang,
        harga,
      });
      toast.success(`Harga "${it.namaBarang}" diperbarui`);
      setDrafts((prev) => { const next = { ...prev }; delete next[key]; return next; });
    } catch (e: any) {
      toast.error(e?.data?.message ?? e?.message ?? "Gagal menyimpan harga");
    } finally {
      setSavingIdx(null);
    }
  };

  const handleRemoveItem = async (k: KatalogRow, it: KatalogItem) => {
    try {
      await removeKatalogItem({ id: k.id, kodeBarang: it.kodeBarang, namaBarang: it.namaBarang });
      toast.success(`"${it.namaBarang}" dihapus dari katalog`);
    } catch (e: any) {
      toast.error(e?.data?.message ?? e?.message ?? "Gagal menghapus barang");
    }
  };

  const handleDeleteKatalog = async (k: KatalogRow) => {
    try {
      await deleteKatalog({ id: k.id });
      toast.success(`Katalog "${k.namaPihak}" dihapus`);
    } catch (e: any) {
      toast.error(e?.data?.message ?? e?.message ?? "Gagal menghapus katalog");
    }
  };

  return (
    <div>
      <PageHeader
        title="Katalog Harga"
        description="Daftar harga khusus per Reseller & Supplier. Harga katalog otomatis dipakai form invoice."
        icon={BookOpenText}
        actions={
          <Button onClick={() => setOpenNew(true)}>
            <Plus className="mr-2 size-4" />
            Tambah Katalog
          </Button>
        }
      />

      <div className="mb-4 flex flex-wrap gap-2">
        {["", "Reseller", "Supplier"].map((t) => (
          <Button
            key={t || "all"}
            variant={filterTipe === t ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterTipe(t)}
            className="cursor-pointer"
          >
            {t === "" ? "Semua" : t}
          </Button>
        ))}
      </div>

      {katalogs === undefined && (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="mr-2 size-4 animate-spin" /> Memuat katalog…
        </div>
      )}

      {katalogs !== undefined && filtered && filtered.length === 0 && (
        <div className="rounded-lg border border-dashed px-6 py-14 text-center">
          <Tags className="mx-auto size-8 text-muted-foreground/60" />
          <p className="mt-3 text-sm font-medium">Belum ada katalog harga</p>
          <p className="mx-auto mt-1 max-w-md text-xs text-muted-foreground">
            Katalog dibuat otomatis saat invoice pertama untuk Reseller/Supplier baru.
          </p>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {filtered?.map((k: KatalogRow) => (
          <div key={k.id} className="rounded-lg border bg-card">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b bg-muted/20 px-4 py-3">
              <div className="flex items-center gap-2">
                {k.tipe === "Supplier" ? (
                  <Truck className="size-4 text-sky-600" />
                ) : (
                  <Store className="size-4 text-emerald-600" />
                )}
                <div>
                  <p className="text-sm font-semibold">{k.namaPihak}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {k.tipe} · {k.items.length} barang
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 cursor-pointer text-xs"
                  onClick={() => { setAddFor(k); setAddName(""); setAddHarga(0); }}
                >
                  <Plus className="mr-1 size-3.5" />
                  Tambah Barang
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 text-rose-600"
                  title="Hapus katalog"
                  onClick={() => handleDeleteKatalog(k)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>

            {k.items.length === 0 ? (
              <p className="px-4 py-8 text-center text-xs text-muted-foreground">
                Belum ada barang — klik "Tambah Barang".
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[420px] text-sm">
                  <thead>
                    <tr className="border-b text-left text-[11px] tracking-wide text-muted-foreground uppercase">
                      <th className="px-4 py-2 font-semibold">Barang</th>
                      <th className="px-2 py-2 text-right font-semibold">Harga</th>
                      <th className="w-24 px-2 py-2 text-right font-semibold">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {k.items.map((it, idx) => {
                      const key = k.id + "|" + idx + "-" + itemKey(it);
                      const draftVal = drafts[key] !== undefined ? drafts[key] : it.harga;
                      return (
                        <tr key={key} className="border-b last:border-0">
                          <td className="px-4 py-2">
                            <p className="font-medium">{it.namaBarang}</p>
                            {it.kodeBarang && (
                              <p className="font-mono text-[10px] text-muted-foreground">{it.kodeBarang}</p>
                            )}
                          </td>
                          <td className="px-2 py-2">
                            <div className="flex items-center justify-end gap-1">
                              <NumInput
                                className="h-8 w-28 text-right text-sm"
                                value={draftVal}
                                onValue={(n) => setDrafts((prev) => ({ ...prev, [key]: n }))}
                              />
                              {savingIdx === key ? (
                                <Loader2 className="size-4 animate-spin text-muted-foreground" />
                              ) : (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="size-8 cursor-pointer text-emerald-600"
                                  title="Simpan harga"
                                  onClick={() => handleSavePrice(k, it, idx)}
                                >
                                  <Save className="size-4" />
                                </Button>
                              )}
                            </div>
                          </td>
                          <td className="px-2 py-2 text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8 cursor-pointer text-rose-500"
                              title="Hapus barang"
                              onClick={() => handleRemoveItem(k, it)}
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Dialog buat katalog baru */}
      <Dialog open={openNew} onOpenChange={setOpenNew}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Buat Katalog Harga Baru</DialogTitle>
            <DialogDescription>
              Katalog dibuat per nama pihak. Setelah dibuat, tambahkan barang + harganya.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs font-medium">Tipe *</Label>
              <Select value={newTipe} onValueChange={(v) => setNewTipe(v as KatalogTipe)}>
                <SelectTrigger className="mt-1.5 cursor-pointer">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Reseller">Reseller</SelectItem>
                  <SelectItem value="Supplier">Supplier</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-medium">Nama {newTipe} *</Label>
              <div className="mt-1.5">
                <Input
                  list="katalog-pihak-options"
                  placeholder={newTipe === "Supplier" ? "CV Samudra Jaya" : "Toko Ibu Sari"}
                  value={newPihak}
                  onChange={(e) => setNewPihak(e.target.value)}
                />
                <datalist id="katalog-pihak-options">
                  {pihakOptions.map((p: string, i: number) => (
                    <option key={p + "-" + i} value={p} />
                  ))}
                </datalist>
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setOpenNew(false)}>Batal</Button>
            <Button onClick={handleCreateKatalog} disabled={savingNew}>
              {savingNew ? "Membuat..." : "Buat Katalog"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog tambah barang ke katalog */}
      <Dialog open={!!addFor} onOpenChange={(o) => !o && setAddFor(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Tambah Barang ke Katalog {addFor?.namaPihak}</DialogTitle>
            <DialogDescription>
              Ketik nama barang — cocokkan dengan database bila ada, atau isi manual + harga baru.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs font-medium">Nama Barang *</Label>
              <div className="mt-1.5">
                <BarangSearch
                  className="w-full"
                  barang={(barang ?? []) as BarangOption[]}
                  value={addName}
                  onChange={setAddName}
                  onPick={(b) => {
                    setAddName(b.nama);
                    if (parseNum(addHarga) <= 0 && b.harga) setAddHarga(b.harga);
                  }}
                  placeholder="Ketik nama barang…"
                  notFoundText="Barang tidak ditemukan — tetap bisa ditambahkan."
                />
              </div>
            </div>
            <div>
              <Label className="text-xs font-medium">Harga ({addFor?.tipe === "Supplier" ? "Beli" : "Jual"}) *</Label>
              <NumInput
                className="mt-1.5 h-9 text-base sm:text-sm"
                value={addHarga}
                onValue={setAddHarga}
                placeholder="0"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setAddFor(null)}>Batal</Button>
            <Button onClick={handleAddItem} disabled={addSaving}>
              {addSaving ? "Menyimpan..." : "Tambah ke Katalog"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
