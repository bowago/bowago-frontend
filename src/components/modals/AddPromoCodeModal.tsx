"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { Controller, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { useEffect } from "react";

import { Input, TextArea, RadioGroupCard, SelectInput } from "../ui/input";
import { Button } from "../ui/button";
import { Tag, Percent, Calendar, Hash, Banknote } from "lucide-react";
import {
  useAddPromoCodeMutation,
  useEditPromoCodeMutation,
} from "@/store/slice/apiSlice";
import { PromoCodeFormData, promoCodeSchema } from "@/lib/validation";
import { PromoCode } from "../table/columns/promo-code-column";

export default function AddPromoCodeModal({
  isOpen,
  setIsOpen,
  editingPromo,
}: {
  isOpen: boolean;
  setIsOpen: (v: boolean) => void;
  /** When provided, the modal edits this promo code instead of creating a new one */
  editingPromo?: PromoCode | null;
}) {
  const [handleAddPromo, { isLoading }] = useAddPromoCodeMutation();
  const [handleEditPromo, { isLoading: isEditing }] = useEditPromoCodeMutation();

  const isEdit = !!editingPromo;

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
    reset,
  } = useForm<any>({
    resolver: yupResolver(promoCodeSchema) as any,
    defaultValues: {
      code: "",
      description: "",
      discountType: "percent",
      discountPercent: "",
      flatDiscount: "",
      serviceType: "",
      minOrderAmount: "",
      maxUses: "",
      validFrom: "",
      validUntil: "",
      isActive: true,
    },
  });

  // Pre-fill the form whenever we open in edit mode for a given promo code.
  // Hoisted to top level (not a nested component) — see AddContractRateModal.tsx
  // for why a nested form component here would cause submit clicks to
  // silently fail the instant isLoading flips.
  useEffect(() => {
    if (!isOpen) return;

    const toDateInput = (d?: string | null) =>
      d ? new Date(d).toISOString().slice(0, 10) : "";

    if (editingPromo) {
      reset({
        code: editingPromo.code,
        description: editingPromo.description ?? "",
        discountType: editingPromo.flatDiscount != null ? "flat" : "percent",
        discountPercent: editingPromo.discountPercent ?? "",
        flatDiscount: editingPromo.flatDiscount ?? "",
        serviceType: editingPromo.serviceType ?? "",
        minOrderAmount: editingPromo.minOrderAmount ?? "",
        maxUses: editingPromo.maxUses ?? "",
        validFrom: toDateInput(editingPromo.validFrom),
        validUntil: toDateInput(editingPromo.validUntil),
        isActive: editingPromo.isActive,
      });
    } else {
      reset({
        code: "",
        description: "",
        discountType: "percent",
        discountPercent: "",
        flatDiscount: "",
        serviceType: "",
        minOrderAmount: "",
        maxUses: "",
        validFrom: "",
        validUntil: "",
        isActive: true,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, editingPromo]);

  const discountType = watch("discountType");

  const handleClose = () => {
    reset();
    setIsOpen(false);
  };

  const onSubmit = (data: PromoCodeFormData) => {
    const payload: any = { ...data };

    // enforce only one discount type
    if (data.discountType === "percent") {
      payload.flatDiscount = null;
    } else {
      payload.discountPercent = null;
    }
    // serviceType "" means "all services" — send null, not empty string
    payload.serviceType = data.serviceType || null;

    if (isEdit && editingPromo) {
      handleEditPromo({ id: editingPromo.id, ...payload })
        .unwrap()
        .then(handleClose)
        .catch(() => {});
    } else {
      handleAddPromo(payload)
        .unwrap()
        .then(handleClose)
        .catch(() => {});
    }
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={handleClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40" />

        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl w-full max-w-2xl z-50 shadow-xl flex flex-col max-h-[90vh]">
          {/* Fixed header */}
          <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100 shrink-0">
            <Dialog.Title className="text-xl font-semibold">
              {isEdit ? "Edit" : "Create"} Promo Code
            </Dialog.Title>

            <Dialog.Close asChild>
              <button className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100">
                ✕
              </button>
            </Dialog.Close>
          </div>

          {/* Scrollable body */}
          <div className="overflow-y-auto flex-1 px-6 py-5">
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="grid grid-cols-2 gap-4">
                {/* CODE */}
                <div className="col-span-2">
                  <Input
                    label="Promo Code"
                    placeholder="LAUNCH20"
                    disabled={isEdit}
                    leftIcon={<Hash size={14} />}
                    {...register("code")}
                    error={errors.code?.message as string}
                    onChange={(e) => {
                      e.target.value = e.target.value.toUpperCase().replace(/\s+/g, "");
                    }}
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    What customers type at checkout — case-insensitive on the backend.
                  </p>
                </div>

                {/* DESCRIPTION */}
                <div className="col-span-2">
                  <TextArea
                    label="Description (optional, internal notes)"
                    placeholder="Launch week promotion — 20% off all shipments"
                    {...register("description")}
                    error={errors.description?.message as string}
                  />
                </div>

                {/* SERVICE TYPE */}
                <div className="col-span-2">
                  <Controller
                    control={control}
                    name="serviceType"
                    render={({ field }) => (
                      <SelectInput
                        label="Service Type"
                        placeholder="All Services"
                        options={[
                          { label: "All Services", value: "" },
                          { label: "Express", value: "EXPRESS" },
                          { label: "Standard", value: "STANDARD" },
                          { label: "Economy", value: "ECONOMY" },
                        ]}
                        value={field.value ?? ""}
                        onValueChange={field.onChange}
                        error={errors.serviceType?.message as string}
                      />
                    )}
                  />
                </div>

                {/* DISCOUNT TYPE */}
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
                          if (val === "percent") {
                            setValue("flatDiscount", "");
                          } else {
                            setValue("discountPercent", "");
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

                {/* CONDITIONAL DISCOUNT INPUTS */}
                {discountType === "percent" && (
                  <Input
                    label="Discount (%)"
                    type="number"
                    min={0}
                    max={100}
                    leftIcon={<Percent size={14} />}
                    {...register("discountPercent")}
                    error={errors.discountPercent?.message as string}
                  />
                )}

                {discountType === "flat" && (
                  <Input
                    label="Flat Discount (₦)"
                    type="number"
                    min={0}
                    leftIcon={<Banknote size={14} />}
                    {...register("flatDiscount")}
                    error={errors.flatDiscount?.message as string}
                  />
                )}

                {/* MIN ORDER AMOUNT */}
                <div>
                  <Input
                    label="Minimum Order (₦)"
                    type="number"
                    min={0}
                    placeholder="No minimum"
                    {...register("minOrderAmount")}
                    error={errors.minOrderAmount?.message as string}
                  />
                  <p className="text-xs text-gray-400 mt-1">Leave blank — applies to any order value.</p>
                </div>

                {/* MAX USES */}
                <div>
                  <Input
                    label="Max Uses (total, across all customers)"
                    type="number"
                    min={0}
                    placeholder="Unlimited"
                    {...register("maxUses")}
                    error={errors.maxUses?.message as string}
                  />
                  <p className="text-xs text-gray-400 mt-1">Leave blank — unlimited uses.</p>
                </div>

                {/* DATES */}
                <div>
                  <Input
                    label="Valid From (optional)"
                    type="date"
                    leftIcon={<Calendar size={14} />}
                    {...register("validFrom")}
                    error={errors.validFrom?.message as string}
                  />
                  <p className="text-xs text-gray-400 mt-1">Leave blank — active from today.</p>
                </div>

                <div>
                  <Input
                    label="Valid Until (optional)"
                    type="date"
                    leftIcon={<Calendar size={14} />}
                    {...register("validUntil")}
                    error={errors.validUntil?.message as string}
                  />
                  <p className="text-xs text-gray-400 mt-1">Leave blank — never expires.</p>
                </div>

                {/* ACTIVE STATUS — shown in edit mode */}
                {isEdit && (
                  <div className="col-span-2">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        {...register("isActive")}
                        className="w-4 h-4 accent-gray-900 cursor-pointer"
                      />
                      <span className="text-sm text-gray-700">Active</span>
                      <span className="text-xs text-gray-400">(uncheck to deactivate this promo code)</span>
                    </label>
                  </div>
                )}
              </div>

              {/* ACTION */}
              <div className="flex justify-end mt-6">
                <Button isLoading={isLoading || isEditing} type="submit">
                  {isEdit ? "Update" : "Create"} Promo Code
                </Button>
              </div>
            </form>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
