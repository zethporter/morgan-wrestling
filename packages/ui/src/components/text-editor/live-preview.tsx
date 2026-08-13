import { useCurrentEditor, useEditorState } from '@tiptap/react';

const LivePreview = () => {
	const { editor } = useCurrentEditor();
	const state = useEditorState({
		editor,
		selector: (ctx) => ({
			html: ctx?.editor?.getHTML() ?? '',
		}),
	});

	if (!editor || !state) {
		return null;
	}

	return (
		<div>
			<pre>{state.html}</pre>
		</div>
	);
};

export default LivePreview;
