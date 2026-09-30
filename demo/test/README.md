# Demo HTTP integration tests

From the repository root:

```sh
pnpm test
```

Or, after building the library:

```sh
pnpm -C demo test
```

The suite uses Astro's programmatic `dev()` and `build()` APIs and the actual demo configuration. Six isolated workers exercise:

- Default routes in development and Node standalone production.
- Custom admin/login/callback routes in both modes, with the YAML merge-key fixture.
- Admin disabled while OAuth remains enabled.
- OAuth disabled while admin remains enabled, without OAuth secrets.

HTTP assertions cover the home page, Decap 3.16.3 script and config link, parsed YAML, GitHub authorization redirect parameters, callback popup handshake, token-exchange JSON/headers, and provider/HTTP/missing-token error redirects. YAML regression assertions cover inherited settings, explicit overrides, string dates/timestamps, boolean-like strings, actual booleans, and filtering helper keys.

Only GitHub's token endpoint is mocked, inside each worker, using dummy credentials and deterministic responses. Local HTTP is real. Redirects are not followed and HTML scripts are not fetched or executed in a browser; the callback handshake alone is evaluated in a bounded VM with a fake window. Astro telemetry and update checks are disabled.

Astro 7 writes generated `.astro/` files relative to its root, so each worker gets a temporary copy of the demo's `src/`, `public/`, and `tsconfig.json` under `test/`. This keeps all generated files within the test write scope, retains dependency resolution through `demo/node_modules`, and avoids reading the demo's local `.env`. The real demo config is loaded; production replaces its Vercel adapter with Node standalone only in the test wrapper. The normal Vercel build is not tested or modified here.

Servers bind to loopback on ephemeral ports. Individual HTTP requests have a 10-second timeout; worker tests have a 110-second limit and the complete suite has a 120-second limit. Workers stop servers and restore fetch in `finally`; the parent kills remaining process-group members and removes temporary roots even on failure/cancellation. Worker output is included in assertion failures.
