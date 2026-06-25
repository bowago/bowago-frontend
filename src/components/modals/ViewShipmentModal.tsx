"use client";

import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { deleteShipmentSchema } from "@/lib/validation";
import { TextArea, Input } from "../ui/input";
import { Button } from "../ui/button";
import {
  useCancelShipmentMutation,
  useCancelPreviewQuery,
  useGetUserShipmentsByIdQuery,
  useInitiateShipmentPaymentMutation,
  useAssignShipmentMutation,
  useGetUsersQuery,
} from "@/store/slice/apiSlice";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { SERVICE_DELIVERY_MAP, SERVICE_OPTIONS } from "./CreateShipmentModal";
import {
  AlertTriangle,
  CheckCircle,
  XCircle,
  X,
  UserCheck,
  Loader2,
} from "lucide-react";

// ─── Status badge ─────────────────────────────────────────────────────────────
const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-700",
  BOOKED: "bg-blue-100 text-blue-700",
  AWAITING_PICKUP: "bg-indigo-100 text-indigo-700",
  CONFIRMED: "bg-blue-100 text-blue-700",
  PICKED_UP: "bg-purple-100 text-purple-700",
  IN_TRANSIT: "bg-orange-100 text-orange-700",
  OUT_FOR_DELIVERY: "bg-amber-100 text-amber-700",
  DELIVERED: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-600",
  FAILED: "bg-gray-100 text-gray-500",
  PENDING_ADMIN_REVIEW: "bg-yellow-50 text-yellow-600",
};

// Statuses where customer can request cancellation
// PRD Sprint 3 + 5: statuses where cancellation is allowed
// PICKED_UP → 92% refund; FAILED → 95% refund (aligned with backend)
const CANCELLABLE_STATUSES = [
  "PENDING",
  "BOOKED",
  "AWAITING_PICKUP",
  "CONFIRMED",
  "PICKED_UP",
  "FAILED",
];

