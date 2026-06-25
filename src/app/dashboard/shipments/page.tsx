"use client";

/**
 * Shipments page — fully org-aware (Sprint 8 team feature)
 *
 * Context header shown to org team members:
 *   "Tunde Dispatcher — Acme Nigeria Ltd" with company badge
 *
 * Who sees what:
 *   SUPER_ADMIN / LOGISTICS_MANAGER  → all platform shipments, full actions
 *   ROLE_ADMIN                       → all shipments, no rate actions
 *   ROLE_DISPATCHER (org member)     → org shipments only + CREATE + UPDATE status
 *   ROLE_FINANCE (org member)        → org shipments read-only (for invoice matching)
 *   ROLE_MASTER (org owner)          → all org shipments + CREATE
 *   CUSTOMER                         → own shipments only
 *
 * Backend change required:
 *   adminListShipments() now scopes results by masterId for org roles.
 *   (shipment.controller.js updated in this patch)
 */

import { useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { AppTable } from "@/components/table/Table";
import { ShipmentColumns } from "@/components/table/columns/shipment-column";
import { Shipment } from "@/components/table/columns/shipment-column";
import CreateShipmentModal from "@/components/modals/CreateShipmentModal";
import { Button } from "@/components/ui/button";
import {
  useGetAdminShipmentsQuery,
  useGetUserShipmentsQuery,
  UserShipmentQueryParams,
} from "@/store/slice/apiSlice";
import { Package, Plus, Download, Building2, User } from "lucide-react";

const STATUS_OPTIONS = [
  "PENDING","CONFIRMED","AWAITING_PICKUP","PICKED_UP",
  "IN_TRANSIT","OUT_FOR_DELIVERY","DELIVERED","FAILED","CANCELLED","RETURNED",
];

function getShipments(response: any): Shipment[] {
  if (!response) return [];
  const d = response?.data;
  if (Array.isArray(d)) return d;
  if (d?.shipments) return d.shipments;
  return response?.shipments ?? [];
}

// ── Org context banner ────────────────────────────────────────────────────────
function OrgContextBanner({ user }: { user: any }) {
  const subRole = user?.adminSubRole ?? "";
  const ORG_ROLES = ["ROLE_DISPATCHER","ROLE_FINANCE","ROLE_MASTER","ROLE_USER"];
  if (!ORG_ROLES.includes(subRole)) return null;

  const roleLabel: Record<string, string> = {
    ROLE_DISPATCHER: "Dispatcher",
    ROLE_FINANCE:    "Finance",
    ROLE_MASTER:     "Company Owner",
    ROLE_USER:       "Viewer",
  };

  const isMaster = subRole === "ROLE_MASTER";

  return (
    <div className="flex items-center gap-3 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 mb-4">
      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
        <Building2 className="w-4 h-4 text-blue-600" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-blue-900 truncate">
          {user?.companyName || (isMaster ? "Your Organisation" : "Company Shipments")}
        </p>
        <p className="text-xs text-blue-600 mt-0.5">
          {roleLabel[subRole]} — you can see {isMaster ? "all team" : "your org's"} shipments
        </p>
      </div>
      <span className="text-[10px] font-bold uppercase tracking-wide bg-blue-600 text-white px-2 py-0.5 rounded-full">
        {roleLabel[subRole]}
      </span>
    </div>
  );
}

// ── Admin / Org staff shipments list ─────────────────────────────────────────
function AdminShipmentsList({ canCreate, canExport, isReadOnly }: {
  canCreate: boolean; canExport: boolean; isReadOnly: boolean;
}) {
  const [filters, setFilters] = useState({ status: "", search: "" });
  const [applied, setApplied] = useState(filters);
  const [createOpen, setCreateOpen] = useState(false);

  const { data, isLoading, isError } = useGetAdminShipmentsQuery(
    Object.fromEntries(Object.entries(applied).filter(([, v]) => Boolean(v)))
  );
  const shipments = getShipments(data);

  const handleExport = () => {
    const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "";
    const qs = new URLSearchParams(
      Object.fromEntries(Object.entries(applied).filter(([, v]) => Boolean(v)))
    ).toString();
    window.open(`${apiBase}/api/v1/shipments/export/csv${qs ? `?${qs}` : ""}`, "_blank");
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-end">
        <input
          value={filters.search}
          onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
          placeholder="Search tracking no, sender, city…"
          className="border rounded-xl px-3 py-2 text-sm bg-white min-w-[220px]"
        />
        <select
          value={filters.status}
          onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}
          className="border rounded-xl px-3 py-2 text-sm bg-white"
        >
          <option value="">All Statuses</option>
          {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.replace(/_/g," ")}</option>)}
        </select>
        <button onClick={() => setApplied(filters)}
          className="bg-brand text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-red-700 transition-colors">
          Filter
        </button>
        {(applied.status || applied.search) && (
          <button onClick={() => { setFilters({ status:"", search:"" }); setApplied({ status:"", search:"" }); }}
            className="text-sm text-gray-500 hover:text-red-600">
            Clear
          </button>
        )}
        <div className="ml-auto flex gap-2">
          {canExport && (
            <button onClick={handleExport}
              className="flex items-center gap-1.5 border rounded-xl px-4 py-2 text-sm font-medium hover:bg-gray-50 transition-colors">
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

      {isReadOnly && (
        <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-2.5 text-xs text-amber-700 font-medium">
          Read-only view — you can view and download shipments but cannot create or modify them.
        </div>
      )}

      {isLoading && <div className="py-12 text-center text-sm text-gray-400">Loading shipments…</div>}
      {isError   && <div className="py-12 text-center text-sm text-red-500">Failed to load shipments.</div>}
      {!isLoading && !isError && shipments.length === 0 && (
        <div className="py-16 text-center text-gray-400">
          <Package className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No shipments found.</p>
          {canCreate && (
            <button onClick={() => setCreateOpen(true)}
              className="mt-4 text-sm text-brand font-medium hover:underline">
              + Create your first shipment
            </button>
          )}
        </div>
      )}
      {!isLoading && shipments.length > 0 && (
        <AppTable columns={ShipmentColumns} data={shipments} />
      )}

      <CreateShipmentModal isOpen={createOpen} setIsOpen={setCreateOpen} initialValue={null} />
    </div>
  );
}

