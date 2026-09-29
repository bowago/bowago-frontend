"use client";

import { useEffect, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Controller, useForm } from "react-hook-form";
import { Input, SelectInput, RadioGroupCard } from "../ui/input";
import { Button } from "../ui/button";
import {
  useCreateOfferingMutation,
  useUpdateOfferingMutation,
} from "@/store/slice/apiSlice";
import type { ServiceOffering, ShipmentMode, ServiceType } from "@/store/slice/types";
import { errorToast } from "@/lib/toast/toast";

type FormValues = {
  shipmentMode: ShipmentMode;
  serviceType: ServiceType;
  displayName: string;
  description: string;
  allowsNoSla: boolean;
  minWeightKg: string;
  maxWeightKg: string;
  maxLongestSideCm: string;
  minChargeNaira: string;
  notes: string;
};

const EMPTY: FormValues = {
  shipmentMode: "LAND",
  serviceType: "STANDARD",
  displayName: "",
  description: "",
  allowsNoSla: false,
  minWeightKg: "",
  maxWeightKg: "",
  maxLongestSideCm: "",
  minChargeNaira: "",
  notes: "",
};

export default function AddOfferingModal({
  isOpen,
  setIsOpen,
  editingOffering,
}: {
  isOpen: boolean;
  setIsOpen: (v: boolean) => void;
  /** When provided, the modal edits this offering instead of defining a new one */
  editingOffering?: ServiceOffering | null;
}) {
  const isEdit = !!editingOffering;
  const [createOffering, { isLoading: isCreating }] = useCreateOfferingMutation();
  const [updateOffering, { isLoading: isUpdating }] = useUpdateOfferingMutation();
  const isLoading = isCreating || isUpdating;

  const { control, register, handleSubmit, reset } = useForm<FormValues>({ defaultValues: EMPTY });

  useEffect(() => {
    if (!isOpen) return;
    if (editingOffering) {
      reset({
        shipmentMode: editingOffering.shipmentMode,
        serviceType: editingOffering.serviceType,
        displayName: editingOffering.displayName ?? "",
        description: editingOffering.description ?? "",
        allowsNoSla: editingOffering.allowsNoSla,
        minWeightKg: editingOffering.minWeightKg?.toString() ?? "",
        maxWeightKg: editingOffering.maxWeightKg?.toString() ?? "",
        maxLongestSideCm: editingOffering.maxLongestSideCm?.toString() ?? "",
        minChargeNaira: editingOffering.minChargeNaira?.toString() ?? "",
        notes: editingOffering.notes ?? "",
      });
    } else {
      reset(EMPTY);
    }
  }, [isOpen, editingOffering, reset]);

  const handleClose = (v: boolean) => {
    setIsOpen(v);
    if (!v) reset(EMPTY);
  };

  const onSubmit = (data: FormValues) => {
    const num = (v: string) => (v.trim() === "" ? undefined : Number(v));
    const payload = {
      displayName: data.displayName || undefined,
      description: data.description || undefined,
      allowsNoSla: data.allowsNoSla,
      minWeightKg: num(data.minWeightKg) ?? null,
      maxWeightKg: num(data.maxWeightKg) ?? null,
      maxLongestSideCm: num(data.maxLongestSideCm) ?? null,
      minChargeNaira: num(data.minChargeNaira) ?? null,
      notes: data.notes || undefined,
    };

    if (isEdit && editingOffering) {
      updateOffering({ id: editingOffering.id, ...payload })
        .unwrap()
        .then(() => handleClose(false))
        .catch(() => {
          // error toast already shown by the mutation's onQueryStarted
        });
      return;
    }

    createOffering({ shipmentMode: data.shipmentMode, serviceType: data.serviceType, ...payload })
      .unwrap()
      .then(() => handleClose(false))
      .catch((e) => {
        errorToast(e?.data?.message ?? "Could not create this offering");
      });
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={handleClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl w-full max-w-lg z-50 shadow-xl flex flex-col max-h-[90vh]">
          <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100 shrink-0">
            <Dialog.Title className="text-lg font-semibold">
              {isEdit ? "Edit Offering" : "Define New Offering"}
            </Dialog.Title>
            <Dialog.Close asChild>
              <button className="text-gray-400 hover:text-gray-600">✕</button>
            </Dialog.Close>
          </div>

          <div className="overflow-y-auto flex-1 px-6 py-5">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {!isEdit && (
                <>
                  <p className="text-xs text-gray-500 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
                    💡 A new offering is created <strong>inactive</strong>. Add
                    rates and a delivery SLA for at least one zone, then
                    activate it from the list.
                  </p>
                  <Controller
                    name="shipmentMode"
                    control={control}
                    render={({ field }) => (
                      <RadioGroupCard
                        label="Shipment Mode"
                        className="flex flex-row"
                        value={field.value}
                        onValueChange={field.onChange}
                        options={[
                          { label: "Air", description: "Fastest, higher cost", value: "AIR" },
                          { label: "Land", description: "Balanced speed & cost", value: "LAND" },
                          { label: "Sea", description: "Slowest, lowest cost", value: "SEA" },
                        ]}
                      />
                    )}
                  />
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
                          { label: "Express", description: "Fastest option", value: "EXPRESS" },
                          { label: "Standard", description: "Balanced speed & cost", value: "STANDARD" },
                          { label: "Economy", description: "Most economical", value: "ECONOMY" },
                        ]}
                      />
                    )}
                  />
                </>
              )}

              <Input label="Display Name (optional)" placeholder="e.g. Air Express" {...register("displayName")} />

              <div className="grid grid-cols-2 gap-3">
                <Input label="Min Weight (kg, optional)" type="number" {...register("minWeightKg")} />
                <Input label="Max Weight (kg, optional)" type="number" {...register("maxWeightKg")} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input label="Max Longest Side (cm, optional)" type="number" {...register("maxLongestSideCm")} />
                <Input label="Minimum Charge (₦, optional)" type="number" {...register("minChargeNaira")} />
              </div>

              <Controller
                name="allowsNoSla"
                control={control}
                render={({ field }) => (
                  <label className="flex items-start gap-2 text-sm text-gray-700 bg-gray-50 border border-gray-100 rounded-lg px-3 py-2.5">
                    <input
                      type="checkbox"
                      checked={field.value}
                      onChange={(e) => field.onChange(e.target.checked)}
                      className="mt-0.5"
                    />
                    <span>
                      Allow selling this offering in a zone with{" "}
                      <strong>no delivery SLA configured</strong> (rare — only
                      for products with a genuinely open-ended delivery
                      window).
                    </span>
                  </label>
                )}
              />

              <div>
                <label className="block text-xs text-gray-500 mb-1">Internal Notes (optional)</label>
                <textarea
                  {...register("notes")}
                  rows={2}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button type="button" variant="secondary" onClick={() => handleClose(false)} className="flex-1">
                  Cancel
                </Button>
                <Button type="submit" isLoading={isLoading} className="flex-1">
                  {isEdit ? "Save Changes" : "Create Offering"}
                </Button>
              </div>
            </form>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
