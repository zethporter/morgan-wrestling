import { ELEMENT_NODE, type Node, parse, TEXT_NODE } from 'ultrahtml';

/**
 * Turns the Tiptap HTML stored by the admin app into HTML that is safe to hand
 * to `dangerouslySetInnerHTML`.
 *
 * The authors are trusted admins, so this is defence in depth rather than a
 * live threat — but the site is anonymous and edge cached, so one bad paste
 * would be served to every visitor until the TTL expires.
 *
 * ## Why not `ultrahtml/transformers/sanitize`
 *
 * `ultrahtml` has the parser we want (dependency-free, no DOM, runs on
 * Workers), but its bundled sanitize transformer is not a boundary. Probed
 * against 1.7.0 with `allowElements: ['p','a']`, `allowAttributes: { href:
 * ['a'] }`:
 *
 * | Input | Output |
 * | --- | --- |
 * | `<p onclick="alert(1)">hi</p>` | unchanged — `allowAttributes` only *keeps* listed attributes, it never drops unlisted ones |
 * | `<a href="javascript:alert(1)">` | unchanged — no scheme check |
 * | `<p title='a" onmouseover="alert(1)'>` | `<p title="a" onmouseover="alert(1)">` — `attrsToString` interpolates values without escaping `"` |
 * | `<P CLASS="X">` | dropped whole — names are matched case-sensitively |
 *
 * So we keep `parse` and walk the tree ourselves: elements and attributes are
 * allowed by name or dropped, URLs are scheme-checked after entity decoding,
 * and serialization escapes what it emits.
 */

/** Attributes any allowed element may carry. */
const GLOBAL_ATTRIBUTES: readonly string[] = ['class'];

/**
 * Every tag the editor can emit, mapped to the attributes it may keep on top
 * of {@link GLOBAL_ATTRIBUTES}. Anything absent here is unwrapped (see
 * {@link DROPPED_SUBTREES}), so adding a Tiptap extension in `packages/ui`
 * means adding its tags here or its output renders as bare text.
 *
 * `class` is allowed everywhere because the editor's styling *is* class
 * attributes — `packages/ui/.../extensions/headings.ts` and friends put
 * Tailwind utilities in the stored HTML, and the styles package `@source`s
 * `packages/ui/src`, so those utilities are in this app's bundle too.
 */
const ALLOWED_ELEMENTS: Record<string, readonly string[]> = {
	// StarterKit blocks. `style` is for TextAlign, narrowed by sanitizeStyle.
	p: ['style'],
	h1: ['style'],
	h2: ['style'],
	h3: ['style'],
	h4: ['style'],
	h5: ['style'],
	h6: ['style'],
	blockquote: [],
	pre: [],
	code: [],
	ul: [],
	ol: ['start', 'type'],
	li: [],
	hr: [],
	br: [],
	span: [],
	// Marks.
	strong: [],
	em: [],
	s: [],
	u: [],
	mark: ['data-color'],
	sub: [],
	sup: [],
	a: ['href', 'target', 'rel', 'title'],
	img: ['src', 'alt', 'title', 'width', 'height'],
	// Tables. The extension exists in packages/ui but is not registered in the
	// editor today, so this is here so that enabling it does not silently blank
	// out already-authored pages.
	table: [],
	thead: [],
	tbody: [],
	tfoot: [],
	caption: [],
	tr: [],
	th: ['colspan', 'rowspan', 'colwidth', 'scope'],
	td: ['colspan', 'rowspan', 'colwidth'],
};

/**
 * Disallowed elements are normally *unwrapped* — a stray `<div>` should not
 * take its paragraphs with it. These are the ones where the children are the
 * payload, so the whole subtree goes.
 */
const DROPPED_SUBTREES: ReadonlySet<string> = new Set([
	'applet',
	'audio',
	'base',
	'button',
	'canvas',
	'embed',
	'form',
	'frame',
	'frameset',
	'head',
	'iframe',
	'input',
	'link',
	'math',
	'meta',
	'noscript',
	'object',
	'portal',
	'script',
	'select',
	'style',
	'svg',
	'template',
	'textarea',
	'video',
]);

/** Attributes whose value is a URL, and therefore needs a scheme check. */
const URL_ATTRIBUTES: ReadonlySet<string> = new Set(['href', 'src']);

const SAFE_SCHEMES: ReadonlySet<string> = new Set([
	'http',
	'https',
	'mailto',
	'tel',
]);

/** The only declarations `style` may carry — i.e. exactly what TextAlign emits. */
const ALLOWED_STYLE_DECLARATIONS: Record<string, RegExp> = {
	'text-align': /^(left|right|center|justify)$/,
};

const NAMED_ENTITIES: Record<string, string> = {
	amp: '&',
	apos: "'",
	gt: '>',
	lt: '<',
	nbsp: String.fromCharCode(0xa0),
	quot: '"',
};

/**
 * One decoding pass, matching what a browser does to an attribute value. It
 * only has to be right enough to see through `&#106;avascript:` before
 * {@link safeUrl} looks at the scheme; unknown entities are left alone.
 *
 * Exported for `excerpt.ts`, which turns the same authored HTML into the plain
 * text of a meta description and needs `&amp;` to come back as `&`. One entity
 * table, so the two cannot disagree about what a string says.
 */
export const decodeEntities = (value: string) =>
	value.replace(/&(#x[0-9a-f]+|#[0-9]+|[a-z]+);?/gi, (match, body: string) => {
		if (body.startsWith('#')) {
			const hex = body[1] === 'x' || body[1] === 'X';
			const code = Number.parseInt(
				hex ? body.slice(2) : body.slice(1),
				hex ? 16 : 10,
			);
			if (!Number.isFinite(code) || code <= 0 || code > 0x10ffff) return '';
			return String.fromCodePoint(code);
		}
		return NAMED_ENTITIES[body.toLowerCase()] ?? match;
	});

