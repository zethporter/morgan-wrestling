# Responsive plan

How `apps/website` becomes something that reads well on a 320 px phone, a tablet
in either orientation, and a 1440 px desktop — without giving up the two
properties the app was built around: **server-rendered, readable with
JavaScript off** (README §1) and **one copy of any piece of markup** (README
§8).

> **Scope of the audit.** This is a code-level read of every component and route
> under `src/`, plus the shared tokens in `packages/styles`. Nothing here was
> measured in a real browser — the widths quoted in §2 are computed from the
> Tailwind classes actually on the elements. §8 is the pass that checks them.

---

## 1. What is already right

Worth stating, because it narrows the work considerably.

- `<meta name="viewport" content="width=device-width, initial-scale=1">` is
  emitted by `rootSeo()` (`lib/seo.ts:115`). Without it none of the rest would
  matter.
- Every page already centres on `mx-auto w-full max-w-4xl px-4`, so there is a
  single convention to change rather than seven different ones.
- `quick-links.tsx` already reflows (`grid gap-2 sm:grid-cols-2`), and
  `DialogContent` in `packages/ui` is already `max-w-[calc(100%-2rem)]
  sm:max-w-md`, so the event dialog does not blow out on a phone.
- Headers, footers and nav lists already use `flex-wrap` with separate `gap-x`
  and `gap-y`, so nothing hard-overflows when it wraps.
- The month grid is a CSS grid of fractional columns, so it *shrinks* rather
  than overflowing. It gets unreadable (§2.1) but it never forces a horizontal
  scrollbar.
- Breakpoints are stock Tailwind v4 — `sm` 40rem, `md` 48rem, `lg` 64rem, `xl`
  80rem, `2xl` 96rem. `packages/styles/src/index.css` overrides colours, radii
  and fonts but **not** `--breakpoint-*`. No custom scale to learn.

No new dependencies are needed for any of this. `packages/ui` already ships
`drawer.tsx`, `sheet.tsx` and `collapsible.tsx` if §4 ends up wanting one.

---

## 2. What is broken, in priority order

### 2.1 The month grid is unusable below ~640 px — the only true blocker

`month-calendar.tsx` draws seven fractional columns and paints event titles into
bars at `text-[0.6875rem]` with `truncate`. Working inward from the viewport:
container `px-4` (32 px), day cell `px-1` (8 px), bar `ml-0.5 mr-0.5` (4 px),
bar `px-1` (8 px), `border-l-2` (2 px) — 54 px of chrome per column beyond the
column width itself.

| Viewport | Column | Text box in a bar | Roughly |
| --- | --- | --- | --- |
| 320 px | 41 px | ~19 px | 2 characters |
| 390 px | 51 px | ~29 px | 3–4 characters |
| 430 px | 57 px | ~35 px | 4–5 characters |
| 768 px (iPad portrait) | 105 px | ~83 px | 11–13 characters |
| ≥ 928 px (`max-w-4xl` reached) | 123 px | ~101 px | 14–16 characters |

So "Varsity Duals @ Ogden" renders as `Va…` on a phone. The grid is doing its
job structurally and saying nothing. Tablet portrait is the first width where a
bar carries real information, and it is still tight.

`ROW_HEIGHT` is a hard-coded `1.5rem` (24 px) for both the date-number row and
every bar lane, and a week is `min-h-20`. A 24 px bar is the primary tap target
on the page and sits under the 44 px WCAG 2.5.5 target size — and right at the
24 px floor of 2.5.8, with no spacing allowance.

### 2.2 Every page is capped at `max-w-4xl`, on every screen

`max-w-4xl` is 896 px. That is a good measure for prose and a poor one for a
seven-column calendar: on a 1440 px or 1920 px display the calendar sits in the
middle third of the window with the rest empty, while its cells are still only
~123 px wide. The upcoming-events list below it is a single narrow column with
acres of space beside it.

The same string — `mx-auto flex w-full max-w-4xl flex-col gap-10 px-4 py-12` —
is copy-pasted across `_layout/index.tsx`, `calendar/index.tsx`,
`calendar/$calendarId.tsx`, `teams/$teamSlug.tsx` (with `gap-8`), and both
`notFoundComponent`s plus `__root.tsx`'s. Any responsive change to the shell has
to be made in seven places and will drift. This is the thing to fix first,
because it makes everything after it a one-line change.

