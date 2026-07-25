import { useEditorState } from '@tiptap/react';
import type { Editor } from '@tiptap/core';

const LivePreview = ({ editor }: { editor: Editor }) => {
	const state = useEditorState(editor);
	return (
		<div>
			<pre>{JSON.stringify(state, null, 2)}</pre>
		</div>
	);
};

export default LivePreview;
