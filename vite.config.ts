import path from "path";
import { defineConfig } from "vite";

const name = "astro-decap-cms-github";

export default defineConfig(() => {
  return {
    build: {
      lib: {
        entry: path.resolve(__dirname, "src", "index.ts"),
        name: name,
        fileName: (format) => (format === "es" ? `${name}.mjs` : `${name}.js`),
      },
    },
  };
});
