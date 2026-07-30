import BQ from '@tiptap/extension-blockquote';

const Blockquote = BQ.configure({
	HTMLAttributes: {
		class: 'p-1 rounded-sm border border-red-500',
	},
});

export default Blockquote;
