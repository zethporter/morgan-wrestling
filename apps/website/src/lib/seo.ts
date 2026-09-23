import { env } from '#/env';

/**
 * Everything the document head needs that is not the page's own words.
 *
 * ## Why the origin is a constant
 *
 * Absolute URLs are unavoidable here — `og:url`, `rel="canonical"` and the
 * sitemap's `<loc>` all have to be absolute — and the origin is the same fact
 * `wrangler.jsonc` already states in its `routes`: the apex is canonical and is
 * the only origin, because `workers_dev` is off and `www` 301s to it. That is a
 * property of the deployment, not a per-environment secret, so it is written
 * here rather than becoming the third line in `.env` that §11 of the README
 * warns about. It follows `CALENDAR_ICS_ORIGIN` in `calendar-fns.ts`, which is
 * hard-coded for the same reason.
 *
 * The visible consequence is that a dev server advertises the production URL in
 * its meta tags, which is correct: a canonical pointing at `localhost:3001`
 * would be worse than one pointing at the real page.
 */
export const SITE_ORIGIN = 'https://morganwrestling.org';

/** What the site is, for a search result or a link preview with no better text. */
export const SITE_DESCRIPTION =
	'Team pages, schedules and the event calendar for Morgan Wrestling.';

/**
 * The link-preview image. There is no designed social card, so this is the app
 * icon — a square mark, which is why the Twitter card type is `summary` (a
 * small square thumbnail) and not `summary_large_image` (a 2:1 banner that
 * would letterbox it).
 */
const OG_IMAGE_PATH = '/icon-512.png';

export const absoluteUrl = (path: string): string => `${SITE_ORIGIN}${path}`;

type MetaTag = React.JSX.IntrinsicElements['meta'];
type LinkTag = React.JSX.IntrinsicElements['link'];

export type SeoOptions = {
	/** Page name, suffixed with the site title. Omit on the home page. */
	title?: string;
	/** One sentence. Omit to inherit — see the note on emitting nothing below. */
	description?: string;
	/** Root-relative, from `paths.ts`. Emits `canonical` and `og:url`. */
	path?: string;
	/** Keep the page out of search results. */
	noindex?: boolean;
};

export const pageTitle = (title?: string): string =>
	title ? `${title} | ${env.VITE_APP_TITLE}` : env.VITE_APP_TITLE;

/**
 * The head tags for one page.
 *
 * **It emits only what it is given.** `HeadContent` dedupes `meta` by
 * `name`/`property` with the deepest match winning, so a nested route that
 * filled in defaults would overwrite its parent's real values with them — the
 * team layout sets the title and description, and `/teams/$teamSlug/` below it
 * only wants to add a canonical. The site-wide defaults are in `__root.tsx`,
 * once, where nothing is nested under them yet.
 *
 * `links` are **not** deduped by `rel` — they are concatenated across matches —
 * so a `path` belongs only to a leaf route. Two routes in one tree passing one
 * would emit two `rel="canonical"` links and the page would name two canonical
 * addresses, which is the same as naming none.
 */
export const seo = ({ title, description, path, noindex }: SeoOptions = {}) => {
	const meta: Array<MetaTag> = [];
	const links: Array<LinkTag> = [];

	if (title !== undefined) {
		const full = pageTitle(title);
		meta.push(
			{ title: full },
			{ property: 'og:title', content: full },
			{ name: 'twitter:title', content: full },
		);
	}

	if (description !== undefined) {
		meta.push(
			{ name: 'description', content: description },
			{ property: 'og:description', content: description },
			{ name: 'twitter:description', content: description },
		);
	}

	if (path !== undefined) {
		const href = absoluteUrl(path);
		meta.push({ property: 'og:url', content: href });
		links.push({ rel: 'canonical', href });
	}

	// `follow` rather than a bare `noindex`: the page should stay out of the
	// index, but the header nav on it is still the way out to pages that belong
	// in the index.
	if (noindex) meta.push({ name: 'robots', content: 'noindex, follow' });

	return { meta, links };
};

/**
 * The tags every page carries, for `__root.tsx`. Split out from {@link seo} so
 * that the one route allowed to state a default is the one route with no parent
 * to overwrite.
 */
export const rootSeo = () => {
	const { meta, links } = seo({ description: SITE_DESCRIPTION });

	return {
		meta: [
			{ charSet: 'utf-8' },
			{ name: 'viewport', content: 'width=device-width, initial-scale=1' },
			{ title: env.VITE_APP_TITLE },
			...meta,
			{ property: 'og:title', content: env.VITE_APP_TITLE },
			{ name: 'twitter:title', content: env.VITE_APP_TITLE },
			{ property: 'og:site_name', content: env.VITE_APP_TITLE },
			{ property: 'og:type', content: 'website' },
			{ property: 'og:locale', content: 'en_US' },
			{ property: 'og:image', content: absoluteUrl(OG_IMAGE_PATH) },
			{ name: 'twitter:card', content: 'summary' },
			{ name: 'twitter:image', content: absoluteUrl(OG_IMAGE_PATH) },
			// One value, not a light/dark pair: `HeadContent` dedupes meta by
			// `name`, so a second `theme-color` differing only by `media` would
			// be dropped. The brand maroon reads as deliberate against either
			// browser chrome, which a background colour would not.
			{ name: 'theme-color', content: '#712626' },
		],
		links: [
			...links,
			// An SVG favicon scales to every tab and dock size; the .ico is the
			// fallback for browsers that do not take one.
			{ rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' },
			{ rel: 'icon', href: '/favicon.ico', sizes: '32x32' },
			{ rel: 'apple-touch-icon', href: '/apple-touch-icon.png' },
			{ rel: 'manifest', href: '/site.webmanifest' },
		],
	};
};

/**
 * Whether the page being rendered is a 404.
 *
 * The root route decides two things from this — whether to `noindex` the
 * response and how long the edge may hold it — and a route match carries the
 * answer by the time `head` and `headers` run. It is a `some` over the whole
 * match array rather than a look at the leaf, because a `notFound()` thrown
 * from a parent loader (the team layout does exactly that) stops the child
 * matches from resolving at all.
 */
export const isNotFoundRender = (
	matches: ReadonlyArray<{ status: string; _notFound?: boolean }>,
): boolean =>
	matches.some(
		(match) => match.status === 'notFound' || match._notFound === true,
	);
