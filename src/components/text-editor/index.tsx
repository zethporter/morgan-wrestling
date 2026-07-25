// src/Tiptap.tsx
import { EditorContent, EditorContext, useEditor } from '@tiptap/react';
import { BubbleMenu, FloatingMenu } from '@tiptap/react/menus';
import StarterKit from '@tiptap/starter-kit';
import { useMemo } from 'react';
import Heading from './extensions/headings';
import Subscript from './extensions/subscript';
import Superscript from './extensions/superscript';
import { TextEditorMenu } from './menu';

const TextEditor = () => {
	const editor = useEditor({
		editorProps: {
			attributes: {
				class: 'focus:outline-none focus:ring-0',
			},
		},
		extensions: [
			StarterKit.configure({
				paragraph: {
					HTMLAttributes: {
						class: 'text-md',
					},
				},
				bulletList: {
					HTMLAttributes: {
						class: 'list-disc',
					},
				},
				orderedList: {
					HTMLAttributes: {
						class: 'list-decimal',
					},
				},
				link: {
					HTMLAttributes: {
						class: 'text-blue-500 hover:underline', //actually make these look better prolly.
					},
				},
				strike: {
					HTMLAttributes: {
						class: 'line-through',
					},
				},
				bold: {
					HTMLAttributes: {
						class: 'font-bold text-blue-400',
					},
				},
				italic: {
					HTMLAttributes: {
						class: 'italic',
					},
				},
				heading: false,
			}),
			Heading.configure({
				levels: [1, 2, 3, 4, 5, 6],
			}),
			Subscript,
			Superscript,
		], // define your extension array
		content: '<p>Hello World!</p>', // initial content
	});

	// Memoize the provider value to avoid unnecessary re-renders
	const providerValue = useMemo(() => ({ editor }), [editor]);

	return (
		<>
			<EditorContext.Provider value={providerValue}>
				<TextEditorMenu editor={editor} />
				<EditorContent
					className='p-2 border border-secondary rounded-xl'
					editor={editor}
				/>
				{/*<FloatingMenu editor={editor}>This is the floating menu</FloatingMenu>
        <BubbleMenu editor={editor}>This is the bubble menu</BubbleMenu>*/}
			</EditorContext.Provider>
			<pre>{editor.getHTML()}</pre>
		</>
	);
};

export default TextEditor;
