# `@morgan-wrestling/website`

The public, read-only face of Morgan Wrestling. A TanStack Start app on
Cloudflare Workers that renders whatever the admin app has written into Turso —
site home content, teams and their pages, quick links, and the calendar — and
never writes a row back.

> **Status: every page is live (M1–M5).** The app builds, typechecks, tests,
> and serves the home page, the team pages and the calendar from the real
> database. What is left is polish (meta tags, `robots.txt`, `sitemap.xml`,
> cache headers) and deploying it. This file is the design and the build order —
> delete the "Milestones" section once the app ships.

---

## 1. Goals and non-goals

### Goals

- Render the site content authored in `apps/admin` for anonymous visitors.
- Server-render everything. This is a content site — it should be fast, crawlable,
  and readable with JavaScript off.
- Be structurally incapable of mutating the database, at more than one layer.
- Reuse the workspace packages (`db`, `ui`, `styles`) rather than growing a
  parallel copy of them.

### Non-goals

- **No authentication.** `@morgan-wrestling/auth` is deliberately not a
  dependency. There are no sessions, no cookies, no user rows, and no
  `BETTER_AUTH_*` secrets on this Worker. Every visitor sees the same page.
- **No writes.** No `createServerFn({ method: 'POST' })`, no forms, no mutations.
- **No `.ics` generation.** `apps/calendar` already serves subscribable
  calendars at `calendar.morganwrestling.org`; the website links to it.
- **No admin-only content.** Rows flagged inactive (`team_pages.active`,
  `quick_links.active`, `team_quick_links.active`) are filtered out server-side.

---

## 2. Where it sits

```mermaid
flowchart LR
    subgraph Editors
        A[Coaches / admins]
    end
    subgraph Public
        V[Visitors]
        C[Calendar apps<br/>Google / Apple / Outlook]
    end

    subgraph Cloudflare
        ADM["admin.morganwrestling.org<br/><b>apps/admin</b><br/>TanStack Start + better-auth"]
        WEB["morganwrestling.org<br/><b>apps/website</b><br/>TanStack Start, read-only"]
        CAL["calendar.morganwrestling.org<br/><b>apps/calendar</b><br/>Hono, .ics"]
    end

    subgraph Turso
        DB[("content db<br/>calendars, events, teams,<br/>team_pages, settings, quick_links")]
        AUTHDB[("auth db<br/>users, sessions")]
    end

    A -->|read/write| ADM
    V -->|read| WEB
    C -->|subscribe| CAL

    ADM -->|read/write token| DB
    ADM --> AUTHDB
    WEB -.->|<b>read-only token</b>| DB
    CAL -.->|read-only| DB

    WEB -->|links to .ics| CAL
```

Three Workers, one content database, one writer. The website and the calendar
worker are both pure readers; only the admin app holds a read/write token.

---

## 3. Stack

Matched to `apps/admin` so the two apps stay maintainable together, minus
everything auth- and mutation-shaped.

| Concern | Choice | Notes |
| --- | --- | --- |
| Framework | TanStack Start (`@tanstack/react-start`) | File-based routing, server functions, SSR. |
| Runtime | Cloudflare Workers via `@cloudflare/vite-plugin` | Same as admin: `main: "@tanstack/react-start/server-entry"`. |
| Build | Vite 8 | `resolve.tsconfigPaths` + the admin's `optimizeDeps` workaround if a transitive dep bites. |
| Data | `@morgan-wrestling/db` (drizzle + `@tursodatabase/serverless`) | Schema and query helpers come from the package; the app never depends on `drizzle-orm` directly. |
| Data fetching | Router loaders + `@tanstack/react-query` + `@tanstack/react-router-ssr-query` | Mirrors `apps/admin/src/router.tsx`. |
| UI | `@morgan-wrestling/ui`, `@morgan-wrestling/styles` | Shared shadcn/base-ui components and the design tokens. |
| Styling | Tailwind v4 + `@tailwindcss/typography` | Typography is **new** here — see §7. |
| Env | `@t3-oss/env-core` + zod | Same shape as `apps/calendar/src/env.ts`, which is the minimal one. |
| Sanitizing | `ultrahtml` | Its *parser*, not its sanitize transformer — see §7. |
| Lint/format | Root Biome | Tabs, single quotes, sorted classes. Nothing app-local. |
| Tests | Vitest + Testing Library | `vitest.config.ts` is separate from `vite.config.ts`: the app config boots a Worker, and the units worth testing are plain modules. |

### Dependencies to add

```jsonc
{
  "dependencies": {
    "@fontsource-variable/geist": "*",
    "@morgan-wrestling/db": "workspace:*",
    "@morgan-wrestling/styles": "workspace:*",
    "@morgan-wrestling/ui": "workspace:*",
    "@t3-oss/env-core": "*",
    "@tanstack/react-query": "*",
    "@tanstack/react-router": "*",
    "@tanstack/react-router-ssr-query": "*",
    "@tanstack/react-start": "*",
    "date-fns": "*",
    "lucide-react": "*",
    "react": "*",
    "react-day-picker": "*",
    "react-dom": "*",
    "ultrahtml": "*",
    "zod": "*"
  }
}
```

