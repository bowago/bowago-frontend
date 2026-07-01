"use client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog/dialog";
import { useDeletePromoRateMutation } from "@/store/slice/apiSlice";
import AddPromoRateModal from "@/components/modals/AddPromoRateModal";
import { ColumnDef } from "@tanstack/react-table";
import { useState } from "react";

export type PromoRate = {
  id: string;
  code: string;
  label: string | null;
  description: string | null;
  discountPercent: number | null;
  flatDiscount: number | null;
  serviceType: "STANDARD" | "EXPRESS" | "ECONOMY" | null;
  zone: number | null;
  minWeightKg: number | null;
  maxUsageCount: number | null;
  usageCount: number;
  isActive: boolean;
  validFrom: string | null;
  validUntil: string | null;
};

export const PromoRateColumns: ColumnDef<PromoRate>[] = [
  { header: "S/N", cell: ({ row }) => <div>{row.index + 1}</div> },

  {
    accessorKey: "code",
    header: "Code",
    cell: ({ row }) => (
      <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
        {row.getValue<string>("code")}
      </span>
    ),
  },

  {
    accessorKey: "label",
    header: "Label",
    cell: ({ row }) => <span>{row.getValue<string>("label") || "—"}</span>,
  },

  {
    accessorKey: "serviceType",
    header: "Service",
    cell: ({ row }) => {
      const v = row.getValue<string>("serviceType");
      return <span className="capitalize text-sm">{v ? v.toLowerCase() : "All"}</span>;
    },
  },

  {
    accessorKey: "zone",
    header: "Zone",
    cell: ({ row }) => {
      const z = row.getValue<number | null>("zone");
      return <div>{z !== null && z !== undefined ? `Zone ${z}` : "All"}</div>;
    },
  },

  {
    id: "discount",
    header: "Discount",
    cell: ({ row }) => {
      const { discountPercent, flatDiscount } = row.original;
      if (discountPercent != null)
        return <span className="text-blue-600 font-medium">{discountPercent}% off</span>;
      if (flatDiscount != null)
        return <span className="text-purple-600 font-medium">₦{flatDiscount} off</span>;
      return "—";
    },
  },

  {
    id: "usage",
    header: "Usage",
    cell: ({ row }) => {
      const { usageCount, maxUsageCount } = row.original;
      if (maxUsageCount == null) return <div className="text-xs">{usageCount} / ∞</div>;
      return (
        <div className="text-xs">
          <div>{usageCount} / {maxUsageCount}</div>
          <div className="w-full bg-gray-100 rounded h-1 mt-1">
            <div
              className="bg-blue-500 h-1 rounded"
              style={{ width: `${Math.min(100, (usageCount / maxUsageCount) * 100)}%` }}
            />
          </div>
        </div>
      );
    },
  },

  {
    id: "validity",
    header: "Validity",
    cell: ({ row }) => {
      const { validFrom, validUntil } = row.original;
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

  {
    accessorKey: "isActive",
    header: "Status",
    cell: ({ row }) => {
      const isActive = row.getValue<boolean>("isActive");
      return (
        <span className={`px-2 py-1 text-xs rounded-full ${isActive ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-500"}`}>
          {isActive ? "Active" : "Inactive"}
        </span>
      );
    },
  },

  {
    id: "action",
    header: "Action",
    cell: ({ row }) => {
      const [isDeleteModal, setIsDeleteModal] = useState(false);
      const [isEditModal, setIsEditModal] = useState(false);
      const [handleDelete, { isLoading: deleting }] = useDeletePromoRateMutation();

      const onDelete = async () => {
        try {
          await handleDelete({ id: row.original.id }).unwrap();
          setIsDeleteModal(false);
        } catch {
          // error toast shown by mutation
        }
      };

      // Map the row data to the shape AddPromoRateModal expects as initialValue
      const editInitialValue = {
        id:              row.original.id,
        code:            row.original.code,
        label:           row.original.label ?? "",
        description:     row.original.description ?? "",
        discountPercent: row.original.discountPercent ?? 0,
        flatDiscount:    row.original.flatDiscount ?? 0,
        serviceType:     row.original.serviceType ?? "STANDARD",
        zone:            row.original.zone ?? 0,
        minWeightKg:     row.original.minWeightKg ?? 0,
        maxUsageCount:   row.original.maxUsageCount ?? 0,
        isActive:        row.original.isActive,
        validFrom:       row.original.validFrom?.slice(0, 10) ?? "",
        validUntil:      row.original.validUntil?.slice(0, 10) ?? "",
      };

      return (
        <div className="flex gap-2">
          <button
            onClick={() => setIsEditModal(true)}
            className="text-blue-500 border border-blue-400 px-3 py-1 rounded-md text-xs hover:bg-blue-50"
          >
            Edit
          </button>
          <button
            onClick={() => setIsDeleteModal(true)}
            className="text-red-400 border border-red-400 px-3 py-1 rounded-md text-xs hover:bg-red-50"
          >
            Delete
          </button>

          {/* Full edit modal — all fields editable */}
          <AddPromoRateModal
            isOpen={isEditModal}
            setIsOpen={setIsEditModal}
            initialValue={editInitialValue as any}
            isEdit
          />

          {/* Delete confirmation */}
          <Dialog open={isDeleteModal} onOpenChange={setIsDeleteModal}>
            <DialogContent>
              <div className="text-center p-6">
                <h2 className="text-lg font-semibold">Delete Promo Rate</h2>
                <p className="text-gray-500 mt-2 text-sm">
                  Delete <span className="font-mono font-bold">{row.original.code}</span>? This cannot be undone.
                </p>
                <div className="flex gap-3 mt-4">
                  <Button variant="secondary" className="flex-1" onClick={() => setIsDeleteModal(false)}>
                    Cancel
                  </Button>
                  <Button onClick={onDelete} isLoading={deleting} className="flex-1 bg-red-600 hover:bg-red-700">
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
