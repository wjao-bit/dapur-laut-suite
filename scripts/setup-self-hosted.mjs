#!/usr/bin/env node
/**
 * Setup deployment Convex self-hosted:
 *  1. Generate pasangan kunci JWT (RS256) untuk Convex Auth bila belum ada.
 *  2. Set env vars backend (JWT_PRIVATE_KEY, JWKS, SITE_URL).
 *  3. Deploy seluruh fungsi Convex ke backend self-hosted.
 *
 * Cara pakai:
 *   CONVEX_SELF_HOSTED_URL=http://127.0.0.1:3210 \
 *   CONVEX_SELF_HOSTED_ADMIN_KEY=<admin key> \
 *   SITE_URL=http://localhost:5173 \
 *   node scripts/setup-self-hosted.mjs
 *
 * Admin key didapat dari:
 *   docker compose -f self-hosted/docker-compose.yml exec backend ./generate_admin_key.sh
 */
import { execFileSync } from "node:child_process";
import { exportJWK, exportPKCS8, generateKeyPair } from "jose";

const url = process.env.CONVEX_SELF_HOSTED_URL;
const adminKey = process.env.CONVEX_SELF_HOSTED_ADMIN_KEY;
const siteUrl = process.env.SITE_URL || "http://localhost:5173";

if (!url || !adminKey) {
  console.error(
    "Error: env CONVEX_SELF_HOSTED_URL dan CONVEX_SELF_HOSTED_ADMIN_KEY wajib diisi.",
  );
  process.exit(1);
}

const env = {
  ...process.env,
  CONVEX_SELF_HOSTED_URL: url,
  CONVEX_SELF_HOSTED_ADMIN_KEY: adminKey,
};

function convex(args, input) {
  return execFileSync("npx", ["convex", ...args], {
    env,
    stdio: input === undefined ? "inherit" : ["pipe", "inherit", "inherit"],
    input,
  });
}

function envGet(name) {
  try {
    const out = execFileSync("npx", ["convex", "env", "get", name], {
      env,
      stdio: ["ignore", "pipe", "pipe"],
    })
      .toString()
      .trim();
    return out || null;
  } catch {
    return null;
  }
}

const hasJwt = envGet("JWT_PRIVATE_KEY");
if (hasJwt) {
  console.log("JWT_PRIVATE_KEY sudah ada — melewati pembuatan kunci baru.");
} else {
  console.log("Membuat pasangan kunci JWT (RS256) untuk Convex Auth...");
  const keys = await generateKeyPair("RS256", { extractable: true });
  const privateKey = await exportPKCS8(keys.privateKey);
  const publicKey = await exportJWK(keys.publicKey);
  const jwks = JSON.stringify({ keys: [{ use: "sig", ...publicKey }] });
  convex(["env", "set", "JWT_PRIVATE_KEY", "--", privateKey.trimEnd()]);
  convex(["env", "set", "JWKS", "--", jwks]);
}

console.log(`Set SITE_URL=${siteUrl}`);
convex(["env", "set", "SITE_URL", "--", siteUrl]);

// Dirujuk oleh auth.config.ts — wajib terisi walau memakai nilai default.
if (!envGet("VLY_CONVEX_AUTH_ISSUER")) {
  convex(["env", "set", "VLY_CONVEX_AUTH_ISSUER", "--", "https://freebuff.com"]);
}
if (!envGet("VLY_APP_NAME")) {
  convex(["env", "set", "VLY_APP_NAME", "--", "Dapur Laut"]);
}

console.log("Deploy fungsi Convex ke backend self-hosted...");
convex(["deploy", "-y"]);

console.log("\nSelesai! Set VITE_CONVEX_URL ke:", url);
