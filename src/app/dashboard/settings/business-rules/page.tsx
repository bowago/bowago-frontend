"use client";

import { useState, useEffect } from "react";
import { CheckCircle, Info, Loader2, Save } from "lucide-react";
import {
  useGetAppSettingsQuery,
  useUpdateAppSettingMutation,
} from "@/store/slice/apiSlice";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { useRouter } from "next/navigation";

// ─── Setting definitions: label, description, type, min/max, and how
// changes affect the live app.
const SETTING_DEFS = [
  // ── Insurance ─────────────────────────────────────────────────────────────
  {
    key: "insurance.rate_percent",
    group: "insurance",
    label: "Insurance Premium Rate",
    description:
      "Percentage of the declared cargo value charged as the insurance premium. The default is 2.5%. Increasing this raises the premium for every insured shipment; decreasing it reduces coverage cost for customers. Takes effect on the next quote generated — active quotes already display the rate that was set when they were created.",
    unit: "%",
    type: "number",
    min: 0.1,
    max: 20,
    liveEffect: "Next quote onwards",
  },
  {
    key: "insurance.min_premium_naira",
    group: "insurance",
    label: "Minimum Insurance Premium",
    description:
      "Floor amount (in Naira) for insurance premiums. If the calculated percentage produces less than this amount, the minimum is charged instead. Prevents very cheap shipments from being insured at negligible cost.",
    unit: "₦ (Naira)",
    type: "number",
    min: 0,
    max: 50000,
    liveEffect: "Next quote onwards",
  },
  // ── Price Adjustment ───────────────────────────────────────────────────────
  {
    key: "price_adjustment.response_window_hours",
    group: "price_adjustment",
    label: "Customer Response Window",
    description:
      "How many hours a customer has to respond to a weight-discrepancy price adjustment before the system auto-cancels and refunds. Affects every new adjustment created after the value is saved. Currently active adjustments use the window that was set when they were created.",
    unit: "hours",
    type: "number",
    min: 1,
    max: 168,
    liveEffect: "New adjustments only",
  },
  {
    key: "price_adjustment.cancel_refund_percent",
    group: "price_adjustment",
    label: "Customer-Initiated Cancel Refund % (Price Adjustment Only)",
    description:
      "Applies ONLY when a customer cancels a paused shipment in response to a weight-discrepancy price adjustment — this is a separate flow from the general \"Cancel Shipment\" action on the Shipments page. General cancellations follow the fixed PRD refund table below (100% for BOOKED/not-picked-up, and the configurable fee % for PICKED_UP/FAILED in the Cancellation & Returns section). Set to 100 for a full refund.",
    unit: "%",
    type: "number",
    min: 0,
    max: 100,
    liveEffect: "Price-adjustment cancellations only",
  },
  {
    key: "price_adjustment.auto_cancel_refund_percent",
    group: "price_adjustment",
    label: "Auto-Cancel (Timeout) Refund % (Price Adjustment Only)",
    description:
      "Applies ONLY when a price adjustment expires with no customer response and the system auto-cancels — same price-adjustment flow as the setting above, not the general Cancel Shipment action. Usually matches the customer-initiated cancel %, but can be set separately.",
    unit: "%",
    type: "number",
    min: 0,
    max: 100,
    liveEffect: "Price-adjustment auto-cancellations only",
  },
  {
    key: "price_adjustment.downgrade_enabled",
    group: "price_adjustment",
    label: "Allow Tier Downgrade",
    description:
      "Whether the 'downgrade to a lower service tier' option is shown to customers when they receive a price adjustment. Disable to force customers to pay the difference, cancel, or contact support.",
    unit: "",
    type: "boolean",
    liveEffect: "Immediate",
  },
  {
    key: "price_adjustment.sweep_interval_minutes",
    group: "price_adjustment",
    label: "Auto-Cancel Sweep Interval",
    description:
      "How often (in minutes) the background job checks for expired price adjustments. On Vercel this is handled by the Vercel Cron schedule in vercel.json — this setting controls the in-process fallback on Railway/Render. Requires a server restart to take effect.",
    unit: "minutes",
    type: "number",
    min: 1,
    max: 1440,
    liveEffect: "Requires server restart",
  },

  // ── Cancellation & Returns ─────────────────────────────────────────────────
  {
    key: "cancellation.picked_up_fee_percent",
    group: "cancellation",
    label: "Picked-Up Cancellation Fee",
    description:
      "Percentage of the paid amount RETAINED (not refunded) when a customer or admin cancels a shipment after it has already been picked up but before it's in transit. Covers the warehouse handling cost already incurred. PRD range is 5–10%; the customer sees this fee called out on the cancellation confirmation dialog before they confirm.",
    unit: "% retained",
    type: "number",
    min: 0,
    max: 100,
    liveEffect: "Applies to all future cancellations",
  },
  {
    key: "cancellation.failed_delivery_fee_percent",
    group: "cancellation",
    label: "Failed-Delivery Cancellation Fee",
    description:
      "Percentage of the paid amount RETAINED (not refunded) when a shipment marked FAILED delivery is cancelled. Covers the operator/attempt cost already incurred. The customer sees this fee called out on the cancellation confirmation dialog before they confirm.",
    unit: "% retained",
    type: "number",
    min: 0,
    max: 100,
    liveEffect: "Applies to all future cancellations",
  },

  // ── Loyalty ─────────────────────────────────────────────────────────────
  {
    key: "loyalty.earn_rate_per_100_naira",
    group: "loyalty",
    label: "Points Earn Rate",
    description:
      "Number of points awarded per ₦100 of shipment final price (after discounts). Default is 1 point per ₦100. Increase to make the programme more generous; decrease to tighten costs.",
    unit: "pts per ₦100",
    type: "number",
    min: 0.1,
    max: 100,
    liveEffect: "Next delivery onwards",
  },
  {
    key: "loyalty.min_redeem_points",
    group: "loyalty",
    label: "Minimum Redemption",
    description:
      "Minimum points a customer must hold before they can redeem any points at checkout. Prevents micro-redemptions on very small balances.",
    unit: "points",
    type: "number",
    min: 1,
    max: 10000,
    liveEffect: "Immediate",
  },
  {
    key: "loyalty.point_naira_value",
    group: "loyalty",
    label: "Point Value",
    description:
      "Naira value of 1 loyalty point when redeemed at checkout. Default: 1 point = ₦1.",
    unit: "₦ per point",
    type: "number",
    min: 0.1,
    max: 100,
    liveEffect: "Immediate",
  },
  {
    key: "loyalty.silver_threshold",
    group: "loyalty",
    label: "Silver Tier Threshold",
    description:
      "Lifetime points required to reach Silver tier (1.25× earn multiplier).",
    unit: "pts",
    type: "number",
    min: 1,
    max: 100000,
    liveEffect: "Immediate",
  },
  {
    key: "loyalty.gold_threshold",
    group: "loyalty",
    label: "Gold Tier Threshold",
    description:
      "Lifetime points required to reach Gold tier (1.5× earn multiplier).",
    unit: "pts",
    type: "number",
    min: 1,
    max: 500000,
    liveEffect: "Immediate",
  },
  {
    key: "loyalty.platinum_threshold",
    group: "loyalty",
    label: "Platinum Tier Threshold",
    description:
      "Lifetime points required to reach Platinum tier (2× earn multiplier).",
    unit: "pts",
    type: "number",
    min: 1,
    max: 1000000,
    liveEffect: "Immediate",
  },
  {
    key: "loyalty.max_redeem_per_shipment",
    group: "loyalty",
    label: "Max Points Per Redemption",
    description:
      "Maximum points redeemable on a single shipment. Set to 0 for no limit. Also capped internally at 50% of shipment value.",
    unit: "points (0 = unlimited)",
    type: "number",
    min: 0,
    max: 1000000,
    liveEffect: "Immediate",
  },
] as const;

