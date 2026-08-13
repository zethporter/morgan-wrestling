import BQ from '@tiptap/extension-blockquote';

const Blockquote = BQ.configure({
	HTMLAttributes: {
		class: 'p-1 pl-3 m-2 border-l-3 border-primary w-full ',
	},
});

export default Blockquote;
