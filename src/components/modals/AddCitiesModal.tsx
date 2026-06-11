"use client";

import { useEffect, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Controller, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { AddCitiesFormData, addCitiesSchema } from "@/lib/validation";
import { FieldError, Input, SelectInput } from "../ui/input";
import { Button } from "../ui/button";
import {
  regionOptions,
  statesForRegion,
  getRegionForState,
} from "@/lib/nigeria-states";
import { useAddCityMutation } from "@/store/slice/apiSlice";

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

  const form = useForm<AddCitiesFormData>({
    resolver: yupResolver(addCitiesSchema),
    defaultValues: { name: "", region: "", state: "" },
  });

  const reset = () =>
    form.reset({ name: "", region: "", state: "" });

  const handleOpenChange = (v: boolean) => {
    setIsOpen(v);
    if (!v) reset();
  };

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = form;

  const selectedRegion = watch("region");
  const selectedState  = watch("state");

  // When region changes → clear state if it no longer belongs to that region
  useEffect(() => {
    if (selectedState && getRegionForState(selectedState) !== selectedRegion) {
      setValue("state", "");
    }
  }, [selectedRegion]);

  // When state changes → auto-fill region if it's empty or mismatched
  const handleStateChange = (state: string) => {
    setValue("state", state);
    const region = getRegionForState(state);
    if (region) setValue("region", region);
  };

  const onSubmit = (data: AddCitiesFormData) => {
    handleAddCity(data)
      .unwrap()
      .then(() => reset());
  };

  return (
    <div className="flex items-center justify-center">
      <Dialog.Root open={isOpen} onOpenChange={handleOpenChange}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40" />
          <Dialog.Content
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-white rounded-2xl shadow-2xl w-full max-w-xl p-6 focus:outline-none"
            style={{ maxHeight: "90vh", overflowY: "auto" }}
          >
            <div className="flex items-center justify-between mb-1">
              <Dialog.Close asChild>
                <button className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600">
                  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </Dialog.Close>
              <Dialog.Title className="text-xl font-bold text-gray-900">
                Add New City
              </Dialog.Title>
              <span className="w-6" />
            </div>

            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="grid grid-cols-2 gap-3 mb-3 mt-6">
                <div className="col-span-2">
                  <Input
                    label="City Name"
                    type="text"
                    placeholder="e.g. Aba"
                    leftIcon={<LocationIcon />}
                    error={errors.name?.message}
                    {...register("name")}
                  />
                </div>

                {/* Region — selecting a region filters the state dropdown */}
                <Controller
                  control={control}
                  name="region"
                  render={({ field }) => (
                    <SelectInput
                      label="Region"
                      placeholder="Select region"
                      options={regionOptions}
                      value={field.value}
                      onValueChange={field.onChange}
                      error={errors.region?.message}
                    />
                  )}
                />

                {/* State — selecting a state auto-fills region */}
                <Controller
                  control={control}
                  name="state"
                  render={({ field }) => (
                    <SelectInput
                      label="State"
                      placeholder={
                        selectedRegion ? "Select state" : "Select state or region first"
                      }
                      options={statesForRegion(selectedRegion)}
                      value={field.value}
                      onValueChange={handleStateChange}
                      error={errors.state?.message}
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
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
