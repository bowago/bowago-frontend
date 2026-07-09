"use client";

import { useEffect, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { cn } from "@/utils/cn";
import Image from "next/image";
import { Controller, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import {
  AddBoxDimensionFormData,
  addBoxDimensionSchema,
} from "@/lib/validation";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { useAddBoxDimensionMutation } from "@/store/slice/apiSlice";

// ─── Types ────────────────────────────────────────────────────────────────────

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

export default function AddBoxDimensionModal({
  isOpen,
  setIsOpen,
}: {
  isOpen: boolean;
  setIsOpen: (e: boolean) => void;
}) {
  const [handleAddBoxDimension, { isLoading }] = useAddBoxDimensionMutation();
  // Accumulated data across steps
  const [collectedData, setCollectedData] = useState<
    Partial<AddBoxDimensionFormData>
  >({});

  // ── Step 2 form ──
  const addBoxDimensionForm = useForm<AddBoxDimensionFormData>({
    resolver: yupResolver(addBoxDimensionSchema),
    defaultValues: {
      categoryId: "",
      displayName: "",
      lengthCm: 0,
      widthCm: 0,
      heightCm: 0,
      bestFor: "",
      weightKgLimit: 0,
    },
  });

  const reset = () => {
    setCollectedData({});
    addBoxDimensionForm.reset({});
  };

  const handleOpenChange = (v: boolean) => {
    setIsOpen(v);
    if (!v) reset();
  };

  // Hoisted to top level — see AddContractRateModal.tsx for why a nested
  // `const AddBoxForm = () => {...}` here causes the form to unmount/remount
  // (and the submit to appear to silently fail) the instant isLoading flips.
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = addBoxDimensionForm;

  const onSubmit = (data: AddBoxDimensionFormData) => {
    data.categoryId = data.categoryId.toUpperCase().replace(/\s+/g, "");
    handleAddBoxDimension(data)
      .unwrap()
      .then(() => reset())
      .catch(() => {});
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
                Add New Box Dimension
              </Dialog.Title>
              <span className="w-6" />
            </div>

            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="grid grid-cols-2 gap-3 mt-6">
                {/* Category ID */}
                <div className="col-span-2">
                  <Input
                    label="Category ID"
                    placeholder="e.g. XXL-11"
                    {...register("categoryId")}
                    error={errors.categoryId?.message}
                    onChange={(e) => {
                      e.target.value = e.target.value
                        .toUpperCase()
                        .replace(/\s+/g, "");
                    }}
                  />
                </div>

                {/* Display Name */}
                <div className="col-span-2">
                  <Input
                    label="Display Name"
                    placeholder="Extra Extra Large Box"
                    {...register("displayName")}
                    error={errors.displayName?.message}
                  />
                </div>

                {/* Dimensions */}
                <Input
                  label="Length"
                  type="number"
                  min={0}
                  {...register("lengthCm", { valueAsNumber: true })}
                  error={errors.lengthCm?.message}
                  rightElement={<span className="text-xs text-gray-400">cm</span>}
                />

                <Input
                  label="Width"
                  type="number"
                  min={0}
                  {...register("widthCm", { valueAsNumber: true })}
                  error={errors.widthCm?.message}
                  rightElement={<span className="text-xs text-gray-400">cm</span>}
                />

                <Input
                  label="Height"
                  type="number"
                  min={0}
                  {...register("heightCm", { valueAsNumber: true })}
                  error={errors.heightCm?.message}
                  rightElement={<span className="text-xs text-gray-400">cm</span>}
                />

                {/* Weight */}
                <Input
                  label="Weight Limit"
                  type="number"
                  min={0}
                  {...register("weightKgLimit", { valueAsNumber: true })}
                  error={errors.weightKgLimit?.message}
                  rightElement={<span className="text-xs text-gray-400">kg</span>}
                />

                {/* Best For */}
                <div className="col-span-2">
                  <Input
                    label="Best For"
                    placeholder="e.g. Large Appliances"
                    {...register("bestFor")}
                    error={errors.bestFor?.message}
                  />
                </div>
              </div>

              <div className="flex justify-end mt-5">
                <Button
                  isLoading={isLoading}
                  type="submit"
                  className="px-5 py-2 text-xs"
                >
                  Add Box
                </Button>
              </div>
            </form>
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
