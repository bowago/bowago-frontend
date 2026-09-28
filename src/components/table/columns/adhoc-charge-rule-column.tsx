import { ColumnDef } from "@tanstack/react-table";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog/dialog";
import { useDeactivateAdhocChargeRuleMutation } from "@/store/slice/apiSlice";
import AdhocChargeRuleModal from "@/components/modals/AdhocChargeRuleModal";

export type AdhocChargeRule = {
  id: string;
  name: string;
  metric: string;
  operator: string;
  thresholdMin: number;
  thresholdMax?: number | null;
  chargeTypeId: string;
  chargeType?: { id: string; name: string };
  behaviour: "AUTO_APPLY" | "SUGGEST";
  applicableModes: string[];
  priority: number;
  isActive: boolean;
};

function describeThreshold(rule: AdhocChargeRule) {
  const OP_LABEL: Record<string, string> = { GT: ">", GTE: "≥", LT: "<", LTE: "≤" };
  if (rule.operator === "BETWEEN") return `${rule.thresholdMin} – ${rule.thresholdMax}`;
  return `${OP_LABEL[rule.operator] ?? rule.operator} ${rule.thresholdMin}`;
}

export const AdhocChargeRuleColumns: ColumnDef<AdhocChargeRule>[] = [
  { id: "sn", header: "S/N", cell: ({ row }) => <div>{row.index + 1}</div> },
  {
    accessorKey: "name",
    header: "Rule",
    cell: ({ row }) => <div className="font-medium text-gray-900">{row.getValue("name")}</div>,
  },
  {
    id: "condition",
    header: "Condition",
    cell: ({ row }) => (
      <div className="text-xs text-gray-600">
        {row.original.metric.replace(/_/g, " ").toLowerCase()} {describeThreshold(row.original)}
      </div>
    ),
  },
  {
    id: "chargeType",
    header: "Charges",
    cell: ({ row }) => <div className="text-sm">{row.original.chargeType?.name ?? "—"}</div>,
  },
  {
    accessorKey: "behaviour",
    header: "Behaviour",
    cell: ({ row }) => {
      const behaviour = row.getValue("behaviour");
      return (
        <span
          className={`px-2 py-1 text-xs rounded-full font-medium ${
            behaviour === "AUTO_APPLY"
              ? "bg-green-100 text-green-600"
              : "bg-amber-100 text-amber-600"
          }`}
        >
          {behaviour === "AUTO_APPLY" ? "Auto-apply" : "Suggest"}
        </span>
      );
    },
  },
  {
    accessorKey: "applicableModes",
    header: "Modes",
    cell: ({ row }) => {
      const modes = row.getValue("applicableModes") as string[];
      return <div className="text-xs text-gray-600">{modes?.length ? modes.join(", ") : "All"}</div>;
    },
  },
  {
    accessorKey: "isActive",
    header: "Status",
    cell: ({ row }) => {
      const isActive = row.getValue("isActive");
      return (
        <span
          className={`px-2 py-1 text-xs rounded-full ${
            isActive ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-500"
          }`}
        >
          {isActive ? "Active" : "Inactive"}
        </span>
      );
    },
  },
  {
    id: "action",
    header: "Action",
    cell: ({ row }) => {
      const [isEditModal, setIsEditModal] = useState(false);
      const [isDeactivateModal, setIsDeactivateModal] = useState(false);
      const [deactivate, { isLoading }] = useDeactivateAdhocChargeRuleMutation();

      return (
        <div className="flex gap-2">
          <button
            onClick={() => setIsEditModal(true)}
            className="text-gray-400 border border-gray-400 px-3 py-1 rounded-md text-xs"
          >
            Edit
          </button>
          {row.original.isActive && (
            <button
              onClick={() => setIsDeactivateModal(true)}
              className="text-red-400 border border-red-400 px-3 py-1 rounded-md text-xs"
            >
              Deactivate
            </button>
          )}

          <Dialog open={isDeactivateModal} onOpenChange={setIsDeactivateModal}>
            <DialogContent>
              <div className="text-center p-6">
                <h2 className="text-xl font-semibold">Deactivate Rule</h2>
                <p className="text-gray-500 mt-2">
                  This rule will stop matching new quotes and weigh-ins. It
                  stays in the audit trail.
                </p>
                <Button
                  onClick={() =>
                    deactivate({ id: row.original.id }).then(() => setIsDeactivateModal(false))
                  }
                  isLoading={isLoading}
                  className="mt-4 w-full"
                >
                  Deactivate
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <AdhocChargeRuleModal
            isEdit
            isOpen={isEditModal}
            setIsOpen={setIsEditModal}
            initialValue={row.original as any}
          />
        </div>
      );
    },
  },
];
