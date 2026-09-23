import { describe, expect, it } from 'vitest';
import { toQuickLinkHref } from './quick-links';

describe('toQuickLinkHref', () => {
	it('adds a scheme to the bare hostnames editors type', () => {
		// The shape of the row in the database today.
		expect(toQuickLinkHref('trackwrestling.com')).toBe(
			'https://trackwrestling.com',
		);
		expect(toQuickLinkHref('example.test/teams?a=1')).toBe(
			'https://example.test/teams?a=1',
		);
	});

	it('leaves an absolute url alone', () => {
		expect(toQuickLinkHref('https://a.test/x')).toBe('https://a.test/x');
		expect(toQuickLinkHref('http://a.test')).toBe('http://a.test');
		expect(toQuickLinkHref('mailto:coach@a.test')).toBe('mailto:coach@a.test');
	});

	it('leaves a rooted path alone', () => {
		expect(toQuickLinkHref('/teams/varsity')).toBe('/teams/varsity');
		expect(toQuickLinkHref('#roster')).toBe('#roster');
		expect(toQuickLinkHref('//a.test/x')).toBe('//a.test/x');
	});

	it('trims surrounding whitespace', () => {
		expect(toQuickLinkHref('  a.test  ')).toBe('https://a.test');
	});

	it('rejects an unsafe scheme', () => {
		expect(toQuickLinkHref('javascript:alert(1)')).toBeNull();
		expect(toQuickLinkHref('data:text/html,<script>')).toBeNull();
	});

	it('rejects an empty value', () => {
		expect(toQuickLinkHref('')).toBeNull();
		expect(toQuickLinkHref('   ')).toBeNull();
	});
});
