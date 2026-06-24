"use client";

import { useEffect, useRef, useState } from "react";
import { useTrackShipmentQuery } from "@/store/slice/apiSlice";
import { useTrackingSocket } from "@/hooks/useTrackingSocket";
import {
  ShipmentTrackerMap,
  TrackingTimeLineView,
  TrackingStop,
} from "../layout/ShippingDetailsView";
import {
  Package,
  MapPin,
  Clock,
  ChevronRight,
  Search,
  Loader2,
  AlertCircle,
  RotateCcw,
  ArrowRight,
  Wifi,
  WifiOff,
} from "lucide-react";

interface TrackerFormProps {
  onSuccess?: () => void;
  prefillTrackingId?: string;
  dark?: boolean; // dark mode for /track page
}

type TrackingEvent = {
  id: string;
  status: string;
  location: string | null;
  description: string;
  lat: number | null;
  lng: number | null;
  proofUrl: string | null;
  createdAt: string;
};

type Shipment = {
  id: string;
  trackingNumber: string;
  status: string;
  senderCity: string;
  senderState: string;
  recipientCity: string;
  recipientState: string;
  weight: number;
  weightUnit: string;
  serviceType: string;
  cartons: number;
  estimatedDelivery: string | null;
  trackingHistory: TrackingEvent[];
};

const STATUS_MAP: Record<
  string,
  { label: string; light: string; dark: string }
> = {
  PENDING: {
    label: "Pending",
    light: "bg-yellow-50 text-yellow-700 border-yellow-200",
    dark: "bg-yellow-500/10 text-yellow-400 border-yellow-500/30",
  },
  CONFIRMED: {
    label: "Confirmed",
    light: "bg-blue-50 text-blue-700 border-blue-200",
    dark: "bg-blue-500/10 text-blue-400 border-blue-500/30",
  },
  PICKED_UP: {
    label: "Picked Up",
    light: "bg-indigo-50 text-indigo-700 border-indigo-200",
    dark: "bg-indigo-500/10 text-indigo-400 border-indigo-500/30",
  },
  IN_TRANSIT: {
    label: "In Transit",
    light: "bg-orange-50 text-orange-700 border-orange-200",
    dark: "bg-orange-500/10 text-orange-400 border-orange-500/30",
  },
  OUT_FOR_DELIVERY: {
    label: "Out for Delivery",
    light: "bg-purple-50 text-purple-700 border-purple-200",
    dark: "bg-purple-500/10 text-purple-400 border-purple-500/30",
  },
  DELIVERED: {
    label: "Delivered",
    light: "bg-green-50 text-green-700 border-green-200",
    dark: "bg-green-500/10 text-green-400 border-green-500/30",
  },
  FAILED: {
    label: "Failed",
    light: "bg-red-50 text-red-700 border-red-200",
    dark: "bg-red-500/10 text-red-400 border-red-500/30",
  },
  CANCELLED: {
    label: "Cancelled",
    light: "bg-gray-50 text-gray-600 border-gray-200",
    dark: "bg-white/5 text-white/50 border-white/10",
  },
};

