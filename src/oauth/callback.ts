import type { APIRoute } from "astro";
import { OAUTH_GITHUB_CLIENT_ID, OAUTH_GITHUB_CLIENT_SECRET, OAUTH_GITHUB_REPO_ID } from "astro:env/server";

export const prerender = false;

export const GET: APIRoute = async ({ url, redirect }) => {
  const data = {
    code: url.searchParams.get("code"),
    client_id: OAUTH_GITHUB_CLIENT_ID,
    client_secret: OAUTH_GITHUB_CLIENT_SECRET,
    ...(OAUTH_GITHUB_REPO_ID ? { repository_id: OAUTH_GITHUB_REPO_ID } : {}),
  };

  try {
    const response = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("GitHub OAuth error:", response.status, errorText);
      throw new Error(`GitHub OAuth error! status: ${response.status}`);
    }

    const body = await response.json();

    if (body.error) {
      console.error("GitHub OAuth error response:", body);
      throw new Error(`GitHub OAuth error: ${body.error_description || body.error}`);
    }

    if (!body.access_token) {
      console.error("No access_token in GitHub response:", body);
      throw new Error("No access token received from GitHub");
    }

    const content = {
      token: body.access_token,
      provider: "github",
    };

    const script = `
      <script>
        const receiveMessage = (message) => {
          window.opener.postMessage(
            'authorization:${content.provider}:success:${JSON.stringify(content)}',
            message.origin
          );

          window.removeEventListener("message", receiveMessage, false);
        }
        window.addEventListener("message", receiveMessage, false);

        window.opener.postMessage("authorizing:${content.provider}", "*");
      </script>
    `;

    return new Response(script, {
      headers: { "Content-Type": "text/html" },
    });
  } catch (err) {
    console.error(err);
    return redirect("/?error=😡");
  }
};