Match the versions already pinned in `apps/admin/package.json` — one resolved
copy of React/Router/Query across the workspace is the point.

Two of those turned out not to be needed once the calendar landed:
`react-day-picker` (the month grid is a server-rendered table — §8) and
`date-fns` (no timezone support without `@date-fns/tz`, so the date handling
goes through `Intl`). Neither is imported anywhere in `src/`; drop them from
this app on the next lockfile change.

Deliberately **absent**: `@morgan-wrestling/auth`, `@tanstack/react-form`,
`@tanstack/react-form-start`, `nanoid`, `jotai`. If a future change wants any of
them, that is a signal the app is drifting out of its read-only lane.

---

## 4. Read-only, enforced in four places

"Read only" is a property that has to be defended, not just intended. Four
independent layers, so no single mistake makes the site writable:

```mermaid
flowchart TD
    R[Route loader] --> S["Server fn<br/>createServerFn({ method: 'GET' })"]
    S --> D["getDb(): ReadonlyDb"]
    D --> T["@tursodatabase/serverless"]
    T --> TU[("Turso — read-only auth token")]

    L1["<b>1.</b> No POST server fns exist"] -.-> S
    L2["<b>2.</b> getDb() returns a type<br/>with only select/query"] -.-> D
    L3["<b>3.</b> Worker secret is a<br/>read-only Turso token"] -.-> TU
    L4["<b>4.</b> No auth package,<br/>so no identity to write as"] -.-> S
```

**1 — No write server functions.** The app defines only
`createServerFn({ method: 'GET' })` handlers under `src/lib/*-fns.ts`. Reviewing
this is a one-line grep, which is the point.

**2 — A narrowed db handle.** `src/db/index.ts` deliberately does *not*
re-export the full drizzle instance. It returns:

```ts
export type ReadonlyDb = Pick<AppDb, 'select' | 'selectDistinct' | '$count'>;
```

**`with` is excluded on purpose.** In `drizzle-orm@1.0.0-rc.4` the object
returned by `db.with(...)` carries its own `insert`, `update` and `delete`
(`sqlite-core/async/db.d.ts:92-103`), so keeping it in the `Pick` would hand
back the entire write path through the back door. The cost is CTEs; if a query
ever genuinely needs one, add a wrapper that forwards only `with(...).select`
rather than widening the type.

Verified — each of these is a `TS2339` against `ReadonlyDb`, while
`getDb().select().from(...)` compiles:

| Expression | Result |
| --- | --- |
| `getDb().select()` | ✅ compiles |
| `getDb().insert(t)` | ❌ `Property 'insert' does not exist` |
| `getDb().update(t)` | ❌ `Property 'update' does not exist` |
| `getDb().delete(t)` | ❌ `Property 'delete' does not exist` |
| `getDb().run(sql)` | ❌ `Property 'run' does not exist` |
| `getDb().transaction(fn)` | ❌ `Property 'transaction' does not exist` |
| `getDb().with(...)` | ❌ `Property 'with' does not exist` |

Re-run that probe after any `drizzle-orm` bump: a `Pick` on a key that no longer
exists is a silent no-op, so a rename upstream would quietly reopen the hole.

**3 — A read-only Turso token.** The Worker secret is minted with
`turso db tokens create <db> --read-only`. Even a bug that got past layers 1–2
fails at the database. This is the only layer that is not bypassable from inside
the codebase, so it is the one that actually matters.

**4 — No writer identity.** Every mutable table carries `created_by`/`updated_by`
sourced from a better-auth session. With no auth package there is no session and
nothing valid to put in those columns.

---

## 5. The read surface

Everything the site renders, and nothing else:

```mermaid
erDiagram
    settings {
        text id PK "always 'site'"
        text home_content "HTML — rendered on /"
        text home_content_metadata "editor-only, unused here"
        text default_calendar FK
    }
    quick_links {
        int id PK
        text title
        text url
        bool active "filter: true"
    }
    teams {
        text id PK
        text name
        text normalized_name "URL slug"
        text home_content "HTML"
        text default_calendar_id FK
    }
    team_pages {
        int id PK
        text team_id FK
        text title
        int sequence_number "nav order"
        text content "HTML"
        bool active "filter: true"
    }
    team_quick_links {
        int id PK
        text team_id FK
        text title
        text url
        bool active "filter: true"
    }
    calendars {
        text id PK
        text name
        text color
    }
    calendar_event_types {
        int id PK
        text calendar_id FK
        text name
        text icon_type
        text icon
        text color
    }
    calendar_events {
        int id PK
        text title
        text description
        text location
        int start_time
        int end_time
        bool all_day
        text calendar_id FK
        int event_type_id FK
    }

    settings ||--o| calendars : "default_calendar"
    teams ||--o| calendars : "default_calendar_id"
    teams ||--o{ team_pages : has
    teams ||--o{ team_quick_links : has
    calendars ||--o{ calendar_event_types : defines
    calendars ||--o{ calendar_events : contains
    calendar_event_types ||--o{ calendar_events : classifies
```

