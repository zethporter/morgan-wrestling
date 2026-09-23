import { describe, expect, it } from 'vitest';
import {
	absoluteUrl,
	isNotFoundRender,
	rootSeo,
	SITE_ORIGIN,
	seo,
} from './seo';

/** The `content` of the first meta tag carrying this `name` or `property`. */
const content = (
	tags: ReturnType<typeof seo>['meta'],
	attribute: string,
): unknown =>
	tags.find((tag) => tag?.name === attribute || tag?.property === attribute)
		?.content;

const titles = (tags: ReturnType<typeof seo>['meta']) =>
	tags.filter((tag) => tag?.title !== undefined).map((tag) => tag?.title);

describe('seo', () => {
	it('emits nothing for what it is not given', () => {
		// The property the nesting depends on: `/teams/$teamSlug/` passes only a
		// path, and must not overwrite the team layout's title and description
		// with generic ones.
		const { meta, links } = seo({ path: '/teams/varsity' });

		expect(titles(meta)).toEqual([]);
		expect(content(meta, 'description')).toBeUndefined();
		expect(content(meta, 'og:title')).toBeUndefined();
		expect(links).toHaveLength(1);
	});

	it('emits one canonical link and an og:url for a path', () => {
		const { meta, links } = seo({ path: '/teams/varsity' });

		expect(links).toEqual([
			{ rel: 'canonical', href: `${SITE_ORIGIN}/teams/varsity` },
		]);
		expect(content(meta, 'og:url')).toBe(`${SITE_ORIGIN}/teams/varsity`);
	});

	it('emits no canonical at all without a path', () => {
		// What keeps a 404 and a layout route from claiming a canonical URL.
		expect(seo({ title: 'Page not found' }).links).toEqual([]);
	});

	it('suffixes the title with the site name', () => {
		expect(titles(seo({ title: 'Varsity Boys' }).meta)).toEqual([
			'Varsity Boys | Morgan Wrestling',
		]);
	});

	it('mirrors the title and description into og and twitter', () => {
		const { meta } = seo({ title: 'Varsity Boys', description: 'Weigh-ins.' });

		expect(content(meta, 'og:title')).toBe('Varsity Boys | Morgan Wrestling');
		expect(content(meta, 'twitter:title')).toBe(
			'Varsity Boys | Morgan Wrestling',
		);
		expect(content(meta, 'og:description')).toBe('Weigh-ins.');
		expect(content(meta, 'twitter:description')).toBe('Weigh-ins.');
	});

	it('leaves the link out of the index but not the crawl on noindex', () => {
		expect(content(seo({ noindex: true }).meta, 'robots')).toBe(
			'noindex, follow',
		);
		expect(content(seo({}).meta, 'robots')).toBeUndefined();
	});
});

describe('rootSeo', () => {
	it('names the site, not a page, and claims no canonical', () => {
		const { meta, links } = rootSeo();

		expect(titles(meta)).toEqual(['Morgan Wrestling']);
		expect(content(meta, 'og:site_name')).toBe('Morgan Wrestling');
		expect(content(meta, 'description')).toContain('Morgan Wrestling');
		expect(links.some((link) => link?.rel === 'canonical')).toBe(false);
	});

	it('uses a square card type to match the square icon it points at', () => {
		const { meta } = rootSeo();

		expect(content(meta, 'twitter:card')).toBe('summary');
		expect(content(meta, 'og:image')).toBe(`${SITE_ORIGIN}/icon-512.png`);
	});

	it('links every icon that public/ actually contains', () => {
		const hrefs = rootSeo().links.map((link) => link?.href);

		expect(hrefs).toEqual(
			expect.arrayContaining([
				'/favicon.svg',
				'/favicon.ico',
				'/apple-touch-icon.png',
				'/site.webmanifest',
			]),
		);
	});
});

describe('absoluteUrl', () => {
	it('hangs a root-relative path off the one origin', () => {
		expect(absoluteUrl('/')).toBe('https://morganwrestling.org/');
		expect(absoluteUrl('/calendar?month=2026-12')).toBe(
			'https://morganwrestling.org/calendar?month=2026-12',
		);
	});
});

describe('isNotFoundRender', () => {
	it('is true for a leaf that 404d', () => {
		expect(
			isNotFoundRender([{ status: 'success' }, { status: 'notFound' }]),
		).toBe(true);
	});

	it('is true for a parent that threw notFound before its children resolved', () => {
		// The team layout's case: `_notFound` is set on the match that threw.
		expect(
			isNotFoundRender([
				{ status: 'success' },
				{ status: 'success', _notFound: true },
			]),
		).toBe(true);
	});

	it('is false for an ordinary render', () => {
		expect(
			isNotFoundRender([{ status: 'success' }, { status: 'success' }]),
		).toBe(false);
	});
});
