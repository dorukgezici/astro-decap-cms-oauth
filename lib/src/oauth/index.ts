import type { APIRoute } from "astro";
import { authUrl } from "./_config";

export const get: APIRoute = ({ redirect }) => {
  return redirect(authUrl);
};
