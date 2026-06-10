import { ColumnDef } from "@tanstack/react-table";

export type FAQCategory =
  | "PRICING"
  | "SHIPPING_RULES"
  | "TRACKING"
  | "PAYMENTS"
  | "ACCOUNT"
  | "PACKAGING"
  | "CLAIMS";

export type FAQ = {
  id: string;
  question: string;
  answer: string;
  category: FAQCategory;
  sortOrder: number;
  createdAt?: string;
};

const formatText = (value?: string) =>
  value ? value.toLowerCase().replaceAll("_", " ") : "-";

const formatDate = (date?: string) => {
  if (!date) return "-";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) return "-";

  return parsedDate.toLocaleDateString();
};

export const FAQColumns: ColumnDef<FAQ>[] = [
  {
    id: "sn",
    header: "S/N",
    cell: ({ row }) => <div>{row.index + 1}</div>,
  },
  {
    accessorKey: "question",
    header: "Question",
    cell: ({ row }) => (
      <div className="max-w-[260px] truncate font-medium">
        {row.original.question}
      </div>
    ),
  },
  {
    accessorKey: "answer",
    header: "Answer",
    cell: ({ row }) => (
      <div className="max-w-[320px] truncate text-xs text-gray-500">
        {row.original.answer}
      </div>
    ),
  },
  {
    accessorKey: "category",
    header: "Category",
    cell: ({ row }) => (
      <span className="rounded-full bg-gray-100 px-2 py-1 text-xs capitalize text-gray-600">
        {formatText(row.original.category)}
      </span>
    ),
  },
  {
    accessorKey: "sortOrder",
    header: "Sort Order",
    cell: ({ row }) => <div>{row.original.sortOrder}</div>,
  },
  {
    accessorKey: "createdAt",
    header: "Date",
    cell: ({ row }) => <div>{formatDate(row.original.createdAt)}</div>,
  },
];
