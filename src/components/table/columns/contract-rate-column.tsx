import AddContractRateModal from "@/components/modals/AddContractRateModal";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog/dialog";
import { useDeleteContractRateMutation } from "@/store/slice/apiSlice";
import type { ContractRate as CanonicalContractRate } from "@/store/slice/types";
import { ColumnDef } from "@tanstack/react-table";
import { useState } from "react";

// A contract rate here also carries the customer it belongs to. shipmentMode
// and serviceType are both nullable (null = applies to all modes / all
// services) — never coerce a null into a fake default.
export type ContractRate = CanonicalContractRate & {
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
};

const MODE_LABEL: Record<string, string> = { AIR: "Air", LAND: "Land", SEA: "Sea" };

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
    cell: ({ row }) => row.original.label ?? "—",
  },

  // ✈️🚚🚢 Scope — mode and service together, since a contract's scope is
  // BOTH dimensions; null in either means "all" for that dimension.
  {
    id: "scope",
    header: "Scope",
    cell: ({ row }) => {
      const { shipmentMode, serviceType } = row.original;
      return (
        <div className="text-xs">
          <div className="font-medium capitalize">
            {shipmentMode ? MODE_LABEL[shipmentMode] : "All modes"}
          </div>
          <div className="text-gray-400 capitalize">
            {serviceType ? serviceType.toLowerCase() : "All services"}
          </div>
        </div>
      );
    },
  },

  // 💰 Pricing Type
  {
    id: "pricingType",
    header: "Pricing",
    cell: ({ row }) => {
      const { discountPercent, fixedPricePerKgByZone } = row.original;

      if (discountPercent !== null && discountPercent !== undefined) {
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

      // new Date(null) coerces to the Unix epoch (1/1/1970) instead of an
      // invalid/empty date, so a genuinely open-ended contract (no start or
      // end date set) was rendering as if it had already expired in 1970.
      const formatDate = (value: string | null | undefined) =>
        value ? new Date(value).toLocaleDateString() : "—";

      return (
        <div className="text-xs">
          <div>{formatDate(validFrom)}</div>
          <div className="text-gray-400">
            → {validUntil ? formatDate(validUntil) : "No expiry"}
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
      const [isEditModal, setIsEditModal] = useState(false);
      const [handleDeleteRate, { isLoading }] = useDeleteContractRateMutation();

      const onDelete = async () => {
        try {
          await handleDeleteRate({ id: row.original.id }).unwrap();
          setIsDeleteModal(false);
        } catch {
          // error toast already shown by the mutation
        }
      };

      return (
        <div className="flex gap-2">
          <button
            onClick={() => setIsEditModal(true)}
            className="text-gray-600 border px-3 py-1 rounded-md text-xs hover:bg-gray-50"
          >
            Edit
          </button>

          <button
            onClick={() => setIsDeleteModal(true)}
            className="text-red-400 border border-red-400 px-3 py-1 rounded-md text-xs"
          >
            Delete
          </button>

          <AddContractRateModal
            isOpen={isEditModal}
            setIsOpen={setIsEditModal}
            editingRate={row.original}
          />

          <Dialog open={isDeleteModal} onOpenChange={setIsDeleteModal}>
            <DialogContent>
              <div className="text-center p-6">
                <h2 className="text-lg font-semibold">Delete Contract Rate</h2>
                <p className="text-gray-500 mt-2">
                  Are you sure you want to delete this rate? This cannot be
                  undone.
                </p>

                <div className="flex gap-3 mt-4">
                  <Button
                    variant="secondary"
                    onClick={() => setIsDeleteModal(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={onDelete}
                    isLoading={isLoading}
                    className="flex-1 bg-red-600 hover:bg-red-700"
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      );
    },
  },
];
