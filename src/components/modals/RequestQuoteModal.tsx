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

interface QuoteFormData {
  fromCity: string;
  toCity: string;
  weightKg: number;
  tons: number;
  cartons: number;
  boxDimensionId: string;
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
}: {
  isOpen: boolean;
  setIsOpen: (v: boolean) => void;
}) {
  const [handleCreateQuote, { isLoading: isLoadingQuote, data }] =
    useCreateQuoteMutation();
  const [step, setStep] = useState(1);

  const form = useForm<QuoteFormData>({
    mode: "onChange",
    defaultValues: {
      fromCity: "",
      toCity: "",
      weightKg: 0,
      tons: 0,
      cartons: 0,
      boxDimensionId: "",
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

  const reset = () => {
    form.reset();
    setStep(1);
  };

  const handleClose = (v: boolean) => {
    setIsOpen(v);
    if (!v) reset();
  };

  const onSubmit = (data: QuoteFormData) => {
    handleCreateQuote(data)
      .unwrap()
      .then(() => {
        setStep(3);
      });
    // console.log("FINAL PAYLOAD:", data);
    // setStep(3);
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
    const valid = await trigger([
      "boxDimensionId",
      "weightKg",
      "tons",
      "cartons",
    ]);
    if (valid) handleSubmit(onSubmit)();
  };

  // ─────────────────────────────
  // STEPPER
  // ─────────────────────────────
  const Stepper = () => (
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
  // STEP 1
  // ─────────────────────────────
  const Step1 = () => {
    const { data, isLoading } = useGetCitiesQuery({});
    const cities = (data?.data?.cities ?? []) as CityOption[];

    return (
      <div className="grid grid-cols-2 gap-4">
        <Controller
          control={control}
          name="fromCity"
          rules={{ required: "From city is required" }}
          render={({ field }) => (
            <SelectInput
              label="From City"
              disabled={isLoading}
              options={
                cities.map((item) => ({
                  label: item.name,
                  value: item.name,
                })) || []
              }
              placeholder={isLoading ? "...loading cities" : "e.g Lagos"}
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
              disabled={isLoading}
              options={
                cities.map((item) => ({
                  label: item.name,
                  value: item.name,
                })) || []
              }
              placeholder={isLoading ? "...loading cities" : "e.g Lagos"}
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
  };

  // ─────────────────────────────
  // STEP 2
  // ─────────────────────────────
  const Step2 = () => {
    const { data, isLoading } = useGetDimensionsQuery({});
    const dimensions = (data?.data?.dimensions ?? []) as BoxDimension[];

    const selectedBox = dimensions.find(
      (item) => item.id === values.boxDimensionId,
    );

    const maxWeight = selectedBox?.weightKgLimit || 0;
    const maxTons = maxWeight / 1000;

    return (
      <div className="flex flex-col gap-4">
        {/* BOX */}
        <Controller
          control={control}
          name="boxDimensionId"
          rules={{ required: "Box is required" }}
          render={({ field }) => (
            <SelectInput
              label="Select Box"
              disabled={isLoading}
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

                const selected = dimensions.find((d) => d.id === val);

                if (selected) {
                  setValue("weightKg", selected.weightKgLimit);
                  setValue("tons", selected.weightKgLimit / 1000);
                }
              }}
              error={errors.boxDimensionId?.message}
            />
          )}
        />

        {/* INPUTS */}
        <div className="grid grid-cols-2 gap-4">
          {/* WEIGHT */}
          <Input
            label={`Weight (kg) (max ${maxWeight})`}
            type="number"
            step="0.01"
            leftIcon={<Scale size={16} />}
            {...register("weightKg", {
              valueAsNumber: true,
              required: "Weight is required",
              validate: (v) =>
                v <= maxWeight || `Max allowed is ${maxWeight}kg`,
              onChange: (e) => {
                const val = Number(e.target.value);
                if (val > maxWeight) {
                  setValue("weightKg", maxWeight);
                }
              },
            })}
            error={errors.weightKg?.message}
          />

          {/* TONS */}
          <Input
            label={`Tons (max ${maxTons.toFixed(3)})`}
            type="number"
            step="0.001"
            leftIcon={<Scale size={16} />}
            {...register("tons", {
              valueAsNumber: true,
              required: "Tons is required",
              validate: (v) =>
                v <= maxTons || `Max allowed is ${maxTons.toFixed(3)}t`,
              onChange: (e) => {
                const val = Number(e.target.value);
                if (val > maxTons) {
                  setValue("tons", maxTons);
                }
              },
            })}
            error={errors.tons?.message}
          />

          {/* CARTONS */}
          <Input
            label="Cartons"
            type="number"
            leftIcon={<Package size={16} />}
            {...register("cartons", {
              valueAsNumber: true,
              required: "Cartons required",
              min: {
                value: 1,
                message: "Minimum of 1 carton required",
              },
            })}
            error={errors.cartons?.message}
          />
        </div>

        {/* ACTION */}
        <div className="flex justify-between">
          <Button type="button" variant="secondary" onClick={() => setStep(1)}>
            Back
          </Button>

          <Button
            type="button"
            isLoading={isLoadingQuote}
            onClick={handleNextStep2}
          >
            Calculate
          </Button>
        </div>
      </div>
    );
  };

  // ─────────────────────────────
  // STEP 3
  // ─────────────────────────────
  const Step3 = ({ data }: { data?: CreateQuoteResponse }) => {
    const quote = data?.data?.quote;
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

    return (
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
                {quote?.distanceKm ? `${quote?.distanceKm?.toLocaleString()} km` : "—"}
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
          <Button type="button" className="flex-1">
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
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={handleClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-white rounded-2xl shadow-xl w-full max-w-xl p-6">
          <div className="flex justify-between items-center mb-4">
            <Dialog.Title className="text-lg font-semibold">
              Create Quote
            </Dialog.Title>
            <Dialog.Close asChild>
              <button className="text-gray-400 hover:text-black">✕</button>
            </Dialog.Close>
          </div>
          <Stepper />
          <form onSubmit={handleSubmit(onSubmit)}>
            {step === 1 && <Step1 />}
            {step === 2 && <Step2 />}
            {step === 3 && <Step3 data={data as CreateQuoteResponse} />}
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
