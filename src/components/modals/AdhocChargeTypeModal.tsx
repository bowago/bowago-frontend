"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { useEffect, useState } from "react";
import { Button } from "../ui/button";
import { Input, TextArea } from "../ui/input";
import {
  useCreateAdhocChargeTypeMutation,
  useUpdateAdhocChargeTypeMutation,
} from "@/store/slice/apiSlice";

const MODES = ["AIR", "LAND", "SEA"] as const;

export type AdhocChargeTypeFormValue = {
  id: string;
  name: string;
  description?: string | null;
  calcMethod: "FIXED" | "PER_KG" | "PERCENTAGE";
  amountKobo?: number | null;
  percentage?: number | null;
  vatApplicable: boolean;
  applicableModes: string[];
  isActive: boolean;
};

export default function AdhocChargeTypeModal({
  isOpen,
  setIsOpen,
  initialValue,
  isEdit,
}: {
  isOpen: boolean;
  setIsOpen: (v: boolean) => void;
  initialValue?: AdhocChargeTypeFormValue;
  isEdit?: boolean;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [calcMethod, setCalcMethod] = useState<"FIXED" | "PER_KG" | "PERCENTAGE">("FIXED");
  const [amountNaira, setAmountNaira] = useState(0);
  const [percentage, setPercentage] = useState(0);
  const [vatApplicable, setVatApplicable] = useState(true);
  const [modes, setModes] = useState<string[]>([]);
  const [isActive, setIsActive] = useState(true);

  const [create, { isLoading: creating }] = useCreateAdhocChargeTypeMutation();
  const [update, { isLoading: updating }] = useUpdateAdhocChargeTypeMutation();

  useEffect(() => {
    if (isOpen) {
      setName(initialValue?.name ?? "");
      setDescription(initialValue?.description ?? "");
      setCalcMethod(initialValue?.calcMethod ?? "FIXED");
      setAmountNaira(initialValue?.amountKobo ? initialValue.amountKobo / 100 : 0);
      setPercentage(initialValue?.percentage ?? 0);
      setVatApplicable(initialValue?.vatApplicable ?? true);
      setModes(initialValue?.applicableModes ?? []);
      setIsActive(initialValue?.isActive ?? true);
    }
  }, [isOpen, initialValue]);

  const toggleMode = (mode: string) =>
    setModes((prev) =>
      prev.includes(mode) ? prev.filter((m) => m !== mode) : [...prev, mode],
    );

  const onSubmit = async () => {
    const payload = {
      name,
      description: description || null,
      calcMethod,
      amountKobo: calcMethod === "PERCENTAGE" ? undefined : Math.round(amountNaira * 100),
      percentage: calcMethod === "PERCENTAGE" ? percentage : undefined,
      vatApplicable,
      applicableModes: modes,
      isActive,
    };
    if (isEdit && initialValue) {
      await update({ id: initialValue.id, ...payload }).unwrap();
    } else {
      await create(payload).unwrap();
    }
    setIsOpen(false);
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={setIsOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 z-40" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl w-full max-w-lg p-6 z-50 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <Dialog.Title className="text-xl font-semibold text-gray-900">
              {isEdit ? "Edit" : "Add"} Adhoc Charge Type
            </Dialog.Title>
            <Dialog.Close asChild>
              <button className="w-8 h-8 flex items-center justify-center rounded-full text-gray-500 hover:bg-gray-100">
                ✕
              </button>
            </Dialog.Close>
          </div>

          <div className="space-y-4">
            <Input
              label="Name"
              placeholder="e.g. Oversize Handling Fee"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <TextArea
              label="Description (optional)"
              placeholder="Shown to admins deciding suggestions and on the audit trail"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />

            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-2">
                Calculation Method
              </p>
              <div className="flex gap-2">
                {(["FIXED", "PER_KG", "PERCENTAGE"] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setCalcMethod(m)}
                    className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium border transition-colors ${
                      calcMethod === m
                        ? "bg-gray-900 text-white border-gray-900"
                        : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    {m === "FIXED" ? "Fixed" : m === "PER_KG" ? "Per Kg" : "Percentage"}
                  </button>
                ))}
              </div>
            </div>

            {calcMethod === "PERCENTAGE" ? (
              <Input
                label="Percentage of Base Price"
                type="number"
                min={0}
                max={100}
                value={percentage}
                onChange={(e) => setPercentage(Number(e.target.value))}
                rightElement={<span className="text-xs">%</span>}
              />
            ) : (
              <Input
                label={calcMethod === "FIXED" ? "Fixed Amount" : "Amount per Kg"}
                type="number"
                min={0}
                value={amountNaira}
                onChange={(e) => setAmountNaira(Number(e.target.value))}
                rightElement={<span className="text-xs">₦</span>}
              />
            )}

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={vatApplicable}
                onChange={(e) => setVatApplicable(e.target.checked)}
                className="w-4 h-4 accent-gray-900 cursor-pointer"
              />
              <span className="text-sm text-gray-700">
                VAT applies to this charge (included in the taxable base)
              </span>
            </label>

            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-2">
                Applies to Modes
              </p>
              <div className="flex gap-2">
                {MODES.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => toggleMode(m)}
                    className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium border transition-colors ${
                      modes.includes(m)
                        ? "bg-blue-50 text-blue-700 border-blue-200"
                        : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    {m.charAt(0) + m.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-gray-400 mt-1">
                Leave all unselected to apply to every mode.
              </p>
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4 accent-gray-900 cursor-pointer"
              />
              <span className="text-sm text-gray-700">Active</span>
            </label>
          </div>

          <div className="flex justify-end mt-6">
            <Button
              isLoading={creating || updating}
              onClick={onSubmit}
              disabled={!name || (calcMethod === "PERCENTAGE" ? percentage <= 0 : amountNaira <= 0)}
              className="px-6"
            >
              {isEdit ? "Save Changes" : "Create Charge Type"}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
