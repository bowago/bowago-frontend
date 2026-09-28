"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { Controller, type Resolver, useForm, useWatch } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useMemo, useState, useEffect, useRef } from "react";
import { Input, TextArea, RadioGroupCard, SelectInput } from "../ui/input";
import { Button } from "../ui/button";
import { Calendar, MapPin, Package, User } from "lucide-react";
import {
  useAddShipmentMutation,
  useGetCitiesQuery,
  useGetDimensionsQuery,
  useInitiateShipmentPaymentMutation,
  useInitPendingPaymentMutation,
  useDownloadInvoiceMutation,
  useGeneratePersistedQuoteMutation,
  useGetDeliverySLAQuery,
  useGetZoneByRouteQuery,
  useGetAppSettingsQuery,
} from "@/store/slice/apiSlice";
import { errorToast } from "@/lib/toast/toast";
import { useActiveShipmentModes } from "@/hooks/useActiveShipmentModes";
import UninsuredNotice from "@/components/shipment/UninsuredNotice";
import PreCreateReview, { type PersistedQuote } from "@/components/shipment/PreCreateReview";

// ─── Validation Schema ────────────────────────────────────────────────────────
const createShipmentSchema = yup.object({
  // Step 1 — Order Details
  serviceType: yup
    .string()
    .oneOf(["EXPRESS", "STANDARD", "ECONOMY"])
    .required("Service type is required"),
  originCity: yup.string().required("Origin city is required"),
  destinationCity: yup.string().required("Destination city is required"),
  pickupDate: yup.date().required("Pickup date is required"),
  boxSize: yup.string().nullable(),
  weight: yup
    .number()
    .min(0, "Weight cannot be negative")
    .typeError("Must be a number")
    .nullable(),
  length: yup
    .number()
    .min(0, "Length cannot be negative")
    .typeError("Must be a number")
    .nullable(),
  width: yup
    .number()
    .min(0, "Width cannot be negative")
    .typeError("Must be a number")
    .nullable(),
  height: yup
    .number()
    .min(0, "Height cannot be negative")
    .typeError("Must be a number")
    .nullable(),
  cartons: yup
    .number()
    .min(0, "Cartons cannot be negative")
    .typeError("Must be a number")
    .nullable(),
  tons: yup
    .number()
    .min(0, "Tons cannot be negative")
    .typeError("Must be a number")
    .nullable(),
  isFragile: yup.boolean().default(false),
  // [V1 Feature 1] Mode of shipment — required on every quote/booking.
  shipmentMode: yup
    .string()
    .oneOf(["AIR", "LAND", "SEA"], "Choose a mode of shipment")
    .required("Mode of shipment is required"),
  hasInsurance: yup.boolean().default(false),
  // [V1 Feature 2] Always required now — whether or not insurance is
  // selected. The v2.0 "defaults to booking price" behaviour is gone.
  insuranceValue: yup
    .number()
    .transform((value) => (Number.isNaN(value) ? null : value))
    .typeError("Must be a number")
    .min(1, "Value of items being sent must be greater than 0")
    .required("Value of items being sent is required"),
  // [V1 Feature 7] Required when insurance is left off.
  uninsuredAck: yup
    .boolean()
    .default(false)
    .when("hasInsurance", {
      is: false,
      then: (schema) =>
        schema.oneOf([true], "You must acknowledge the uninsured shipping risk"),
      otherwise: (schema) => schema.nullable(),
    }),
  itemDescription: yup.string().nullable(),
  promoCode: yup.string().nullable(),

  // Step 2 — Delivery Details
  // [V1 Feature 3] Sender type — MYSELF (default) or ON_BEHALF_OF.
  senderType: yup
    .string()
    .oneOf(["MYSELF", "ON_BEHALF_OF"])
    .default("MYSELF")
    .required(),
  principalName: yup.string().when("senderType", {
    is: "ON_BEHALF_OF",
    then: (schema) => schema.required("Principal name is required"),
    otherwise: (schema) => schema.nullable(),
  }),
  principalPhone: yup.string().when("senderType", {
    is: "ON_BEHALF_OF",
    then: (schema) => schema.required("Principal phone is required"),
    otherwise: (schema) => schema.nullable(),
  }),
  principalEmail: yup.string().email("Enter a valid email").nullable(),
  principalRelationship: yup
    .string()
    .oneOf(["CUSTOMER", "MERCHANT", "EMPLOYER", "OTHER"])
    .when("senderType", {
      is: "ON_BEHALF_OF",
      then: (schema) => schema.required("Relationship is required"),
      otherwise: (schema) => schema.nullable(),
    }),
  authorityConfirmed: yup
    .boolean()
    .default(false)
    .when("senderType", {
      is: "ON_BEHALF_OF",
      then: (schema) =>
        schema.oneOf([true], "You must confirm you are authorised to send on their behalf"),
      otherwise: (schema) => schema.nullable(),
    }),
  senderName: yup.string().required("Sender name is required"),
  senderPhone: yup.string().required("Sender phone is required"),
  // [V1 Feature 4] Optional backup number for the sender (or principal).
  senderAltPhone: yup
    .string()
    .nullable()
    .test(
      "different-from-main",
      "Alternative number must be different from the main number",
      function (value) {
        if (!value) return true;
        const main = this.parent.senderType === "ON_BEHALF_OF" ? this.parent.principalPhone : this.parent.senderPhone;
        return value !== main;
      },
    ),
  senderAddress: yup.string().required("Sender address is required"),
  senderState: yup.string().nullable(),
  senderCity: yup.string().nullable(),
  receiverName: yup.string().required("Receiver name is required"),
  receiverPhone: yup.string().required("Receiver phone is required"),
  // [V1 Feature 4] Required backup number for the recipient.
  receiverAltPhone: yup
    .string()
    .required("Recipient's alternative number is required")
    .test(
      "different-from-main",
      "Alternative number must be different from the main number",
      function (value) {
        if (!value) return true;
        return value !== this.parent.receiverPhone;
      },
    ),
  receiverAddress: yup.string().required("Receiver address is required"),
  receiverState: yup.string().nullable(),
  receiverCity: yup.string().nullable(),
  note: yup.string().nullable(),
  termsAccepted: yup
    .boolean()
    .oneOf([true], "You must accept the terms & policies")
    .required(),
});

export type CreateShipmentFormData = yup.InferType<typeof createShipmentSchema>;

// ─── Types ────────────────────────────────────────────────────────────────────

type Step = 1 | 2 | 3;
type SurchargeItem = {
  type: string;
  label: string;
  amount: number;
};

type ShipmentSummary = {
  id?: string;
  shipmentId?: string;
  trackingNumber?: string;
  serviceType?: string;
  senderName?: string;
  senderPhone?: string;
  senderAddress?: string;
  senderCity?: string;
  senderState?: string;
  recipientName?: string;
  recipientPhone?: string;
  recipientAddress?: string;
  recipientCity?: string;
  recipientState?: string;
  weight?: number;
  weightUnit?: string;
  pickupDate?: string;
  // [V1]
  shipmentMode?: string;
  declaredValueKobo?: number | null;
  insuranceSelected?: boolean;
  senderType?: string;
  principalName?: string | null;
  senderAltPhone?: string | null;
  recipientAltPhone?: string | null;
};

type AppliedDiscount = {
  type?: string;
  label?: string;
  discountAmount?: number;
};

