import { ELEMENT_NODE, type Node, parse, TEXT_NODE } from 'ultrahtml';
import { decodeEntities } from './sanitize-html';

/**
 * Turns authored page HTML into the one sentence that goes in a
 * `<meta name="description">`.
 *
 * A page's description should be the page's own words, not a template — a
 * search result reading "Team pages, schedules and the event calendar" under
 * every URL on the site tells a visitor nothing about which one to click. There
 * is no description column in the database and no field for one in the admin,
 * so the text has to come out of the content the editor already wrote.
 *
 * It runs on HTML that has already been through `sanitizeHtml`, in the route's
 * `head`, not in a server function: it derives nothing the client cannot see
 * anyway, and doing it at read time would put a second copy of every page's
 * opening paragraph on the wire.
 */

/**
 * The length Google truncates a description at is around 155–160 characters.
 * Going over is not an error, it just means the tail is never read, so this
 * cuts at a word boundary below the limit rather than shipping a sentence that
 * ends mid-word in the search result.
 */
export const DESCRIPTION_MAX_LENGTH = 155;

/**
 * Below this, the page's own words are not a summary and the site-wide default
 * is used instead.
 *
 * The case this exists for is real and is in the database today: the site home
 * content is the single heading `Morgan Wrestling`, which as a description
 * would repeat the `<title>` verbatim and tell a searcher nothing. A page whose
 * entire content is its own title has no summary to give, and saying so lets
 * `SITE_DESCRIPTION` — which at least describes the site — take over.
 *
 * The number is a judgement, not a standard: it is about the length of a short
 * clause, which is the shortest thing that can add information to a title.
 */
export const DESCRIPTION_MIN_LENGTH = 40;

/**
 * Tags whose boundary is a space in the reading. Without this,
 * `<p>Practice</p><p>Monday</p>` reads as `PracticeMonday` — the tags are the
 * only thing separating the words, and they are about to be thrown away.
 *
 * Inline marks (`strong`, `em`, `a`, `span`, …) are deliberately absent:
 * `<strong>pre</strong>season` is one word and has to stay one.
 */
const BLOCK_ELEMENTS: ReadonlySet<string> = new Set([
	'address',
	'blockquote',
	'br',
	'caption',
	'div',
	'dd',
	'dl',
	'dt',
	'figcaption',
	'figure',
	'h1',
	'h2',
	'h3',
	'h4',
	'h5',
	'h6',
	'hr',
	'li',
	'ol',
	'p',
	'pre',
	'table',
	'tbody',
	'td',
	'tfoot',
	'th',
	'thead',
	'tr',
	'ul',
]);

const collect = (node: Node, out: Array<string>): void => {
	if (node.type === TEXT_NODE) {
		out.push(decodeEntities(node.value));
		return;
	}

	const isBlock =
		node.type === ELEMENT_NODE && BLOCK_ELEMENTS.has(node.name.toLowerCase());

	if (isBlock) out.push(' ');
	for (const child of node.children ?? []) collect(child, out);
	if (isBlock) out.push(' ');
};

/** The visible words of some HTML, with runs of whitespace collapsed to one space. */
export const toPlainText = (html: string | null | undefined): string => {
	if (!html) return '';

	const out: Array<string> = [];
	collect(parse(html), out);

	return out.join('').replace(/\s+/g, ' ').trim();
};

/**
 * A page's `<meta name="description">`: the first
 * {@link DESCRIPTION_MAX_LENGTH} characters of its text, cut at a word
 * boundary — or `''` when the page has nothing worth summarising.
 *
 * `''` rather than a stand-in sentence: callers pass the result straight to
 * `seo({ description })`, and omitting the tag lets the site-wide default in
 * `__root.tsx` apply. A description invented from the page's own title would be
 * worse than a real one about the site.
 */
export const toDescription = (
	html: string | null | undefined,
	limit: number = DESCRIPTION_MAX_LENGTH,
): string => {
	const text = toPlainText(html);
	if (text.length < DESCRIPTION_MIN_LENGTH) return '';
	if (text.length <= limit) return text;

	// One character past the limit, so that a space sitting exactly on the
	// boundary is found and the whole of the last word is kept.
	const head = text.slice(0, limit + 1);
	const lastSpace = head.lastIndexOf(' ');
	// A single word longer than the limit has no boundary to cut on; a hard cut
	// is the only option left.
	const cut = lastSpace > 0 ? head.slice(0, lastSpace) : text.slice(0, limit);

	return `${cut.replace(/[\s,;:.!?-]+$/, '')}…`;
};
