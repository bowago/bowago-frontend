"use client";

import { useEffect, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { cn } from "@/utils/cn";
import Image from "next/image";
import { Controller, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import {
  AddCitiesFormData,
  addCitiesSchema,
  CargoFormData,
  cargoSchema,
  RouteFormData,
  routeSchema,
  ServiceFormData,
  serviceSchema,
} from "@/lib/validation";
import { FieldError, Input, SelectInput } from "../ui/input";
import { Button } from "../ui/button";
import { REGION_STATES } from "@/lib/regions";
import { useAddCityMutation } from "@/store/slice/apiSlice";

// ─── Types ────────────────────────────────────────────────────────────────────

interface QuoteFormData {
  state: string;
  name: string;
  region: string;
}

// ─── Icons ────────────────────────────────────────────────────────────────────

const LocationIcon = () => (
  <svg
    viewBox="0 0 24 24"
    className="w-3.5 h-3.5 text-gray-400"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
    />
  </svg>
);

export default function AddCitiesModal({
  isOpen,
  setIsOpen,
}: {
  isOpen: boolean;
  setIsOpen: (e: boolean) => void;
}) {
  const [handleAddCity, { isLoading }] = useAddCityMutation();
  // Accumulated data across steps
  const [collectedData, setCollectedData] = useState<Partial<QuoteFormData>>(
    {},
  );

  // ── Step 2 form ──
  const addCityForm = useForm<AddCitiesFormData>({
    resolver: yupResolver(addCitiesSchema),
    defaultValues: {
      name: collectedData.name ?? "",
      region: collectedData.region ?? "",
      state: collectedData.state ?? "",
    },
  });

  const reset = () => {
    setCollectedData({});
    addCityForm.reset({
      name: "",
      region: "",
      state: "",
    });
  };

  const handleOpenChange = (v: boolean) => {
    setIsOpen(v);
    if (!v) reset();
  };

  const AddCityForm = () => {
    const {
      register,
      handleSubmit,
      control,
      watch,
      setValue,
      formState: { errors },
    } = addCityForm;

    const selectedRegion = watch("region");

    // Reset state when region changes
    useEffect(() => {
      setValue("state", "");
    }, [selectedRegion, setValue]);

    const onSubmit = (data: AddCitiesFormData) => {
      handleAddCity(data)
        .unwrap()
        .then(() => reset());
    };

    return (
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-2 gap-3 mb-3 mt-6">
          {/* Origin */}
          <div className=" col-span-2">
            <Input
              label="Name"
              type="text"
              placeholder="Enter name"
              leftIcon={<LocationIcon />}
              error={errors.name?.message}
              {...register("name")}
            />
          </div>

          {/* Destination */}

          <Controller
            control={control}
            name="region"
            render={({ field }) => (
              <SelectInput
                label="Region"
                placeholder="Select Region"
                options={Object.keys(REGION_STATES).map((region) => ({
                  label: region,
                  value: region,
                }))}
                value={field.value}
                onValueChange={field.onChange}
                error={errors.region?.message}
              />
            )}
          />
          <Controller
            control={control}
            name="state"
            render={({ field }) => (
              <SelectInput
                label="State"
                placeholder={
                  selectedRegion ? "Select state" : "Select region first"
                }
                options={selectedRegion ? REGION_STATES[selectedRegion] : []}
                value={field.value}
                onValueChange={field.onChange}
                error={errors.state?.message}
                disabled={!selectedRegion}
              />
            )}
          />
        </div>

        <div className="flex justify-end gap-2 mt-5">
          <Button
            isLoading={isLoading}
            type="submit"
            className="px-5 py-2 text-xs font-semibold bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Add City
          </Button>
        </div>
      </form>
    );
  };

  return (
    <div className="flex items-center justify-center">
      <Dialog.Root open={isOpen} onOpenChange={handleOpenChange}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 animate-[fadeIn_150ms_ease]" />
          <Dialog.Content
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-white rounded-2xl shadow-2xl w-full max-w-xl p-6 focus:outline-none"
            style={{ maxHeight: "90vh", overflowY: "auto" }}
          >
            <div className="flex items-center justify-between mb-1">
              <Dialog.Close asChild>
                <button className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600">
                  <svg
                    viewBox="0 0 24 24"
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </Dialog.Close>
              <Dialog.Title className="text-xl font-bold text-gray-900">
                Add New City
              </Dialog.Title>
              <span className="w-6" />
            </div>

            <AddCityForm />
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp { from { opacity: 0; transform: translate(-50%, -46%) } to { opacity: 1; transform: translate(-50%, -50%) } }
      `}</style>
    </div>
  );
}
