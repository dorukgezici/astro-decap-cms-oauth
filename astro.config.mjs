import { defineConfig } from "astro/config";
import decapCMS from "./dist/astro-decap-cms-github";

// https://astro.build/config
export default defineConfig({
  integrations: [decapCMS()],
  output: "server",
});
