import { useCurrentEditor, useEditorState } from '@tiptap/react';
import { Skeleton } from '@ui/components/ui/skeleton';
import { ToggleGroup, ToggleGroupItem } from '@ui/components/ui/toggle-group';
import { cn } from '@ui/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';
import { TextAlignCenterIcon, TextAlignEndIcon, TextAlignStartIcon } from 'lucide-react';
import { useMemo } from 'react';

const textAlignVariants = cva('', {
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

export const TextAlignToggle = ({ size }: VariantProps<typeof textAlignVariants>) => {
  const { editor } = useCurrentEditor();
  const editorState = useEditorState({
    editor,
    selector: ({ editor }) => ({
      isLeft: editor?.isActive({ textAlign: 'left' }),
      isCenter: editor?.isActive({ textAlign: 'center' }),
      isRight: editor?.isActive({ textAlign: 'right' }),
    }),
  });

  const alignment = useMemo(() => {
    if (editorState?.isLeft) return 'left';
    if (editorState?.isCenter) return 'center';
    if (editorState?.isRight) return 'right';
    return 'left';
  }, [editorState?.isLeft, editorState?.isCenter, editorState?.isRight])

  if (!editor || !editorState) {
    return <Skeleton className={cn(textAlignVariants({ size }))} />;
  }

  return (
    <ToggleGroup
      value={[alignment]}
      onValueChange={(value) => editor.chain().focus().toggleTextAlign(value[0] ?? 'left').run()}
      size={size}
      variant='outline'
      spacing={1}
    >
      <ToggleGroupItem
        value='left'
        aria-label='seft-left-align'
      >
        <TextAlignStartIcon />
      </ToggleGroupItem>
      <ToggleGroupItem
        value='center'
        aria-label='set-center-align'
      >
        <TextAlignCenterIcon />
      </ToggleGroupItem>
      <ToggleGroupItem
        value='right'
        aria-label='set-right-align'
      >
        <TextAlignEndIcon />
      </ToggleGroupItem>
    </ToggleGroup>
  );
};
