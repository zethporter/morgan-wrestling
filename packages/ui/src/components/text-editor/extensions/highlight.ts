import H from '@tiptap/extension-highlight';

export type Colors = 'blue' | 'red' | 'sky' | 'emerald' | 'fuchsia' | 'amber'

export const highlightClasses: Record<Colors, string> = {
  'blue': 'px-1 rounded-sm bg-blue-800 text-white',
  'red': 'px-1 rounded-sm bg-red-200 text-black',
  'sky': 'px-1 rounded-sm bg-sky-200 text-black',
  'emerald': 'px-1 rounded-sm bg-emerald-800 text-white',
  'fuchsia': 'px-1 rounded-sm bg-fuchsia-800 text-white',
  'amber': 'px-1 rounded-sm bg-amber-200 text-black'
};

const Highlight = H.configure({ multicolor: true }).extend({
  renderHTML({ mark, HTMLAttributes }) {
    const color = mark.attrs.color as Colors;
    // Destructure out the style-injecting attributes
    const { color: _, style: __, ...rest } = HTMLAttributes;
    return [
      'mark',
      { ...rest, 'data-color': color, class: highlightClasses[color] ?? '' },
    ];
  },
});

export default Highlight;
