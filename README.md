# Nicaragua News en English

A Vite + React frontend with an Express/Netlify news API that aggregates English-language Nicaragua coverage from Confidencial, Havana Times, Google News, AP, Reuters, BBC, The Guardian, Al Jazeera, and The Washington Post.

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

Node 22 is pinned via `.nvmrc` and `netlify.toml`.
