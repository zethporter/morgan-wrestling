import { useCurrentEditor, useEditorState } from '@tiptap/react';
import { Skeleton } from '@ui/components/ui/skeleton';
import { Toggle } from '@ui/components/ui/toggle';
import { cn } from '@ui/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';
import { StrikethroughIcon } from 'lucide-react';

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
			isStrikethrough: editor?.isActive('strike') ?? false,
			canToggleStrike: editor?.can().toggleStrike(),
		}),
	});

	if (!editor || !editorState) {
		return <Skeleton className={cn(italicVariants({ size }))} />;
	}

	return (
		<Toggle
			size={size}
			pressed={editorState.isStrikethrough}
			disabled={!editorState.canToggleStrike}
			onClick={() => editor.chain().focus().toggleStrike().run()}
			variant='outline'
			aria-label='toggle-italic'
		>
			<StrikethroughIcon />
		</Toggle>
	);
};
