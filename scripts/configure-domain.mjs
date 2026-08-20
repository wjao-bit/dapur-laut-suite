#!/usr/bin/env node
/**
 * Konfigurasi ulang PWA + TWA untuk domain milik pengguna.
 * Cara pakai:
 *   node scripts/configure-domain.mjs --domain dapurlaut.com
 *   node scripts/configure-domain.mjs --domain dapurlaut.com --fingerprint "AA:BB:...:FF"
 */
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

function parseArgs() {
  const args = process.argv.slice(2);
  const out = {};
  for (let i = 0; i < args.length; i += 2) {
    const k = args[i].replace(/^--/, "");
    out[k] = args[i + 1];
  }
  return out;
}

const { domain, fingerprint } = parseArgs();

if (!domain) {
  console.error("Penggunaan: node scripts/configure-domain.mjs --domain dapurlaut.com [--fingerprint AA:BB:...:FF]");
  process.exit(1);
}

const appHost = `app.${domain}`;
const convexHost = `convex.${domain}`;
const convexSiteHost = `convex-site.${domain}`;

// 1. Update public/manifest.webmanifest
const manifestPath = path.join(root, "public", "manifest.webmanifest");
const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
manifest.id = `https://${appHost}/`;
manifest.start_url = "https://" + appHost + "/";
manifest.scope = "https://" + appHost + "/";
writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n");
console.log("Updated public/manifest.webmanifest");

// 2. Update twa/twa-manifest.json
const twaPath = path.join(root, "twa", "twa-manifest.json");
const twa = JSON.parse(readFileSync(twaPath, "utf8"));
twa.host = appHost;
twa.webManifestUrl = `https://${appHost}/manifest.webmanifest`;
twa.iconUrl = `https://${appHost}/icon-512.png`;
twa.maskableIconUrl = `https://${appHost}/icon-maskable-512.png`;
twa.monochromeIconUrl = `https://${appHost}/icon-512.png`;
writeFileSync(twaPath, JSON.stringify(twa, null, 2) + "\n");
console.log("Updated twa/twa-manifest.json");

// 3. Update public/.well-known/assetlinks.json jika fingerprint diberikan
const assetLinksPath = path.join(root, "public", ".well-known", "assetlinks.json");
if (fingerprint) {
  const assetLinks = [
    {
      relation: ["delegate_permission/common.handle_all_urls"],
      target: {
        namespace: "android_app",
        package_name: twa.appId,
        sha256_cert_fingerprints: [fingerprint],
      },
    },
  ];
  writeFileSync(assetLinksPath, JSON.stringify(assetLinks, null, 2) + "\n");
  console.log("Updated public/.well-known/assetlinks.json");
} else {
  console.log("Fingerprint tidak diberikan — lewati update assetlinks.json (gunakan --fingerprint NANTI setelah build APK)");
}

console.log("\nDomain dikonfigurasi:");
console.log("  Web app    : https://" + appHost);
console.log("  Convex API : https://" + convexHost);
console.log("  Convex Site: https://" + convexSiteHost);
console.log("\nSelanjutnya:");
console.log("  1. Build web: VITE_CONVEX_URL=https://" + convexHost + " npm run build");
console.log("  2. Upload dist/ ke VPS");
console.log("  3. Build APK dan catat SHA-256 fingerprint");
console.log("  4. node scripts/configure-domain.mjs --domain " + domain + " --fingerprint <fingerprint>");
console.log("  5. Rebuild + redeploy web");
