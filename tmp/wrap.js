import("/project/node_modules/convex/dist/cli.bundle.cjs").catch((e) => {
  console.error("WRAPPER-CAUGHT:", e && e.stack ? e.stack : String(e));
});
