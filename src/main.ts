import type { AstroIntegration } from "astro";

export type DecapCMSOptions = {
  adminRoute?: string;
  oauthDisabled?: boolean;
  oauthLoginRoute?: string;
  oauthCallbackRoute?: string;
};

export default function decapCMS({
  adminRoute = "/admin",
  oauthDisabled = false,
  oauthLoginRoute = "/oauth",
  oauthCallbackRoute = "/oauth/callback",
}: DecapCMSOptions): AstroIntegration {
  if (!adminRoute.startsWith("/") || !oauthLoginRoute.startsWith("/") || !oauthCallbackRoute.startsWith("/")) {
    throw new Error('`adminRoute`, `oauthLoginRoute` and `oauthCallbackRoute` options must start with "/"');
  }

  return {
    name: "astro-decap-cms-oauth",
    hooks: {
      "astro:config:setup": async ({ injectRoute }) => {
        // mount DecapCMS admin dashboard
        injectRoute({
          pattern: adminRoute,
          entryPoint: "astro-decap-cms-oauth/src/admin.astro",
        });

        if (!oauthDisabled) {
          // OAuth backend - sign in route
          injectRoute({
            pattern: oauthLoginRoute,
            entryPoint: "astro-decap-cms-oauth/src/oauth/index.ts",
          });

          // OAuth backend - callback route
          injectRoute({
            pattern: oauthCallbackRoute,
            entryPoint: "astro-decap-cms-oauth/src/oauth/callback.ts",
          });
        }
      },
    },
  };
}
