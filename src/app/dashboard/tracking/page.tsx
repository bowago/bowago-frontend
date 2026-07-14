"use client";

import { useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { useGetEnterpriseShipmentsQuery } from "@/store/slice/apiSlice";
import ShipmentCard from "@/components/cards/ShipmentCard";
import { Radar, Loader2 } from "lucide-react";

// Distinct from /dashboard/shipments (the full management table with
// search/filter/edit actions) — this is a lighter, tracking-focused view:
// "where is everything right now", not "manage my shipments". Previously
// the sidebar's Tracking item pointed at the same /dashboard/shipments
// route as Shipments and Get Quote, which is also why all three lit up
// together in the sidebar no matter which one you were actually on.

type ShipmentItem = {
  id: string;
  trackingNumber: string;
  status: string;
  senderCity: string;
  recipientCity: string;
  estimatedDelivery?: string;
};

function getShipments(data: any): ShipmentItem[] {
  const d = data?.data;
  if (Array.isArray(d)) return d;
  if (d?.shipments) return d.shipments;
  return data?.shipments ?? [];
}

const STATUS_ORDER = [
  "PENDING",
  "CONFIRMED",
  "PICKED_UP",
  "IN_TRANSIT",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
];
const TERMINAL_STATUSES = ["DELIVERED", "CANCELLED", "FAILED", "RETURNED"];

function toDisplayStatus(
  status: string,
): "In Transit" | "Delivered" | "Pending" {
  if (status === "DELIVERED") return "Delivered";
  if (["PICKED_UP", "IN_TRANSIT", "OUT_FOR_DELIVERY"].includes(status)) {
    return "In Transit";
  }
  return "Pending";
}

function progressFromStatus(status: string): number {
  const idx = STATUS_ORDER.indexOf(status);
  return idx < 0 ? 0 : Math.round(((idx + 1) / STATUS_ORDER.length) * 100);
}

export default function TrackingPage() {
  const user = useSelector((s: RootState) => s.auth.user) as any;
  const [showDelivered, setShowDelivered] = useState(false);

  const { data, isLoading, isError } = useGetEnterpriseShipmentsQuery({});
  const all = getShipments(data);
  const shipments = showDelivered
    ? all
    : all.filter((s) => !TERMINAL_STATUSES.includes(s.status));

  const inTransitCount = all.filter((s) =>
    ["PICKED_UP", "IN_TRANSIT", "OUT_FOR_DELIVERY"].includes(s.status),
  ).length;
  const pendingCount = all.filter((s) =>
    ["PENDING", "CONFIRMED"].includes(s.status),
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Radar className="w-5 h-5 text-brand" />
            Tracking
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Live status of {user?.companyName ?? "your company"}&apos;s
            shipments — {inTransitCount} in transit, {pendingCount} awaiting
            pickup.
          </p>
        </div>

        <label className="flex items-center gap-2 text-sm text-gray-600 select-none cursor-pointer">
          <input
            type="checkbox"
            checked={showDelivered}
            onChange={(e) => setShowDelivered(e.target.checked)}
            className="accent-red-600"
          />
          Show delivered / closed shipments
        </label>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="animate-spin w-6 h-6 text-gray-400" />
        </div>
      ) : isError ? (
        <div className="text-center py-16 text-sm text-red-500">
          Couldn&apos;t load shipments right now. Try refreshing.
        </div>
      ) : shipments.length === 0 ? (
        <div className="text-center py-16 text-sm text-gray-400">
          {showDelivered
            ? "No shipments yet."
            : "Nothing in transit right now. Toggle above to see delivered shipments."}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {shipments.map((s, i) => (
            <ShipmentCard
              key={s.id}
              id={s.trackingNumber}
              shipmentId={s.id}
              trackingId={s.trackingNumber}
              status={toDisplayStatus(s.status)}
              from={s.senderCity}
              to={s.recipientCity}
              progress={progressFromStatus(s.status)}
              currentLocation={s.senderCity}
              estDelivery={
                s.estimatedDelivery
                  ? new Date(s.estimatedDelivery).toLocaleDateString("en-NG", {
                      dateStyle: "medium",
                    })
                  : "TBD"
              }
              delay={i * 60}
            />
          ))}
        </div>
      )}
    </div>
  );
}
