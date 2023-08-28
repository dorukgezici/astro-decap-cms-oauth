import vercel from "@astrojs/vercel/serverless";
import decapCMS from "astro-decap-cms-oauth";
import { defineConfig } from "astro/config";

// https://astro.build/config
export default defineConfig({
  site: "https://astro-decap-cms-oauth.vercel.app",
  integrations: [decapCMS()],
  output: "server",
  adapter: vercel(),
});