Never selected: `created_by`, `updated_by`, `*_content_metadata` (the
ProseMirror JSON the editor round-trips), and anything from the auth database.
Select explicit column lists, as `apps/admin/src/lib/*-fns.ts` does — it keeps
audit columns off the wire and makes the public surface obvious at the call site.

### `active` is fail-closed

`team_pages.active`, `quick_links.active` and `team_quick_links.active` are all
nullable, and the admin does not filter on them today. **The website treats
`NULL` as hidden**: every public query filters `eq(table.active, true)`, so a
row is visible only when someone explicitly published it.

This is the fail-closed reading, and the one that matters for an anonymous,
edge-cached site — the failure mode of the alternative is a half-written page
going live by accident, which is worse than a published page needing one extra
click in the admin.

Two consequences to expect:

- Rows created before the flag was used may have `NULL` and will be invisible
  until toggled on. That is the intended migration path, not a bug — but say so
  when the site goes live, or it reads as missing content.
- `quick_links.active` and `team_quick_links.active` default to `false`, so new
  links are hidden until published. `team_pages.active` has *no* default, so a
  page inserted without it is `NULL` and therefore hidden. Both land in the same
  place, by different routes.

If this turns out to be the wrong default in practice, the fix is a backfill
plus `NOT NULL` on the column — a shared-schema change, so it belongs in
`packages/db` and the admin, not in a special case here.

---

## 6. Routes

```mermaid
flowchart TD
    ROOT["__root.tsx<br/>html shell, ThemeProvider, head/meta"]
    LAY["_layout.tsx<br/>site header + team nav + footer<br/>loads: teams"]

    HOME["/  index.tsx<br/>settings.home_content<br/>+ active quick links<br/>+ upcoming events"]
    TEAMS["/teams  index.tsx<br/><b>301 → /</b><br/>no bare team index"]
    TEAM["/teams/$teamSlug<br/>team layout: page nav,<br/>team quick links"]
    TEAMHOME["/teams/$teamSlug/  index<br/>teams.home_content"]
    TEAMPAGE["/teams/$teamSlug/$pageSlug<br/>team_pages.content"]
    CALS["/calendar  index.tsx<br/>month view + upcoming list"]
    CAL["/calendar/$calendarId<br/>single calendar + subscribe link"]
    NF["404 notFoundComponent"]

    ROOT --> LAY
    LAY --> HOME
    LAY --> TEAMS
    TEAMS -.->|redirect| HOME
    LAY --> TEAM
    TEAM --> TEAMHOME
    TEAM --> TEAMPAGE
    LAY --> CALS
    CALS --> CAL
    LAY --> NF
```

Quick links sit on the home page rather than in the layout chrome, because
that is where the admin puts them: `apps/admin/.../home-page.tsx` edits them
with `scope='site'` next to the home content, and the team ones live on the
team page the same way. The layout loads only the team list, which is the one
query every page needs.

Plus two non-React responses:

- `/robots.txt` — allow all, point at the sitemap.
- `/sitemap.xml` — generated from teams + active team pages, via a route
  `server.handlers.GET` (see the "API Routes" pattern in the root `README.md`).

### `/teams` has no page

There is no bare team index. The site header already lists every team, so a
visitor who lands on `/teams` — a trimmed URL, an old link, a crawler guessing —
is sent home to pick one from the nav instead of being shown a redundant list.

The redirect is thrown from `beforeLoad`, not from a component, so it resolves
during SSR:

```ts
export const Route = createFileRoute('/_layout/teams/')({
	beforeLoad: () => {
		throw redirect({ to: '/', statusCode: 301 });
	},
});
```

A component-level redirect would ship an empty shell that bounces after
hydration; this returns a real `301` with `location: /` on the first response,
which is also what keeps the duplicate URL out of search indexes. Verified
against the dev server:

```
$ curl -sI localhost:3001/teams
HTTP/1.1 301 Moved Permanently
location: /
```

`301` (permanent) rather than `302` because this is a standing decision, not a
temporary state — if a real team index is ever wanted, note that browsers and
crawlers cache a 301 aggressively and the change will be slow to propagate.

### The `$pageSlug` problem

`team_pages` has `title` and `sequence_number` but **no slug column**, and titles
are not unique per team. Three options:

