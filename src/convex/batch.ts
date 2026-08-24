// Terapkan fitur voice note ke src/pages/app/BarangMasukPage.tsx
// (str_replace pada file ini tidak persist di sandbox)
const fs = require("fs");
const p = "/project/src/pages/app/BarangMasukPage.tsx";
let c = fs.readFileSync(p, "utf8");
let ok = true;

function rep(oldS, newS) {
  if (!c.includes(oldS)) {
    console.error("NOT FOUND:", JSON.stringify(oldS.slice(0, 60)));
    ok = false;
    return;
  }
  c = c.replace(oldS, () => newS);
}

// 1) import useRef
rep(
  'import { useMemo, useState } from "react";',
  'import { useMemo, useRef, useState } from "react";',
);

// 2) import ikon Mic & MicOff
rep(
  "  FileText,\n  Loader2,\n} from \"lucide-react\";",
  "  FileText,\n  Loader2,\n  Mic,\n  MicOff,\n} from \"lucide-react\";",
);

// 3) parser suara sebelum komponen
rep(
  "export default function BarangMasukPage() {",
  `// ===== Parsing catatan suara (speech-to-text) =====
const WORD_NUM: Record<string, number> = {
  nol: 0,
  satu: 1,
  dua: 2,
  tiga: 3,
  empat: 4,
  lima: 5,
  enam: 6,
  tujuh: 7,
  delapan: 8,
  sembilan: 9,
  sepuluh: 10,
  sebelas: 11,
  setengah: 0.5,
};

function readNumberAt(
  tokens: string[],
  i: number,
): { value: number; len: number } | null {
  const t = tokens[i];
  if (!t) return null;
  if (/^\\d+([.,]\\d+)?$/.test(t))
    return { value: parseFloat(t.replace(",", ".")), len: 1 };
  const w = WORD_NUM[t];
  if (w === undefined) return null;
  if (w >= 1 && w <= 10 && tokens[i + 1] === "belas")
    return { value: 10 + w, len: 2 };
  if (w >= 1 && w <= 10 && tokens[i + 1] === "puluh") {
    const u = tokens[i + 2] !== undefined ? WORD_NUM[tokens[i + 2]] : undefined;
    if (u !== undefined && u < 10) return { value: w * 10 + u, len: 3 };
    return { value: w * 10, len: 2 };
  }
  return { value: w, len: 1 };
}

const QTY_UNITS = new Set([
  "kilo",
  "kg",
  "kilogram",
  "gram",
  "gr",
  "ons",
  "liter",
  "ltr",
  "buah",
  "pcs",
  "pack",
  "dus",
  "karung",
  "sak",
  "ikat",
  "kotak",
  "box",
]);

function titleCase(s: string) {
  return s.replace(/\\b\\w/g, (ch) => ch.toUpperCase());
}

/** Ubah ucapan cth. "tongkol lima kilo dari Aga" jadi item batch. */
export function parseVoiceNote(
  text: string,
): { supplier: string; items: BatchItem[] } {
  let t = \` \${text.toLowerCase()} \`.replace(/[.,!?]/g, " ");
  let supplier = "";
  const di = t.lastIndexOf(" dari ");
  if (di >= 0) {
    supplier = t.slice(di + 6).trim();
    t = t.slice(0, di);
  }
  const tokens = t.split(/\\s+/).filter(Boolean);
  const items: BatchItem[] = [];
  let curName: string[] = [];
  let i = 0;
  while (i < tokens.length) {
    const num = readNumberAt(tokens, i);
    if (num) {
      i += num.len;
      if (i < tokens.length && QTY_UNITS.has(tokens[i])) i++;
      const name = curName.join(" ").trim();
      if (name && num.value > 0)
        items.push({ namaBarang: titleCase(name), qty: num.value, hargaModal: 0 });
      curName = [];
    } else {
      curName.push(tokens[i]);
      i++;
    }
  }
  return { supplier: titleCase(supplier), items };
}

export default function BarangMasukPage() {`,
);

// 4) state & handler voice di dalam komponen
rep(
  `  const [items, setItems] = useState<BatchItem[]>([emptyItem()]);
  const [saving, setSaving] = useState(false);`,
  `  const [items, setItems] = useState<BatchItem[]>([emptyItem()]);
  const [saving, setSaving] = useState(false);

  // ---- voice input (speech-to-text bawaan browser) ----
  const [listening, setListening] = useState(false);
  const recogRef = useRef<any>(null);
  const speechSupported =
    typeof window !== "undefined" &&
    ((window as any).webkitSpeechRecognition || (window as any).SpeechRecognition);

  const startVoice = () => {
    const SR =
      (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (!SR) {
      toast.error("Browser tidak mendukung voice — gunakan Chrome Android");
      return;
    }
    if (listening) {
      recogRef.current?.stop();
      return;
    }
    const rec = new SR();
    rec.lang = "id-ID";
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.onstart = () => setListening(true);
    rec.onend = () => setListening(false);
    rec.onerror = (e: any) => {
      setListening(false);
      toast.error(
        e?.error === "not-allowed"
          ? "Izin mikrofon ditolak"
          : e?.error === "no-speech"
            ? "Tidak ada suara terdeteksi"
            : "Voice error, coba lagi",
      );
    };
    rec.onresult = (e: any) => {
      const transcript = Array.from(e.results as ArrayLike<any>)
        .map((r: any) => r[0]?.transcript ?? "")
        .join(" ")
        .trim();
      if (!transcript) return;
      const parsed = parseVoiceNote(transcript);
      if (parsed.items.length > 0) {
        setItems(parsed.items.map((it) => ({ ...it })));
        if (parsed.supplier) setNamaSupplier(parsed.supplier);
        toast.success(
          \`🎤 Terbaca: \${parsed.items.map((x) => \`\${x.namaBarang} \${x.qty}\`).join(", ")}\`,
        );
      } else {
        toast.warning(
          \`🎤 Tidak dikenali: "\${transcript}". Contoh: "tongkol lima kilo dari Aga"\`,
        );
      }
    };
    recogRef.current = rec;
    try {
      rec.start();
    } catch {
      /* sudah berjalan */
    }
  };`,
);

// 5) tombol mic di header section Barang
rep(
  `            <div className="space-y-2">
              <Label>Barang</Label>
              {items.map((it, idx) => (`,
  `            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Label>Barang</Label>
                {speechSupported && (
                  <Button
                    type="button"
                    variant={listening ? "default" : "outline"}
                    size="sm"
                    className="cursor-pointer gap-1.5"
                    onClick={startVoice}
                  >
                    {listening ? (
                      <>
                        <MicOff className="size-3.5 animate-pulse" /> Mendengarkan… ketuk untuk stop
                      </>
                    ) : (
                      <>
                        <Mic className="size-3.5" /> Isi via Suara 🎤
                      </>
                    )}
                  </Button>
                )}
              </div>
              {listening && (
                <p className="text-xs text-muted-foreground">
                  Ucapkan cth: “<b>tongkol lima kilo dari Aga</b>” atau “cabai dua puluh kilo dari
                  Budi” — lalu isi harga modal manual.
                </p>
              )}
              {items.map((it, idx) => (`,
);

if (!ok) process.exit(1);
fs.writeFileSync(p, c);
console.log("OK — semua 5 patch diterapkan. Panjang file baru:", c.length);
