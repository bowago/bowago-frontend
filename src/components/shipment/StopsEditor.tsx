"use client";

import { useEffect, useState } from "react";
import { ArrowDown, ArrowUp, Loader2, MapPin, Plus, Trash2 } from "lucide-react";
import {
  useGetShipmentStopsQuery,
  useReplaceShipmentStopsMutation,
} from "@/store/slice/apiSlice";
import { cn } from "@/lib/utils";

type Stop = {
  id?: string;
  type: "PICKUP" | "DELIVERY";
  sequence?: number;
  address: string;
  city?: string | null;
  state?: string | null;
  contactName?: string | null;
  contactPhone?: string | null;
  contactAltPhone?: string | null;
  units?: number | string | null;
  status?: "PENDING" | "COMPLETED" | "FAILED" | "SKIPPED";
  completedAt?: string | null;
};

// The server refuses a route change once goods have moved; this only decides
// whether to offer the editor.
const EDITABLE_STATUSES = ["PENDING", "BOOKED", "AWAITING_PICKUP", "CONFIRMED", "PENDING_ADMIN_REVIEW"];

const blank = (type: Stop["type"]): Stop => ({ type, address: "", city: "", state: "", contactName: "", contactPhone: "", units: "" });

/** A single-leg shipment, shown as the two stops it really is, so ops can start from it. */
function legacyStops(s: any): Stop[] {
  return [
    { type: "PICKUP", address: s.senderAddress ?? "", city: s.senderCity ?? "", state: s.senderState ?? "", contactName: s.senderName ?? "", contactPhone: s.senderPhone ?? "", units: "" },
    { type: "DELIVERY", address: s.recipientAddress ?? "", city: s.recipientCity ?? "", state: s.recipientState ?? "", contactName: s.recipientName ?? "", contactPhone: s.recipientPhone ?? "", units: s.cartons ?? "" },
  ];
}

const STOP_STYLE: Record<string, string> = {
  PENDING: "bg-gray-100 text-gray-600 border-gray-200",
  COMPLETED: "bg-green-50 text-green-700 border-green-200",
  FAILED: "bg-red-50 text-red-700 border-red-200",
  SKIPPED: "bg-gray-100 text-gray-400 border-gray-200",
};

const input = "w-full rounded-lg border border-gray-200 px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30";

