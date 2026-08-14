// ============================================================================
// GENERATOR IKON PWA — PT Dapur Laut
//
// Membuat ikon PNG ber-tema Dapur Laut (gradien biru laut → teal → hijau laut,
// siluet ikan putih + ombak) TANPA dependensi gambar: render per-piksel dengan
// supersampling, lalu encode PNG murni (zlib bawaan Node).
//
// Output ke public/:
//   icon-192.png            — ikon utama (Android/Chrome)
//   icon-512.png            — ikon utama resolusi tinggi
//   icon-maskable-512.png   — ikon maskable (latar full-bleed, konten aman)
//   apple-touch-icon.png    — ikon iOS (180x180)
//
// Cara jalan:  node scripts/gen-pwa-icons.mjs
// ============================================================================
import { deflateSync } from "node:zlib";
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(root, "public");

// ---------------------------------------------------------------------------
// PNG encoder (RGBA, 8-bit, filter 0)
// ---------------------------------------------------------------------------
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, "ascii");
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function encodePNG(width, height, rgba) {
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace
  const stride = width * 4;
  const raw = Buffer.alloc(height * (stride + 1));
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0; // filter none
    Buffer.from(rgba.buffer, rgba.byteOffset + y * stride, stride).copy(raw, y * (stride + 1) + 1);
  }
  const idat = deflateSync(raw, { level: 9 });
  return Buffer.concat([sig, pngChunk("IHDR", ihdr), pngChunk("IDAT", idat), pngChunk("IEND", Buffer.alloc(0))]);
}

// ---------------------------------------------------------------------------
// Geometri bantuan
// ---------------------------------------------------------------------------
const lerp = (a, b, t) => a + (b - a) * t;
const clamp01 = (v) => Math.min(1, Math.max(0, v));

/** Jarak titik ke ruas garis (p1→p2). */
function distToSegment(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len2 = dx * dx + dy * dy;
  let t = len2 === 0 ? 0 : ((px - x1) * dx + (py - y1) * dy) / len2;
  t = clamp01(t);
  const cx = x1 + t * dx;
  const cy = y1 + t * dy;
  return Math.hypot(px - cx, py - cy);
}

/** Titik pada kurva kuadratik B(t) = (1-t)²P0 + 2(1-t)t C + t² P1. */
function quadPoint(t, p0, c, p1) {
  const a = (1 - t) * (1 - t);
  const b = 2 * (1 - t) * t;
  const d = t * t;
  return [a * p0[0] + b * c[0] + d * p1[0], a * p0[1] + b * c[1] + d * p1[1]];
}

/** Jarak titik ke kurva kuadratik (aproksimasi polyline). */
function distToQuad(px, py, p0, c, p1, segments = 20) {
  let best = Infinity;
  let prev = p0;
  for (let i = 1; i <= segments; i++) {
    const p = quadPoint(i / segments, p0, c, p1);
    best = Math.min(best, distToSegment(px, py, prev[0], prev[1], p[0], p[1]));
    prev = p;
  }
  return best;
}

/** Titik di dalam segitiga (barycentric). */
function pointInTri(px, py, a, b, c) {
  const d1 = (px - b[0]) * (a[1] - b[1]) - (a[0] - b[0]) * (py - b[1]);
  const d2 = (px - c[0]) * (b[1] - c[1]) - (b[0] - c[0]) * (py - c[1]);
  const d3 = (px - a[0]) * (c[1] - a[1]) - (c[0] - a[0]) * (py - a[1]);
  const neg = d1 < 0 || d2 < 0 || d3 < 0;
  const pos = d1 > 0 || d2 > 0 || d3 > 0;
  return !(neg && pos);
}

/** Gradien vertikal tema Dapur Laut: sky-600 → teal-600 → emerald-600. */
const STOPS = [
  [0, [2, 132, 199]], // #0284c7 sky-600
  [0.52, [13, 148, 136]], // #0d9488 teal-600
  [1, [5, 150, 105]], // #059669 emerald-600
];
function bgColor(t) {
  t = clamp01(t);
  for (let i = 0; i < STOPS.length - 1; i++) {
    const [t0, c0] = STOPS[i];
    const [t1, c1] = STOPS[i + 1];
    if (t >= t0 && t <= t1) {
      const k = (t - t0) / (t1 - t0);
      return [Math.round(lerp(c0[0], c1[0], k)), Math.round(lerp(c0[1], c1[1], k)), Math.round(lerp(c0[2], c1[2], k))];
    }
  }
  return STOPS[STOPS.length - 1][1];
}

