import H from '@tiptap/extension-highlight';

const Highlight = H.configure({
  HTMLAttributes: {
    class: 'rounded-sm bg-linear-to-r from-blue-200 to-blue-400 text-white'
  }
})

export default Highlight;
