#!/usr/bin/env node
// Wrapper to fix Convex CLI in WebContainer where import() silently fails
process.argv = process.argv.slice(2); // Remove 'node scripts/deploy-convex.mjs'
process.argv.unshift(process.execPath, 'convex');

try {
  require('../node_modules/convex/dist/cli.bundle.cjs');
} catch (e) {
  console.error('Convex CLI error:', e.message || e);
  process.exit(1);
}
