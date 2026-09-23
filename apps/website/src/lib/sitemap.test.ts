import { describe, expect, it } from 'vitest';
import {
	CALENDAR_PATH,
	HOME_PATH,
	monthPath,
	teamPagePath,
	teamPath,
} from './paths';
import { SITE_ORIGIN } from './seo';
import { toSitemapXml } from './sitemap';

describe('paths', () => {
	it('builds the addresses the routes actually serve', () => {
		expect(teamPath('varsity-boys')).toBe('/teams/varsity-boys');
		expect(teamPagePath('varsity-boys', 'first-page')).toBe(
			'/teams/varsity-boys/first-page',
		);
	});

	it('encodes a segment that is not already URL-safe', () => {
		// Slugs are lowercase and dashed today, so this is insurance against a
		// team name that survives `normalized_name` with a special character.
		expect(teamPath('boys & girls')).toBe('/teams/boys%20%26%20girls');
	});

	it('leaves the current month out of the URL', () => {
		// `/calendar` and `/calendar?month=<this month>` would be one page at two
		// addresses, cached twice at the edge.
		expect(monthPath(CALENDAR_PATH, undefined)).toBe('/calendar');
		expect(monthPath(CALENDAR_PATH, '2026-12')).toBe('/calendar?month=2026-12');
	});
});

describe('toSitemapXml', () => {
	it('wraps each path as an absolute loc', () => {
		const xml = toSitemapXml([HOME_PATH, '/teams/varsity-boys']);

		expect(xml).toContain(`<loc>${SITE_ORIGIN}/</loc>`);
		expect(xml).toContain(`<loc>${SITE_ORIGIN}/teams/varsity-boys</loc>`);
	});

	it('is a well-formed urlset with the right namespace', () => {
		const xml = toSitemapXml([HOME_PATH]);

		expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>\n')).toBe(
			true,
		);
		expect(xml).toContain(
			'<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
		);
		expect(xml.trimEnd().endsWith('</urlset>')).toBe(true);
	});

	it('escapes the characters the sitemap spec requires', () => {
		// A raw `&` in a loc makes the whole document unparseable, and a crawler
		// that cannot parse it reads none of it.
		expect(toSitemapXml(['/teams/a&b'])).toContain(
			`<loc>${SITE_ORIGIN}/teams/a&amp;b</loc>`,
		);
	});

	it('states no lastmod, changefreq or priority', () => {
		// Deliberate — `teams` and `settings` have no timestamp to tell the truth
		// with. See the note in sitemap.ts.
		const xml = toSitemapXml([HOME_PATH, '/teams/varsity-boys']);

		expect(xml).not.toContain('lastmod');
		expect(xml).not.toContain('changefreq');
		expect(xml).not.toContain('priority');
	});
});
