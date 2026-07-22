import { TableCell as TC } from "@tiptap/extension-table";
const TableCell = TC.configure({
  HTMLAttributes: {
    class: "p-2 align-middle whitespace-nowrap [&:has([role=checkbox])]:pr-0",
  },
});

export default TableCell;
