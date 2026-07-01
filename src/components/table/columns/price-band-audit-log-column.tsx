"use client";

import { ColumnDef } from "@tanstack/react-table";
import { useState } from "react";
import { Loader2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog/dialog";
import { useRollbackPriceBandMutation } from "@/store/slice/apiSlice";

type AuditUser = {
  firstName?: string;
  lastName?: string;
  email?: string;
};

type PriceBandSnapshot = {
  zone?: number;
  label?: string;
  serviceType?: string;
  minKg?: number;
  maxKg?: number | null;
  pricePerKg?: number;
  basePrice?: number | null;
  isActive?: boolean;
};

export type PriceBandAuditLog = {
  id: string;
  entityType?: string;
  entityId?: string;
  action?: string;
  previousValue?: PriceBandSnapshot | null;
  newValue?: PriceBandSnapshot | null;
  reason?: string | null;
  createdAt?: string;
  user?: AuditUser;
};

const formatDate = (date?: string) => {
  if (!date) return "—";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "—";
  return parsed.toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" });
};

const formatUser = (log: PriceBandAuditLog) => {
  const u = log.user;
  if (!u) return "—";
  const name = [u.firstName, u.lastName].filter(Boolean).join(" ");
  return name || u.email || "—";
};

const formatNaira = (v?: number | null) =>
  typeof v === "number" ? `₦${v.toLocaleString()}` : "—";

// Builds a short human-readable diff between previousValue and newValue,
// e.g. "pricePerKg: ₦180 → ₦220, isActive: true → false"
const diffSummary = (log: PriceBandAuditLog) => {
  const prev = log.previousValue;
  const next = log.newValue;
  if (!prev || !next) return "—";

  const fields: [keyof PriceBandSnapshot, (v: any) => string][] = [
    ["zone", (v) => `Zone ${v}`],
    ["pricePerKg", formatNaira],
    ["basePrice", formatNaira],
    ["minKg", (v) => `${v}kg`],
    ["maxKg", (v) => (v == null ? "no limit" : `${v}kg`)],
    ["isActive", (v) => (v ? "Active" : "Paused")],
  ];

  const changes = fields
    .filter(([key]) => prev[key] !== next[key])
    .map(([key, fmt]) => `${key}: ${fmt(prev[key])} → ${fmt(next[key])}`);

  return changes.length ? changes.join(", ") : "No field-level changes detected";
};

const RollbackButton = ({ log }: { log: PriceBandAuditLog }) => {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [rollback, { isLoading }] = useRollbackPriceBandMutation();

  // Can only roll back to a snapshot that actually has a previousValue —
  // matches the backend's own validation in rollbackPriceBand().
  const canRollback = Boolean(log.previousValue) && log.entityType === "PriceBand";

  const handleConfirm = async () => {
    try {
      await rollback({ auditLogId: log.id }).unwrap();
      setConfirmOpen(false);
    } catch {
      // error toast already shown by the mutation
    }
  };

  if (!canRollback) return <span className="text-xs text-gray-300">—</span>;

  return (
    <>
      <button
        onClick={() => setConfirmOpen(true)}
        className="flex items-center gap-1.5 text-xs border rounded-md px-2.5 py-1.5 text-gray-600 hover:bg-gray-50"
      >
        <RotateCcw size={13} /> Rollback
      </button>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent size="lg">
          <div className="p-6">
            <h2 className="text-lg font-semibold mb-2">Roll back price band?</h2>
            <p className="text-sm text-gray-500 mb-4">
              This restores the rate to its state{" "}
              <span className="font-medium">before</span> this change
              ({formatDate(log.createdAt)}). A new audit entry will be created —
              nothing is deleted, and this can be rolled forward again later.
            </p>
            <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-600 mb-4">
              {diffSummary(log)}
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setConfirmOpen(false)}
                className="px-4 py-2 text-sm rounded-lg border"
              >
                Cancel
              </button>
              <Button isLoading={isLoading} onClick={handleConfirm}>
                Confirm Rollback
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export const PriceBandAuditLogColumns: ColumnDef<PriceBandAuditLog>[] = [
  {
    id: "sn",
    header: "S/N",
    cell: ({ row }) => <div>{row.index + 1}</div>,
  },
  {
    id: "createdAt",
    header: "Date",
    cell: ({ row }) => <div className="text-sm">{formatDate(row.original.createdAt)}</div>,
  },
  {
    id: "action",
    header: "Action",
    cell: ({ row }) => (
      <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-600 capitalize">
        {(row.original.action ?? "update").toLowerCase()}
      </span>
    ),
  },
  {
    id: "performedBy",
    header: "Changed By",
    cell: ({ row }) => <div className="text-sm">{formatUser(row.original)}</div>,
  },
  {
    id: "changes",
    header: "Changes From Previous",
    cell: ({ row }) => (
      <div className="max-w-[320px] text-xs text-gray-600">{diffSummary(row.original)}</div>
    ),
  },
  {
    id: "reason",
    header: "Reason",
    cell: ({ row }) => (
      <div className="max-w-[200px] truncate text-xs text-gray-500">
        {row.original.reason || "—"}
      </div>
    ),
  },
  {
    id: "rollback",
    header: "Rollback",
    cell: ({ row }) => <RollbackButton log={row.original} />,
  },
];
