"use client";

import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useMemo } from "react";
import { Button } from "../ui/button";
import { Input, TextArea, SelectInput } from "../ui/input";
import {
  useRequestAddressChangeMutation,
  useGetCitiesQuery,
} from "@/store/slice/apiSlice";

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
  const { data: citiesData } = useGetCitiesQuery({});
  const cities = useMemo(
    () => (citiesData?.data?.cities ?? []) as { name: string; state: string }[],
    [citiesData?.data?.cities],
  );
  const cityOptions = useMemo(
    () => cities.map((c) => ({ label: c.name, value: c.name })),
    [cities],
  );

  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
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

        <Controller
          name="newRecipientCity"
          control={control}
          render={({ field }) => (
            <SelectInput
              label="City"
              options={cityOptions}
              value={field.value}
              onValueChange={(val) => {
                field.onChange(val);
                // State is derived from the chosen city, same as the
                // sender/receiver city pattern in CreateShipmentModal —
                // avoids letting someone type a city/state pair that
                // doesn't actually exist in the pricing zone tables.
                const match = cities.find((c) => c.name === val);
                if (match) setValue("newRecipientState", match.state);
              }}
              error={errors.newRecipientCity?.message}
            />
          )}
        />

        <Input
          label="State"
          placeholder="Auto-filled from City"
          disabled
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
