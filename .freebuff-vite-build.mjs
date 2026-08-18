import fs from "node:fs";

process.on("unhandledRejection", (error) => {
  console.error("[freebuff-build] unhandled rejection:", (error && error.stack) || error);
  process.exit(1);
});
process.on("uncaughtException", (error) => {
  console.error("[freebuff-build] uncaught exception:", (error && error.stack) || error);
  process.exit(1);
});

import("vite")
  .then(({ build }) => {
    let buildDone = false;
    const donePlugin = {
      name: "freebuff-publish-done",
      closeBundle() {
        buildDone = true;
      },
    };

    build({ logLevel: "info", plugins: [donePlugin] }).catch((error) => {
      console.error("[freebuff-build] vite build failed:", (error && error.stack) || error);
      process.exit(1);
    });

    const startedAt = Date.now();
    const poll = setInterval(() => {
      if (buildDone) {
        clearInterval(poll);
        let entries = [];
        try {
          entries = fs.readdirSync("/project/dist");
        } catch (error) {
          console.error("[freebuff-build] dist/ missing after closeBundle:", error);
        }
        console.log(
          "[freebuff-build] vite build finished; dist entries: " +
            (entries.join(", ") || "<empty>"),
        );
        // Grace window so this worker's file writes finish relaying to the
        // pod's main volume before the worker is torn down.
        setTimeout(() => process.exit(0), 2000);
      } else if (Date.now() - startedAt > 240000) {
        clearInterval(poll);
        console.error(
          "[freebuff-build] vite build did not reach closeBundle within 4 minutes",
        );
        process.exit(1);
      }
    }, 500);
  })
  .catch((error) => {
    console.error("[freebuff-build] failed to load vite:", (error && error.stack) || error);
    process.exit(1);
  });
