/**
 * The site's URLs, built in one place.
 *
 * Two things need them and have to agree exactly: the `rel="canonical"` link a
 * page emits about itself, and the `<loc>` the sitemap emits about that page. A
 * canonical that disagrees with the sitemap by one character is a page that
 * tells a crawler two different addresses for itself, which is worse than
 * having neither.
 *
 * Segments are `encodeURIComponent`d, matching what `Link` puts in an `href`
 * for the same param. Slugs are lowercase and dash-separated today, so this is
 * a no-op — it is here so that a team called `Girls & Boys` does not silently
 * produce a broken URL in the sitemap.
 */

export const HOME_PATH = '/';
export const CALENDAR_PATH = '/calendar';

export const teamPath = (teamSlug: string): string =>
	`/teams/${encodeURIComponent(teamSlug)}`;

export const teamPagePath = (teamSlug: string, pageSlug: string): string =>
	`${teamPath(teamSlug)}/${encodeURIComponent(pageSlug)}`;

export const calendarPath = (calendarId: string): string =>
	`${CALENDAR_PATH}/${encodeURIComponent(calendarId)}`;

/**
 * A calendar page's canonical address for a given month.
 *
 * The current month is `undefined`, not today's `YYYY-MM`: no `month` in the
 * URL is the canonical way to say "now" (see `month-search.ts`), and spelling
 * it out would make the same page reachable at two addresses and cacheable
 * twice at the edge.
 */
export const monthPath = (
	basePath: string,
	month: string | undefined,
): string => (month === undefined ? basePath : `${basePath}?month=${month}`);