const WHITE = [255, 255, 255];
const EYE = [15, 118, 110]; // #0f766e teal-700

/** Siluet ikan + ombak dalam unit space (0..1). */
function drawFishShapes(u, v, shapes) {
  // Badan (elips)
  const bx = 0.47;
  const by = 0.44;
  const rx = 0.165;
  const ry = 0.115;
  const dBody = Math.hypot((u - bx) / rx, (v - by) / ry);
  if (dBody <= 1) shapes.push({ color: WHITE, alpha: 1 });
  // Ekor (cabang kanan)
  const tail1 = [
    [0.6, 0.385],
    [0.765, 0.3],
    [0.652, 0.44],
  ];
  const tail2 = [
    [0.6, 0.495],
    [0.765, 0.58],
    [0.652, 0.44],
  ];
  if (pointInTri(u, v, ...tail1) || pointInTri(u, v, ...tail2)) shapes.push({ color: WHITE, alpha: 1 });
  // Mata
  const dEye = Math.hypot(u - 0.412, v - 0.405);
  if (dEye <= 0.018) shapes.push({ color: EYE, alpha: 1 });
  // Ombak
  const w1 = distToQuad(u, v, [0.26, 0.72], [0.5, 0.645], [0.74, 0.72]);
  if (w1 <= 0.016) shapes.push({ color: WHITE, alpha: 0.92 });
  const w2 = distToQuad(u, v, [0.36, 0.795], [0.5, 0.85], [0.64, 0.795]);
  if (w2 <= 0.011) shapes.push({ color: WHITE, alpha: 0.72 });
}

/** Render ikon ukuran `size`; `maskable=true` → latar full-bleed tanpa sudut. */
function renderIcon(size, maskable) {
  const img = new Uint8Array(size * size * 4);
  const SS = 3; // supersampling 3x3
  const radius = maskable ? 0 : size * 0.22;

  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      let r = 0;
      let g = 0;
      let b = 0;
      let a = 0;
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const x = px + (sx + 0.5) / SS;
          const y = py + (sy + 0.5) / SS;

          // Latar rounded-rect (atau persegi penuh untuk maskable)
          const inBg = (() => {
            if (maskable) return true;
            const cx = Math.min(Math.max(x, radius), size - radius);
            const cy = Math.min(Math.max(y, radius), size - radius);
            const dx = x - cx;
            const dy = y - cy;
            return dx * dx + dy * dy <= radius * radius;
          })();

          let col = [0, 0, 0];
          if (inBg) col = bgColor(y / size);
          else {
            // di luar rounded-rect → transparan
            r += 0; g += 0; b += 0; a += 0;
            continue;
          }

          const u = x / size;
          const v = y / size;
          const shapes = [];
          drawFishShapes(u, v, shapes);
          for (const s of shapes) {
            const al = s.alpha;
            col = [
              col[0] * (1 - al) + s.color[0] * al,
              col[1] * (1 - al) + s.color[1] * al,
              col[2] * (1 - al) + s.color[2] * al,
            ];
          }
          r += col[0];
          g += col[1];
          b += col[2];
          a += 1;
        }
      }
      const i = (py * size + px) * 4;
      const n = SS * SS;
      img[i] = Math.round(r / n);
      img[i + 1] = Math.round(g / n);
      img[i + 2] = Math.round(b / n);
      img[i + 3] = 255;
    }
  }
  return img;
}

// ---------------------------------------------------------------------------
mkdirSync(OUT, { recursive: true });

const jobs = [
  { file: "icon-192.png", size: 192, maskable: false },
  { file: "icon-512.png", size: 512, maskable: false },
  { file: "icon-maskable-512.png", size: 512, maskable: true },
  { file: "apple-touch-icon.png", size: 180, maskable: false },
];

for (const job of jobs) {
  console.log(`  Rendering ${job.file} (${job.size}px)...`);
  const img = renderIcon(job.size, job.maskable);
  const png = encodePNG(job.size, job.size, img);
  writeFileSync(join(OUT, job.file), png);
  console.log(`  ✅ ${job.file} — ${(png.length / 1024).toFixed(1)} KB`);
}

console.log("\nSelesai — semua ikon PWA Dapur Laut dibuat di public/");
