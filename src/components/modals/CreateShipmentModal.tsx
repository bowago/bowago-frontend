"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { Controller, type Resolver, useForm, useWatch } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useMemo, useState } from "react";
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
} from "@/store/slice/apiSlice";

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
  weight: yup.number().min(0).typeError("Must be a number").nullable(),
  length: yup.number().min(0).typeError("Must be a number").nullable(),
  width: yup.number().min(0).typeError("Must be a number").nullable(),
  height: yup.number().min(0).typeError("Must be a number").nullable(),
  cartons: yup.number().min(0).typeError("Must be a number").nullable(),
  tons: yup.number().min(0).typeError("Must be a number").nullable(),
  isFragile: yup.boolean().default(false),
  hasInsurance: yup.boolean().default(false),
  insuranceValue: yup
    .number()
    .transform((value) => (Number.isNaN(value) ? null : value))
    .nullable()
    .when("hasInsurance", {
      is: true,
      then: (schema) =>
        schema
          .typeError("Must be a number")
          .min(1, "Insurance value must be greater than 0")
          .required("Insurance value is required"),
      otherwise: (schema) => schema.nullable(),
    }),
  itemDescription: yup.string().nullable(),

  // Step 2 — Delivery Details
  senderName: yup.string().required("Sender name is required"),
  senderPhone: yup.string().required("Sender phone is required"),
  senderAddress: yup.string().required("Sender address is required"),
  senderState: yup.string().nullable(),
  senderCity: yup.string().nullable(),
  receiverName: yup.string().required("Receiver name is required"),
  receiverPhone: yup.string().required("Receiver phone is required"),
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
};

