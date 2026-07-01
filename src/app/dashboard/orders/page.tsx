"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Package, RefreshCw, Search, ChevronRight, Clock, CheckCircle2, XCircle, Loader2, AlertTriangle } from "lucide-react";
import {
  useGetUserShipmentsQuery,
  useGetReorderPrefillQuery,
} from "@/store/slice/apiSlice";
import { LoyaltyDashboardCard } from "@/components/layout/LoyaltyView";
import CreateShipmentModal from "@/components/modals/CreateShipmentModal";

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  PENDING:            { label: "Pending",          color: "text-yellow-700", bg: "bg-yellow-50",  icon: <Clock className="w-3.5 h-3.5" /> },
  AWAITING_PICKUP:    { label: "Awaiting Pickup",  color: "text-blue-700",   bg: "bg-blue-50",    icon: <Clock className="w-3.5 h-3.5" /> },
  CONFIRMED:          { label: "Confirmed",         color: "text-blue-700",   bg: "bg-blue-50",    icon: <Clock className="w-3.5 h-3.5" /> },
  PICKED_UP:          { label: "Picked Up",         color: "text-indigo-700", bg: "bg-indigo-50",  icon: <Package className="w-3.5 h-3.5" /> },
  IN_TRANSIT:         { label: "In Transit",        color: "text-orange-700", bg: "bg-orange-50",  icon: <Package className="w-3.5 h-3.5" /> },
  OUT_FOR_DELIVERY:   { label: "Out for Delivery",  color: "text-purple-700", bg: "bg-purple-50",  icon: <Package className="w-3.5 h-3.5" /> },
  DELIVERED:          { label: "Delivered",         color: "text-green-700",  bg: "bg-green-50",   icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  CANCELLED:          { label: "Cancelled",         color: "text-gray-600",   bg: "bg-gray-100",   icon: <XCircle className="w-3.5 h-3.5" /> },
  FAILED:             { label: "Failed",            color: "text-red-700",    bg: "bg-red-50",     icon: <XCircle className="w-3.5 h-3.5" /> },
  RETURNED:           { label: "Returned",          color: "text-pink-700",   bg: "bg-pink-50",    icon: <RefreshCw className="w-3.5 h-3.5" /> },
  PENDING_ADMIN_REVIEW:{ label: "Paused",           color: "text-orange-700", bg: "bg-orange-50",  icon: <AlertTriangle className="w-3.5 h-3.5" /> },
};

function formatNaira(n: number) {
  return `₦${n.toLocaleString("en-NG", { minimumFractionDigits: 0 })}`;
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });
}

// ── Reorder button — fetches prefill data, then opens the booking modal ───────
function ReorderButton({ shipmentId }: { shipmentId: string }) {
  const [armed, setArmed] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const { data: prefillData, isFetching } = useGetReorderPrefillQuery(shipmentId, {
    skip: !armed,
  });

  const handleClick = () => {
    if (!armed) {
      setArmed(true);
    }
  };

  // Once the prefill data arrives, open the modal
  const prefill = (prefillData as any)?.data?.prefill;
  if (armed && prefill && !isFetching && !modalOpen) {
    setModalOpen(true);
  }

  // Map prefill field names to what CreateShipmentModal expects as initialValue
  const initialValue = prefill
    ? {
        fromCity:        prefill.senderCity,
        toCity:          prefill.recipientCity,
        serviceType:     prefill.serviceType,
        weight:          prefill.weight,
        cartons:         prefill.cartons,
        senderName:      prefill.senderName,
        senderPhone:     prefill.senderPhone,
        senderAddress:   prefill.senderAddress,
        senderState:     prefill.senderState,
        receiverName:    prefill.recipientName,
        receiverPhone:   prefill.recipientPhone,
        receiverAddress: prefill.recipientAddress,
        receiverState:   prefill.recipientState,
        description:     prefill.description,
        notes:           prefill.notes,
      }
    : {};

  return (
    <>
      <button
        onClick={handleClick}
        disabled={isFetching}
        className="flex items-center gap-1.5 text-xs font-medium border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50 transition-colors disabled:opacity-60"
      >
        {isFetching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
        Reorder
      </button>

      {modalOpen && (
        <CreateShipmentModal
          isOpen={modalOpen}
          setIsOpen={(v) => {
            setModalOpen(v);
            if (!v) setArmed(false);
          }}
          initialValue={initialValue}
        />
      )}
    </>
  );
}

// ── Shipment row ──────────────────────────────────────────────────────────────
function ShipmentRow({ shipment }: { shipment: any }) {
  const router = useRouter();
  const sc = STATUS_CONFIG[shipment.status] ?? STATUS_CONFIG.PENDING;

  return (
    <div
      className="bg-white border border-gray-100 rounded-2xl p-4 hover:shadow-sm transition-shadow cursor-pointer"
      onClick={() => router.push(`/dashboard/shipments/${shipment.id}`)}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="font-mono text-sm font-semibold text-gray-800">{shipment.trackingNumber}</span>
            <span className={`flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${sc.bg} ${sc.color}`}>
              {sc.icon} {sc.label}
            </span>
          </div>
          <p className="text-sm text-gray-600 truncate">
            {shipment.senderCity} → {shipment.recipientCity}
          </p>
          <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-400">
            <span>{formatDate(shipment.createdAt)}</span>
            <span>·</span>
            <span>{shipment.serviceType}</span>
            <span>·</span>
            <span>{shipment.weight}kg</span>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          <span className="text-sm font-semibold text-gray-800">
            {formatNaira(shipment.finalPrice ?? shipment.quotedPrice)}
          </span>
          <div className="flex items-center gap-2">
            {shipment.status === "DELIVERED" && (
              <ReorderButton shipmentId={shipment.id} />
            )}
            <ChevronRight className="w-4 h-4 text-gray-300" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
const STATUS_FILTERS = [
  { label: "All", value: "" },
  { label: "Active", value: "IN_TRANSIT" },
  { label: "Delivered", value: "DELIVERED" },
  { label: "Pending", value: "PENDING" },
  { label: "Cancelled", value: "CANCELLED" },
];

export default function OrderHistoryPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const { data, isLoading } = useGetUserShipmentsQuery({ search, status: statusFilter });
  const shipments: any[] = (data as any)?.data?.shipments ?? [];

  return (
    <div className="pb-12">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="dashboard-heading">Order History</h1>
          <p className="text-sm text-gray-500 mt-0.5">All your shipments, with one-click reorder on delivered ones.</p>
        </div>
      </div>

      {/* Loyalty card inline */}
      <div className="mb-6">
        <LoyaltyDashboardCard />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by tracking number or city…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                statusFilter === f.value
                  ? "bg-brand text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : shipments.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-gray-200 rounded-2xl">
          <Package className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-500">No shipments found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {shipments.map((s: any) => (
            <ShipmentRow key={s.id} shipment={s} />
          ))}
        </div>
      )}
    </div>
  );
}
