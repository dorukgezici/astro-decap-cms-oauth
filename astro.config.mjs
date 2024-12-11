import { defineConfig, envField } from "astro/config";

export default defineConfig({
  env: {
    schema: {
      OAUTH_GITHUB_CLIENT_ID: envField.string({ context: "server", access: "secret" }),
      OAUTH_GITHUB_CLIENT_SECRET: envField.string({ context: "server", access: "secret" }),
      OAUTH_GITHUB_REPO_ID: envField.string({ context: "server", access: "secret", optional: true }),
      PUBLIC_DECAP_CMS_SRC_URL: envField.string({ context: "client", access: "public", optional: true }),
      PUBLIC_DECAP_CMS_VERSION: envField.string({ context: "client", access: "public", optional: true }),
    },
  },
});
