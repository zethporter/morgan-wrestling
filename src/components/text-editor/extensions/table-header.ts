import { TableHeader as TH } from "@tiptap/extension-table";
const TableHeader = TH.configure({
  HTMLAttributes: {
    class:
      "h-10 px-2 text-left align-middle font-medium whitespace-nowrap text-foreground [&:has([role=checkbox])]:pr-0",
  },
});

export default TableHeader;
