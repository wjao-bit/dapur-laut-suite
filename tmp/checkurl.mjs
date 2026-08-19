import { readdirSync, readFileSync } from "fs";
const dir = "dist/assets";
for (const f of readdirSync(dir)) {
  if (!f.endsWith(".js")) continue;
  const s = readFileSync(dir + "/" + f, "utf8");
  const urls = [...new Set(s.match(/https:\/\/[a-z0-9-]+\.convex\.cloud/g) || [])];
  if (urls.length) console.log(f, JSON.stringify(urls));
}
