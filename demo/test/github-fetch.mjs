export const credentials = {
  client_id: "integration-client-id",
  client_secret: "integration-client-secret",
  repository_id: "integration-repository-id",
};
export const token = "integration-token-not-a-real-github-token";

export function mockGithubTokenFetch() {
  const original = globalThis.fetch;
  const requests = [];
  globalThis.fetch = async (input, init) => {
    const url = new URL(input instanceof Request ? input.url : input);
    // Only the token exchange is mocked. In particular, localhost still uses real HTTP.
    if (url.origin !== "https://github.com" || url.pathname !== "/login/oauth/access_token") {
      return original(input, init);
    }
    const request = new Request(input, init);
    const body = JSON.parse(await request.text());
    requests.push({
      url: request.url,
      method: request.method,
      accept: request.headers.get("accept"),
      contentType: request.headers.get("content-type"),
      body,
    });
    switch (body.code) {
      case "success":
        return Response.json({ access_token: token, token_type: "bearer" });
      case "provider-error":
        return Response.json({ error: "bad_verification_code", error_description: "Test provider rejection" });
      case "http-error":
        return new Response("Test HTTP rejection", { status: 401 });
      case "missing-token":
        return Response.json({ token_type: "bearer" });
      default:
        throw new Error(`Unexpected mocked OAuth code: ${body.code}`);
    }
  };
  return { requests, restore: () => { globalThis.fetch = original; } };
}
