"use client";

import { useParams, useRouter } from "next/navigation";
import { useGetAdhocChargeTypeHistoryQuery } from "@/store/slice/apiSlice";
import { ArrowLeft } from "lucide-react";

export default function AdhocChargeTypeHistoryPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const { data, isLoading } = useGetAdhocChargeTypeHistoryQuery(id);
  const history = (data as any)?.data?.history ?? [];

  return (
    <div className="pb-10">
      <button
        onClick={() => router.push("/dashboard/adhoc-charges")}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-4"
      >
        <ArrowLeft size={14} /> Back to Charge Types
      </button>
      <div className="text-dashboard-heading mb-6">Version History</div>

      {isLoading && <p className="text-sm text-gray-400">Loading history...</p>}
      {!isLoading && history.length === 0 && (
        <p className="text-sm text-gray-400">No history recorded yet.</p>
      )}

      <div className="space-y-3">
        {history.map((entry: any) => (
          <div
            key={entry.id}
            className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <span
                className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                  entry.action === "CREATE"
                    ? "bg-green-100 text-green-600"
                    : "bg-blue-100 text-blue-600"
                }`}
              >
                {entry.action}
              </span>
              <span className="text-xs text-gray-400">
                {new Date(entry.createdAt).toLocaleString()}
              </span>
            </div>
            <p className="text-sm text-gray-700 mt-2">
              By{" "}
              {entry.user
                ? `${entry.user.firstName ?? ""} ${entry.user.lastName ?? ""}`.trim() ||
                  entry.user.email
                : "Unknown"}
            </p>
            {entry.reason && (
              <p className="text-xs text-gray-500 mt-1">Reason: {entry.reason}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
