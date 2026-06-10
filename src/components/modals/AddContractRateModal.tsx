"use client";

import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Controller, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";

import { contractRateSchema, ContractRateFormData } from "@/lib/validation";
import { Input, TextArea, SelectInput, RadioGroupCard } from "../ui/input";
import { Button } from "../ui/button";
import {
  useAddContractRateMutation,
  useEditContractRateMutation,
  useGetUsersQuery,
} from "@/store/slice/apiSlice";

export default function AddContractRateModal({
  isOpen,
  setIsOpen,
}: {
  isOpen: boolean;
  setIsOpen: (v: boolean) => void;
}) {
  const { data: usersData, isLoading: isLoadingUsers } = useGetUsersQuery({});
  const [handleAddContractRate, { isLoading }] = useAddContractRateMutation();
  const [handleEditContractRate, { isLoading: isLoadingContract }] =
    useEditContractRateMutation();

  const contractForm = useForm<ContractRateFormData>({
    resolver: yupResolver(contractRateSchema) as any,
    defaultValues: {
      pricingType: "discount",
      discountPercent: 0,
      isActive: true,
      fixedPricePerKgByZone: {
        "1": 0,
        "2": 0,
        "3": 0,
        "4": 0,
      },
    },
  });

  const reset = () => contractForm.reset();

  const handleOpenChange = (v: boolean) => {
    setIsOpen(v);
    if (!v) reset();
  };

  const ContractForm = () => {
    const {
      register,
      handleSubmit,
      control,
      watch,
      setValue,
      formState: { errors },
    } = contractForm;

    const pricingType = watch("pricingType");
    const zones = ["1", "2", "3", "4"] as const;

    const onSubmit = (data: ContractRateFormData) => {
      const payload: any = {
        userId: data.userId,
        label: data.label,
        serviceType: data.serviceType,
        isActive: data.isActive,
        validFrom: data.validFrom,
        validUntil: data.validUntil,
        notes: data.notes,
      };

      if (data.pricingType === "discount") {
        payload.discountPercent = data.discountPercent;
      }

      if (data.pricingType === "fixed") {
        payload.fixedPricePerKgByZone = data.fixedPricePerKgByZone;
      }

      handleAddContractRate(payload)
        .unwrap()
        .then(() => {
          reset();
          setIsOpen(false);
        });
    };

    return (
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-2 gap-3 mt-6">
          {/* User */}
          <Controller
            control={control}
            name="userId"
            render={({ field }) => (
              <SelectInput
                label="Select user"
                disabled={isLoadingUsers}
                placeholder={isLoadingUsers ? "...loading" : "Select user"}
                options={
                  usersData?.data?.users?.map(
                    (item: {
                      firstName: string;
                      id: string;
                      lastName: string;
                    }) => ({
                      label: `${item.lastName} ${item.firstName}`,
                      value: item.id,
                    }),
                  ) || []
                }
                value={field.value}
                onValueChange={field.onChange}
                error={errors.userId?.message}
              />
            )}
          />

          {/* Service Type */}
          <div className="col-span-2">
            <Controller
              name="serviceType"
              control={control}
              render={({ field }) => (
                <RadioGroupCard
                  label="Service Type"
                  className="flex flex-row"
                  value={field.value}
                  onValueChange={field.onChange}
                  options={[
                    {
                      label: "Express",
                      description: "1–3 business days",
                      value: "EXPRESS",
                    },
                    {
                      label: "Standard",
                      description: "5–7 business days",
                      value: "STANDARD",
                    },
                    {
                      label: "Economy",
                      description: "10–14 business days",
                      value: "ECONOMY",
                    },
                  ]}
                />
              )}
            />
          </div>

          {/* Label */}
          <div className="col-span-2">
            <Input
              label="Contract Label"
              {...register("label")}
              error={errors.label?.message}
            />
          </div>

          {/* 🔥 Pricing Type */}
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

                    // Reset opposite field
                    if (val === "discount") {
                      setValue("fixedPricePerKgByZone", {
                        "1": 0,
                        "2": 0,
                        "3": 0,
                        "4": 0,
                      });
                    } else {
                      setValue("discountPercent", 0);
                    }
                  }}
                  options={[
                    {
                      label: "Discount %",
                      description: "Apply percentage discount",
                      value: "discount",
                    },
                    {
                      label: "Fixed Price",
                      description: "Set price per kg by zone",
                      value: "fixed",
                    },
                  ]}
                />
              )}
            />
          </div>

          {/* Discount */}
          {pricingType === "discount" && (
            <Input
              label="Discount (%)"
              type="number"
              {...register("discountPercent", { valueAsNumber: true })}
              error={errors.discountPercent?.message}
            />
          )}

          {/* Dates */}
          <Input
            type="date"
            label="Valid From"
            {...register("validFrom")}
            error={errors.validFrom?.message}
          />

          <Input
            type="date"
            label="Valid Until"
            {...register("validUntil")}
            error={errors.validUntil?.message}
          />

          {/* Zone Pricing */}
          {pricingType === "fixed" && (
            <div className="col-span-2">
              <p className="text-sm font-medium mb-2">
                Fixed Price Per Kg (Zone)
              </p>

              <div className="grid grid-cols-4 gap-2">
                {zones.map((zone) => (
                  <Input
                    key={zone}
                    type="number"
                    label={`Zone ${zone}`}
                    {...register(`fixedPricePerKgByZone.${zone}` as const, {
                      valueAsNumber: true,
                    })}
                    error={errors.fixedPricePerKgByZone?.[zone]?.message}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="col-span-2">
            <TextArea
              label="Notes"
              {...register("notes")}
              error={errors.notes?.message}
            />
          </div>
        </div>

        <div className="flex justify-end mt-5">
          <Button isLoading={isLoading || isLoadingContract} type="submit">
            Create Contract Rate
          </Button>
        </div>
      </form>
    );
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40" />

        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-white rounded-2xl shadow-xl w-full max-w-2xl p-6">
          <div className="flex justify-between items-center">
            <Dialog.Title className="text-lg font-semibold">
              Create Contract Rate
            </Dialog.Title>

            <Dialog.Close asChild>
              <button className="text-gray-400 hover:text-gray-600">✕</button>
            </Dialog.Close>
          </div>

          <ContractForm />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
