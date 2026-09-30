import node from "@astrojs/node";
import decapCmsOauth from "astro-decap-cms-oauth";
import { fileURLToPath } from "node:url";
import demoConfig from "../astro.config.mjs";

const scenario = process.env.DECAP_TEST_SCENARIO;
const custom = scenario.startsWith("custom-");
const options = custom
  ? {
      configPath: fileURLToPath(new URL("./merge-config.yml", import.meta.url)),
      adminRoute: "/cms/",
      oauthLoginRoute: "/auth/login",
      oauthCallbackRoute: "/auth/return",
    }
  : scenario === "admin-disabled"
    ? { adminDisabled: true, adminRoute: "/disabled-cms" }
    : scenario === "oauth-disabled"
      ? { oauthDisabled: true, adminRoute: "/cms" }
      : undefined;

// Replace rather than merge adapters/integrations: Astro merges arrays and hook objects.
export default {
  ...demoConfig,
  ...(options ? { integrations: [decapCmsOauth(options)] } : {}),
  ...(scenario.endsWith("production") ? { adapter: node({ mode: "standalone" }) } : {}),
};
