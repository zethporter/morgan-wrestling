import { TableRow as TR } from '@tiptap/extension-table';

const TableRow = TR.configure({
	HTMLAttributes: {
		class:
			'border-b transition-colors hover:bg-muted/50 has-aria-expanded:bg-muted/50 data-[state=selected]:bg-muted',
	},
});

export default TableRow;