/**
 * Drops the whitespace and control characters a browser ignores when working
 * out a URL's protocol, so that `java\tscript:` is tested as `javascript:`.
 * A filter rather than a regex: a character class spanning control characters
 * is a lint error, and suppressing it reads worse than this does.
 */
const stripBlankAndControl = (value: string) =>
	[...value]
		.filter((char) => {
			const code = char.charCodeAt(0);
			return code > 0x20 && code !== 0x7f;
		})
		.join('');

/**
 * The decoded URL if it is safe to put in an `href`/`src`, otherwise `null`.
 *
 * Relative URLs and fragments pass; an explicit scheme has to be in
 * {@link SAFE_SCHEMES}. The scheme test runs against a copy with whitespace and
 * control characters removed, because the browser strips those before it picks
 * a protocol (`java\tscript:` is `javascript:` by the time it matters) — but
 * the value we hand back keeps them, since anything the stripped copy proves
 * safe is safe in full.
 */
export const safeUrl = (raw: string): string | null => {
	const decoded = decodeEntities(raw);
	const collapsed = stripBlankAndControl(decoded);
	const scheme = /^([a-z][a-z0-9+.-]*):/i.exec(collapsed);
	if (scheme && !SAFE_SCHEMES.has(scheme[1].toLowerCase())) return null;
	return decoded;
};

/** Escapes a value we decoded ourselves, so every `&` in it is literal. */
const escapeDecoded = (value: string) =>
	value
		.replace(/&/g, '&amp;')
		.replace(/"/g, '&quot;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;');

/**
 * Escapes a value we are passing through verbatim. Only `"` needs touching:
 * the value is source text, so the entities in it are already encoded, and
 * re-escaping `&` would turn a stored `&amp;` into a visible `&amp;amp;`.
 */
const escapePassthrough = (value: string) => value.replace(/"/g, '&quot;');

const sanitizeStyle = (raw: string): string | null => {
	const kept = decodeEntities(raw)
		.split(';')
		.map((declaration) => {
			const separator = declaration.indexOf(':');
			if (separator < 0) return null;
			const property = declaration.slice(0, separator).trim().toLowerCase();
			const value = declaration
				.slice(separator + 1)
				.trim()
				.toLowerCase();
			return ALLOWED_STYLE_DECLARATIONS[property]?.test(value)
				? `${property}: ${value}`
				: null;
		})
		.filter((declaration) => declaration !== null);

	return kept.length > 0 ? kept.join('; ') : null;
};

const VOID_ELEMENTS: ReadonlySet<string> = new Set(['br', 'hr', 'img']);

const sanitizeAttributes = (
	name: string,
	attributes: Record<string, string>,
): string => {
	const allowed = ALLOWED_ELEMENTS[name] ?? [];
	let rendered = '';
	let blankTarget = false;
	let hasRel = false;

	for (const [rawKey, rawValue] of Object.entries(attributes)) {
		const key = rawKey.toLowerCase();

		// Belt and braces: no event handler should be allowlisted, and if one
		// ever is, it still should not make it out of here.
		if (key.startsWith('on')) continue;
		if (!GLOBAL_ATTRIBUTES.includes(key) && !allowed.includes(key)) continue;

		if (key === 'style') {
			const style = sanitizeStyle(rawValue);
			if (style) rendered += ` style="${escapeDecoded(style)}"`;
			continue;
		}

		if (URL_ATTRIBUTES.has(key)) {
			const url = safeUrl(rawValue);
			if (url === null) continue;
			rendered += ` ${key}="${escapeDecoded(url)}"`;
			continue;
		}

		if (key === 'target') blankTarget = rawValue.toLowerCase() === '_blank';
		if (key === 'rel') hasRel = true;

		rendered += ` ${key}="${escapePassthrough(rawValue)}"`;
	}

	// A `target="_blank"` link without `rel` hands the opener to the
	// destination. Tiptap sets `rel` itself; this covers pasted markup.
	if (blankTarget && !hasRel) rendered += ' rel="noopener noreferrer"';

	return rendered;
};

const sanitizeNode = (node: Node): string => {
	if (node.type === TEXT_NODE) {
		// Source text, so its entities are already encoded — passing it through
		// is what preserves `&amp;` as a single ampersand.
		return node.value;
	}

	if (node.type !== ELEMENT_NODE) {
		// Comments and doctypes carry nothing a visitor needs.
		return node.children ? sanitizeChildren(node) : '';
	}

	const name = node.name.toLowerCase();

	if (DROPPED_SUBTREES.has(name)) return '';
	// Unknown tag: keep the words, lose the wrapper.
	if (!(name in ALLOWED_ELEMENTS)) return sanitizeChildren(node);

	const attributes = sanitizeAttributes(name, node.attributes ?? {});
	if (VOID_ELEMENTS.has(name)) return `<${name}${attributes}>`;

	return `<${name}${attributes}>${sanitizeChildren(node)}</${name}>`;
};

const sanitizeChildren = (node: Node): string =>
	(node.children ?? []).map(sanitizeNode).join('');

/**
 * Sanitizes authored HTML on its way out of a server function. Call it in the
 * server function, not the component — the value should already be safe by the
 * time it crosses to the client.
 */
export const sanitizeHtml = (html: string | null | undefined): string => {
	if (!html) return '';
	return sanitizeChildren(parse(html));
};
