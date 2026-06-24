"use client";

import { useState } from "react";
import {
  useGetNotificationsQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
  useDeleteNotificationMutation,
  useBulkDeleteNotificationsMutation,
} from "@/store/slice/apiSlice";
import {
  Bell,
  CheckCheck,
  Trash2,
  Package,
  CreditCard,
  Tag,
  AlertTriangle,
  Info,
  Clock,
  CheckSquare,
  Square,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

// ─── Types ────────────────────────────────────────────────────────────────────
type Notification = {
  id: string;
  type: string;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
  data?: Record<string, any>;
};

// ─── Type icon + colour ───────────────────────────────────────────────────────
const TYPE_CONFIG: Record<string, { icon: any; bg: string; text: string }> = {
  SHIPMENT_UPDATE:  { icon: Package,       bg: "bg-blue-50",   text: "text-blue-600"   },
  PAYMENT:          { icon: CreditCard,    bg: "bg-green-50",  text: "text-green-600"  },
  PROMO:            { icon: Tag,           bg: "bg-purple-50", text: "text-purple-600" },
  DELAY_ALERT:      { icon: AlertTriangle, bg: "bg-amber-50",  text: "text-amber-600"  },
  PRICE_ADJUSTMENT: { icon: AlertTriangle, bg: "bg-orange-50", text: "text-orange-600" },
  SYSTEM:           { icon: Info,          bg: "bg-gray-100",  text: "text-gray-500"   },
};

function NotifIcon({ type }: { type: string }) {
  const cfg = TYPE_CONFIG[type] ?? TYPE_CONFIG.SYSTEM;
  const Icon = cfg.icon;
  return (
    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${cfg.bg}`}>
      <Icon className={`w-4 h-4 ${cfg.text}`} />
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function NotificationsPage() {
  const [page, setPage] = useState(1);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const { data, isLoading, isFetching, refetch } = useGetNotificationsQuery(
    { page, ...(unreadOnly ? { unreadOnly: true } : {}) } as any,
    { refetchOnFocus: true },
  );

  const [markRead]        = useMarkNotificationReadMutation();
  const [markAllRead]     = useMarkAllNotificationsReadMutation();
  const [deleteOne]       = useDeleteNotificationMutation();
  const [bulkDelete, { isLoading: isBulkDeleting }] = useBulkDeleteNotificationsMutation();

  const notifications: Notification[] = data?.data?.notifications ?? [];
  const unreadCount: number           = data?.data?.unreadCount   ?? 0;
  const totalPages: number            = data?.meta?.totalPages    ?? 1;

  const allSelected = notifications.length > 0 && notifications.every(n => selected.has(n.id));
  const someSelected = selected.size > 0;

  // ── Selection helpers ──────────────────────────────────────────────────────
  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(notifications.map(n => n.id)));
    }
  };

  // ── Actions ────────────────────────────────────────────────────────────────
  const handleMarkRead = async (id: string, isRead: boolean) => {
    if (isRead) return;
    await markRead({ id });
    refetch();
  };

  const handleMarkAll = async () => {
    await markAllRead();
    refetch();
  };

  const handleDeleteOne = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await deleteOne({ id });
    setSelected(prev => { const next = new Set(prev); next.delete(id); return next; });
    refetch();
  };

  const handleBulkDelete = async () => {
    const ids = Array.from(selected);
    await bulkDelete({ ids });
    setSelected(new Set());
    refetch();
  };

  const handleDeleteAll = async () => {
    if (!confirm("Delete all notifications? This cannot be undone.")) return;
    await bulkDelete({}); // no ids = delete all
    setSelected(new Set());
    refetch();
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gray-900 flex items-center justify-center">
            <Bell className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Notifications</h1>
            <p className="text-xs text-gray-400 mt-0.5">
              {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAll}
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <CheckCheck className="w-4 h-4" />
              Mark all read
            </button>
          )}
          {notifications.length > 0 && (
            <button
              onClick={handleDeleteAll}
              className="flex items-center gap-1.5 text-sm text-red-400 hover:text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Clear all
            </button>
          )}
        </div>
      </div>

      {/* Filter row */}
      <div className="flex items-center gap-2 mb-4">
        {[
          { label: "All", value: false },
          { label: "Unread", value: true },
        ].map((f) => (
          <button
            key={String(f.value)}
            onClick={() => { setUnreadOnly(f.value); setPage(1); setSelected(new Set()); }}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              unreadOnly === f.value
                ? "bg-gray-900 text-white"
                : "bg-gray-100 text-gray-500 hover:bg-gray-200"
            }`}
          >
            {f.label}
            {f.value && unreadCount > 0 && (
              <span className="ml-1.5 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {unreadCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Bulk action bar — shown when items are selected */}
      {someSelected && (
        <div className="flex items-center justify-between bg-gray-900 text-white rounded-xl px-4 py-2.5 mb-3">
          <span className="text-sm font-medium">
            {selected.size} selected
          </span>
          <button
            onClick={handleBulkDelete}
            disabled={isBulkDeleting}
            className="flex items-center gap-1.5 text-sm text-red-300 hover:text-red-200 transition-colors disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" />
            {isBulkDeleting ? "Deleting…" : `Delete ${selected.size}`}
          </button>
        </div>
      )}

      {/* List */}
      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
        {/* Select-all header */}
        {!isLoading && notifications.length > 0 && (
          <div className="flex items-center gap-3 px-4 py-2.5 border-b border-gray-50 bg-gray-50/60">
            <button onClick={toggleSelectAll} className="text-gray-400 hover:text-gray-700 transition-colors">
              {allSelected
                ? <CheckSquare className="w-4 h-4 text-gray-800" />
                : <Square className="w-4 h-4" />
              }
            </button>
            <span className="text-xs text-gray-400 font-medium">
              {allSelected ? "Deselect all" : "Select all"}
            </span>
          </div>
        )}

        {isLoading ? (
          <div className="divide-y divide-gray-50">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-start gap-3 p-4 animate-pulse">
                <div className="w-9 h-9 rounded-xl bg-gray-100 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-gray-100 rounded w-1/3" />
                  <div className="h-3 bg-gray-100 rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-16 text-center">
            <Bell className="w-10 h-10 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 font-medium text-sm">
              {unreadOnly ? "No unread notifications" : "No notifications yet"}
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-50">
            {notifications.map((n) => {
              const isSelected = selected.has(n.id);
              return (
                <li
                  key={n.id}
                  onClick={() => handleMarkRead(n.id, n.isRead)}
                  className={`flex items-start gap-3 px-4 py-4 transition-colors cursor-pointer group ${
                    isSelected
                      ? "bg-blue-50/50"
                      : n.isRead
                      ? "hover:bg-gray-50/60"
                      : "bg-blue-50/30 hover:bg-blue-50/60"
                  }`}
                >
                  {/* Checkbox */}
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleSelect(n.id); }}
                    className="mt-0.5 text-gray-300 hover:text-gray-600 transition-colors shrink-0"
                  >
                    {isSelected
                      ? <CheckSquare className="w-4 h-4 text-gray-800" />
                      : <Square className="w-4 h-4" />
                    }
                  </button>

                  <NotifIcon type={n.type} />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={`text-sm truncate ${n.isRead ? "font-normal text-gray-700" : "font-semibold text-gray-900"}`}>
                        {n.title}
                      </p>
                      {!n.isRead && (
                        <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.body}</p>
                    <div className="flex items-center gap-1 mt-1.5 text-[11px] text-gray-400">
                      <Clock className="w-3 h-3" />
                      {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                    </div>
                  </div>

                  {/* Single delete — visible on hover */}
                  <button
                    onClick={(e) => handleDeleteOne(e, n.id)}
                    className="opacity-0 group-hover:opacity-100 shrink-0 mt-0.5 text-gray-300 hover:text-red-500 transition-all"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1 || isFetching}
            className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            ← Prev
          </button>
          <span className="text-sm text-gray-500">{page} / {totalPages}</span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages || isFetching}
            className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
