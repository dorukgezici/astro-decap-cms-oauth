import path from "node:path";
import * as ts from "@typescript/typescript6";
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

// Declaration tooling still needs the JavaScript compiler API alongside the TS7 CLI.
const typescriptCompilerFolder = path.dirname(
  path.dirname(ts.getDefaultLibFilePath({ target: ts.ScriptTarget.ESNext })),
);

export default defineConfig({
  build: {
    lib: {
      entry: path.resolve(import.meta.dirname, "src/index.ts"),
      formats: ["es", "cjs"],
    },
    ssr: true,
    rolldownOptions: {
      external: ["astro/config", "astro", "node:fs/promises", "node:path", "node:url", "js-yaml"],
    },
  },
  plugins: [
    dts({
      bundleTypes: {
        invokeOptions: { typescriptCompilerFolder },
      },
    }),
  ],
});
