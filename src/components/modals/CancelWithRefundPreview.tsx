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
