<div align="center">
	<h1 align="center">astro-decap-cms-oauth-demo</h1>
	<p align="center">Astro integration for the <a href="https://decapcms.org" target="_blank">Decap CMS</a> with custom OAuth backend</p>
  <br/>
</div>

<p align="center">
  <a href="https://npmjs.com/package/astro-decap-cms-oauth">
    <img src="https://img.shields.io/npm/v/astro-decap-cms-oauth" alt="Astro Decap CMS GitHub" />
  </a>
  <a href="https://npmjs.com/package/astro-decap-cms-oauth">
    <img src="https://img.shields.io/npm/dt/astro-decap-cms-oauth" alt="npm download count">
  </a>
</p>

### For the library docs, see [../README.md](../README.md)

This astro app serves as a demo implementing the integration [`astro-decap-cms-oauth`](https://npmjs.com/package/astro-decap-cms-oauth).

## Development and verification

Use Node.js 24 and pnpm 12.8.1. From the repository root:

```sh
pnpm install --frozen-lockfile
pnpm build
pnpm demo
```

For normal development and Vercel builds, set `OAUTH_GITHUB_CLIENT_ID` and
`OAUTH_GITHUB_CLIENT_SECRET` in `demo/.env` (and in Vercel for deployment).
The production build command is `pnpm -C demo build`.

Run `pnpm test` to build the integration and verify the demo against Astro 7
using real local HTTP in development and Node standalone production. Tests
use dummy credentials and mock GitHub's token exchange; no real OAuth app or
external requests are needed. See [test/README.md](test/README.md) for coverage.

The production test adapter does not change the demo's Vercel configuration.
A successful Vercel build validates packaging, but real GitHub login and the
Vercel runtime still need a deployed preview with real credentials.