// ─── ReviewStep ───────────────────────────────────────────────────────────────
function ReviewStep({ data }: { data: { shipment?: any; quote?: any } }) {
  const shipment = data.shipment;
  const service = shipment?.serviceType ?? "STANDARD";
  const deliveryTime = SERVICE_DELIVERY_MAP[service] ?? "—";
  const serviceLabel =
    SERVICE_OPTIONS.find((s) => s.value === service)?.label ?? service;

  const rows = (items: { label: string; value?: string | number | null }[]) =>
    items.map(({ label, value }) => (
      <div
        key={label}
        className="flex justify-between items-center py-[5px] border-b border-gray-100 last:border-none"
      >
        <span className="text-xs text-gray-500">{label}</span>
        <span className="text-xs font-medium text-gray-800">
          {value ?? "—"}
        </span>
      </div>
    ));

  if (!shipment) return null;

  return (
    <div className="space-y-5 mt-4">
      {/* Summary card */}
      <div className="w-full rounded-2xl bg-gray-900 p-5 text-center text-white">
        <p className="text-[10px] uppercase tracking-widest text-gray-400">
          Total Price
        </p>
        <h1 className="mt-1 text-3xl font-bold">
          ₦{(shipment.quotedPrice ?? 0).toLocaleString()}
        </h1>
        <div className="my-3 border-t border-dashed border-gray-700" />
        <div className="grid grid-cols-2 divide-x divide-gray-700">
          <div className="pr-3">
            <p className="text-[10px] text-gray-400">Delivery Time</p>
            <p className="text-sm font-semibold">{deliveryTime}</p>
          </div>
          <div className="pl-3">
            <p className="text-[10px] text-gray-400">Service Type</p>
            <p className="text-sm font-semibold">{serviceLabel}</p>
          </div>
        </div>
      </div>

      {/* Status badge */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
          Status
        </span>
        <span
          className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUS_STYLES[shipment.status] ?? "bg-gray-100 text-gray-600"}`}
        >
          {shipment.status?.replace(/_/g, " ")}
        </span>
      </div>

      {/* Order details */}
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-2">
          Order Details
        </p>
        {rows([
          {
            label: "Route",
            value: `${shipment.senderCity ?? "—"} → ${shipment.recipientCity ?? "—"}`,
          },
          {
            label: "Weight",
            value: `${shipment.weight ?? "—"} ${shipment.weightUnit ?? "KG"}`,
          },
          {
            label: "Distance",
            value: shipment.distanceKm ? `${shipment.distanceKm} km` : "—",
          },
          {
            label: "Insurance Value",
            value: shipment.insuranceValue
              ? `₦${shipment.insuranceValue.toLocaleString()}`
              : "None",
          },
          {
            label: "Pickup Date",
            value: shipment.pickupDate
              ? new Date(shipment.pickupDate).toLocaleDateString("en-NG")
              : "—",
          },
          {
            label: "Total",
            value: `₦${(shipment.quotedPrice ?? 0).toLocaleString()}`,
          },
        ])}
      </div>

      {/* Delivery details */}
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-2">
          Delivery Details
        </p>
        {rows([
          { label: "Sender Name", value: shipment.senderName },
          { label: "Sender Phone", value: shipment.senderPhone },
          { label: "Full Address", value: shipment.senderAddress },
          { label: "Sender City", value: shipment.senderCity },
          { label: "Sender State", value: shipment.senderState },
        ])}
        <div className="mt-2" />
        {rows([
          { label: "Receiver Name", value: shipment.recipientName },
          { label: "Receiver Phone", value: shipment.recipientPhone },
          { label: "Full Address", value: shipment.recipientAddress },
          { label: "Receiver City", value: shipment.recipientCity },
          { label: "Receiver State", value: shipment.recipientState },
          { label: "Notes", value: shipment.notes },
        ])}
      </div>
    </div>
  );
}

// ─── Cancel + Refund Preview ──────────────────────────────────────────────────
function CancelWithRefund({
  shipmentId,
  onDone,
}: {
  shipmentId: string;
  onDone: () => void;
}) {
  const [confirmed, setConfirmed] = useState(false);
  const [cancelShipment, { isLoading: cancelling }] =
    useCancelShipmentMutation();
  const { data: previewData, isLoading: loadingPreview } =
    useCancelPreviewQuery({ id: shipmentId });
  const preview = previewData?.data;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<{ reason: string }>({
    resolver: yupResolver(deleteShipmentSchema),
    defaultValues: { reason: "" },
  });

  const onSubmit = async (data: { reason: string }) => {
    await cancelShipment({ id: shipmentId, reason: data.reason }).unwrap();
    onDone();
  };

  if (loadingPreview) {
    return (
      <div className="py-6 text-center text-sm text-gray-400">
        Calculating refund...
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-4">
      {/* Refund preview card */}
      {preview && (
        <div
          className={`rounded-xl border p-4 ${
            preview.refundType === "FULL"
              ? "bg-green-50 border-green-200"
              : preview.refundType === "PARTIAL"
                ? "bg-yellow-50 border-yellow-200"
                : "bg-gray-50 border-gray-200"
          }`}
        >
          <div className="flex items-start gap-3">
            {preview.refundType === "FULL" ? (
              <CheckCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
            ) : preview.refundType === "PARTIAL" ? (
              <AlertTriangle className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
            ) : (
              <XCircle className="w-5 h-5 text-gray-500 shrink-0 mt-0.5" />
            )}
            <div>
              <p className="text-sm font-semibold text-gray-900">
                {preview.refundType === "FULL" && "Full Refund"}
                {preview.refundType === "PARTIAL" &&
                  `Partial Refund — ${preview.refundPercent}%`}
                {preview.refundType === "NONE" && "No Refund"}
              </p>
              {preview.refundAmount > 0 && (
                <p className="text-xl font-bold text-gray-900 mt-0.5">
                  ₦{preview.refundAmount.toLocaleString()}
                </p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                {preview.refundReason}
              </p>
              {preview.refundAmount > 0 && (
                <p className="text-xs text-gray-400 mt-1">{preview.note}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {!confirmed ? (
        <div className="flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={onDone}>
            Keep Shipment
          </Button>
          <Button
            className="flex-1 bg-red-600 hover:bg-red-700 text-white"
            onClick={() => setConfirmed(true)}
          >
            Proceed to Cancel
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <TextArea
            label="Reason for cancellation"
            placeholder="e.g. Changed delivery plans"
            error={errors.reason?.message}
            {...register("reason")}
          />
          <div className="flex gap-3">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => setConfirmed(false)}
              type="button"
            >
              Back
            </Button>
            <Button
              type="submit"
              isLoading={cancelling}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white"
            >
              Confirm Cancellation
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}

// ─── Main Modal ───────────────────────────────────────────────────────────────
export default function ViewShipmentModal({
  id,
  isOpen,
  setIsOpen,
}: {
  id: string;
  isOpen: boolean;
  setIsOpen: (v: boolean) => void;
}) {
  const [showCancel, setShowCancel] = useState(false);
  const [showAssign, setShowAssign] = useState(false);
  const [assignUserId, setAssignUserId] = useState("");

  const { isLoading, data: shipmentData } = useGetUserShipmentsByIdQuery({
    id,
  });
  const [initPayment, { isLoading: paying }] =
    useInitiateShipmentPaymentMutation();
  const [assignShipment, { isLoading: assigning }] =
    useAssignShipmentMutation();
  const currentUser = useSelector((s: RootState) => s.auth.user);

  // Fetch dispatchers for the assign dropdown (only when assign panel is open)
  const { data: dispatchersData } = useGetUsersQuery(
    { role: "ADMIN", adminSubRole: "ROLE_DISPATCHER" } as any,
    { skip: !showAssign },
  );
  const dispatchers: any[] = (dispatchersData as any)?.data?.users ?? [];

  const shipmentDetails = shipmentData?.data ?? {};
  const shipment = shipmentDetails?.shipment;

  const isOwner = currentUser?.id === shipment?.customerId;
  const isAdmin = currentUser?.role === "ADMIN";
  const adminSubRole = (currentUser as any)?.adminSubRole;
  // LOGISTICS_MANAGER and SUPER_ADMIN can assign dispatchers (PRD Sprint 8)
  const canAssignDispatcher =
    isAdmin &&
    ["SUPER_ADMIN", "LOGISTICS_MANAGER", "ROLE_ADMIN"].includes(adminSubRole);

  // Role-based button visibility
  const showPayButton =
    (isOwner || isAdmin) && shipment?.paymentStatus !== "PAID";
  const showCancelButton =
    (isOwner || isAdmin) && CANCELLABLE_STATUSES.includes(shipment?.status);
  const showAssignButton =
    canAssignDispatcher &&
    shipment &&
    !["DELIVERED", "CANCELLED", "FAILED"].includes(shipment.status);

  const handlePay = async () => {
    try {
      const callbackUrl = `${window.location.origin}/dashboard/payment/callback`;
      const result = await initPayment({
        shipmentId: id,
        callbackUrl,
        refundPolicyAccepted: true,
      }).unwrap();
      const url =
        (result as any)?.authorizationUrl ??
        (result as any)?.data?.authorizationUrl;
      if (url) window.location.href = url;
    } catch {}
  };

  const handleAssign = async () => {
    if (!assignUserId) return;
    try {
      await assignShipment({ id, userId: assignUserId }).unwrap();
      setShowAssign(false);
      setAssignUserId("");
    } catch {}
  };

  const handleClose = () => {
    setShowCancel(false);
    setShowAssign(false);
    setIsOpen(false);
  };

  return (
    <div className="flex items-center justify-center">
      <Dialog.Root
        open={isOpen}
        onOpenChange={(v) => {
          if (!v) handleClose();
          else setIsOpen(v);
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40" />
          <Dialog.Content
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-white rounded-2xl shadow-2xl w-full max-w-xl p-6 focus:outline-none"
            style={{ maxHeight: "90vh", overflowY: "auto" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-1">
              <Dialog.Title className="text-lg font-bold text-gray-900">
                {shipment?.trackingNumber ?? "Shipment"} Details
              </Dialog.Title>
              <Dialog.Close asChild>
                <button className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600">
                  <X className="w-4 h-4" />
                </button>
              </Dialog.Close>
            </div>

            {/* Loading */}
            {isLoading && (
              <div className="flex justify-center py-10">
                <div className="w-8 h-8 border-4 border-gray-200 border-t-gray-800 rounded-full animate-spin" />
              </div>
            )}

            {/* Content */}
            {!isLoading && (
              <>
                {showCancel ? (
                  <>
                    <p className="text-sm font-semibold text-red-600 mt-4 mb-1">
                      Cancel Shipment
                    </p>
                    <p className="text-xs text-gray-500">
                      Review the refund amount below before confirming.
                    </p>
                    <CancelWithRefund shipmentId={id} onDone={handleClose} />
                  </>
                ) : (
                  <>
                    <ReviewStep data={shipmentDetails} />

                    {/* Action buttons */}
                    <div className="mt-6 pt-4 border-t border-gray-100 space-y-2">
                      {/* Pay Now */}
                      {showPayButton && (
                        <Button
                          onClick={handlePay}
                          isLoading={paying}
                          className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 rounded-xl"
                        >
                          Pay Now — ₦
                          {shipment?.quotedPrice?.toLocaleString() ?? "0"}
                        </Button>
                      )}

                      {/* Assign Dispatcher — Sprint 8: MASTER / LOGISTICS_MANAGER only */}
                      {showAssignButton && !showAssign && (
                        <button
                          onClick={() => setShowAssign(true)}
                          className="w-full py-2.5 rounded-xl border border-blue-200 text-sm text-blue-700 hover:bg-blue-50 transition-colors font-medium flex items-center justify-center gap-2"
                        >
                          <UserCheck className="w-4 h-4" />
                          {shipment?.assignedTo
                            ? `Reassign Dispatcher (currently: ${shipment.assignedTo.firstName} ${shipment.assignedTo.lastName})`
                            : "Assign Dispatcher"}
                        </button>
                      )}

                      {/* Assign dispatcher dropdown (inline panel) */}
                      {showAssign && (
                        <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 space-y-3">
                          <p className="text-sm font-semibold text-blue-800">
                            Assign to Dispatcher
                          </p>
                          {dispatchers.length === 0 ? (
                            <p className="text-xs text-gray-500">
                              No dispatchers found. Invite one from Team
                              Management.
                            </p>
                          ) : (
                            <select
                              value={assignUserId}
                              onChange={(e) => setAssignUserId(e.target.value)}
                              className="w-full border border-blue-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
                            >
                              <option value="">Select a dispatcher…</option>
                              {dispatchers.map((d: any) => (
                                <option key={d.id} value={d.id}>
                                  {d.firstName} {d.lastName} — {d.email}
                                </option>
                              ))}
                            </select>
                          )}
                          <div className="flex gap-2">
                            <button
                              onClick={() => setShowAssign(false)}
                              className="flex-1 py-2 border border-gray-200 rounded-lg text-xs text-gray-600 hover:bg-gray-50"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={handleAssign}
                              disabled={!assignUserId || assigning}
                              className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-1.5"
                            >
                              {assigning && (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              )}
                              Confirm Assignment
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Cancel + Refund */}
                      {showCancelButton && (
                        <button
                          onClick={() => setShowCancel(true)}
                          className="w-full py-2.5 rounded-xl border border-red-200 text-sm text-red-600 hover:bg-red-50 transition-colors font-medium"
                        >
                          Cancel Shipment{" "}
                          {shipment?.paymentStatus === "PAID" ? "& Refund" : ""}
                        </button>
                      )}
                    </div>
                  </>
                )}
              </>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
