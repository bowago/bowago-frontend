"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { useEffect, useState } from "react";
import { Button } from "../ui/button";
import { Input, SelectInput } from "../ui/input";
import {
  useCreateAdhocChargeRuleMutation,
  useUpdateAdhocChargeRuleMutation,
  useGetAdhocChargeTypesQuery,
} from "@/store/slice/apiSlice";

const METRICS = [
  { label: "Actual Weight (kg)", value: "ACTUAL_WEIGHT" },
  { label: "Volumetric Weight (kg)", value: "VOLUMETRIC_WEIGHT" },
  { label: "Billable Weight (kg)", value: "BILLABLE_WEIGHT" },
  { label: "Volume (cm³)", value: "VOLUME_CM3" },
  { label: "Longest Side (cm)", value: "LONGEST_SIDE" },
];
const OPERATORS = [
  { label: "Greater than (>)", value: "GT" },
  { label: "Greater than or equal (≥)", value: "GTE" },
  { label: "Less than (<)", value: "LT" },
  { label: "Less than or equal (≤)", value: "LTE" },
  { label: "Between", value: "BETWEEN" },
];
const MODES = ["AIR", "LAND", "SEA"] as const;

export type AdhocChargeRuleFormValue = {
  id: string;
  name: string;
  metric: string;
  operator: string;
  thresholdMin: number;
  thresholdMax?: number | null;
  chargeTypeId: string;
  behaviour: "AUTO_APPLY" | "SUGGEST";
  applicableModes: string[];
  priority: number;
  isActive: boolean;
};

export default function AdhocChargeRuleModal({
  isOpen,
  setIsOpen,
  initialValue,
  isEdit,
}: {
  isOpen: boolean;
  setIsOpen: (v: boolean) => void;
  initialValue?: AdhocChargeRuleFormValue;
  isEdit?: boolean;
}) {
  const { data: chargeTypesData } = useGetAdhocChargeTypesQuery({ isActive: true });
  const chargeTypes = (chargeTypesData as any)?.data?.chargeTypes ?? [];

  const [name, setName] = useState("");
  const [metric, setMetric] = useState("BILLABLE_WEIGHT");
  const [operator, setOperator] = useState("GT");
  const [thresholdMin, setThresholdMin] = useState(0);
  const [thresholdMax, setThresholdMax] = useState(0);
  const [chargeTypeId, setChargeTypeId] = useState("");
  const [behaviour, setBehaviour] = useState<"AUTO_APPLY" | "SUGGEST">("SUGGEST");
  const [modes, setModes] = useState<string[]>([]);
  const [priority, setPriority] = useState(0);
  const [isActive, setIsActive] = useState(true);

  const [create, { isLoading: creating }] = useCreateAdhocChargeRuleMutation();
  const [update, { isLoading: updating }] = useUpdateAdhocChargeRuleMutation();

  useEffect(() => {
    if (isOpen) {
      setName(initialValue?.name ?? "");
      setMetric(initialValue?.metric ?? "BILLABLE_WEIGHT");
      setOperator(initialValue?.operator ?? "GT");
      setThresholdMin(initialValue?.thresholdMin ?? 0);
      setThresholdMax(initialValue?.thresholdMax ?? 0);
      setChargeTypeId(initialValue?.chargeTypeId ?? "");
      setBehaviour(initialValue?.behaviour ?? "SUGGEST");
      setModes(initialValue?.applicableModes ?? []);
      setPriority(initialValue?.priority ?? 0);
      setIsActive(initialValue?.isActive ?? true);
    }
  }, [isOpen, initialValue]);

  const toggleMode = (mode: string) =>
    setModes((prev) => (prev.includes(mode) ? prev.filter((m) => m !== mode) : [...prev, mode]));

  const onSubmit = async () => {
    const payload = {
      name,
      metric,
      operator,
      thresholdMin,
      thresholdMax: operator === "BETWEEN" ? thresholdMax : undefined,
      chargeTypeId,
      behaviour,
      applicableModes: modes,
      priority,
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
              {isEdit ? "Edit" : "Add"} Suggestion Rule
            </Dialog.Title>
            <Dialog.Close asChild>
              <button className="w-8 h-8 flex items-center justify-center rounded-full text-gray-500 hover:bg-gray-100">
                ✕
              </button>
            </Dialog.Close>
          </div>

          <div className="space-y-4">
            <Input
              label="Rule Name"
              placeholder="e.g. Overweight parcel surcharge"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />

            <SelectInput
              label="Charge Type"
              placeholder="Select a charge type to apply"
              options={chargeTypes.map((c: any) => ({ label: c.name, value: c.id }))}
              value={chargeTypeId}
              onValueChange={setChargeTypeId}
            />

            <div className="grid grid-cols-2 gap-3">
              <SelectInput
                label="Metric"
                options={METRICS}
                value={metric}
                onValueChange={setMetric}
              />
              <SelectInput
                label="Operator"
                options={OPERATORS}
                value={operator}
                onValueChange={setOperator}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Input
                label={operator === "BETWEEN" ? "From" : "Threshold"}
                type="number"
                value={thresholdMin}
                onChange={(e) => setThresholdMin(Number(e.target.value))}
              />
              {operator === "BETWEEN" && (
                <Input
                  label="To"
                  type="number"
                  value={thresholdMax}
                  onChange={(e) => setThresholdMax(Number(e.target.value))}
                />
              )}
            </div>

            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-2">
                Behaviour
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setBehaviour("AUTO_APPLY")}
                  className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium border transition-colors text-left ${
                    behaviour === "AUTO_APPLY"
                      ? "bg-green-50 text-green-700 border-green-300"
                      : "bg-white text-gray-500 border-gray-200"
                  }`}
                >
                  <div className="font-semibold">Auto-apply</div>
                  <div className="text-[10px] opacity-80">
                    Added automatically, shown on the quote
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setBehaviour("SUGGEST")}
                  className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium border transition-colors text-left ${
                    behaviour === "SUGGEST"
                      ? "bg-amber-50 text-amber-700 border-amber-300"
                      : "bg-white text-gray-500 border-gray-200"
                  }`}
                >
                  <div className="font-semibold">Suggest</div>
                  <div className="text-[10px] opacity-80">
                    Goes to the admin queue for a decision
                  </div>
                </button>
              </div>
            </div>

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

            <Input
              label="Priority (higher runs first when several rules match)"
              type="number"
              value={priority}
              onChange={(e) => setPriority(Number(e.target.value))}
            />

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
              disabled={!name || !chargeTypeId}
              className="px-6"
            >
              {isEdit ? "Save Changes" : "Create Rule"}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
