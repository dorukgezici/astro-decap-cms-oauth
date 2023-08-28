import path from "path";
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

export default defineConfig({
  build: {
    lib: {
      entry: path.resolve(__dirname, "main.ts"),
      name: "AstroDecapCMSGitHub",
      fileName: "astro-decap-cms-github",
    },
  },
  plugins: [dts({ rollupTypes: true })],
});
