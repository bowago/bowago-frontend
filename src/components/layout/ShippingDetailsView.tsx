"use client";
import { useEffect, useRef } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

export type TrackingStop = {
  status:
    | "IN_TRANSIT"
    | "DELIVERED"
    | "PENDING"
    | "FAILED"
    | "OUT_FOR_DELIVERY"
    | "PICKED_UP"
    | "CONFIRMED"
    | "RETURNED"
    | "CANCELLED"
    | string;
  location: string;
  description: string;
  lat: number;
  lng: number;
  proofUrl?: string;
  updatedBy?: string;
  createdAt: string;
};

type LiveTimelineStep = {
  key: string;
  label: string;
  description: string;
  createdAt: string;
  status: string;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  const d = new Date(iso);
  return (
    d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }) +
    " · " +
    d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })
  );
}

const STATUS_COLORS: Record<string, string> = {
  IN_TRANSIT: "#378ADD",
  DELIVERED: "#639922",
  PENDING: "#BA7517",
  CONFIRMED: "#3B82F6",
  PICKED_UP: "#6366F1",
  OUT_FOR_DELIVERY: "#7F77DD",
  FAILED: "#E24B4A",
  RETURNED: "#6B7280",
  CANCELLED: "#9CA3AF",
};

const STATUS_BG: Record<string, string> = {
  IN_TRANSIT: "bg-blue-100 text-blue-800",
  DELIVERED: "bg-green-100 text-green-800",
  PENDING: "bg-amber-100 text-amber-800",
  CONFIRMED: "bg-blue-50 text-blue-700",
  PICKED_UP: "bg-indigo-100 text-indigo-800",
  OUT_FOR_DELIVERY: "bg-purple-100 text-purple-800",
  FAILED: "bg-red-100 text-red-800",
  RETURNED: "bg-gray-100 text-gray-700",
  CANCELLED: "bg-gray-100 text-gray-500",
};

const DOT_CHAR: Record<string, string> = {
  IN_TRANSIT: "→",
  DELIVERED: "✓",
  PENDING: "○",
  CONFIRMED: "✓",
  PICKED_UP: "↑",
  OUT_FOR_DELIVERY: "↓",
  FAILED: "✕",
  RETURNED: "↩",
  CANCELLED: "✕",
};

// ─── TrackingTimeLineView ─────────────────────────────────────────────────────
// Accepts optional real `steps` from the API; falls back to placeholder.

interface TimelineProps {
  steps?: LiveTimelineStep[];
  dark?: boolean;
}

