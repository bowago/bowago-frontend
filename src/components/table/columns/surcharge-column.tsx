import { ColumnDef } from "@tanstack/react-table";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog/dialog";
import { useDeleteSurchargeMutation } from "@/store/slice/apiSlice";
import AddSurchargeModal from "@/components/modals/AddSurchargeModal";

export type Surcharge = {
  id: string;
  type: "FUEL" | "REMOTE_AREA" | "VAT" | "FRAGILE" | "INSURANCE" | "OVERSIZE";
  label: string;
  description?: string;
  ratePercent?: number;
  flatAmount?: number;
  appliesTo: "ALL" | "ZONE" | "SERVICE";
  isActive: boolean;
};

export const SurchargeColumns: ColumnDef<Surcharge>[] = [
  {
    id: "sn",
    header: "S/N",
    cell: ({ row }) => <div>{row.index + 1}</div>,
  },

  {
    accessorKey: "type",
    header: "Type",
    cell: ({ row }) => (
      <div className="capitalize">
        {String(row.getValue("type")).toLowerCase().replace("_", " ")}
      </div>
    ),
  },

  {
    accessorKey: "label",
    header: "Label",
    cell: ({ row }) => <div>{row.getValue("label")}</div>,
  },

  {
    accessorKey: "description",
    header: "Description",
    cell: ({ row }) => (
      <div className="text-xs text-gray-500 max-w-[200px] truncate">
        {row.getValue("description") || "—"}
      </div>
    ),
  },

  // ✅ Pricing (Smart logic)
  {
    id: "pricing",
    header: "Pricing",
    cell: ({ row }) => {
      const { ratePercent, flatAmount } = row.original;

      if (ratePercent && ratePercent > 0) {
        return <div>{ratePercent}%</div>;
      }

      if (flatAmount && flatAmount > 0) {
        return <div>₦{flatAmount.toLocaleString()}</div>;
      }

      return <div>—</div>;
    },
  },

  {
    accessorKey: "appliesTo",
    header: "Applies To",
    cell: ({ row }) => (
      <div className="capitalize">
        {String(row.getValue("appliesTo")).toLowerCase()}
      </div>
    ),
  },

  // ✅ Status
  {
    accessorKey: "isActive",
    header: "Status",
    cell: ({ row }) => {
      const isActive = row.getValue("isActive");

      return (
        <span
          className={`px-2 py-1 text-xs rounded-full ${
            isActive
              ? "bg-green-100 text-green-600"
              : "bg-gray-100 text-gray-500"
          }`}
        >
          {isActive ? "Active" : "Inactive"}
        </span>
      );
    },
  },

  // ✅ Actions
  {
    id: "action",
    header: "Action",
    cell: ({ row }) => {
      const [isEditModal, setIsEditModal] = useState(false);
      const [isDeleteModal, setIsDeleteModal] = useState(false);

      const [handleDelete, { isLoading }] = useDeleteSurchargeMutation();

      const onDelete = () => {
        handleDelete({ id: row.original.id });
      };

      return (
        <div className="flex gap-2">
          <button
            onClick={() => setIsEditModal(true)}
            className="text-gray-400 border border-gray-400 px-4 py-1 rounded-md text-xs"
          >
            Edit
          </button>

          <button
            onClick={() => setIsDeleteModal(true)}
            className="text-red-400 border border-red-400 px-4 py-1 rounded-md text-xs"
          >
            Delete
          </button>

          {/* Delete Modal */}
          <Dialog open={isDeleteModal} onOpenChange={setIsDeleteModal}>
            <DialogContent>
              <div className="text-center p-6">
                <h2 className="text-xl font-semibold">Delete Surcharge</h2>
                <p className="text-gray-500 mt-2">
                  Are you sure you want to delete this surcharge?
                </p>

                <Button
                  onClick={onDelete}
                  isLoading={isLoading}
                  className="mt-4 w-full"
                >
                  Proceed
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Edit Modal */}
          <AddSurchargeModal
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
