import type { AstroConfig, AstroIntegration } from "astro";
import fs from "node:fs";
import { configYML } from "./config";

export type DecapCMSOptions = {};

export default function decapCMS(options: DecapCMSOptions = {}): AstroIntegration {
  let config: AstroConfig;

  return {
    name: "astro-decap-cms-github",
    hooks: {
      "astro:config:setup": async ({ injectRoute }) => {
        injectRoute({
          pattern: "/admin",
          entryPoint: "astro-decap-cms-github/admin.astro",
        });
      },

      "astro:config:done": async ({ config: cfg }) => {
        config = cfg;
      },

      "astro:build:done": async ({ dir }) => {
        if (!config.site) {
          console.warn("The DecapCMS integration requires the `site` astro.config option. Skipping.");
          return;
        }

        const adminDir = new URL("admin", dir);
        fs.writeFileSync(new URL("config.yml", adminDir), configYML);
      },
    },
  };
}
