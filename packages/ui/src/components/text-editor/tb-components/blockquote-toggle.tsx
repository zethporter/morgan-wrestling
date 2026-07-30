import { useCurrentEditor, useEditorState } from '@tiptap/react';
import { cva, type VariantProps } from 'class-variance-authority';
import { QuoteIcon } from 'lucide-react';
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

export const StrikeToggle = ({ size }: VariantProps<typeof italicVariants>) => {
	const { editor } = useCurrentEditor();
	const editorState = useEditorState({
		editor,
		selector: ({ editor }) => ({
			isBlockquote: editor?.isActive('blockquote') ?? false,
			canToggleBlockquote: editor?.can().toggleBlockquote(),
		}),
	});

	if (!editor || !editorState) {
		return <Skeleton className={cn(italicVariants({ size }))} />;
	}

	return (
		<Toggle
			size={size}
			pressed={editorState.isBlockquote}
			disabled={!editorState.canToggleBlockquote}
			onClick={() => editor.chain().focus().toggleBlockquote().run()}
			variant='outline'
			aria-label='toggle-italic'
		>
			<QuoteIcon />
		</Toggle>
	);
};
