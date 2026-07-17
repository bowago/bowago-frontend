"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { deleteShipmentSchema } from "@/lib/validation";
import { TextArea } from "../ui/input";
import { Button } from "../ui/button";
import {
  useCancelShipmentMutation,
  useCancelPreviewQuery,
} from "@/store/slice/apiSlice";

export function CancelWithRefundPreview({
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
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-900">
                {preview.refundType === "FULL" && "Full Refund"}
                {preview.refundType === "PARTIAL" &&
                  `Partial Refund — ${preview.refundPercent}%`}
                {preview.refundType === "NONE" && "No Refund"}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {preview.refundReason}
              </p>

              {/* Breakdown: what was paid, what's retained, what comes back —
                  always shown so the customer sees the math, not just a
                  headline number, even when nothing is being retained. */}
              {preview.paidAmount > 0 && (
                <div className="mt-3 rounded-lg bg-white/70 border border-black/5 divide-y divide-gray-100 text-sm">
                  <div className="flex items-center justify-between px-3 py-2">
                    <span className="text-gray-500">Amount Paid</span>
                    <span className="font-medium text-gray-900">
                      ₦{preview.paidAmount.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between px-3 py-2">
                    <span className="text-gray-500">
                      Retained{" "}
                      {preview.feePercent > 0 ? `(${preview.feePercent}% fee)` : ""}
                    </span>
                    <span
                      className={`font-medium ${
                        preview.amountRetained > 0
                          ? "text-red-600"
                          : "text-gray-400"
                      }`}
                    >
                      {preview.amountRetained > 0 ? "− " : ""}₦
                      {preview.amountRetained.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-b-lg">
                    <span className="font-semibold text-gray-700">
                      Final Refund Balance
                    </span>
                    <span className="font-bold text-gray-900">
                      ₦{preview.refundAmount.toLocaleString()}
                    </span>
                  </div>
                </div>
              )}

              {preview.amountRetained > 0 && (
                <p className="text-xs font-semibold text-yellow-700 bg-yellow-100 rounded px-2 py-1 mt-2 inline-block">
                  ⚠ ₦{preview.amountRetained.toLocaleString()} (
                  {preview.feePercent}%) will NOT be refunded
                </p>
              )}
              {preview.refundAmount > 0 && (
                <p className="text-xs text-gray-400 mt-2">{preview.note}</p>
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
