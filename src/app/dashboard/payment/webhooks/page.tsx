"use client";

import { useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import {
  useGetFailedWebhooksQuery,
  useRetryFailedWebhookMutation,
  useDismissFailedWebhookMutation,
} from "@/store/slice/apiSlice";
import {
  AlertTriangle,
  CheckCircle2,
  RotateCw,
  XCircle,
  Loader2,
  Inbox,
} from "lucide-react";
import { cn } from "@/lib/utils";

type FailedWebhook = {
  id: string;
  event: string;
  payload: any;
  errorMessage: string | null;
  attempts: number;
  status: "FAILED" | "RESOLVED" | "IGNORED";
  createdAt: string;
  lastRetriedAt: string | null;
  resolvedAt: string | null;
};

const STATUS_TABS = [
  { value: "FAILED", label: "Failed" },
  { value: "RESOLVED", label: "Resolved" },
  { value: "IGNORED", label: "Ignored" },
];

function StatusBadge({ status }: { status: FailedWebhook["status"] }) {
  const styles: Record<string, string> = {
    FAILED: "bg-red-50 text-red-700 border-red-200",
    RESOLVED: "bg-green-50 text-green-700 border-green-200",
    IGNORED: "bg-gray-100 text-gray-500 border-gray-200",
  };
  return (
    <span
      className={cn(
        "text-xs font-medium px-2 py-1 rounded-full border",
        styles[status],
      )}
    >
      {status}
    </span>
  );
}

export default function FailedWebhooksPage() {
  const me = useSelector((state: RootState) => state.auth.user);
  const isSuperAdmin = (me as any)?.adminSubRole === "SUPER_ADMIN";

  const [statusFilter, setStatusFilter] = useState("FAILED");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data, isLoading, isError, refetch } = useGetFailedWebhooksQuery(
    { status: statusFilter, limit: 50 },
    { skip: !isSuperAdmin, refetchOnFocus: true },
  );

  const [retry, { isLoading: retrying }] = useRetryFailedWebhookMutation();
  const [dismiss, { isLoading: dismissing }] = useDismissFailedWebhookMutation();

  const items: FailedWebhook[] = data?.data?.items ?? [];

  if (!isSuperAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3 text-gray-400">
        <AlertTriangle className="w-10 h-10 opacity-30" />
        <p className="font-medium text-gray-600">Super Admin only</p>
        <p className="text-xs text-gray-400 max-w-sm text-center">
          The webhook Dead Letter Queue is only visible to Super Admins,
          since it can contain raw payment payloads.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="dashboard-heading">Webhook Dead Letter Queue</h1>
        <p className="text-sm text-gray-400 mt-1">
          Payment webhook events that failed after {6} retry attempts. Review,
          retry, or dismiss them here.
        </p>
      </div>

      {/* Status tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-2xl p-1 w-fit">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setStatusFilter(tab.value)}
            className={cn(
              "px-4 py-2 rounded-xl text-sm font-medium transition-all",
              statusFilter === tab.value
                ? "bg-white text-brand shadow-sm"
                : "text-gray-500 hover:text-gray-700",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-brand" />
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-2">
          <XCircle className="w-12 h-12 mb-2 opacity-30" />
          <p className="font-medium text-gray-600">Failed to load webhook queue</p>
          <button onClick={() => refetch()} className="text-sm text-brand hover:underline">
            Retry
          </button>
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <Inbox className="w-12 h-12 mb-3 opacity-30" />
          <p>No {statusFilter.toLowerCase()} webhook events</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm divide-y divide-gray-100">
          {items.map((item) => (
            <div key={item.id} className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-sm font-semibold text-gray-800">
                      {item.event}
                    </span>
                    <StatusBadge status={item.status} />
                    <span className="text-xs text-gray-400">
                      {item.attempts} attempt{item.attempts !== 1 ? "s" : ""}
                    </span>
                  </div>
                  {item.errorMessage && (
                    <p className="text-xs text-red-600 truncate">
                      {item.errorMessage}
                    </p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">
                    Failed {new Date(item.createdAt).toLocaleString()}
                    {item.lastRetriedAt &&
                      ` · Last retried ${new Date(item.lastRetriedAt).toLocaleString()}`}
                  </p>
                  <button
                    onClick={() =>
                      setExpandedId(expandedId === item.id ? null : item.id)
                    }
                    className="text-xs text-brand hover:underline mt-1"
                  >
                    {expandedId === item.id ? "Hide payload" : "View payload"}
                  </button>
                  {expandedId === item.id && (
                    <pre className="mt-2 bg-gray-50 rounded-lg p-3 text-[11px] text-gray-600 overflow-x-auto max-h-64">
                      {JSON.stringify(item.payload, null, 2)}
                    </pre>
                  )}
                </div>

                {item.status === "FAILED" && (
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => retry({ id: item.id })}
                      disabled={retrying}
                      className="flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-md text-sm transition-colors disabled:opacity-50"
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                      Retry
                    </button>
                    <button
                      onClick={() => dismiss({ id: item.id })}
                      disabled={dismissing}
                      className="flex items-center gap-1.5 bg-red-50 hover:bg-red-100 text-red-600 px-3 py-1.5 rounded-md text-sm transition-colors disabled:opacity-50"
                    >
                      Dismiss
                    </button>
                  </div>
                )}
                {item.status === "RESOLVED" && (
                  <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
