import { ColumnDef } from "@tanstack/react-table";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog/dialog";
import { useDeactivateAdhocChargeTypeMutation } from "@/store/slice/apiSlice";
import AdhocChargeTypeModal from "@/components/modals/AdhocChargeTypeModal";
import { History } from "lucide-react";

export type AdhocChargeType = {
  id: string;
  name: string;
  description?: string | null;
  calcMethod: "FIXED" | "PER_KG" | "PERCENTAGE";
  amountKobo?: number | null;
  percentage?: number | null;
  vatApplicable: boolean;
  applicableModes: string[];
  isActive: boolean;
  version: number;
};

export const AdhocChargeTypeColumns: ColumnDef<AdhocChargeType>[] = [
  { id: "sn", header: "S/N", cell: ({ row }) => <div>{row.index + 1}</div> },
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => (
      <div>
        <div className="font-medium text-gray-900">{row.getValue("name")}</div>
        {row.original.description && (
          <div className="text-xs text-gray-400 max-w-[220px] truncate">
            {row.original.description}
          </div>
        )}
      </div>
    ),
  },
  {
    id: "amount",
    header: "Amount",
    cell: ({ row }) => {
      const { calcMethod, amountKobo, percentage } = row.original;
      if (calcMethod === "PERCENTAGE") return <div>{percentage}%</div>;
      const naira = amountKobo ? (amountKobo / 100).toLocaleString() : "0";
      return <div>₦{naira}{calcMethod === "PER_KG" ? " / kg" : ""}</div>;
    },
  },
  {
    accessorKey: "vatApplicable",
    header: "VAT",
    cell: ({ row }) => (
      <span className={`text-xs ${row.getValue("vatApplicable") ? "text-green-600" : "text-gray-400"}`}>
        {row.getValue("vatApplicable") ? "Taxable" : "Not taxed"}
      </span>
    ),
  },
  {
    accessorKey: "applicableModes",
    header: "Modes",
    cell: ({ row }) => {
      const modes = row.getValue("applicableModes") as string[];
      return (
        <div className="text-xs text-gray-600">
          {modes && modes.length > 0 ? modes.join(", ") : "All modes"}
        </div>
      );
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
      const router = useRouter();
      const [isEditModal, setIsEditModal] = useState(false);
      const [isDeactivateModal, setIsDeactivateModal] = useState(false);
      const [deactivate, { isLoading }] = useDeactivateAdhocChargeTypeMutation();

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
          <button
            onClick={() => router.push(`/dashboard/adhoc-charges/${row.original.id}/history`)}
            className="text-gray-400 hover:text-gray-700 p-1"
            title="Version history"
          >
            <History size={16} />
          </button>

          <Dialog open={isDeactivateModal} onOpenChange={setIsDeactivateModal}>
            <DialogContent>
              <div className="text-center p-6">
                <h2 className="text-xl font-semibold">Deactivate Charge Type</h2>
                <p className="text-gray-500 mt-2">
                  This won&apos;t be deleted — it stays in the audit trail and can
                  be reactivated later. It just stops applying to new quotes.
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

          <AdhocChargeTypeModal
            isEdit
            isOpen={isEditModal}
            setIsOpen={setIsEditModal}
            initialValue={row.original}
          />
        </div>
      );
    },
  },
];
