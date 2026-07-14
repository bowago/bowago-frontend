"use client";

import { useParams, useRouter } from "next/navigation";
import { useTrackShipmentQuery } from "@/store/slice/apiSlice";
import {
  ArrowLeft,
  Package,
  MapPin,
  Clock,
  CheckCircle,
  Truck,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import dynamic from "next/dynamic";

// ── Google Maps component — loaded client-side only (no SSR) ─────────────────
// Uses Google Maps JavaScript API. Requires NEXT_PUBLIC_GOOGLE_MAPS_API_KEY env var.
const ShipmentMap = dynamic(() => import("@/components/tracking/ShipmentMap"), {
  ssr: false,
  loading: () => (
    <div className="h-52 bg-white/5 rounded-2xl border border-white/10 flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
    </div>
  ),
});

// ── Step definitions ─────────────────────────────────────────────────────────
const STATUS_STEPS = [
  { key: "PENDING", label: "Order Placed", icon: Package },
  { key: "AWAITING_PICKUP", label: "Awaiting Pickup", icon: Clock },
  { key: "PICKED_UP", label: "Picked Up", icon: Package },
  { key: "IN_TRANSIT", label: "In Transit", icon: Truck },
  { key: "OUT_FOR_DELIVERY", label: "Out for Delivery", icon: MapPin },
  { key: "DELIVERED", label: "Delivered", icon: CheckCircle },
];

const STATUS_ORDER = STATUS_STEPS.map((s) => s.key);

function getStepIndex(status: string): number {
  const idx = STATUS_ORDER.indexOf(status);
  return idx === -1 ? 0 : idx;
}

function deriveMapPoints(shipment: any): {
  origin: [number, number] | null;
  current: [number, number] | null;
  destination: [number, number] | null;
  originLabel: string;
  currentLabel: string;
  destinationLabel: string;
} {
  const history: any[] = shipment?.trackingHistory ?? [];

  const withCoords = history.filter((e) => e.lat != null && e.lng != null);

  const first = withCoords[0] ?? null;
  const latest = withCoords[withCoords.length - 1] ?? null;

  return {
    origin: first ? [first.lat, first.lng] : null,
    current: latest ? [latest.lat, latest.lng] : null,
    destination: null, // destination coordinates are not stored yet — will show once driver nears drop-off
    originLabel: `${shipment.senderCity ?? "Origin"}, ${shipment.senderState ?? ""}`,
    currentLabel: latest?.location ?? "Current Location",
    destinationLabel: `${shipment.recipientCity ?? "Destination"}, ${shipment.recipientState ?? ""}`,
  };
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function TrackShipmentPage() {
  const params = useParams();
  const router = useRouter();
  const trackingNumber = params?.trackingNumber as string;

  const { data, isLoading, isError } = useTrackShipmentQuery(
    { trackingNumber },
    { skip: !trackingNumber, pollingInterval: 10_000 },
  );

  const shipmentData = (data as { data?: any })?.data;
  const shipment = shipmentData?.shipment ?? shipmentData;
  const currentStep = shipment ? getStepIndex(shipment.status) : -1;
  const isCancelled = shipment?.status === "CANCELLED";
  const isFailed = shipment?.status === "FAILED";

  const mapPoints = shipment ? deriveMapPoints(shipment) : null;
  // Show map only when we have at least an origin coordinate
  const showMap = !!mapPoints?.origin;

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="border-b border-white/10 px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex-1">
            <p className="text-xs text-gray-400">Tracking</p>
            <p className="font-bold text-white">{trackingNumber}</p>
          </div>
          {/* Gap 4: WhatsApp share button — Sprint 4 DoD */}
          {trackingNumber && (
            <a
              href={`https://wa.me/?text=${encodeURIComponent(
                `Track my BowaGO shipment (${trackingNumber}): ${typeof window !== "undefined" ? window.location.href : `https://bowago.app/track/${trackingNumber}`}`,
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              title="Share via WhatsApp"
              className="flex items-center gap-1.5 bg-[#25D366] hover:bg-[#1ebe5d] text-white text-xs font-semibold px-3 py-1.5 rounded-full transition-colors"
            >
              {/* WhatsApp SVG icon */}
              <svg
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-3.5 h-3.5"
              >
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              Share
            </a>
          )}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-8 space-y-6">
        {/* Loading */}
        {isLoading && (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-white/20 border-t-white rounded-full animate-spin" />
          </div>
        )}

        {/* Error / Not found */}
        {isError && !isLoading && (
          <div className="text-center py-20 space-y-3">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto" />
            <p className="text-lg font-semibold">Shipment not found</p>
            <p className="text-sm text-gray-400">
              No shipment found for tracking number{" "}
              <strong>{trackingNumber}</strong>. Check the number and try again.
            </p>
            <Link
              href="/track"
              className="inline-block mt-4 px-5 py-2 rounded-xl bg-white text-black text-sm font-semibold hover:bg-gray-100 transition-colors"
            >
              Track Another Shipment
            </Link>
          </div>
        )}

        {/* Shipment found */}
        {shipment && !isLoading && (
          <>
            {/* Summary card */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-400">Status</p>
                <span
                  className={`px-3 py-0.5 rounded-full text-xs font-semibold ${
                    isCancelled
                      ? "bg-red-500/20 text-red-400"
                      : isFailed
                        ? "bg-gray-500/20 text-gray-400"
                        : shipment.status === "DELIVERED"
                          ? "bg-green-500/20 text-green-400"
                          : "bg-blue-500/20 text-blue-400"
                  }`}
                >
                  {shipment.status?.replace(/_/g, " ")}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">From</p>
                  <p className="font-medium">
                    {shipment.senderCity}, {shipment.senderState}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">To</p>
                  <p className="font-medium">
                    {shipment.recipientCity}, {shipment.recipientState}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Service</p>
                  <p className="font-medium capitalize">
                    {shipment.serviceType?.toLowerCase()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Est. Delivery</p>
                  <p className="font-medium">
                    {shipment.estimatedDelivery
                      ? new Date(shipment.estimatedDelivery).toLocaleDateString(
                          "en-NG",
                          { day: "numeric", month: "short", year: "numeric" },
                        )
                      : "—"}
                  </p>
                </div>
              </div>
            </div>

            {/* ── Live Map (Sprint 4 requirement) ──────────────────────────── */}
            {showMap && mapPoints && (
              <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                <div className="px-5 pt-4 pb-2">
                  <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold">
                    Live Location
                  </p>
                </div>
                <div className="h-56">
                  <ShipmentMap
                    origin={mapPoints.origin}
                    current={mapPoints.current}
                    destination={mapPoints.destination}
                    originLabel={mapPoints.originLabel}
                    currentLabel={mapPoints.currentLabel}
                    destinationLabel={mapPoints.destinationLabel}
                  />
                </div>
                <p className="px-5 py-2 text-[10px] text-gray-500">
                  Location updates every 10 seconds
                </p>
              </div>
            )}

            {/* Progress tracker */}
            {!isCancelled && !isFailed && (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold mb-5">
                  Shipment Progress
                </p>
                <div className="space-y-0">
                  {STATUS_STEPS.map((step, idx) => {
                    const Icon = step.icon;
                    const isDone = idx < currentStep;
                    const isCurrent = idx === currentStep;
                    return (
                      <div key={step.key} className="flex items-start gap-4">
                        <div className="flex flex-col items-center">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                              isDone
                                ? "bg-green-500"
                                : isCurrent
                                  ? "bg-white"
                                  : "bg-white/10"
                            }`}
                          >
                            <Icon
                              className={`w-4 h-4 ${
                                isDone || isCurrent
                                  ? "text-black"
                                  : "text-gray-500"
                              }`}
                            />
                          </div>
                          {idx < STATUS_STEPS.length - 1 && (
                            <div
                              className={`w-0.5 h-8 mt-1 ${
                                isDone ? "bg-green-500" : "bg-white/10"
                              }`}
                            />
                          )}
                        </div>
                        <div className="pt-1.5 pb-7 last:pb-0">
                          <p
                            className={`text-sm font-medium ${
                              isDone
                                ? "text-green-400"
                                : isCurrent
                                  ? "text-white"
                                  : "text-gray-500"
                            }`}
                          >
                            {step.label}
                          </p>
                          {isCurrent && (
                            <p className="text-xs text-gray-400 mt-0.5">
                              Current status
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Cancelled state */}
            {isCancelled && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-5 text-center space-y-2">
                <AlertCircle className="w-10 h-10 text-red-400 mx-auto" />
                <p className="font-semibold text-red-400">Shipment Cancelled</p>
                <p className="text-sm text-gray-400">
                  This shipment has been cancelled. Contact support if you need
                  assistance.
                </p>
              </div>
            )}

            {/* Tracking history */}
            {shipment.trackingHistory?.length > 0 && (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold mb-4">
                  History
                </p>
                <div className="space-y-3">
                  {[...shipment.trackingHistory]
                    .reverse()
                    .map((event: any, i: number) => (
                      <div key={i} className="flex gap-3 text-sm">
                        <div className="w-1.5 h-1.5 rounded-full bg-gray-400 mt-1.5 shrink-0" />
                        <div>
                          <p className="font-medium text-white">
                            {event.status?.replace(/_/g, " ")}
                          </p>
                          {event.description && (
                            <p className="text-xs text-gray-400">
                              {event.description}
                            </p>
                          )}
                          {event.location && (
                            <p className="text-xs text-gray-500">
                              📍 {event.location}
                            </p>
                          )}
                          <p className="text-xs text-gray-500 mt-0.5">
                            {new Date(event.createdAt).toLocaleString("en-NG")}
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Track another */}
            <div className="text-center">
              <Link
                href="/track"
                className="text-sm text-gray-400 hover:text-white transition-colors underline underline-offset-4"
              >
                Track a different shipment
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
