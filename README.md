# Nicaragua News en English

A Vite + React frontend with an Express/Netlify news API that aggregates English-language Nicaragua coverage from Confidencial, Havana Times, The Tico Times, Google News, AP, Reuters, BBC, The Guardian, Al Jazeera, and The Washington Post.

Article photos come from RSS media when present, then direct Open Graph tags, then a [Microlink](https://microlink.io) metadata fallback for publishers that block datacenter fetches (AP, Washington Post, Havana Times, and others). Optional: set `MICROLINK_API_KEY` in the environment for higher rate limits.

## Scripts

### `npm start`

Runs the API (`server/index.js` on port 4000) and the Vite dev server (port 3000) together. The web app proxies `/api/*` to the local API.

Use `npm run start:api` or `npm run start:web` to run either process alone.

### `npm run build`

Builds the production frontend into `dist/`.

### `npm run preview`

Serves the production build locally.

## Deploy (Netlify)

- Frontend: static files from `dist/`
- API: `netlify/functions/api.js` (rewrites `/api/*`, `/news`, `/health`)

### Node.js version

Build Node is pinned to **22** via `.nvmrc`, `.node-version`, `package.json` `engines`, and `netlify.toml` (`NODE_VERSION`).

Netlify Functions runtime is separate. If you see a Node 16 deprecation warning, in the Netlify UI set:

1. **Project configuration → Build & deploy → Dependency management** → Node.js **22** (or rely on `.nvmrc`)
2. Environment variable **`AWS_LAMBDA_JS_RUNTIME`** = `nodejs22.x` (Builds + Functions scopes), then **redeploy**

`AWS_LAMBDA_JS_RUNTIME` cannot be set from `netlify.toml`; it must be a site env var.

Optional: `MICROLINK_API_KEY` for higher photo-metadata rate limits.
