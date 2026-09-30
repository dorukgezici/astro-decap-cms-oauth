import assert from "node:assert/strict";
import { once } from "node:events";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import vm from "node:vm";
import { build, dev } from "astro";
import { CORE_SCHEMA, load } from "js-yaml";
import { credentials, mockGithubTokenFetch, token } from "./github-fetch.mjs";

const root = pathToFileURL(`${process.argv[2]}${path.sep}`);
const scenario = process.env.DECAP_TEST_SCENARIO;
const custom = scenario.startsWith("custom-");
const production = scenario.endsWith("production");
const mock = mockGithubTokenFetch();
let stop;

async function request(base, route) {
  const response = await fetch(new URL(route, base), {
    redirect: "manual",
    signal: AbortSignal.timeout(10_000),
  });
  return { status: response.status, headers: response.headers, text: await response.text() };
}

async function checkHome(base) {
  const response = await request(base, "/");
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type"), /text\/html/);
  assert.match(response.text, /<title>Astro Decap CMS Integration<\/title>/);
  assert.match(response.text, /astro-decap-cms-oauth-demo/);
  assert.match(response.text, /Astro v7\./);
}

async function checkAdmin(base, route) {
  const response = await request(base, route);
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type"), /text\/html/);
  assert.match(response.text, /<title>Content Manager<\/title>/);
  assert.ok(response.text.includes(`href="${route}/config.yml"`), "CMS config link uses the configured admin route");
  assert.match(response.text, /<script\b[^>]*src="https:\/\/unpkg\.com\/decap-cms@\^3\.16\.3\/dist\/decap-cms\.js"[^>]*>/);
  assert.ok(!response.text.includes(credentials.client_secret), "admin HTML must not expose OAuth secrets");
}

async function checkConfig(base, route) {
  const response = await request(base, `${route}/config.yml`);
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type"), /(?:yaml|yml)/);
  // CORE_SCHEMA deliberately keeps timestamps as strings, even when reading output.
  const config = load(response.text, { schema: CORE_SCHEMA });
  assert.equal(typeof config, "object");
  assert.ok(!response.text.includes(credentials.client_secret));
  if (!custom) {
    const source = await readFile(new URL("../public/admin/config.yml", import.meta.url), "utf8");
    assert.deepEqual(config, load(source, { schema: CORE_SCHEMA }));
    assert.equal(config.backend.name, "github");
    assert.equal(config.backend.repo, "dorukgezici/astro-decap-cms-oauth");
    assert.equal(config.backend.auth_endpoint, "oauth");
    assert.equal(config.collections[0].name, "news");
    assert.equal(config.collections[0].fields.find((field) => field.name === "body").widget, "markdown");
    return;
  }
  assert.deepEqual(config.backend, {
    name: "github",
    repo: "test/merge-regression",
    branch: "fixture",
    auth_endpoint: "auth/login",
    base_url: "http://localhost:4321",
  });
  assert.equal(config.collections.length, 1);
  const collection = config.collections[0];
  assert.equal(collection.name, "fixture");
  assert.equal(collection.create, true);
  assert.equal(collection.folder, "src/content/fixture");
  const [date, timestamp, string, boolean] = collection.fields;
  assert.deepEqual(date, {
    widget: "datetime", required: false, hint: "on", name: "published", label: "Published", default: "2026-09-30",
  });
  assert.equal(timestamp.default, "2026-09-30T12:34:56Z");
  assert.equal(typeof timestamp.default, "string");
  assert.equal(timestamp.widget, "string");
  assert.equal(string.default, "yes");
  assert.equal(string.hint, "on");
  assert.equal(boolean.default, true);
  assert.equal(config.publish_mode, "editorial_workflow");
  for (const key of ["backend_defaults", "field_defaults", "collection_defaults", "not_a_decap_option"]) {
    assert.ok(!(key in config), `helper/non-whitelisted key ${key} must be removed`);
  }
  assert.ok(!response.text.includes("<<:"), "merge keys must be resolved, not serialized as literal keys");
}

async function checkLogin(base, route) {
  const response = await request(base, route);
  assert.equal(response.status, 302);
  const location = new URL(response.headers.get("location"));
  assert.equal(location.origin, "https://github.com");
  assert.equal(location.pathname, "/login/oauth/authorize");
  assert.deepEqual(Object.fromEntries(location.searchParams), {
    client_id: credentials.client_id,
    scope: "repo,user",
  });
  assert.equal(mock.requests.length, 0, "redirects must not exchange a token");
}

