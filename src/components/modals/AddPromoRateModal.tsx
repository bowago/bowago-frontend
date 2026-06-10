"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { Controller, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { useEffect } from "react";

import { Input, TextArea, RadioGroupCard, SelectInput } from "../ui/input";
import { Button } from "../ui/button";
import { Tag, Percent, Calendar, Hash, Banknote } from "lucide-react";
import {
  useAddPromoRateMutation,
  useEditPromoRateMutation,
} from "@/store/slice/apiSlice";
import { AddPromoRateSchemaFormData, promoRateSchema } from "@/lib/validation";

type InitialPromoRate = AddPromoRateSchemaFormData & {
  id: string;
};

export default function AddPromoRateModal({
  isOpen,
  setIsOpen,
  initialValue,
  isEdit,
}: {
  isOpen: boolean;
  setIsOpen: (v: boolean) => void;
  initialValue?: InitialPromoRate;
  isEdit?: boolean;
}) {
  const [handleAddPromo, { isLoading }] = useAddPromoRateMutation();
  const [handleEditPromo, { isLoading: isEditing }] =
    useEditPromoRateMutation();

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
    reset,
  } = useForm<any>({
    resolver: yupResolver(promoRateSchema) as any,
    defaultValues: {
      code: initialValue?.code ?? "",
      label: initialValue?.label ?? "",
      description: initialValue?.description ?? "",
      discountType: initialValue?.discountPercent != null ? "percent" : "flat", // ✅ auto detect edit mode
      discountPercent: initialValue?.discountPercent ?? 0,
      flatDiscount: initialValue?.flatDiscount ?? 0,
      serviceType: initialValue?.serviceType ?? "STANDARD",
      zone: initialValue?.zone ?? 0,
      minWeightKg: initialValue?.minWeightKg ?? 0,
      maxUsageCount: initialValue?.maxUsageCount ?? 0,
      validFrom: initialValue?.validFrom ?? "",
      validUntil: initialValue?.validUntil ?? "",
    },
  });

  const discountType = watch("discountType");

  const handleClose = () => {
    reset();
    setIsOpen(false);
  };

  const onSubmit = (data: AddPromoRateSchemaFormData) => {
    const payload: any = { ...data };

    // ✅ enforce only one
    if (data.discountType === "percent") {
      payload.flatDiscount = null;
    } else {
      payload.discountPercent = null;
    }

    if (!isEdit) {
      handleAddPromo(payload).unwrap().then(handleClose);
    } else {
      handleEditPromo({
        id: initialValue?.id ?? "",
        ...payload,
      })
        .unwrap()
        .then(handleClose);
    }
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={handleClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40" />

        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl w-full max-w-2xl p-6 z-50 shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <Dialog.Title className="text-xl font-semibold">
              {isEdit ? "Edit" : "Create"} Promo Rate
            </Dialog.Title>

            <Dialog.Close asChild>
              <button className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100">
                ✕
              </button>
            </Dialog.Close>
          </div>

          {/* FORM */}
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="grid grid-cols-2 gap-4">
              {/* CODE */}
              <Input
                label="Promo Code"
                placeholder="LAUNCH20"
                leftIcon={<Hash size={14} />}
                {...register("code")}
                error={errors.code?.message as string}
                onChange={(e) => {
                  e.target.value = e.target.value
                    .toUpperCase()
                    .replace(/\s+/g, "");
                }}
              />

              {/* ZONE */}

              <Controller
                control={control}
                name="zone"
                render={({ field }) => (
                  <SelectInput
                    label="Zone"
                    placeholder="Select a zone"
                    options={[
                      { label: "Zone 1", value: "1" },
                      { label: "Zone 2", value: "2" },
                      { label: "Zone 3", value: "3" },
                      { label: "Zone 4", value: "4" },
                    ]}
                    value={field.value}
                    onValueChange={field.onChange}
                    error={errors.zone?.message as string}
                  />
                )}
              />

              {/* LABEL */}
              <div className="col-span-2">
                <Input
                  label="Promo Label"
                  placeholder="Launch Promo — 20% off"
                  leftIcon={<Tag size={14} />}
                  {...register("label")}
                  error={errors.label?.message as string}
                />
              </div>

              {/* DESCRIPTION */}
              <div className="col-span-2">
                <TextArea
                  label="Description"
                  placeholder="Short promo description..."
                  {...register("description")}
                  error={errors.description?.message as string}
                />
              </div>

              {/* SERVICE TYPE */}
              <div className="col-span-2">
                <Controller
                  name="serviceType"
                  control={control}
                  render={({ field }) => (
                    <RadioGroupCard
                      label="Service Type"
                      value={field.value}
                      onValueChange={field.onChange}
                      className="flex flex-row"
                      options={[
                        {
                          label: "Express",
                          description: "1–3 days",
                          value: "EXPRESS",
                        },
                        {
                          label: "Standard",
                          description: "5–7 days",
                          value: "STANDARD",
                        },
                        {
                          label: "Economy",
                          description: "10–14 days",
                          value: "ECONOMY",
                        },
                      ]}
                    />
                  )}
                />
              </div>

              {/* 🔥 DISCOUNT TYPE */}
              <div className="col-span-2">
                <Controller
                  name="discountType"
                  control={control}
                  render={({ field }) => (
                    <RadioGroupCard
                      label="Discount Type"
                      value={field.value}
                      onValueChange={(val) => {
                        field.onChange(val);

                        // reset opposite field
                        if (val === "percent") {
                          setValue("flatDiscount", 0);
                        } else {
                          setValue("discountPercent", 0);
                        }
                      }}
                      className="flex flex-row"
                      options={[
                        {
                          label: "Percentage",
                          description: "e.g. 20% off",
                          value: "percent",
                        },
                        {
                          label: "Flat Amount",
                          description: "e.g. ₦2000 off",
                          value: "flat",
                        },
                      ]}
                    />
                  )}
                />
              </div>

              {/* CONDITIONAL INPUTS */}
              {discountType === "percent" && (
                <Input
                  label="Discount (%)"
                  type="number"
                  leftIcon={<Percent size={14} />}
                  {...register("discountPercent", {
                    valueAsNumber: true,
                  })}
                  error={errors.discountPercent?.message as string}
                />
              )}

              {discountType === "flat" && (
                <Input
                  label="Flat Discount (₦)"
                  type="number"
                  leftIcon={<Banknote size={14} />}
                  {...register("flatDiscount", {
                    valueAsNumber: true,
                  })}
                  error={errors.flatDiscount?.message as string}
                />
              )}

              {/* LIMITS */}
              <Input
                label="Min Weight (kg)"
                type="number"
                {...register("minWeightKg", {
                  valueAsNumber: true,
                })}
                error={errors.minWeightKg?.message as string}
              />

              <Input
                label="Max Usage Count"
                type="number"
                {...register("maxUsageCount", {
                  valueAsNumber: true,
                })}
                error={errors.maxUsageCount?.message as string}
              />

              {/* DATES */}
              <Input
                label="Valid From"
                type="date"
                leftIcon={<Calendar size={14} />}
                {...register("validFrom")}
                error={errors.validFrom?.message as string}
              />

              <Input
                label="Valid Until"
                type="date"
                leftIcon={<Calendar size={14} />}
                {...register("validUntil")}
                error={errors.validUntil?.message as string}
              />
            </div>

            {/* ACTION */}
            <div className="flex justify-end mt-6">
              <Button isLoading={isLoading || isEditing} type="submit">
                {isEdit ? "Update" : "Create"} Promo
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
