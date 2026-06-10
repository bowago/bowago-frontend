import AddStandardRateModal from "@/components/modals/AddStandardRateModal";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog/dialog";
import {
  useDeleteBoxMutation,
  useDeleteStandardRateMutation,
} from "@/store/slice/apiSlice";
import { ColumnDef } from "@tanstack/react-table";
import { useState } from "react";

export type Rate = {
  id: string;
  zone: number;
  serviceType: "STANDARD" | "CONTRACT" | "PROMO";
  minKg: number;
  maxKg: number;
  minTons: number;
  maxTons: number;
  minCartons: number;
  maxCartons: number;
  pricePerKg: number;
  basePrice: number;
  isActive: boolean;
};

export const RateColumns: ColumnDef<Rate>[] = [
  {
    accessorKey: "",
    header: "S/N",
    cell: ({ row }) => <div>{row.index + 1}</div>,
  },

  {
    accessorKey: "zone",
    header: "Zone",
    cell: ({ row }) => <div>Zone {row.getValue("zone")}</div>,
  },

  {
    accessorKey: "serviceType",
    header: "Service",
    cell: ({ row }) => (
      <div className="capitalize">
        {String(row.getValue("serviceType")).toLowerCase()}
      </div>
    ),
  },

  // ✅ KG Range
  {
    id: "kgRange",
    header: "Kg Range",
    cell: ({ row }) => {
      const { minKg, maxKg } = row.original;
      return (
        <div>
          {minKg} - {maxKg || "—"} kg
        </div>
      );
    },
  },

  // ✅ Tons Range
  {
    id: "tonsRange",
    header: "Tons",
    cell: ({ row }) => {
      const { minTons, maxTons } = row.original;
      return (
        <div>
          {minTons} - {maxTons || "—"} t
        </div>
      );
    },
  },

  // ✅ Cartons Range
  {
    id: "cartonRange",
    header: "Cartons",
    cell: ({ row }) => {
      const { minCartons, maxCartons } = row.original;
      return (
        <div>
          {minCartons} - {maxCartons || "—"}
        </div>
      );
    },
  },

  {
    accessorKey: "pricePerKg",
    header: "Price/Kg",
    cell: ({ row }) => <div>₦{row.getValue("pricePerKg")}</div>,
  },

  {
    accessorKey: "basePrice",
    header: "Base Price",
    cell: ({ row }) => (
      <div>₦{row.getValue("basePrice")?.toLocaleString()}</div>
    ),
  },

  // ✅ Status Badge
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

      const [handleDeleteRate, { isLoading }] = useDeleteStandardRateMutation();

      const onDelete = () => {
        handleDeleteRate({ id: row.original.id });
      };

      return (
        <div className=" flex gap-2">
          <button
            onClick={() => setIsEditModal(true)}
            className=" text-gray-400 border border-gray-400 px-4 py-1 rounded-md text-xm"
          >
            Edit
          </button>
          <button
            onClick={() => setIsDeleteModal(true)}
            className=" text-red-400 border border-red-400 px-4 py-1 rounded-md text-xm"
          >
            Delete
          </button>

          <Dialog open={isDeleteModal} onOpenChange={setIsDeleteModal}>
            <DialogContent>
              <div className="text-center p-6">
                <h2 className="text-xl font-semibold">Delete Rate</h2>
                <p className="text-gray-500 mt-2">
                  Are you sure you want to delete this rate?
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

          <AddStandardRateModal
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
