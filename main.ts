import { Hono } from "hono";
import { serveStatic } from "hono/deno";

const app = new Hono();

// 1) Serve built assets (JS/CSS/images) from /assets/**
app.use("/assets/*", serveStatic({ root: "./dist/assets" }));

// 2) Static files at project root of dist (logo, manifest, favicon, etc.)
app.use(
  "/(logo.svg|manifest.webmanifest|favicon.ico|robots.txt)",
  serveStatic({ root: "./dist" }),
);

// 3) SPA fallback: any other route returns dist/index.html so the React app
//    (BrowserRouter) can handle /, /auth, /dashboard/*, and deep links.
app.get("*", serveStatic({ path: "./dist/index.html" }));

// 4) Root path: explicitly serve index.html (avoid directory-listing issues)
app.get("/", serveStatic({ path: "./dist/index.html" }));

Deno.serve(app.fetch);
