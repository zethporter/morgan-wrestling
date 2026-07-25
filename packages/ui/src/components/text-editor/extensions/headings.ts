import H from "@tiptap/extension-heading";

const headingClasses: Record<number, string> = {
  1: "text-4xl font-bold",
  2: "text-3xl font-bold",
  3: "text-2xl font-semibold",
  4: "text-xl font-semibold",
  5: "text-lg font-medium",
  6: "text-base font-medium",
};
const Heading = H.extend({
  renderHTML({ node, HTMLAttributes }) {
    const level = node.attrs.level as number;
    return [
      `h${level}`,
      { ...HTMLAttributes, class: headingClasses[level] ?? "" },
      0,
    ];
  },
});

export default Heading;
