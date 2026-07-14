"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { CancelWithRefundPreview } from "./CancelWithRefundPreview";

export default function CancelShipmentModal({
  isOpen,
  setIsOpen,
  id,
  shipmentStatus = "",
}: {
  isOpen: boolean;
  setIsOpen: (e: boolean) => void;
  id: string;
  shipmentStatus?: string;
}) {
  // Statuses where cancellation is not permitted at all — mirrors the
  // backend's own CANCELLABLE_STATUSES check (shipment.controller.js).
  // PICKED_UP and FAILED are intentionally NOT in this list — those are
  // still cancellable, just at a reduced refund %, which is exactly what
  // CancelWithRefundPreview's refund-preview card shows.
  const NON_CANCELLABLE = [
    "IN_TRANSIT",
    "OUT_FOR_DELIVERY",
    "DELIVERED",
    "CANCELLED",
    "RETURNED",
  ];
  const cannotCancel = NON_CANCELLABLE.includes(shipmentStatus);

  const cancelBlockedMessage =
    shipmentStatus === "DELIVERED"
      ? "This shipment has been delivered. Please file a damage or loss claim instead."
      : shipmentStatus === "CANCELLED"
        ? "This shipment is already cancelled."
        : "This shipment is in transit and cannot be cancelled. Contact support or file a claim after delivery.";

  const handleOpenChange = (v: boolean) => {
    setIsOpen(v);
  };

  return (
    <div className="flex items-center justify-center">
      <Dialog.Root open={isOpen} onOpenChange={handleOpenChange}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 animate-[fadeIn_150ms_ease]" />
          <Dialog.Content
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-white rounded-2xl shadow-2xl w-full max-w-xl p-6 focus:outline-none"
            style={{ maxHeight: "90vh", overflowY: "auto" }}
          >
            <div className="flex items-center justify-between mb-1">
              <Dialog.Close asChild>
                <button className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600">
                  <svg
                    viewBox="0 0 24 24"
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </Dialog.Close>
              <Dialog.Title className="text-xl font-bold text-gray-900">
                Cancel Shipment
              </Dialog.Title>
              <span className="w-6" />
            </div>

            {cannotCancel ? (
              <div className="mt-6 rounded-xl bg-red-50 border border-red-100 p-4 text-sm text-red-700">
                <p className="font-semibold mb-1">Cannot Cancel</p>
                <p>{cancelBlockedMessage}</p>
                <div className="flex justify-end mt-4">
                  <Dialog.Close asChild>
                    <button className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-medium transition-colors">
                      Close
                    </button>
                  </Dialog.Close>
                </div>
              </div>
            ) : (
              <>
                <p className="text-xs text-gray-500 mt-4">
                  Review the refund amount below before confirming.
                </p>
                <CancelWithRefundPreview
                  shipmentId={id}
                  onDone={() => setIsOpen(false)}
                />
              </>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp { from { opacity: 0; transform: translate(-50%, -46%) } to { opacity: 1; transform: translate(-50%, -50%) } }
      `}</style>
    </div>
  );
}