type QuoteSummary = {
  total?: number;
  totalSurcharge?: number;
  distanceKm?: number;
  fromCity?: { name?: string };
  toCity?: { name?: string };
  breakdown?: { subtotal?: number };
  surchargeBreakdown?: SurchargeItem[];
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
  { label: "Express", description: "1–3 business days", value: "EXPRESS" },
  { label: "Standard", description: "5–7 business days", value: "STANDARD" },
  { label: "Economy", description: "10–14 business days", value: "ECONOMY" },
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

function ReviewStep({ data }: { data: ShipmentReviewData }) {
  const shipment = data.shipment;
  const quote = data.quote;

  const service = shipment?.serviceType ?? "STANDARD";
  const deliveryTime = SERVICE_DELIVERY_MAP[service] ?? "—";
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

        {/* Surcharges */}
        <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-2 mt-4">
          Surcharges
        </p>
        {quote?.surchargeBreakdown?.map((item) => (
          <div
            key={item.type}
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
              Insurance (2.5% of declared value)
            </span>
            <span className="text-xs font-medium text-gray-800">
              ₦{Math.round((quote as any).insurancePremiumKobo / 100).toLocaleString()}
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
          { label: "Sender Name", value: shipment?.senderName },
          { label: "Sender Phone", value: shipment?.senderPhone },
          { label: "Full Address", value: shipment?.senderAddress },
          { label: "Sender City", value: shipment?.senderCity },
          { label: "Sender State", value: shipment?.senderState },
        ])}

        <div className="h-px bg-gray-100 my-2" />

        {rows([
          { label: "Receiver Name", value: shipment?.recipientName },
          { label: "Receiver Phone", value: shipment?.recipientPhone },
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
  const [persistedQuoteId, setPersistedQuoteId] = useState<string | null>(null);
  const { data: citiesData, isLoading } = useGetCitiesQuery({});

  const [step, setStep] = useState<Step>(1);
  const [createdShipmentData, setCreatedShipmentData] =
    useState<ShipmentReviewData | null>(null);

  const {
    register,
    control,
    trigger,
    getValues,
    reset,
    setValue,
    formState: { errors },
  } = useForm<CreateShipmentFormData>({
    resolver: yupResolver(
      createShipmentSchema,
    ) as Resolver<CreateShipmentFormData>,
    defaultValues: {
      serviceType: "EXPRESS",
      isFragile: false,
      hasInsurance: false,
      insuranceValue: 0,
      termsAccepted: false,
    },
  });

  const handleClose = () => {
    reset();
    setStep(1);
    setCreatedShipmentData(null);
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
      "originCity",
      "destinationCity",
      "pickupDate",
      "weight",
      "boxSize",
      "cartons",
      "hasInsurance",
      "insuranceValue",
    ],
    2: [
      "senderName",
      "senderPhone",
      "senderAddress",
      "receiverName",
      "receiverPhone",
      "receiverAddress",
      "termsAccepted",
    ],
    3: [],
  };

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
    insuranceValue: data.hasInsurance ? (data.insuranceValue ?? 0) : 0,
    pickupDate: formatPickupDate(data.pickupDate),
    notes: data.note ?? "",
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

  const createShipment = async () => {
    const data = getValues();
    const response = await handleCreateShipment(
      buildShipmentPayload(data),
    ).unwrap();
    setCreatedShipmentData(getReviewData(response));
    setStep(3);
  };

  const handleNext = async () => {
    const valid = await trigger(STEP_FIELDS[step]);
    if (!valid) return;
    if (step === 2) {
      await createShipment();
      return;
    }

    // When moving from Step 1 → Step 2, generate a persistent quote so the
    // price is locked for 15 minutes. If it fails (no pricing data yet) we
    // proceed anyway — the shipment controller will calculate the price.
    if (step === 1) {
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
          insuranceSelected: vals.hasInsurance,
          declaredValue: vals.insuranceValue ?? 0,
        }).unwrap();
        const qId = result?.data?.quote?.id ?? result?.data?.id;
        if (qId) setPersistedQuoteId(qId);
      } catch {
        // Non-blocking — proceed without price lock
        setPersistedQuoteId(null);
      }
    }

    setStep((s) => (s < 3 ? ((s + 1) as Step) : s));
  };

  const handleBack = () => {
    if (step === 3) setCreatedShipmentData(null);
    setStep((s) => (s > 1 ? ((s - 1) as Step) : s));
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
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-3">
                    Service Type
                  </p>
                  <Controller
                    name="serviceType"
                    control={control}
                    render={({ field }) => (
                      <RadioGroupCard
                        label=""
                        value={field.value}
                        onValueChange={field.onChange}
                        className="flex flex-row gap-2"
                        options={SERVICE_OPTIONS}
                      />
                    )}
                  />
                  {errors.serviceType && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors.serviceType.message}
                    </p>
                  )}
                </div>

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
                    {/* Cutoff warning — same-day bookings after 2 PM shift to next day */}
                    {(() => {
                      const now = new Date();
                      const isToday = (() => {
                        const pd = getValues("pickupDate");
                        if (!pd) return false;
                        const d = new Date(pd);
                        return d.toDateString() === now.toDateString();
                      })();
                      if (isToday && now.getHours() >= 14) {
                        return (
                          <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mt-1.5">
                            ⚠ Bookings after 2:00 PM cannot be collected same day. The earliest pickup will be the <strong>next business day</strong>.
                          </p>
                        );
                      }
                      return null;
                    })()}
                  </div>
                </div>

                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-3">
                    Dimension
                  </p>
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

                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      label={`Weight / kg (Max ${maxWeight})`}
                      type="number"
                      leftIcon={<Package size={14} />}
                      max={maxWeight}
                      {...register("weight", { valueAsNumber: true })}
                      error={errors.weight?.message}
                    />
                    <Input
                      label={`Length / cm (Max ${maxLength})`}
                      type="number"
                      max={maxLength}
                      {...register("length", { valueAsNumber: true })}
                      error={errors.length?.message}
                    />
                    <Input
                      label={`Width / cm (Max ${maxWidth})`}
                      type="number"
                      max={maxWidth}
                      {...register("width", { valueAsNumber: true })}
                      error={errors.width?.message}
                    />
                    <Input
                      label={`Height / cm (Max ${maxHeight})`}
                      type="number"
                      max={maxHeight}
                      {...register("height", { valueAsNumber: true })}
                      error={errors.height?.message}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3 mt-3">
                    <Input
                      label="Cartons"
                      type="number"
                      {...register("cartons", { valueAsNumber: true })}
                      error={errors.cartons?.message}
                    />
                    <Input
                      label={`Tons (Max ${maxTons})`}
                      type="number"
                      max={maxTons}
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
                  {hasInsurance && (
                    <div className="mt-3">
                      <Input
                        label="Insurance Value"
                        type="number"
                        min={1}
                        placeholder="Enter insurance value"
                        rightElement={
                          <span className="text-xs font-medium text-gray-400">
                            NGN
                          </span>
                        }
                        {...register("insuranceValue", { valueAsNumber: true })}
                        error={errors.insuranceValue?.message}
                      />
                    </div>
                  )}
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
                </div>
              </>
            )}

            {/* ── STEP 2 ── */}
            {step === 2 && (
              <>
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
                          label="Sender City"
                          disabled={isLoading}
                          options={cityOptions}
                          placeholder={
                            isLoading ? "...loading cities" : "e.g Ikeja"
                          }
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
                          label="Recipient City"
                          disabled={isLoading}
                          options={cityOptions}
                          placeholder={
                            isLoading ? "...loading cities" : "e.g Ikeja"
                          }
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
            {step === 3 && createdShipmentData && (
              <ReviewStep data={createdShipmentData} />
            )}
          </form>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-100 flex items-center gap-3 shrink-0">
            {step > 1 && (
              <Button variant="secondary" type="button" onClick={handleBack}>
                ← Back
              </Button>
            )}
            <div className="flex-1" />
            {step === 3 && (
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
                isLoading={step === 2 && isCreatingShipment}
              >
                {step === 2 ? "Create Shipment" : "Continue"}
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handlePayment}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Pay Now
              </Button>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
