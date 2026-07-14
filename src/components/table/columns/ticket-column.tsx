"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog/dialog";
import { ColumnDef } from "@tanstack/react-table";
import { useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { Eye, MoreHorizontal, Loader2, MessageSquareText } from "lucide-react";
import * as Popover from "@radix-ui/react-popover";
import {
  useUpdateTicketMutation,
  useGetUsersQuery,
  useGetTicketByIdQuery,
  useReplyToTicketMutation,
  useGetCannedResponsesQuery,
} from "@/store/slice/apiSlice";
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
  trackingNumber: string | null;
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
        {row.getValue<string | null>("trackingNumber") || "—"}
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
    cell: ({ row, table }) => {
      const ticket = row.original;
      const user = useSelector((s: RootState) => s.auth.user) as any;
      const isAdmin = user?.role === "ADMIN";
      // Explicit fallback refresh — see TicketTableView's <AppTable meta={...}>.
      // RTK Query's invalidatesTags on UpdateTicket/AssignTicket should
      // already refetch this list automatically; this guarantees it happens
      // even if that doesn't fire for some reason, rather than leaving the
      // row showing a stale status until a manual page reload.
      const refetchTickets = (table.options.meta as any)?.refetchTickets as
        | (() => void)
        | undefined;

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

          {/* ⋯ MORE ACTIONS (admin only — assign/status/priority are admin operations) */}
          {isAdmin && (
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
                  <button
                    onClick={() => setIsAssignOpen(true)}
                    className="px-3 py-2 text-left hover:bg-gray-50 rounded-md"
                  >
                    Assign Ticket
                  </button>
                  <button
                    onClick={() => setIsStatusOpen(true)}
                    className="px-3 py-2 text-left hover:bg-gray-50 rounded-md"
                  >
                    Update Status
                  </button>
                  <button
                    onClick={() => setIsPriorityOpen(true)}
                    className="px-3 py-2 text-left hover:bg-gray-50 rounded-md"
                  >
                    Update Priority
                  </button>
                </div>
              </Popover.Content>
            </Popover.Root>
          )}

          {/* ───── MODALS ───── */}

          {/* VIEW */}
          <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
            <DialogContent size="lg">
              {isDetailsOpen && <TicketDetails ticketId={ticket.id} />}
            </DialogContent>
          </Dialog>

          {/* ASSIGN */}
          <Dialog open={isAssignOpen} onOpenChange={setIsAssignOpen}>
            <DialogContent>
              <AssignTicketForm
                ticketId={ticket.id}
                onDone={() => {
                  setIsAssignOpen(false);
                  refetchTickets?.();
                }}
              />
            </DialogContent>
          </Dialog>

          {/* STATUS */}
          <Dialog open={isStatusOpen} onOpenChange={setIsStatusOpen}>
            <DialogContent>
              <UpdateTicketFieldForm
                ticketId={ticket.id}
                field="status"
                currentValue={ticket.status}
                options={[
                  "OPEN",
                  "IN_PROGRESS",
                  "RESOLVED",
                  "CLOSED",
                  "ESCALATED",
                ]}
                title="Update Status"
                onDone={() => {
                  setIsStatusOpen(false);
                  refetchTickets?.();
                }}
              />
            </DialogContent>
          </Dialog>

          {/* PRIORITY */}
          <Dialog open={isPriorityOpen} onOpenChange={setIsPriorityOpen}>
            <DialogContent>
              <UpdateTicketFieldForm
                ticketId={ticket.id}
                field="priority"
                currentValue={ticket.priority}
                options={["LOW", "NORMAL", "HIGH", "URGENT"]}
                title="Update Priority"
                onDone={() => {
                  setIsPriorityOpen(false);
                  refetchTickets?.();
                }}
              />
            </DialogContent>
          </Dialog>
        </div>
      );
    },
  },
];

/* ───────────────── ASSIGN / STATUS / PRIORITY FORMS ─────────────────
 * FIX: these were "(TODO)" placeholders that did nothing. Now wired to
 * PATCH /support/tickets/:id via useUpdateTicketMutation.
 */

