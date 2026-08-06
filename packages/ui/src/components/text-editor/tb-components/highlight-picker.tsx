import { useCurrentEditor, useEditorState } from '@tiptap/react';
import { Button } from '@ui/components/ui/button';
import { ButtonGroup } from '@ui/components/ui/button-group';
import { Popover, PopoverContent, PopoverTitle, PopoverTrigger } from '@ui/components/ui/popover';
import { Skeleton } from '@ui/components/ui/skeleton';
import { Toggle } from '@ui/components/ui/toggle';
import { cn } from '@ui/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';
import { ChevronDownIcon, HighlighterIcon } from 'lucide-react';
import { highlightClasses } from '../extensions/highlight';

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
      highlightColor: editor?.getAttributes('highlight')?.color ?? null,
      canHighlight: editor?.can().toggleHighlight(),
    }),
  });

  if (!editor || !editorState) {
    return <Skeleton className={cn(highlightVariants({ size }))} />;
  }

  return (

    <ButtonGroup aria-label='highlight-picker'>
      <Toggle
        size={size}
        pressed={!!editorState.highlightColor}
        disabled={!editorState.canHighlight}
        onClick={() => editor.chain().focus().toggleHighlight({ color: 'amber' }).run()}
        variant='outline'
        aria-label='toggle-highlight'
      >
        <HighlighterIcon />
      </Toggle>
      <Popover>
        <PopoverTrigger
          render={<Toggle pressed={false} variant='outline' size={size}><ChevronDownIcon /></Toggle>}
        />
        <PopoverContent>
          <PopoverTitle className='sr-only'>Highlight PIcker</PopoverTitle>
          <div className='grid grid-cols-3 gap-2'>
            {Object.entries(highlightClasses).map(([color, className]) => (
              <Toggle
                key={color}
                pressed={editorState.highlightColor === color}
                onClick={() => editor.chain().focus().toggleHighlight({ color }).run()}
                variant='outline'
                aria-label={`toggle-${color}-highlight`}
              >
                <div className={cn('w-8 h-8', className)}></div>
              </Toggle>
            ))}
            <Button variant='outline' className='col-span-3' disabled={!editorState.highlightColor} onClick={() => editor.chain().toggleHighlight().run()}>remove</Button>
          </div>
        </PopoverContent>
      </Popover>
    </ButtonGroup>
  );
};
