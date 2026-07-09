"use client";

import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Controller, useForm } from "react-hook-form";
import { Package, Scale, Check } from "lucide-react";

import { Input, SelectInput } from "../ui/input";
import { Button } from "../ui/button";
import {
  useCreateQuoteMutation,
  useGetCitiesQuery,
  useGetDimensionsQuery,
} from "@/store/slice/apiSlice";
import { errorToast } from "@/lib/toast/toast";

interface QuoteFormData {
  fromCity: string;
  toCity: string;
  weightKg: number;
  tons: number;
  cartons: number;
  boxDimensionId: string;
  lengthCm?: number;
  widthCm?: number;
  heightCm?: number;
  promoCode?: string;
}

type QuoteCity = {
  id: string;
  name: string;
  region: string;
  state: string;
};

type QuoteSurcharge = {
  type: string;
  label: string;
  description: string;
  amount: number;
};

type QuoteResponse = {
  zone: number;
  distanceKm: number;
  weightKg: number;
  fromCity: QuoteCity;
  toCity: QuoteCity;
  breakdown: {
    priceBandId: string;
    pricePerKg: number;
    standardBasePrice: number;
    finalBasePrice: number;
  };
  pricingMode: string;
  appliedDiscount: {
    label?: string;
    description?: string;
    amount?: number;
  } | null;
  surchargeBreakdown: QuoteSurcharge[];
  totalSurcharge: number;
  total: number;
  currency: string;
};

type CreateQuoteResponse = {
  data?: {
    quote?: QuoteResponse;
  };
};

type CityOption = Pick<QuoteCity, "name">;

type BoxDimension = {
  id: string;
  displayName: string;
  weightKgLimit: number;
  bestFor: string;
};

