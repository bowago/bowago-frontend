import AddPromoCodeModal from "@/components/modals/AddPromoCodeModal";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog/dialog";
import { useDeletePromoCodeMutation } from "@/store/slice/apiSlice";
import { ColumnDef } from "@tanstack/react-table";
import { useState } from "react";

export type PromoCode = {
  id: string;
  code: string;
  description: string | null;
  discountPercent: number | null;
  flatDiscount: number | null;
  minOrderAmount: number | null;
  maxUses: number | null;
  usedCount: number;
  isActive: boolean;
  validFrom: string | null;
  validUntil: string | null;
  serviceType: "STANDARD" | "EXPRESS" | "ECONOMY" | null;
  _count?: { redemptions: number };
};

export const PromoCodeColumns: ColumnDef<PromoCode>[] = [
  {
    header: "S/N",
    cell: ({ row }) => <div>{row.index + 1}</div>,
  },

  // 🏷 Code
  {
    accessorKey: "code",
    header: "Code",
    cell: ({ row }) => (
      <span className="font-mono font-semibold text-sm">{row.original.code}</span>
    ),
  },

  // 📝 Description
  {
    accessorKey: "description",
    header: "Description",
    cell: ({ row }) => (
      <span className="text-sm text-gray-500">{row.original.description || "—"}</span>
    ),
  },

  // 💰 Discount
  {
    id: "discount",
    header: "Discount",
    cell: ({ row }) => {
      const { discountPercent, flatDiscount } = row.original;
      if (discountPercent !== null) {
        return <span className="text-blue-600 text-sm font-medium">{discountPercent}%</span>;
      }
      if (flatDiscount !== null) {
        return <span className="text-blue-600 text-sm font-medium">₦{flatDiscount.toLocaleString()}</span>;
      }
      return "—";
    },
  },

  // 🚚 Service Type
  {
    accessorKey: "serviceType",
    header: "Service",
    cell: ({ row }) => (
      <span className="capitalize text-sm">
        {row.original.serviceType ? row.original.serviceType.toLowerCase() : "All"}
      </span>
    ),
  },

  // 📦 Min Order
  {
    accessorKey: "minOrderAmount",
    header: "Min Order",
    cell: ({ row }) => (
      <span className="text-sm">
        {row.original.minOrderAmount ? `₦${row.original.minOrderAmount.toLocaleString()}` : "None"}
      </span>
    ),
  },

  // 🔢 Usage
  {
    id: "usage",
    header: "Usage",
    cell: ({ row }) => {
      const { usedCount, maxUses } = row.original;
      return (
        <span className="text-sm">
          {usedCount}{maxUses ? ` / ${maxUses}` : " / ∞"}
        </span>
      );
    },
  },

  // 📅 Validity
  {
    id: "validity",
    header: "Validity",
    cell: ({ row }) => {
      const { validFrom, validUntil } = row.original;
      if (!validFrom && !validUntil) {
        return <span className="text-xs text-gray-400">Always active</span>;
      }
      return (
        <div className="text-xs">
          <div>{validFrom ? new Date(validFrom).toLocaleDateString() : "—"}</div>
          <div className="text-gray-400">
            → {validUntil ? new Date(validUntil).toLocaleDateString() : "No expiry"}
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
      const [handleDeletePromo, { isLoading }] = useDeletePromoCodeMutation();

      const onDelete = async () => {
        try {
          await handleDeletePromo({ id: row.original.id }).unwrap();
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
            Deactivate
          </button>

          <AddPromoCodeModal
            isOpen={isEditModal}
            setIsOpen={setIsEditModal}
            editingPromo={row.original}
          />

          <Dialog open={isDeleteModal} onOpenChange={setIsDeleteModal}>
            <DialogContent>
              <div className="text-center p-6">
                <h2 className="text-lg font-semibold">Deactivate Promo Code</h2>
                <p className="text-gray-500 mt-2">
                  Are you sure you want to deactivate "{row.original.code}"? It will stop
                  applying to new quotes, but past redemptions are preserved.
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
                    Deactivate
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
