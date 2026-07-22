import type { Editor } from "@tiptap/react";
import { useEditorState } from "@tiptap/react";
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
  UnderlineIcon
} from "lucide-react";
import { cn } from "#/lib/utils";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Toggle } from "../ui/toggle";


const HeadingItem = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className={cn("flex flex-row gap-2 items-center")}>
      {children}
    </div>
  );
};

const items = [
  {
    label: (
      <HeadingItem>
        <Heading1Icon />
        Heading 1
      </HeadingItem>
    ),
    value: "h1",
  },
  {
    label: (
      <HeadingItem>
        <Heading2Icon />
        Heading 2
      </HeadingItem>
    ),
    value: "h2",
  },
  {
    label: (
      <HeadingItem>
        <Heading3Icon />
        Heading 3
      </HeadingItem>
    ),
    value: "h3",
  },
  {
    label: (
      <HeadingItem>
        <Heading4Icon />
        Heading 4
      </HeadingItem>
    ),
    value: "h4",
  },
  {
    label: (
      <HeadingItem>
        <Heading5Icon />
        Heading 5
      </HeadingItem>
    ),
    value: "h5",
  },
  {
    label: (
      <HeadingItem>
        <Heading6Icon />
        Heading 6
      </HeadingItem>
    ),
    value: "h6",
  },
  {
    label: (
      <HeadingItem>
        <PilcrowIcon />
        Paragraph
      </HeadingItem>
    ),
    value: "p",
  },
];

export function TextEditorMenu({ editor }: { editor: Editor }) {
  const editorState = useEditorState({
      editor,
      selector: ctx => ({
        isBulletList: ctx.editor.isActive('bulletList') ?? false,
        canSplitListItem: ctx.editor.can().splitListItem('listItem') ?? false,
        canSinkListItem: ctx.editor.can().sinkListItem('listItem') ?? false,
        canLiftListItem: ctx.editor.can().liftListItem('listItem') ?? false,
        isBold: ctx.editor.isActive('bold') ?? false,
        canToggleBold: ctx.editor.can().toggleBold(),
        isItalic: ctx.editor.isActive('italic') ?? false,
        isUnderline: ctx.editor.isActive('underline') ?? false,
        isStrikethrough: ctx.editor.isActive('strike') ?? false,
      }),
    })
  if (!editor) {
      return null
    }
  return (
			<div
				className={cn(
					'flex flex-row justify-start gap-2 p-1 rounded-sm bg-background',
				)}
			>
				<Select items={items}>
					<SelectTrigger className="w-44">
						<SelectValue placeholder="Heading" />
					</SelectTrigger>
					<SelectContent>
						<SelectGroup>
							{items.map((item) => (
								<SelectItem key={item.value} value={item.value}>
									{item.label}
								</SelectItem>
							))}
						</SelectGroup>
					</SelectContent>
				</Select>
				<div className="flex flex-row gap-1 flex-nowrap">
					<Toggle
						pressed={editorState.isBold}
						disabled={!editorState.canToggleBold}
						onClick={() => editor.chain().focus().toggleBold().run()}
						variant="outline"
						aria-label="toggle-bold"
					>
						<BoldIcon />
					</Toggle>
					<Toggle variant="outline" aria-label="toggle-underline">
						<UnderlineIcon />
					</Toggle>
					<Toggle variant="outline" aria-label="toggle-italic">
						<ItalicIcon />
					</Toggle>
					<Toggle variant="outline" aria-label="toggle-strikethrough">
						<StrikethroughIcon />
					</Toggle>
					<Toggle variant="outline" aria-label="toggle-quote">
						<QuoteIcon />
					</Toggle>
					<Toggle variant="outline" aria-label="toggle-highlight">
						<HighlighterIcon />
					</Toggle>
					<Toggle variant="outline" aria-label="toggle-subscript">
						<SubscriptIcon />
					</Toggle>
					<Toggle variant="outline" aria-label="toggle-superscript">
						<SuperscriptIcon />
					</Toggle>
					<Toggle variant="outline" aria-label="toggle-list">
						<ListIcon />
					</Toggle>
					<Toggle variant="outline" aria-label="toggle-ordered-list">
						<ListOrderedIcon />
					</Toggle>
				</div>
			</div>
		);
}
