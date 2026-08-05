import TA from '@tiptap/extension-text-align';

const TextAlign = TA.configure({
  types: ['heading', 'paragraph'],
  alignments: ['left', 'center', 'right'],
  defaultAlignment: 'left'
});

export default TextAlign;
