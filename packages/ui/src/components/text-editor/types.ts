/**
 * Kept free of Tiptap imports so forms and routes can talk about rich text
 * values without pulling the editor into their bundle.
 */

/**
 * The two halves of a stored rich text document: `html` is what gets rendered
 * on the public site, `json` is the ProseMirror doc we load back into the
 * editor so nothing is lost in the HTML round trip.
 */
export type RichTextValue = {
	html: string;
	json: string;
};

export const EMPTY_RICH_TEXT: RichTextValue = { html: '', json: '' };

export const toRichTextValue = (
	html?: string | null,
	json?: string | null,
): RichTextValue => ({ html: html ?? '', json: json ?? '' });
