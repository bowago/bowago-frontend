"use client";

import { Controller, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { Button } from "../ui/button";
import { Input, SelectInput, TextArea } from "../ui/input";
import { CreateTicketFormData, createTicketSchema } from "@/lib/validation";
import { useCreateTicketMutation } from "@/store/slice/apiSlice";

const categoryOptions = [
  { label: "Tracking", value: "TRACKING" },
  { label: "Payment", value: "PAYMENT" },
  { label: "Pricing Dispute", value: "PRICING_DISPUTE" },
  { label: "Damaged Goods", value: "DAMAGED_GOODS" },
  { label: "Delivery Issue", value: "DELIVERY_ISSUE" },
  { label: "Account", value: "ACCOUNT" },
  { label: "Other", value: "OTHER" },
];

const priorityOptions = [
  { label: "Low", value: "LOW" },
  { label: "Normal", value: "NORMAL" },
  { label: "High", value: "HIGH" },
  { label: "Urgent", value: "URGENT" },
];

type AddTicketFormProps = {
  onSuccess?: () => void;
};

export const AddTicketForm = ({ onSuccess }: AddTicketFormProps) => {
  const [createTicket, { isLoading }] = useCreateTicketMutation();

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<CreateTicketFormData>({
    resolver: yupResolver(createTicketSchema),
    defaultValues: {
      subject: "",
      category: "OTHER",
      shipmentId: "",
      body: "",
      priority: "NORMAL",
    },
  });

  const onSubmit = async (data: CreateTicketFormData) => {
    await createTicket(data).unwrap();
    reset();
    onSuccess?.();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="grid grid-cols-2 gap-3 mb-3 mt-6">
        <div className="col-span-2">
          <Input
            label="Subject"
            placeholder="Package not received after 7 days"
            error={errors.subject?.message}
            {...register("subject")}
          />
        </div>

        <Controller
          control={control}
          name="category"
          render={({ field }) => (
            <SelectInput
              label="Category"
              placeholder="Select category"
              options={categoryOptions}
              value={field.value}
              onValueChange={field.onChange}
              error={errors.category?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="priority"
          render={({ field }) => (
            <SelectInput
              label="Priority"
              placeholder="Select priority"
              options={priorityOptions}
              value={field.value}
              onValueChange={field.onChange}
              error={errors.priority?.message}
            />
          )}
        />

        <div className="col-span-2">
          <Input
            label="Shipment ID"
            placeholder="3fa85f64-5717-4562-b3fc-2c963f66afa6"
            error={errors.shipmentId?.message}
            {...register("shipmentId")}
          />
        </div>

        <div className="col-span-2">
          <TextArea
            label="Body"
            placeholder="My tracking shows delivered but I never received the package."
            error={errors.body?.message}
            {...register("body")}
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 mt-5">
        <Button isLoading={isLoading} type="submit" className="px-5 py-2">
          Submit Ticket
        </Button>
      </div>
    </form>
  );
};
