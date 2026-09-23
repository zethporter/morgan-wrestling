import { absoluteUrl } from './seo';

/**
 * The `sitemap.xml` body, built from a list of root-relative paths.
 *
 * ## There is no `<lastmod>`
 *
 * `team_pages` has an `updated_at`, and `teams` and `settings` do not — so the
 * home page and every team home could carry no date while their sub-pages
 * carried a real one. A sitemap where some entries claim a modification time
 * and others stay silent is read as "the silent ones never change", which is
 * false for exactly the two most-edited pages on the site. Saying nothing at
 * all is the honest version, and crawlers fall back to their own scheduling.
 *
 * `<changefreq>` and `<priority>` are omitted too: Google has ignored both for
 * years, and inventing values nothing reads is a way to be wrong later.
 */

/** The five characters the sitemap spec requires escaping inside a `<loc>`. */
const escapeXml = (value: string): string =>
	value
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&apos;');

export const toSitemapXml = (paths: ReadonlyArray<string>): string => {
	const urls = paths
		.map((path) => `\t<url><loc>${escapeXml(absoluteUrl(path))}</loc></url>`)
		.join('\n');

	return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;
};