export function TrackingForm({
  prefillTrackingId,
  dark = false,
}: TrackerFormProps) {
  const [inputValue, setInputValue] = useState(prefillTrackingId ?? "");
  const [submittedId, setSubmittedId] = useState(
    prefillTrackingId?.trim().toUpperCase() ?? "",
  );
  const [hasTracked, setHasTracked] = useState(!!prefillTrackingId);
  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (prefillTrackingId?.trim()) {
      const v = prefillTrackingId.trim().toUpperCase();
      setInputValue(v);
      setSubmittedId(v);
      setHasTracked(true);
    }
  }, [prefillTrackingId]);

  const {
    data: rawData,
    isLoading,
    isError,
    isFetching,
  } = useTrackShipmentQuery(
    { trackingNumber: submittedId },
    {
      skip: !submittedId,
      // Sprint 4 fallback: poll every 30s when WebSocket is unavailable.
      pollingInterval: 30000,
      refetchOnFocus: true,
      refetchOnReconnect: true,
    },
  );

  // ─── Sprint 4: WebSocket real-time updates ────────────────────────────────
  const { liveUpdate, isConnected: wsConnected } = useTrackingSocket(submittedId);

  const restShipment = (rawData as any)?.data?.shipment as Shipment | undefined;
  // Merge live WS update on top of REST snapshot when WS is connected
  const shipment: Shipment | undefined = restShipment
    ? wsConnected && liveUpdate && liveUpdate.trackingNumber === submittedId
      ? {
          ...restShipment,
          status: liveUpdate.status,
          estimatedDelivery: liveUpdate.estimatedDelivery ?? restShipment.estimatedDelivery,
          trackingHistory: liveUpdate.timeline.map((e) => ({
            id: e.timestamp,
            status: e.status,
            location: e.location,
            description: e.description,
            lat: null,
            lng: null,
            proofUrl: null,
            createdAt: e.timestamp,
          })),
        }
      : restShipment
    : undefined;

  useEffect(() => {
    if (shipment && resultRef.current) {
      resultRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [shipment]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const v = inputValue.trim().toUpperCase();
    if (!v) return;
    setSubmittedId(v);
    setHasTracked(true);
  };

  const handleReset = () => {
    setInputValue("");
    setSubmittedId("");
    setHasTracked(false);
  };

  const trackingHistory: TrackingStop[] = (shipment?.trackingHistory ?? []).map(
    (evt) => ({
      status: evt.status as TrackingStop["status"],
      location: evt.location ?? shipment?.senderCity ?? "Unknown",
      description: evt.description,
      lat: evt.lat ?? 0,
      lng: evt.lng ?? 0,
      proofUrl: evt.proofUrl ?? undefined,
      createdAt: evt.createdAt,
    }),
  );

  const timelineSteps = trackingHistory.map((t, i) => ({
    key: String(i),
    label: STATUS_MAP[t.status]?.label ?? t.status.replace(/_/g, " "),
    description: t.description,
    createdAt: t.createdAt,
    status: t.status,
  }));

  const statusStyle = shipment
    ? ((dark
        ? STATUS_MAP[shipment.status]?.dark
        : STATUS_MAP[shipment.status]?.light) ?? "")
    : "";

  // ── input styles based on theme ──────────────────────────────────────────
  const inputCls = dark
    ? "w-full bg-white/10 border border-white/20 text-white placeholder-white/30 rounded-xl px-4 py-3 text-sm focus:border-brand/60 focus:bg-white/15 focus:outline-none transition-all"
    : "w-full bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 rounded-xl px-4 py-3 text-sm focus:border-brand/60 focus:outline-none transition-all";

  const btnCls = dark
    ? "bg-brand hover:bg-red-700 text-white px-5 py-3 rounded-xl font-bold text-sm transition-all flex items-center gap-2 flex-shrink-0 hover:scale-105 disabled:opacity-60 disabled:scale-100"
    : "bg-brand hover:bg-red-700 text-white px-5 py-3 rounded-xl font-bold text-sm transition-all flex items-center gap-2 flex-shrink-0 disabled:opacity-60";

  return (
    <div className="flex flex-col gap-6">
      {/* Search row */}
      <form onSubmit={handleSubmit}>
        <div
          className={`flex gap-2 p-1.5 rounded-2xl ${dark ? "bg-white/5 border border-white/10" : "bg-gray-100"}`}
        >
          <div className="relative flex-1">
            <Search
              className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 ${dark ? "text-white/30" : "text-gray-400"}`}
            />
            <input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Enter tracking number e.g. BWG-ABC123"
              className={`w-full pl-10 pr-4 py-3 text-sm rounded-xl focus:outline-none transition-all ${
                dark
                  ? "bg-transparent text-white placeholder-white/30 focus:bg-white/5"
                  : "bg-white text-gray-900 placeholder-gray-400 border-0 shadow-sm"
              }`}
              autoComplete="off"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading || isFetching || !inputValue.trim()}
            className={btnCls}
          >
            {isLoading || isFetching ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )}
            <span className="hidden sm:inline">
              {isLoading || isFetching ? "Tracking..." : "Track"}
            </span>
          </button>
        </div>
      </form>

      {/* Loading */}
      {(isLoading || isFetching) && (
        <div
          className={`flex items-center gap-3 text-sm py-4 ${dark ? "text-white/50" : "text-gray-500"}`}
        >
          <Loader2 className="w-5 h-5 animate-spin flex-shrink-0" />
          Looking up{" "}
          <span className="font-mono font-medium">{submittedId}</span>...
        </div>
      )}

      {/* Sprint 4: Live / Polling indicator */}
      {shipment && (
        <div className={`flex items-center gap-1.5 text-xs mt-1 mb-2 ${dark ? "text-white/40" : "text-gray-400"}`}>
          {wsConnected ? (
            <>
              <Wifi className="w-3 h-3 text-green-500" />
              <span className="text-green-500 font-medium">Live</span>
            </>
          ) : (
            <>
              <WifiOff className="w-3 h-3" />
              <span>Updating every 30s</span>
            </>
          )}
        </div>
      )}

      {/* Not found */}
      {isError && hasTracked && !isLoading && (
        <div
          className={`rounded-2xl p-5 border ${dark ? "bg-red-500/10 border-red-500/20 text-red-400" : "bg-red-50 border-red-200 text-red-700"}`}
        >
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-sm mb-1">Shipment not found</p>
              <p
                className={`text-xs ${dark ? "text-red-400/70" : "text-red-500"}`}
              >
                No shipment found for{" "}
                <span className="font-mono font-bold">{submittedId}</span>.
                Double-check the tracking number or contact support.
              </p>
              <button
                onClick={handleReset}
                className={`mt-3 text-xs font-medium flex items-center gap-1.5 underline underline-offset-2 ${dark ? "text-red-400/70 hover:text-red-400" : "text-red-600 hover:text-red-800"} transition-colors`}
              >
                <RotateCcw className="w-3 h-3" /> Try again
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Result */}
      {shipment && !isLoading && !isFetching && (
        <div ref={resultRef} className="flex flex-col gap-5 animate-fade-in-up">
          {/* Status hero card */}
          <div
            className={`rounded-2xl p-5 md:p-6 border ${dark ? "bg-white/5 border-white/10" : "bg-[#1F3A70] text-white"}`}
          >
            {/* Top row */}
            <div className="flex items-start justify-between gap-3 mb-5">
              <div>
                <p
                  className={`text-xs uppercase tracking-wider mb-1 ${dark ? "text-white/40" : "text-blue-200"}`}
                >
                  Tracking Number
                </p>
                <p className="font-mono font-bold text-lg text-white">
                  {shipment.trackingNumber}
                </p>
              </div>
              <span
                className={`text-xs font-semibold px-3 py-1.5 rounded-full border flex-shrink-0 ${statusStyle}`}
              >
                {STATUS_MAP[shipment.status]?.label ??
                  shipment.status.replace(/_/g, " ")}
              </span>
            </div>

            {/* Route */}
            <div
              className={`flex items-center gap-2 text-sm mb-5 p-3 rounded-xl ${dark ? "bg-white/5" : "bg-white/10"}`}
            >
              <div className="flex-1 min-w-0">
                <p
                  className={`text-xs mb-0.5 ${dark ? "text-white/40" : "text-blue-200"}`}
                >
                  From
                </p>
                <p className="font-semibold text-white truncate">
                  {shipment.senderCity}, {shipment.senderState}
                </p>
              </div>
              <div
                className={`flex flex-col items-center gap-1 flex-shrink-0 ${dark ? "text-white/30" : "text-blue-300"}`}
              >
                <ChevronRight className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0 text-right">
                <p
                  className={`text-xs mb-0.5 ${dark ? "text-white/40" : "text-blue-200"}`}
                >
                  To
                </p>
                <p className="font-semibold text-white truncate">
                  {shipment.recipientCity}, {shipment.recipientState}
                </p>
              </div>
            </div>

            {/* Meta row */}
            <div
              className={`grid grid-cols-3 gap-3 pt-4 border-t ${dark ? "border-white/10" : "border-white/20"}`}
            >
              {[
                {
                  icon: <Package className="w-4 h-4" />,
                  label: "Weight",
                  value:
                    shipment.weight && shipment.weightUnit
                      ? `${shipment.weight} ${shipment.weightUnit}`
                      : shipment.weight
                        ? `${shipment.weight} kg`
                        : shipment.cartons
                          ? `${shipment.cartons} carton${Number(shipment.cartons) !== 1 ? "s" : ""}`
                          : "—",
                },
                {
                  icon: <MapPin className="w-4 h-4" />,
                  label: "Service",
                  value: shipment.serviceType,
                },
                {
                  icon: <Clock className="w-4 h-4" />,
                  label: "ETA",
                  value: shipment.estimatedDelivery
                    ? new Date(shipment.estimatedDelivery).toLocaleDateString(
                        "en-NG",
                        { dateStyle: "medium" },
                      )
                    : "TBD",
                },
              ].map(({ icon, label, value }) => (
                <div key={label} className="flex items-center gap-2">
                  <span className={dark ? "text-brand" : "text-blue-300"}>
                    {icon}
                  </span>
                  <div className="min-w-0">
                    <p
                      className={`text-xs ${dark ? "text-white/40" : "text-blue-200"}`}
                    >
                      {label}
                    </p>
                    <p className="font-medium text-white text-xs md:text-sm truncate">
                      {value}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Timeline + Map */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Timeline — wrapped for dark mode */}
            <div
              className={
                dark
                  ? "[&_.bg-white]:bg-white/5 [&_.border-gray-100]:border-white/10 [&_.text-gray-900]:text-white [&_.text-gray-500]:text-white/50 [&_.text-gray-400]:text-white/30 [&_.text-gray-800]:text-white [&_.border-gray-200]:border-white/10"
                  : ""
              }
            >
              <TrackingTimeLineView steps={timelineSteps} dark={dark} />
            </div>
            <div
              className={
                dark
                  ? "[&_.bg-white]:bg-white/5 [&_.border-gray-200]:border-white/10 [&_.text-gray-900]:text-white [&_.text-gray-500]:text-white/50 [&_.text-gray-400]:text-white/30"
                  : ""
              }
            >
              <ShipmentTrackerMap
                trackingHistory={trackingHistory}
                dark={dark}
              />
            </div>
          </div>

          {/* Track another */}
          <div
            className={`flex items-center justify-between pt-2 ${dark ? "text-white/40" : "text-gray-400"}`}
          >
            <span className="text-sm">Need to track another shipment?</span>
            <button
              onClick={handleReset}
              className={`flex items-center gap-1.5 text-sm font-semibold transition-colors ${dark ? "text-brand hover:text-red-400" : "text-brand hover:text-red-700"}`}
            >
              New Search <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