type QuoteSummary = {
  total?: number;
  totalSurcharge?: number;
  distanceKm?: number;
  fromCity?: { name?: string };
  toCity?: { name?: string };
  breakdown?: { subtotal?: number };
  surchargeBreakdown?: SurchargeItem[];
  pricingMode?: string;
  appliedDiscount?: AppliedDiscount | null;
  deliveryEstimate?: {
    minDays?: number;
    maxDays?: number;
    label?: string;
  } | null;
};

type ShipmentReviewData = {
  shipment?: ShipmentSummary;
  quote?: QuoteSummary;
};

type CityOption = {
  id: string;
  name: string;
  state: string;
};

type DimensionOption = {
  id: string;
  displayName: string;
  weightKgLimit: number;
  lengthCm: number;
  widthCm: number;
  heightCm: number;
  bestFor: string;
};

type PaymentResponse = {
  authorizationUrl?: string;
  data?: {
    authorizationUrl?: string;
  };
};

export const SERVICE_OPTIONS = [
  {
    label: "Express",
    description: "1–4 business days (by zone)",
    value: "EXPRESS",
  },
  {
    label: "Standard",
    description: "2–7 business days (by zone)",
    value: "STANDARD",
  },
  {
    label: "Economy",
    description: "4–14 business days (by zone)",
    value: "ECONOMY",
  },
];

export const SERVICE_DELIVERY_MAP: Record<string, string> = {
  EXPRESS: "1–3 days",
  STANDARD: "5–7 days",
  ECONOMY: "10–14 days",
};

// ─── Step Indicator ───────────────────────────────────────────────────────────

