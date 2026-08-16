import { useMemo, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { PageHeader } from "@/components/app/ui";
import { DataTable, type Column } from "@/components/app/DataTable";
import { NumInput } from "@/components/app/NumInput";
import { genId, parseNum } from "@/lib/format";

export interface FieldDef {
  key: string;
  label: string;
  type?: "text" | "number" | "textarea" | "select";
  options?: string[];
  required?: boolean;
  placeholder?: string;
  min?: number;
  prefix?: string;
  span?: 1 | 2;
}

export interface MasterCrudProps {
  title: string;
  description: string;
  icon: LucideIcon;
  rows: any[] | undefined;
  loading?: boolean;
  columns: Column<any>[];
  fields: FieldDef[];
  /** Nama kolom kunci bisnis (mis. "kode", "id") */
  keyField: string;
  /** Prefix ID otomatis (mis. "BRG") */
  idPrefix: string;
  /** Mutation upsert untuk tabel ini (dipanggil dengan { doc }) */
  upsertFn: any;
  table: string;
  searchKeys: string[];
  /** Kustom render di cell aksi (opsional, mis. tombol bayar utang) */
  extraActions?: (row: any) => ReactNode;
  emptyTitle?: string;
  emptyDescription?: string;
}

function defaultValues(fields: FieldDef[], idPrefix: string): Record<string, any> {
  const dv: Record<string, any> = {};
  for (const f of fields) {
    if (f.type === "number") dv[f.key] = 0;
    else if (f.type === "select" && f.options?.length) dv[f.key] = f.options[0];
    else dv[f.key] = f.key === "kode" || f.key === "id" ? genId(idPrefix) : "";
  }
  return dv;
}

export function MasterCrud({
  title,
  description,
  icon,
  rows,
  loading,
  columns,
  fields,
  keyField,
  idPrefix,
  upsertFn,
  table,
  searchKeys,
  extraActions,
  emptyTitle,
  emptyDescription,
}: MasterCrudProps) {
  const upsert = useMutation(upsertFn);
  const remove = useMutation(api.business.deleteMaster);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [values, setValues] = useState<Record<string, any>>({});
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);

  const filtered = useMemo(() => {
    if (!rows) return rows;
    if (!search.trim()) return rows;
    const q = search.toLowerCase();
    return rows.filter((r) => searchKeys.some((k) => String(r[k] ?? "").toLowerCase().includes(q)));
  }, [rows, search, searchKeys]);

  const openCreate = () => {
    setEditing(null);
    setValues(defaultValues(fields, idPrefix));
    setOpen(true);
  };

  const openEdit = (row: any) => {
    setEditing(row);
    const v: Record<string, any> = {};
    for (const f of fields) v[f.key] = row[f.key];
    setValues(v);
    setOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await upsert({ doc: values });
      toast.success(editing ? `${title} diperbarui` : `${title} berhasil ditambahkan`);
      setOpen(false);
    } catch (e: any) {
      const msg = e?.data?.error ?? e?.message ?? "Terjadi kesalahan";
      toast.error(msg.includes("schema") ? "Data tidak valid. Periksa kembali isian Anda." : msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (row: any) => {
    try {
      await remove({ table, id: String(row[keyField]) });
      toast.success(`${title} dihapus`);
    } catch (e: any) {
      toast.error(e?.data?.error ?? e?.message ?? "Gagal menghapus");
    }
  };

  const actionColumn: Column<any> = {
    key: "_actions",
    label: "",
    align: "right",
    render: (row) => (
      <div className="flex items-center justify-end gap-1">
        {extraActions?.(row)}
        <Button variant="ghost" size="icon" className="size-7" onClick={() => openEdit(row)} title="Ubah">
          <Pencil className="size-3.5" />
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="icon" className="size-7 text-rose-600 hover:text-rose-600" title="Hapus">
              <Trash2 className="size-3.5" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Hapus {title}?</AlertDialogTitle>
              <AlertDialogDescription>
                Tindakan ini tidak dapat dibatalkan. Data dengan ID <b>{String(row[keyField])}</b> akan dihapus.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Batal</AlertDialogCancel>
              <AlertDialogAction className="bg-rose-600 hover:bg-rose-700" onClick={() => handleDelete(row)}>
                Hapus
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    ),
  };

  return (
    <div>
      <PageHeader
        title={title}
        description={description}
        icon={icon}
        actions={
          <Button onClick={openCreate}>
            <Plus className="mr-2 size-4" />
            Tambah {title}
          </Button>
        }
      />

      <div className="relative mb-4 max-w-sm">
        <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder={`Cari ${title.toLowerCase()}...`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <DataTable
        columns={[...columns, actionColumn]}
        rows={filtered}
        loading={loading}
        keyField={(r) => String(r[keyField])}
        emptyTitle={emptyTitle ?? `Belum ada ${title.toLowerCase()}`}
        emptyDescription={
          emptyDescription ?? `Klik "Tambah ${title}" untuk menambahkan data pertama.`
        }
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? `Ubah ${title}` : `Tambah ${title}`}</DialogTitle>
            <DialogDescription>
              Kolom bertanda * wajib diisi. ID yang sama akan diperbarui otomatis (tidak duplikat).
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-2 sm:grid-cols-2">
            {fields.map((f) => (
              <div key={f.key} className={f.span === 2 ? "sm:col-span-2" : ""}>
                <Label htmlFor={`f-${f.key}`} className="text-xs font-medium">
                  {f.label} {f.required && <span className="text-rose-500">*</span>}
                </Label>
                {f.type === "textarea" ? (
                  <Textarea
                    id={`f-${f.key}`}
                    className="mt-1.5"
                    value={String(values[f.key] ?? "")}
                    onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                    placeholder={f.placeholder}
                  />
                ) : f.type === "select" ? (
                  <select
                    id={`f-${f.key}`}
                    className="mt-1.5 flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                    value={String(values[f.key] ?? "")}
                    onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                  >
                    {f.options?.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                ) : f.type === "number" ? (
                  <NumInput
                    id={`f-${f.key}`}
                    className="mt-1.5"
                    value={typeof values[f.key] === "number" ? values[f.key] : parseNum(String(values[f.key] ?? ""))}
                    onValue={(n) => setValues((v) => ({ ...v, [f.key]: n }))}
                    placeholder={f.placeholder}
                    allowNegative={f.min !== undefined && f.min < 0}
                  />
                ) : (
                  <Input
                    id={`f-${f.key}`}
                    className="mt-1.5"
                    value={String(values[f.key] ?? "")}
                    onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                    placeholder={f.placeholder}
                  />
                )}
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Menyimpan..." : "Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
