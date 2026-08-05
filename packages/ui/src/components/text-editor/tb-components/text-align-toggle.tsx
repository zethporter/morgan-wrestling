import { useCurrentEditor, useEditorState } from '@tiptap/react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../../lib/utils';
import { Skeleton } from '../../ui/skeleton';
import { Toggle } from '../../ui/toggle';

const boldVariants = cva('', {
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

export const BoldToggle = ({ size }: VariantProps<typeof boldVariants>) => {
	const { editor } = useCurrentEditor();
	const editorState = useEditorState({
		editor,
		selector: ({ editor }) => ({
			isBold: editor?.isActive('bold') ?? false,
			canToggleBold: editor?.can().toggleBold(),
		}),
	});

	if (!editor || !editorState) {
		return <Skeleton className={cn(boldVariants({ size }))} />;
	}

	return (
		<Toggle
			size={size}
			pressed={editorState.isBold}
			disabled={!editorState.canToggleBold}
			onClick={() => editor.chain().focus().toggleBold().run()}
			variant='outline'
			aria-label='toggle-bold'
		>
			<BoldIcon />
		</Toggle>
	);
};
