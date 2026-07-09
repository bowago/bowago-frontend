"use client";

import { useState, useEffect } from "react";
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

import { ContractRate } from "../table/columns/contract-rate-column";

export default function AddContractRateModal({
  isOpen,
  setIsOpen,
  editingRate,
}: {
  isOpen: boolean;
  setIsOpen: (v: boolean) => void;
  /** When provided, the modal edits this rate instead of creating a new one */
  editingRate?: ContractRate | null;
}) {
  const { data: usersData, isLoading: isLoadingUsers } = useGetUsersQuery({});
  const [handleAddContractRate, { isLoading }] = useAddContractRateMutation();
  const [handleEditContractRate, { isLoading: isLoadingContract }] =
    useEditContractRateMutation();

  const isEditMode = !!editingRate;

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

  // Pre-fill the form whenever we open in edit mode for a given rate
  useEffect(() => {
    if (!isOpen) return;

    if (editingRate) {
      const toDateInput = (d: string) =>
        d ? new Date(d).toISOString().slice(0, 10) : "";

      contractForm.reset({
        userId: editingRate.user?.id ?? "",
        label: editingRate.label,
        serviceType: editingRate.serviceType,
        pricingType: editingRate.fixedPricePerKgByZone ? "fixed" : "discount",
        discountPercent: editingRate.discountPercent ?? 0,
        fixedPricePerKgByZone: editingRate.fixedPricePerKgByZone ?? {
          "1": 0,
          "2": 0,
          "3": 0,
          "4": 0,
        },
        isActive: editingRate.isActive,
        validFrom: toDateInput(editingRate.validFrom),
        validUntil: toDateInput(editingRate.validUntil),
        notes: (editingRate as any).notes ?? "",
      });
    } else {
      reset();
    }
  }, [isOpen, editingRate]);

  const handleOpenChange = (v: boolean) => {
    setIsOpen(v);
    if (!v) reset();
  };

  // NOTE: this used to be a `const ContractForm = () => {...}` component
  // defined INSIDE this component's render body. That's a React anti-pattern:
  // every time AddContractRateModal re-renders (which happens the instant you
  // click Create, since isLoading flips synchronously), React sees a brand
  // new function reference and treats it as a different component type —
  // unmounting the whole form and mounting a fresh one mid-click. That's why
  // clicking "Create" could appear to do nothing. Fixed by hoisting all of
  // this to the top level, so the form JSX is stable across re-renders.
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
      label: data.label,
      serviceType: data.serviceType,
      isActive: data.isActive,
      validFrom: data.validFrom,
      validUntil: data.validUntil,
      notes: data.notes,
    };

    // Always send both pricing fields so switching pricing type on edit
    // correctly clears the unused one (e.g. discount -> fixed should
    // null out discountPercent).
    if (data.pricingType === "discount") {
      payload.discountPercent = data.discountPercent;
      payload.fixedPricePerKgByZone = null;
    } else {
      payload.fixedPricePerKgByZone = data.fixedPricePerKgByZone;
      payload.discountPercent = null;
    }

    if (isEditMode && editingRate) {
      handleEditContractRate({ id: editingRate.id, ...payload })
        .unwrap()
        .then(() => {
          reset();
          setIsOpen(false);
        })
        .catch(() => {
          // error toast already shown by the mutation's onQueryStarted —
          // this just stops it from becoming an unhandled rejection.
        });
      return;
    }

    handleAddContractRate({ userId: data.userId, ...payload })
      .unwrap()
      .then(() => {
        reset();
        setIsOpen(false);
      })
      .catch(() => {
        // error toast already shown by the mutation's onQueryStarted.
      });
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40" />

        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-white rounded-2xl shadow-xl w-full max-w-2xl flex flex-col max-h-[90vh]">
          {/* Fixed header */}
          <div className="flex justify-between items-center px-6 pt-6 pb-4 border-b border-gray-100 shrink-0">
            <Dialog.Title className="text-lg font-semibold">
              {isEditMode ? "Edit Contract Rate" : "Create Contract Rate"}
            </Dialog.Title>
            <Dialog.Close asChild>
              <button className="text-gray-400 hover:text-gray-600">✕</button>
            </Dialog.Close>
          </div>

          {/* Scrollable body */}
          <div className="overflow-y-auto flex-1 px-6 pb-6">
            <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-2 gap-3 mt-6">
          {/* User / Enterprise — assign to master to cover whole org */}
          <div className="col-span-2">
            <p className="text-xs text-gray-500 mb-1.5 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
              💡 Assign to a <strong>Master</strong> user to apply this rate to their entire enterprise team.
              Assigning to an individual user only affects that one person.
            </p>
            <Controller
              control={control}
              name="userId"
              render={({ field }) => (
                <SelectInput
                  label="Select Enterprise User / Master Account"
                  disabled={isLoadingUsers || isEditMode}
                  placeholder={isLoadingUsers ? "...loading" : "Select user"}
                  options={
                    usersData?.data?.users?.map(
                      (item: {
                        firstName: string;
                        id: string;
                        lastName: string;
                        enterpriseRole?: string;
                        role?: string;
                      }) => ({
                        label: `${item.lastName} ${item.firstName}${item.enterpriseRole === "ROLE_MASTER" ? " — Master (Org)" : ""}`,
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
          </div>

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
              min={0}
              max={100}
              {...register("discountPercent", { valueAsNumber: true })}
              error={errors.discountPercent?.message}
            />
          )}

          {/* Dates */}
          <div>
            <Input
              type="date"
              label="Valid From (optional)"
              {...register("validFrom")}
              error={errors.validFrom?.message}
            />
            <p className="text-xs text-gray-400 mt-1">Leave blank — contract is active from today.</p>
          </div>

          <div>
            <Input
              type="date"
              label="Valid Until (optional)"
              {...register("validUntil")}
              error={errors.validUntil?.message}
            />
            <p className="text-xs text-gray-400 mt-1">Leave blank — contract never expires.</p>
          </div>

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
                    min={0}
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

          {/* Active Status */}
          <div className="col-span-2">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                {...register("isActive")}
                defaultChecked
                className="w-4 h-4 accent-gray-900 cursor-pointer"
              />
              <span className="text-sm text-gray-700">Active</span>
              <span className="text-xs text-gray-400">(uncheck to deactivate without deleting)</span>
            </label>
          </div>
        </div>

        <div className="flex justify-end mt-5">
          <Button isLoading={isLoading || isLoadingContract} type="submit">
            {isEditMode ? "Save Changes" : "Create Contract Rate"}
          </Button>
        </div>
            </form>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
