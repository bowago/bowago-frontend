import { ColumnDef } from "@tanstack/react-table";

type AuditUser = {
  firstName?: string;
  lastName?: string;
  name?: string;
  email?: string;
};

export type SurchargeAuditLog = {
  id?: string;
  action?: string;
  entityType?: string;
  entityId?: string;
  description?: string;
  reason?: string;
  changes?: unknown;
  metadata?: unknown;
  oldValue?: unknown;
  newValue?: unknown;
  createdAt?: string;
  updatedAt?: string;
  performedBy?: AuditUser;
  actor?: AuditUser;
  user?: AuditUser;
};

const formatDate = (date?: string) => {
  if (!date) return "-";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) return "-";

  return parsedDate.toLocaleString();
};

const formatUser = (log: SurchargeAuditLog) => {
  const user = log.performedBy ?? log.actor ?? log.user;

  if (!user) return "-";

  const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ");

  return fullName || user.name || user.email || "-";
};

const formatDetails = (log: SurchargeAuditLog) => {
  const details =
    log.description ??
    log.reason ??
    log.changes ??
    log.metadata ??
    log.newValue ??
    log.oldValue;

  if (!details) return "-";

  if (typeof details === "string") return details;

  try {
    return JSON.stringify(details);
  } catch {
    return "-";
  }
};

export const SurchargeAuditLogColumns: ColumnDef<SurchargeAuditLog>[] = [
  {
    id: "sn",
    header: "S/N",
    cell: ({ row }) => <div>{row.index + 1}</div>,
  },
  {
    accessorKey: "action",
    header: "Action",
    cell: ({ row }) => (
      <div className="capitalize">
        {String(row.original.action ?? "-").toLowerCase().replaceAll("_", " ")}
      </div>
    ),
  },
  {
    accessorKey: "entityType",
    header: "Entity",
    cell: ({ row }) => <div>{row.original.entityType ?? "Surcharge"}</div>,
  },
  {
    accessorKey: "entityId",
    header: "Entity ID",
    cell: ({ row }) => (
      <div className="max-w-[160px] truncate">{row.original.entityId ?? "-"}</div>
    ),
  },
  {
    id: "performedBy",
    header: "Performed By",
    cell: ({ row }) => <div>{formatUser(row.original)}</div>,
  },
  {
    id: "details",
    header: "Details",
    cell: ({ row }) => (
      <div className="max-w-[280px] truncate text-xs text-gray-500">
        {formatDetails(row.original)}
      </div>
    ),
  },
  {
    id: "createdAt",
    header: "Date",
    cell: ({ row }) => (
      <div>{formatDate(row.original.createdAt ?? row.original.updatedAt)}</div>
    ),
  },
];
