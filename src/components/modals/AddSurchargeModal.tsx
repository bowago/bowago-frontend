"use client";

import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Controller, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";

import { Input, TextArea, SelectInput, RadioGroupCard } from "../ui/input";
import { Button } from "../ui/button";

import {
  useCreateSurchargeMutation,
  useEditSurchargeMutation,
} from "@/store/slice/apiSlice";
import * as yup from "yup";

/* ───────────────── TYPES ───────────────── */

export interface AddSurchargeFormData {
  type: "FUEL" | "REMOTE_AREA" | "VAT" | "FRAGILE" | "INSURANCE" | "OVERSIZE";
  label: string;
  description: string;

  pricingType: "PERCENTAGE" | "FLAT";

  ratePercent?: number;
  flatAmount?: number;

  appliesTo: "ALL" | "EXPRESS" | "STANDARD" | "ECONOMY";
}

/* ───────────────── VALIDATION ───────────────── */

export const addSurchargeSchema = yup.object({
  type: yup.string().required("Type is required"),

  label: yup.string().required("Label is required"),
  isActive: yup.boolean().optional(),

  description: yup.string().required("Description is required"),

  pricingType: yup
    .string()
    .oneOf(["PERCENTAGE", "FLAT"])
    .required("Pricing type is required"),

  ratePercent: yup
    .number()
    .transform((v, o) => (o === "" ? undefined : v))
    .when("pricingType", {
      is: "PERCENTAGE",
      then: (schema) =>
        schema
          .required("Rate percent is required")
          .min(0, "Cannot be negative")
          .max(100, "Cannot exceed 100%"),
      otherwise: (schema) => schema.notRequired(),
    }),

  flatAmount: yup
    .number()
    .transform((v, o) => (o === "" ? undefined : v))
    .when("pricingType", {
      is: "FLAT",
      then: (schema) =>
        schema.required("Flat amount is required").min(0, "Cannot be negative"),
      otherwise: (schema) => schema.notRequired(),
    }),

  appliesTo: yup.string().required("Applies to is required"),
});

/* ───────────────── OPTIONS ───────────────── */

const SURCHARGE_TYPES = [
  { label: "Fuel", value: "FUEL" },
  { label: "Remote Area", value: "REMOTE_AREA" },
  { label: "VAT", value: "VAT" },
  { label: "Fragile", value: "FRAGILE" },
  { label: "Insurance", value: "INSURANCE" },
  { label: "Oversize", value: "OVERSIZE" },
];

const APPLIES_TO = [
  { label: "All", value: "ALL" },
  { label: "Express", value: "EXPRESS" },
  { label: "Standard", value: "STANDARD" },
  { label: "Economy", value: "ECONOMY" },
];

/* ───────────────── COMPONENT ───────────────── */

