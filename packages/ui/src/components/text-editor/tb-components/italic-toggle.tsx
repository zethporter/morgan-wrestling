import { useCurrentEditor, useEditorState } from '@tiptap/react';
import { cva, type VariantProps } from 'class-variance-authority';
import { ItalicIcon } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { Skeleton } from '../../ui/skeleton';
import { Toggle } from '../../ui/toggle';

const italicVariants = cva('', {
	variants: {
		size: {
			default: 'w-9 h-9',
			sm: 'w-8 h-8',
		},
	},
	defaultVariants: {
		size: 'default',
	},
});

export const ItalicToggle = ({ size }: VariantProps<typeof italicVariants>) => {
	const { editor } = useCurrentEditor();
	const editorState = useEditorState({
		editor,
		selector: ({ editor }) => ({
			isItalic: editor?.isActive('italic') ?? false,
			canToggleItalic: editor?.can().toggleItalic(),
		}),
	});

	if (!editor || !editorState) {
		return <Skeleton className={cn(italicVariants({ size }))} />;
	}

	return (
		<Toggle
			size={size}
			pressed={editorState.isItalic}
			disabled={!editorState.canToggleItalic}
			onClick={() => editor.chain().focus().toggleItalic().run()}
			variant='outline'
			aria-label='toggle-italic'
		>
			<ItalicIcon />
		</Toggle>
	);
};
