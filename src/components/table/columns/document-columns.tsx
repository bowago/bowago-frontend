import { ColumnDef } from "@tanstack/react-table";

export type Document = {
  name: string;
  type: string;
  size: string;
  status: "pending" | "uploaded";
};

export const documentColumns: ColumnDef<Document>[] = [
  {
    accessorKey: "name",
    header: "Document Name",
  },

  {
    accessorKey: "type",
    header: "Document Type",
  },

  {
    accessorKey: "size",
    header: "Size (MB)",
  },

  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status: string = row.getValue("status");

      return (
        <span
          className={`px-3 py-1 rounded-full text-xs
          ${
            status === "uploaded"
              ? "bg-green-100 text-green-600"
              : "bg-yellow-100 text-yellow-600"
          }`}
        >
          {status}
        </span>
      );
    },
  },

  {
    id: "action",
    header: "Action",
    cell: () => (
      <button className="bg-red-600 text-white px-4 py-1 rounded">
        Upload
      </button>
    ),
  },
];
