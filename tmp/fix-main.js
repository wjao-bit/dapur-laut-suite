const fs = require('fs');
let c = fs.readFileSync('/project/src/main.tsx', 'utf8');
const old = `const envConvexUrl: string | undefined = (import.meta.env.VITE_CONVEX_URL as string | undefined)?.trim();
const convexUrl: string =
  envConvexUrl && !BROKEN_CONVEX_URLS.includes(envConvexUrl)
    ? envConvexUrl
    : FALLBACK_CONVEX_URL;`;
const nw = `const convexUrl: string = FALLBACK_CONVEX_URL;`;
if (c.includes(old)) {
  c = c.replace(old, nw);
  fs.writeFileSync('/project/src/main.tsx', c);
  console.log('Fixed!');
} else {
  console.log('Not found');
  const i = c.indexOf('envConvexUrl');
  if (i > -1) console.log(c.substring(i, i + 200));
}
