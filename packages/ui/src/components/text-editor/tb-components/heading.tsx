import type { Level } from '@tiptap/extension-heading';
import { useCurrentEditor, useEditorState } from '@tiptap/react';
import { cva, type VariantProps } from 'class-variance-authority';
import {
	Heading1Icon,
	Heading2Icon,
	Heading3Icon,
	Heading4Icon,
	Heading5Icon,
	Heading6Icon,
	PilcrowIcon,
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '../../ui/select';
import { Skeleton } from '../../ui/skeleton';

const headingVariants = cva('',{
	variants: {
		size: {
			default: 'w-44 h-9',
			sm: 'w-44 h-8',
		},
	},
	defaultVariants: {
		size: 'default',
	},
});

const HeadingItem = ({ children }: { children: React.ReactNode }) => {
	return (
		<div className={cn('flex flex-row gap-2 items-center')}>{children}</div>
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
		value: '1',
	},
	{
		label: (
			<HeadingItem>
				<Heading2Icon />
				Heading 2
			</HeadingItem>
		),
		value: '2',
	},
	{
		label: (
			<HeadingItem>
				<Heading3Icon />
				Heading 3
			</HeadingItem>
		),
		value: '3',
	},
	{
		label: (
			<HeadingItem>
				<Heading4Icon />
				Heading 4
			</HeadingItem>
		),
		value: '4',
	},
	{
		label: (
			<HeadingItem>
				<Heading5Icon />
				Heading 5
			</HeadingItem>
		),
		value: '5',
	},
	{
		label: (
			<HeadingItem>
				<Heading6Icon />
				Heading 6
			</HeadingItem>
		),
		value: '6',
	},
	{
		label: (
			<HeadingItem>
				<PilcrowIcon />
				Paragraph
			</HeadingItem>
		),
		value: 'p',
	},
];

export const HeadingSelect = ({
	size = 'default',
}: VariantProps<typeof headingVariants>) => {
	const { editor } = useCurrentEditor();
	const state = useEditorState({
		editor,
		selector: ({ editor }) => ({
			headingType: editor?.getAttributes('heading').level ?? 'p',
		}),
	});

	if (!editor || !state) {
		return <Skeleton className={cn(headingVariants({ size }))} />;
	}

	return (
		<Select
			items={items}
			value={String(state.headingType)}
			onValueChange={(value) => {
				if (value === 'p') {
					editor.chain().focus().setParagraph().run();
				} else {
					editor
						.chain()
						.focus()
						.setHeading({ level: Number(value) as Level })
						.run();
				}
			}}
		>
			<SelectTrigger size={size ?? 'default'} className='w-44'>
				<SelectValue placeholder='Heading' />
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
	);
};