export default function StopsEditor({
  shipment,
  canEdit,
}: {
  shipment: any;
  /** Internal ops only; the server enforces this too. */
  canEdit: boolean;
}) {
  const { data, isLoading } = useGetShipmentStopsQuery(shipment.id);
  const [save, { isLoading: saving }] = useReplaceShipmentStopsMutation();

  const saved: Stop[] = data?.data?.stops ?? [];
  const progress = data?.data?.progress;
  const hasStops = saved.length > 0;
  const anyDone = saved.some((s) => s.status !== "PENDING");
  const editable = canEdit && EDITABLE_STATUSES.includes(shipment.status) && !anyDone;

  const [editing, setEditing] = useState(false);
  const [rows, setRows] = useState<Stop[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!editing) setRows(hasStops ? saved.map((s) => ({ ...s })) : legacyStops(shipment));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing, data, shipment.id]);

  const set = (i: number, patch: Partial<Stop>) => setRows((r) => r.map((s, k) => (k === i ? { ...s, ...patch } : s)));
  const move = (i: number, d: -1 | 1) =>
    setRows((r) => {
      const j = i + d;
      if (j < 0 || j >= r.length) return r;
      const c = [...r];
      [c[i], c[j]] = [c[j], c[i]];
      return c;
    });

  const validate = (): string | null => {
    if (!rows.some((r) => r.type === "PICKUP")) return "Add at least one pickup.";
    if (!rows.some((r) => r.type === "DELIVERY")) return "Add at least one delivery.";
    const bad = rows.findIndex((r) => !r.address.trim());
    if (bad >= 0) return `Stop ${bad + 1} needs an address.`;
    const u = rows.findIndex((r) => r.units !== "" && r.units != null && (!Number.isInteger(Number(r.units)) || Number(r.units) < 0));
    if (u >= 0) return `Stop ${u + 1}: units must be a whole number.`;
    return null;
  };

  const submit = async () => {
    const problem = validate();
    setError(problem);
    if (problem) return;
    const stops = rows.map((r) => ({
      type: r.type,
      address: r.address.trim(),
      city: r.city || undefined,
      state: r.state || undefined,
      contactName: r.contactName || undefined,
      contactPhone: r.contactPhone || undefined,
      units: r.units === "" || r.units == null ? undefined : Number(r.units),
    }));
    try {
      await save({ id: shipment.id, stops }).unwrap();
      setEditing(false);
    } catch {
      /* the mutation shows the server's message */
    }
  };

  if (isLoading) return null;
  // Nothing to show to anyone, and nothing ops can change.
  if (!hasStops && !editable) return null;

  return (
    <div className="bg-white border rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-xs font-semibold text-gray-400 uppercase flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5" /> Route{hasStops ? ` · ${saved.length} stops` : ""}
        </h4>
        {progress && progress.deliveriesTotal > 1 && (
          <span className="text-xs text-gray-500">
            {progress.deliveriesDone} of {progress.deliveriesTotal} deliveries done
          </span>
        )}
        {editable && !editing && (
          <button onClick={() => setEditing(true)} className="text-sm text-brand hover:underline">
            {hasStops ? "Edit route" : "Add stops"}
          </button>
        )}
      </div>

      {!editing && hasStops && (
        <ol className="space-y-2">
          {saved.map((s) => (
            <li key={s.id ?? s.sequence} className="flex gap-3 text-sm">
              <span className="w-6 h-6 shrink-0 rounded-full bg-gray-900 text-white text-xs flex items-center justify-center">{s.sequence}</span>
              <div className="flex-1 min-w-0">
                <p className="font-medium">
                  {s.type === "PICKUP" ? "Pickup" : "Delivery"}
                  {s.units != null && s.type === "DELIVERY" ? ` · ${s.units} units` : ""}
                </p>
                <p className="text-gray-500">{s.address}</p>
                <p className="text-gray-400">
                  {[s.city, s.state].filter(Boolean).join(", ")}
                  {s.contactName || s.contactPhone ? ` · ${[s.contactName, s.contactPhone].filter(Boolean).join(" ")}` : ""}
                </p>
              </div>
              <span className={cn("self-start text-xs px-2 py-0.5 rounded-full border", STOP_STYLE[s.status ?? "PENDING"])}>
                {(s.status ?? "PENDING").toLowerCase()}
              </span>
            </li>
          ))}
        </ol>
      )}

      {editing && (
        <div className="space-y-3">
          {rows.map((r, i) => (
            <div key={i} className="border rounded-lg p-3 space-y-2 bg-gray-50/50">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-gray-900 text-white text-xs flex items-center justify-center">{i + 1}</span>
                <select value={r.type} onChange={(e) => set(i, { type: e.target.value as Stop["type"] })} className={cn(input, "w-32")}>
                  <option value="PICKUP">Pickup</option>
                  <option value="DELIVERY">Delivery</option>
                </select>
                <div className="ml-auto flex gap-1">
                  <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-30" aria-label="Move up"><ArrowUp className="w-4 h-4" /></button>
                  <button type="button" onClick={() => move(i, 1)} disabled={i === rows.length - 1} className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-30" aria-label="Move down"><ArrowDown className="w-4 h-4" /></button>
                  <button type="button" onClick={() => setRows((x) => x.filter((_, k) => k !== i))} disabled={rows.length <= 2} className="p-1.5 rounded hover:bg-red-50 text-red-600 disabled:opacity-30" aria-label="Remove stop"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
              <input className={input} placeholder="Address" value={r.address} onChange={(e) => set(i, { address: e.target.value })} />
              <div className="grid grid-cols-2 gap-2">
                <input className={input} placeholder="City" value={r.city ?? ""} onChange={(e) => set(i, { city: e.target.value })} />
                <input className={input} placeholder="State" value={r.state ?? ""} onChange={(e) => set(i, { state: e.target.value })} />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <input className={input} placeholder="Contact name" value={r.contactName ?? ""} onChange={(e) => set(i, { contactName: e.target.value })} />
                <input className={input} placeholder="Contact phone" value={r.contactPhone ?? ""} onChange={(e) => set(i, { contactPhone: e.target.value })} />
                <input className={input} placeholder="Units" inputMode="numeric" value={r.units ?? ""} onChange={(e) => set(i, { units: e.target.value })} />
              </div>
            </div>
          ))}
          <div className="flex gap-2">
            <button type="button" onClick={() => setRows((x) => [...x, blank("PICKUP")])} className="text-sm flex items-center gap-1 text-gray-600 hover:text-gray-900"><Plus className="w-4 h-4" /> Pickup</button>
            <button type="button" onClick={() => setRows((x) => [...x, blank("DELIVERY")])} className="text-sm flex items-center gap-1 text-gray-600 hover:text-gray-900"><Plus className="w-4 h-4" /> Delivery</button>
          </div>
          <p className="text-xs text-gray-400">
            The first pickup and first delivery stay the shipment&apos;s sender and recipient everywhere else. Changing the route does not change the price.
          </p>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => { setEditing(false); setError(null); }} className="px-4 py-2 text-sm rounded-lg border hover:bg-gray-50">Cancel</button>
            <button type="button" onClick={submit} disabled={saving} className="px-4 py-2 text-sm rounded-lg bg-brand text-white hover:opacity-90 disabled:opacity-60 flex items-center gap-2">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />} Save route
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