| Option | URL | Cost |
| --- | --- | --- |
| **A.** Numeric id | `/teams/varsity/7` | Ugly, and page ids leak. No schema change. |
| **B.** Slugify the title at read time | `/teams/varsity/schedule` | Pretty. Ambiguous if two pages in a team normalize to the same slug. |
| **C.** Add `team_pages.slug` (unique per team) | `/teams/varsity/schedule` | Correct. Needs a migration + an admin field. |

**Decided: B now, C later.** `src/lib/slug.ts` is the same
`name.toLowerCase().replace(/\s+/g, '-')` rule `apps/admin/src/lib/team-fns.ts`
uses for teams (plus a trim, which only affects derived page slugs).
`getTeamPage` resolves server-side by comparing normalized titles and, on a
collision, takes the lowest `sequence_number` — the entry the visitor clicked.
Ship C as a follow-up in the admin app when someone actually hits a collision;
the route shape does not change when it lands.

Teams themselves already have `normalized_name`, so `$teamSlug` needs no such
gymnastics.

**A slug matches exactly or it 404s.** The incoming `$pageSlug` is compared as
it arrived rather than re-slugged, so `/teams/varsity/SCHEDULE` is a 404 and not
a second URL serving identical content — which is the rule `$teamSlug` already
gets for free from the database column. Verified:

```
$ curl -so /dev/null -w '%{http_code}\n' localhost:3001/teams/varsity-boys/first-page
200
$ curl -so /dev/null -w '%{http_code}\n' localhost:3001/teams/varsity-boys/First-Page
404
```

If hand-typed mixed case ever turns out to matter, the answer is a 301 to the
canonical form, not a lenient match.

### One query per team page

`getTeamPage` selects every published page of the team — `content` included —
and picks the match in the Worker. There is no slug column to filter on in SQL,
so the rows have to be scanned somewhere, and a team has a handful of pages: a
few discarded kilobytes inside the Worker beats a second serial round trip to
Turso on the critical path of every sub-page view. If a team ever grows enough
pages for that to stop being true, the fix is option C, not a second query.

Every team-scoped read is keyed by the slug in the URL and joins `teams`, rather
than taking a team id resolved earlier in the route tree. That keeps the server
functions independent of each other — the team layout fires all three of its
queries in parallel — at the cost of a join against a table with two rows in it.

### Request flow

```mermaid
sequenceDiagram
    participant B as Browser
    participant W as Worker (TanStack Start)
    participant L as Route loader
    participant F as Server fn (GET)
    participant D as getDb() — ReadonlyDb
    participant T as Turso (read-only)

    B->>W: GET /teams/varsity/schedule
    W->>L: match route, run loader
    L->>F: ensureQueryData(teamPageQueryOptions)
    F->>D: getDb()  (per request, never hoisted)
    D->>T: SELECT ... WHERE normalized_name = ? AND active = 1
    T-->>D: rows
    F-->>L: plain JSON (no audit columns)
    L-->>W: dehydrated query cache
    W-->>B: streamed HTML + hydration payload
    Note over B,W: Client navigations reuse the<br/>same query cache; no refetch<br/>within staleTime.
```

Loaders call `queryClient.ensureQueryData(...)` so the same query options serve
SSR and client navigation, exactly as the admin app does via
`setupRouterSsrQueryIntegration`.

---

## 7. Rendering authored content

`home_content` and `team_pages.content` are **HTML strings** produced by the
Tiptap editor — `packages/ui/src/components/text-editor/types.ts` says so
outright: *"`html` is what gets rendered on the public site"*. The sibling
`*_metadata` column holds the ProseMirror JSON and is editor-only; the website
ignores it.

So rendering is `dangerouslySetInnerHTML` inside a typography container:

```tsx
<article
  className='prose prose-neutral dark:prose-invert max-w-none'
  // biome-ignore lint/security/noDangerouslySetInnerHtml: authored HTML from
  // the admin editor, sanitized on the way out of the server fn.
  dangerouslySetInnerHTML={{ __html: html }}
/>
```

Two things this needs:

