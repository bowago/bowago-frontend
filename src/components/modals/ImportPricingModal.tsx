"use client";

import { useRef, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X, Upload, FileSpreadsheet, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { useImportPricingSheetMutation } from "@/store/slice/apiSlice";

// ─── Types ────────────────────────────────────────────────────────────────────

type ImportResult = {
  cities: number;
  zones: number;
  km: number;
  priceBands: number;
  dimensions: number;
  errors: string[];
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function ImportPricingModal({
  trigger,
  onSuccess,
}: {
  trigger: React.ReactNode;
  onSuccess?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [importSheet, { isLoading }] = useImportPricingSheetMutation();

  const reset = () => {
    setSelectedFile(null);
    setResult(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setResult(null);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.name.endsWith(".xlsx")) {
      setSelectedFile(file);
      setResult(null);
    }
  };

  const handleSubmit = async () => {
    if (!selectedFile) return;
    const fd = new FormData();
    fd.append("file", selectedFile);

    try {
      const res = await importSheet(fd).unwrap();
      setResult(res?.data?.results ?? res?.results ?? null);
      onSuccess?.();
    } catch {
      // toast shown by apiSlice onQueryStarted
    }
  };

  const handleClose = () => {
    setOpen(false);
    reset();
  };

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>{trigger}</Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50" />
        <Dialog.Content className="fixed z-50 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[95vw] max-w-lg bg-white rounded-2xl shadow-xl border border-gray-200 p-0 outline-none">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-brand/10 flex items-center justify-center">
                <FileSpreadsheet className="w-4 h-4 text-brand" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">
                  Import Pricing Sheet
                </p>
                <p className="text-xs text-gray-400">
                  Upload the BowaGO Rating Excel file (.xlsx)
                </p>
              </div>
            </div>
            <Dialog.Close
              onClick={handleClose}
              className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4 text-gray-500" />
            </Dialog.Close>
          </div>

          {/* Body */}
          <div className="px-6 py-5 space-y-5">
            {/* What gets imported */}
            <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-xs text-blue-700 space-y-1">
              <p className="font-semibold">This import updates:</p>
              <ul className="list-disc list-inside space-y-0.5">
                <li>Cities (from Zone Matrix sheet)</li>
                <li>Zone Matrix — city-to-city zone numbers</li>
                <li>KM Matrix — distances between cities</li>
                <li>Price Bands — zone weight pricing (all service types)</li>
                <li>Box Dimensions — standard box sizes</li>
              </ul>
              <p className="text-blue-500 mt-1">
                All records are upserted — existing data is updated, not duplicated.
              </p>
            </div>

            {/* Drop zone */}
            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => fileInputRef.current?.click()}
              className={[
                "border-2 border-dashed rounded-xl px-6 py-8 flex flex-col items-center gap-3 cursor-pointer transition-colors",
                selectedFile
                  ? "border-brand bg-red-50"
                  : "border-gray-200 hover:border-brand hover:bg-red-50/30",
              ].join(" ")}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx"
                className="hidden"
                onChange={handleFileChange}
              />
              {selectedFile ? (
                <>
                  <FileSpreadsheet className="w-8 h-8 text-brand" />
                  <div className="text-center">
                    <p className="text-sm font-semibold text-gray-800">
                      {selectedFile.name}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {(selectedFile.size / 1024).toFixed(1)} KB · Click to
                      change
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <Upload className="w-8 h-8 text-gray-300" />
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-600">
                      Click to upload or drag & drop
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      .xlsx only — BowaGO Rating format
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* Import results */}
            {result && (
              <div className="rounded-xl border border-gray-100 overflow-hidden">
                <div className="bg-green-50 border-b border-green-100 px-4 py-2.5 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <p className="text-sm font-semibold text-green-700">
                    Import complete
                  </p>
                </div>
                <div className="px-4 py-3 grid grid-cols-3 gap-3 text-center">
                  {[
                    { label: "Cities", value: result.cities },
                    { label: "Zone pairs", value: result.zones },
                    { label: "KM pairs", value: result.km },
                    { label: "Price bands", value: result.priceBands },
                    { label: "Box sizes", value: result.dimensions },
                  ].map((s) => (
                    <div key={s.label} className="bg-gray-50 rounded-lg py-2">
                      <p className="text-lg font-bold text-gray-900">
                        {s.value}
                      </p>
                      <p className="text-xs text-gray-400">{s.label}</p>
                    </div>
                  ))}
                </div>
                {result.errors.length > 0 && (
                  <div className="px-4 pb-3">
                    <div className="flex items-center gap-1.5 text-amber-600 text-xs font-semibold mb-1.5">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {result.errors.length} warning(s)
                    </div>
                    <div className="max-h-28 overflow-y-auto space-y-1">
                      {result.errors.slice(0, 20).map((err, i) => (
                        <p
                          key={i}
                          className="text-[11px] text-amber-700 bg-amber-50 px-2 py-1 rounded"
                        >
                          {err}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors"
            >
              {result ? "Close" : "Cancel"}
            </button>
            {!result && (
              <button
                onClick={handleSubmit}
                disabled={!selectedFile || isLoading}
                className="flex items-center gap-2 px-5 py-2 bg-brand text-white text-sm font-semibold rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Importing…
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Import Sheet
                  </>
                )}
              </button>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
