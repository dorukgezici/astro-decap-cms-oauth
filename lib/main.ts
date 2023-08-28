import type { AstroIntegration } from "astro";

export type DecapCMSOptions = {
  githubClientId?: string;
  githubClientSecret?: string;
};

export default function decapCMS(options: DecapCMSOptions = {}): AstroIntegration {
  return {
    name: "astro-decap-cms-github",
    hooks: {
      "astro:config:setup": async ({ injectRoute }) => {
        injectRoute({
          pattern: "/admin",
          entryPoint: "./lib/admin.astro",
        });

        injectRoute({
          pattern: "/admin/config.yml",
          entryPoint: "./lib/config.yml.ts",
        });

        injectRoute({
          pattern: "/oauth",
          entryPoint: "./lib/oauth/index.ts",
        });

        injectRoute({
          pattern: "/oauth/callback",
          entryPoint: "./lib/oauth/callback.ts",
        });
      },
    },
  };
}
