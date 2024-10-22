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

You can either use a GitHub OAuth app, or a Github app to set up.

#### GitHub OAuth

On GitHub, go to Settings > Developer Settings > OAuth apps > New OAuth app. Or use this [direct link](https://github.com/settings/applications/new).

**Homepage URL**: This must be the prod URL of your application.

**Authorization callback URL**: This must be the prod URL of your application followed by `/oauth/callback`.

### GitHub App

[Register a new GitHub application](https://github.com/settings/apps/new) on GitHub ([details](https://docs.github.com/en/apps/creating-github-apps/registering-a-github-app/registering-a-github-app)).

Select the scopes as `content:write`

**Homepage URL**: This must be the prod URL of your application.

**Authorization callback URL**: This must be the prod URL of your application followed by `/oauth/callback`.

Once registered, click on the **Generate a new client secret** button. The app’s **Client ID** and **Client Secret** will be displayed.

Then navigate to `https://github.com/apps/<app slug>/installations/new` to install it on the repo. You can scope the access tokens further if wanted - details on [this page](https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app/generating-a-user-access-token-for-a-github-app#using-the-web-application-flow-to-generate-a-user-access-token)

```bash
curl -s 'https://api.github.com/repos/<owner>/<repo>' | jq .id
```

You can then use this with the `OAUTH_GITHUB_REPO_ID` environment variable.

4. Set env variables

```bash
OAUTH_GITHUB_CLIENT_ID=
OAUTH_GITHUB_CLIENT_SECRET=
# optional
PUBLIC_DECAP_CMS_VERSION=
DECAP_CMS_SRC_URL=
OAUTH_GITHUB_REPO_ID= # only works alongside a GitHub App, not GitHub OAuth
```

## Configuration Options

```js
export interface DecapCMSOptions {
  decapCMSSrcUrl?: string;
  decapCMSVersion?: string;
  adminDisabled?: boolean;
  adminRoute?: string;
  oauthDisabled?: boolean;
  oauthLoginRoute?: string;
  oauthCallbackRoute?: string;
}

const defaultOptions: DecapCMSOptions = {
  decapCMSSrcUrl: "",
  decapCMSVersion: "3.3.3",
  adminDisabled: false,
  adminRoute: "/admin",
  oauthDisabled: false,
  oauthLoginRoute: "/oauth",
  oauthCallbackRoute: "/oauth/callback",
};
```

To override default version of Decap CMS used, set `PUBLIC_DECAP_CMS_VERSION` env variable (takes precedence) or `decapCMSVersion` in `astro.config.mjs`.
To override the full js source, set `DECAP_CMS_SRC_URL` env variable (takes precedence) or `decapCMSSrcUrl` in `astro.config.mjs`. I set, `PUBLIC_DECAP_CMS_VERSION` is ignored.
To disable injecting Decap CMS admin route, set `adminDisabled` to `true` in `astro.config.mjs`.
To disable injecting OAuth routes, set `oauthDisabled` to `true` in `astro.config.mjs`.

```js
import { defineConfig } from "astro/config";
import decapCmsOauth from "astro-decap-cms-oauth";

export default defineConfig({
    ...,
    integrations: [decapCmsOauth({ decapCMSVersion: "3.3.3", adminDisabled: false, oauthDisabled: true })],
    output: "server",
});
```
