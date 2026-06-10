import { ColumnDef } from "@tanstack/react-table";

export type ClaimStatus =
  | "PENDING"
  | "IN_REVIEW"
  | "APPROVED"
  | "REJECTED"
  | "PAID"
  | "CLOSED";

export type Claim = {
  id: string;
  shipmentId: string;
  type: string;
  description: string;
  declaredValue: number;
  claimAmount: number;
  status?: ClaimStatus;
  bankName?: string;
  accountNumber?: string;
  accountName?: string;
  createdAt?: string;
};

const formatText = (value?: string) =>
  value ? value.toLowerCase().replaceAll("_", " ") : "-";

const formatMoney = (amount?: number) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(amount ?? 0);

const formatDate = (date?: string) => {
  if (!date) return "-";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) return "-";

  return parsedDate.toLocaleDateString();
};

export const ClaimColumns: ColumnDef<Claim>[] = [
  {
    id: "sn",
    header: "S/N",
    cell: ({ row }) => <div>{row.index + 1}</div>,
  },
  {
    accessorKey: "shipmentId",
    header: "Shipment ID",
    cell: ({ row }) => (
      <div className="max-w-[180px] truncate font-mono text-xs">
        {row.original.shipmentId}
      </div>
    ),
  },
  {
    accessorKey: "type",
    header: "Type",
    cell: ({ row }) => <div className="capitalize">{formatText(row.original.type)}</div>,
  },
  {
    accessorKey: "description",
    header: "Description",
    cell: ({ row }) => (
      <div className="max-w-[240px] truncate text-xs text-gray-500">
        {row.original.description}
      </div>
    ),
  },
  {
    accessorKey: "declaredValue",
    header: "Declared Value",
    cell: ({ row }) => <div>{formatMoney(row.original.declaredValue)}</div>,
  },
  {
    accessorKey: "claimAmount",
    header: "Claim Amount",
    cell: ({ row }) => <div>{formatMoney(row.original.claimAmount)}</div>,
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <span className="rounded-full bg-gray-100 px-2 py-1 text-xs capitalize text-gray-600">
        {formatText(row.original.status)}
      </span>
    ),
  },
  {
    accessorKey: "createdAt",
    header: "Date",
    cell: ({ row }) => <div>{formatDate(row.original.createdAt)}</div>,
  },
];
