"use client";

import { Controller, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { useRef, useState, type ChangeEvent } from "react";
import { Button } from "../ui/button";
import { Input, SelectInput, TextArea } from "../ui/input";
import { CreateClaimFormData, createClaimSchema } from "@/lib/validation";
import { useCreateClaimMutation } from "@/store/slice/apiSlice";

const claimTypeOptions = [
  { label: "Damage", value: "DAMAGE" },
];

type CreateClaimFormProps = {
  onSuccess?: () => void;
};

const MAX_IMAGE_COUNT = 5;
const MAX_IMAGE_SIZE = 20 * 1024 * 1024;

const readFileAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

export const CreateClaimForm = ({ onSuccess }: CreateClaimFormProps) => {
  const [createClaim, { isLoading }] = useCreateClaimMutation();
  const [images, setImages] = useState<string[]>([]);
  const [imageNames, setImageNames] = useState<string[]>([]);
  const [imageError, setImageError] = useState("");
  const imageInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<CreateClaimFormData>({
    resolver: yupResolver(createClaimSchema),
    defaultValues: {
      shipmentId: "",
      type: "DAMAGE",
      description: "",
      declaredValue: 0,
      claimAmount: 0,
      bankName: "",
      accountNumber: "",
      accountName: "",
      images: [],
    },
  });

  const onSubmit = async (data: CreateClaimFormData) => {
    await createClaim({
      ...data,
      declaredValue: Number(data.declaredValue),
      claimAmount: Number(data.claimAmount),
      bankName: data.bankName ?? "",
      accountNumber: data.accountNumber ?? "",
      accountName: data.accountName ?? "",
      images,
    }).unwrap();
    reset();
    setImages([]);
    setImageNames([]);
    setImageError("");
    if (imageInputRef.current) {
      imageInputRef.current.value = "";
    }
    onSuccess?.();
  };

  const clearImageInput = () => {
    if (imageInputRef.current) {
      imageInputRef.current.value = "";
    }
  };

  const handleImagesChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);

    if (files.length > MAX_IMAGE_COUNT) {
      setImageError("You can upload up to 5 images");
      setImages([]);
      setImageNames([]);
      clearImageInput();
      return;
    }

    const oversizedFile = files.find((file) => file.size > MAX_IMAGE_SIZE);

    if (oversizedFile) {
      setImageError("Each image must be 20MB or less");
      setImages([]);
      setImageNames([]);
      clearImageInput();
      return;
    }

    const imageStrings = await Promise.all(files.map(readFileAsDataUrl));

    setImages(imageStrings);
    setImageNames(files.map((file) => file.name));
    setImageError("");
  };

  const removeImage = (index: number) => {
    setImages((currentImages) =>
      currentImages.filter((_, imageIndex) => imageIndex !== index),
    );
    setImageNames((currentNames) =>
      currentNames.filter((_, imageIndex) => imageIndex !== index),
    );
    setImageError("");
    clearImageInput();
  };

  const removeAllImages = () => {
    setImages([]);
    setImageNames([]);
    setImageError("");
    clearImageInput();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="grid grid-cols-2 gap-3 mb-3 mt-6">
        <div className="col-span-2">
          <Input
            label="Shipment ID"
            placeholder="3fa85f64-5717-4562-b3fc-2c963f66afa6"
            error={errors.shipmentId?.message}
            {...register("shipmentId")}
          />
        </div>

        <div className="col-span-2">
          <Controller
            control={control}
            name="type"
            render={({ field }) => (
              <SelectInput
                label="Type"
                placeholder="Select claim type"
                options={claimTypeOptions}
                value={field.value}
                onValueChange={field.onChange}
                error={errors.type?.message}
              />
            )}
          />
        </div>

        <div>
          <Input
            label="Declared Value"
            type="number"
            placeholder="250000"
            error={errors.declaredValue?.message}
            {...register("declaredValue", { valueAsNumber: true })}
          />
        </div>

        <div>
          <Input
            label="Claim Amount"
            type="number"
            placeholder="200000"
            error={errors.claimAmount?.message}
            {...register("claimAmount", { valueAsNumber: true })}
          />
        </div>

        <div className="col-span-2">
          <TextArea
            label="Description"
            placeholder="Electronics found cracked upon delivery"
            error={errors.description?.message}
            {...register("description")}
          />
        </div>

        <Input
          label="Bank Name"
          placeholder="GTBank"
          error={errors.bankName?.message}
          {...register("bankName")}
        />

        <Input
          label="Account Number"
          placeholder="0123456789"
          error={errors.accountNumber?.message}
          {...register("accountNumber")}
        />

        <div className="col-span-2">
          <Input
            label="Account Name"
            placeholder="Chidi Okafor"
            error={errors.accountName?.message}
            {...register("accountName")}
          />
        </div>

        <div className="col-span-2">
          <div className="flex flex-col gap-1.5 w-full">
            <label className="text-sm font-medium text-black">Images</label>
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleImagesChange}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 file:mr-3 file:rounded-md file:border-0 file:bg-gray-100 file:px-3 file:py-1 file:text-sm file:text-gray-700"
            />
            <p className="text-xs text-gray-500">
              Upload up to 5 photos. Each file must be 20MB or less.
            </p>
            {imageNames.length > 0 && (
              <div className="space-y-2 rounded-lg border border-gray-100 bg-gray-50 p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-medium text-gray-600">
                    Selected images
                  </p>
                  <button
                    type="button"
                    onClick={removeAllImages}
                    className="text-xs font-medium text-red-600 hover:text-red-700"
                  >
                    Remove all
                  </button>
                </div>
                <div className="space-y-1.5">
                  {imageNames.map((name, index) => (
                    <div
                      key={`${name}-${index}`}
                      className="flex items-center justify-between gap-3 rounded-md bg-white px-3 py-2 text-xs text-gray-600"
                    >
                      <span className="truncate">{name}</span>
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="shrink-0 font-medium text-red-600 hover:text-red-700"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {(imageError || errors.images?.message) && (
              <p className="text-xs text-red-500 font-medium">
                {imageError || errors.images?.message}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2 mt-5">
        <Button isLoading={isLoading} type="submit" className="px-5 py-2">
          Submit Claim
        </Button>
      </div>
    </form>
  );
};
