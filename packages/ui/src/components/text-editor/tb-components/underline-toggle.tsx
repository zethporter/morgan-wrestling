import { useCurrentEditor, useEditorState } from '@tiptap/react';
import { cva, type VariantProps } from 'class-variance-authority';
import { UnderlineIcon } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { Skeleton } from '../../ui/skeleton';
import { Toggle } from '../../ui/toggle';

const underlineVariants = cva('', {
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

export const UnderlineToggle = ({
	size,
}: VariantProps<typeof underlineVariants>) => {
	const { editor } = useCurrentEditor();
	const editorState = useEditorState({
		editor,
		selector: ({ editor }) => ({
			isUnderline: editor?.isActive('underline') ?? false,
			canToggleUnderline: editor?.can().toggleUnderline(),
		}),
	});

	if (!editor || !editorState) {
		return <Skeleton className={cn(underlineVariants({ size }))} />;
	}

	return (
		<Toggle
			size={size}
			pressed={editorState.isUnderline}
			disabled={!editorState.canToggleUnderline}
			onClick={() => editor.chain().focus().toggleUnderline().run()}
			variant='outline'
			aria-label='toggle-underline'
		>
			<UnderlineIcon />
		</Toggle>
	);
};
