import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const dir = join(process.cwd(), "src/pages/app");
for (const f of readdirSync(dir).filter((x) => x.endsWith(".tsx"))) {
  const src = readFileSync(join(dir, f), "utf8");
  const lines = src.split("\n");
  lines.forEach((l, i) => {
    const t = l.trim();
    if (
      /Number\s*\(/.test(t) &&
      /(target\.value|setQty|setNominal|setHarga|setStok|setDibayar|setGaji|setBonus|setDenda|setJumlah|Number\(qty\)|Number\(r\.)/.test(t)
    ) {
      console.log(`${f}:${i + 1}: ${t.slice(0, 150)}`);
    }
  });
}
