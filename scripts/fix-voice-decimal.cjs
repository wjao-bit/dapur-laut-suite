// Fix parser suara v2: ganti berdasarkan baris yang memuat [.,!?]
const fs = require("fs");
const p = "/project/src/pages/app/BarangMasukPage.tsx";
const lines = fs.readFileSync(p, "utf8").split("\n");

const idx = lines.findIndex((l) => l.includes("[.,!?]/g"));
if (idx < 0) {
  console.error("BARIS TIDAK DITEMUKAN");
  process.exit(1);
}
console.log("Baris lama:", JSON.stringify(lines[idx]));

lines[idx] = [
  "  let t = ` ${text.toLowerCase()} `",
  '    .replace(/[!?]/g, " ")',
  '    // pertahankan titik/koma desimal: "12.5" / "12,5" tetap satu angka',
  '    .replace(/,(?!\\d)/g, " ")',
  '    .replace(/\\.(?!\\d)/g, " ");',
].join("\n");

fs.writeFileSync(p, lines.join("\n"));
console.log("OK — fix desimal diterapkan pada baris", idx + 1);
