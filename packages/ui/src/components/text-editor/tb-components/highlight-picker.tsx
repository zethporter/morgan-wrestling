import { useCurrentEditor, useEditorState } from '@tiptap/react';
import { cva, type VariantProps } from 'class-variance-authority';
import { ChevronDownIcon, HighlighterIcon } from 'lucide-react';
import { cn } from '@ui/lib/utils';
import { Skeleton } from '@ui/components/ui/skeleton';
import { ButtonGroup } from '@ui/components/ui/button-group';
import { Button } from '@ui/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@ui/components/ui/popover';
import { Toggle } from '@ui/components/ui/toggle';

const highlightVariants = cva('', {
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

export const HighlightPicker = ({
	size,
}: VariantProps<typeof highlightVariants>) => {
	const { editor } = useCurrentEditor();
	const editorState = useEditorState({
		editor,
		selector: ({ editor }) => ({
			isHighlighted: editor?.isActive('highlight') ?? false,
			canToggleHighlight: editor?.can().toggleHighlight(),
		}),
	});

	if (!editor || !editorState) {
		return <Skeleton className={cn(highlightVariants({ size }))} />;
	}

	return (

		<ButtonGroup aria-label='highlight-picker'>
		 <Toggle
		 	size={size}
		 	pressed={editorState.isHighlighted}
		 	disabled={!editorState.canToggleHighlight}
		 	onClick={() => editor.chain().focus().toggleHighlight().run()}
		 	variant='outline'
		 	aria-label='toggle-underline'
		 >
		 	<HighlighterIcon />
		 </Toggle>
			<Button variant='ghost' size={size}><ChevronDownIcon /></Button>
		</ButtonGroup>
	);
};
