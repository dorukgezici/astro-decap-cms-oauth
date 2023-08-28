import decapCMS from "astro-decap-cms-github";
import { defineConfig } from "astro/config";

// https://astro.build/config
export default defineConfig({
  site: "https://astro-decap-cms-github.vercel.app",
  integrations: [decapCMS()],
  output: "server",
});
