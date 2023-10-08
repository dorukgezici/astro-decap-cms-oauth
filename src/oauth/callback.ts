import type { APIRoute } from "astro";
import tiny from "tiny-json-http";
import { clientId, clientSecret, tokenUrl } from "./_config";

export const GET: APIRoute = async ({ url, redirect }) => {
  const data = {
    code: url.searchParams.get("code"),
    client_id: clientId,
    client_secret: clientSecret,
  };

  let script;

  try {
    const { body } = await tiny.post({
      url: tokenUrl,
      data,
      headers: { Accept: "application/json" },
    });

    const content = {
      token: body.access_token,
      provider: "github",
    };

    // This is what talks to the DecapCMS page.
    // Using window.postMessage we give it the token details in a format it's expecting
    script = `
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
    // If we hit an error we'll handle that here
    console.log(err);
    return redirect("/?error=😡");
  }
};
