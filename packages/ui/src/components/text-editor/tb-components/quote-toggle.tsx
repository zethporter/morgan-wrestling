import { useCurrentEditor, useEditorState } from '@tiptap/react';
import { cva, type VariantProps } from 'class-variance-authority';
import { QuoteIcon } from 'lucide-react';
import { cn } from '@ui/lib/utils';
import { Skeleton } from '@ui/components/ui/skeleton';
import { Toggle } from '@ui/components/ui/toggle';

const quoteVariants = cva('', {
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

export const QuoteToggle = ({ size }: VariantProps<typeof quoteVariants>) => {
	const { editor } = useCurrentEditor();
	const editorState = useEditorState({
		editor,
		selector: ({ editor }) => ({
			isQuoted: editor?.isActive('blockquote') ?? false,
			canToggleQuote: editor?.can().toggleBlockquote(),
		}),
	});

	if (!editor || !editorState) {
		return <Skeleton className={cn(quoteVariants({ size }))} />;
	}

	return (
		<Toggle
			size={size}
			pressed={editorState.isQuoted}
			disabled={!editorState.canToggleQuote}
			onClick={() => editor.chain().focus().toggleBlockquote().run()}
			variant='outline'
			aria-label='toggle-underline'
		>
			<QuoteIcon />
		</Toggle>
	);
};
