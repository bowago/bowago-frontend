"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { Controller, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { StandardRateFormData, standardRateSchema } from "@/lib/validation";
import { Input, RadioGroupCard, SelectInput, TextArea } from "../ui/input";
import { Button } from "../ui/button";
import {
  useAddStandardRateMutation,
  useEditStandardRateMutation,
} from "@/store/slice/apiSlice";

type InitialStandardRateFormData = StandardRateFormData & {
  id: string;
};

export default function AddStandardRateModal({
  isOpen,
  setIsOpen,
  initialValue,
  isEdit,
}: {
  isOpen: boolean;
  setIsOpen: (v: boolean) => void;
  initialValue?: InitialStandardRateFormData;
  isEdit?: boolean;
}) {
  const [handleAddStandardRate, { isLoading }] = useAddStandardRateMutation();
  const [handleEditStandardRate, { isLoading: isEditingRate }] =
    useEditStandardRateMutation();
  // console.log(initialValue);
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    reset,
  } = useForm<any>({
    resolver: yupResolver(standardRateSchema),
    defaultValues: {
      isActive: initialValue?.isActive ?? false,
      serviceType: initialValue?.serviceType ?? "STANDARD",
      zone: initialValue?.zone ?? 0,
      minKg: initialValue?.minKg ?? 0,
      maxKg: initialValue?.maxKg ?? 0,
      minTons: initialValue?.minTons ?? 0,
      maxTons: initialValue?.maxTons ?? 0,
      minCartons: initialValue?.minCartons ?? 0,
      maxCartons: initialValue?.maxCartons ?? 0,
      reason: "",
      pricePerKg: initialValue?.pricePerKg ?? 0,
      basePrice: initialValue?.basePrice ?? 0,
    },
  });

  const onSubmit = (data: any) => {
    const { isActive, serviceType, ...addDataForm } = data;
    if (!isEdit) {
      handleAddStandardRate(addDataForm)
        .unwrap()
        .then(() => {
          reset();
          setIsOpen(false);
        });
    }
    if (isEdit) {
      handleEditStandardRate({
        id: initialValue?.id ?? "",
        isActive: isActive ?? initialValue?.isActive ?? false,
        serviceType: serviceType ?? initialValue?.serviceType ?? "STANDARD",
        ...addDataForm,
      })
        .unwrap()
        .then(() => {
          reset();
          setIsOpen(false);
        });
    }
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={setIsOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 z-40" />

        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl w-full max-w-xl p-6 z-50">
          <div className="flex items-center justify-between mb-6">
            <Dialog.Title className="text-2xl font-semibold text-gray-900">
              {isEdit ? "Edit" : "Add"} Standard Rate
            </Dialog.Title>

            <Dialog.Close asChild>
              <button className="w-8 h-8 flex items-center justify-center rounded-full text-gray-500 hover:bg-gray-100">
                ✕
              </button>
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="grid grid-cols-2 gap-3">
              {/* Zone */}
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

              <div className="col-span-2">
                {isEdit && (
                  <Controller
                    name="serviceType"
                    control={control}
                    render={({ field }) => (
                      <RadioGroupCard
                        label=" Service Type"
                        className="flex flex-row"
                        value={field.value?.toString()}
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
                )}
              </div>

              {/* Price per Kg */}
              <Input
                label="Price per Kg"
                type="number"
                min={0}
                {...register("pricePerKg", { valueAsNumber: true })}
                error={errors.pricePerKg?.message as string}
                rightElement={<span className="text-xs">₦</span>}
              />

              {/* Base Price */}
              <Input
                label="Base Price"
                type="number"
                min={0}
                {...register("basePrice", { valueAsNumber: true })}
                error={errors.basePrice?.message as string}
                rightElement={<span className="text-xs">₦</span>}
              />

              {/* KG Range */}
              <Input
                label="Min Kg"
                type="number"
                min={0}
                step="0.1"
                {...register("minKg", { valueAsNumber: true })}
                error={errors.minKg?.message as string}
                rightElement={<span className="text-xs">kg</span>}
              />

              <Input
                label="Max Kg"
                type="number"
                min={0}
                step="0.1"
                {...register("maxKg", { valueAsNumber: true })}
                error={errors.maxKg?.message as string}
                rightElement={<span className="text-xs">kg</span>}
              />

              {/* Tons */}
              <Input
                label="Min Tons"
                type="number"
                min={0}
                step="0.01"
                {...register("minTons", { valueAsNumber: true })}
                error={errors.minTons?.message as string}
                rightElement={<span className="text-xs">t</span>}
              />

              <Input
                label="Max Tons"
                type="number"
                min={0}
                step="0.01"
                {...register("maxTons", { valueAsNumber: true })}
                error={errors.maxTons?.message as string}
                rightElement={<span className="text-xs">t</span>}
              />

              {/* Cartons */}
              <Input
                label="Min Cartons"
                type="number"
                min={0}
                {...register("minCartons", { valueAsNumber: true })}
                error={errors.minCartons?.message as string}
              />

              <Input
                label="Max Cartons"
                type="number"
                min={0}
                {...register("maxCartons", { valueAsNumber: true })}
                error={errors.maxCartons?.message as string}
              />
            </div>

            {/* Only meaningful for edits — a brand-new price band has no
                previous version for this to explain a diff against. This
                feeds the "Reason" column on the Pricing Version Control /
                Price History page, which always showed "—" before since
                nothing anywhere ever collected it. */}
            {isEdit && (
              <div className="mt-3">
                <TextArea
                  label="Reason for this change (optional)"
                  placeholder="e.g. Fuel cost increase, quarterly rate review..."
                  {...register("reason")}
                  error={errors.reason?.message as string}
                />
              </div>
            )}

            <div className="flex justify-end mt-6">
              <Button
                isLoading={isLoading || isEditingRate}
                type="submit"
                className="px-6"
              >
                {isEdit ? "Edit" : "Save"} Rate
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