function StepIndicator({ current }: { current: Step }) {
  const steps = [
    { n: 1, label: "Order Details" },
    { n: 2, label: "Delivery Details" },
    { n: 3, label: "Review" },
  ];

  return (
    <div className="flex items-center gap-0 py-5 px-6">
      {steps.map((step, idx) => (
        <div
          key={step.n}
          className="flex items-center gap-0 flex-1 last:flex-none"
        >
          <div className="flex items-center gap-2">
            <div
              className={[
                "w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 transition-all",
                current > step.n
                  ? "bg-gray-900 text-white"
                  : current === step.n
                    ? "bg-gray-900 text-white"
                    : "border border-gray-300 text-gray-400 bg-white",
              ].join(" ")}
            >
              {current > step.n ? (
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path
                    d="M2 6l3 3 5-5"
                    stroke="white"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              ) : (
                step.n
              )}
            </div>
            <span
              className={[
                "text-xs font-medium whitespace-nowrap",
                current === step.n ? "text-gray-900" : "text-gray-400",
              ].join(" ")}
            >
              {step.label}
            </span>
          </div>
          {idx < steps.length - 1 && (
            <div
              className={[
                "flex-1 h-px mx-2 transition-all",
                current > step.n ? "bg-gray-900" : "bg-gray-200",
              ].join(" ")}
            />
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Review Summary ───────────────────────────────────────────────────────────

function ReviewStep({
  data,
  insuranceRatePercent,
}: {
  data: ShipmentReviewData;
  insuranceRatePercent: number;
}) {
  const shipment = data.shipment;
  const quote = data.quote;

  const service = shipment?.serviceType ?? "STANDARD";
  // Prefer the real zone+service-aware estimate the backend now computes
  // (pricing.service.js#getDeliveryEstimate) — the static map is only a
  // fallback for the brief moment before any quote has been generated, so
  // this screen isn't blank. Previously this static map was the ONLY
  // source, so e.g. an intra-city Abuja→Abuja shipment showed the same
  // "1-3 days" as a genuinely cross-country one.
  const deliveryTime =
    quote?.deliveryEstimate?.label ?? SERVICE_DELIVERY_MAP[service] ?? "—";
  const serviceLabel =
    SERVICE_OPTIONS.find((s) => s.value === service)?.label ?? service;

  const rows = (items: { label: string; value?: string | number | null }[]) =>
    items.map(({ label, value }) => (
      <div
        key={label}
        className="flex justify-between items-center py-[5px] border-b border-gray-100 last:border-none"
      >
        <span className="text-xs text-gray-500">{label}</span>
        <span className="text-xs font-medium text-gray-800">
          {value ?? "—"}
        </span>
      </div>
    ));

  // ── FIX: guard both total and totalSurcharge before arithmetic ──
  const total = quote?.total ?? 0;
  const totalSurcharge = quote?.totalSurcharge ?? 0;
  const subtotal = total - totalSurcharge;

  return (
    <div>
      {/* Price card */}
      <div className="bg-gray-900 rounded-2xl p-5 mb-5 text-center">
        <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-1">
          Total Price
        </p>
        <p className="text-4xl font-bold text-white tracking-tight font-mono">
          ₦{total > 0 ? total.toLocaleString() : "—"}
        </p>

        <div className="border-t border-dashed border-gray-700 my-3" />

        <div className="grid grid-cols-3 divide-x divide-gray-700 text-left">
          <div className="px-3 first:pl-0">
            <p className="text-[10px] text-gray-400">Delivery Time</p>
            <p className="text-sm font-semibold text-white">{deliveryTime}</p>
          </div>
          <div className="px-3">
            <p className="text-[10px] text-gray-400">Service Type</p>
            <p className="text-sm font-semibold text-white">{serviceLabel}</p>
          </div>
          <div className="px-3 last:pr-0">
            <p className="text-[10px] text-gray-400">Distance</p>
            <p className="text-sm font-semibold text-white">
              {quote?.distanceKm
                ? `${quote.distanceKm.toLocaleString()} km`
                : "—"}
            </p>
          </div>
        </div>
      </div>

      {/* Order Details */}
      <div className="mb-4">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-2">
          Order Details
        </p>

        {rows([
          {
            label: "Route",
            value: `${quote?.fromCity?.name ?? "—"} → ${quote?.toCity?.name ?? "—"}`,
          },
          {
            label: "Mode of Shipment",
            value: shipment?.shipmentMode
              ? `${{ AIR: "Air", LAND: "Land", SEA: "Sea" }[shipment.shipmentMode] ?? shipment.shipmentMode} freight`
              : "—",
          },
          {
            label: "Value of Items",
            value: shipment?.declaredValueKobo
              ? `₦${(shipment.declaredValueKobo / 100).toLocaleString()} (${shipment.insuranceSelected ? "Insured" : "Not insured"})`
              : "—",
          },
          {
            label: "Weight",
            value: shipment?.weight
              ? `${shipment.weight} ${shipment.weightUnit}`
              : "—",
          },
          {
            label: "Distance",
            value: quote?.distanceKm ? `${quote.distanceKm} km` : "—",
          },
          {
            label: "Pickup Date",
            value: shipment?.pickupDate
              ? new Date(shipment.pickupDate).toLocaleDateString()
              : "—",
          },
          {
            label: "Sub Total",
            value: subtotal > 0 ? `₦${subtotal.toLocaleString()}` : "—",
          },
        ])}

        {/* Contract rate / promo code applied — was previously computed
            correctly on the backend but silently dropped before reaching
            this screen, so discounted shipments looked identical to
            standard-priced ones. */}
        {quote?.appliedDiscount && (
          <div className="flex justify-between items-center py-[5px] border-b border-gray-100 bg-green-50 -mx-2 px-2 rounded">
            <span className="text-xs font-medium text-green-700">
              {quote.appliedDiscount.label ??
                (quote.pricingMode === "CONTRACT"
                  ? "Enterprise Contract Rate"
                  : "Discount Applied")}
            </span>
            <span className="text-xs font-semibold text-green-700">
              −₦{(quote.appliedDiscount.discountAmount ?? 0).toLocaleString()}
            </span>
          </div>
        )}

        {/* Surcharges */}
        <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-2 mt-4">
          Surcharges
        </p>
        {quote?.surchargeBreakdown?.map((item, i) => (
          <div
            key={`${item.type}-${i}`}
            className="flex justify-between items-center py-[5px] border-b border-gray-100"
          >
            <span className="text-xs text-gray-500">{item.label}</span>
            <span className="text-xs font-medium text-gray-800">
              ₦{item.amount?.toLocaleString()}
            </span>
          </div>
        ))}
        {/* Insurance premium line item */}
        {(quote as any)?.insurancePremiumKobo > 0 && (
          <div className="flex justify-between items-center py-[5px] border-b border-gray-100">
            <span className="text-xs text-gray-500">
              Insurance ({insuranceRatePercent}% of declared value)
            </span>
            <span className="text-xs font-medium text-gray-800">
              ₦
              {Math.round(
                (quote as any).insurancePremiumKobo / 100,
              ).toLocaleString()}
            </span>
          </div>
        )}

        <div className="flex justify-between items-center py-[5px]">
          <span className="text-xs font-semibold text-gray-900">Total</span>
          <span className="text-sm font-bold text-gray-900">
            ₦{total > 0 ? total.toLocaleString() : "—"}
          </span>
        </div>
      </div>

      <div className="h-px bg-gray-100 my-4" />

      {/* Delivery Details */}
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-2">
          Delivery Details
        </p>

        {rows([
          ...(shipment?.senderType === "ON_BEHALF_OF"
            ? [{ label: "Sent on behalf of", value: shipment?.principalName }]
            : []),
          { label: "Sender Name", value: shipment?.senderName },
          { label: "Sender Phone", value: shipment?.senderPhone },
          { label: "Sender Alt. Phone", value: shipment?.senderAltPhone },
          { label: "Full Address", value: shipment?.senderAddress },
          { label: "Sender City", value: shipment?.senderCity },
          { label: "Sender State", value: shipment?.senderState },
        ])}

        <div className="h-px bg-gray-100 my-2" />

        {rows([
          { label: "Receiver Name", value: shipment?.recipientName },
          { label: "Receiver Phone", value: shipment?.recipientPhone },
          { label: "Receiver Alt. Phone", value: shipment?.recipientAltPhone },
          { label: "Full Address", value: shipment?.recipientAddress },
          { label: "Receiver City", value: shipment?.recipientCity },
          { label: "Receiver State", value: shipment?.recipientState },
        ])}
      </div>
    </div>
  );
}

// ─── Main Modal ───────────────────────────────────────────────────────────────

export default function CreateShipmentModal({
  isOpen,
  setIsOpen,
  initialValue,
}: {
  isOpen: boolean;
  setIsOpen: (v: boolean) => void;
  initialValue: any;
}) {
  const [handleInitiateShipmentPayment] = useInitiateShipmentPaymentMutation();
  const [handleInitPendingPayment, { isLoading: isPreparingInvoice }] =
    useInitPendingPaymentMutation();
  const [handleDownloadInvoice, { isLoading: isDownloadingInvoice }] =
    useDownloadInvoiceMutation();
  const [handleCreateShipment, { isLoading: isCreatingShipment }] =
    useAddShipmentMutation();
  const [generatePersistedQuote] = useGeneratePersistedQuoteMutation();
  const { data: slaData } = useGetDeliverySLAQuery();
  const slas: any[] = slaData?.data?.slas ?? [];

  // Live insurance rate from Business Rules settings (default 2.5%).
  // Falls back to 2.5 if the settings haven't loaded yet.
  const { data: insuranceSettingsData } = useGetAppSettingsQuery({});
  const insuranceSettings: Record<string, { value: string }> =
    (insuranceSettingsData as any)?.data?.settings ?? {};
  const insuranceRatePercent = parseFloat(
    insuranceSettings["insurance.rate_percent"]?.value ?? "2.5",
  );
  const insuranceMinPremiumNaira = parseFloat(
    insuranceSettings["insurance.min_premium_naira"]?.value ?? "100",
  );
  const [persistedQuoteId, setPersistedQuoteId] = useState<string | null>(null);
  // Full response of the locked quote, shown on the review step BEFORE the
  // shipment is created, plus when the 15-minute price lock runs out.
  const [persistedQuoteData, setPersistedQuoteData] = useState<PersistedQuote | null>(null);
  const [quoteExpiresAt, setQuoteExpiresAt] = useState<number | null>(null);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const { data: citiesData, isLoading } = useGetCitiesQuery({});

  const [step, setStep] = useState<Step>(1);
  // Reentrancy guard for handleNext. A ref (not state) because it needs to
  // block a SECOND click that lands before React has re-rendered from the
  // first — a plain `isAdvancing` state variable wouldn't help there since
  // both click handlers would still read the same stale `false` value.
  // Without this, double-clicking Next on step 1 fired handleNext twice
  // while `step` was still captured as 1 in both closures — both runs took
  // the "step 1 → step 2" branch (never the step-2-only createShipment
  // branch), and both queued a setStep(s => s+1), landing on step 3 with
  // step 2's fields never shown or validated.
  const isAdvancingRef = useRef(false);
  const [isAdvancing, setIsAdvancing] = useState(false);
  const [createdShipmentData, setCreatedShipmentData] =
    useState<ShipmentReviewData | null>(null);
  const [useCustomDimension, setUseCustomDimension] = useState(false);

  const {
    register,
    control,
    trigger,
    getValues,
    reset,
    setValue,
    formState: { errors, isValid },
  } = useForm<CreateShipmentFormData>({
    resolver: yupResolver(
      createShipmentSchema,
    ) as Resolver<CreateShipmentFormData>,
    mode: "onChange",
    defaultValues: {
      serviceType: "EXPRESS",
      shipmentMode: "LAND",
      isFragile: false,
      hasInsurance: false,
      insuranceValue: 0,
      uninsuredAck: false,
      senderType: "MYSELF",
      authorityConfirmed: false,
      termsAccepted: false,
    },
  });

  // When opened from the quote flow (or resumed from a pre-auth draft),
  // prefill every field that was already entered so the user never has to
  // retype anything.
  useEffect(() => {
    if (!isOpen || !initialValue) return;
    if (initialValue.fromCity) setValue("originCity", initialValue.fromCity);
    if (initialValue.toCity) setValue("destinationCity", initialValue.toCity);
    if (initialValue.serviceType)
      setValue("serviceType", initialValue.serviceType);
    if (initialValue.boxSize) setValue("boxSize", initialValue.boxSize);
    if (initialValue.weight != null) setValue("weight", initialValue.weight);
    if (initialValue.length != null) setValue("length", initialValue.length);
    if (initialValue.width != null) setValue("width", initialValue.width);
    if (initialValue.height != null) setValue("height", initialValue.height);
    if (initialValue.cartons != null) setValue("cartons", initialValue.cartons);
    if (initialValue.tons != null) setValue("tons", initialValue.tons);
    // [V1] Carry the mode and declared value picked in the quote modal
    // through to the booking form, so the user never has to re-enter them.
    if (initialValue.shipmentMode) setValue("shipmentMode", initialValue.shipmentMode);
    if (initialValue.declaredValue != null)
      setValue("insuranceValue", initialValue.declaredValue);
    if (initialValue.hasInsurance != null)
      setValue("hasInsurance", initialValue.hasInsurance);
    if (initialValue.isCustomDimension) setUseCustomDimension(true);
  }, [isOpen, initialValue]);

  // Ticks once a second while the (pre-create) review is on screen, only to
  // show how long the locked price remains valid.
  useEffect(() => {
    if (step !== 3 || createdShipmentData || !quoteExpiresAt) return;
    const t = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(t);
  }, [step, createdShipmentData, quoteExpiresAt]);

  const handleClose = () => {
    reset();
    setStep(1);
    setCreatedShipmentData(null);
    setPersistedQuoteId(null);
    setPersistedQuoteData(null);
    setQuoteExpiresAt(null);
    setUseCustomDimension(false);
    setIsOpen(false);
  };

  const handleOpenChange = (open: boolean) => {
    if (open) {
      setIsOpen(true);
      return;
    }
    handleClose();
  };

  const STEP_FIELDS: Record<Step, (keyof CreateShipmentFormData)[]> = {
    1: [
      "serviceType",
      "shipmentMode",
      "originCity",
      "destinationCity",
      "pickupDate",
      "weight",
      "boxSize",
      "cartons",
      "hasInsurance",
      "insuranceValue",
      "uninsuredAck",
    ],
    2: [
      "senderType",
      "principalName",
      "principalPhone",
      "principalRelationship",
      "authorityConfirmed",
      "senderName",
      "senderPhone",
      "senderAltPhone",
      "senderAddress",
      "receiverName",
      "receiverPhone",
      "receiverAltPhone",
      "receiverAddress",
      "termsAccepted",
    ],
    3: [],
  };

  // Disable Continue/Create Shipment if any field for the current step has an error
  const currentStepFields = STEP_FIELDS[step];
  const stepHasErrors = currentStepFields.some(
    (field) => !!errors[field as keyof typeof errors],
  );

  const formatPickupDate = (value?: Date | string | null) => {
    if (!value) return "";
    const date = value instanceof Date ? value : new Date(value);
    return Number.isNaN(date.getTime()) ? "" : date.toISOString();
  };

  const buildShipmentPayload = (data: CreateShipmentFormData) => ({
    senderName: data.senderName,
    senderPhone: data.senderPhone,
    senderAddress: data.senderAddress,
    senderCity: data.senderCity ?? "",
    senderState: data.senderState ?? "",
    recipientName: data.receiverName,
    recipientPhone: data.receiverPhone,
    recipientAddress: data.receiverAddress,
    recipientCity: data.receiverCity ?? "",
    recipientState: data.receiverState ?? "",
    description: data.itemDescription ?? "",
    weightKg: data.weight ?? 0,
    tons: data.tons ?? 0,
    cartons: data.cartons ?? 0,
    boxDimensionId: data.boxSize ?? "",
    serviceType: data.serviceType,
    isFragile: data.isFragile,
    requiresInsurance: data.hasInsurance,
    // [V1 Feature 2] Value of items being sent is always captured now,
    // whether or not insurance is selected.
    insuranceValue: data.insuranceValue ?? 0,
    pickupDate: formatPickupDate(data.pickupDate),
    notes: data.note ?? "",
    promoCode: data.promoCode || undefined,
    // [V1 launch scope]
    shipmentMode: data.shipmentMode,
    senderType: data.senderType,
    principalName: data.senderType === "ON_BEHALF_OF" ? data.principalName : undefined,
    principalPhone: data.senderType === "ON_BEHALF_OF" ? data.principalPhone : undefined,
    principalEmail: data.senderType === "ON_BEHALF_OF" ? data.principalEmail ?? undefined : undefined,
    principalRelationship: data.senderType === "ON_BEHALF_OF" ? data.principalRelationship : undefined,
    authorityConfirmed: data.senderType === "ON_BEHALF_OF" ? !!data.authorityConfirmed : undefined,
    senderAltPhone: data.senderAltPhone || undefined,
    recipientAltPhone: data.receiverAltPhone,
    uninsuredAck: !data.hasInsurance ? !!data.uninsuredAck : undefined,
    ...(persistedQuoteId ? { quoteId: persistedQuoteId } : {}),
  });

  const getReviewData = (response: unknown): ShipmentReviewData => {
    if (!response || typeof response !== "object") return {};
    const responseObject = response as {
      data?: unknown;
      shipment?: ShipmentSummary;
      quote?: QuoteSummary;
    };
    if (responseObject.data && typeof responseObject.data === "object") {
      const data = responseObject.data as ShipmentReviewData;
      if (data.shipment || data.quote) return data;
      return { shipment: data as ShipmentSummary };
    }
    return { shipment: responseObject.shipment, quote: responseObject.quote };
  };

  const getCreatedShipmentId = () => {
    const shipment = createdShipmentData?.shipment;
    return shipment?.id ?? shipment?.shipmentId;
  };

  // Locks a 15-minute quote from the current form values. Returns
  // { blocked: true } when the server rejects the request outright (mode
  // switched off, no rate for that mode/route, invalid input) so the user is
  // told immediately instead of discovering it after filling in step 2.
  const generateQuoteFromForm = async (): Promise<{ blocked: boolean; data: PersistedQuote | null }> => {
    const vals = getValues();
    try {
      const result = await generatePersistedQuote({
        originCity: vals.originCity,
        destinationCity: vals.destinationCity,
        weightKg: vals.weight ?? 0,
        tons: vals.tons ?? 0,
        cartons: vals.cartons ?? 0,
        lengthCm: vals.length ?? 0,
        widthCm: vals.width ?? 0,
        heightCm: vals.height ?? 0,
        boxDimensionId: vals.boxSize ?? undefined,
        serviceType: vals.serviceType,
        shipmentMode: vals.shipmentMode,
        insuranceSelected: vals.hasInsurance,
        declaredValue: vals.insuranceValue ?? 0,
        promoCode: vals.promoCode || undefined,
        termsAccepted: true,
      }).unwrap();
      const d = (result?.data ?? null) as (PersistedQuote & { quote?: { id?: string }; id?: string }) | null;
      // The API returns the id as `quoteId` (older builds nested it).
      const qId = d?.quoteId ?? d?.quote?.id ?? d?.id ?? null;
      setPersistedQuoteId(qId);
      setPersistedQuoteData(d);
      setQuoteExpiresAt(d?.expiresAt ? new Date(d.expiresAt).getTime() : null);
      return { blocked: false, data: d };
    } catch (err) {
      setPersistedQuoteId(null);
      setPersistedQuoteData(null);
      setQuoteExpiresAt(null);
      const e = err as { status?: number; data?: { message?: string } };
      if (e?.status === 400 || e?.status === 404 || e?.status === 422) {
        errorToast(e.data?.message ?? "We couldn't price this shipment. Please check your details.");
        return { blocked: true, data: null };
      }
      // Network/server hiccup — keep the old behaviour: carry on, the
      // shipment is priced when it's created.
      return { blocked: false, data: null };
    }
  };

  const createShipment = async () => {
    // The 15-minute price lock ran out while the customer was reviewing:
    // refresh it and make them look at the (possibly new) price first.
    if (quoteExpiresAt && Date.now() >= quoteExpiresAt) {
      const r = await generateQuoteFromForm();
      if (!r.blocked) {
        errorToast("Your quote expired, so the price was refreshed. Please review it and confirm again.");
      }
      return;
    }
    const data = getValues();
    const response = await handleCreateShipment(
      buildShipmentPayload(data),
    ).unwrap();
    setCreatedShipmentData(getReviewData(response));
    setStep(3);
  };

  const handleNext = async () => {
    if (isAdvancingRef.current) return;
    isAdvancingRef.current = true;
    setIsAdvancing(true);
    try {
      const valid = await trigger(STEP_FIELDS[step]);
      if (!valid) return;
      if (step === 2) {
        // Review comes BEFORE creation. Nothing exists on the server until
        // the customer presses "Confirm & Create Shipment" on step 3.
        if (!persistedQuoteId || (quoteExpiresAt && Date.now() >= quoteExpiresAt)) {
          const r = await generateQuoteFromForm();
          if (r.blocked) return;
        }
        setStep(3);
        return;
      }

      // Auto-populate sender/receiver city from route (Step 1 → Step 2)
      // The PRD clarifies: "sender city = pickup city, receiver city = destination city"
      // so we auto-fill to avoid redundant entry and confusion (Michael's observation).
      if (step === 1) {
        const vals = getValues();
        if (vals.originCity && !getValues("senderCity")) {
          setValue("senderCity", vals.originCity);
          const senderCityObj = cities?.find((c) => c.name === vals.originCity);
          if (senderCityObj) setValue("senderState", senderCityObj.state);
        }
        if (vals.destinationCity && !getValues("receiverCity")) {
          setValue("receiverCity", vals.destinationCity);
          const receiverCityObj = cities?.find(
            (c) => c.name === vals.destinationCity,
          );
          if (receiverCityObj) setValue("receiverState", receiverCityObj.state);
        }
      }

      // When moving from Step 1 → Step 2, generate a persistent quote so the
      // price is locked for 15 minutes.
      if (step === 1) {
        const r = await generateQuoteFromForm();
        if (r.blocked) return;
      }

      setStep((s) => (s < 3 ? ((s + 1) as Step) : s));
    } finally {
      isAdvancingRef.current = false;
      setIsAdvancing(false);
    }
  };

  const handleBack = () => {
    // Once the shipment exists there is nothing to go back to.
    if (step === 3 && createdShipmentData) return;
    setStep((s) => (s > 1 ? ((s - 1) as Step) : s));
  };

  const handleConfirmCreate = async () => {
    if (isAdvancingRef.current) return;
    isAdvancingRef.current = true;
    setIsAdvancing(true);
    try {
      await createShipment();
    } catch {
      // The mutation surfaces its own error toast; nothing was created.
    } finally {
      isAdvancingRef.current = false;
      setIsAdvancing(false);
    }
  };

  const handleGenerateInvoice = async () => {
    const shipmentId = getCreatedShipmentId();
    if (!shipmentId) return;

    try {
      const result = await handleInitPendingPayment({ shipmentId }).unwrap();
      const paymentId = result?.data?.payment?.id;
      if (!paymentId) return;

      const tracking =
        createdShipmentData?.shipment?.trackingNumber ?? shipmentId;

      await handleDownloadInvoice({
        paymentId,
        filename: `BowaGO-Invoice-${tracking}.pdf`,
      });
    } catch {
      // errors are surfaced via toast in the mutation hooks
    }
  };

  const handlePayment = async () => {
    const shipmentId = getCreatedShipmentId();
    if (!shipmentId) return;
    const callbackUrl = `${window.location.origin}/dashboard/payment/callback`;
    const data = (await handleInitiateShipmentPayment({
      shipmentId,
      callbackUrl,
      refundPolicyAccepted: true,
    }).unwrap()) as PaymentResponse;
    const authorizationUrl =
      data.authorizationUrl ?? data.data?.authorizationUrl;
    if (authorizationUrl) window.location.href = authorizationUrl;
  };

  const stepSubtitle = [
    "Step 1 of 3 — Order Details",
    "Step 2 of 3 — Delivery Details",
    "Step 3 of 3 — Review",
  ][step - 1];

  const { data: dimensionData, isLoading: isLoadingBox } =
    useGetDimensionsQuery({});
  const selectedBoxId = useWatch({ control, name: "boxSize" });
  const hasInsurance = useWatch({ control, name: "hasInsurance" });
  // [V1 Feature 1] Only modes admin has left switched on are offered.
  const watchedMode = useWatch({ control, name: "shipmentMode" });
  const { options: modeOptions } = useActiveShipmentModes(watchedMode, (fallback) =>
    setValue("shipmentMode", fallback, { shouldValidate: true }),
  );
  const senderType = useWatch({ control, name: "senderType" });

  // Live zone lookup — fires whenever both cities are selected (including same city = Zone 1)
  const watchedPickupDate = useWatch({ control, name: "pickupDate" });
  const watchedOrigin = useWatch({ control, name: "originCity" });
  const watchedDest = useWatch({ control, name: "destinationCity" });
  const canLookupZone = !!(watchedOrigin && watchedDest);
  const { data: zoneRouteData } = useGetZoneByRouteQuery(
    { fromCity: watchedOrigin ?? "", toCity: watchedDest ?? "" },
    { skip: !canLookupZone },
  );
  const liveZone: number | null =
    zoneRouteData?.data?.matrix?.[0]?.zone ?? null;

  // Hardcoded SLA fallback — used when DB seed hasn't run yet or SLA table is empty.
  // Mirrors the values in seed.js exactly.
  const SLA_FALLBACK: Record<string, Record<string, string>> = {
    EXPRESS: {
      "1": "Same day – next day",
      "2": "1–2 business days",
      "3": "2–3 business days",
      "4": "3–5 business days",
    },
    STANDARD: {
      "1": "1–2 business days",
      "2": "2–4 business days",
      "3": "3–5 business days",
      "4": "5–7 business days",
    },
    ECONOMY: {
      "1": "2–4 business days",
      "2": "4–7 business days",
      "3": "5–10 business days",
      "4": "7–14 business days",
    },
  };

  const cities = useMemo(
    () => (citiesData?.data?.cities ?? []) as CityOption[],
    [citiesData?.data?.cities],
  );
  const cityOptions = useMemo(
    () => cities.map((item) => ({ label: item.name, value: item.name })),
    [cities],
  );
  const dimensions = useMemo(
    () => (dimensionData?.data?.dimensions ?? []) as DimensionOption[],
    [dimensionData?.data?.dimensions],
  );
  const selectedBox = useMemo(
    () => dimensions.find((item) => item.id === selectedBoxId),
    [dimensions, selectedBoxId],
  );

  const maxWeight = selectedBox?.weightKgLimit || 0;
  const maxLength = selectedBox?.lengthCm || 0;
  const maxHeight = selectedBox?.heightCm || 0;
  const maxWidth = selectedBox?.widthCm || 0;
  const maxTons = maxWeight / 1000;

  // Get delivery label for a service type based on SLA table.
  // zone is optional — derived from the zone matrix API when both cities are selected.
  const getSLALabel = (serviceType: string, zone?: number | null): string => {
    const svcKey = serviceType.toUpperCase();
    if (zone != null) {
      // 1. Try live SLA data from DB
      if (slas.length > 0) {
        const match = slas.find(
          (s: any) => s.zone === zone && s.serviceType === svcKey,
        );
        if (match)
          return (
            match.label ?? `${match.minDays}–${match.maxDays} business days`
          );
      }
      // 2. Fallback to hardcoded table (covers case where seed hasn't run)
      const fallback = SLA_FALLBACK[svcKey]?.[String(zone)];
      if (fallback) return fallback;
    }
    // 3. Generic placeholder when zone not yet known
    const generic: Record<string, string> = {
      EXPRESS: "1–4 business days (by zone)",
      STANDARD: "2–7 business days (by zone)",
      ECONOMY: "4–14 business days (by zone)",
    };
    return generic[svcKey] ?? "Varies by zone";
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40" />

        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl w-full max-w-2xl max-h-[92vh] flex flex-col z-50 shadow-xl overflow-hidden">
          {/* Header */}
          <div className="flex items-start justify-between px-6 pt-6 shrink-0">
            <div>
              <Dialog.Title className="text-lg font-semibold text-gray-900 tracking-tight">
                Create Shipment
              </Dialog.Title>
              <p className="text-xs text-gray-400 mt-0.5">{stepSubtitle}</p>
            </div>
            <Dialog.Close asChild>
              <button className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-200 hover:bg-gray-50 text-gray-400 transition-colors cursor-pointer">
                ✕
              </button>
            </Dialog.Close>
          </div>

          {/* Stepper */}
          <StepIndicator current={step} />
          <div className="h-px bg-gray-100 shrink-0" />

          {/* Body */}
          <form
            id="shipment-form"
            onSubmit={(event) => event.preventDefault()}
            className="flex-1 overflow-y-auto px-6 py-5 space-y-6"
          >
            {/* ── STEP 1 ── */}
            {step === 1 && (
              <>
                {/* ── ROUTE first — city selection drives SLA labels ── */}
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-3">
                    Route
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <Controller
                      control={control}
                      name="originCity"
                      render={({ field }) => (
                        <SelectInput
                          label="Origin City"
                          disabled={isLoading}
                          options={cityOptions}
                          placeholder={
                            isLoading ? "...loading cities" : "e.g Lagos"
                          }
                          value={field.value}
                          onValueChange={field.onChange}
                          error={errors.originCity?.message}
                        />
                      )}
                    />
                    <Controller
                      control={control}
                      name="destinationCity"
                      render={({ field }) => (
                        <SelectInput
                          label="Destination City"
                          disabled={isLoading}
                          options={cityOptions}
                          placeholder={
                            isLoading ? "...loading cities" : "e.g Abuja"
                          }
                          value={field.value}
                          onValueChange={field.onChange}
                          error={errors.destinationCity?.message}
                        />
                      )}
                    />
                  </div>
                  <div className="mt-3">
                    <Input
                      label="Pickup Date"
                      type="date"
                      min={new Date().toISOString().split("T")[0]}
                      leftIcon={<Calendar size={14} />}
                      {...register("pickupDate")}
                      error={errors.pickupDate?.message}
                    />
                    {(() => {
                      const now = new Date();
                      const isToday = (() => {
                        const pd = watchedPickupDate;
                        if (!pd) return false;
                        const d = new Date(pd);
                        return d.toDateString() === now.toDateString();
                      })();
                      if (isToday && now.getHours() >= 14) {
                        return (
                          <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mt-1.5">
                            ⚠ Bookings after 2:00 PM cannot be collected same
                            day. The earliest pickup will be the{" "}
                            <strong>next business day</strong>.
                          </p>
                        );
                      }
                      return null;
                    })()}
                  </div>
                </div>

                {/* ── SERVICE TYPE — shown after route so SLA labels are zone-aware ── */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">
                      Service Type
                    </p>
                    {!canLookupZone && (
                      <p className="text-[10px] text-gray-400 italic">
                        Select both cities to see delivery times
                      </p>
                    )}
                  </div>
                  <Controller
                    name="serviceType"
                    control={control}
                    render={({ field }) => (
                      <RadioGroupCard
                        label=""
                        value={field.value}
                        onValueChange={field.onChange}
                        className="flex flex-row gap-2"
                        options={[
                          {
                            label: "Express",
                            description: canLookupZone
                              ? getSLALabel("EXPRESS", liveZone)
                              : "Fastest delivery",
                            value: "EXPRESS",
                          },
                          {
                            label: "Standard",
                            description: canLookupZone
                              ? getSLALabel("STANDARD", liveZone)
                              : "Balanced speed & cost",
                            value: "STANDARD",
                          },
                          {
                            label: "Economy",
                            description: canLookupZone
                              ? getSLALabel("ECONOMY", liveZone)
                              : "Most affordable",
                            value: "ECONOMY",
                          },
                        ]}
                      />
                    )}
                  />
                  {errors.serviceType && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors.serviceType.message}
                    </p>
                  )}
                </div>

                {/* ── [V1 Feature 1] MODE OF SHIPMENT ── */}
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-3">
                    Mode of Shipment
                  </p>
                  <Controller
                    name="shipmentMode"
                    control={control}
                    render={({ field }) => (
                      <RadioGroupCard
                        label=""
                        value={field.value}
                        onValueChange={field.onChange}
                        className="flex flex-row gap-2"
                        options={modeOptions}
                      />
                    )}
                  />
                  {errors.shipmentMode && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors.shipmentMode.message}
                    </p>
                  )}
                  {(getValues("shipmentMode") === "AIR" ||
                    getValues("shipmentMode") === "SEA") && (
                    <p className="text-xs text-amber-600 mt-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                      Shipping batteries or other dangerous goods by{" "}
                      {getValues("shipmentMode") === "AIR" ? "air" : "sea"}?
                      Check our packaging guidelines before you continue.
                    </p>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-3 border-2 border-gray-200 rounded-xl px-3 py-2.5 bg-gray-50/50">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-500">
                      Dimension
                    </p>
                    <div className="flex items-center gap-1 bg-white border border-gray-300 rounded-lg p-0.5">
                      <button
                        type="button"
                        onClick={() => setUseCustomDimension(false)}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                          !useCustomDimension
                            ? "bg-gray-900 text-white shadow-sm"
                            : "text-gray-500"
                        }`}
                      >
                        Predefined Box
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setUseCustomDimension(true);
                          setValue("boxSize", "");
                        }}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                          useCustomDimension
                            ? "bg-brand text-white shadow-sm"
                            : "text-gray-500"
                        }`}
                      >
                        Custom Size
                      </button>
                    </div>
                  </div>

                  {!useCustomDimension && (
                    <div className="mb-3">
                      <Controller
                        control={control}
                        name="boxSize"
                        render={({ field }) => (
                          <SelectInput
                            label="Select Box"
                            disabled={isLoadingBox}
                            options={dimensions.map((item) => ({
                              value: item.id,
                              label: `${item.displayName} (Max ${item.weightKgLimit}kg • ${(item.weightKgLimit / 1000).toFixed(3)}t • ${item.bestFor})`,
                            }))}
                            value={field.value as string}
                            onValueChange={(val) => {
                              field.onChange(val);
                              const selected = dimensions.find(
                                (d) => d.id === val,
                              );
                              if (selected) {
                                setValue("width", selected.widthCm);
                                setValue("height", selected.heightCm);
                                setValue("length", selected.lengthCm);
                                setValue("weight", selected.weightKgLimit);
                                setValue("tons", selected.weightKgLimit / 1000);
                              }
                            }}
                            error={errors.boxSize?.message}
                          />
                        )}
                      />
                    </div>
                  )}

                  {useCustomDimension && (
                    <p className="text-[11px] text-gray-400 mb-3 border-2 border-brand/30 bg-brand/5 rounded-lg px-3 py-2">
                      Enter the exact weight and dimensions of your package
                      below.
                    </p>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      label={
                        !useCustomDimension && selectedBox
                          ? `Weight / kg (Max ${maxWeight})`
                          : "Weight / kg"
                      }
                      type="number"
                      leftIcon={<Package size={14} />}
                      max={
                        !useCustomDimension && selectedBox
                          ? maxWeight
                          : undefined
                      }
                      min={0}
                      {...register("weight", { valueAsNumber: true })}
                      error={errors.weight?.message}
                    />
                    <Input
                      label={
                        !useCustomDimension && selectedBox
                          ? `Length / cm (Max ${maxLength})`
                          : "Length / cm"
                      }
                      type="number"
                      max={
                        !useCustomDimension && selectedBox
                          ? maxLength
                          : undefined
                      }
                      min={0}
                      {...register("length", { valueAsNumber: true })}
                      error={errors.length?.message}
                    />
                    <Input
                      label={
                        !useCustomDimension && selectedBox
                          ? `Width / cm (Max ${maxWidth})`
                          : "Width / cm"
                      }
                      type="number"
                      max={
                        !useCustomDimension && selectedBox
                          ? maxWidth
                          : undefined
                      }
                      min={0}
                      {...register("width", { valueAsNumber: true })}
                      error={errors.width?.message}
                    />
                    <Input
                      label={
                        !useCustomDimension && selectedBox
                          ? `Height / cm (Max ${maxHeight})`
                          : "Height / cm"
                      }
                      type="number"
                      max={
                        !useCustomDimension && selectedBox
                          ? maxHeight
                          : undefined
                      }
                      min={0}
                      {...register("height", { valueAsNumber: true })}
                      error={errors.height?.message}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3 mt-3">
                    <Input
                      label="Cartons"
                      type="number"
                      min={0}
                      {...register("cartons", { valueAsNumber: true })}
                      error={errors.cartons?.message}
                    />
                    <Input
                      label={
                        !useCustomDimension && selectedBox
                          ? `Tons (Max ${maxTons})`
                          : "Tons"
                      }
                      type="number"
                      max={
                        !useCustomDimension && selectedBox ? maxTons : undefined
                      }
                      min={0}
                      {...register("tons", { valueAsNumber: true })}
                      error={errors.tons?.message}
                    />
                  </div>
                  <div className="flex gap-5 mt-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        {...register("isFragile")}
                        className="w-4 h-4 accent-gray-900 cursor-pointer"
                      />
                      <span className="text-xs text-gray-500">Is Fragile</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        {...register("hasInsurance")}
                        className="w-4 h-4 accent-gray-900 cursor-pointer"
                      />
                      <span className="text-xs text-gray-500">Insurance</span>
                    </label>
                  </div>
                  {/* [V1 Feature 2] Value of items being sent — always shown
                      and required now, insured or not. */}
                  <div className="mt-3 space-y-2">
                    <Input
                      label="Value of Items Being Sent (NGN)"
                      type="number"
                      min={1}
                      placeholder="e.g. 500000"
                      rightElement={
                        <span className="text-xs font-medium text-gray-400">
                          NGN
                        </span>
                      }
                      {...register("insuranceValue", { valueAsNumber: true })}
                      error={errors.insuranceValue?.message}
                    />
                    {hasInsurance ? (
                      <>
                        {/* Read-only premium preview — user sees what they'll be charged */}
                        {(getValues("insuranceValue") ?? 0) > 0 && (
                          <div className="flex items-center justify-between bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
                            <span className="text-xs text-blue-600">
                              Insurance premium ({insuranceRatePercent}% of
                              declared value)
                            </span>
                            <span className="text-xs font-semibold text-blue-700">
                              ₦
                              {Math.max(
                                100,
                                Math.ceil(
                                  (getValues("insuranceValue") ?? 0) * 0.025,
                                ),
                              ).toLocaleString()}
                            </span>
                          </div>
                        )}
                        <p className="text-[11px] text-gray-400">
                          The insurance premium is calculated automatically at{" "}
                          {insuranceRatePercent}% (min ₦
                          {insuranceMinPremiumNaira.toLocaleString()}).
                        </p>
                      </>
                    ) : (
                      // [V1 Feature 7] Uninsured risk disclaimer.
                      <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5 space-y-2">
                        <UninsuredNotice
                          declaredValue={getValues("insuranceValue") ?? 0}
                          premiumNaira={Math.max(
                            100,
                            Math.ceil(
                              (getValues("insuranceValue") ?? 0) *
                                (insuranceRatePercent / 100),
                            ),
                          )}
                        />
                        <label className="flex items-start gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            {...register("uninsuredAck")}
                            className="w-4 h-4 mt-0.5 accent-gray-900 cursor-pointer"
                          />
                          <span className="text-xs text-amber-700">
                            I understand the risk of shipping without
                            insurance.
                          </span>
                        </label>
                        {errors.uninsuredAck && (
                          <p className="text-xs text-red-500">
                            {errors.uninsuredAck.message}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-3">
                    Others
                  </p>
                  <TextArea
                    label="Item Description"
                    placeholder="Enter Description"
                    {...register("itemDescription")}
                    error={errors.itemDescription?.message}
                  />
                  <div className="mt-3">
                    <Input
                      label="Promo Code (optional)"
                      placeholder="e.g. LAUNCH20"
                      {...register("promoCode")}
                      error={errors.promoCode?.message}
                    />
                    <p className="text-[11px] text-gray-400 mt-1">
                      If your account has an active enterprise contract rate,
                      that takes priority and this code won&apos;t be applied.
                    </p>
                  </div>
                </div>
              </>
            )}

            {/* ── STEP 2 ── */}
            {step === 2 && (
              <>
                {/* ── [V1 Feature 3] SENDER TYPE ── */}
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-3">
                    Who is sending this shipment?
                  </p>
                  <Controller
                    name="senderType"
                    control={control}
                    render={({ field }) => (
                      <RadioGroupCard
                        label=""
                        value={field.value}
                        onValueChange={field.onChange}
                        className="flex flex-row gap-2"
                        options={[
                          { label: "Myself", description: "I am the sender", value: "MYSELF" },
                          {
                            label: "On behalf of someone",
                            description: "e.g. a merchant or employer",
                            value: "ON_BEHALF_OF",
                          },
                        ]}
                      />
                    )}
                  />
                  {senderType === "ON_BEHALF_OF" && (
                    <div className="mt-3 space-y-3 bg-gray-50 border border-gray-200 rounded-xl p-3">
                      <div className="grid grid-cols-2 gap-3">
                        <Input
                          label="Principal Name"
                          placeholder="Who owns the goods"
                          {...register("principalName")}
                          error={errors.principalName?.message}
                        />
                        <Input
                          label="Principal Phone"
                          placeholder="+234 000 0000 000"
                          {...register("principalPhone")}
                          error={errors.principalPhone?.message}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <Controller
                          control={control}
                          name="principalRelationship"
                          render={({ field }) => (
                            <SelectInput
                              label="Relationship"
                              options={[
                                { label: "Customer", value: "CUSTOMER" },
                                { label: "Merchant", value: "MERCHANT" },
                                { label: "Employer", value: "EMPLOYER" },
                                { label: "Other", value: "OTHER" },
                              ]}
                              placeholder="Select relationship"
                              value={field.value as string}
                              onValueChange={field.onChange}
                              error={errors.principalRelationship?.message}
                            />
                          )}
                        />
                        <Input
                          label="Principal Email (optional)"
                          placeholder="name@example.com"
                          {...register("principalEmail")}
                          error={errors.principalEmail?.message}
                        />
                      </div>
                      <label className="flex items-start gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          {...register("authorityConfirmed")}
                          className="w-4 h-4 mt-0.5 accent-gray-900 cursor-pointer"
                        />
                        <span className="text-xs text-gray-600">
                          I am authorised to send these items on their behalf.
                        </span>
                      </label>
                      {errors.authorityConfirmed && (
                        <p className="text-xs text-red-500">
                          {errors.authorityConfirmed.message}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <div className="h-px bg-gray-100" />

                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-3">
                    Sender
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      label="Sender Name"
                      placeholder="John Doe"
                      leftIcon={<User size={14} />}
                      {...register("senderName")}
                      error={errors.senderName?.message}
                    />
                    <Input
                      label="Sender Phone Number"
                      placeholder="+234 000 0000 000"
                      {...register("senderPhone")}
                      error={errors.senderPhone?.message}
                    />
                  </div>
                  <div className="mt-3">
                    <Input
                      label="Alternative Phone Number (optional)"
                      placeholder="+234 000 0000 000 — a backup number if the main one can't be reached"
                      {...register("senderAltPhone")}
                      error={errors.senderAltPhone?.message}
                    />
                  </div>
                  <div className="mt-3">
                    <Input
                      label="Full Address"
                      placeholder="2, Ajalekoko Street, Ikopaje, Lagos"
                      leftIcon={<MapPin size={14} />}
                      {...register("senderAddress")}
                      error={errors.senderAddress?.message}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3 mt-3">
                    <Controller
                      control={control}
                      name="senderCity"
                      render={({ field }) => (
                        <SelectInput
                          label="Sender City (from route)"
                          disabled={true}
                          options={cityOptions}
                          placeholder="Auto-filled from Origin"
                          value={field.value as string}
                          onValueChange={(val) => {
                            field.onChange(val);
                            const selected = cities.find((c) => c.name === val);
                            if (selected)
                              setValue("senderState", selected.state);
                          }}
                          error={errors.senderCity?.message}
                        />
                      )}
                    />
                    <Input
                      label="Sender State"
                      placeholder="Lagos"
                      {...register("senderState")}
                      disabled
                      error={errors.senderState?.message}
                    />
                  </div>
                </div>

                <div className="h-px bg-gray-100" />

                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-3">
                    Receiver
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      label="Receiver Name"
                      placeholder="John Doe"
                      leftIcon={<User size={14} />}
                      {...register("receiverName")}
                      error={errors.receiverName?.message}
                    />
                    <Input
                      label="Receiver Phone Number"
                      placeholder="+234 000 0000 000"
                      {...register("receiverPhone")}
                      error={errors.receiverPhone?.message}
                    />
                  </div>
                  <div className="mt-3">
                    <Input
                      label="Recipient's Alternative Phone Number"
                      placeholder="+234 000 0000 000 — required so drivers can always reach someone"
                      {...register("receiverAltPhone")}
                      error={errors.receiverAltPhone?.message}
                    />
                  </div>
                  <div className="mt-3">
                    <Input
                      label="Full Address"
                      placeholder="2, Ajalekoko Street, Ikopaje, Lagos"
                      leftIcon={<MapPin size={14} />}
                      {...register("receiverAddress")}
                      error={errors.receiverAddress?.message}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3 mt-3">
                    <Controller
                      control={control}
                      name="receiverCity"
                      render={({ field }) => (
                        <SelectInput
                          label="Recipient City (from route)"
                          disabled={true}
                          options={cityOptions}
                          placeholder="Auto-filled from Destination"

                          value={field.value as string}
                          onValueChange={(val) => {
                            field.onChange(val);
                            const selected = cities.find((c) => c.name === val);
                            if (selected)
                              setValue("receiverState", selected.state);
                          }}
                          error={errors.receiverCity?.message}
                        />
                      )}
                    />
                    <Input
                      label="Recipient State"
                      placeholder="Lagos"
                      {...register("receiverState")}
                      disabled
                      error={errors.receiverState?.message}
                    />
                  </div>
                </div>

                <div className="h-px bg-gray-100" />

                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-3">
                    Notes
                  </p>
                  <TextArea
                    label="Note"
                    placeholder="Leave a note if you have any info to aid shipping"
                    {...register("note")}
                    error={errors.note?.message}
                  />
                  <label className="flex items-center gap-2 mt-3 cursor-pointer">
                    <input
                      type="checkbox"
                      {...register("termsAccepted")}
                      className="w-4 h-4 accent-gray-900 cursor-pointer"
                    />
                    <span className="text-xs text-gray-500">
                      I agree to the{" "}
                      <a href="#" className="text-gray-900 underline">
                        Terms &amp; Policies
                      </a>
                    </span>
                  </label>
                  {errors.termsAccepted && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors.termsAccepted.message}
                    </p>
                  )}
                </div>
              </>
            )}

            {/* ── STEP 3 ── */}
            {step === 3 && !createdShipmentData && (
              <PreCreateReview
                values={getValues() as any}
                quote={persistedQuoteData}
                serviceLabel={
                  SERVICE_OPTIONS.find((o) => o.value === getValues("serviceType"))?.label ??
                  getValues("serviceType")
                }
                insuranceRatePercent={insuranceRatePercent}
                secondsLeft={
                  quoteExpiresAt ? Math.max(0, Math.floor((quoteExpiresAt - nowMs) / 1000)) : null
                }
              />
            )}
            {step === 3 && createdShipmentData && (
              <ReviewStep
                data={createdShipmentData}
                insuranceRatePercent={insuranceRatePercent}
              />
            )}
          </form>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-100 flex flex-col gap-3 shrink-0">
            {/* Sprint 7: Refund Policy acknowledgement — shown once the
                shipment exists and the customer is about to pay. */}
            {step === 3 && createdShipmentData && (
              <p className="text-xs text-gray-400 text-center">
                By clicking <strong>Pay Now</strong> you acknowledge our{" "}
                <a
                  href="/policies/refund"
                  target="_blank"
                  className="underline text-gray-600"
                >
                  Refund Policy
                </a>
                . This is recorded for compliance.
              </p>
            )}
            <div className="flex items-center gap-3">
              {step > 1 && !(step === 3 && createdShipmentData) && (
                <Button variant="secondary" type="button" onClick={handleBack}>
                  ← Back
                </Button>
              )}
              <div className="flex-1" />
              {step === 3 && createdShipmentData && (
                <Button
                  variant="secondary"
                  type="button"
                  onClick={handleGenerateInvoice}
                  isLoading={isPreparingInvoice || isDownloadingInvoice}
                >
                  Generate Invoice Only
                </Button>
              )}
              {step < 3 ? (
                <Button
                  type="button"
                  onClick={handleNext}
                  isLoading={isAdvancing}
                  disabled={stepHasErrors || isAdvancing}
                >
                  {step === 2 ? "Review Shipment" : "Continue"}
                </Button>
              ) : createdShipmentData ? (
                <Button
                  type="button"
                  onClick={handlePayment}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  Pay Now
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={handleConfirmCreate}
                  isLoading={isCreatingShipment || isAdvancing}
                  disabled={isCreatingShipment || isAdvancing}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  Confirm &amp; Create Shipment
                </Button>
              )}
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
