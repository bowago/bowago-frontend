"use client";

import { Button } from "@/components/ui/button";
import * as Dialog from "@radix-ui/react-dialog";
import {
  useDeleteBoxMutation,
  useEditBoxDimensionMutation,
} from "@/store/slice/apiSlice";
import { RootState } from "@/store/store";
import { ColumnDef } from "@tanstack/react-table";
import { Pencil, Trash2, X } from "lucide-react";
import { useState } from "react";
import { useSelector } from "react-redux";

export type BoxDimensions = {
  id: string;
  categoryId: string;
  displayName: string;
  lengthCm: number;
  widthCm: number;
  heightCm: number;
  bestFor: string;
  weightKgLimit: number;
};

// ─── Shared modal shell matching zone-column style ─────────────────────────────
function ModalShell({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40" />
        <Dialog.Content
          className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 focus:outline-none"
          style={{ maxHeight: "90vh", overflowY: "auto" }}
        >
          <div className="flex justify-end mb-2">
            <Dialog.Close asChild>
              <button className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </Dialog.Close>
          </div>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

// ─── Action cell ─────────────────────────────────────────────────────────────
function BoxActionCell({ row }: { row: any }) {
  const me = useSelector((state: RootState) => state.auth.user);
  const isSuperAdmin = (me as any)?.adminSubRole === "SUPER_ADMIN";

  const [handleDeleteBox, { isLoading: deleting }] = useDeleteBoxMutation();
  const [handleEditBox, { isLoading: saving }] = useEditBoxDimensionMutation();

  const [isDeleteModal, setIsDeleteModal] = useState(false);
  const [isEditModal, setIsEditModal] = useState(false);

  const [form, setForm] = useState({
    categoryId: row.original.categoryId,
    displayName: row.original.displayName,
    lengthCm: String(row.original.lengthCm),
    widthCm: String(row.original.widthCm),
    heightCm: String(row.original.heightCm),
    weightKgLimit: String(row.original.weightKgLimit),
    bestFor: row.original.bestFor,
  });

  const openEdit = () => {
    setForm({
      categoryId: row.original.categoryId,
      displayName: row.original.displayName,
      lengthCm: String(row.original.lengthCm),
      widthCm: String(row.original.widthCm),
      heightCm: String(row.original.heightCm),
      weightKgLimit: String(row.original.weightKgLimit),
      bestFor: row.original.bestFor,
    });
    setIsEditModal(true);
  };

  const setField = (key: keyof typeof form, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const onSaveEdit = () => {
    const lengthCm = parseFloat(form.lengthCm);
    const widthCm = parseFloat(form.widthCm);
    const heightCm = parseFloat(form.heightCm);
    const weightKgLimit = parseFloat(form.weightKgLimit);

    if (
      !form.categoryId.trim() ||
      !form.displayName.trim() ||
      [lengthCm, widthCm, heightCm, weightKgLimit].some((n) => isNaN(n) || n <= 0)
    ) {
      return;
    }

    handleEditBox({
      id: row.original.id,
      categoryId: form.categoryId.trim(),
      displayName: form.displayName.trim(),
      lengthCm,
      widthCm,
      heightCm,
      weightKgLimit,
      bestFor: form.bestFor.trim(),
    })
      .unwrap()
      .then(() => setIsEditModal(false));
  };

  const onDelete = () =>
    handleDeleteBox({ id: row.original.id })
      .unwrap()
      .then(() => setIsDeleteModal(false));

  return (
    <>
      <div className="flex gap-2 flex-wrap">
        {/* Edit box — Super Admin only */}
        {isSuperAdmin && (
          <button
            onClick={openEdit}
            className="flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-md text-sm transition-colors"
          >
            <Pencil className="w-3.5 h-3.5" />
            Edit
          </button>
        )}

        {/* Delete — Super Admin only */}
        {isSuperAdmin && (
          <button
            onClick={() => setIsDeleteModal(true)}
            className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-md text-sm transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete
          </button>
        )}

        {!isSuperAdmin && (
          <span className="text-xs text-gray-400">View only</span>
        )}
      </div>

      {/* ── Edit Box Modal ── */}
      <ModalShell open={isEditModal} onClose={() => setIsEditModal(false)}>
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Edit Box Dimension</h2>
            <p className="text-sm text-gray-400 mt-0.5">
              Update the size, weight limit, or labeling for this box type.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category ID
              </label>
              <input
                type="text"
                value={form.categoryId}
                onChange={(e) => setField("categoryId", e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
                placeholder="e.g. M-02"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Display Name
              </label>
              <input
                type="text"
                value={form.displayName}
                onChange={(e) => setField("displayName", e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
                placeholder="e.g. Medium Shipping Box"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Dimensions — L × W × H (cm)
            </label>
            <div className="grid grid-cols-3 gap-3">
              <input
                type="number"
                min={1}
                value={form.lengthCm}
                onChange={(e) => setField("lengthCm", e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
                placeholder="Length"
              />
              <input
                type="number"
                min={1}
                value={form.widthCm}
                onChange={(e) => setField("widthCm", e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
                placeholder="Width"
              />
              <input
                type="number"
                min={1}
                value={form.heightCm}
                onChange={(e) => setField("heightCm", e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
                placeholder="Height"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Weight Limit (kg)
              </label>
              <input
                type="number"
                min={1}
                value={form.weightKgLimit}
                onChange={(e) => setField("weightKgLimit", e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
                placeholder="e.g. 20"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Best For
              </label>
              <input
                type="text"
                value={form.bestFor}
                onChange={(e) => setField("bestFor", e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
                placeholder="e.g. Clothing/Kitchenware"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-1">
            <button
              onClick={() => setIsEditModal(false)}
              className="flex-1 px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <Button onClick={onSaveEdit} isLoading={saving} className="flex-1">
              Save Changes
            </Button>
          </div>
        </div>
      </ModalShell>

      {/* ── Delete Modal ── */}
      <ModalShell open={isDeleteModal} onClose={() => setIsDeleteModal(false)}>
        <div className="text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto">
            <Trash2 className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Delete Box Dimension</h2>
            <p className="text-gray-500 mt-1 text-sm">
              Are you sure you want to delete{" "}
              <strong>{row.original.displayName}</strong> (
              {row.original.categoryId})? This may affect existing quotes that
              reference this box type.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setIsDeleteModal(false)}
              className="flex-1 px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </button>
            <Button
              isLoading={deleting}
              onClick={onDelete}
              className="flex-1 bg-red-600 hover:bg-red-700"
            >
              Delete
            </Button>
          </div>
        </div>
      </ModalShell>
    </>
  );
}

export const BoxDimensionsColumns: ColumnDef<BoxDimensions>[] = [
  {
    accessorKey: "",
    header: "S/N",
    cell: ({ row }) => <div>{row.index + 1}</div>,
  },

  {
    accessorKey: "categoryId",
    header: "Category ID",
    cell: ({ row }) => <div>{row.getValue("categoryId")}</div>,
  },

  {
    accessorKey: "displayName",
    header: "Display Name",
    cell: ({ row }) => <div>{row.getValue("displayName")}</div>,
  },

  {
    id: "dimensions",
    header: "Dimensions - L x W x H (cm)",
    cell: ({ row }) => {
      const { lengthCm, widthCm, heightCm } = row.original;
      return (
        <div>
          {lengthCm} × {widthCm} × {heightCm}
        </div>
      );
    },
  },

  {
    accessorKey: "weightKgLimit",
    header: "Weight (kg)",
    cell: ({ row }) => <div>{row.getValue("weightKgLimit")} kg</div>,
  },

  {
    accessorKey: "bestFor",
    header: "Best For",
    cell: ({ row }) => <div>{row.getValue("bestFor")}</div>,
  },

  {
    id: "action",
    header: "Action",
    cell: ({ row }) => <BoxActionCell row={row} />,
  },
];
