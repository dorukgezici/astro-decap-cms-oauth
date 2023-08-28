import type { AstroIntegration } from "astro";

export type DecapCMSOptions = {};

export default function decapCMS(options: DecapCMSOptions = {}): AstroIntegration {
  return {
    name: "astro-decap-cms-github",
    hooks: {
      "astro:config:setup": async ({ injectRoute }) => {
        injectRoute({
          pattern: "/admin",
          entryPoint: "astro-decap-cms-github/lib/admin.astro",
        });

        injectRoute({
          pattern: "/oauth",
          entryPoint: "astro-decap-cms-github/lib/oauth/index.ts",
        });

        injectRoute({
          pattern: "/oauth/callback",
          entryPoint: "astro-decap-cms-github/lib/oauth/callback.ts",
        });
      },
    },
  };
}
