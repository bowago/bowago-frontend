"use client";

import { useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { AppTable } from "@/components/table/Table";
import { ShipmentColumns } from "@/components/table/columns/shipment-column";
import CreateShipmentModal from "@/components/modals/CreateShipmentModal";
import { Button } from "@/components/ui/button";
import { useAppSelector } from "@/hooks/useStore";
import {
  useGetAdminShipmentsQuery,
  useGetUserShipmentsQuery,
  UserShipmentQueryParams,
} from "@/store/slice/apiSlice";
import { Package, Plus, Download } from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────
type Shipment = {
  id: string;
  trackingNumber: string;
  status: string;
  senderCity: string;
  recipientCity: string;
  quotedPrice: number;
  estimatedDelivery?: string;
  [key: string]: any;
};

function getShipments(response: any): Shipment[] {
  if (!response) return [];
  const d = response?.data;
  if (Array.isArray(d)) return d;
  if (d?.shipments) return d.shipments;
  if (Array.isArray(response)) return response;
  return response?.shipments ?? [];
}

const STATUS_OPTIONS = [
  "PENDING",
  "CONFIRMED",
  "AWAITING_PICKUP",
  "PICKED_UP",
  "IN_TRANSIT",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "FAILED",
  "CANCELLED",
  "RETURNED",
];

// ── Admin / Staff shipments list ───────────────────────────────────────────────
function AdminShipmentsList({
  canCreate,
  canExport,
}: {
  canCreate: boolean;
  canExport: boolean;
}) {
  const [filters, setFilters] = useState({ status: "", search: "" });
  const [applied, setApplied] = useState(filters);
  const [createOpen, setCreateOpen] = useState(false);

  const { data, isLoading, isError } = useGetAdminShipmentsQuery(
    Object.fromEntries(Object.entries(applied).filter(([, v]) => Boolean(v))),
  );
  const shipments = getShipments(data);

  const handleExport = () => {
    const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "";
    const qs = new URLSearchParams(
      Object.fromEntries(Object.entries(applied).filter(([, v]) => Boolean(v))),
    ).toString();
    window.open(
      `${apiBase}/api/v1/shipments/export/csv${qs ? `?${qs}` : ""}`,
      "_blank",
    );
  };

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="flex flex-wrap gap-3 items-end">
        <input
          value={filters.search}
          onChange={(e) =>
            setFilters((f) => ({ ...f, search: e.target.value }))
          }
          placeholder="Search tracking number or city…"
          className="border rounded-xl px-3 py-2 text-sm bg-white min-w-[220px]"
        />
        <select
          value={filters.status}
          onChange={(e) =>
            setFilters((f) => ({ ...f, status: e.target.value }))
          }
          className="border rounded-xl px-3 py-2 text-sm bg-white"
        >
          <option value="">All Statuses</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s.replace(/_/g, " ")}
            </option>
          ))}
        </select>
        <button
          onClick={() => setApplied(filters)}
          className="bg-brand text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-red-700 transition-colors"
        >
          Filter
        </button>
        {(applied.status || applied.search) && (
          <button
            onClick={() => {
              setFilters({ status: "", search: "" });
              setApplied({ status: "", search: "" });
            }}
            className="text-sm text-gray-500 hover:text-red-600"
          >
            Clear
          </button>
        )}
        <div className="ml-auto flex gap-2">
          {canExport && (
            <button
              onClick={handleExport}
              className="flex items-center gap-1.5 border rounded-xl px-4 py-2 text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              <Download className="w-4 h-4" /> Export CSV
            </button>
          )}
          {canCreate && (
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="w-4 h-4" /> Create Shipment
            </Button>
          )}
        </div>
      </div>

      {isLoading && (
        <div className="py-12 text-center text-sm text-gray-400">
          Loading shipments…
        </div>
      )}
      {isError && (
        <div className="py-12 text-center text-sm text-red-500">
          Failed to load shipments.
        </div>
      )}
      {!isLoading && !isError && shipments.length === 0 && (
        <div className="py-16 text-center text-gray-400">
          <Package className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No shipments found.</p>
        </div>
      )}
      {!isLoading && shipments.length > 0 && (
        <AppTable columns={ShipmentColumns} data={shipments} />
      )}

      <CreateShipmentModal
        isOpen={createOpen}
        setIsOpen={setCreateOpen}
        initialValue={null}
      />
    </div>
  );
}

// ── Customer shipments list ────────────────────────────────────────────────────
function CustomerShipmentsList() {
  const [createOpen, setCreateOpen] = useState(false);
  const [filters, setFilters] = useState({ status: "", search: "" });
  const [applied, setApplied] = useState(filters);

  const { data, isLoading, isError } = useGetUserShipmentsQuery(
    Object.fromEntries(
      Object.entries(applied).filter(([, v]) => Boolean(v)),
    ) as UserShipmentQueryParams,
  );
  const shipments = getShipments(data);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-end">
        <select
          value={filters.status}
          onChange={(e) =>
            setFilters((f) => ({ ...f, status: e.target.value }))
          }
          className="border rounded-xl px-3 py-2 text-sm bg-white"
        >
          <option value="">All Statuses</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s.replace(/_/g, " ")}
            </option>
          ))}
        </select>
        <button
          onClick={() => setApplied(filters)}
          className="bg-brand text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-red-700"
        >
          Filter
        </button>
        <div className="ml-auto">
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="w-4 h-4" /> Create Shipment
          </Button>
        </div>
      </div>

      {isLoading && (
        <div className="py-12 text-center text-sm text-gray-400">Loading…</div>
      )}
      {isError && (
        <div className="py-12 text-center text-sm text-red-500">
          Failed to load shipments.
        </div>
      )}
      {!isLoading && !isError && shipments.length === 0 && (
        <div className="py-16 text-center text-gray-400">
          <Package className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No shipments yet.</p>
        </div>
      )}
      {!isLoading && shipments.length > 0 && (
        <AppTable columns={ShipmentColumns} data={shipments} />
      )}

      <CreateShipmentModal
        isOpen={createOpen}
        setIsOpen={setCreateOpen}
        initialValue={null}
      />
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function ShipmentsPage() {
  const user = useSelector((s: RootState) => s.auth.user) as any;
  const role = user?.role;
  const subRole = user?.adminSubRole;

  const isCustomer = role === "CUSTOMER";

  // Who can create and export
  const canCreate = [
    "SUPER_ADMIN",
    "LOGISTICS_MANAGER",
    "ROLE_DISPATCHER",
    "ROLE_MASTER",
  ].includes(subRole);
  const canExport = ["SUPER_ADMIN", "LOGISTICS_MANAGER"].includes(subRole);

  return (
    <div className="space-y-6">
      <h1 className="dashboard-heading">Shipments</h1>
      {isCustomer ? (
        <CustomerShipmentsList />
      ) : (
        <AdminShipmentsList canCreate={canCreate} canExport={canExport} />
      )}
    </div>
  );
}
