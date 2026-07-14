"use client";

import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { AppTable } from "@/components/table/Table";
import { ShipmentColumns } from "@/components/table/columns/shipment-column";
import { Shipment } from "@/components/table/columns/shipment-column";
import CreateShipmentModal from "@/components/modals/CreateShipmentModal";
import { Button } from "@/components/ui/button";
import {
  useGetAdminShipmentsQuery,
  useGetEnterpriseShipmentsQuery,
  useGetUserShipmentsQuery,
  useExportShipmentsCsvMutation,
  UserShipmentQueryParams,
} from "@/store/slice/apiSlice";
import { useResumeShipmentDraft } from "@/lib/shipmentDraft";
import { Package, Plus, Download, Building2, User } from "lucide-react";

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

function getShipments(response: any): Shipment[] {
  if (!response) return [];
  const d = response?.data;
  if (Array.isArray(d)) return d;
  if (d?.shipments) return d.shipments;
  return response?.shipments ?? [];
}

// ── Org context banner ────────────────────────────────────────────────────────
function OrgContextBanner({ user }: { user: any }) {
  const enterpriseRole = user?.enterpriseRole ?? "";
  const ORG_ROLES = [
    "ROLE_DISPATCHER",
    "ROLE_FINANCE",
    "ROLE_MASTER",
    "ROLE_AGENT",
    "ROLE_USER",
  ];
  if (!ORG_ROLES.includes(enterpriseRole)) return null;

  const roleLabel: Record<string, string> = {
    ROLE_DISPATCHER: "Dispatcher",
    ROLE_FINANCE: "Finance",
    ROLE_MASTER: "Company Owner",
    ROLE_AGENT: "Customer Service",
    ROLE_USER: "Viewer",
  };

  const isMaster = enterpriseRole === "ROLE_MASTER";

  return (
    <div className="flex items-center gap-3 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 mb-4">
      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
        <Building2 className="w-4 h-4 text-blue-600" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-blue-900 truncate">
          {user?.companyName ||
            (isMaster ? "Your Organisation" : "Company Shipments")}
        </p>
        <p className="text-xs text-blue-600 mt-0.5">
          {roleLabel[enterpriseRole]} — you can see{" "}
          {isMaster ? "all team" : "your org's"} shipments
        </p>
      </div>
      <span className="text-[10px] font-bold uppercase tracking-wide bg-blue-600 text-white px-2 py-0.5 rounded-full">
        {roleLabel[enterpriseRole]}
      </span>
    </div>
  );
}

// ── Admin / Org staff shipments list ─────────────────────────────────────────
function AdminShipmentsList({
  canCreate,
  canExport,
  isReadOnly,
  scope,
}: {
  canCreate: boolean;
  canExport: boolean;
  isReadOnly: boolean;
  /** "internal" = platform-wide (BowaGo staff). "enterprise" = tenant-scoped only. */
  scope: "internal" | "enterprise";
}) {
  const [filters, setFilters] = useState({ status: "", search: "" });
  const [applied, setApplied] = useState(filters);
  const [createOpen, setCreateOpen] = useState(false);

  const { shouldAutoOpen, prefill, consumed } = useResumeShipmentDraft();
  useEffect(() => {
    if (shouldAutoOpen && canCreate) {
      setCreateOpen(true);
      consumed();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldAutoOpen]);

  const appliedFilters = Object.fromEntries(
    Object.entries(applied).filter(([, v]) => Boolean(v)),
  );
  // Both hooks are always called (Rules of Hooks) — only the one matching
  // `scope` actually fires, via `skip`. Internal admin sees platform-wide
  // data; Enterprise sees only their own tenant's shipments.
  const adminQuery = useGetAdminShipmentsQuery(appliedFilters as any, {
    skip: scope !== "internal",
  });
  const enterpriseQuery = useGetEnterpriseShipmentsQuery(
    appliedFilters as any,
    {
      skip: scope !== "enterprise",
    },
  );
  const { data, isLoading, isError } =
    scope === "enterprise" ? enterpriseQuery : adminQuery;
  const shipments = getShipments(data);

  const [exportShipmentsCsv, { isLoading: isExporting }] =
    useExportShipmentsCsvMutation();

  const handleExport = () => {
    // window.open() can't attach the Authorization header this endpoint
    // requires, so it always 401'd regardless of the URL being correct —
    // exportShipmentsCsv (apiSlice.ts) does a real authenticated fetch +
    // blob download instead, the same fix pattern used for invoice download.
    exportShipmentsCsv({ status: applied.status || undefined });
  };

  // PRD Sprint 6: "Admin can download a CSV report of all Delivered shipments
  // for the previous month" — one-click shortcut instead of manually setting filters.
  const handleExportLastMonthDelivered = () => {
    const now = new Date();
    const firstOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const firstOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    exportShipmentsCsv({
      status: "DELIVERED",
      fromDate: firstOfLastMonth.toISOString(),
      toDate: firstOfThisMonth.toISOString(),
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-end">
        <input
          value={filters.search}
          onChange={(e) =>
            setFilters((f) => ({ ...f, search: e.target.value }))
          }
          placeholder="Search tracking no, sender, city…"
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
              disabled={isExporting}
              className="flex items-center gap-1.5 border rounded-xl px-4 py-2 text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <Download className="w-4 h-4" />{" "}
              {isExporting ? "Exporting…" : "Export CSV"}
            </button>
          )}
          {canExport && (
            <button
              onClick={handleExportLastMonthDelivered}
              disabled={isExporting}
              title="Delivered shipments, previous calendar month"
              className="flex items-center gap-1.5 border rounded-xl px-4 py-2 text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <Download className="w-4 h-4" />{" "}
              {isExporting ? "Exporting…" : "Last Month (Delivered)"}
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
          Read-only view — you can view and download shipments but cannot create
          or modify them.
        </div>
      )}

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
          {canCreate && (
            <button
              onClick={() => setCreateOpen(true)}
              className="mt-4 text-sm text-brand font-medium hover:underline"
            >
              + Create your first shipment
            </button>
          )}
        </div>
      )}
      {!isLoading && shipments.length > 0 && (
        <AppTable columns={ShipmentColumns} data={shipments} />
      )}

      <CreateShipmentModal
        isOpen={createOpen}
        setIsOpen={setCreateOpen}
        initialValue={prefill}
      />
    </div>
  );
}

