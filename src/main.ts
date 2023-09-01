import type { AstroIntegration } from "astro";

export type DecapCMSOptions = {};

export default function decapCMS(options: DecapCMSOptions = {}): AstroIntegration {
  return {
    name: "astro-decap-cms-oauth",
    hooks: {
      "astro:config:setup": async ({ injectRoute }) => {
        injectRoute({
          pattern: "/admin",
          entryPoint: "astro-decap-cms-oauth/src/admin.astro",
        });

        injectRoute({
          pattern: "/oauth",
          entryPoint: "astro-decap-cms-oauth/src/oauth/index.ts",
        });

        injectRoute({
          pattern: "/oauth/callback",
          entryPoint: "astro-decap-cms-oauth/src/oauth/callback.ts",
        });
      },
    },
  };
}