export default function CreateQuoteModal({
  isOpen,
  setIsOpen,
  onCreateShipment,
}: {
  isOpen: boolean;
  setIsOpen: (v: boolean) => void;
  onCreateShipment?: (prefill: {
    fromCity: string;
    toCity: string;
    serviceType?: string;
    boxSize?: string;
    weight?: number;
    length?: number;
    width?: number;
    height?: number;
    cartons?: number;
    tons?: number;
    isCustomDimension?: boolean;
  }) => void;
}) {
  const [handleCreateQuote, { isLoading: isLoadingQuote, data }] =
    useCreateQuoteMutation();
  const [step, setStep] = useState(1);
  // Sprint 7: terms consent — required before quote generation
  const [termsAccepted, setTermsAccepted] = useState(false);
  // Predefined box vs free-form L/W/H entry
  const [useCustomDimension, setUseCustomDimension] = useState(false);

  const form = useForm<QuoteFormData>({
    mode: "onChange",
    defaultValues: {
      fromCity: "",
      toCity: "",
      weightKg: 0,
      tons: 0,
      cartons: 1,
      boxDimensionId: "",
      lengthCm: undefined,
      widthCm: undefined,
      heightCm: undefined,
      promoCode: "",
    },
  });

  const {
    register,
    handleSubmit,
    control,
    watch,
    trigger,
    setValue,
    formState: { errors },
  } = form;

  const values = watch();

  // Hoisted here (was previously called inside `Step1`/`Step2`, which were
  // components defined INSIDE this component's render body — a React
  // anti-pattern: every re-render redefines them as new component types,
  // so React unmounts/remounts the currently-visible step. Combined with
  // `watch()` above re-rendering on every keystroke, and isLoadingQuote
  // flipping the instant Calculate is clicked, that's exactly the kind of
  // thing that makes a submit click "do nothing" — the click can land on a
  // DOM node that gets torn down mid-event. Hooks must also always be
  // called unconditionally at the top level, not inside a component that
  // only mounts on some steps — so these move up here regardless.
  const { data: citiesRes, isLoading: citiesLoading } = useGetCitiesQuery({});
  const cities = (citiesRes?.data?.cities ?? []) as CityOption[];

  const { data: dimensionsRes, isLoading: dimensionsLoading } = useGetDimensionsQuery({});
  const dimensions = (dimensionsRes?.data?.dimensions ?? []) as BoxDimension[];

  const selectedBox = dimensions.find((item) => item.id === values.boxDimensionId);
  const maxWeight = selectedBox?.weightKgLimit || 0;
  const maxTons = maxWeight / 1000;
  const cartonsCount = values.cartons || 1;
  const totalWeight = selectedBox ? maxWeight * cartonsCount : 0;
  const totalTons = selectedBox ? maxTons * cartonsCount : 0;

  const reset = () => {
    form.reset();
    setStep(1);
    setUseCustomDimension(false);
  };

  const handleClose = (v: boolean) => {
    setIsOpen(v);
    if (!v) reset();
  };

  const onSubmit = (data: QuoteFormData) => {
    const payload = useCustomDimension
      ? {
          fromCity: data.fromCity,
          toCity: data.toCity,
          weightKg: data.weightKg,
          tons: data.tons,
          cartons: data.cartons,
          customLength: data.lengthCm,
          customWidth: data.widthCm,
          customHeight: data.heightCm,
          promoCode: data.promoCode ? data.promoCode.trim().toUpperCase() : undefined,
        }
      : {
          fromCity: data.fromCity,
          toCity: data.toCity,
          weightKg: data.weightKg,
          tons: data.tons,
          cartons: data.cartons,
          boxDimensionId: data.boxDimensionId,
          promoCode: data.promoCode ? data.promoCode.trim().toUpperCase() : undefined,
        };

    handleCreateQuote({ ...payload, termsAccepted: true })
      .unwrap()
      .then(() => {
        setStep(3);
      })
      .catch(() => {
        // Error toast already shown via apiSlice onQueryStarted; swallow
        // here only to avoid an unhandled rejection warning.
      });
  };

  // ─────────────────────────────
  // STEP 1 VALIDATION
  // ─────────────────────────────
  const handleNextStep1 = async () => {
    const valid = await trigger(["fromCity", "toCity"]);
    if (valid) setStep(2);
  };

  // ─────────────────────────────
  // STEP 2 VALIDATION
  // ─────────────────────────────
  const handleNextStep2 = async () => {
    const fields: (keyof QuoteFormData)[] = useCustomDimension
      ? ["lengthCm", "widthCm", "heightCm", "weightKg", "cartons"]
      : ["boxDimensionId", "weightKg", "tons", "cartons"];
    const valid = await trigger(fields);
    if (valid) {
      handleSubmit(onSubmit)();
    } else {
      // Previously this failed silently with only a small inline error —
      // easy to miss, and looked like clicking Calculate did nothing.
      errorToast("Please fix the highlighted fields before calculating.");
    }
  };

  // ─────────────────────────────
  // STEPPER (plain JSX, not a nested component — see note above)
  // ─────────────────────────────
  const stepperEl = (
    <div className="flex items-center justify-between mb-6">
      {["Route", "Package", "Review"].map((s, i) => {
        const active = step === i + 1;
        return (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`w-8 h-8 flex items-center justify-center rounded-full text-xs font-semibold
              ${active ? "bg-black text-white" : "bg-gray-200 text-gray-500"}`}
            >
              {i + 1}
            </div>
            <span
              className={`text-sm ${
                active ? "text-black font-medium" : "text-gray-400"
              }`}
            >
              {s}
            </span>
          </div>
        );
      })}
    </div>
  );

  // ─────────────────────────────
  // STEP 1 (plain JSX — data comes from the hoisted hooks above)
  // ─────────────────────────────
  const step1El = (
    <div className="grid grid-cols-2 gap-4">
      <Controller
        control={control}
        name="fromCity"
        rules={{ required: "From city is required" }}
        render={({ field }) => (
          <SelectInput
            label="From City"
            disabled={citiesLoading}
            options={
              cities.map((item) => ({
                label: item.name,
                value: item.name,
              })) || []
            }
            placeholder={citiesLoading ? "...loading cities" : "e.g Lagos"}
            value={field.value}
            onValueChange={field.onChange}
            error={errors.fromCity?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="toCity"
        rules={{ required: "To city is required" }}
        render={({ field }) => (
          <SelectInput
            label="To City"
            disabled={citiesLoading}
            options={
              cities.map((item) => ({
                label: item.name,
                value: item.name,
              })) || []
            }
            placeholder={citiesLoading ? "...loading cities" : "e.g Lagos"}
            value={field.value}
            onValueChange={field.onChange}
            error={errors.toCity?.message}
          />
        )}
      />

      <div className="col-span-2 flex justify-end">
        <Button type="button" onClick={handleNextStep1}>
          Continue
        </Button>
      </div>
    </div>
  );

  // ─────────────────────────────
  // STEP 2 (plain JSX — data comes from the hoisted hooks above)
  // ─────────────────────────────
  const step2El = (
      <div className="flex flex-col gap-4">
        {/* PREDEFINED vs CUSTOM TOGGLE */}
        <div className="flex items-center justify-between border-2 border-gray-200 rounded-xl px-3 py-2.5 bg-gray-50/50">
          <p className="text-xs font-semibold text-gray-600">Package Size</p>
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
                setValue("boxDimensionId", "");
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

        {/* BOX — predefined mode only */}
        {!useCustomDimension && (
          <Controller
            control={control}
            name="boxDimensionId"
            rules={{ required: "Box is required" }}
            render={({ field }) => (
              <SelectInput
                label="Select Box"
                disabled={dimensionsLoading}
                options={
                  dimensions.map((item) => ({
                    value: item.id,
                    label: `${item.displayName} (Max ${item.weightKgLimit}kg • ${(
                      item.weightKgLimit / 1000
                    ).toFixed(3)}t • ${item.bestFor})`,
                  })) || []
                }
                value={field.value}
                onValueChange={(val) => {
                  field.onChange(val);
                  // Pre-fill weight/tons from box limit so fields aren't blank
                  const box = dimensions.find((d) => d.id === val);
                  if (box) {
                    setValue("weightKg", box.weightKgLimit);
                    setValue(
                      "tons",
                      parseFloat((box.weightKgLimit / 1000).toFixed(3)),
                    );
                    // Ensure a valid (non-zero) box count so Calculate doesn't
                    // silently fail the min:1 validation rule on submit.
                    if (!values.cartons || values.cartons < 1) {
                      setValue("cartons", 1);
                    }
                  } else {
                    setValue("weightKg", undefined as any);
                    setValue("tons", undefined as any);
                  }
                }}
                error={errors.boxDimensionId?.message}
              />
            )}
          />
        )}

        {/* Box info banner — shown once a box is selected */}
        {!useCustomDimension && selectedBox && (
          <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-xs text-blue-700">
            <p className="font-semibold mb-0.5">{selectedBox.displayName}</p>
            <p className="text-blue-500">
              Max <strong>{maxWeight} kg</strong> per box &nbsp;·&nbsp; Best
              for: {selectedBox.bestFor}
            </p>
            {values.cartons > 1 && (
              <p className="mt-1 text-blue-600 font-medium">
                {values.cartons} boxes × {maxWeight} kg ={" "}
                <strong>{totalWeight} kg total</strong>
                &nbsp;({totalTons.toFixed(3)} t)
              </p>
            )}
          </div>
        )}

        {/* CUSTOM DIMENSIONS — free-form L/W/H + weight, only shown when toggled on */}
        {useCustomDimension && (
          <div className="grid grid-cols-2 gap-3 border-2 border-brand/30 bg-brand/5 rounded-xl p-3">
            <Input
              label="Weight (kg)"
              type="number"
              step="0.01"
              leftIcon={<Scale size={16} />}
              {...register("weightKg", {
                valueAsNumber: true,
                required: useCustomDimension ? "Weight is required" : false,
                min: { value: 0.1, message: "Weight must be greater than 0" },
                onChange: (e) => {
                  const val = Number(e.target.value);
                  setValue("tons", parseFloat((val / 1000).toFixed(3)));
                },
              })}
              error={errors.weightKg?.message}
            />
            <Input
              label="Length (cm)"
              type="number"
              step="0.1"
              {...register("lengthCm", {
                valueAsNumber: true,
                required: useCustomDimension ? "Length is required" : false,
                min: { value: 0.1, message: "Must be greater than 0" },
              })}
              error={errors.lengthCm?.message}
            />
            <Input
              label="Width (cm)"
              type="number"
              step="0.1"
              {...register("widthCm", {
                valueAsNumber: true,
                required: useCustomDimension ? "Width is required" : false,
                min: { value: 0.1, message: "Must be greater than 0" },
              })}
              error={errors.widthCm?.message}
            />
            <Input
              label="Height (cm)"
              type="number"
              step="0.1"
              {...register("heightCm", {
                valueAsNumber: true,
                required: useCustomDimension ? "Height is required" : false,
                min: { value: 0.1, message: "Must be greater than 0" },
              })}
              error={errors.heightCm?.message}
            />
          </div>
        )}

        {/* INPUTS */}
        <div className="grid grid-cols-2 gap-4">
          {/* WEIGHT — predefined mode only; custom mode has its own weight field above */}
          {!useCustomDimension && (
            <Input
              label={`Weight (kg)${selectedBox ? ` (max ${maxWeight})` : ""}`}
              type="number"
              step="0.01"
              leftIcon={<Scale size={16} />}
              {...register("weightKg", {
                valueAsNumber: true,
                required: "Weight is required",
                min: { value: 0.1, message: "Weight must be greater than 0" },
                validate: (v) =>
                  !selectedBox ||
                  v <= maxWeight ||
                  `Max allowed is ${maxWeight} kg`,
                onChange: (e) => {
                  const val = Number(e.target.value);
                  // Sync tons from kg
                  setValue("tons", parseFloat((val / 1000).toFixed(3)));
                  if (selectedBox && val > maxWeight) {
                    setValue("weightKg", maxWeight);
                    setValue("tons", parseFloat(maxTons.toFixed(3)));
                  }
                },
              })}
              error={errors.weightKg?.message}
            />
          )}

          {/* TONS — predefined mode only */}
          {!useCustomDimension && (
            <Input
              label={`Tons${selectedBox ? ` (max ${maxTons.toFixed(3)})` : ""}`}
              type="number"
              step="0.001"
              leftIcon={<Scale size={16} />}
              {...register("tons", {
                valueAsNumber: true,
                required: "Tons is required",
                validate: (v) =>
                  !selectedBox ||
                  v <= maxTons ||
                  `Max allowed is ${maxTons.toFixed(3)} t`,
                onChange: (e) => {
                  const val = Number(e.target.value);
                  // Sync kg from tons
                  setValue("weightKg", parseFloat((val * 1000).toFixed(2)));
                  if (selectedBox && val > maxTons) {
                    setValue("tons", parseFloat(maxTons.toFixed(3)));
                    setValue("weightKg", maxWeight);
                  }
                },
              })}
              error={errors.tons?.message}
            />
          )}

          {/* NUMBER OF BOXES / CARTONS */}
          <Input
            label={
              !useCustomDimension && values.boxDimensionId
                ? "Number of Boxes"
                : "Cartons"
            }
            type="number"
            leftIcon={<Package size={16} />}
            {...register("cartons", {
              valueAsNumber: true,
              required: values.boxDimensionId
                ? "Number of boxes is required"
                : "Cartons required",
              min: {
                value: 1,
                message: values.boxDimensionId
                  ? "Minimum of 1 box required"
                  : "Minimum of 1 carton required",
              },
            })}
            error={errors.cartons?.message}
          />
        </div>

        {/* PROMO CODE */}
        <Input
          label="Promo Code (optional)"
          placeholder="e.g. LAUNCH20"
          {...register("promoCode")}
          error={errors.promoCode?.message}
          onChange={(e) => {
            e.target.value = e.target.value.toUpperCase().replace(/\s+/g, "");
          }}
        />

        {/* ACTION */}
        <div className="flex flex-col gap-3">
          {/* Sprint 7: Terms of Service consent */}
          <label className="flex items-start gap-2 cursor-pointer text-sm text-gray-600">
            <input
              type="checkbox"
              checked={termsAccepted}
              onChange={(e) => setTermsAccepted(e.target.checked)}
              className="mt-0.5 rounded border-gray-300 accent-blue-600"
            />
            <span>
              By clicking Calculate, you agree to our{" "}
              <a
                href="/policies/terms"
                target="_blank"
                className="text-blue-600 underline"
              >
                Terms of Service
              </a>
            </span>
          </label>
          <div className="flex justify-between">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setStep(1)}
            >
              Back
            </Button>

            <Button
              type="button"
              isLoading={isLoadingQuote}
              disabled={!termsAccepted}
              onClick={handleNextStep2}
            >
              Calculate
            </Button>
          </div>
        </div>
      </div>
  );

  // ─────────────────────────────
  // STEP 3 (plain JSX — no longer a nested component)
  // ─────────────────────────────
  const quote = (data as CreateQuoteResponse)?.data?.quote;
    const currency = quote?.currency ?? "NGN";
    const formatMoney = (amount?: number | null) =>
      new Intl.NumberFormat("en-NG", {
        style: "currency",
        currency,
        maximumFractionDigits: 2,
      }).format(amount ?? 0);

    const rows = (items: { label: string; value?: string | number | null }[]) =>
      items.map(({ label, value }) => (
        <div
          key={label}
          className="flex items-center justify-between border-b border-gray-100 py-2 last:border-none"
        >
          <span className="text-xs text-gray-500">{label}</span>
          <span className="text-right text-xs font-medium text-gray-900">
            {value ?? "—"}
          </span>
        </div>
      ));

    const step3El = (
      <div className="flex flex-col gap-5">
        <div className="w-full rounded-2xl bg-gray-900 p-6 text-center">
          <p className="text-[10px] uppercase tracking-widest text-gray-400">
            Total Price
          </p>
          <h1 className="mt-2 text-4xl font-bold tracking-tight text-white">
            {quote ? formatMoney(quote.total) : "—"}
          </h1>

          <div className="my-4 border-t border-dashed border-gray-700" />

          <div className="grid grid-cols-3 divide-x divide-gray-700 text-left">
            <div className="px-3 first:pl-0">
              <p className="text-[10px] text-gray-400">Mode</p>
              <p className="text-sm font-semibold text-white">
                {quote?.pricingMode ?? "—"}
              </p>
            </div>
            <div className="px-3">
              <p className="text-[10px] text-gray-400">Zone</p>
              <p className="text-sm font-semibold text-white">
                {quote?.zone ? `Zone ${quote.zone}` : "—"}
              </p>
            </div>
            <div className="px-3 last:pr-0">
              <p className="text-[10px] text-gray-400">Distance</p>
              <p className="text-sm font-semibold text-white">
                {quote?.distanceKm
                  ? `${quote?.distanceKm?.toLocaleString()} km`
                  : "—"}
              </p>
            </div>
          </div>
        </div>

        <div className="w-full">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-gray-400">
            Route Details
          </p>
          {rows([
            {
              label: "From",
              value: quote?.fromCity
                ? `${quote.fromCity.name}, ${quote.fromCity.state}`
                : values.fromCity,
            },
            {
              label: "To",
              value: quote?.toCity
                ? `${quote.toCity.name}, ${quote.toCity.state}`
                : values.toCity,
            },
            {
              label: "Weight",
              value: quote ? `${quote.weightKg}kg` : `${values.weightKg}kg`,
            },
            { label: "Currency", value: quote?.currency },
          ])}
        </div>

        <div className="w-full">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-gray-400">
            Price Breakdown
          </p>
          {rows([
            {
              label: "Price per Kg",
              value: quote ? formatMoney(quote.breakdown.pricePerKg) : null,
            },
            {
              label: "Standard Base Price",
              value: quote
                ? formatMoney(quote.breakdown.standardBasePrice)
                : null,
            },
            {
              label: "Final Base Price",
              value: quote ? formatMoney(quote.breakdown.finalBasePrice) : null,
            },
            {
              label: "Discount",
              value: quote?.appliedDiscount?.amount
                ? `-${formatMoney(quote.appliedDiscount.amount)}`
                : "—",
            },
          ])}

          {quote?.surchargeBreakdown?.map((item) => (
            <div
              key={`${item.type}-${item.label}`}
              className="flex items-center justify-between border-b border-gray-100 py-2"
            >
              <div>
                <p className="text-xs text-gray-500">{item.label}</p>
                {item.description && (
                  <p className="mt-0.5 text-[10px] text-gray-400">
                    {item.description}
                  </p>
                )}
              </div>
              <span className="text-xs font-medium text-gray-900">
                {formatMoney(item.amount)}
              </span>
            </div>
          ))}

          {rows([
            {
              label: "Total Surcharge",
              value: quote ? formatMoney(quote.totalSurcharge) : null,
            },
            {
              label: "Total",
              value: quote ? formatMoney(quote.total) : null,
            },
          ])}
        </div>

        <div className="flex gap-3 w-full">
          <Button
            type="button"
            className="flex-1"
            onClick={() => {
              handleClose(false);
              onCreateShipment?.({
                fromCity: quote?.fromCity?.name ?? values.fromCity,
                toCity: quote?.toCity?.name ?? values.toCity,
                boxSize: useCustomDimension ? undefined : values.boxDimensionId,
                weight: values.weightKg,
                length: values.lengthCm,
                width: values.widthCm,
                height: values.heightCm,
                cartons: values.cartons,
                tons: values.tons,
                isCustomDimension: useCustomDimension,
              });
            }}
          >
            <Check size={16} /> Create Shipment
          </Button>

          <Button
            type="button"
            variant="secondary"
            className="flex-1"
            onClick={() => handleClose(false)}
          >
            Close
          </Button>
        </div>
      </div>
    );

  return (
    <Dialog.Root open={isOpen} onOpenChange={handleClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-white rounded-2xl shadow-xl w-full max-w-xl p-6 max-h-[90vh] flex flex-col">
          <div className="flex justify-between items-center mb-4 shrink-0">
            <Dialog.Title className="text-lg font-semibold">
              Create Quote
            </Dialog.Title>
            <Dialog.Close asChild>
              <button className="text-gray-400 hover:text-black">✕</button>
            </Dialog.Close>
          </div>
          <div className="shrink-0">
            {stepperEl}
          </div>
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex-1 overflow-y-auto pr-1"
          >
            {step === 1 && step1El}
            {step === 2 && step2El}
            {step === 3 && step3El}
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
