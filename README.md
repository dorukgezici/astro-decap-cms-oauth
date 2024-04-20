<div align="center">
	<h1 align="center">astro-decap-cms-oauth</h1>
	<p align="center">Astro integration for the <a href="https://decapcms.org" target="_blank">Decap CMS</a> with custom OAuth backend</p>
  <br/>
</div>

<p align="center">
  <a href="https://npmjs.com/package/astro-decap-cms-oauth">
    <img src="https://img.shields.io/npm/v/astro-decap-cms-oauth" alt="astro-decap-cms-oauth" />
  </a>
  <a href="https://npmjs.com/package/astro-decap-cms-oauth">
    <img src="https://img.shields.io/npm/dt/astro-decap-cms-oauth" alt="npm download count">
  </a>
</p>

This integration automatically mounts the Decap CMS admin dashboard to `/admin` and custom OAuth authentication backend routes to `/oauth`, `/oauth/callback` using GitHub as the provider.

_This way, you aren't vendor-locked to `Netlify` and your app can be deployed anywhere that supports SSR._

## Installation

```bash
npx astro add astro-decap-cms-oauth
```

## Manual Installation

```bash
npm install astro-decap-cms-oauth
```

Add the integration and set output to `server` or `hybrid` in your `astro.config.mjs` file:

```js
import { defineConfig } from "astro/config";
import decapCmsOauth from "astro-decap-cms-oauth";

export default defineConfig({
    ...,
    integrations: [decapCmsOauth()],
    output: "server",
});
```

## Usage

1. Make sure Astro is in SSR mode (`output: "server"` set in `astro.config.mjs`)

2. Put your `config.yml` file in `public/admin/config.yml` (see [Decap CMS Docs](https://decapcms.org/docs/add-to-your-site/#configuration) for more info)

```yml
backend:
  name: github
  branch: main # change this to your branch
  repo: dorukgezici/astro-decap-cms-oauth # change this to your repo
  site_domain: astro-decap-cms-oauth.vercel.app # change this to your domain
  base_url: https://astro-decap-cms-oauth.vercel.app # change this to your prod URL
  auth_endpoint: oauth # the oauth route provided by the integration
```

3. Set up GitHub OAuth app

On GitHub, go to Settings > Developer Settings > OAuth apps > New OAuth app. Or use this [direct link](https://github.com/settings/applications/new).

**Homepage URL**: This must be the prod URL of your application.

**Authorization callback URL**: This must be the prod URL of your application followed by `/oauth/callback`.

4. Set env variables

```bash
OAUTH_GITHUB_CLIENT_ID=
OAUTH_GITHUB_CLIENT_SECRET=
```

## Configuration Options

```js
export interface DecapCMSOptions {
  adminDisabled?: boolean;
  adminRoute?: string;
  oauthDisabled?: boolean;
  oauthLoginRoute?: string;
  oauthCallbackRoute?: string;
}

const defaultOptions: DecapCMSOptions = {
  adminDisabled: false,
  adminRoute: "/admin",
  oauthDisabled: false,
  oauthLoginRoute: "/oauth",
  oauthCallbackRoute: "/oauth/callback",
};
```

To disable injecting Decap CMS admin route, set `adminDisabled` to `true` in `astro.config.mjs`.
To disable injecting OAuth routes, set `oauthDisabled` to `true` in `astro.config.mjs`.

```js
import { defineConfig } from "astro/config";
import decapCmsOauth from "astro-decap-cms-oauth";

export default defineConfig({
    ...,
    integrations: [decapCmsOauth({ adminDisabled: true, oauthDisabled: true })],
    output: "server",
});
```
