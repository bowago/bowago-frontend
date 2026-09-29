"use client";

import { useState } from "react";
import {
  useGetOfferingsAdminQuery,
  useGetOfferingCoverageQuery,
  useGetOfferingRateWarningsQuery,
  useUpdateOfferingMutation,
} from "@/store/slice/apiSlice";
import type { ServiceOffering } from "@/store/slice/types";
import AddOfferingModal from "../modals/AddOfferingModal";
import {
  Loader2,
  Pencil,
  Plane,
  Truck,
  Ship,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Plus,
} from "lucide-react";

const MODE_META: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  AIR: { label: "Air", icon: Plane, color: "text-purple-600 bg-purple-50" },
  LAND: { label: "Land", icon: Truck, color: "text-amber-600 bg-amber-50" },
  SEA: { label: "Sea", icon: Ship, color: "text-sky-600 bg-sky-50" },
};

// Per-zone coverage detail for one offering, fetched only when expanded.
function CoverageDetail({ offeringId }: { offeringId: string }) {
  const { data, isLoading } = useGetOfferingCoverageQuery(offeringId);
  const coverage = data?.data?.coverage ?? [];

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-xs text-gray-400 py-3">
        <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading coverage…
      </div>
    );
  }

  return (
    <table className="w-full text-xs">
      <thead>
        <tr className="text-left text-gray-400">
          <th className="py-1.5 pr-4 font-medium">Zone</th>
          <th className="py-1.5 pr-4 font-medium">Rate</th>
          <th className="py-1.5 pr-4 font-medium">Delivery SLA</th>
          <th className="py-1.5 font-medium">Sellable</th>
        </tr>
      </thead>
      <tbody>
        {coverage.map((c) => (
          <tr key={c.zone} className="border-t border-gray-50">
            <td className="py-1.5 pr-4 font-medium text-gray-700">Zone {c.zone}</td>
            <td className="py-1.5 pr-4">
              {c.hasRate ? (
                <span className="text-green-600">✓ {c.rateBandCount} band(s)</span>
              ) : (
                <span className="text-red-400">Missing</span>
              )}
            </td>
            <td className="py-1.5 pr-4">
              {c.hasSla ? (
                <span className="text-green-600">{c.sla?.label ?? `${c.sla?.minDays}–${c.sla?.maxDays} days`}</span>
              ) : (
                <span className="text-red-400">Not configured</span>
              )}
            </td>
            <td className="py-1.5">
              <span
                className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${
                  c.sellable ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-500"
                }`}
              >
                {c.sellable ? "Sellable" : "Not sellable"}
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function OfferingRow({ offering }: { offering: ServiceOffering }) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [updateOffering, { isLoading: isToggling }] = useUpdateOfferingMutation();
  const meta = MODE_META[offering.shipmentMode];
  const Icon = meta.icon;

  const toggleActive = async () => {
    try {
      await updateOffering({ id: offering.id, isActive: !offering.isActive }).unwrap();
    } catch {
      // error toast already shown by the mutation's onQueryStarted — e.g.
      // OFFERING_NOT_SELLABLE when trying to activate with no coverage yet.
    }
  };

  return (
    <>
      <tr className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
        <td className="px-5 py-4">
          <div className="flex items-center gap-3">
            <span className={`w-9 h-9 rounded-full flex items-center justify-center ${meta.color}`}>
              <Icon className="w-4 h-4" />
            </span>
            <div>
              <div className="font-medium text-gray-900">
                {offering.displayName ?? `${meta.label} ${offering.serviceType}`}
              </div>
              <div className="text-xs text-gray-400">
                {meta.label} · {offering.serviceType.charAt(0) + offering.serviceType.slice(1).toLowerCase()}
              </div>
            </div>
          </div>
        </td>
        <td className="px-5 py-4">
          <span className="text-sm text-gray-700">
            {offering.coverage.sellableZones} / {offering.coverage.zones} zones sellable
          </span>
          {(offering.coverage.missingSla.length > 0 || offering.coverage.missingRate.length > 0) && (
            <div className="text-[11px] text-amber-600 mt-0.5">
              {offering.coverage.missingRate.length > 0 && `No rate: zone ${offering.coverage.missingRate.join(", ")}`}
              {offering.coverage.missingRate.length > 0 && offering.coverage.missingSla.length > 0 && " · "}
              {offering.coverage.missingSla.length > 0 && `No SLA: zone ${offering.coverage.missingSla.join(", ")}`}
            </div>
          )}
        </td>
        <td className="px-5 py-4">
          <button
            onClick={toggleActive}
            disabled={isToggling}
            className={`px-2.5 py-1 text-xs rounded-full font-medium transition-colors disabled:opacity-50 ${
              offering.isActive
                ? "bg-green-100 text-green-600 hover:bg-green-200"
                : "bg-gray-100 text-gray-500 hover:bg-gray-200"
            }`}
            title="Click to toggle — activating requires at least one sellable zone"
          >
            {isToggling ? <Loader2 className="w-3 h-3 animate-spin inline" /> : offering.isActive ? "Active" : "Inactive"}
          </button>
        </td>
        <td className="px-5 py-4">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setEditing(true)}
              className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-blue-500 transition-colors"
              title="Edit"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setExpanded((v) => !v)}
              className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
              title="Coverage detail"
            >
              {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
        </td>
      </tr>
      {expanded && (
        <tr className="bg-gray-50/70 border-b border-gray-100">
          <td colSpan={4} className="px-5 py-3">
            <CoverageDetail offeringId={offering.id} />
          </td>
        </tr>
      )}
      <AddOfferingModal isOpen={editing} setIsOpen={setEditing} editingOffering={offering} />
    </>
  );
}

// Advisory-only: surfaces suspicious rate relationships (e.g. Air cheaper
// than Land) without ever blocking a save — commercial exceptions are
// legitimate and the skill this platform follows explicitly forbids treating
// "Air > Land > Sea" as a universal law.
function RateWarningsBanner() {
  const { data } = useGetOfferingRateWarningsQuery({});
  const warnings = data?.data?.warnings ?? [];
  const [dismissed, setDismissed] = useState(false);

  if (warnings.length === 0 || dismissed) return null;

  return (
    <div className="mb-4 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-xs font-semibold text-amber-800">
              {warnings.length} rate relationship{warnings.length === 1 ? "" : "s"} worth a second look
            </p>
            <ul className="text-xs text-amber-700 mt-1 space-y-0.5">
              {warnings.slice(0, 5).map((w, i) => (
                <li key={i}>{w.message}</li>
              ))}
            </ul>
            <p className="text-[11px] text-amber-600 mt-1.5">
              Advisory only — a real commercial exception (e.g. a subsidized
              Air rate) is fine. Nothing here is blocked.
            </p>
          </div>
        </div>
        <button onClick={() => setDismissed(true)} className="text-amber-600 text-xs font-medium shrink-0">
          Dismiss
        </button>
      </div>
    </div>
  );
}

// Every real, purchasable shipping product (mode + service). Combinations
// that are not defined here do not exist and can never be quoted — this is
// the single place that decides what BowaGO actually sells.
export default function OfferingManagementView() {
  const { data, isLoading } = useGetOfferingsAdminQuery();
  const offerings: ServiceOffering[] = data?.data?.offerings ?? [];
  const [creating, setCreating] = useState(false);

  return (
    <div>
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h3 className="text-base font-semibold text-gray-900">Shipping Offerings</h3>
          <p className="text-sm text-gray-500 mt-1">
            The real products BowaGO sells — a mode of shipment combined with
            a service level. A combination not listed here (e.g. Sea +
            Express) is not offered and can never be quoted. An offering can
            only be activated once at least one zone has both a usable rate
            and a delivery SLA.
          </p>
        </div>
        <button
          onClick={() => setCreating(true)}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-xl hover:bg-red-700 transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" /> Define Offering
        </button>
      </div>

      <RateWarningsBanner />

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      ) : offerings.length === 0 ? (
        <p className="text-sm text-gray-400 py-6 text-center">
          No offerings defined yet. Click &quot;Define Offering&quot; to create the first one.
        </p>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-5 py-3 font-semibold text-gray-700">Offering</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-700">Coverage</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-700">Status</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-700 w-20">Actions</th>
              </tr>
            </thead>
            <tbody>
              {offerings.map((o) => (
                <OfferingRow key={o.id} offering={o} />
              ))}
            </tbody>
          </table>
        </div>
      )}

      <AddOfferingModal isOpen={creating} setIsOpen={setCreating} />
    </div>
  );
}
