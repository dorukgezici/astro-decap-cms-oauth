import vercel from "@astrojs/vercel";
import decapCmsOauth from "astro-decap-cms-oauth";
import { defineConfig } from "astro/config";

// https://astro.build/config
export default defineConfig({
  site: "https://astro-decap-cms-oauth.vercel.app",
  integrations: [decapCmsOauth()],
  output: "server",
  adapter: vercel(),
  server: {
    allowedHosts: ["astro-decap-cms-oauth.vercel.app", "cardinal-sterling-gobbler.ngrok-free.app"],
  },
});
