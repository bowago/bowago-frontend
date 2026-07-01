"use client";

import { useState, useRef } from "react";
import { ImagePlus, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCreatePriceAdjustmentMutation } from "@/store/slice/apiSlice";

type Props = {
  shipmentId: string;
  trackingNumber: string;
  originalPrice: number;
  onClose: () => void;
};

const CLOUDINARY_CLOUD = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? "";
const CLOUDINARY_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET ?? "bowago_unsigned";

const uploadToCloudinary = async (file: File): Promise<string> => {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("upload_preset", CLOUDINARY_PRESET);
  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/image/upload`, {
    method: "POST",
    body: fd,
  });
  if (!res.ok) throw new Error("Cloudinary upload failed");
  const data = await res.json();
  return data.secure_url as string;
};

export default function CreatePriceAdjustmentForm({ shipmentId, trackingNumber, originalPrice, onClose }: Props) {
  const [adjustedPrice, setAdjustedPrice] = useState<string>("");
  const [actualWeightKg, setActualWeightKg] = useState<string>("");
  const [reason, setReason] = useState<string>("");
  const [images, setImages] = useState<{ file: File; preview: string; url?: string }[]>([]);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const [createAdjustment, { isLoading }] = useCreatePriceAdjustmentMutation();

  const formatNaira = (n: number) =>
    `₦${n.toLocaleString("en-NG", { minimumFractionDigits: 0 })}`;

  const difference = parseFloat(adjustedPrice || "0") - originalPrice;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (images.length + files.length > 5) {
      alert("Maximum 5 proof images allowed");
      return;
    }
    const newEntries = files.map((f) => ({
      file: f,
      preview: URL.createObjectURL(f),
    }));
    setImages((prev) => [...prev, ...newEntries]);
    if (inputRef.current) inputRef.current.value = "";
  };

  const removeImage = (idx: number) => {
    setImages((prev) => {
      URL.revokeObjectURL(prev[idx].preview);
      return prev.filter((_, i) => i !== idx);
    });
  };

  const handleSubmit = async () => {
    const adjPrice = parseFloat(adjustedPrice);
    if (!adjPrice || adjPrice <= originalPrice) {
      alert("Adjusted price must be higher than the original quoted price.");
      return;
    }
    if (!reason.trim()) {
      alert("Please provide a reason for the adjustment.");
      return;
    }

    setUploading(true);
    let proofImageUrls: string[] = [];
    try {
      if (images.length > 0) {
        proofImageUrls = await Promise.all(images.map((img) => uploadToCloudinary(img.file)));
      }
    } catch {
      alert("Image upload failed. Please try again.");
      setUploading(false);
      return;
    }
    setUploading(false);

    try {
      await createAdjustment({
        shipmentId,
        adjustedPrice: adjPrice,
        reason: reason.trim(),
        actualWeightKg: actualWeightKg ? parseFloat(actualWeightKg) : undefined,
        proofImageUrls: proofImageUrls.length > 0 ? proofImageUrls : undefined,
      }).unwrap();
      onClose();
    } catch {}
  };

  return (
    <div className="p-6">
      <h2 className="text-lg font-semibold mb-1">Create Price Adjustment</h2>
      <p className="text-sm text-gray-500 mb-5">
        Shipment <span className="font-mono font-medium">{trackingNumber}</span> ·
        Original quote: <strong>{formatNaira(originalPrice)}</strong>
      </p>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              Actual Weight (kg)
            </label>
            <input
              type="number"
              value={actualWeightKg}
              onChange={(e) => setActualWeightKg(e.target.value)}
              placeholder="e.g. 15"
              min={0}
              step={0.5}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              Revised Price (₦) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={adjustedPrice}
              onChange={(e) => setAdjustedPrice(e.target.value)}
              placeholder="e.g. 6000"
              min={0}
              step={100}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
            />
          </div>
        </div>

        {difference > 0 && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg px-4 py-3 text-sm">
            Customer will be billed an additional{" "}
            <strong className="text-orange-700">+{formatNaira(difference)}</strong>
          </div>
        )}

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1.5">
            Reason <span className="text-red-500">*</span>
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Quoted 10kg, actual weight 15kg on hub scale"
            rows={3}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none"
          />
        </div>

        {/* Proof images */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1.5">
            Proof Photos — scale reading (max 5)
          </label>
          <div className="flex flex-wrap gap-2">
            {images.map((img, i) => (
              <div key={i} className="relative w-20 h-20 rounded-lg border border-gray-200 overflow-hidden">
                <img src={img.preview} alt="proof" className="w-full h-full object-cover" />
                <button
                  onClick={() => removeImage(i)}
                  className="absolute top-0.5 right-0.5 bg-red-500 text-white rounded-full p-0.5"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
            {images.length < 5 && (
              <button
                onClick={() => inputRef.current?.click()}
                className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center gap-1 text-gray-400 hover:border-brand hover:text-brand transition-colors"
              >
                <ImagePlus className="w-5 h-5" />
                <span className="text-xs">Add</span>
              </button>
            )}
          </div>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png"
            multiple
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
      </div>

      <div className="flex gap-3 justify-end mt-6 pt-4 border-t">
        <button
          onClick={onClose}
          className="px-4 py-2 text-sm rounded-lg border border-gray-200 hover:bg-gray-50"
        >
          Cancel
        </button>
        <Button
          onClick={handleSubmit}
          isLoading={isLoading || uploading}
          disabled={!adjustedPrice || difference <= 0 || !reason.trim()}
        >
          {uploading ? "Uploading photos…" : "Create Adjustment"}
        </Button>
      </div>
    </div>
  );
}
