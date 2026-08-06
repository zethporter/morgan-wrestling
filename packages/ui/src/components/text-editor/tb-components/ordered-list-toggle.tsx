import { useCurrentEditor, useEditorState } from '@tiptap/react';
import { cva, type VariantProps } from 'class-variance-authority';
import { ListOrderedIcon } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { Skeleton } from '../../ui/skeleton';
import { Toggle } from '../../ui/toggle';

const orderedListVariants = cva('', {
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

export const OrderedListToggle = ({
  size,
}: VariantProps<typeof orderedListVariants>) => {
  const { editor } = useCurrentEditor();
  const editorState = useEditorState({
    editor,
    selector: ({ editor }) => ({
      isOrderedList: editor?.isActive('orderedList') ?? false,
      canToggleOrderedList: editor?.can().toggleOrderedList(),
    }),
  });

  if (!editor || !editorState) {
    return <Skeleton className={cn(orderedListVariants({ size }))} />;
  }

  return (
    <Toggle
      size={size}
      pressed={editorState.isOrderedList}
      disabled={!editorState.canToggleOrderedList}
      onClick={() => editor.chain().focus().toggleOrderedList().run()}
      variant='outline'
      aria-label='toggle-underline'
    >
      <ListOrderedIcon />
    </Toggle>
  );
};
