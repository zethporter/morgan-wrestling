import { Table as T } from '@tiptap/extension-table';
const Table = T.configure({
	HTMLAttributes: {
		class: 'relative w-full overflow-x-auto',
	},
});

export default Table;
