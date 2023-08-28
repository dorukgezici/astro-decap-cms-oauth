import path from "path";
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

export default defineConfig(() => {
  return {
    build: {
      lib: {
        entry: path.resolve(__dirname, "lib/main.ts"),
        name: "AstroDecapCMSGitHub",
        fileName: "astro-decap-cms-github",
      },
    },
    plugins: [dts({ rollupTypes: true })],
  };
});
