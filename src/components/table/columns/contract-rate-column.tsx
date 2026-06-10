import AddStandardRateModal from "@/components/modals/AddStandardRateModal";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog/dialog";
import { useDeleteContractRateMutation } from "@/store/slice/apiSlice";
import { ColumnDef } from "@tanstack/react-table";
import { useState } from "react";

export type ContractRate = {
  id: string;
  label: string;
  serviceType: "STANDARD" | "EXPRESS" | "ECONOMY";
  discountPercent: number | null;
  fixedPricePerKgByZone: Record<string, number> | null;
  isActive: boolean;
  validFrom: string;
  validUntil: string;
  user: {
    firstName: string;
    lastName: string;
    email: string;
  };
};

export const ContractRateColumns: ColumnDef<ContractRate>[] = [
  {
    header: "S/N",
    cell: ({ row }) => <div>{row.index + 1}</div>,
  },

  // 👤 User
  {
    header: "Customer",
    cell: ({ row }) => {
      const user = row.original.user;
      return (
        <div className="text-sm">
          <p className="font-medium">
            {user.lastName} {user.firstName}
          </p>
          <p className="text-gray-400 text-xs">{user.email}</p>
        </div>
      );
    },
  },

  // 🏷 Label
  {
    accessorKey: "label",
    header: "Label",
  },

  // 🚚 Service Type
  {
    accessorKey: "serviceType",
    header: "Service",
    cell: ({ row }) => (
      <span className="capitalize">
        {row.getValue<string>("serviceType").toLowerCase()}
      </span>
    ),
  },

  // 💰 Pricing Type
  {
    id: "pricingType",
    header: "Pricing",
    cell: ({ row }) => {
      const { discountPercent, fixedPricePerKgByZone } = row.original;

      if (discountPercent !== null) {
        return (
          <span className="text-blue-600 text-sm font-medium">
            {discountPercent}% Discount
          </span>
        );
      }

      if (fixedPricePerKgByZone) {
        return (
          <div className="text-xs">
            {Object.entries(fixedPricePerKgByZone).map(([zone, price]) => (
              <div key={zone}>
                Z{zone}: ₦{price.toLocaleString()}
              </div>
            ))}
          </div>
        );
      }

      return "—";
    },
  },

  // 📅 Validity
  {
    id: "validity",
    header: "Validity",
    cell: ({ row }) => {
      const { validFrom, validUntil } = row.original;

      return (
        <div className="text-xs">
          <div>{new Date(validFrom).toLocaleDateString()}</div>
          <div className="text-gray-400">
            → {new Date(validUntil).toLocaleDateString()}
          </div>
        </div>
      );
    },
  },

  // ✅ Status
  {
    accessorKey: "isActive",
    header: "Status",
    cell: ({ row }) => {
      const isActive = row.getValue<boolean>("isActive");

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

  // ⚡ Actions
  {
    id: "action",
    header: "Action",
    cell: ({ row }) => {
      const [isDeleteModal, setIsDeleteModal] = useState(false);
      const [handleDeleteRate, { isLoading }] = useDeleteContractRateMutation();

      const onDelete = () => {
        handleDeleteRate({ id: row.original.id });
      };

      return (
        <div className="flex gap-2">
          <button className="text-gray-400 border px-3 py-1 rounded-md text-xs">
            Edit
          </button>

          <button
            onClick={() => setIsDeleteModal(true)}
            className="text-red-400 border border-red-400 px-3 py-1 rounded-md text-xs"
          >
            Delete
          </button>

          <Dialog open={isDeleteModal} onOpenChange={setIsDeleteModal}>
            <DialogContent>
              <div className="text-center p-6">
                <h2 className="text-lg font-semibold">Delete Contract Rate</h2>
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
        </div>
      );
    },
  },
];
