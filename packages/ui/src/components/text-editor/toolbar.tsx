import type { Editor } from '@tiptap/react';
import { useEditorState } from '@tiptap/react';
import {
  BoldIcon,
  Heading1Icon,
  Heading2Icon,
  Heading3Icon,
  Heading4Icon,
  Heading5Icon,
  Heading6Icon,
  HighlighterIcon,
  ItalicIcon,
  ListIcon,
  ListOrderedIcon,
  PilcrowIcon,
  QuoteIcon,
  StrikethroughIcon,
  SubscriptIcon,
  SuperscriptIcon,
  UnderlineIcon,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { Toggle } from '../ui/toggle';
import { BoldToggle } from './tb-components/bold-toggle';
import { HeadingSelect } from './tb-components/heading';
import { HighlightPicker } from './tb-components/highlight-picker';
import { ItalicToggle } from './tb-components/italic-toggle';
import { QuoteToggle } from './tb-components/quote-toggle';
import { StrikeToggle } from './tb-components/strike-toggle';
import { TextAlignToggle } from './tb-components/text-align-toggle';
import { UnderlineToggle } from './tb-components/underline-toggle';

export function Toolbar({ editor }: { editor: Editor }) {
  const editorState = useEditorState({
    editor,
    selector: (ctx) => ({
      isBulletList: ctx.editor.isActive('bulletList') ?? false,
      isOrderedList: ctx.editor.isActive('orderedList') ?? false,
      canSplitListItem: ctx.editor.can().splitListItem('listItem') ?? false,
      canSinkListItem: ctx.editor.can().sinkListItem('listItem') ?? false,
      canToggleItalic: ctx.editor.can().toggleItalic(),
      isStrikethrough: ctx.editor.isActive('strike') ?? false,
      canToggleStrikethrough: ctx.editor.can().toggleStrike(),
      isSubScript: ctx.editor.isActive('sub') ?? false,
      canToggleSubScript: ctx.editor.can().toggleSubscript(),
      isSuperScript: ctx.editor.isActive('super') ?? false,
      canToggleSuperScript: ctx.editor.can().toggleSuperscript(),
    }),
  });
  if (!editor) {
    return null;
  }
  return (
    <div
      className={cn(
        'flex flex-row justify-start gap-2 p-1 rounded-sm bg-background',
      )}
    >
      <HeadingSelect />
      <div className='flex flex-row gap-1 flex-nowrap'>
        <BoldToggle />
        <UnderlineToggle />
        <ItalicToggle />
        <StrikeToggle />
        <TextAlignToggle />
        <QuoteToggle />
        <HighlightPicker />
        <Toggle variant='outline' aria-label='toggle-list'>
          <ListIcon />
        </Toggle>
        <Toggle variant='outline' aria-label='toggle-ordered-list'>
          <ListOrderedIcon />
        </Toggle>
      </div>
    </div>
  );
}
