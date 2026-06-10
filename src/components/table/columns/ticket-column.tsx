"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog/dialog";
import { ColumnDef } from "@tanstack/react-table";
import { useState } from "react";
import { Eye, MoreHorizontal } from "lucide-react";
import * as Popover from "@radix-ui/react-popover";
/* ───────────────── TYPES ───────────────── */

export type TicketCategory =
  | "TRACKING"
  | "PAYMENT"
  | "PRICING_DISPUTE"
  | "DAMAGED_GOODS"
  | "DELIVERY_ISSUE"
  | "ACCOUNT"
  | "OTHER";

export type TicketStatus =
  | "OPEN"
  | "IN_PROGRESS"
  | "RESOLVED"
  | "CLOSED"
  | "ESCALATED";

export type TicketPriority = "LOW" | "NORMAL" | "HIGH" | "URGENT";

export type Ticket = {
  id: string;
  subject: string;
  category: TicketCategory;
  trackingNumber: string;
  priority: TicketPriority;
  status: TicketStatus;
  email: string;
  username: string;
};

/* ───────────────── HELPERS ───────────────── */

const formatText = (val: string) =>
  val
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

/* ───────────────── BADGES ───────────────── */

const StatusBadge = ({ status }: { status: TicketStatus }) => {
  const styles: Record<TicketStatus, string> = {
    OPEN: "bg-yellow-100 text-yellow-600",
    IN_PROGRESS: "bg-blue-100 text-blue-600",
    RESOLVED: "bg-green-100 text-green-600",
    CLOSED: "bg-gray-100 text-gray-600",
    ESCALATED: "bg-red-100 text-red-600",
  };

  return (
    <span className={`px-2 py-1 text-xs rounded-full ${styles[status]}`}>
      {formatText(status)}
    </span>
  );
};

const PriorityBadge = ({ priority }: { priority: TicketPriority }) => {
  const styles: Record<TicketPriority, string> = {
    LOW: "bg-gray-100 text-gray-500",
    NORMAL: "bg-blue-100 text-blue-600",
    HIGH: "bg-orange-100 text-orange-600",
    URGENT: "bg-red-100 text-red-600",
  };

  return (
    <span className={`px-2 py-1 text-xs rounded-full ${styles[priority]}`}>
      {formatText(priority)}
    </span>
  );
};

const CategoryBadge = ({ category }: { category: TicketCategory }) => {
  const styles: Record<TicketCategory, string> = {
    TRACKING: "bg-blue-100 text-blue-600",
    PAYMENT: "bg-green-100 text-green-600",
    PRICING_DISPUTE: "bg-orange-100 text-orange-600",
    DAMAGED_GOODS: "bg-red-100 text-red-600",
    DELIVERY_ISSUE: "bg-yellow-100 text-yellow-600",
    ACCOUNT: "bg-purple-100 text-purple-600",
    OTHER: "bg-gray-100 text-gray-500",
  };

  return (
    <span className={`px-2 py-1 text-xs rounded-full ${styles[category]}`}>
      {formatText(category)}
    </span>
  );
};

/* ───────────────── COLUMNS ───────────────── */

