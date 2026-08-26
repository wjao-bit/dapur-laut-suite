import { vlyPlugin } from "@vly-ai/integrations";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), vlyPlugin(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    // Force a single copy of React across all packages (including vlyPlugin).
    // Without this, @vly-ai/integrations can resolve its own React copy, which
    // triggers "Invalid hook call" errors at runtime.
    dedupe: ["react", "react/jsx-runtime", "react-dom", "react-dom/client"],
  },
  build: {
    // Enable source maps for better debugging (disable in production if needed)
    sourcemap: false,
    // NOTE: No manualChunks here. Memisahkan recharts (dan lib lain) ke chunk
    // manual menciptakan circular dependency antar-chunk yang menyebabkan error
    // produksi: "Uncaught ReferenceError: Cannot access 'T' before
    // initialization" (chunk charts-CA3fWFZD.js) -> seluruh app gagal mount.
    // Biarkan Rollup/Vite menangani pemecahan chunk secara otomatis & aman.
    chunkSizeWarningLimit: 1000,
    // Target modern browsers for better optimization
    target: "esnext",
    // Minify options - using esbuild (faster than terser)
    minify: "esbuild",
  },
  // Optimize dependencies
  optimizeDeps: {
    // Only scan the app entry HTML; avoids crawling unrelated *.html files
    // if a legacy snapshot accidentally contains leaked package folders.
    entries: ["index.html"],
    include: [
      "react",
      "react/jsx-runtime",
      "react-dom",
      "react-dom/client",
      "react-router",
      "@convex-dev/auth/react",
      "framer-motion",
    ],
  },
  // Performance hints
  server: {
    // Bind to all interfaces so WebContainer's server-ready event fires.
    host: true,
    port: 5173,
    // Freebuff requires HMR disabled in this environment (the platform's
    // dev-server harness doesn't support the HMR websocket). Keep hmr off.
    hmr: false,
  },
});
