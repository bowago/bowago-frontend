"use client";

import { Controller, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { Button } from "../ui/button";
import { Input, SelectInput, TextArea } from "../ui/input";
import { CreateFAQFormData, createFAQSchema } from "@/lib/validation";
import { useCreateFAQMutation } from "@/store/slice/apiSlice";

const faqCategoryOptions = [
  { label: "Pricing", value: "PRICING" },
  { label: "Shipping Rules", value: "SHIPPING_RULES" },
  { label: "Tracking", value: "TRACKING" },
  { label: "Payments", value: "PAYMENTS" },
  { label: "Account", value: "ACCOUNT" },
  { label: "Packaging", value: "PACKAGING" },
  { label: "Claims", value: "CLAIMS" },
];

type CreateFAQFormProps = {
  onSuccess?: () => void;
};

export const CreateFAQForm = ({ onSuccess }: CreateFAQFormProps) => {
  const [createFAQ, { isLoading }] = useCreateFAQMutation();

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<CreateFAQFormData>({
    resolver: yupResolver(createFAQSchema),
    defaultValues: {
      question: "",
      answer: "",
      category: "PRICING",
      sortOrder: 0,
    },
  });

  const onSubmit = async (data: CreateFAQFormData) => {
    await createFAQ({
      ...data,
      sortOrder: Number(data.sortOrder),
    }).unwrap();
    reset();
    onSuccess?.();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="grid grid-cols-2 gap-3 mb-3 mt-6">
        <div className="col-span-2">
          <Input
            label="Question"
            placeholder="How is my shipping cost calculated?"
            error={errors.question?.message}
            {...register("question")}
          />
        </div>

        <div className="col-span-2">
          <TextArea
            label="Answer"
            placeholder="Your shipping cost is determined by the zone between origin and destination cities, and the weight of your package..."
            error={errors.answer?.message}
            {...register("answer")}
          />
        </div>

        <Controller
          control={control}
          name="category"
          render={({ field }) => (
            <SelectInput
              label="Category"
              placeholder="Select category"
              options={faqCategoryOptions}
              value={field.value}
              onValueChange={field.onChange}
              error={errors.category?.message}
            />
          )}
        />

        <Input
          label="Sort Order"
          type="number"
          min={0}
          placeholder="0"
          error={errors.sortOrder?.message}
          {...register("sortOrder", { valueAsNumber: true })}
        />
      </div>

      <div className="flex justify-end gap-2 mt-5">
        <Button isLoading={isLoading} type="submit" className="px-5 py-2">
          Create FAQ
        </Button>
      </div>
    </form>
  );
};
