"use client";

/**
 * CreateClaimForm — Gap 2 fixed
 *
 * BEFORE (broken): converted files to base64 data URLs and sent JSON.
 * multer on the backend only processes multipart/form-data — it ignores JSON bodies,
 * so req.files was always undefined and evidence images were silently dropped.
 *
 * AFTER (fixed): stores raw File objects, builds a FormData on submit,
 * and sends multipart/form-data so multer receives the binary parts and
 * uploads them to Cloudinary as intended.
 *
 * Gap 1 also fixed: added LOSS and OTHER claim types to the dropdown.
 */

import { Controller, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { useRef, useState, type ChangeEvent } from "react";
import { Button } from "../ui/button";
import { Input, SelectInput, TextArea } from "../ui/input";
import { CreateClaimFormData, createClaimSchema } from "@/lib/validation";
import { useCreateClaimMutation } from "@/store/slice/apiSlice";

// Gap 1: added LOSS and OTHER per PRD Sprint 7
const claimTypeOptions = [
  { label: "Damage",  value: "DAMAGE" },
  { label: "Loss",    value: "LOSS"   },
  { label: "Other",   value: "OTHER"  },
];

type CreateClaimFormProps = {
  onSuccess?: () => void;
};

const MAX_IMAGE_COUNT = 5;
const MAX_IMAGE_SIZE  = 20 * 1024 * 1024; // 20 MB

export const CreateClaimForm = ({ onSuccess }: CreateClaimFormProps) => {
  const [createClaim, { isLoading }] = useCreateClaimMutation();

  // Gap 2: store raw File objects, not base64 strings
  const [files, setFiles]         = useState<File[]>([]);
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
      shipmentId:    "",
      type:          "DAMAGE",
      description:   "",
      declaredValue: 0,
      claimAmount:   0,
      bankName:      "",
      accountNumber: "",
      accountName:   "",
      images:        [],
    },
  });

  const onSubmit = async (data: CreateClaimFormData) => {
    // Gap 2: build FormData so multer receives binary file parts
    const formData = new FormData();
    formData.append("shipmentId",    data.shipmentId);
    formData.append("type",          data.type);
    formData.append("description",   data.description);
    formData.append("declaredValue", String(Number(data.declaredValue)));
    formData.append("claimAmount",   String(Number(data.claimAmount)));
    formData.append("bankName",      data.bankName    ?? "");
    formData.append("accountNumber", data.accountNumber ?? "");
    formData.append("accountName",   data.accountName  ?? "");

    // Append each file under the field name "images" (matches multer .array('images', 5))
    files.forEach((file) => formData.append("images", file));

    await createClaim(formData as any).unwrap();

    reset();
    setFiles([]);
    setImageError("");
    if (imageInputRef.current) imageInputRef.current.value = "";
    onSuccess?.();
  };

  const handleImagesChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(event.target.files ?? []);

    if (selected.length > MAX_IMAGE_COUNT) {
      setImageError(`You can upload up to ${MAX_IMAGE_COUNT} images`);
      setFiles([]);
      if (imageInputRef.current) imageInputRef.current.value = "";
      return;
    }

    const oversized = selected.find((f) => f.size > MAX_IMAGE_SIZE);
    if (oversized) {
      setImageError("Each image must be 20 MB or less");
      setFiles([]);
      if (imageInputRef.current) imageInputRef.current.value = "";
      return;
    }

    setFiles(selected);
    setImageError("");
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const removeAllFiles = () => {
    setFiles([]);
    setImageError("");
    if (imageInputRef.current) imageInputRef.current.value = "";
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
                label="Claim Type"
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
            label="Declared Value (₦)"
            type="number"
            placeholder="250000"
            error={errors.declaredValue?.message}
            {...register("declaredValue", { valueAsNumber: true })}
          />
        </div>

        <div>
          <Input
            label="Claim Amount (₦)"
            type="number"
            placeholder="200000"
            error={errors.claimAmount?.message}
            {...register("claimAmount", { valueAsNumber: true })}
          />
        </div>

        <div className="col-span-2">
          <TextArea
            label="Description"
            placeholder="Describe the damage, loss, or issue in detail"
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

        {/* Evidence images — raw File objects sent as multipart */}
        <div className="col-span-2">
          <div className="flex flex-col gap-1.5 w-full">
            <label className="text-sm font-medium text-black">
              Evidence Photos
            </label>
            <input
              ref={imageInputRef}
              type="file"
              accept="image/jpeg,image/png,image/jpg"
              multiple
              onChange={handleImagesChange}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 file:mr-3 file:rounded-md file:border-0 file:bg-gray-100 file:px-3 file:py-1 file:text-sm file:text-gray-700"
            />
            <p className="text-xs text-gray-500">
              Upload up to 5 photos (JPEG / PNG, max 20 MB each). At least 1 photo is required for damage claims.
            </p>

            {files.length > 0 && (
              <div className="space-y-2 rounded-lg border border-gray-100 bg-gray-50 p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-medium text-gray-600">
                    {files.length} file{files.length > 1 ? "s" : ""} selected
                  </p>
                  <button
                    type="button"
                    onClick={removeAllFiles}
                    className="text-xs font-medium text-red-600 hover:text-red-700"
                  >
                    Remove all
                  </button>
                </div>
                <div className="space-y-1.5">
                  {files.map((file, index) => (
                    <div
                      key={`${file.name}-${index}`}
                      className="flex items-center justify-between gap-3 rounded-md bg-white px-3 py-2 text-xs text-gray-600"
                    >
                      <span className="truncate">{file.name}</span>
                      <span className="shrink-0 text-gray-400">
                        {(file.size / 1024 / 1024).toFixed(1)} MB
                      </span>
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
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
