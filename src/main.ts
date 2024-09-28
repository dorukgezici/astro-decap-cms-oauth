import type { AstroIntegration } from "astro";
import { envField } from "astro/config";

export interface DecapCMSOptions {
  decapCMSVersion?: string;
  adminDisabled?: boolean;
  adminRoute?: string;
  oauthDisabled?: boolean;
  oauthLoginRoute?: string;
  oauthCallbackRoute?: string;
}

const defaultOptions: DecapCMSOptions = {
  decapCMSVersion: "3.3.3",
  adminDisabled: false,
  adminRoute: "/admin",
  oauthDisabled: false,
  oauthLoginRoute: "/oauth",
  oauthCallbackRoute: "/oauth/callback",
};

export default function decapCMS(options: DecapCMSOptions): AstroIntegration {
  const { decapCMSVersion, adminDisabled, adminRoute, oauthDisabled, oauthLoginRoute, oauthCallbackRoute } = {
    ...defaultOptions,
    ...options,
  };

  if (!adminRoute?.startsWith("/") || !oauthLoginRoute?.startsWith("/") || !oauthCallbackRoute?.startsWith("/")) {
    throw new Error('`adminRoute`, `oauthLoginRoute` and `oauthCallbackRoute` options must start with "/"');
  }

  return {
    name: "astro-decap-cms-oauth",
    hooks: {
      "astro:config:setup": async ({ injectRoute, updateConfig }) => {
        if (!adminDisabled) {
          // apply env schema & decapCMS version
          updateConfig({
            experimental: {
              env: {
                schema: {
                  OAUTH_GITHUB_CLIENT_ID: envField.string({ context: "server", access: "secret" }),
                  OAUTH_GITHUB_CLIENT_SECRET: envField.string({ context: "server", access: "secret" }),
                  PUBLIC_DECAP_CMS_VERSION: envField.string({
                    context: "client",
                    access: "public",
                    optional: true,
                    default: decapCMSVersion,
                  }),
                },
              },
            },
          });

          // mount DecapCMS admin route
          injectRoute({
            pattern: adminRoute,
            entrypoint: "astro-decap-cms-oauth/src/admin.astro",
          });
        }

        if (!oauthDisabled) {
          // mount OAuth backend - sign in route
          injectRoute({
            pattern: oauthLoginRoute,
            entrypoint: "astro-decap-cms-oauth/src/oauth/index.ts",
          });

          // mount OAuth backend - callback route
          injectRoute({
            pattern: oauthCallbackRoute,
            entrypoint: "astro-decap-cms-oauth/src/oauth/callback.ts",
          });
        }
      },
    },
  };
}
