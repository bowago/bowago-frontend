"use client";

import { MapPin, Clock, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";

interface ShipmentCardProps {
  id: string;
  shipmentId?: string;
  trackingId: string;
  status: "In Transit" | "Delivered" | "Pending";
  from: string;
  to: string;
  progress: number;
  currentLocation: string;
  estDelivery: string;
  delay?: number;
}

const statusColors: Record<string, string> = {
  "In Transit": "bg-orange-50 text-orange-600 border border-orange-200",
  Delivered: "bg-emerald-50 text-emerald-600 border border-emerald-200",
  Pending: "bg-blue-50 text-blue-600 border border-blue-200",
};

export default function ShipmentCard({
  id,
  shipmentId,
  trackingId,
  status,
  from,
  to,
  progress,
  currentLocation,
  estDelivery,
  delay = 0,
}: ShipmentCardProps) {
  const router = useRouter();
  const navId = shipmentId ?? id;

  return (
    <div
      onClick={() => router.push(`/dashboard/shipments/${navId}`)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          router.push(`/dashboard/shipments/${navId}`);
        }
      }}
      className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 animate-fade-in-up cursor-pointer"
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#3b82f6"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v3" />
              <rect x="9" y="11" width="14" height="10" rx="2" />
              <circle cx="12" cy="20" r="1" />
              <circle cx="20" cy="20" r="1" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-bold font-display text-gray-800">{id}</p>
            <p className="text-xs text-gray-400 mt-0.5">
              Tracking ID: {trackingId}
            </p>
          </div>
        </div>
        <span
          className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusColors[status]}`}
        >
          {status}
        </span>
      </div>

      {/* Route */}
      <div className="flex items-center gap-2 mb-4">
        <div className="flex-1">
          <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">
            From
          </p>
          <p className="text-sm font-semibold text-gray-700">{from}</p>
        </div>
        <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
        <div className="flex-1 text-right">
          <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">
            To
          </p>
          <p className="text-sm font-semibold text-gray-700">{to}</p>
        </div>
      </div>

      {/* Progress */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1.5">
          <p className="text-xs text-gray-500">Shipment Progress</p>
          <p className="text-xs font-bold text-gray-700">{progress}%</p>
        </div>
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full progress-bar"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-50">
        <div className="flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-gray-400" />
          <div>
            <p className="text-[10px] text-gray-400">Current Location</p>
            <p className="text-xs font-semibold text-gray-700">
              {currentLocation}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-gray-400" />
          <div className="text-right">
            <p className="text-[10px] text-gray-400">Est. Delivery</p>
            <p className="text-xs font-semibold text-gray-700">{estDelivery}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
