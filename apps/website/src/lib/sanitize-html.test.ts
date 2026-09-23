import { describe, expect, it } from 'vitest';
import { safeUrl, sanitizeHtml } from './sanitize-html';

describe('sanitizeHtml', () => {
	it('passes through the markup the editor actually emits', () => {
		const html =
			'<h2 class="text-3xl font-bold" style="text-align: center">Schedule</h2>' +
			'<p class="text-md w-full">Practice is <strong class="font-bold">daily</strong>.</p>' +
			'<ul class="list-disc pl-6"><li><p>Bring a singlet</p></li></ul>' +
			'<mark data-color="amber" class="px-1 rounded-sm bg-amber-200">note</mark>' +
			'<a class="text-blue-500" href="/teams/varsity" target="_blank" rel="noopener noreferrer nofollow">Varsity</a>';

		expect(sanitizeHtml(html)).toBe(html);
	});

	it('is empty for empty input', () => {
		expect(sanitizeHtml(null)).toBe('');
		expect(sanitizeHtml(undefined)).toBe('');
		expect(sanitizeHtml('')).toBe('');
	});

	it('drops script subtrees but keeps their siblings', () => {
		expect(sanitizeHtml('<p>a</p><script>alert(1)</script><p>b</p>')).toBe(
			'<p>a</p><p>b</p>',
		);
	});

	it.each([
		['iframe', '<iframe src="https://evil.test"></iframe>'],
		['style', '<style>p{display:none}</style>'],
		['svg', '<svg><animate onbegin="alert(1)"></animate></svg>'],
		['form', '<form action="https://evil.test"><input name="a"></form>'],
	])('drops the whole %s subtree', (_name, html) => {
		expect(sanitizeHtml(`<p>keep</p>${html}`)).toBe('<p>keep</p>');
	});

	it('unwraps unknown elements rather than losing their text', () => {
		expect(
			sanitizeHtml('<div><section>hello <em>there</em></section></div>'),
		).toBe('hello <em>there</em>');
	});

	it('drops event handler attributes', () => {
		expect(sanitizeHtml('<p onclick="alert(1)" class="a">hi</p>')).toBe(
			'<p class="a">hi</p>',
		);
		expect(sanitizeHtml('<img src="/a.png" onerror="alert(1)">')).toBe(
			'<img src="/a.png">',
		);
	});

	it('drops attributes that are not allowlisted for the tag', () => {
		expect(sanitizeHtml('<p id="x" data-foo="y">hi</p>')).toBe('<p>hi</p>');
		// `title` is allowed on <a>, not on <p>.
		expect(
			sanitizeHtml('<p title="x">hi</p><a href="/a" title="y">z</a>'),
		).toBe('<p>hi</p><a href="/a" title="y">z</a>');
	});

	it('closes the quote-breakout that ultrahtml’s own renderer leaves open', () => {
		// Single-quoted source, so the value really does contain a `"`. Rendered
		// without escaping this becomes a live onmouseover handler.
		const out = sanitizeHtml(
			`<a href='/a' title='x" onmouseover="alert(1)'>z</a>`,
		);
		expect(out).toBe(
			'<a href="/a" title="x&quot; onmouseover=&quot;alert(1)">z</a>',
		);
		expect(out).not.toMatch(/onmouseover="/);
	});

	it.each([
		'javascript:alert(1)',
		'JaVaScRiPt:alert(1)',
		' javascript:alert(1)',
		'java\tscript:alert(1)',
		'&#106;avascript:alert(1)',
		'&#x6a;avascript:alert(1)',
		'data:text/html;base64,PHNjcmlwdD4=',
		'vbscript:msgbox(1)',
	])('drops href %s', (href) => {
		const out = sanitizeHtml(`<a href="${href}">x</a>`);
		expect(out).toBe('<a>x</a>');
	});

	it.each([
		'https://morganwrestling.org/x',
		'http://example.test',
		'/teams/varsity',
		'#roster',
		'mailto:coach@example.test',
		'tel:+15555550123',
	])('keeps href %s', (href) => {
		expect(sanitizeHtml(`<a href="${href}">x</a>`)).toContain(`href="${href}"`);
	});

	it('keeps query strings intact through decode and re-escape', () => {
		expect(sanitizeHtml('<a href="https://a.test/?x=1&amp;y=2">x</a>')).toBe(
			'<a href="https://a.test/?x=1&amp;y=2">x</a>',
		);
	});

	it('narrows style to the alignment the editor emits', () => {
		expect(sanitizeHtml('<p style="text-align: right">x</p>')).toBe(
			'<p style="text-align: right">x</p>',
		);
		expect(
			sanitizeHtml(
				'<p style="position: fixed; inset: 0; text-align: left">x</p>',
			),
		).toBe('<p style="text-align: left">x</p>');
		expect(sanitizeHtml('<p style="position: fixed">x</p>')).toBe('<p>x</p>');
		expect(
			sanitizeHtml('<p style="background: url(javascript:alert(1))">x</p>'),
		).toBe('<p>x</p>');
	});

	it('adds rel to a target=_blank link that is missing one', () => {
		expect(sanitizeHtml('<a href="https://a.test" target="_blank">x</a>')).toBe(
			'<a href="https://a.test" target="_blank" rel="noopener noreferrer">x</a>',
		);
	});

	it('normalizes uppercase tags and attributes instead of dropping them', () => {
		expect(sanitizeHtml('<P CLASS="x">hi</P>')).toBe('<p class="x">hi</p>');
	});

	it('closes tags the author left open', () => {
		expect(sanitizeHtml('<p>a <strong>b')).toBe('<p>a <strong>b</strong></p>');
	});

	it('leaves encoded text encoded', () => {
		expect(sanitizeHtml('<p>a &amp; b &lt;c&gt;</p>')).toBe(
			'<p>a &amp; b &lt;c&gt;</p>',
		);
	});

	it('does not emit a closing tag for void elements', () => {
		expect(sanitizeHtml('<p>a<br>b</p><hr>')).toBe('<p>a<br>b</p><hr>');
	});
});

describe('safeUrl', () => {
	it('returns null for an unsafe scheme', () => {
		expect(safeUrl('javascript:alert(1)')).toBeNull();
	});

	it('returns the decoded url for a safe one', () => {
		expect(safeUrl('https://a.test/?x=1&amp;y=2')).toBe(
			'https://a.test/?x=1&y=2',
		);
	});

	it('treats a scheme-less value as relative', () => {
		expect(safeUrl('/teams/varsity')).toBe('/teams/varsity');
	});
});