1. **`@tailwindcss/typography` must actually be loaded.** It is in the admin's
   devDependencies but no stylesheet references it, and `prose` is used nowhere
   in the repo today. Add `@plugin "@tailwindcss/typography";` to the website's
   `src/styles.css` (app-local, so the admin's bundle is unaffected).

2. **Sanitize server-side.** The authors are trusted admins, so this is
   defense-in-depth rather than a live threat — but the site is anonymous and
   cached, so a single bad paste would be served to everyone. `sanitizeHtml`
   in `src/lib/sanitize-html.ts` is the one helper every content-returning
   server fn calls, and it runs in the *server function*, so unsafe markup
   never crosses to the client.

### Why the sanitizer is hand-rolled over `ultrahtml`'s parser

`ultrahtml` is the right parser for a Worker — no DOM, no dependencies, and it
closes tags the author left open. Its bundled `transformers/sanitize` is **not**
a security boundary, though. Probed against 1.7.0 with
`allowElements: ['p','a']` and `allowAttributes: { href: ['a'] }`:

| Input | Output | Why |
| --- | --- | --- |
| `<p onclick="alert(1)">hi</p>` | unchanged | `allowAttributes` only *keeps* listed attributes; an unlisted one falls through both branches and survives |
| `<a href="javascript:alert(1)">` | unchanged | no scheme check anywhere |
| `<p title='a" onmouseover="alert(1)'>` | `<p title="a" onmouseover="alert(1)">` | `attrsToString` interpolates values without escaping `"`, so a value containing a quote breaks out of the attribute |
| `<P CLASS="X">upper</P>` | *empty* | names are matched case-sensitively, so uppercase markup is dropped wholesale |

The first three are live XSS with an allowlist that looks correct. So we keep
`parse` and walk the tree ourselves: elements and attributes are allowlisted by
name (lowercased first), URLs are scheme-checked *after* entity decoding so
`&#106;avascript:` is caught, `style` is narrowed to the `text-align` that
TextAlign emits, and serialization escapes what it writes.

Two things the allowlist has to keep, which a tighter one would break:

- **`class`, everywhere.** The editor's styling *is* class attributes —
  `packages/ui/.../extensions/headings.ts` and friends put Tailwind utilities
  into the stored HTML. They resolve on this site because
  `packages/styles/src/index.css` does `@source "../../../packages/ui/src"`,
  so the utilities are in the website's bundle too (verified: `text-4xl`,
  `list-disc`, `bg-amber-200` are all in `dist/client/assets/styles-*.css`).
- **Tags no extension is registered for yet.** `img` and the table tags are
  allowlisted even though the editor does not emit them today, so that turning
  those extensions on in the admin does not silently blank existing pages.

`src/lib/sanitize-html.test.ts` covers each row of that table plus the
round-trip of real editor output; run it after any `ultrahtml` bump.

---

## 8. Calendar display

### Which calendars are public

`calendars` has no `public` flag, so "every calendar" is not a safe default — an
internal or scratch calendar created in the admin would be world-readable the
moment it exists.

**A calendar is public only if something on the site references it:** it is
`settings.default_calendar`, or it is some team's `teams.default_calendar_id`.
`/calendar` lists exactly that set, and `/calendar/$calendarId` 404s for
anything outside it — otherwise the id is a guessable back door around the list.

`isPublicCalendar` in `src/lib/calendar-fns.ts` is the only place that decides
this, and every calendar read goes through it — including `getPublicCalendar`,
which filters by id *and* by public, so guessing an id is not a way round the
list. It is two `IN` subqueries rather than a CTE because `ReadonlyDb` withholds
`with(...)` (§4); that costs nothing, since both run in the one round trip:

```ts
or(
  inArray(column, select settings.default_calendar where id = 'site'),
  inArray(column, select distinct teams.default_calendar_id where not null),
)
```

Publishing a calendar is therefore an act of wiring it to the site in the admin,
which is a reasonable mental model. If it ever becomes too coarse — a team wants
two public calendars — that is the point to add `calendars.public` and switch
the filter; the route shape does not change.

Verified against the live database, which has three calendars and references
exactly one of them:

| Scope | Rows |
| --- | --- |
| `public` | the event on `Calendar One` |
| `site` (`settings.default_calendar`) | the event on `Calendar One` |
| `calendar`, the referenced id | the event on `Calendar One` |
| `calendar`, either unreferenced id | none — and the route 404s |
| `team`, a team with a null default | none |

### Event scopes

`getMonthEvents` and `getUpcomingEvents` both take a scope — `public`,
`calendar`, `site` or `team` — instead of a calendar id, and resolve it in SQL:

- `site` and `team` look the default calendar up in a subquery rather than
  taking an id the page fetched first, so the home page and a team page each
  need one round trip and not two chained ones. They also need no separate
  public check: being referenced by the site or a team is *what makes* a
  calendar public.
- `calendar` is the only one that takes an id, and it ANDs the public filter.

The window for `getMonthEvents` is derived from the month **in the Worker**, so
the size of the query is not something a URL can ask for. Bounds are
overlap-based, matching `apps/calendar`, which is what keeps a tournament that
started last month on this month's first row.

### What a visitor sees

The calendar pages read from the same tables `apps/calendar` does. A visitor can:

- see a month grid with per-day event dots coloured by
  `calendar_event_types.color` (the `--calendar-*` tokens and the
  `calendarColors` map in `packages/ui/src/components/calendar/calendar-utils.ts`
  already exist for this),
- see an upcoming-events list with title, time, location, and type,
- click **Subscribe** → `https://calendar.morganwrestling.org/<calendarId>/calendar.ics`.

Queries are bounded by a date window, the same overlap logic
`apps/calendar/src/fns/create-calendar.ts` uses — keep any event that intersects
the window rather than only those fully inside it:

```ts
and(
  eq(calendarEvents.calendarId, calendarId),
  gte(calendarEvents.endTime, windowStart),
  lte(calendarEvents.startTime, windowEnd),
)
```

