"use client";

/**
 * RequestAddressChangeForm — Sprint 5
 *
 * PRD: "Critical Fix: Address Change Approval Workflow"
 * POST /api/v1/shipments/{shipmentId}/request-address-change (mapped here to
 * POST /address-changes with shipmentId in the body — matches the backend's
 * actual addressChange.routes.js / addressChange.controller.js).
 *
 * The backend for this workflow (request, admin review, approve/reject,
 * notifications) was fully implemented already. There was simply no UI
 * anywhere in the frontend to call it — this form + the modal that wraps it
 * is that missing piece.
 */

import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { Button } from "../ui/button";
import { Input, TextArea } from "../ui/input";
import { useRequestAddressChangeMutation } from "@/store/slice/apiSlice";

const addressChangeSchema = yup.object({
  newRecipientAddress: yup
    .string()
    .trim()
    .min(5, "Please enter a complete street address")
    .required("New address is required"),
  newRecipientCity: yup.string().trim().required("City is required"),
  newRecipientState: yup.string().trim().required("State is required"),
  reason: yup.string().trim().optional().default(""),
});

type AddressChangeFormValues = yup.InferType<typeof addressChangeSchema>;

type RequestAddressChangeFormProps = {
  shipmentId: string;
  currentAddress?: string;
  onSuccess?: () => void;
};

export const RequestAddressChangeForm = ({
  shipmentId,
  currentAddress,
  onSuccess,
}: RequestAddressChangeFormProps) => {
  const [requestAddressChange, { isLoading }] =
    useRequestAddressChangeMutation();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AddressChangeFormValues>({
    resolver: yupResolver(addressChangeSchema),
    defaultValues: {
      newRecipientAddress: "",
      newRecipientCity: "",
      newRecipientState: "",
      reason: "",
    },
  });

  const onSubmit = async (data: AddressChangeFormValues) => {
    try {
      await requestAddressChange({ shipmentId, ...data }).unwrap();
      reset();
      onSuccess?.();
    } catch {
      // error toast already shown by the mutation
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {currentAddress && (
        <p className="text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 mt-4 mb-1">
          Current delivery address:{" "}
          <span className="font-medium text-gray-700">{currentAddress}</span>
        </p>
      )}

      <div className="grid grid-cols-2 gap-3 mb-3 mt-3">
        <div className="col-span-2">
          <Input
            label="New Delivery Address"
            placeholder="12 New Layout Road"
            error={errors.newRecipientAddress?.message}
            {...register("newRecipientAddress")}
          />
        </div>

        <Input
          label="City"
          placeholder="Aba"
          error={errors.newRecipientCity?.message}
          {...register("newRecipientCity")}
        />

        <Input
          label="State"
          placeholder="Abia"
          error={errors.newRecipientState?.message}
          {...register("newRecipientState")}
        />

        <div className="col-span-2">
          <TextArea
            label="Reason (optional)"
            placeholder="Recipient moved to a new address"
            error={errors.reason?.message}
            {...register("reason")}
          />
        </div>
      </div>

      <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-1">
        ⚠ Your shipment will pause for admin review until this change is
        approved. If approving the change moves your delivery to a new pricing
        zone, you may be asked to acknowledge a price adjustment before dispatch
        continues.
      </p>

      <div className="flex justify-end gap-2 mt-4">
        <Button isLoading={isLoading} type="submit" className="px-5 py-2">
          Submit Request
        </Button>
      </div>
    </form>
  );
};
