"use client";

import { useState } from "react";
import {
  useGetDeliverySLAQuery,
  useUpsertDeliverySLAMutation,
  useDeleteDeliverySLAMutation,
} from "@/store/slice/apiSlice";
import type { DeliverySLARow, ShipmentMode, ServiceType } from "@/store/slice/types";
import { Loader2, Pencil, Check, X, Trash2, Plus, Plane, Truck, Ship } from "lucide-react";

const SERVICE_TYPES: ServiceType[] = ["EXPRESS", "STANDARD", "ECONOMY"];
const ZONES = [1, 2, 3, 4] as const;

const ZONE_LABELS: Record<number, string> = {
  1: "Zone 1 — Same state / nearby",
  2: "Zone 2 — Adjacent states",
  3: "Zone 3 — Cross-region",
  4: "Zone 4 — Far / remote",
};

const SERVICE_COLORS: Record<string, string> = {
  EXPRESS: "text-orange-600 bg-orange-50",
  STANDARD: "text-blue-600 bg-blue-50",
  ECONOMY: "text-gray-600 bg-gray-100",
};

const MODE_TABS: { value: ShipmentMode; label: string; icon: React.ElementType }[] = [
  { value: "AIR", label: "Air", icon: Plane },
  { value: "LAND", label: "Land", icon: Truck },
  { value: "SEA", label: "Sea", icon: Ship },
];

// One cell of the zone × service grid, for a fixed mode. Handles both
// creating a new SLA (none configured yet for this zone/mode/service) and
// editing an existing one — both go through the same upsert, keyed by
// zone + shipmentMode + serviceType (never guessed or defaulted).
function EditCell({
  zone,
  mode,
  serviceType,
  sla,
}: {
  zone: number;
  mode: ShipmentMode;
  serviceType: ServiceType;
  sla?: DeliverySLARow;
}) {
  const [editing, setEditing] = useState(!sla);
  const [min, setMin] = useState(sla?.minDays ?? 1);
  const [max, setMax] = useState(sla?.maxDays ?? 1);
  const [upsertSLA, { isLoading: isSaving }] = useUpsertDeliverySLAMutation();
  const [deleteSLA, { isLoading: isDeleting }] = useDeleteDeliverySLAMutation();

  const save = async () => {
    if (min > max) return;
    await upsertSLA({ zone, shipmentMode: mode, serviceType, minDays: min, maxDays: max }).unwrap();
    setEditing(false);
  };

  const cancel = () => {
    if (!sla) return; // nothing to cancel back to — leave the add form open
    setEditing(false);
    setMin(sla.minDays);
    setMax(sla.maxDays);
  };

  const remove = async () => {
    if (!sla) return;
    await deleteSLA({ id: sla.id }).unwrap();
  };

  if (!editing) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">{sla!.label ?? `${sla!.minDays}–${sla!.maxDays} days`}</span>
        <button
          onClick={() => setEditing(true)}
          className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-blue-500 transition-colors"
          title="Edit"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={remove}
          disabled={isDeleting}
          className="p-1 rounded hover:bg-red-50 text-gray-300 hover:text-red-500 transition-colors disabled:opacity-40"
          title="Remove — this option becomes unsellable in this zone"
        >
          {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
        </button>
      </div>
    );
  }

  if (!sla) {
    return (
      <div className="flex items-center gap-1.5">
        <input
          type="number"
          min={0}
          max={30}
          value={min}
          onChange={(e) => setMin(Number(e.target.value))}
          className="w-14 border rounded-lg px-2 py-1 text-xs text-center"
        />
        <span className="text-gray-400 text-xs">to</span>
        <input
          type="number"
          min={0}
          max={30}
          value={max}
          onChange={(e) => setMax(Number(e.target.value))}
          className="w-14 border rounded-lg px-2 py-1 text-xs text-center"
        />
        <button
          onClick={save}
          disabled={isSaving || min > max}
          className="p-1 rounded bg-green-50 hover:bg-green-100 text-green-600 disabled:opacity-40"
          title="Add"
        >
          {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      <input
        type="number"
        min={0}
        max={30}
        value={min}
        onChange={(e) => setMin(Number(e.target.value))}
        className="w-14 border rounded-lg px-2 py-1 text-xs text-center"
      />
      <span className="text-gray-400 text-xs">to</span>
      <input
        type="number"
        min={0}
        max={30}
        value={max}
        onChange={(e) => setMax(Number(e.target.value))}
        className="w-14 border rounded-lg px-2 py-1 text-xs text-center"
      />
      <span className="text-xs text-gray-400">days</span>
      <button
        onClick={save}
        disabled={isSaving || min > max}
        className="p-1 rounded bg-green-50 hover:bg-green-100 text-green-600 disabled:opacity-40"
      >
        {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
      </button>
      <button onClick={cancel} className="p-1 rounded bg-red-50 hover:bg-red-100 text-red-500">
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

// Delivery times depend on zone, shipment mode AND service together — the
// same "Express" can mean a very different transit time by air vs land vs
// sea. This screen is therefore one grid PER MODE (tabs), never a single
// zone × service grid that silently applies to every mode at once.
export default function DeliverySLAManagementView() {
  const [mode, setMode] = useState<ShipmentMode>("LAND");
  const { data, isLoading } = useGetDeliverySLAQuery({ shipmentMode: mode });
  const slas: DeliverySLARow[] = data?.data?.slas ?? [];

  const getSLA = (zone: number, serviceType: ServiceType) =>
    slas.find((s) => s.zone === zone && s.serviceType === serviceType);

  return (
    <div>
      <div className="mb-4">
        <h3 className="text-base font-semibold text-gray-900">Delivery SLA Configuration</h3>
        <p className="text-sm text-gray-500 mt-1">
          Set the expected delivery window (in business days) for each zone,
          mode of shipment, and service type. These are shown to customers on
          the quote and booking screens and control the estimated delivery
          date. A cell left unconfigured means that option is not sellable in
          that zone.
        </p>
      </div>

      <div className="flex items-center gap-1.5 mb-4 bg-gray-100 rounded-xl p-1 w-fit">
        {MODE_TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.value}
              onClick={() => setMode(t.value)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                mode === t.value ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {t.label}
            </button>
          );
        })}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-5 py-3 font-semibold text-gray-700 w-64">Zone</th>
                {SERVICE_TYPES.map((s) => (
                  <th key={s} className="text-left px-5 py-3 font-semibold text-gray-700">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${SERVICE_COLORS[s]}`}>
                      {s}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ZONES.map((zone) => (
                <tr key={zone} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                  <td className="px-5 py-4">
                    <div className="font-medium text-gray-900">Zone {zone}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{ZONE_LABELS[zone]}</div>
                  </td>
                  {SERVICE_TYPES.map((sType) => (
                    <td key={sType} className="px-5 py-4">
                      <EditCell zone={zone} mode={mode} serviceType={sType} sla={getSLA(zone, sType)} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-xs text-gray-400 mt-3">
        ⏱ Business days exclude Saturdays and Sundays. Changes take effect
        immediately on new quotes; quotes already issued keep the delivery
        promise the customer was originally shown.
      </p>
    </div>
  );
}