function checkHandshake(html) {
  const script = html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
  assert.ok(script, "callback returns the Decap popup handshake script");
  const messages = [];
  let receive;
  let removed = false;
  const window = {
    opener: { postMessage: (...args) => messages.push(args) },
    addEventListener: (event, listener, capture) => {
      assert.equal(event, "message");
      assert.equal(capture, false);
      receive = listener;
    },
    removeEventListener: (event, listener, capture) => {
      assert.equal(event, "message");
      assert.equal(listener, receive);
      assert.equal(capture, false);
      removed = true;
    },
  };
  vm.runInNewContext(script, { window }, { timeout: 1_000 });
  assert.deepEqual(messages, [["authorizing:github", "*"]]);
  assert.equal(typeof receive, "function");
  receive({ origin: "https://cms.example.test" });
  assert.deepEqual(messages[1], [
    `authorization:github:success:${JSON.stringify({ token, provider: "github" })}`,
    "https://cms.example.test",
  ]);
  assert.equal(removed, true, "handshake listener is removed after replying");
}

async function checkCallbacks(base, route) {
  const codes = ["success", "provider-error", "http-error", "missing-token"];
  for (const code of codes) {
    const response = await request(base, `${route}?code=${code}`);
    if (code === "success") {
      assert.equal(response.status, 200);
      assert.match(response.headers.get("content-type"), /text\/html/);
      assert.ok(!response.text.includes(credentials.client_secret));
      checkHandshake(response.text);
    } else {
      assert.equal(response.status, 302, `${code} redirects instead of returning a token`);
      const location = new URL(response.headers.get("location"), base);
      assert.equal(location.origin, new URL(base).origin);
      assert.equal(location.pathname, "/");
      assert.equal(location.searchParams.get("error"), "😡");
      assert.ok(!response.text.includes(token));
    }
  }
  assert.deepEqual(mock.requests, codes.map((code) => ({
    url: "https://github.com/login/oauth/access_token",
    method: "POST",
    accept: "application/json",
    contentType: "application/json",
    body: { code, ...credentials },
  })), "every token exchange must send the expected JSON payload and headers");
}

async function checkMissing(base, routes) {
  for (const route of routes) {
    const response = await request(base, route);
    assert.equal(response.status, 404, `${route} must not be injected`);
  }
}

async function run() {
  const config = {
    root: fileURLToPath(root),
    configFile: scenario === "default-dev" ? "../../astro.config.mjs" : "../astro.config.mjs",
    cacheDir: fileURLToPath(new URL("./cache/", root)),
    outDir: fileURLToPath(new URL("./dist/", root)),
    server: { host: "127.0.0.1", port: 0, open: false },
    vite: { cacheDir: fileURLToPath(new URL("./vite-cache/", root)) },
    logLevel: "error",
  };
  let base;
  if (production) {
    await build(config);
    const { startServer } = await import(new URL("./dist/server/entry.mjs", root));
    const managed = startServer();
    stop = () => managed.server.stop();
    if (!managed.server.server.listening) await once(managed.server.server, "listening");
    const address = managed.server.server.address();
    assert.ok(address && typeof address !== "string");
    base = `http://127.0.0.1:${address.port}`;
  } else {
    const managed = await dev(config);
    stop = () => managed.stop();
    assert.ok(managed.address && typeof managed.address !== "string");
    base = `http://127.0.0.1:${managed.address.port}`;
  }
  await checkHome(base);
  if (scenario === "admin-disabled") {
    await checkMissing(base, ["/disabled-cms", "/disabled-cms/config.yml", "/admin"]);
    await checkLogin(base, "/oauth");
    await checkCallbacks(base, "/oauth/callback");
  } else if (scenario === "oauth-disabled") {
    await checkAdmin(base, "/cms");
    await checkConfig(base, "/cms");
    await checkMissing(base, ["/oauth", "/oauth/callback?code=success", "/admin"]);
    assert.equal(mock.requests.length, 0);
  } else {
    await checkAdmin(base, custom ? "/cms" : "/admin");
    await checkConfig(base, custom ? "/cms" : "/admin");
    await checkLogin(base, custom ? "/auth/login" : "/oauth");
    await checkCallbacks(base, custom ? "/auth/return" : "/oauth/callback");
    if (custom) await checkMissing(base, ["/admin", "/oauth", "/oauth/callback"]);
  }
  console.log(`${scenario}: real HTTP assertions passed`);
}

let exitCode = 0;
try {
  await run();
} catch (error) {
  console.error(error);
  exitCode = 1;
} finally {
  try {
    await stop?.();
  } catch (error) {
    console.error("Server cleanup failed:", error);
    exitCode = 1;
  } finally {
    mock.restore();
  }
}
// Some build tools retain handles after shutdown; the parent also reaps the process group.
process.exit(exitCode);
