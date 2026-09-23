import { describe, expect, it } from 'vitest';
import { toSlug } from './slug';

describe('toSlug', () => {
	it('matches the admin rule for the names it also writes', () => {
		// `apps/admin/src/lib/team-fns.ts`: lowercase, whitespace runs to dashes.
		expect(toSlug('Varsity')).toBe('varsity');
		expect(toSlug('Junior High')).toBe('junior-high');
	});

	it('collapses a run of whitespace into one dash', () => {
		expect(toSlug('Junior  High')).toBe('junior-high');
		expect(toSlug('Junior\tHigh')).toBe('junior-high');
		expect(toSlug('Junior\nHigh')).toBe('junior-high');
	});

	it('trims, so a padded title is still a clean segment', () => {
		expect(toSlug('  Schedule  ')).toBe('schedule');
	});

	it('is idempotent, so a slug it produced round-trips', () => {
		// The URL in the nav is `toSlug(title)`, and resolution compares the
		// incoming segment against `toSlug(title)` again.
		expect(toSlug(toSlug('Junior  High'))).toBe('junior-high');
	});

	it('returns an empty slug for a title with no words in it', () => {
		// The caller drops these: an empty string cannot be a path segment.
		expect(toSlug('   ')).toBe('');
		expect(toSlug('')).toBe('');
	});
});
