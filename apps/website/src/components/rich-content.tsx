/**
 * The one place the site renders authored HTML.
 *
 * `home_content` and `team_pages.content` are HTML strings produced by the
 * Tiptap editor — see `packages/ui/src/components/text-editor/types.ts`. They
 * are sanitized in the server function that reads them, never here, so that
 * nothing unsafe is ever sent to the client in the first place.
 */
export const RichContent = ({
	html,
	className,
}: {
	html: string;
	className?: string;
}) => {
	if (!html.trim()) return null;

	return (
		<article
			className={`prose prose-neutral dark:prose-invert max-w-none ${className ?? ''}`.trim()}
			// Safe because `html` has been through `sanitizeHtml` in the server
			// function that read it. This is the only `dangerouslySetInnerHTML` in
			// the app; keep it that way, so there is one thing to audit.
			dangerouslySetInnerHTML={{ __html: html }}
		/>
	);
};