const AssignTicketForm = ({
  ticketId,
  onDone,
}: {
  ticketId: string;
  onDone: () => void;
}) => {
  const [selected, setSelected] = useState("");
  const [updateTicket, { isLoading }] = useUpdateTicketMutation();
  // Internal ticket agents are ROLE_ADMIN staff (capability-based, matches
  // backend's auto-assignment logic in support.controller.js::autoAssignTicket
  // which checks the canManageTickets capability flag — there's no dedicated
  // "list users by capability" endpoint, so this shows all ROLE_ADMIN staff).
  const { data, isLoading: loadingAgents } = useGetUsersQuery({
    role: "ADMIN",
    adminSubRole: "ROLE_ADMIN",
  });
  const agents: any[] =
    (data as any)?.data?.users ?? (data as any)?.users ?? [];

  const handleAssign = async () => {
    if (!selected) return;
    try {
      await updateTicket({ id: ticketId, assignedToId: selected }).unwrap();
      onDone();
    } catch {
      // error toast already shown by the mutation
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-lg font-semibold mb-4">Assign Ticket</h2>
      {loadingAgents ? (
        <div className="flex items-center gap-2 text-sm text-gray-500 py-4">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading agents...
        </div>
      ) : agents.length === 0 ? (
        <p className="text-sm text-gray-400 py-4">
          No support agents found. Add a user with the Agent role first.
        </p>
      ) : (
        <select
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm mb-4"
        >
          <option value="">Select an agent</option>
          {agents.map((a) => (
            <option key={a.id} value={a.id}>
              {a.firstName} {a.lastName} ({a.email})
            </option>
          ))}
        </select>
      )}
      <Button
        className="w-full"
        isLoading={isLoading}
        disabled={!selected}
        onClick={handleAssign}
      >
        Assign
      </Button>
    </div>
  );
};

const UpdateTicketFieldForm = ({
  ticketId,
  field,
  currentValue,
  options,
  title,
  onDone,
}: {
  ticketId: string;
  field: "status" | "priority";
  currentValue: string;
  options: string[];
  title: string;
  onDone: () => void;
}) => {
  const [value, setValue] = useState(currentValue);
  const [updateTicket, { isLoading }] = useUpdateTicketMutation();

  const handleUpdate = async () => {
    try {
      await updateTicket({ id: ticketId, [field]: value } as any).unwrap();
      onDone();
    } catch {
      // error toast already shown by the mutation
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-lg font-semibold mb-4">{title}</h2>
      <select
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm mb-4"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {formatText(o)}
          </option>
        ))}
      </select>
      <Button className="w-full" isLoading={isLoading} onClick={handleUpdate}>
        Save
      </Button>
    </div>
  );
};

/* ───────────────── DETAILS (thread + reply + customer context) ───────────────── */

const formatNaira = (kobo?: number | null) =>
  typeof kobo === "number" ? `₦${(kobo / 100).toLocaleString()}` : "—";

