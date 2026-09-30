import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { cp, mkdtemp, rm } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { credentials } from "./github-fetch.mjs";

const demo = fileURLToPath(new URL("../", import.meta.url));
const worker = fileURLToPath(new URL("./integration-worker.mjs", import.meta.url));

function killWorker(child) {
  if (!child.pid) return;
  try {
    // Also reap build-tool subprocesses if startup/build/cleanup gets stuck.
    if (process.platform === "win32") child.kill("SIGKILL");
    else process.kill(-child.pid, "SIGKILL");
  } catch (error) {
    if (error.code !== "ESRCH") throw error;
  }
}

async function runScenario(t, scenario) {
  const root = await mkdtemp(new URL("./.tmp-integration-", import.meta.url));
  let child;
  let exited;
  let output = "";
  const abort = () => { if (child) killWorker(child); };
  t.signal.addEventListener("abort", abort, { once: true });
  try {
    // Keep Astro's generated .astro files, caches and build output within test/.
    // A root inside demo still resolves its installed workspace dependencies.
    await Promise.all(["src", "public", "tsconfig.json"].map((name) =>
      cp(path.join(demo, name), path.join(root, name), { recursive: true }),
    ));
    t.signal.throwIfAborted();
    const env = {
      ...process.env,
      DECAP_TEST_SCENARIO: scenario,
      OAUTH_GITHUB_CLIENT_ID: credentials.client_id,
      OAUTH_GITHUB_CLIENT_SECRET: credentials.client_secret,
      OAUTH_GITHUB_REPO_ID: credentials.repository_id,
      ASTRO_TELEMETRY_DISABLED: "1",
      ASTRO_DISABLE_UPDATE_CHECK: "true",
      ASTRO_NODE_AUTOSTART: "disabled",
      ASTRO_NODE_LOGGING: "disabled",
      HOST: "127.0.0.1",
      PORT: "0",
      NO_COLOR: "1",
    };
    // Do not let ambient public settings or TLS settings affect these fixtures.
    for (const key of ["PUBLIC_DECAP_CMS_SRC_URL", "PUBLIC_DECAP_CMS_VERSION", "SERVER_CERT_PATH", "SERVER_KEY_PATH", "NODE_ENV", "FORCE_COLOR"]) {
      delete env[key];
    }
    if (scenario === "oauth-disabled") {
      for (const key of ["OAUTH_GITHUB_CLIENT_ID", "OAUTH_GITHUB_CLIENT_SECRET", "OAUTH_GITHUB_REPO_ID"]) delete env[key];
    }
    child = spawn(process.execPath, [worker, root], {
      cwd: demo,
      env,
      detached: process.platform !== "win32",
      stdio: ["ignore", "pipe", "pipe"],
    });
    child.stdout.setEncoding("utf8").on("data", (chunk) => { output += chunk; });
    child.stderr.setEncoding("utf8").on("data", (chunk) => { output += chunk; });
    exited = new Promise((resolve, reject) => {
      child.once("error", reject);
      child.once("close", (code, signal) => resolve({ code, signal }));
    });
    const result = await exited;
    assert.equal(result.code, 0, `${scenario} worker failed (${result.signal ?? result.code}):\n${output}`);
    t.diagnostic(`${scenario}: real HTTP assertions passed`);
  } finally {
    t.signal.removeEventListener("abort", abort);
    if (child) killWorker(child);
    if (exited) await exited.catch(() => {});
    await rm(root, { recursive: true, force: true });
  }
}

test("Astro 7 demo HTTP integration", { timeout: 120_000 }, async (t) => {
  for (const scenario of [
    "default-dev",
    "default-production",
    "custom-dev",
    "custom-production",
    "admin-disabled",
    "oauth-disabled",
  ]) {
    await t.test(scenario, { timeout: 110_000 }, (t) => runScenario(t, scenario));
  }
});
