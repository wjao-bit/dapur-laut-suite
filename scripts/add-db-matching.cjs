// Cocokkan nama supplier & barang pada BarangMasukPage dengan database master.
const fs = require("fs");
const p = "/project/src/pages/app/BarangMasukPage.tsx";
let c = fs.readFileSync(p, "utf8");
let ok = true;

function rep(tag, oldS, newS) {
  if (!c.includes(oldS)) {
    console.error("NOT FOUND [" + tag + "]:", JSON.stringify(oldS.slice(0, 70)));
    ok = false;
    return;
  }
  c = c.replace(oldS, () => newS);
}

// 1) Query supplier & barang master
rep(
  "queries",
  '  const pasars = useQuery(api.queries.listPasar) as any[] | undefined;',
  [
    "  const pasars = useQuery(api.queries.listPasar) as any[] | undefined;",
    "  const suppliers = useQuery(api.queries.listSupplier) as any[] | undefined;",
    "  const barangs = useQuery(api.queries.listBarang) as any[] | undefined;",
  ].join("\n"),
);

// 2) Helper pencocokan nama (exact → mengandung)
rep(
  "titleCase",
  [
    "function titleCase(s: string) {",
    "  return s.replace(/\\b\\w/g, (ch) => ch.toUpperCase());",
    "}",
  ].join("\n"),
  [
    "function titleCase(s: string) {",
    "  return s.replace(/\\b\\w/g, (ch) => ch.toUpperCase());",
    "}",
    "",
    "const normName = (s: string) => (s ?? \"\").toLowerCase().replace(/\\s+/g, \" \").trim();",
    "",
    "/** Cari padanan nama di database master: sama persis → mengandung (min. 4 huruf). */",
    "function findBestMatch(",
    "  name: string,",
    "  list: { nama?: string; namaPasar?: string; harga?: number }[] | undefined,",
    "): { nama?: string; namaPasar?: string; harga?: number } | null {",
    "  if (!list || !list.length) return null;",
    "  const n = normName(name);",
    "  if (!n) return null;",
    "  let hit = list.find((x) => normName(x.nama ?? x.namaPasar) === n);",
    "  if (hit) return hit;",
    "  if (n.length >= 4) {",
    "    hit = list.find((x) => {",
    "      const xn = normName(x.nama ?? x.namaPasar);",
    "      return !!xn && (xn.includes(n) || n.includes(xn));",
    "    });",
    "  }",
    "  return hit ?? null;",
    "}",
  ].join("\n"),
);

// 3) Hasil voice dicocokkan ke database (auto-koreksi nama + isi modal)
rep(
  "voice-result",
  [
    "      const parsed = parseVoiceNote(transcript);",
    "      if (parsed.items.length > 0) {",
    "        setItems(parsed.items.map((it) => ({ ...it })));",
    "        if (parsed.supplier) setNamaSupplier(parsed.supplier);",
    "        toast.success(",
    "          \\u0060\\uD83C\\uDFA4 Terbaca: \\u0024{parsed.items.map((x) => \\u0060\\u0024{x.namaBarang} \\u0024{x.qty}\\u0060).join(\", \")}\\u0060,",
    "        );",
    "      } else {",
  ].join("\n").replace(/\\u0060/g, "`").replace(/\\u0024/g, "$").replace(/\\uD83C/g, "\uD83C").replace(/\\uDFA4/g, "\uDFA4"),
  [
    "      const parsed = parseVoiceNote(transcript);",
    "      if (parsed.items.length > 0) {",
    "        // Cocokkan nama barang & supplier dengan database master",
    "        const corrected = parsed.items.map((it) => {",
    "          const m = findBestMatch(it.namaBarang, barangs);",
    "          return {",
    "            ...it,",
    "            namaBarang: m ? (m.nama ?? it.namaBarang) : it.namaBarang,",
    "            hargaModal: m?.harga ?? it.hargaModal,",
    "          };",
    "        });",
    "        setItems(corrected);",
    "        if (parsed.supplier) {",
    "          const sm = findBestMatch(parsed.supplier, suppliers);",
    "          setNamaSupplier(sm ? (sm.nama ?? parsed.supplier) : parsed.supplier);",
    "        }",
    "        const fixed = corrected.filter(",
    "          (x, i) => x.namaBarang !== parsed.items[i].namaBarang,",
    "        ).length;",
    "        toast.success(",
    "          `🎤 Terbaca: ${corrected.map((x) => `${x.namaBarang} ${x.qty}`).join(\", \")}` +",
    "            (fixed > 0 ? ` (${fixed} nama disesuaikan dengan database)` : \"\"),",
    "        );",
    "      } else {",
  ].join("\n"),
);

