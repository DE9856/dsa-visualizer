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
        //
        // The algorithm and data-structure modules are the other half that
        // grows: every family added — dynamic programming, backtracking,
        // strings — brings its own frame builders, pseudocode and long-form
        // descriptions, and together they pushed the app chunk back over the
        // warning. They are pure logic with no components in them, so they
        // cache and invalidate independently of the UI.
        manualChunks: (id) => {
          if (id.includes("node_modules")) return "vendor";
          if (id.includes("/src/algorithms/") || id.includes("/src/dataStructures/")) return "algorithms";
          return undefined;
        },
      },
    },
  },
});
