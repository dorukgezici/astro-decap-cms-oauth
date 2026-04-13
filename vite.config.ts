import path from "path";
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

export default defineConfig({
  build: {
    lib: {
      entry: path.resolve(import.meta.dirname, "src/index.ts"),
      name: "AstroDecapCMSOAuth",
    },
    ssr: true,
    rollupOptions: {
      external: ["astro/config", "astro", "node:fs/promises", "node:path", "node:url", "js-yaml"],
      output: {
        globals: {
          "astro/config": "astroConfig",
          astro: "astro",
          "node:fs/promises": "fsPromises",
          "node:path": "path",
          "node:url": "node_url",
          "js-yaml": "yaml",
        },
      },
    },
  },
  plugins: [dts({ rollupTypes: true })],
});