export const TicketColumns: ColumnDef<Ticket>[] = [
  // S/N
  {
    header: "S/N",
    cell: ({ row }) => <div>{row.index + 1}</div>,
  },

  // Subject
  {
    accessorKey: "subject",
    header: "Subject",
    cell: ({ row }) => (
      <div className="text-sm font-medium text-gray-900">
        {row.getValue<string>("subject")}
      </div>
    ),
  },

  // User
  {
    id: "user",
    header: "User",
    cell: ({ row }) => {
      const { username, email } = row.original;

      return (
        <div className="text-xs">
          <div className="font-medium">{username}</div>
          <div className="text-gray-400">{email}</div>
        </div>
      );
    },
  },

  // Tracking
  {
    accessorKey: "trackingNumber",
    header: "Tracking No.",
    cell: ({ row }) => (
      <span className="font-mono text-xs text-gray-500">
        {row.getValue<string>("trackingNumber")}
      </span>
    ),
  },

  // Category
  {
    accessorKey: "category",
    header: "Category",
    cell: ({ row }) => (
      <CategoryBadge category={row.getValue<TicketCategory>("category")} />
    ),
  },

  // Priority
  {
    accessorKey: "priority",
    header: "Priority",
    cell: ({ row }) => (
      <PriorityBadge priority={row.getValue<TicketPriority>("priority")} />
    ),
  },

  // Status
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <StatusBadge status={row.getValue<TicketStatus>("status")} />
    ),
  },

  // Actions
  {
    id: "action",
    header: "Action",
    cell: ({ row }) => {
      const ticket = row.original;

      const [isDetailsOpen, setIsDetailsOpen] = useState(false);
      const [isAssignOpen, setIsAssignOpen] = useState(false);
      const [isStatusOpen, setIsStatusOpen] = useState(false);
      const [isPriorityOpen, setIsPriorityOpen] = useState(false);

      return (
        <div className="flex items-center gap-2">
          {/* 👁 VIEW */}
          <button
            onClick={() => setIsDetailsOpen(true)}
            className="p-2 rounded-md border text-gray-500 hover:bg-gray-50"
          >
            <Eye size={16} />
          </button>

          {/* ⋯ MORE ACTIONS */}
          <Popover.Root>
            <Popover.Trigger asChild>
              <button className="p-2 rounded-md border text-gray-500 hover:bg-gray-50">
                <MoreHorizontal size={16} />
              </button>
            </Popover.Trigger>

            <Popover.Content
              align="end"
              sideOffset={6}
              className="bg-white rounded-lg shadow-lg border w-44 p-1 z-50"
            >
              <div className="flex flex-col text-sm">
                {/* ASSIGN */}
                <button
                  onClick={() => setIsAssignOpen(true)}
                  className="px-3 py-2 text-left hover:bg-gray-50 rounded-md"
                >
                  Assign Ticket
                </button>

                {/* STATUS */}
                <button
                  onClick={() => setIsStatusOpen(true)}
                  className="px-3 py-2 text-left hover:bg-gray-50 rounded-md"
                >
                  Update Status
                </button>

                {/* PRIORITY */}
                <button
                  onClick={() => setIsPriorityOpen(true)}
                  className="px-3 py-2 text-left hover:bg-gray-50 rounded-md"
                >
                  Update Priority
                </button>
              </div>
            </Popover.Content>
          </Popover.Root>

          {/* ───── MODALS ───── */}

          {/* VIEW */}
          <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
            <DialogContent>
              <TicketDetails ticket={ticket} />
            </DialogContent>
          </Dialog>

          {/* ASSIGN */}
          <Dialog open={isAssignOpen} onOpenChange={setIsAssignOpen}>
            <DialogContent>
              <div className="p-6 text-center">Assign Ticket (TODO)</div>
            </DialogContent>
          </Dialog>

          {/* STATUS */}
          <Dialog open={isStatusOpen} onOpenChange={setIsStatusOpen}>
            <DialogContent>
              <div className="p-6 text-center">Update Status (TODO)</div>
            </DialogContent>
          </Dialog>

          {/* PRIORITY */}
          <Dialog open={isPriorityOpen} onOpenChange={setIsPriorityOpen}>
            <DialogContent>
              <div className="p-6 text-center">Update Priority (TODO)</div>
            </DialogContent>
          </Dialog>
        </div>
      );
    },
  },
];

/* ───────────────── DETAILS ───────────────── */

const TicketDetails = ({ ticket }: { ticket: Ticket }) => {
  const rows: [string, string][] = [
    ["Subject", ticket.subject],
    ["User", ticket.username],
    ["Email", ticket.email],
    ["Tracking No.", ticket.trackingNumber],
    ["Category", formatText(ticket.category)],
    ["Priority", formatText(ticket.priority)],
    ["Status", formatText(ticket.status)],
  ];

  return (
    <div className="p-6">
      <h2 className="text-lg font-semibold mb-4">Ticket Details</h2>

      <div className="space-y-2">
        {rows.map(([label, value]) => (
          <div key={label} className="flex justify-between text-sm">
            <span className="text-gray-500">{label}</span>
            <span className="font-medium">{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
