import { useCurrentEditor, useEditorState } from '@tiptap/react';
import { cva, type VariantProps } from 'class-variance-authority';
import { ListIcon } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { Skeleton } from '../../ui/skeleton';
import { Toggle } from '../../ui/toggle';

const bulletListVariants = cva('', {
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

export const BulletListToggle = ({
  size,
}: VariantProps<typeof bulletListVariants>) => {
  const { editor } = useCurrentEditor();
  const editorState = useEditorState({
    editor,
    selector: ({ editor }) => ({
      isBulletList: editor?.isActive('bulletList') ?? false,
      canToggleBulletList: editor?.can().toggleBulletList(),
    }),
  });

  if (!editor || !editorState) {
    return <Skeleton className={cn(bulletListVariants({ size }))} />;
  }

  return (
    <Toggle
      size={size}
      pressed={editorState.isBulletList}
      disabled={!editorState.canToggleBulletList}
      onClick={() => editor.chain().focus().toggleBulletList().run()}
      variant='outline'
      aria-label='toggle-underline'
    >
      <ListIcon />
    </Toggle>
  );
};