The same lists are on the home page (scope `site`) and each team page (scope
`team`), and are hidden rather than shown empty — an "Upcoming events" heading
with nothing under it tells a visitor less than no heading at all.

### The month is a URL, not component state

`packages/ui` has a `react-day-picker` `Calendar`, and
`apps/admin/src/components/big-calendar.tsx` scaffolds a month grid on it. Both
are *input* components: they hold a selection in React state and change month
with buttons. This site has nothing to select and has to be readable with
JavaScript off (§1), so `src/components/month-calendar.tsx` is a plain `<table>`
and the month is `?month=YYYY-MM`, moved by links:

```
$ curl -s 'localhost:3001/calendar?month=2026-12' | grep -o 'December 2026'
December 2026
```

Which also means every month is its own cacheable URL at the edge, and a
crawler can walk the schedule. Nothing in `src/` imports `react-day-picker` as
a result — see the note under §3's dependency list.

An unparseable month is **dropped, and the URL normalized**: `validateSearch`
discards the bad value and the router redirects to the canonical address rather
than rendering an error page. One catch is worth knowing — a route's search is
merged over its parents', and `_layout` has no validator of its own, so
returning `{}` for an invalid month leaves the raw one in place and it reaches
the loader. `monthSearchSchema` has to return `{ month: undefined }` explicitly.
Until it did, `?month=bogus` was a 500 out of the server function's validator,
which is the layer that caught it:

```
$ curl -sI 'localhost:3001/calendar?month=bogus' | grep -iE '^(HTTP|location)'
HTTP/1.1 307 Temporary Redirect
location: /calendar
```

`apps/admin`'s scaffold is left alone, per the note above. If a month grid is
ever wanted in both apps, promote a real one into `packages/ui` then.

### Days, not instants

`start_time` is an instant; a calendar is about days. The Worker runs in UTC, so
`src/lib/calendar-month.ts` converts every instant to a *civil date* — the
`YYYY-MM-DD` someone in `America/Denver` would write down — before deciding
which square an event belongs on. A 6pm Mountain meet is stored as 00:00 UTC the
next morning, and a UTC grid prints it on the wrong day.

The data confirms the frame: the one event in the database is
`2026-09-09T06:00:00Z → 2026-09-12T06:00:00Z`, which is midnight Mountain on
both ends, because that is what the admin's date picker sent. It also fixes two
conventions the code depends on — **the end is inclusive** (that row is a
four-day event, not three), and a multi-day event is marked on *every* day it
covers.

`America/Denver` is a constant, not an env var: §11's `.env` has two entries and
a third that never changes would not earn its place. Formatting goes through
`Intl` because `date-fns` has no timezone support without `@date-fns/tz`, which
is not a dependency. Civil-date arithmetic steps through `Date.UTC`, where a day
is always 24 hours — `src/lib/calendar-month.test.ts` covers the DST weekend,
the January offset, month and year rollover, and the leap day.

---

## 9. Caching and freshness

Content changes a few times a week; traffic is bursty around events. Layers,
cheapest first:

| Layer | Setting | Effect |
| --- | --- | --- |
| Query client | `staleTime: 5 * 60 * 1000` | No refetch on client navigation within the window. |
| Document response | `Cache-Control: public, max-age=0, s-maxage=300, stale-while-revalidate=3600` | Cloudflare's edge serves the HTML; a stale page refreshes in the background. |
| Static assets | Vite's hashed filenames + immutable | Free. |

**There is no cache invalidation.** `caches.default.delete()` only purges the
colo that runs it, so the admin app cannot bust the website's edge cache after
an edit — the same constraint that is documented in `apps/calendar/src/index.ts`.
The TTL is the whole freshness story, which is why 300s (not an hour). If
editors need faster feedback later, the options are a Cloudflare cache-tag purge
from the admin app (paid feature) or dropping `s-maxage` and leaning on
`stale-while-revalidate` alone.

Note the same caveat as the calendar worker: the edge cache is a no-op on
`*.workers.dev`. Testing cache behaviour requires the custom domain.

---

## 10. Layout

`✓` exists today; the rest arrives with the milestone noted.