const formatDate = (d?: string | null) =>
  d
    ? new Date(d).toLocaleString("en-NG", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "—";

const TicketDetails = ({ ticketId }: { ticketId: string }) => {
  const currentUser = useSelector((s: RootState) => s.auth.user) as any;
  const isAdmin = currentUser?.role === "ADMIN";

  const { data, isLoading, isError } = useGetTicketByIdQuery(ticketId);
  const [replyToTicket, { isLoading: isReplying }] = useReplyToTicketMutation();
  const { data: cannedData } = useGetCannedResponsesQuery(undefined, {
    skip: !isAdmin,
  });
  const cannedResponses: { id: string; title: string; body: string }[] =
    (cannedData as any)?.data?.cannedResponses ??
    (cannedData as any)?.data ??
    [];
  const [showCannedPicker, setShowCannedPicker] = useState(false);

  const [replyBody, setReplyBody] = useState("");
  const [isInternal, setIsInternal] = useState(false);

  const payload: any = (data as any)?.data ?? data ?? {};
  const ticket = payload.ticket;
  const customerContext = payload.customerContext;

  const handleReply = async () => {
    if (!replyBody.trim()) return;
    try {
      await replyToTicket({
        id: ticketId,
        body: replyBody,
        isInternal,
      }).unwrap();
      setReplyBody("");
      setIsInternal(false);
    } catch {
      // error toast already shown by the mutation
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center gap-2 text-sm text-gray-500">
        <Loader2 className="w-4 h-4 animate-spin" /> Loading ticket...
      </div>
    );
  }

  if (isError || !ticket) {
    return (
      <div className="p-6 text-sm text-red-500">Unable to load ticket.</div>
    );
  }

  return (
    <div className="p-6">
      <h2 className="text-lg font-semibold mb-1">{ticket.subject}</h2>
      <div className="flex flex-wrap gap-2 mb-4">
        <CategoryBadge category={ticket.category} />
        <PriorityBadge priority={ticket.priority} />
        <StatusBadge status={ticket.status} />
      </div>

      <div className="grid grid-cols-2 gap-2 text-sm mb-5 bg-gray-50 rounded-lg p-3">
        <div>
          <span className="text-gray-500">Customer: </span>
          {ticket.username || "—"}
        </div>
        <div>
          <span className="text-gray-500">Email: </span>
          {ticket.email || "—"}
        </div>
        <div>
          <span className="text-gray-500">Tracking No.: </span>
          {ticket.trackingNumber || "—"}
        </div>
        <div>
          <span className="text-gray-500">Assigned to: </span>
          {ticket.assignedTo
            ? `${ticket.assignedTo.firstName} ${ticket.assignedTo.lastName}`
            : "Unassigned"}
        </div>
      </div>

      {/* Agent-only: customer context card — last 5 shipments + payments */}
      {isAdmin && customerContext && (
        <div className="mb-5 border border-gray-200 rounded-lg p-3">
          <h3 className="text-sm font-semibold mb-2">Customer Context</h3>
          <div className="text-xs text-gray-500 mb-1">Last 5 shipments</div>
          {customerContext.recentShipments?.length ? (
            <div className="space-y-1 mb-3">
              {customerContext.recentShipments.map((s: any, i: number) => (
                <div
                  key={i}
                  className="flex justify-between text-xs bg-gray-50 rounded px-2 py-1.5"
                >
                  <span className="font-mono">{s.trackingNumber}</span>
                  <span>{formatText(s.status)}</span>
                  <span>{formatNaira(s.quotedPrice)}</span>
                  <span className="text-gray-400">
                    {formatDate(s.createdAt)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-xs text-gray-400 mb-3">No shipments yet.</div>
          )}
          <div className="text-xs text-gray-500 mb-1">Last 5 payments</div>
          {customerContext.recentPayments?.length ? (
            <div className="space-y-1">
              {customerContext.recentPayments.map((p: any, i: number) => (
                <div
                  key={i}
                  className="flex justify-between text-xs bg-gray-50 rounded px-2 py-1.5"
                >
                  <span className="font-mono">{p.reference}</span>
                  <span>{formatText(p.status)}</span>
                  <span>{formatNaira(p.amountKobo)}</span>
                  <span className="text-gray-400">{formatDate(p.paidAt)}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-xs text-gray-400">No payments yet.</div>
          )}
        </div>
      )}

      {/* Message thread */}
      <div className="mb-4">
        <h3 className="text-sm font-semibold mb-2">Conversation</h3>
        <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
          {ticket.messages?.length ? (
            ticket.messages.map((m: any) => {
              const isMine = m.senderId === currentUser?.id;
              const isCustomerMsg = m.senderId === ticket.customerId;
              return (
                <div
                  key={m.id}
                  className={`rounded-lg px-3 py-2 text-sm max-w-[85%] ${
                    m.isInternal
                      ? "bg-yellow-50 border border-yellow-200 ml-auto"
                      : isCustomerMsg
                        ? "bg-gray-100"
                        : "bg-brand/10 ml-auto"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3 mb-1">
                    <span className="text-xs font-medium text-gray-600">
                      {isMine ? "You" : isCustomerMsg ? "Customer" : "Agent"}
                      {m.isInternal && " · Internal note"}
                    </span>
                    <span className="text-[10px] text-gray-400">
                      {formatDate(m.createdAt)}
                    </span>
                  </div>
                  <div className="whitespace-pre-wrap">{m.body}</div>
                </div>
              );
            })
          ) : (
            <div className="text-xs text-gray-400">No messages yet.</div>
          )}
        </div>
      </div>

      {/* Reply box */}
      {ticket.status !== "CLOSED" && (
        <div className="border-t pt-3">
          {isAdmin && cannedResponses.length > 0 && (
            <div className="relative mb-2">
              <button
                type="button"
                onClick={() => setShowCannedPicker((v) => !v)}
                className="flex items-center gap-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg px-2.5 py-1.5 hover:bg-gray-50"
              >
                <MessageSquareText className="w-3.5 h-3.5" />
                Insert Canned Response
              </button>
              {showCannedPicker && (
                <div className="absolute z-10 mt-1 w-80 max-h-56 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg">
                  {cannedResponses.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        // Append rather than replace, so an agent can still
                        // add a personal line before/after the template.
                        setReplyBody((prev) =>
                          prev ? `${prev}\n\n${c.body}` : c.body,
                        );
                        setShowCannedPicker(false);
                      }}
                      className="w-full text-left px-3 py-2 text-xs hover:bg-gray-50 border-b border-gray-100 last:border-0"
                    >
                      <div className="font-medium text-gray-700">{c.title}</div>
                      <div className="text-gray-400 truncate">{c.body}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          <textarea
            value={replyBody}
            onChange={(e) => setReplyBody(e.target.value)}
            placeholder="Write a reply..."
            rows={3}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none mb-2"
          />
          <div className="flex items-center justify-between">
            {isAdmin && (
              <label className="flex items-center gap-2 text-xs text-gray-500">
                <input
                  type="checkbox"
                  checked={isInternal}
                  onChange={(e) => setIsInternal(e.target.checked)}
                />
                Internal note (hidden from customer)
              </label>
            )}
            <Button
              className="ml-auto"
              isLoading={isReplying}
              disabled={!replyBody.trim()}
              onClick={handleReply}
            >
              Send Reply
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
