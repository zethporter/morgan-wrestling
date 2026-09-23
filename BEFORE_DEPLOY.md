# Before Deploy

One-time setup required before `.github/workflows/deploy.yml` can deploy an app
to Cloudflare Workers. Until these are done, the workflow will run and fail.

> Do not put real secret values in this file. It is committed to the repo.
> Values live in GitHub Actions secrets and Cloudflare Worker secrets only.

## How env vars are split

The build and the runtime need different things, and getting this backwards is
the usual cause of a green deploy that 500s on first request.

| Kind | Where it lives | Why |
| --- | --- | --- |
| `VITE_*` | GitHub Actions **variable** | Inlined into the client bundle at build time. Not secret — it ships to the browser. |
| Everything else | Cloudflare **Worker secret** | Read from `process.env` at runtime (`apps/*/src/env.ts`, `packages/auth/src/config.ts`). CI never sees these. |

`nodejs_compat` plus a `compatibility_date` of 2025-09-02 is what populates
`process.env` from the Worker's secrets — don't lower that date.

## 1. GitHub repo settings

Settings → Secrets and variables → Actions.

Secrets:

- `CLOUDFLARE_API_TOKEN` — scoped to **Workers Scripts: Edit**,
  **Account Settings: Read**, and **Workers Routes: Edit**. The last one is
  required, not optional: `apps/website` declares a custom domain in its
  `wrangler.jsonc` (step 4), and a token without it fails the deploy.
- `CLOUDFLARE_ACCOUNT_ID`

Variables (not secrets):

- `VITE_APP_TITLE` — e.g. `Morgan Wrestling`

## 2. Push runtime secrets to the Worker

Done once per app, from your machine — not through CI.

Create `apps/admin/.env.production` with the production values. It is already
covered by `.gitignore`. It needs every server key in `apps/admin/.env.example`:

```
TURSO_CONNECTION_URL
TURSO_TOKEN
TURSO_BETTER_AUTH_CONNECTION_URL
TURSO_BETTER_AUTH_TOKEN
BETTER_AUTH_SECRET
BETTER_AUTH_URL
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
```

Then upload them:

```bash
cd apps/admin
grep -v '^#' .env.production | grep -v '^VITE_' | grep '=' \
  | jq -Rn '[inputs | split("=") | {(.[0]): (.[1:]|join("="))}] | add' \
  | bunx wrangler secret bulk
```

Confirm with `bunx wrangler secret list` (prints names, never values).

Use production Turso credentials here, and generate a `BETTER_AUTH_SECRET`
distinct from the local one — a dev secret in production means dev-signed
session cookies are valid against live data.

## 3. Set `BETTER_AUTH_URL` and the Google callback

The most likely first-deploy failure. `BETTER_AUTH_URL` is unset in local dev,
but better-auth builds its OAuth callback URLs from it, so in production it must
be the exact public origin with no trailing slash:

- `https://morgan-wrestling-admin.<your-subdomain>.workers.dev`, or your custom
  domain once one is attached

Then in the Google Cloud console, add the matching redirect URI to the OAuth
client:

- `<origin>/api/auth/callback/google`

If you later move the app to a custom domain, both of these have to change
together.

## 4. The website Worker

`apps/website` is read-only and has no auth, so its setup is steps 2 and 3 in
miniature: **two secrets, no OAuth, no callback URL**. Everything in this
section is per-Worker and done once, from your machine.

Mint a Turso token that cannot write. This is the layer that actually enforces
the app's read-only promise (`apps/website/README.md` §4) — a read/write token
here quietly removes it:

```bash
turso db tokens create <content-db> --read-only
```

Then `apps/website/.env.production` (gitignored) with just the two server keys
from `apps/website/.env.example`, and the same bulk upload as step 2:

```
TURSO_CONNECTION_URL
TURSO_TOKEN
```

```bash
cd apps/website
grep -v '^#' .env.production | grep -v '^VITE_' | grep '=' \
  | jq -Rn '[inputs | split("=") | {(.[0]): (.[1:]|join("="))}] | add' \
  | bunx wrangler secret bulk
```

`VITE_APP_TITLE` is already a repo variable from step 1 and is shared by every
app; there is nothing website-specific to add there.

### Custom domain and `www`

`apps/website/wrangler.jsonc` declares `morganwrestling.org` as a custom domain
and sets `workers_dev: false`, so the first deploy needs the zone in the same
Cloudflare account and the API token to carry **Workers Routes: Edit** (step 1).
With `workers_dev` off there is no fallback hostname: if the domain is not
attached, the Worker deploys and is unreachable.

`www` is *not* a second route. Add a **bulk redirect rule** in the dashboard —
Rules → Redirect Rules — from `www.morganwrestling.org/*` to
`https://morganwrestling.org/$1`, status **301**, preserving path and query. A
second custom domain would boot a Worker for every redirect and serve identical
content from a second indexable origin.

The edge cache (`s-maxage`, §9 of the app README) is a no-op until the custom
domain is live, so verify cache headers against the apex and not a preview URL.

## 5. Merge to `master`

The workflow only triggers on pushes to `master`. Pushing a feature branch does
nothing — and neither trigger is reachable from one, because GitHub only shows
the `workflow_dispatch` **Run workflow** button for workflows that exist on the
default branch. Both the automatic and manual paths light up only once
`deploy.yml` is on `master`.

After that, the Actions tab has a **Run workflow** button with an app picker,
for manual redeploys.

## Also worth doing

- If the admin Worker was ever deployed under its old scaffold name
  `tanstack-start-app`, delete that Worker from the Cloudflare dashboard. The
  rename to `morgan-wrestling-admin` creates a new one and leaves the old
  running.

## Adding the next app

Worker secrets are per-Worker, so each new app repeats step 2 with its own
values — plus whatever else its `.env.example` implies (step 3 for the admin's
OAuth, step 4 for the website's read-only token and custom domain). In code,
two edits to `.github/workflows/deploy.yml`:

1. Add a key under `filters` alongside `admin`, referencing the `*shared`
   anchor plus its own `apps/<name>/**`
2. Add the name to the `workflow_dispatch` `app` choice options

The deploy matrix picks it up from there. Give each app a distinct `name` in its
`wrangler.jsonc` — that name is the Worker's identity, and a duplicate would
overwrite a sibling app.
