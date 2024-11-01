import type { APIRoute } from "astro";
import { OAUTH_GITHUB_CLIENT_ID } from "astro:env/server";

export const prerender = false;

export const GET: APIRoute = ({ redirect }) => {
  const params = new URLSearchParams({
    client_id: OAUTH_GITHUB_CLIENT_ID,
    scope: "repo,user",
  });

  return redirect(`https://github.com/login/oauth/authorize?${params.toString()}`);
};
