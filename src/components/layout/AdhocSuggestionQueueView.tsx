"use client";

import { useState } from "react";
import {
  useGetAdhocSuggestionsQuery,
  useDecideAdhocSuggestionMutation,
} from "@/store/slice/apiSlice";
import { Loader2, Check, X, Pencil } from "lucide-react";

type Suggestion = {
  id: string;
  nameSnapshot: string;
  reason?: string | null;
  amountKobo: number;
  chargeType?: { name: string };
  rule?: { name: string };
  quote?: { id: string; originCity: string; destinationCity: string };
  shipment?: { id: string; trackingNumber: string; status: string };
  createdAt: string;
};

function SuggestionCard({ suggestion }: { suggestion: Suggestion }) {
  const [decide, { isLoading }] = useDecideAdhocSuggestionMutation();
  const [editing, setEditing] = useState(false);
  const [amountNaira, setAmountNaira] = useState(suggestion.amountKobo / 100);

  const isPostBooking = !!suggestion.shipment;

  const approve = () =>
    decide({ id: suggestion.id, decision: "APPROVE" }).unwrap();

  const saveEdit = () =>
    decide({
      id: suggestion.id,
      decision: "EDIT",
      amountKobo: Math.round(amountNaira * 100),
    }).unwrap();

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <h4 className="font-semibold text-gray-900">
            {suggestion.chargeType?.name ?? suggestion.nameSnapshot}
          </h4>
          <p className="text-xs text-gray-500 mt-0.5">
            Triggered by rule: {suggestion.rule?.name ?? "—"}
          </p>
          {suggestion.reason && (
            <p className="text-xs text-gray-400 mt-1">{suggestion.reason}</p>
          )}
        </div>
        <span
          className={`px-2 py-1 text-xs rounded-full font-medium flex-shrink-0 ${
            isPostBooking ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"
          }`}
        >
          {isPostBooking ? "Post-booking (will pause shipment)" : "Pre-booking quote"}
        </span>
      </div>

      <div className="mt-3 text-xs text-gray-500">
        {suggestion.quote && (
          <span>
            Quote: {suggestion.quote.originCity} → {suggestion.quote.destinationCity}
          </span>
        )}
        {suggestion.shipment && (
          <span>
            Shipment: {suggestion.shipment.trackingNumber} ({suggestion.shipment.status})
          </span>
        )}
      </div>

      <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-50">
        {editing ? (
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={amountNaira}
              onChange={(e) => setAmountNaira(Number(e.target.value))}
              className="w-28 border rounded-lg px-2 py-1 text-sm"
            />
            <span className="text-xs text-gray-400">₦</span>
            <button
              onClick={saveEdit}
              disabled={isLoading}
              className="p-1.5 rounded bg-green-50 hover:bg-green-100 text-green-600"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            </button>
            <button
              onClick={() => setEditing(false)}
              className="p-1.5 rounded bg-gray-50 hover:bg-gray-100 text-gray-500"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <span className="text-lg font-semibold text-gray-900">
            ₦{(suggestion.amountKobo / 100).toLocaleString()}
          </span>
        )}

        {!editing && (
          <div className="flex items-center gap-2">
            <button
              onClick={approve}
              disabled={isLoading}
              className="flex items-center gap-1 bg-green-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-green-700 disabled:opacity-50"
            >
              <Check size={14} /> Approve
            </button>
            <button
              onClick={() => setEditing(true)}
              className="flex items-center gap-1 border border-gray-300 text-gray-600 px-3 py-1.5 rounded-lg text-xs font-medium hover:border-gray-400"
            >
              <Pencil size={14} /> Edit Amount
            </button>
            <button
              onClick={() => {
                const r = window.prompt("Reason for dismissing this suggestion:");
                if (r) {
                  decide({ id: suggestion.id, decision: "DISMISS", reason: r });
                }
              }}
              disabled={isLoading}
              className="flex items-center gap-1 border border-red-300 text-red-500 px-3 py-1.5 rounded-lg text-xs font-medium hover:border-red-400 disabled:opacity-50"
            >
              <X size={14} /> Dismiss
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdhocSuggestionQueueView() {
  const { data, isLoading } = useGetAdhocSuggestionsQuery();
  const suggestions: Suggestion[] = (data as any)?.data?.suggestions ?? [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (suggestions.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
        <p className="text-sm text-gray-400">
          Nothing waiting for a decision right now. SUGGEST-behaviour rule
          matches will show up here — both from quotes and from warehouse
          weigh-ins on already-booked shipments.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {suggestions.map((s) => (
        <SuggestionCard key={s.id} suggestion={s} />
      ))}
    </div>
  );
}
