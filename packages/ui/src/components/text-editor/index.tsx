import {
	type Content,
	EditorContent,
	EditorContext,
	useEditor,
} from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useEffect, useMemo } from 'react';
import { cn } from '../../lib/utils';
import Blockquote from './extensions/blockquote';
import Heading from './extensions/headings';
import Highlight from './extensions/highlight';
import Subscript from './extensions/subscript';
import Superscript from './extensions/superscript';
import TextAlign from './extensions/text-align';
import LivePreview from './live-preview';
import { Toolbar } from './toolbar';

import type { RichTextValue } from './types';

export * from './types';

/** Prefer the stored ProseMirror doc, and fall back to the HTML it produced. */
const toEditorContent = (value?: RichTextValue | null): Content => {
	if (!value) return '';
	if (value.json) {
		try {
			return JSON.parse(value.json) as Content;
		} catch {
			// Corrupt metadata shouldn't lose the content — fall through to HTML.
		}
	}
	return value.html || '';
};

const extensions = [
	StarterKit.configure({
		paragraph: {
			HTMLAttributes: {
				class: 'text-md w-full',
			},
		},
		bulletList: {
			HTMLAttributes: {
				class: 'list-disc pl-6 inner-flex [&_li_p]:inline',
			},
		},
		orderedList: {
			HTMLAttributes: {
				class: 'list-decimal pl-6 inner-flex [&_li_p]:inline',
			},
		},
		listItem: {
			HTMLAttributes: {
				class: 'dkdkd',
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
		blockquote: false,
	}),
	Heading.configure({
		levels: [1, 2, 3, 4, 5, 6],
		HTMLAttributes: {
			class: 'h-full',
		},
	}),
	Subscript,
	Superscript,
	Blockquote,
	Highlight,
	TextAlign,
];

type TextEditorProps = {
	/**
	 * Seeds the document. Read once, on mount — remount with a `key` to load a
	 * different document, so typing is never interrupted by a re-render.
	 */
	value?: RichTextValue | null;
	onChange?: (value: RichTextValue) => void;
	onBlur?: () => void;
	editable?: boolean;
	className?: string;
	toolbarClassName?: string;
	contentClassName?: string;
	/** Renders the raw HTML under the editor — handy while building. */
	showPreview?: boolean;
	'aria-labelledby'?: string;
	'aria-invalid'?: boolean;
};

const TextEditor = ({
	value,
	onChange,
	onBlur,
	editable = true,
	className,
	toolbarClassName,
	contentClassName,
	showPreview = false,
	'aria-labelledby': ariaLabelledBy,
	'aria-invalid': ariaInvalid,
}: TextEditorProps) => {
	const editor = useEditor({
		// The admin app server renders, and Tiptap needs the DOM to build a view.
		immediatelyRender: false,
		editable,
		editorProps: {
			attributes: {
				class: 'focus:outline-none focus:ring-0',
				...(ariaLabelledBy ? { 'aria-labelledby': ariaLabelledBy } : {}),
				...(ariaInvalid ? { 'aria-invalid': 'true' } : {}),
			},
		},
		extensions,
		content: toEditorContent(value),
		onUpdate: ({ editor }) =>
			onChange?.({
				html: editor.getHTML(),
				json: JSON.stringify(editor.getJSON()),
			}),
		onBlur: () => onBlur?.(),
	});

	useEffect(() => {
		editor?.setEditable(editable);
	}, [editor, editable]);

	// Memoize the provider value to avoid unnecessary re-renders
	const providerValue = useMemo(() => ({ editor }), [editor]);

	return (
		<EditorContext.Provider value={providerValue}>
			<div className={cn('flex min-h-0 flex-col gap-2', className)}>
				<Toolbar editor={editor} className={cn('shrink-0', toolbarClassName)} />
				<EditorContent
					className={cn(
						'min-h-0 flex-1 overflow-auto rounded-xl border border-secondary p-2',
						'[&_.tiptap]:min-h-full',
						editable ? 'cursor-text' : 'opacity-70',
						contentClassName,
					)}
					editor={editor}
				/>
				{showPreview && <LivePreview />}
			</div>
		</EditorContext.Provider>
	);
};

export default TextEditor;
