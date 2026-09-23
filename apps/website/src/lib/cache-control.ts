/**
 * What the Cloudflare edge is allowed to do with a response.
 *
 * Every page here is the same for every visitor — no auth, no cookies, no
 * per-request anything — so the HTML itself is cacheable, which is the whole
 * reason this app is worth putting on a CDN.
 *
 * ## There is no invalidation
 *
 * `caches.default.delete()` only purges the colo that runs it, so the admin app
 * cannot bust this site's edge cache after an edit — the same constraint
 * `apps/calendar/src/index.ts` documents. The TTL *is* the freshness story,
 * which is why it is five minutes and not an hour: it is the longest an editor
 * should have to wait to see their change, not the longest the cache could
 * usefully hold.
 *
 * `max-age=0` keeps the browser out of it. A visitor pressing back should not
 * be looking at a five-minute-old schedule from their own disk, and the round
 * trip they pay instead is a cache hit at the nearest colo.
 *
 * Note that none of this does anything on `*.workers.dev` — the edge cache is a
 * no-op there — so verifying it needs the custom domain.
 */
export const DOCUMENT_CACHE_CONTROL =
	'public, max-age=0, s-maxage=300, stale-while-revalidate=3600';

/**
 * A 404 gets a much shorter leash and no `stale-while-revalidate`.
 *
 * The page that is missing right now is usually a page someone is in the middle
 * of publishing, and an hour of stale 404s served from the edge would outlast
 * the editor's patience by a distance. A minute is still enough to absorb a
 * crawler working through a list of dead URLs, which is the only reason to
 * cache a 404 at all.
 */
export const NOT_FOUND_CACHE_CONTROL = 'public, max-age=0, s-maxage=60';

/**
 * `robots.txt` and `sitemap.xml`. Only crawlers read them and no crawler is in
 * a hurry, so the edge can hold them for an hour and serve a stale copy for a
 * day while it refreshes.
 */
export const CRAWLER_FILE_CACHE_CONTROL =
	'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400';
