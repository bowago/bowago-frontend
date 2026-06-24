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

export default function TrackShipmentPage() {
  const params = useParams();
  const router = useRouter();
  const trackingNumber = params?.trackingNumber as string;

  const { data, isLoading, isError } = useTrackShipmentQuery(
    { trackingNumber },
    { skip: !trackingNumber },
  );

  const response = data as any;
  const shipment = response?.data?.shipment ?? response?.data;
  const currentStep = shipment ? getStepIndex(shipment.status) : -1;
  const isCancelled = shipment?.status === "CANCELLED";
  const isFailed = shipment?.status === "FAILED";

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
          <div>
            <p className="text-xs text-gray-400">Tracking</p>
            <p className="font-bold text-white">{trackingNumber}</p>
          </div>
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
                    const isPending = idx > currentStep;
                    return (
                      <div key={step.key} className="flex items-start gap-4">
                        {/* Line + dot */}
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
                              className={`w-4 h-4 ${isDone || isCurrent ? "text-black" : "text-gray-500"}`}
                            />
                          </div>
                          {idx < STATUS_STEPS.length - 1 && (
                            <div
                              className={`w-0.5 h-8 mt-1 ${isDone ? "bg-green-500" : "bg-white/10"}`}
                            />
                          )}
                        </div>
                        {/* Label */}
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