// ── Customer shipments list ───────────────────────────────────────────────────
function CustomerShipmentsList() {
  const [createOpen, setCreateOpen] = useState(false);
  const [filters, setFilters] = useState({ status: "" });
  const [applied, setApplied] = useState(filters);

  const { data, isLoading, isError } = useGetUserShipmentsQuery(
    Object.fromEntries(Object.entries(applied).filter(([, v]) => Boolean(v))) as UserShipmentQueryParams
  );
  const shipments = getShipments(data);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-end">
        <select value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}
          className="border rounded-xl px-3 py-2 text-sm bg-white">
          <option value="">All Statuses</option>
          {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.replace(/_/g," ")}</option>)}
        </select>
        <button onClick={() => setApplied(filters)}
          className="bg-brand text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-red-700">
          Filter
        </button>
        <div className="ml-auto">
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="w-4 h-4" /> Create Shipment
          </Button>
        </div>
      </div>

      {isLoading && <div className="py-12 text-center text-sm text-gray-400">Loading…</div>}
      {isError   && <div className="py-12 text-center text-sm text-red-500">Failed to load shipments.</div>}
      {!isLoading && !isError && shipments.length === 0 && (
        <div className="py-16 text-center text-gray-400">
          <Package className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No shipments yet.</p>
          <button onClick={() => setCreateOpen(true)}
            className="mt-4 text-sm text-brand font-medium hover:underline">
            + Create your first shipment
          </button>
        </div>
      )}
      {!isLoading && shipments.length > 0 && (
        <AppTable columns={ShipmentColumns} data={shipments} />
      )}

      <CreateShipmentModal isOpen={createOpen} setIsOpen={setCreateOpen} initialValue={null} />
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function ShipmentsPage() {
  const user    = useSelector((s: RootState) => s.auth.user) as any;
  const role    = user?.role;
  const subRole = user?.adminSubRole ?? "";

  const isCustomer = role === "CUSTOMER";

  // Capabilities per sub-role
  const canCreate  = ["SUPER_ADMIN","LOGISTICS_MANAGER","ROLE_ADMIN","ROLE_DISPATCHER","ROLE_MASTER"].includes(subRole);
  const canExport  = ["SUPER_ADMIN","LOGISTICS_MANAGER"].includes(subRole);
  const isReadOnly = ["ROLE_FINANCE","ROLE_AGENT"].includes(subRole);

  // Page title personalised for org members
  const pageTitle = (() => {
    if (subRole === "ROLE_MASTER")     return "Organisation Shipments";
    if (subRole === "ROLE_DISPATCHER") return "Team Shipments";
    if (subRole === "ROLE_FINANCE")    return "Shipments (Read-only)";
    return "Shipments";
  })();

  return (
    <div className="space-y-4">
      <h1 className="dashboard-heading">{pageTitle}</h1>
      {!isCustomer && <OrgContextBanner user={user} />}
      {isCustomer
        ? <CustomerShipmentsList />
        : <AdminShipmentsList canCreate={canCreate} canExport={canExport} isReadOnly={isReadOnly} />
      }
    </div>
  );
}