```
apps/website/
├── README.md                  ✓ this file
├── package.json               ✓
├── tsconfig.json              ✓ extends ../../tsconfig.base.json, "#/*" + ui path map
├── tsr.config.json            ✓
├── vite.config.ts             ✓ devtools, cloudflare, tailwind, tanstackStart, react
├── vitest.config.ts           ✓ jsdom, no cloudflare/start plugins
├── wrangler.jsonc             ✓ name: morgan-wrestling-website
├── .env.example               ✓
└── src/
    ├── router.tsx             ✓
    ├── routeTree.gen.ts       ✓ generated — biome-ignored, do not edit
    ├── styles.css             ✓ @import styles pkg; @plugin typography
    ├── env.ts                 ✓ TURSO_CONNECTION_URL, TURSO_TOKEN, VITE_APP_TITLE
    ├── db/
    │   └── index.ts           ✓ getDb(): ReadonlyDb
    ├── lib/
    │   ├── sanitize-html.ts   ✓ + .test.ts
    │   ├── quick-links.ts     ✓ QuickLink type + toQuickLinkHref, + .test.ts
    │   ├── slug.ts            ✓ toSlug(), for derived page slugs, + .test.ts
    │   ├── site-fns.ts        ✓ settings + active quick links (GET)
    │   ├── site-opts.ts       ✓
    │   ├── team-fns.ts        ✓ team nav, team, page nav, page, quick links
    │   ├── team-opts.ts       ✓
    │   ├── calendar-fns.ts    ✓ public set, scoped month + upcoming (GET)
    │   ├── calendar-month.ts  ✓ civil dates, month grid, + .test.ts
    │   ├── calendar-opts.ts   ✓
    │   └── month-search.ts    ✓ the ?month=YYYY-MM validator
    ├── components/
    │   ├── site-header.tsx    ✓ calendar link + nav from the team list
    │   ├── site-footer.tsx    ✓
    │   ├── rich-content.tsx   ✓ the one prose + dangerouslySetInnerHTML site
    │   ├── quick-links.tsx    ✓ + .test.tsx
    │   ├── event-list.tsx     ✓ upcoming list + the shared event dot
    │   └── month-calendar.tsx ✓ server-rendered table, month in the URL
    ├── integrations/
    │   └── tanstack-query/
    │       ├── root-provider.tsx  ✓ QueryClient, staleTime 5m
    │       └── devtools.tsx       ✓
    └── routes/
        ├── __root.tsx                       ✓
        ├── _layout.tsx                      ✓ loads the team nav
        ├── _layout/index.tsx                ✓ home content, quick links, events
        ├── _layout/teams/index.tsx          ✓ 301 → /
        ├── _layout/teams/$teamSlug.tsx      ✓ name, page nav, quick links
        ├── _layout/teams/$teamSlug/index.tsx    ✓ teams.home_content
        ├── _layout/teams/$teamSlug/$pageSlug.tsx ✓ team_pages.content
        ├── _layout/calendar/index.tsx       ✓ every public calendar, pooled
        ├── _layout/calendar/$calendarId.tsx ✓ one calendar + subscribe
        ├── robots[.]txt.ts                  M6
        └── sitemap[.]xml.ts                 M6
```

There is no `public/` yet — add one at M6 with a favicon and the app icons.

No `_protected` tree, no `log-in` / `sign-up` routes, no `api/auth/$` — the three
things that make the admin's route tree look the way it does are all absent here.

---

## 11. Config

### `wrangler.jsonc`

Written and current: `morganwrestling.org` is the one custom domain, and
`workers_dev` is off so the `*.workers.dev` hostname — which bypasses the edge
cache and any WAF rule, and would be a second indexable origin — is not a way in.

**`www` 301s to the apex via a Cloudflare bulk redirect rule, not a Worker
route.** A redirect should not cost a Worker invocation, and a second custom
domain would serve identical content from a second URL. Configure the rule in
the dashboard at M7, alongside attaching the apex domain.

### `.env.example`

```
VITE_APP_TITLE='Morgan Wrestling'

# Read-only Turso token:
#   turso db tokens create <db> --read-only
TURSO_CONNECTION_URL=
TURSO_TOKEN=
```

Two variables. If a fifth line ever appears here, something has gone wrong with
the scope of this app.

### `.github/workflows/deploy.yml`

Two edits, per the "Adding the next app" section of `BEFORE_DEPLOY.md`:

```yaml
            website:
              - *shared
              - 'apps/website/**'
```

and `website` added to the `workflow_dispatch` `app` choices. Then push the
Worker secrets once from a local machine (`wrangler secret bulk`) — CI never
sees them.

---

## 12. Milestones

Each one ends at something runnable.

- [x] **M1 — Scaffold.** Config, `env.ts`, `styles.css`, `router.tsx`,
      `__root.tsx`, `_layout.tsx` and a placeholder `/`. Builds, typechecks,
      passes Biome, serves a 200.
- [x] **M1a — `/teams` redirect.** 301 to `/` from `beforeLoad`, verified
      against a running server.
- [x] **M2 — Read-only data layer.** `ReadonlyDb` (write-rejection probe in §4
      passes), `site-fns.ts` returning `settings` + active `quick_links`, and
      `sanitize-html.ts`.
- [x] **M3 — Home page.** Header nav driven by the team list; site home content
      and quick links rendered at `/`. Verified against the live database: the
      nav lists the real teams, `settings.home_content` renders through
      `prose`, and the quick link resolves to its external destination.