Padding and rhythm are also fixed: `px-4` on a 1440 px screen, `py-12` on a
320 px one, `gap-10` everywhere.

### 2.3 The header nav does not degrade

`site-header.tsx` renders the brand plus `Calendar` plus one link per team in a
single wrapping flex row. With two teams (today's data) it fits on one line down
to about 400 px. It does not scale: five teams with real names wrap to three or
four lines on a phone, and the brand ends up visually detached from a block of
small grey links. There is no active-page affordance beyond weight, and no
`min-h` on the links — `text-sm` anchors with no padding are ~20 px tall targets.

### 2.4 Authored HTML can overflow, and nothing catches it

`rich-content.tsx` renders Tiptap output with `prose prose-neutral max-w-none`.
The editor in `packages/ui` ships table, image, blockquote and code support, so
`home_content` and `team_pages.content` can legitimately contain:

- **Tables** — `@tailwindcss/typography` styles them but does not make them
  scrollable. A four-column table on a 360 px phone pushes the whole document
  wide and produces a horizontal scrollbar on `<body>`.
- **Long unbroken URLs** pasted as text — same effect.
- **Images** — typography sets `max-w-full h-auto`, so these are fine.

`max-w-none` also means that once §2.2 widens any container, prose lines go past
100 characters on a desktop, which is the opposite problem.

### 2.5 Small things that add up

| Where | Issue |
| --- | --- |
| `_layout.tsx:17`, `__root.tsx:104` | `min-h-screen` — on iOS/Android `100vh` includes the collapsing URL bar, so the footer sits below the fold and the page scrolls by ~80 px for no reason. `min-h-dvh` is the fix. |
| `event-list.tsx:81`, `event-details.tsx:54` | `break-all` on locations breaks mid-word at arbitrary points (`Ogden High Sc / hool`). `wrap-anywhere` (or `break-words`) only breaks when a word genuinely cannot fit. |
| `month-calendar.tsx:344` | Month arrows are `p-1.5` around `size-4` — a 28 px target. |
| `calendar/$calendarId.tsx:111` | The Subscribe button wraps under the heading on mobile and stays left-aligned at `px-4 py-2`; it should be full-width and comfortably tall there. |
| `calendar/index.tsx:98` | Each calendar row is `flex-wrap justify-between`; when it wraps, "Subscribe" lands directly under the calendar name and the two read as one item. |
| Every `h1` | Hard-coded `text-3xl`. Fine on a phone, undersized on a 27" monitor. |
| `quick-links.tsx:36` | Stops at `sm:grid-cols-2`; has room for three columns once containers widen. |
| `styles.css` | No `@custom-variant` for coarse pointers, so touch-target sizing has to be expressed as a breakpoint (a proxy) rather than as the actual condition. |

---

## 3. Foundations (do this first)

Nothing visible changes here. This exists so §4–§7 are each a handful of lines.

### 3.1 A container component

New `src/components/page-container.tsx`:

```tsx
const WIDTHS = {
  prose: 'max-w-4xl',   // reading measure — home, team pages
  wide:  'max-w-6xl',   // the calendar grid wants the pixels
} as const;

export const PageContainer = ({ width = 'prose', className, children }) => (
  <div
    className={cn(
      'mx-auto flex w-full flex-col px-4 sm:px-6 lg:px-8',
      'gap-8 py-8 sm:gap-10 sm:py-12 lg:py-16',
      WIDTHS[width],
      className,
    )}
  >
    {children}
  </div>
);
```

Then replace the seven hand-written copies. **`site-header.tsx` and
`site-footer.tsx` must use the same widths**, or the nav stops lining up with
the content the moment a calendar page goes to `max-w-6xl`. The simplest answer
is to give the header and footer inner wrappers `max-w-6xl` unconditionally and
let the prose pages be narrower inside them — the nav aligning to the widest
page is the conventional choice and reads correctly on both.

### 3.2 A heading scale

Add to the same file (or `src/components/typography.tsx`):

```tsx
export const PageTitle = ({ children, className }) => (
  <h1 className={cn('font-bold text-2xl sm:text-3xl lg:text-4xl', className)}>
    {children}
  </h1>
);
```

Six `<h1 className='font-bold text-3xl'>` become this. Section headings
(`text-2xl` on `$pageSlug`, the uppercase `text-sm` labels on `EventList` /
`QuickLinks`) stay as they are — they are already small enough to be safe and
large enough to read.

### 3.3 A coarse-pointer variant

In `src/styles.css`, next to the typography plugin:

```css
/* Touch-target sizing is a property of the input device, not the viewport —
   a 1024px tablet needs the big targets and a 380px desktop window does not. */
@custom-variant coarse (@media (pointer: coarse));
```

App-local rather than in `packages/styles`, because the admin app is a
keyboard-and-mouse tool and has no use for it.

### 3.4 `min-h-dvh`

Two occurrences (`_layout.tsx:17`, `__root.tsx:104`). Do it with the container
work.

---

## 4. The calendar (§2.1)

This is the bulk of the work.

### 4.1 Decided: a date-grouped agenda list below `md`, the grid at `md` and up

`md` (768 px) is the first width where a bar carries a readable title (§2.1), so
it is the honest breakpoint rather than a round number. Below it, the month's
events render as a list grouped by day.

- Both branches are server-rendered and toggled with `hidden md:block` /
  `md:hidden`. No `useMediaQuery`, no hydration mismatch, no flash — and it
  works with JavaScript off, which a JS-measured switch would not.
- The cost is that a phone downloads the grid markup it will not paint (and vice
  versa). The events are already in the payload either way; this is an extra
  render of data that is present, not an extra request. For a month with ~20
  events that is a few kB of HTML before compression.
- The README's "no second copy of the markup to keep in step" holds as long as
  the agenda rows render through `EventDetails` — the same component the grid's
  `:target` panels and dialog already use. One source of truth for how an event
  is described; two ways to arrange them on a page.

Shape of it, in a new `src/components/month-agenda.tsx`:

- Takes the same `{ month, events, showCalendar }` the grid does, so the two are
  interchangeable and the route passes one set of props.
- Groups by civil date using the existing `buildMonthGrid` pass in
  `lib/calendar-month.ts` — it already buckets events per day, and
  `buildMonthWeeks` is layered over it, so the data is there without new
  arithmetic. Days with nothing on them are skipped; a multi-day event appears
  once, under its start day, with `formatEventWhen` carrying the range.
- A day heading (`Sat 14`), then its events as rows: colour dot, title,
  `EventDetails` beneath. Rows are `<a href='#event-<id>'>` exactly as the bars
  are, so the `:target` panels and the dialog interception work unchanged and
  a shared `#event-<id>` link still lands correctly on a phone.
- An empty month says so, rather than rendering a bare month heading.
- The month heading and prev/next/Today nav stay in `MonthCalendar` above both
  branches — they are not part of either view.

**What this rules out.** Keeping the grid at all widths with bars reduced to
colour chips was the alternative: it preserves the "which days are busy" glance
and adds no markup, but a visitor who wants to know *what* is on the 14th has to
tap it. Panning a `min-w-[640px]` grid inside `overflow-x-auto` was rejected
outright — it is worse than either view and it breaks the `:target` fallback's
scroll behaviour. If the month-at-a-glance turns out to be missed, the follow-up
is the chip grid *above* the agenda list on mobile, not instead of it.

### 4.2 Grid changes at `md` and up

- Make `ROW_HEIGHT` a CSS custom property set on the grid container rather than
  a module constant, so it can scale: `1.5rem` at `md`, `1.75rem` at `lg`. The
  `gridTemplateRows` template already interpolates it; it just needs to read
  `var(--cal-row)` instead of the JS constant.
- Week `min-h-20` → `md:min-h-24 lg:min-h-28`. More breathing room in the cells
  is most of what makes the grid feel like a desktop calendar rather than a
  shrunken phone one.
- Bar text `text-[0.6875rem]` → `text-xs` at `lg` (12 px), where there is room.
- Month nav arrows: `p-1.5` → `p-2 coarse:p-3` with `min-h-11 min-w-11` under
  `coarse`, and the same on the "Today" link.
- Weekday labels: keep `Sun`/`Mon` at `sm` and up; consider single letters below
  it if the compact-grid alternative in §4.1 is chosen. They are `aria-hidden`,
  so this is purely visual.

### 4.3 Calendar pages go `wide`

`calendar/index.tsx` and `calendar/$calendarId.tsx` switch to
`<PageContainer width='wide'>`. At `max-w-6xl` (1152 px) columns become ~157 px
and a bar holds ~20 characters — the difference between "Varsity Duals @…" and
the whole title.

---

## 5. The header (§2.3)

**Recommended: a two-row header below `sm`, with the nav as a
horizontally-scrollable strip.**

```
┌──────────────────────────────┐
│ Morgan Wrestling             │   row 1: brand
│ Calendar · Varsity · Youth → │   row 2: overflow-x-auto, no wrap
└──────────────────────────────┘
```

- `flex-col sm:flex-row` on the nav, with the `<ul>` getting
  `flex-nowrap overflow-x-auto sm:flex-wrap sm:overflow-visible` plus
  `[scrollbar-width:none]` and `snap-x`.
- Scales to any number of teams without ever growing taller.
- No JavaScript, no disclosure state, no duplicated list — so §1's no-JS
  requirement is satisfied by construction.
- Add `-mx-4 px-4` on the strip so the scroll runs edge-to-edge and the first
  and last items still align with the content gutter.
- Give each link `py-1.5` (and `coarse:py-2.5`) so the tap targets clear 44 px.

**If the team count grows past ~5 and the strip stops being obvious**, the
escape hatch is a `Sheet` from `packages/ui` behind a Menu button at `<md`. Do
not reach for it now: it needs client state, which means the nav is either
absent or flashing for a no-JS visitor, and that is a real regression against a
problem the site does not have yet.

Also: the site has a `ThemeProvider` with `defaultTheme='system'` and no toggle
anywhere in the UI. Adding one belongs in the header and is a natural companion
to this work, but it is not a responsiveness fix — call it separately.

---

## 6. Authored content (§2.4)

In `src/styles.css`, after the typography plugin:

```css
/* Tiptap output is authored by coaches in a wide editor and read on phones.
   These are the two ways it escapes its container. */
@layer components {
  .prose :where(table) {
    display: block;
    overflow-x: auto;
    max-width: 100%;
  }
  .prose :where(p, li, h1, h2, h3, h4, blockquote) {
    overflow-wrap: anywhere;
  }
}
```

`display: block` on a table is the standard trick for making one scrollable
without a wrapper element — and a wrapper is not available here, because the
HTML arrives as a string and `rich-content.tsx` is deliberately the only
`dangerouslySetInnerHTML` in the app (its comment says to keep it that way).
Post-processing the sanitised HTML to inject wrappers would mean a second
transform to audit; the CSS costs nothing and needs no audit.

Then in `rich-content.tsx`, scale the prose itself:

```
prose-sm sm:prose lg:prose-lg  prose-neutral dark:prose-invert  max-w-none
```

`max-w-none` stays — the `PageContainer` at `max-w-4xl` is already the measure,
and prose's own `65ch` would make the column narrower than the quick-links grid
beside it, which looks like a mistake.

---

## 7. Large screens (§2.2)

Widening the container is the floor, not the goal. Two layouts actually use the
space:

**Calendar pages at `lg` and up** — grid on the left, upcoming events on the
right:

```tsx
<div className='grid gap-10 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] lg:items-start'>
  <MonthCalendar … />
  <EventList … className='lg:sticky lg:top-8' />
</div>
```

`minmax(0, …)` rather than bare `2fr` matters: a grid track defaults to
`min-width: auto`, and the truncating bars inside the calendar would otherwise
force the track wider than its share. The `:target` details panels stay directly
under the grid where the anchor links expect them.

**Team pages at `lg` and up** — content on the left, quick links as a sidebar on
the right. Same structure. `$teamSlug.tsx` currently stacks
`<Outlet />` then `<QuickLinks />`, which on a 1440 px screen means the links sit
alone in a 896 px-wide column of mostly whitespace.

The home page can keep its single column — it is prose first and a stack reads
correctly at any width.

At `2xl` (1536 px+), stop widening. `max-w-6xl` centred with generous gutters is
the right terminal state; going further just makes the eye travel.

---

## 8. Verification

There is no visual-regression infrastructure today, and the existing Vitest +
Testing Library suite tests logic (`lib/*.test.ts`) and semantics
(`quick-links.test.tsx`, `rich-content.test.tsx`) — none of it can catch layout.
Do not add snapshot tests for this; check it by looking.

Run `bun run dev` (port 3001) against real data and walk the matrix:

| Width | Stands for | Watch for |
| --- | --- | --- |
| 320 | iPhone SE, small Android | Any horizontal scrollbar at all. Header on two lines. Agenda, not grid. |
| 390 | iPhone 14/15 | Tap targets; event titles readable in full. |
| 430 | iPhone Pro Max | Still agenda — check the `md` switch does not fire early. |
| 768 | iPad portrait | The grid's first appearance. Bar titles should be legible, not `Vars…`. |
| 1024 | iPad landscape | `lg` two-column kicks in; the sticky sidebar should not overlap the footer. |
| 1280 | Laptop | Calendar at `max-w-6xl`; heading scale. |
| 1440 / 1920 | Desktop / monitor | Nothing should keep growing past `2xl`. Gutters, not stretch. |

Per page, with a real phone or `pointer: coarse` emulation on: `/`,
`/calendar`, `/calendar/$calendarId`, `/teams/$teamSlug`,
`/teams/$teamSlug/$pageSlug`, plus both 404s (`/nonsense` and
`/teams/$teamSlug/nonsense` — the second still renders the team chrome).

Two checks that are easy to forget:

1. **JavaScript off.** Disable it and confirm the month arrows still navigate,
   a bar still reveals its `:target` panel, and the header nav is still there.
   This is the property §4.1 and §5 were designed around; verify it rather than
   assuming it.
2. **A long-content team page.** If no page in the database has a table or a
   pasted URL, author one in the admin before testing §6, or the fix goes out
   unexercised.

`prefers-reduced-motion` is worth a look while you are in there — the only
animation on the site is the dialog's `data-open:animate-in`, which comes from
`packages/ui` and is out of scope, but confirm nothing new is added.

---

## 9. Order of work

| # | Step | Touches | Risk |
| --- | --- | --- | --- |
| 1 | `PageContainer`, `PageTitle`, `coarse` variant, `min-h-dvh` (§3) | 9 files, mechanical | None — replaces identical strings |
| 2 | Small fixes (§2.5): `wrap-anywhere`, arrow/button targets, calendar-row layout | 5 files | None |
| 3 | Prose overflow + scale (§6) | `styles.css`, `rich-content.tsx` | Low |
| 4 | Header strip (§5) | `site-header.tsx` | Low |
| 5 | **Calendar mobile view (§4.1)** — the agenda list | new `month-agenda.tsx`, `month-calendar.tsx` | Highest; the only step that adds a component rather than adjusting one |
| 6 | Grid scaling at `md`/`lg` (§4.2) + calendar pages go `wide` (§4.3) | `month-calendar.tsx`, 2 routes | Low |
| 7 | Two-column layouts at `lg` (§7) | 3 routes | Low |
| 8 | The matrix (§8) | — | — |

Steps 1–4 are safe to land as one commit and improve the phone experience on
their own. Step 5 is where the actual mobile calendar problem gets solved.

Two things to verify at step 5 specifically, beyond the matrix in §8: that a
`#event-<id>` link opens the right panel in *both* views (the anchors are shared
and it is the easiest thing to break), and that the agenda and the grid never
appear at once — a stray `md:` typo shows both and it is invisible at whichever
width you happen to be testing at.

No open questions. Every step above is a change to markup and classes in
`apps/website`; nothing here needs a new dependency, a schema change, or
anything from `apps/admin`.
