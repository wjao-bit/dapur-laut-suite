// Temporary diagnostic: log every global fetch the CLI makes
const orig = globalThis.fetch;
globalThis.fetch = async (...args) => {
  const u = typeof args[0] === "string" ? args[0] : args[0] && args[0].url;
  const opts = args[1] || {};
  let bodyInfo = "";
  if (opts.body) {
    try {
      bodyInfo = typeof opts.body === "string" ? `len=${opts.body.length}` : typeof opts.body;
    } catch {
      bodyInfo = "?";
    }
  }
  console.error(`[FETCH] ${opts.method || "GET"} ${u} body:${bodyInfo}`);
  try {
    const r = await orig(...args);
    console.error(`[FETCH-OK] ${u} -> ${r.status}`);
    return r;
  } catch (e) {
    console.error(`[FETCH-FAIL] ${u} -> ${e && e.message}`);
    throw e;
  }
};