export const TrackingTimeLineView = ({ steps, dark = false }: TimelineProps) => {
  const hasRealData = steps && steps.length > 0;

  const items = hasRealData
    ? steps!.map((s, i) => ({
        key: String(i),
        label: s.status.replace(/_/g, " "),
        description: s.description,
        createdAt: s.createdAt,
        isDone: true,
        isActive: i === steps!.length - 1,
        isPending: false,
      }))
    : [
        { key: "p1", label: "Order Placed",  description: "Shipment order created",  createdAt: new Date().toISOString(), isDone: false, isActive: false, isPending: true },
        { key: "p2", label: "Picked Up",     description: "Package collected",        createdAt: new Date().toISOString(), isDone: false, isActive: false, isPending: true },
        { key: "p3", label: "In Transit",    description: "In logistics network",     createdAt: new Date().toISOString(), isDone: false, isActive: false, isPending: true },
        { key: "p4", label: "Delivered",     description: "Delivered to recipient",   createdAt: new Date().toISOString(), isDone: false, isActive: false, isPending: true },
      ];

  return (
    <div className={`rounded-2xl border shadow-sm p-6 ${dark ? "bg-white/5 border-white/10" : "bg-white border-gray-100"}`}>
      <h2 className={`text-base font-display font-bold mb-6 ${dark ? "text-white" : "text-gray-900"}`}>
        Tracking Timeline
        {!hasRealData && (
          <span className="ml-2 text-xs font-normal text-gray-400">(awaiting data)</span>
        )}
      </h2>

      <ol className="flex flex-col">
        {items.map((step, i) => {
          const isLast = i === items.length - 1;
          const ts = new Date(step.createdAt).toLocaleString("en-US", {
            month: "long", day: "numeric", year: "numeric",
            hour: "numeric", minute: "2-digit", hour12: true,
          }).replace(",", " ·").replace(" AM", "am").replace(" PM", "pm");

          return (
            <li key={step.key} className="flex gap-3">
              <div className="flex flex-col items-center flex-shrink-0">
                {step.isDone && !step.isActive && (
                  <span className="w-6 h-6 rounded-full bg-emerald-100 border-2 border-emerald-400 flex items-center justify-center flex-shrink-0">
                    <svg className="w-3 h-3 text-emerald-500" viewBox="0 0 12 12" fill="none">
                      <polyline points="2,6 5,9 10,3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                )}
                {step.isActive && (
                  <span className="w-6 h-6 rounded-full border-2 border-emerald-500 bg-white flex items-center justify-center flex-shrink-0">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  </span>
                )}
                {step.isPending && (
                  <span className="w-6 h-6 rounded-full bg-gray-100 border-2 border-gray-200 flex-shrink-0" />
                )}

                {!isLast && (
                  <div
                    className={`w-0.5 flex-1 my-1 min-h-[24px] ${step.isDone && !step.isActive ? "bg-emerald-300" : "bg-gray-200"}`}
                    style={step.isActive ? { background: "repeating-linear-gradient(to bottom,#d1d5db 0,#d1d5db 4px,transparent 4px,transparent 8px)" } : undefined}
                  />
                )}
              </div>

              <div className={`flex-1 ${isLast ? "pb-0" : "pb-6"}`}>
                <div className="flex items-start justify-between gap-2">
                  <span className={`text-sm font-semibold font-display ${step.isPending ? (dark ? "text-white/20" : "text-gray-400") : (dark ? "text-white" : "text-gray-800")}`}>
                    {step.label}
                  </span>
                  {hasRealData && (
                    <span className={`text-xs flex-shrink-0 ${step.isActive ? "text-emerald-600 font-semibold" : "text-gray-400"}`}>
                      {ts}
                    </span>
                  )}
                </div>
                <p className={`text-xs mt-0.5 ${step.isPending ? (dark ? "text-white/20" : "text-gray-300") : (dark ? "text-white/50" : "text-gray-500")}`}>
                  {step.description}
                </p>
                {step.isActive && (
                  <span className="inline-block mt-2 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200">
                    Live update
                  </span>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
};

// ─── ShipmentTrackerMap ───────────────────────────────────────────────────────

interface MapProps {
  trackingHistory: TrackingStop[];
  dark?: boolean;
}

export const ShipmentTrackerMap = ({ trackingHistory, dark = false }: MapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<unknown>(null);
  const hasRealCoords = trackingHistory.some((s) => s.lat !== 0 || s.lng !== 0);

  useEffect(() => {
    if (!hasRealCoords || !mapRef.current || mapInstanceRef.current) return;

    import("leaflet").then((L) => {
      if (!mapRef.current) return;
      const map = L.map(mapRef.current);
      mapInstanceRef.current = map;
      const dark = matchMedia("(prefers-color-scheme: dark)").matches;
      L.tileLayer(
        dark
          ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
        { maxZoom: 19, attribution: "© CartoDB" },
      ).addTo(map);

      const points: [number, number][] = [];
      trackingHistory.forEach((stop, i) => {
        if (stop.lat === 0 && stop.lng === 0) return;
        const isLast = i === trackingHistory.length - 1;
        const color = STATUS_COLORS[stop.status] ?? "#888";
        const icon = L.divIcon({
          className: "",
          html: `<div style="width:${isLast ? 18 : 12}px;height:${isLast ? 18 : 12}px;background:${color};border-radius:50%;border:${isLast ? "3px" : "2px"} solid #fff;box-shadow:0 0 0 1.5px ${color};"></div>`,
          iconSize: [isLast ? 18 : 12, isLast ? 18 : 12],
          iconAnchor: [isLast ? 9 : 6, isLast ? 9 : 6],
        });
        const marker = L.marker([stop.lat, stop.lng], { icon }).addTo(map);
        marker.bindPopup(`<b style="font-size:13px">${stop.location}</b><br/><span style="font-size:12px;color:#666">${stop.description}</span><br/><span style="font-size:11px;color:#999">${formatDate(stop.createdAt)}</span>`);
        points.push([stop.lat, stop.lng]);
      });
      if (points.length > 1) L.polyline(points, { color: "#378ADD", weight: 2, dashArray: "5 5", opacity: 0.7 }).addTo(map);
      if (points.length === 1) map.setView(points[0], 12);
      else if (points.length > 1) map.fitBounds(points, { padding: [40, 40] });
    });

    return () => {
      if (mapInstanceRef.current) {
        (mapInstanceRef.current as { remove: () => void }).remove();
        mapInstanceRef.current = null;
      }
    };
  }, [trackingHistory, hasRealCoords]);

  return (
    <div className="flex flex-col gap-4">
      {hasRealCoords ? (
        <div ref={mapRef} className="w-full h-[420px] rounded-xl border border-gray-200 overflow-hidden z-0" />
      ) : (
        <div className={`w-full h-[420px] rounded-xl border flex flex-col items-center justify-center gap-2 ${dark ? "border-white/10 bg-white/5 text-white/30" : "border-gray-200 bg-gray-50 text-gray-400"}`}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-40">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
            <circle cx="12" cy="9" r="2.5" />
          </svg>
          <span className="text-sm">No GPS coordinates available yet</span>
          <span className="text-xs">Map updates once driver reports location</span>
        </div>
      )}

      <div className="flex flex-col">
        {trackingHistory.map((stop, i) => {
          const isLast = i === trackingHistory.length - 1;
          return (
            <div key={i} className="flex gap-3 items-start py-3 relative">
              {!isLast && <div className="absolute left-[9px] top-9 bottom-0 w-px bg-gray-200" />}
              <div
                className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-medium mt-0.5 z-10"
                style={{ background: (STATUS_COLORS[stop.status] ?? "#888") + "33", color: STATUS_COLORS[stop.status] ?? "#888", border: `1.5px solid ${STATUS_COLORS[stop.status] ?? "#888"}` }}
              >
                {DOT_CHAR[stop.status] ?? "·"}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-gray-900">{stop.location}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${STATUS_BG[stop.status] ?? "bg-gray-100 text-gray-700"}`}>
                    {stop.status.replace(/_/g, " ")}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">{stop.description}</p>
                <p className="text-[11px] text-gray-400 mt-1">{formatDate(stop.createdAt)}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─── Default export — ShipmentDetailView (legacy, used in [id] page) ──────────

export default function ShipmentDetailView() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <TrackingTimeLineView />
      <div className="flex flex-col gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-base font-display font-bold text-gray-900 mb-4">Shipment Details</h2>
          <p className="text-sm text-gray-400">Loading shipment data...</p>
        </div>
      </div>
    </div>
  );
}