type SettingKey = (typeof SETTING_DEFS)[number]["key"];

export default function BusinessRulesPage() {
  const router = useRouter();
  const user = useSelector((s: RootState) => s.auth.user) as any;

  // Gate: only Super Admin (SUPER_ADMIN or LOGISTICS_MANAGER sub-role) should reach this
  const subRole = user?.adminSubRole ?? user?.subRole;
  const isSuperAdmin = ["SUPER_ADMIN", "LOGISTICS_MANAGER"].includes(subRole);

  // Fetch all settings at once (no group filter) so both insurance and
  // price_adjustment keys are returned in a single request.
  const { data, isLoading } = useGetAppSettingsQuery({});
  const [updateSetting, { isLoading: isSaving }] =
    useUpdateAppSettingMutation();

  // Local draft values — pulled from the API response on load
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState<Record<string, boolean>>({});

  const settingsMap: Record<
    string,
    { value: string; type: string; group: string }
  > = (data as any)?.data?.settings ?? {};

  useEffect(() => {
    if (!settingsMap || Object.keys(settingsMap).length === 0) return;
    const initial: Record<string, string> = {};
    for (const def of SETTING_DEFS) {
      initial[def.key] = settingsMap[def.key]?.value ?? "";
    }
    setDraft(initial);
  }, [data]);

  if (!isSuperAdmin) {
    return (
      <div className="p-10 text-center">
        <p className="text-sm text-gray-500">
          This page is only accessible to Super Admins.
        </p>
      </div>
    );
  }

  const handleSave = async (
    key: SettingKey,
    def: (typeof SETTING_DEFS)[number],
  ) => {
    const raw = draft[key];
    let value: string | number | boolean = raw;

    if (def.type === "number") {
      const n = parseFloat(raw);
      if (Number.isNaN(n)) return;
      if ("min" in def && n < def.min) return;
      if ("max" in def && n > def.max) return;
      value = n;
    } else if (def.type === "boolean") {
      value = raw === "true";
    }

    await updateSetting({
      key,
      value,
      type: def.type,
      group: def.group,
    }).unwrap();
    setSaved((prev) => ({ ...prev, [key]: true }));
    setTimeout(() => setSaved((prev) => ({ ...prev, [key]: false })), 2000);
  };

  const renderCard = (def: (typeof SETTING_DEFS)[number]) => {
    const value = draft[def.key] ?? "";
    const isBool = def.type === "boolean";
    return (
      <div
        key={def.key}
        className="bg-white border border-gray-200 rounded-xl p-5"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-semibold">{def.label}</span>
              <span className="text-[10px] bg-gray-100 text-gray-500 rounded px-1.5 py-0.5">
                {def.liveEffect}
              </span>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed mb-3">
              {def.description}
            </p>
            {isBool ? (
              <div
                onClick={() =>
                  setDraft((prev) => ({
                    ...prev,
                    [def.key]: prev[def.key] === "true" ? "false" : "true",
                  }))
                }
                className={`w-10 h-6 rounded-full transition-colors relative cursor-pointer ${
                  value === "true" ? "bg-brand" : "bg-gray-300"
                }`}
              >
                <span
                  className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${
                    value === "true" ? "left-5" : "left-1"
                  }`}
                />
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={value}
                  onChange={(e) =>
                    setDraft((prev) => ({ ...prev, [def.key]: e.target.value }))
                  }
                  min={"min" in def ? def.min : undefined}
                  max={"max" in def ? def.max : undefined}
                  step={def.key.includes("rate_percent") ? 0.1 : 1}
                  className="w-28 border border-gray-200 rounded-lg px-3 py-2 text-sm"
                />
                {def.unit && (
                  <span className="text-sm text-gray-500">{def.unit}</span>
                )}
                {"min" in def && (
                  <span className="text-xs text-gray-400">
                    ({def.min}–{def.max})
                  </span>
                )}
              </div>
            )}
          </div>
          <button
            onClick={() => handleSave(def.key, def)}
            disabled={isSaving}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex-shrink-0 ${
              saved[def.key]
                ? "bg-green-100 text-green-700"
                : "bg-brand/10 text-brand hover:bg-brand hover:text-white"
            }`}
          >
            {saved[def.key] ? (
              <>
                <CheckCircle className="w-3.5 h-3.5" /> Saved
              </>
            ) : isSaving ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <>
                <Save className="w-3.5 h-3.5" /> Save
              </>
            )}
          </button>
        </div>
        <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-1.5 text-xs text-gray-400">
          <Info className="w-3 h-3" />
          <span className="font-mono">{def.key}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="pb-16">
      <div className="mb-6">
        <h1 className="dashboard-heading">Business Rules</h1>
        <p className="text-sm text-gray-500 mt-1">
          Configure pricing policy values used across the app. Changes take
          effect immediately (except where noted) without a code deployment.
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 text-sm text-gray-500 py-10">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading settings…
        </div>
      ) : (
        <div className="space-y-8 max-w-2xl">
          {/* ── Insurance ────────────────────────────────────────────────── */}
          <section>
            <div className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">
              Insurance Pricing
            </div>
            <div className="space-y-4">
              {SETTING_DEFS.filter((d) => d.group === "insurance").map((def) =>
                renderCard(def),
              )}
            </div>
          </section>

          {/* ── Price Adjustment ─────────────────────────────────────────── */}
          <section>
            <div className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">
              Price Adjustment — Post-Booking Weight Discrepancy
            </div>
            <div className="space-y-4">
              {SETTING_DEFS.filter((d) => d.group === "price_adjustment").map(
                (def) => renderCard(def),
              )}
            </div>
          </section>

          {/* ── Cancellation & Returns ──────────────────────────────────────── */}
          <section>
            <div className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">
              Cancellation & Returns — Non-Refundable Fees
            </div>
            <p className="text-xs text-gray-400 mb-3 -mt-2">
              Applies to the general "Cancel Shipment" action. Cancelling
              before pickup (BOOKED / AWAITING_PICKUP / CONFIRMED) is always
              a 100% refund per the PRD and isn't configurable — the fees
              below only kick in once a shipment has been picked up or
              failed delivery.
            </p>
            <div className="space-y-4">
              {SETTING_DEFS.filter((d) => d.group === "cancellation").map(
                (def) => renderCard(def),
              )}
            </div>
          </section>

          {/* ── Loyalty Rewards ───────────────────────────────────────────── */}
          <section>
            <div className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">
              Loyalty Rewards Programme
            </div>
            <div className="space-y-4">
              {SETTING_DEFS.filter((d) => d.group === "loyalty").map((def) =>
                renderCard(def),
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
