"use client";

import { useState } from "react";
import { useGetDeliverySLAQuery, useUpdateDeliverySLAMutation } from "@/store/slice/apiSlice";
import { Loader2, Pencil, Check, X } from "lucide-react";

const SERVICE_TYPES = ["EXPRESS", "STANDARD", "ECONOMY"] as const;
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

type SLA = {
  id: string;
  zone: number;
  serviceType: string;
  minDays: number;
  maxDays: number;
  label?: string;
};

function EditCell({ sla }: { sla: SLA }) {
  const [editing, setEditing] = useState(false);
  const [min, setMin] = useState(sla.minDays);
  const [max, setMax] = useState(sla.maxDays);
  const [updateSLA, { isLoading }] = useUpdateDeliverySLAMutation();

  const save = async () => {
    if (min > max) return;
    await updateSLA({ id: sla.id, minDays: min, maxDays: max }).unwrap();
    setEditing(false);
  };

  if (!editing) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">
          {sla.label ?? `${sla.minDays}–${sla.maxDays} days`}
        </span>
        <button
          onClick={() => setEditing(true)}
          className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-blue-500 transition-colors"
          title="Edit"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      <input
        type="number"
        min={1}
        max={30}
        value={min}
        onChange={(e) => setMin(Number(e.target.value))}
        className="w-14 border rounded-lg px-2 py-1 text-xs text-center"
      />
      <span className="text-gray-400 text-xs">to</span>
      <input
        type="number"
        min={1}
        max={30}
        value={max}
        onChange={(e) => setMax(Number(e.target.value))}
        className="w-14 border rounded-lg px-2 py-1 text-xs text-center"
      />
      <span className="text-xs text-gray-400">days</span>
      <button
        onClick={save}
        disabled={isLoading || min > max}
        className="p-1 rounded bg-green-50 hover:bg-green-100 text-green-600 disabled:opacity-40"
      >
        {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
      </button>
      <button
        onClick={() => { setEditing(false); setMin(sla.minDays); setMax(sla.maxDays); }}
        className="p-1 rounded bg-red-50 hover:bg-red-100 text-red-500"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

export default function DeliverySLAManagementView() {
  const { data, isLoading } = useGetDeliverySLAQuery();
  const slas: SLA[] = data?.data?.slas ?? [];

  const getSLA = (zone: number, serviceType: string) =>
    slas.find((s) => s.zone === zone && s.serviceType === serviceType);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4">
        <h3 className="text-base font-semibold text-gray-900">Delivery SLA Configuration</h3>
        <p className="text-sm text-gray-500 mt-1">
          Set the expected delivery window (in business days) for each zone and service type.
          These values are shown to customers in the booking modal and control the estimated delivery date.
        </p>
      </div>

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
                {SERVICE_TYPES.map((sType) => {
                  const sla = getSLA(zone, sType);
                  return (
                    <td key={sType} className="px-5 py-4">
                      {sla ? (
                        <EditCell sla={sla} />
                      ) : (
                        <span className="text-gray-300 text-xs">Not configured</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-gray-400 mt-3">
        ⏱ Business days exclude Saturdays and Sundays. Changes take effect immediately on new bookings.
      </p>
    </div>
  );
}
