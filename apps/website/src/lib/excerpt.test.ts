import { describe, expect, it } from 'vitest';
import { DESCRIPTION_MAX_LENGTH, toDescription, toPlainText } from './excerpt';
import { sanitizeHtml } from './sanitize-html';

describe('toPlainText', () => {
	it('keeps the words and drops the tags', () => {
		expect(toPlainText('<p>Practice is at <strong>six</strong>.</p>')).toBe(
			'Practice is at six.',
		);
	});

	it('separates block elements, so two paragraphs are two words', () => {
		expect(toPlainText('<p>Practice</p><p>Monday</p>')).toBe('Practice Monday');
		expect(toPlainText('<ul><li>One</li><li>Two</li></ul>')).toBe('One Two');
		expect(toPlainText('Line<br>Break')).toBe('Line Break');
	});

	it('does not separate inline marks, so one word stays one word', () => {
		// The opposite bug to the one above, and the reason the block list is a
		// list rather than "every element".
		expect(toPlainText('<p><strong>pre</strong>season</p>')).toBe('preseason');
		expect(toPlainText('<p>a <a href="https://a.test">link</a>!</p>')).toBe(
			'a link!',
		);
	});

	it('collapses whitespace runs and trims', () => {
		expect(toPlainText('<p>  spaced\n\tout  </p>')).toBe('spaced out');
	});

	it('decodes entities, so the description reads as the author wrote it', () => {
		expect(toPlainText('<p>Boys &amp; Girls &#8212; 2026</p>')).toBe(
			'Boys & Girls — 2026',
		);
	});

	it('is empty for empty input', () => {
		expect(toPlainText('')).toBe('');
		expect(toPlainText(null)).toBe('');
		expect(toPlainText(undefined)).toBe('');
		expect(toPlainText('<p></p>')).toBe('');
	});

	it('reads real editor output the way the page renders it', () => {
		// Tiptap HTML carries Tailwind utilities in `class`; they are styling,
		// not words, and must not end up in the description.
		const html = sanitizeHtml(
			'<h1 class="text-4xl font-bold">Varsity Boys</h1>' +
				'<p class="leading-7">Weigh-ins start at <em>5:30</em>.</p>',
		);

		expect(toPlainText(html)).toBe('Varsity Boys Weigh-ins start at 5:30.');
	});
});

describe('toDescription', () => {
	/** Long enough to clear DESCRIPTION_MIN_LENGTH, short enough not to be cut. */
	const SENTENCE = 'Practice is at six on Tuesday in the upper gym.';

	it('returns a whole short sentence unchanged, with no ellipsis', () => {
		expect(toDescription(`<p>${SENTENCE}</p>`)).toBe(SENTENCE);
	});

	it('cuts at a word boundary under the limit', () => {
		const html = `<p>${'word '.repeat(60).trim()}</p>`;
		const description = toDescription(html);

		expect(description.length).toBeLessThanOrEqual(DESCRIPTION_MAX_LENGTH + 1);
		expect(description.endsWith('…')).toBe(true);
		// The tail is a whole word, not `wo…`.
		expect(description.slice(0, -1).endsWith('word')).toBe(true);
	});

	it('does not leave a dangling space or comma before the ellipsis', () => {
		expect(toDescription(`<p>${SENTENCE}</p>`, 12)).toBe('Practice is…');
		expect(
			toDescription('<p>One, two, three, four, five, six, seven.</p>', 4),
		).toBe('One…');
	});

	it('hard-cuts a single word longer than the limit', () => {
		// No boundary to cut on, so the alternative is returning nothing.
		expect(toDescription(`<p>${'a'.repeat(60)}</p>`, 10)).toBe('aaaaaaaaaa…');
	});

	it('is empty for a page with no content, so the site default applies', () => {
		expect(toDescription('')).toBe('');
		expect(toDescription(null)).toBe('');
		expect(toDescription('<p>   </p>')).toBe('');
	});

	it('is empty for a page whose content is only its own title', () => {
		// The site home content in the database today. A description repeating
		// the `<title>` word for word is worse than the site-wide default, so
		// this refuses to be one. See DESCRIPTION_MIN_LENGTH.
		expect(toDescription('<h1>Morgan Wrestling</h1>')).toBe('');
		expect(toPlainText('<h1>Morgan Wrestling</h1>')).toBe('Morgan Wrestling');
	});
});
