"use client";

import { ColumnDef } from "@tanstack/react-table";
import { useState } from "react";
import { useInitiateShipmentPaymentMutation } from "@/store/slice/apiSlice";
import CancelShipmentModal from "@/components/modals/CancelShipmentModal";
import ViewShipmentModal from "@/components/modals/ViewShipmentModal";

// ─── Status badge ─────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<string, { label: string; className: string }> = {
  PENDING:              { label: "Pending",          className: "bg-yellow-100 text-yellow-600" },
  CONFIRMED:            { label: "Confirmed",         className: "bg-blue-100 text-blue-600" },
  PICKED_UP:            { label: "Picked Up",         className: "bg-indigo-100 text-indigo-600" },
  IN_TRANSIT:           { label: "In Transit",        className: "bg-purple-100 text-purple-600" },
  OUT_FOR_DELIVERY:     { label: "Out for Delivery",  className: "bg-orange-100 text-orange-600" },
  DELIVERED:            { label: "Delivered",         className: "bg-green-100 text-green-600" },
  FAILED:               { label: "Failed",            className: "bg-red-100 text-red-600" },
  CANCELLED:            { label: "Cancelled",         className: "bg-gray-200 text-gray-600" },
  RETURNED:             { label: "Returned",          className: "bg-pink-100 text-pink-600" },
  PENDING_ADMIN_REVIEW: { label: "Admin Review",      className: "bg-gray-100 text-gray-500" },
};

// ─── Types ────────────────────────────────────────────────────────────────────

export type Shipment = {
  id: string;
  trackingNumber: string;
  senderName: string;
  senderCity: string;
  senderPhone: string;
  recipientName: string;
  recipientPhone: string;
  recipientCity: string;
  status: string;
  paymentStatus?: string;
  finalPrice?: number;
  quotedPrice?: number;
  pickupDate: string;
};

// ─── Action cell — extracted as a proper React component so hooks work ────────

function ShipmentActionCell({ shipment }: { shipment: Shipment }) {
  const [openViewModal, setOpenViewModal] = useState(false);
  const [openCancelModal, setOpenCancelModal] = useState(false);
  const [initPayment, { isLoading: paying }] = useInitiateShipmentPaymentMutation();

  const needsPayment = shipment.paymentStatus !== "PAID";

  const handlePay = async () => {
    try {
      const callbackUrl = `${window.location.origin}/dashboard/payment/callback`;
      const result = await initPayment({ shipmentId: shipment.id, callbackUrl }).unwrap();
      const url =
        (result as any)?.authorizationUrl ??
        (result as any)?.data?.authorizationUrl;
      if (url) window.location.href = url;
    } catch {
      // error toast handled by apiSlice onQueryStarted
    }
  };

  return (
    <div className="flex flex-wrap gap-1.5">
      {/* Pay Now — only if not yet paid */}
      {needsPayment && (
        <button
          onClick={handlePay}
          disabled={paying}
          className="bg-brand hover:bg-red-700 text-white px-2.5 py-1 rounded-md text-xs font-semibold disabled:opacity-50 transition-colors"
        >
          {paying ? "..." : "Pay"}
        </button>
      )}

      {/* View */}
      <button
        onClick={() => setOpenViewModal(true)}
        className="text-blue-500 border border-blue-500 px-2.5 py-1 rounded-md text-xs hover:bg-blue-50 transition-colors"
      >
        View
      </button>

      {/* Cancel */}
      {!["DELIVERED", "CANCELLED", "RETURNED"].includes(shipment.status) && (
        <button
          onClick={() => setOpenCancelModal(true)}
          className="text-red-500 border border-red-500 px-2.5 py-1 rounded-md text-xs hover:bg-red-50 transition-colors"
        >
          Cancel
        </button>
      )}

      <ViewShipmentModal
        isOpen={openViewModal}
        setIsOpen={setOpenViewModal}
        id={shipment.id}
      />
      <CancelShipmentModal
        isOpen={openCancelModal}
        setIsOpen={setOpenCancelModal}
        id={shipment.id}
      />
    </div>
  );
}

// ─── Column definitions ───────────────────────────────────────────────────────

export const ShipmentColumns: ColumnDef<Shipment>[] = [
  {
    header: "S/N",
    cell: ({ row }) => <div className="text-gray-500">{row.index + 1}</div>,
  },

  {
    accessorKey: "trackingNumber",
    header: "Tracking No",
    cell: ({ row }) => (
      <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
        {row.getValue<string>("trackingNumber")}
      </span>
    ),
  },

  {
    id: "sender",
    header: "Sender",
    cell: ({ row }) => {
      const { senderName, senderPhone, senderCity } = row.original;
      return (
        <div className="text-sm">
          <p className="font-medium">{senderName}</p>
          <p className="text-gray-400 text-xs">{senderPhone} · {senderCity}</p>
        </div>
      );
    },
  },

  {
    id: "recipient",
    header: "Recipient",
    cell: ({ row }) => {
      const { recipientName, recipientPhone, recipientCity } = row.original;
      return (
        <div className="text-sm">
          <p className="font-medium">{recipientName}</p>
          <p className="text-gray-400 text-xs">{recipientPhone} · {recipientCity}</p>
        </div>
      );
    },
  },

  {
    id: "price",
    header: "Price",
    cell: ({ row }) => {
      const price = row.original.quotedPrice ?? row.original.finalPrice ?? 0;
      const ps = row.original.paymentStatus;
      return (
        <div className="text-sm">
          <p className="font-semibold">₦{price.toLocaleString()}</p>
          {ps && (
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${
              ps === "PAID"    ? "bg-green-100 text-green-600"
              : ps === "PENDING" ? "bg-yellow-100 text-yellow-600"
              : "bg-gray-100 text-gray-500"
            }`}>
              {ps.toLowerCase()}
            </span>
          )}
        </div>
      );
    },
  },

  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue<string>("status");
      const config = STATUS_STYLES[status] ?? { label: status, className: "bg-gray-100 text-gray-500" };
      return (
        <span className={`px-2 py-1 text-xs rounded-full font-medium ${config.className}`}>
          {config.label}
        </span>
      );
    },
  },

  {
    accessorKey: "pickupDate",
    header: "Pickup Date",
    cell: ({ row }) => {
      const d = row.getValue<string>("pickupDate");
      if (!d) return <span className="text-gray-400 text-xs">—</span>;
      return (
        <div className="text-xs text-gray-600">
          {new Date(d).toLocaleDateString()}
        </div>
      );
    },
  },

  {
    id: "action",
    header: "Action",
    cell: ({ row }) => <ShipmentActionCell shipment={row.original} />,
  },
];
