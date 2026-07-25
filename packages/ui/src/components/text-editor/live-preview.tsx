import type { Editor } from '@tiptap/react';
import { useEditorState } from '@tiptap/react';

const LivePreview = ({ editor }: { editor: Editor }) => {
	const state = useEditorState({
		editor,
		selector: (ctx) => ({
			html: ctx.editor.getHTML()
		}),
	});

	return (
		<div>
			<pre>{state.html}</pre>
		</div>
	);
};

export default LivePreview;