// ── Customer shipments list ───────────────────────────────────────────────────
function CustomerShipmentsList() {
  const [createOpen, setCreateOpen] = useState(false);
  const [filters, setFilters] = useState({ status: "" });
  const [applied, setApplied] = useState(filters);

  // Resume a quote drafted on the landing page (or quote modal) before the
  // user signed up/logged in — auto-opens the modal pre-filled instead of
  // making them retype everything.
  const { shouldAutoOpen, prefill, consumed } = useResumeShipmentDraft();
  useEffect(() => {
    if (shouldAutoOpen) {
      setCreateOpen(true);
      consumed();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldAutoOpen]);

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
          <button
            onClick={() => setCreateOpen(true)}
            className="mt-4 text-sm text-brand font-medium hover:underline"
          >
            + Create your first shipment
          </button>
        </div>
      )}
      {!isLoading && shipments.length > 0 && (
        <AppTable columns={ShipmentColumns} data={shipments} />
      )}

      <CreateShipmentModal
        isOpen={createOpen}
        setIsOpen={setCreateOpen}
        initialValue={prefill}
      />
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function ShipmentsPage() {
  const user = useSelector((s: RootState) => s.auth.user) as any;
  const role = user?.role;
  const adminSubRole = user?.adminSubRole ?? "";
  const enterpriseRole = user?.enterpriseRole ?? "";

  const isCustomer = role === "CUSTOMER";
  const isEnterprise = role === "ENTERPRISE";
  const isAdmin = role === "ADMIN";

  // Internal admin staff who can even reach this page (requireLogisticsOrAbove)
  // can always create/export — the backend already gated entry.
  const adminCanCreate = isAdmin;
  const adminCanExport = isAdmin;

  // Enterprise capabilities are keyed off enterpriseRole, never adminSubRole.
  const enterpriseCanCreate = ["ROLE_MASTER", "ROLE_DISPATCHER"].includes(
    enterpriseRole,
  );
  const enterpriseCanExport = false; // CSV export is an internal-admin-only tool
  const enterpriseIsReadOnly = [
    "ROLE_FINANCE",
    "ROLE_AGENT",
    "ROLE_USER",
  ].includes(enterpriseRole);

  // Page title personalised for Enterprise members
  const pageTitle = (() => {
    if (!isEnterprise) return "Shipments";
    if (enterpriseRole === "ROLE_MASTER") return "Company Shipments";
    if (enterpriseRole === "ROLE_DISPATCHER") return "Team Shipments";
    if (enterpriseRole === "ROLE_FINANCE") return "Shipments (Read-only)";
    return "Shipments";
  })();

  return (
    <div className="space-y-4">
      <h1 className="dashboard-heading">{pageTitle}</h1>
      {isEnterprise && <OrgContextBanner user={user} />}
      {isCustomer && <CustomerShipmentsList />}
      {isEnterprise && (
        <AdminShipmentsList
          canCreate={enterpriseCanCreate}
          canExport={enterpriseCanExport}
          isReadOnly={enterpriseIsReadOnly}
          scope="enterprise"
        />
      )}
      {isAdmin && (
        <AdminShipmentsList
          canCreate={adminCanCreate}
          canExport={adminCanExport}
          isReadOnly={false}
          scope="internal"
        />
      )}
    </div>
  );
}