- [x] **M4 — Teams.** `/teams/$teamSlug` and `/teams/$teamSlug/$pageSlug`, with
      the slug resolution from §6 and `active` filtering; the header's team
      entries are typed `Link`s again. Verified against the live database: both
      teams render their home content, `First  Page` resolves at
      `/teams/varsity-boys/first-page` (the double space collapsing to one
      dash), the team quick link renders, an unknown team is a 404 and an
      unknown page is a 404 that keeps the team's heading and nav.
      **`active = false` is not exercised by the data** — every `team_pages` and
      `team_quick_links` row in the database today is published, so the filter
      is verified only by being the same `eq(table.active, true)` the home
      page's quick links already prove. Re-check it the first time someone
      unpublishes something.
- [x] **M5 — Calendar.** `/calendar` and `/calendar/$calendarId` — month grid,
      upcoming list, subscribe link to the calendar worker, plus the upcoming
      lists on `/` and each team page and a **Calendar** entry in the header.
      Verified against the live database: the four-day all-day event is marked
      on all four of its Mountain-time days, the dots resolve to
      `text-calendar-pink` from its event type, month links walk August →
      January 2027, `?month=bogus` 307s to `/calendar`, and both unreferenced
      calendars 404 while the referenced one renders with the right `.ics` URL.
      Each of the four event scopes was checked against the database directly
      (the table in §8) — the `site` and `team` lists are empty in the app
      today only because the one event is in the past and no team has a
      default calendar yet.
- [ ] **M6 — Polish.** `head`/meta per route (title, description, OG tags),
      `robots.txt`, `sitemap.xml`, cache headers from §9, Lighthouse pass,
      no-JS check, and a root `notFoundComponent` — M4 added one per team route
      so a bad slug lands somewhere sensible, but a bare unknown path still
      gets the router's default.
- [ ] **M7 — Deploy.** Read-only Turso token minted, Worker secrets pushed,
      `deploy.yml` filter + dispatch choice added, custom domain attached,
      `BEFORE_DEPLOY.md` updated with the website's (much shorter) setup.

---

## 13. Open questions

Still open:

1. **Slug column** — B (slugify at read time) shipped at M4. Option C, a real
   `team_pages.slug`, is still the correct end state; it needs a migration and
   an admin field, so it waits for someone to hit an actual collision. Until
   then two pages whose titles slug alike show two nav entries pointing at one
   URL.
2. **Quick-link URLs have no scheme in the database.** `quick_links.url` is
   free text in the admin and the row that exists today is
   `trackwrestling.com`, which a browser reads as a *relative* path.
   `toQuickLinkHref` prefixes `https://` when the first segment looks like a
   hostname, which is a guess. The real fix is validating the URL in the
   admin's quick-link form — a change in `apps/admin`, so it is filed here
   rather than worked around further.

Resolved:

| Question | Decision | Where |
| --- | --- | --- |
| Does `/teams` need an index page? | No — 301 to `/`, pick a team from the nav | §6 |
| Apex or `www`? | Apex is canonical; `www` 301s via a bulk redirect rule | §11 |
| Which calendars are public? | Only those referenced by a site or team default | §8 |
| What does `active = NULL` mean? | Hidden — every public query requires `active = true` | §5 |
| Which sanitizer? | `ultrahtml`'s parser, our own allowlist walk — its sanitize transformer leaks `onclick`, `javascript:` and attribute breakouts | §7 |
| Where do site quick links render? | The home page, matching the admin's `scope='site'` editor — not the layout chrome | §6 |
| Is a page slug matched loosely? | No — exactly, or 404; one canonical URL per page | §6 |
| Do team reads take a slug or an id? | The slug, joined against `teams`, so the server fns stay independent | §6 |
| How does the month grid change month? | `?month=YYYY-MM` and links, not component state — it has to work with JS off | §8 |
| Which timezone are events shown in? | `America/Denver`, as a constant; instants are bucketed by civil date | §8 |
| Is an all-day event's `end_time` inclusive? | Yes — that is what the admin stores, so the last day is shown | §8 |

---

## 14. Local development

```bash
cp .env.example .env    # the two read-only Turso values
bun run dev             # http://localhost:3001
bun run test            # vitest, no database needed
```

**Known breakage:** `bun --bun run dev` (the command in the root `README.md`)
currently dies before the server starts:

```
TypeError: this.#runtimeDispatcher?.close is not a function
    at #assembleAndUpdateConfig (miniflare/dist/src/index.js)
```

This is a `miniflare@5.x-alpha` + bun-runtime incompatibility in
`@cloudflare/vite-plugin`, **not** specific to this app — `apps/admin` fails
identically on the same machine, so it predates the website. Running Vite under
Node works fine in the meantime:

```bash
node ./node_modules/vite/bin/vite.js dev --port 3001
```

`bun run build`, `bunx tsc --noEmit` and `bunx biome check` are all unaffected.
Worth fixing repo-wide (pin miniflare, or drop `--bun` from the documented dev
command) rather than per-app.