export default function AddSurchargeModal({
  isOpen,
  setIsOpen,
  isEdit,
  initialValue,
}: {
  isOpen: boolean;
  setIsOpen: (e: boolean) => void;
  isEdit?: boolean;
  initialValue?: any;
}) {
  const [createSurcharge, { isLoading }] = useCreateSurchargeMutation();
  const [editSurcharge, { isLoading: isLoadingEditSurcharge }] =
    useEditSurchargeMutation();

  // console.log(initialValue);

  const form = useForm({
    resolver: yupResolver(addSurchargeSchema),
    defaultValues: {
      pricingType: initialValue?.ratePercent
        ? "PERCENTAGE"
        : initialValue?.flatAmount
          ? "FLAT"
          : "PERCENTAGE",
      appliesTo: initialValue?.appliesTo ?? "ALL",
      type: initialValue?.type ?? "",
      label: initialValue?.label ?? "",
      description: initialValue?.description ?? "",
      ratePercent: initialValue?.ratePercent,
      flatAmount: initialValue?.flatAmount,
    },
  });

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = form;

  const pricingType = watch("pricingType");

  const handleClose = (v: boolean) => {
    setIsOpen(v);
    if (!v) reset();
  };

  const onSubmit = async (data: any) => {
    const payload: any = {
      type: data.type,
      label: data.label,
      description: data.description,
      appliesTo: data.appliesTo,
    };

    if (data.pricingType === "PERCENTAGE") {
      payload.ratePercent = data.ratePercent;
    }

    if (data.pricingType === "FLAT") {
      payload.flatAmount = data.flatAmount;
    }

    if (!isEdit) {
      createSurcharge(payload)
        .unwrap()
        .then(() => handleClose(false));
    } else {
      editSurcharge({
        id: initialValue?.id ?? "",
        ...payload,
      })
        .unwrap()
        .then(() => handleClose(false));
    }
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={handleClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 z-40" />

        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl w-full max-w-xl p-6 z-50">
          <div className="flex justify-between items-center mb-4">
            <Dialog.Title className="text-lg font-semibold">
              Create Surcharge
            </Dialog.Title>

            <Dialog.Close asChild>
              <button>✕</button>
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="grid grid-cols-2 gap-4">
              {/* TYPE */}
              <Controller
                control={control}
                name="type"
                render={({ field }) => (
                  <SelectInput
                    label="Type"
                    options={SURCHARGE_TYPES}
                    value={field.value}
                    onValueChange={field.onChange}
                    error={errors.type?.message}
                  />
                )}
              />

              {/* APPLIES TO */}
              <Controller
                control={control}
                name="appliesTo"
                render={({ field }) => (
                  <SelectInput
                    label="Applies To"
                    options={APPLIES_TO}
                    value={field.value}
                    onValueChange={field.onChange}
                    error={errors.appliesTo?.message}
                  />
                )}
              />

              {/* LABEL */}
              <div className="col-span-2">
                <Input
                  label="Label"
                  {...register("label")}
                  error={errors.label?.message}
                />
              </div>

              {/* DESCRIPTION */}
              <div className="col-span-2">
                <TextArea
                  label="Description"
                  {...register("description")}
                  error={errors.description?.message}
                />
              </div>

              {/* PRICING TYPE */}
              <div className="col-span-2">
                <Controller
                  name="pricingType"
                  control={control}
                  render={({ field }) => (
                    <RadioGroupCard
                      label="Pricing Type"
                      className="flex flex-row"
                      value={field.value}
                      onValueChange={(val) => {
                        field.onChange(val);

                        // reset opposite field
                        if (val === "PERCENTAGE") {
                          setValue("flatAmount", undefined);
                        } else {
                          setValue("ratePercent", undefined);
                        }
                      }}
                      options={[
                        {
                          label: "Percentage (%)",
                          description: "Apply percentage surcharge",
                          value: "PERCENTAGE",
                        },
                        {
                          label: "Flat Amount",
                          description: "Fixed charge",
                          value: "FLAT",
                        },
                      ]}
                    />
                  )}
                />
              </div>

              {/* CONDITIONAL INPUTS */}
              {pricingType === "PERCENTAGE" && (
                <Input
                  label="Rate Percent (%)"
                  type="number"
                  min={0}
                  max={100}
                  step="0.1"
                  {...register("ratePercent", { valueAsNumber: true })}
                  error={errors.ratePercent?.message}
                />
              )}

              {pricingType === "FLAT" && (
                <Input
                  label="Flat Amount (₦)"
                  type="number"
                  min={0}
                  {...register("flatAmount", { valueAsNumber: true })}
                  error={errors.flatAmount?.message}
                />
              )}

              {isEdit && (
                <label className="flex items-center gap-2 cursor-pointer col-span-2">
                  <input
                    value={initialValue?.isActive}
                    type="checkbox"
                    {...register("isActive")}
                    className="w-4 h-4 accent-gray-900 cursor-pointer"
                  />
                  <span className="text-xs text-gray-500">Is Active</span>
                </label>
              )}
            </div>

            <div className="flex justify-end mt-6">
              <Button
                isLoading={isLoading || isLoadingEditSurcharge}
                type="submit"
              >
                Create Surcharge
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
