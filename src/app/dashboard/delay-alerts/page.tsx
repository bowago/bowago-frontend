"use client";

/**
 * Admin: Delay Alerts — Sprint 5
 *
 * PRD DoD: "Admin can send a notification to 100+ users at once regarding
 * a specific delay reason." Backend (delayAlert.routes.js /
 * delayAlert.controller.js) already supported batch sends to any number of
 * shipmentIds; there was no UI to drive it. This page lists overdue
 * shipments, lets the admin multi-select all (or some) of them, and submits
 * one batch delay alert.
 */

import { useState } from "react";
import {
  useGetOverdueShipmentsQuery,
  useSendDelayAlertMutation,
} from "@/store/slice/apiSlice";
import { AlertTriangle, Loader2, Send } from "lucide-react";

type OverdueShipment = {
  id: string;
  trackingNumber: string;
  recipientCity: string;
  estimatedDelivery?: string;
  status: string;
  customer?: { firstName?: string; lastName?: string; email?: string };
};

function getShipments(response: any): OverdueShipment[] {
  return response?.data?.shipments ?? response?.shipments ?? [];
}

export default function DelayAlertsAdminPage() {
  const { data, isLoading, isError } = useGetOverdueShipmentsQuery();
  const [sendDelayAlert, { isLoading: sending }] = useSendDelayAlertMutation();

  const shipments = getShipments(data);

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [reason, setReason] = useState("");
  const [newEta, setNewEta] = useState("");
  const [message, setMessage] = useState("");

  const allSelected = shipments.length > 0 && selected.size === shipments.length;

  const toggleAll = () => {
    setSelected(allSelected ? new Set() : new Set(shipments.map((s) => s.id)));
  };

  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSend = async () => {
    if (selected.size === 0 || !reason.trim()) return;
    try {
      await sendDelayAlert({
        shipmentIds: Array.from(selected),
        reason: reason.trim(),
        newEstimatedDelivery: newEta || undefined,
        message: message.trim() || undefined,
      }).unwrap();
      setSelected(new Set());
      setReason("");
      setNewEta("");
      setMessage("");
    } catch {
      // error toast already shown by the mutation
    }
  };

  return (
    <div className="pb-10">
      <div className="mb-6">
        <div className="text-dashboard-heading">Delay Alerts</div>
        <p className="text-sm text-gray-500 mt-1">
          Select affected shipments and notify all of them at once with a single
          reason and updated ETA. Both push and email are sent.
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        {/* ── Overdue shipments list ── */}
        <div className="lg:col-span-2 border border-gray-200 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
            <p className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              Overdue Shipments ({shipments.length})
            </p>
            {shipments.length > 0 && (
              <button
                onClick={toggleAll}
                className="text-xs font-medium text-brand hover:underline"
              >
                {allSelected ? "Deselect all" : "Select all"}
              </button>
            )}
          </div>

          {isLoading && (
            <div className="flex items-center gap-2 text-gray-500 text-sm py-10 justify-center">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading overdue shipments...
            </div>
          )}

          {isError && (
            <p className="text-sm text-red-500 py-10 text-center">
              Failed to load overdue shipments.
            </p>
          )}

          {!isLoading && !isError && shipments.length === 0 && (
            <p className="text-sm text-gray-400 py-10 text-center">
              No overdue shipments right now — nothing to alert customers about.
            </p>
          )}

          <div className="max-h-[480px] overflow-y-auto divide-y divide-gray-100">
            {shipments.map((s) => (
              <label
                key={s.id}
                className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer text-sm"
              >
                <input
                  type="checkbox"
                  checked={selected.has(s.id)}
                  onChange={() => toggleOne(s.id)}
                  className="w-4 h-4 accent-brand"
                />
                <span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded">
                  {s.trackingNumber}
                </span>
                <span className="text-gray-600 flex-1">{s.recipientCity}</span>
                <span className="text-gray-400 text-xs">
                  {s.customer?.firstName} {s.customer?.lastName}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* ── Compose alert ── */}
        <div className="border border-gray-200 rounded-xl p-4 h-fit">
          <p className="text-sm font-semibold text-gray-700 mb-3">
            {selected.size} shipment{selected.size === 1 ? "" : "s"} selected
          </p>

          <label className="text-xs font-medium text-gray-600 mb-1 block">
            Delay Reason
          </label>
          <input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Customs clearance delay at Apapa Port"
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 mb-3 focus:outline-none focus:ring-1 focus:ring-brand"
          />

          <label className="text-xs font-medium text-gray-600 mb-1 block">
            New Estimated Delivery (optional)
          </label>
          <input
            type="datetime-local"
            value={newEta}
            onChange={(e) => setNewEta(e.target.value)}
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 mb-3 focus:outline-none focus:ring-1 focus:ring-brand"
          />

          <label className="text-xs font-medium text-gray-600 mb-1 block">
            Custom Message (optional)
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
            placeholder="Overrides the auto-generated message if filled"
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 mb-4 focus:outline-none focus:ring-1 focus:ring-brand"
          />

          <button
            disabled={selected.size === 0 || !reason.trim() || sending}
            onClick={handleSend}
            className="w-full flex items-center justify-center gap-2 bg-brand hover:bg-red-700 text-white py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50 transition-colors"
          >
            <Send className="w-4 h-4" />
            {sending ? "Sending..." : "Send Delay Alert"}
          </button>
        </div>
      </div>
    </div>
  );
}
