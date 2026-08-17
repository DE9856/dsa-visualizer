import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        // React, its renderer and the icon set are a third of the bundle and
        // change only when a dependency does. Splitting them out means a
        // redeploy of the app leaves the cached vendor file alone — and it is
        // what keeps either chunk under Rollup's 500 kB warning, which the app
        // chunk would otherwise trip on app code alone.
        manualChunks: (id) => (id.includes("node_modules") ? "vendor" : undefined),
      },
    },
  },
});