// 4) Simpan: validasi & koreksi nama sebelum create
rep(
  "handle-create",
  [
    "    setSaving(true);",
    "    try {",
    "      await createBatch({ tanggal, namaSupplier, petugas, catatan, items });",
  ].join("\n"),
  [
    "    // Pastikan nama supplier & barang sesuai database master",
    "    const sm = findBestMatch(namaSupplier.trim(), suppliers);",
    "    const finalSupplier = sm?.nama ?? namaSupplier.trim();",
    "    const correctedItems = items",
    "      .filter((it) => it.namaBarang.trim() && it.qty > 0)",
    "      .map((it) => {",
    "        const m = findBestMatch(it.namaBarang.trim(), barangs);",
    "        return { ...it, namaBarang: m ? (m.nama ?? it.namaBarang.trim()) : it.namaBarang.trim() };",
    "      });",
    "    if (!sm) {",
    "      toast.error(\"Supplier tidak ada di database — pilih dari daftar\");",
    "      return;",
    "    }",
    "    const unknown = correctedItems",
    "      .filter((it) => !findBestMatch(it.namaBarang, barangs))",
    "      .map((it) => it.namaBarang);",
    "    if (unknown.length > 0) {",
    "      toast.error(`Barang belum terdaftar: ${unknown.join(\", \")}`);",
    "      return;",
    "    }",
    "    setSaving(true);",
    "    try {",
    "      await createBatch({",
    "        tanggal,",
    "        namaSupplier: finalSupplier,",
    "        petugas,",
    "        catatan,",
    "        items: correctedItems,",
    "      });",
  ].join("\n"),
);

// 5) Datalist supplier pada input
rep(
  "input-supplier",
  [
    '                <Input',
    '                  placeholder="cth. Aga"',
    '                  value={namaSupplier}',
    '                  onChange={(e) => setNamaSupplier(e.target.value)}',
    '                  className="mt-1"',
    "                />",
    "              </div>",
  ].join("\n"),
  [
    "                <Input",
    '                  placeholder="cth. Aga"',
    '                  list="supplier-options"',
    "                  value={namaSupplier}",
    "                  onChange={(e) => setNamaSupplier(e.target.value)}",
    '                  className="mt-1"',
    "                />",
    '                <datalist id="supplier-options">',
    "                  {(suppliers ?? []).map((s: any) => (",
    '                    <option key={s._id ?? s.id} value={s.nama} />',
    "                  ))}",
    "                </datalist>",
    "              </div>",
  ].join("\n"),
);

// 6) Datalist barang pada input nama barang
rep(
  "input-barang",
  [
    "                  <Input",
    '                    placeholder="Nama barang"',
    "                    value={it.namaBarang}",
  ].join("\n"),
  [
    "                  <Input",
    '                    placeholder="Nama barang"',
    '                    list="barang-master-options"',
    "                    value={it.namaBarang}",
  ].join("\n"),
);

// 7) Datalist master barang (sekali, sebelum tombol Tambah barang)
rep(
  "datalist-barang",
  [
    "              <Button",
    '                type="button"',
    '                variant="outline"',
    '                size="sm"',
    '                className="cursor-pointer gap-1.5"',
    "                onClick={() => setItems((prev) => [...prev, emptyItem()])}",
    "              >",
    '                <Plus className="size-3.5" /> Tambah barang',
    "              </Button>",
  ].join("\n"),
  [
    '              <datalist id="barang-master-options">',
    "                {(barangs ?? []).map((b: any) => (",
    '                  <option key={b._id ?? b.kode} value={b.nama} />',
    "                ))}",
    "              </datalist>",
    "              <Button",
    '                type="button"',
    '                variant="outline"',
    '                size="sm"',
    '                className="cursor-pointer gap-1.5"',
    "                onClick={() => setItems((prev) => [...prev, emptyItem()])}",
    "              >",
    '                <Plus className="size-3.5" /> Tambah barang',
    "              </Button>",
  ].join("\n"),
);

if (!ok) process.exit(1);
fs.writeFileSync(p, c);
console.log("OK — semua 7 patch pencocokan database diterapkan");
