"use client";

import { useEffect, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { cn } from "@/utils/cn";
import Image from "next/image";
import { Controller, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { deleteShipmentSchema } from "@/lib/validation";
import { Input, TextArea } from "../ui/input";
import { Button } from "../ui/button";
import {
  useAddBoxDimensionMutation,
  useCancelShipmentMutation,
} from "@/store/slice/apiSlice";

// ─── Types ────────────────────────────────────────────────────────────────────

// ─── Icons ────────────────────────────────────────────────────────────────────

export default function CancelShipmentModal({
  isOpen,
  setIsOpen,
  id,
}: {
  isOpen: boolean;
  setIsOpen: (e: boolean) => void;
  id: string;
}) {
  const [handleCancelShipment, { isLoading }] = useCancelShipmentMutation();
  // Accumulated data across steps

  // ── Step 2 form ──
  const deleteShipmentForm = useForm<{ reason: string }>({
    resolver: yupResolver(deleteShipmentSchema),
    defaultValues: {
      reason: "",
    },
  });

  const reset = () => {
    deleteShipmentForm.reset({});
    setIsOpen(false);
  };

  const handleOpenChange = (v: boolean) => {
    setIsOpen(v);
    if (!v) reset();
  };

  const DeleteForm = () => {
    const {
      register,
      handleSubmit,
      formState: { errors },
    } = deleteShipmentForm;

    const onSubmit = (data: { reason: string }) => {
      // normalize categoryId
      handleCancelShipment({ id: id, reason: data.reason })
        .unwrap()
        .then(() => reset());
      // TODO: replace with actual mutation
    };

    return (
      <form className="mt-10" onSubmit={handleSubmit(onSubmit)}>
        <TextArea
          label="Reason for cancelling"
          {...register("reason")}
          error={errors.reason?.message}
        />

        <div className="flex justify-end mt-5">
          <Button
            isLoading={isLoading}
            type="submit"
            className="px-5 py-2 text-xs"
          >
            Cancel
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
                Cancel Shipment
              </Dialog.Title>
              <span className="w-6" />
            </div>

            <DeleteForm />
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
