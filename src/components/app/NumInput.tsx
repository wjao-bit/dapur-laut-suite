import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { parseNum } from "@/lib/format";

/**
 * Input angka yang ramah Android & desktop:
 * - Menyimpan STRING mentah saat mengetik → `0,` / `0.` / `0,7` / `1.500`
 *   bisa diketik bebas (input type="number" justru MEMBLOKIR nilai antara
 *   seperti "0," sehingga mengetik 0,7 di Android sering gagal/kosong).
 * - `inputMode="decimal"` → keyboard Android menampilkan keypad angka
 *   dengan koma/titik desimal.
 * - Nilai tetap disimpan sebagai angka (lewat onValue) agar hitung-hitung
 *   (subtotal, total, kas) tetap akurat — parse terjadi sekali, bukan per ketik.
 * - Koma (,) dan titik (.) sama-sama diterima sebagai pemisah desimal,
 *   "1.500" (ribuan) juga tetap dibaca 1500 (lihat parseNum).
 * - Saat kolom difokus, seluruh isi terpilih → mengetik nilai baru langsung
 *   menggantikan nilai lama (memasukkan angka jadi lebih cepat di Android).
 */
export function NumInput({
  value,
  onValue,
  className,
  placeholder,
  disabled,
  autoFocus,
  allowNegative = false,
  id,
}: {
  value: number | undefined | null;
  onValue: (n: number) => void;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
  autoFocus?: boolean;
  allowNegative?: boolean;
  id?: string;
}) {
  const [text, setText] = useState<string>(() =>
    value && value !== 0 ? String(value) : "",
  );
  const focused = useRef(false);

  // Sinkron dari perubahan eksternal (prefill edit, pilih barang, reset form)
  // — tapi jangan timpa teks yang sedang diketik pengguna.
  useEffect(() => {
    if (focused.current) return;
    setText(value && value !== 0 ? String(value) : "");
  }, [value]);

  const sanitize = (raw: string): string => {
    let s = raw.replace(allowNegative ? /[^0-9.,-]/g : /[^0-9.,]/g, "");
    if (allowNegative) {
      // hanya satu minus di depan
      const neg = s.startsWith("-");
      s = s.replace(/-/g, "");
      if (neg) s = "-" + s;
    }
    // maksimal satu pemisah desimal (koma ATAU titik)
    const sep = s.includes(",") ? "," : s.includes(".") ? "." : "";
    const parts = s.split(/[.,]/);
    const frac = (parts.slice(1).join("") || "").replace(/[.,]/g, "");
    return (parts[0] || "") + (sep ? sep + frac : "");
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cleaned = sanitize(e.target.value);
    setText(cleaned);
    onValue(parseNum(cleaned));
  };

  const handleBlur = () => {
    focused.current = false;
    // Normalisasi tampilan saat keluar dari kolom: "0,7" → "0.7"
    if (text.trim() !== "") setText(String(parseNum(text)));
  };

  return (
    <Input
      id={id}
      type="text"
      inputMode="decimal"
      autoComplete="off"
      className={`tabular-nums ${className ?? ""}`}
      placeholder={placeholder}
      value={text}
      disabled={disabled}
      autoFocus={autoFocus}
      onFocus={(e) => {
        focused.current = true;
        // Pilih semua teks → ketikan pertama langsung menggantikan nilai lama.
        e.target.select();
      }}
      onChange={handleChange}
      onBlur={handleBlur}
    />
  );
}
