// Jalankan CLI Convex secara in-proses, melewati index.js main() yang bermasalah
// (dns/net/Sentry/process.exit) di runtime sandbox ini.
import { buildProgram } from "/project/node_modules/convex/dist/esm/cli/program.js";

const program = buildProgram();
try {
  await program.parseAsync(["node", "convex", "dev", "--once"], { from: "user" });
  console.error(">>> PARSE-ASYNC RESOLVED OK");
} catch (e) {
  console.error(">>> PARSE-ASYNC THREW:", e && e.stack ? e.stack : String(e));
  process.exitCode = 1;
}
