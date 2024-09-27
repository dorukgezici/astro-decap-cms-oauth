import type { APIRoute } from "astro";
import { OAUTH_GITHUB_CLIENT_ID } from "astro:env/server";

export const GET: APIRoute = ({ redirect }) => {
  return redirect(`https://github.com/login/oauth/authorize?client_id=${OAUTH_GITHUB_CLIENT_ID}&scope=repo,user`);
};
