"use client";

import { Plane, Truck, Ship } from "lucide-react";
import UninsuredNotice from "./UninsuredNotice";
import { MODE_META, type ShipmentModeValue } from "@/hooks/useActiveShipmentModes";

const MODE_ICON = { AIR: Plane, LAND: Truck, SEA: Ship } as const;

type ReviewValues = {
  originCity?: string;
  destinationCity?: string;
  serviceType?: string;
  shipmentMode?: string;
  weight?: number | null;
  cartons?: number | null;
  tons?: number | null;
  hasInsurance?: boolean;
  insuranceValue?: number | null;
  pickupDate?: string | Date | null;
  itemDescription?: string | null;
  promoCode?: string | null;
  senderType?: string;
  principalName?: string | null;
  principalPhone?: string | null;
  principalRelationship?: string | null;
  senderName?: string;
  senderPhone?: string;
  senderAltPhone?: string | null;
  senderAddress?: string;
  senderCity?: string | null;
  senderState?: string | null;
  receiverName?: string;
  receiverPhone?: string;
  receiverAltPhone?: string | null;
  receiverAddress?: string;
  receiverCity?: string | null;
  receiverState?: string | null;
  note?: string | null;
};

// Shape of POST /quotes -> data (only the fields this screen reads)
export type PersistedQuote = {
  quoteId?: string;
  expiresAt?: string;
  shipmentMode?: string;
  transitHours?: number | null;
  distanceKm?: number;
  deliveryEstimate?: { label?: string } | null;
  billableWeightKg?: number;
  pricing?: {
    basePriceNaira?: number;
    adhocChargesNaira?: number;
    insurancePremiumNaira?: number | null;
    totalNaira?: number;
  };
  surchargeBreakdown?: { type: string; label: string; amount: number; description?: string }[];
  appliedDiscount?: { label?: string; discountAmount?: number } | null;
  pricingMode?: string;
  requiresDangerousGoodsNotice?: boolean;
};

const RELATIONSHIP_LABEL: Record<string, string> = {
  CUSTOMER: "Customer",
  MERCHANT: "Merchant",
  EMPLOYER: "Employer",
  OTHER: "Other",
};

function Row({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div className="flex justify-between items-start gap-4 py-[5px] border-b border-gray-100 last:border-none">
      <span className="text-xs text-gray-500 shrink-0">{label}</span>
      <span className="text-xs font-medium text-gray-800 text-right">
        {value === undefined || value === null || value === "" ? "—" : value}
      </span>
    </div>
  );
}

function Heading({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-2 mt-4 first:mt-0">
      {children}
    </p>
  );
}

/**
 * Step 3, BEFORE anything exists on the server. Everything a customer is
 * about to commit to is shown here — price, mode of shipment, insured or
 * not, who is sending, how to reach both parties — and nothing is created
 * until they press "Confirm & Create Shipment".
 */
