"use client";

/**
 * Admin: Address Change Requests — Sprint 5
 *
 * PRD DoD: "A user can initiate an address change request that appears in
 * the Admin dashboard." The backend (addressChange.routes.js /
 * addressChange.controller.js) fully supported this already; this page is
 * the missing admin-side UI to view and approve/reject requests.
 */

import { useState } from "react";
import {
  useListAddressChangeRequestsQuery,
  useReviewAddressChangeMutation,
} from "@/store/slice/apiSlice";
import { MapPin, CheckCircle2, XCircle, Loader2 } from "lucide-react";

type AddressChangeRequest = {
  id: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  newRecipientAddress: string;
  newRecipientCity: string;
  newRecipientState: string;
  reason?: string | null;
  reviewNote?: string | null;
  createdAt: string;
  shipment?: {
    trackingNumber: string;
    senderCity: string;
    recipientCity: string;
    recipientAddress?: string;
    recipientState?: string;
    status: string;
  };
  user?: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
  };
};

function getRequests(response: any): AddressChangeRequest[] {
  return response?.data?.requests ?? response?.requests ?? [];
}

const STATUS_TABS = [
  { label: "Pending", value: "PENDING" },
  { label: "Approved", value: "APPROVED" },
  { label: "Rejected", value: "REJECTED" },
  { label: "All", value: "" },
];

export default function AddressChangesAdminPage() {
  const [status, setStatus] = useState("PENDING");
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState<Record<string, string>>({});

  const { data, isLoading, isError } = useListAddressChangeRequestsQuery({
    status: status || undefined,
  });
  const [reviewAddressChange, { isLoading: reviewing }] =
    useReviewAddressChangeMutation();

  const requests = getRequests(data);

  const handleReview = async (id: string, action: "APPROVE" | "REJECT") => {
    setReviewingId(id);
    try {
      await reviewAddressChange({
        id,
        action,
        reviewNote: noteDraft[id] || undefined,
      }).unwrap();
    } catch {
      // error toast already shown by the mutation
    } finally {
      setReviewingId(null);
    }
  };

  return (
    <div className="pb-10">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="text-dashboard-heading">Address Change Requests</div>
          <p className="text-sm text-gray-500 mt-1">
            Review delivery address changes requested by customers after
            booking.
          </p>
        </div>
      </div>

      <div className="flex gap-2 mb-5">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setStatus(tab.value)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              status === tab.value
                ? "bg-brand text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {isLoading && (
        <div className="flex items-center gap-2 text-gray-500 text-sm py-10 justify-center">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading requests...
        </div>
      )}

      {isError && (
        <p className="text-sm text-red-500 py-10 text-center">
          Failed to load address change requests.
        </p>
      )}

      {!isLoading && !isError && requests.length === 0 && (
        <p className="text-sm text-gray-400 py-10 text-center">
          No {status ? status.toLowerCase() : ""} address change requests.
        </p>
      )}

      <div className="space-y-3">
        {requests.map((req) => (
          <div
            key={req.id}
            className="border border-gray-200 rounded-xl p-4 bg-white"
          >
            <div className="flex items-start justify-between flex-wrap gap-2">
              <div>
                <p className="font-mono text-xs bg-gray-100 inline-block px-2 py-0.5 rounded mb-1.5">
                  {req.shipment?.trackingNumber ?? "—"}
                </p>
                <p className="text-sm text-gray-700">
                  {req.user?.firstName} {req.user?.lastName}{" "}
                  <span className="text-gray-400">· {req.user?.email}</span>
                </p>
              </div>
              <span
                className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                  req.status === "PENDING"
                    ? "bg-yellow-100 text-yellow-700"
                    : req.status === "APPROVED"
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                }`}
              >
                {req.status}
              </span>
            </div>

            <div className="grid sm:grid-cols-2 gap-3 mt-3">
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-[10px] uppercase tracking-wide text-gray-400 mb-1">
                  Current Address
                </p>
                <p className="text-sm text-gray-700 font-medium">
                  {req.shipment?.recipientAddress ?? "—"}
                </p>
                <p className="text-xs text-gray-500">
                  {req.shipment?.recipientCity}
                  {req.shipment?.recipientState
                    ? `, ${req.shipment.recipientState}`
                    : ""}
                </p>
              </div>
              <div className="bg-amber-50 rounded-lg p-3 border border-amber-100">
                <p className="text-[10px] uppercase tracking-wide text-amber-500 mb-1 flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> Requested New Address
                </p>
                <p className="text-sm text-gray-800 font-medium">
                  {req.newRecipientAddress}
                </p>
                <p className="text-xs text-gray-500">
                  {req.newRecipientCity}, {req.newRecipientState}
                </p>
              </div>
            </div>

            {req.reason && (
              <p className="text-xs text-gray-500 mt-2">
                <span className="font-medium text-gray-600">Reason:</span>{" "}
                {req.reason}
              </p>
            )}

            {req.status === "PENDING" ? (
              <div className="mt-3 flex flex-col sm:flex-row gap-2">
                <input
                  value={noteDraft[req.id] ?? ""}
                  onChange={(e) =>
                    setNoteDraft((prev) => ({
                      ...prev,
                      [req.id]: e.target.value,
                    }))
                  }
                  placeholder="Review note (optional)"
                  className="flex-1 text-xs border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-brand"
                />
                <div className="flex gap-2">
                  <button
                    disabled={reviewing && reviewingId === req.id}
                    onClick={() => handleReview(req.id, "APPROVE")}
                    className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-xs font-semibold disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                  </button>
                  <button
                    disabled={reviewing && reviewingId === req.id}
                    onClick={() => handleReview(req.id, "REJECT")}
                    className="flex items-center gap-1 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 px-3 py-2 rounded-lg text-xs font-semibold disabled:opacity-50"
                  >
                    <XCircle className="w-3.5 h-3.5" /> Reject
                  </button>
                </div>
              </div>
            ) : (
              req.reviewNote && (
                <p className="text-xs text-gray-400 mt-2 italic">
                  Reviewer note: {req.reviewNote}
                </p>
              )
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
