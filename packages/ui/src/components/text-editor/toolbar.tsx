import type { Editor } from '@tiptap/react';
import { cn } from '../../lib/utils';
import { BoldToggle } from './tb-components/bold-toggle';
import { BulletListToggle } from './tb-components/bullet-list-toggle';
import { HeadingSelect } from './tb-components/heading';
import { HighlightPicker } from './tb-components/highlight-picker';
import { ItalicToggle } from './tb-components/italic-toggle';
import { OrderedListToggle } from './tb-components/ordered-list-toggle';
import { QuoteToggle } from './tb-components/quote-toggle';
import { StrikeToggle } from './tb-components/strike-toggle';
import { TextAlignToggle } from './tb-components/text-align-toggle';
import { UnderlineToggle } from './tb-components/underline-toggle';

export function Toolbar({ editor }: { editor: Editor }) {
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
        <BulletListToggle />
        <OrderedListToggle />
      </div>
    </div>
  );
}
