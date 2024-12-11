import type { AstroConfig, AstroIntegration } from "astro";
import { envField } from "astro/config";

export interface DecapCMSOptions {
  decapCMSSrcUrl?: string;
  decapCMSVersion?: string;
  adminDisabled?: boolean;
  adminRoute?: string;
  oauthDisabled?: boolean;
  oauthLoginRoute?: string;
  oauthCallbackRoute?: string;
}
const defaultOptions: DecapCMSOptions = {
  decapCMSSrcUrl: "",
  decapCMSVersion: "3.3.3",
  adminDisabled: false,
  adminRoute: "/admin",
  oauthDisabled: false,
  oauthLoginRoute: "/oauth",
  oauthCallbackRoute: "/oauth/callback",
};

export default function decapCMS(options: DecapCMSOptions = {}): AstroIntegration {
  const {
    decapCMSSrcUrl,
    decapCMSVersion,
    adminDisabled,
    adminRoute,
    oauthDisabled,
    oauthLoginRoute,
    oauthCallbackRoute,
  } = {
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
        const env: AstroConfig["env"] = { validateSecrets: true, schema: {} };

        if (!adminDisabled) {
          env.schema!.PUBLIC_DECAP_CMS_SRC_URL = envField.string({
            context: "client",
            access: "public",
            optional: true,
            default: decapCMSSrcUrl,
          });
          env.schema!.PUBLIC_DECAP_CMS_VERSION = envField.string({
            context: "client",
            access: "public",
            optional: true,
            default: decapCMSVersion,
          });

          // mount DecapCMS admin route
          injectRoute({
            pattern: adminRoute,
            entrypoint: "astro-decap-cms-oauth/src/admin.astro",
          });
        }

        if (!oauthDisabled) {
          env.schema!.OAUTH_GITHUB_CLIENT_ID = envField.string({
            context: "server",
            access: "secret",
          });
          env.schema!.OAUTH_GITHUB_CLIENT_SECRET = envField.string({
            context: "server",
            access: "secret",
          });
          env.schema!.OAUTH_GITHUB_REPO_ID = envField.string({
            context: "server",
            access: "secret",
            optional: true,
            default: "",
          });

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

        // apply env schema & defaults
        updateConfig({ env });
      },
    },
  };
}