export default function PreCreateReview({
  values,
  quote,
  serviceLabel,
  insuranceRatePercent,
  secondsLeft,
}: {
  values: ReviewValues;
  quote: PersistedQuote | null;
  serviceLabel: string;
  insuranceRatePercent: number;
  secondsLeft: number | null;
}) {
  const mode = (values.shipmentMode || quote?.shipmentMode || "LAND") as ShipmentModeValue;
  const meta = MODE_META[mode];
  const ModeIcon = MODE_ICON[mode] ?? Truck;
  const pricing = quote?.pricing;
  const total = pricing?.totalNaira ?? 0;
  const declared = values.insuranceValue ?? 0;
  const onBehalf = values.senderType === "ON_BEHALF_OF";

  const deliveryTime =
    quote?.deliveryEstimate?.label ??
    (quote?.transitHours ? `~${quote.transitHours} hrs` : meta?.transitFallback ?? "—");

  const mins = secondsLeft !== null ? Math.floor(secondsLeft / 60) : null;
  const secs = secondsLeft !== null ? String(secondsLeft % 60).padStart(2, "0") : null;

  return (
    <div>
      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-4">
        <p className="text-xs font-semibold text-amber-800">
          Nothing has been created yet
        </p>
        <p className="text-xs text-amber-700 mt-0.5">
          Check everything below. Your shipment is only created when you
          press <strong>Confirm &amp; Create Shipment</strong>.
        </p>
      </div>

      {/* Price card */}
      <div className="bg-gray-900 rounded-2xl p-5 mb-5 text-center">
        <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-1">
          Total Price
        </p>
        <p className="text-4xl font-bold text-white tracking-tight font-mono">
          {total > 0 ? `₦${total.toLocaleString()}` : "—"}
        </p>
        {total <= 0 && (
          <p className="text-[11px] text-gray-400 mt-1">
            The final price is calculated when you confirm.
          </p>
        )}
        {secondsLeft !== null && secondsLeft > 0 && (
          <p className="text-[11px] text-gray-400 mt-1">
            Price locked for {mins}:{secs}
          </p>
        )}
        <div className="border-t border-dashed border-gray-700 my-3" />
        <div className="grid grid-cols-3 divide-x divide-gray-700 text-left">
          <div className="px-3 first:pl-0">
            <p className="text-[10px] text-gray-400">Mode</p>
            <p className="text-sm font-semibold text-white flex items-center gap-1.5">
              <ModeIcon size={13} /> {meta?.label ?? mode}
            </p>
          </div>
          <div className="px-3">
            <p className="text-[10px] text-gray-400">Delivery Time</p>
            <p className="text-sm font-semibold text-white">{deliveryTime}</p>
          </div>
          <div className="px-3 last:pr-0">
            <p className="text-[10px] text-gray-400">Service</p>
            <p className="text-sm font-semibold text-white">{serviceLabel}</p>
          </div>
        </div>
      </div>

      <Heading>Order Details</Heading>
      <Row
        label="Route"
        value={`${values.originCity ?? "—"} → ${values.destinationCity ?? "—"}`}
      />
      <Row label="Mode of Shipment" value={`${meta?.label ?? mode} freight`} />
      <Row label="Service" value={serviceLabel} />
      <Row
        label="Weight"
        value={
          quote?.billableWeightKg
            ? `${quote.billableWeightKg} kg (billable)`
            : values.weight
              ? `${values.weight} kg`
              : null
        }
      />
      {quote?.distanceKm ? <Row label="Distance" value={`${quote.distanceKm.toLocaleString()} km`} /> : null}
      <Row
        label="Pickup Date"
        value={values.pickupDate ? new Date(values.pickupDate).toLocaleDateString() : "To be scheduled"}
      />
      {values.itemDescription ? <Row label="Item Description" value={values.itemDescription} /> : null}

      <Heading>Value &amp; Insurance</Heading>
      <Row label="Value of Items" value={declared > 0 ? `₦${declared.toLocaleString()}` : null} />
      <Row label="Insurance" value={values.hasInsurance ? "Insured" : "Not insured"} />
      {!values.hasInsurance && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5 mt-2">
          <UninsuredNotice
            declaredValue={declared}
            premiumNaira={Math.max(100, Math.ceil(declared * (insuranceRatePercent / 100)))}
          />
          <p className="text-xs font-semibold text-amber-800 mt-2">
            ✓ You acknowledged this risk on the previous step.
          </p>
        </div>
      )}

      <Heading>Price Breakdown</Heading>
      {pricing ? (
        <>
          <Row label="Shipping" value={pricing.basePriceNaira != null ? `₦${pricing.basePriceNaira.toLocaleString()}` : null} />
          {quote?.appliedDiscount && (
            <div className="flex justify-between items-center py-[5px] border-b border-gray-100 bg-green-50 -mx-2 px-2 rounded">
              <span className="text-xs font-medium text-green-700">
                {quote.appliedDiscount.label ?? "Discount Applied"}
              </span>
              <span className="text-xs font-semibold text-green-700">
                −₦{(quote.appliedDiscount.discountAmount ?? 0).toLocaleString()}
              </span>
            </div>
          )}
          {quote?.surchargeBreakdown?.map((item, i) => (
            <div key={`${item.type}-${i}`} className="py-[5px] border-b border-gray-100">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">{item.label}</span>
                <span className="text-xs font-medium text-gray-800">
                  ₦{item.amount?.toLocaleString()}
                </span>
              </div>
              {item.type === "ADHOC" && item.description ? (
                <p className="text-[11px] text-gray-400 mt-0.5">{item.description}</p>
              ) : null}
            </div>
          ))}
          {pricing.insurancePremiumNaira ? (
            <Row
              label={`Insurance (${insuranceRatePercent}% of declared value)`}
              value={`₦${pricing.insurancePremiumNaira.toLocaleString()}`}
            />
          ) : null}
          <div className="flex justify-between items-center py-[5px]">
            <span className="text-xs font-semibold text-gray-900">Total</span>
            <span className="text-sm font-bold text-gray-900">₦{total.toLocaleString()}</span>
          </div>
        </>
      ) : (
        <p className="text-xs text-gray-400">
          A price could not be locked ahead of time. The final price will be
          calculated when the shipment is created.
        </p>
      )}

      <Heading>Sender</Heading>
      {onBehalf && (
        <>
          <Row label="Sent on behalf of" value={values.principalName} />
          <Row label="Principal Phone" value={values.principalPhone} />
          <Row
            label="Relationship"
            value={values.principalRelationship ? RELATIONSHIP_LABEL[values.principalRelationship] : null}
          />
          <Row label="Booked by (your account)" value={values.senderName} />
        </>
      )}
      {!onBehalf && <Row label="Sender Name" value={values.senderName} />}
      <Row label="Sender Phone" value={values.senderPhone} />
      <Row label="Alternative Phone" value={values.senderAltPhone || "Not provided"} />
      <Row label="Pickup Address" value={values.senderAddress} />
      <Row label="City / State" value={[values.senderCity, values.senderState].filter(Boolean).join(", ")} />

      <Heading>Receiver</Heading>
      <Row label="Receiver Name" value={values.receiverName} />
      <Row label="Receiver Phone" value={values.receiverPhone} />
      <Row label="Alternative Phone" value={values.receiverAltPhone} />
      <Row label="Delivery Address" value={values.receiverAddress} />
      <Row label="City / State" value={[values.receiverCity, values.receiverState].filter(Boolean).join(", ")} />

      {values.note ? (
        <>
          <Heading>Notes</Heading>
          <p className="text-xs text-gray-700">{values.note}</p>
        </>
      ) : null}
    </div>
  );
}
