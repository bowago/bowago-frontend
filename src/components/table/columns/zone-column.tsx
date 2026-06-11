"use client";

import { Button } from "@/components/ui/button";
import * as Dialog from "@radix-ui/react-dialog";
import {
  useDeleteZoneMutation,
  useEditZoneMutation,
  usePauseZoneMutation,
  useReInstateZoneMutation,
} from "@/store/slice/apiSlice";
import { RootState } from "@/store/store";
import { ColumnDef } from "@tanstack/react-table";
import { Pencil, Trash2, X } from "lucide-react";
import { useState } from "react";
import { useSelector } from "react-redux";
import { cn } from "@/lib/utils";

export type Zone = {
  id: string;
  zone: number;
  isActive: boolean;
  fromCity: { name: string };
  toCity: { name: string };
};

// ─── Shared modal shell matching existing zone-column style ───────────────────
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
function ZoneActionCell({ row }: { row: any }) {
  const me = useSelector((state: RootState) => state.auth.user);
  const isSuperAdmin = me?.adminSubRole === "SUPER_ADMIN";

  const [handleDeleteZone, { isLoading: deleting }] = useDeleteZoneMutation();
  const [handlePauseZone, { isLoading: pausing }] = usePauseZoneMutation();
  const [handleReInstateZone, { isLoading: reinstating }] = useReInstateZoneMutation();
  const [handleEditZone, { isLoading: saving }] = useEditZoneMutation();

  const [isDeleteModal, setIsDeleteModal] = useState(false);
  const [isActivateModal, setIsActivateModal] = useState(false);
  const [isEditModal, setIsEditModal] = useState(false);
  const [editZone, setEditZone] = useState(String(row.original.zone ?? ""));

  const onDelete = () =>
    handleDeleteZone({ id: row.original.id })
      .unwrap()
      .then(() => setIsDeleteModal(false));

  const onToggleActive = () => {
    const fn = row.original.isActive ? handlePauseZone : handleReInstateZone;
    fn({ id: row.original.id })
      .unwrap()
      .then(() => setIsActivateModal(false));
  };

  const onSaveEdit = () => {
    const parsed = parseInt(editZone);
    if (isNaN(parsed) || parsed < 1) return;
    handleEditZone({ id: row.original.id, zone: parsed })
      .unwrap()
      .then(() => setIsEditModal(false));
  };

  const openEdit = () => {
    setEditZone(String(row.original.zone ?? ""));
    setIsEditModal(true);
  };

  return (
    <>
      <div className="flex gap-2 flex-wrap">
        {/* Edit zone number — Super Admin only */}
        {isSuperAdmin && (
          <button
            onClick={openEdit}
            className="flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-md text-sm transition-colors"
          >
            <Pencil className="w-3.5 h-3.5" />
            Edit
          </button>
        )}

        {/* Pause / Activate */}
        <button
          onClick={() => setIsActivateModal(true)}
          className={cn(
            row.original.isActive
              ? "bg-gray-200 hover:bg-gray-300 text-gray-600"
              : "bg-amber-100 hover:bg-amber-200 text-amber-700",
            "px-3 py-1.5 rounded-md text-sm transition-colors",
          )}
        >
          {row.original.isActive ? "De-Activate" : "Activate"}
        </button>

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
      </div>

      {/* ── Edit Zone Modal ── */}
      <ModalShell open={isEditModal} onClose={() => setIsEditModal(false)}>
        <div className="space-y-5">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Edit Zone</h2>
            <p className="text-sm text-gray-400 mt-0.5">
              Change the zone number for{" "}
              <strong>{row.original.fromCity?.name}</strong> →{" "}
              <strong>{row.original.toCity?.name}</strong>.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Zone Number
            </label>
            <input
              type="number"
              min={1}
              max={10}
              value={editZone}
              onChange={(e) => setEditZone(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
              placeholder="e.g. 3"
            />
            <p className="text-xs text-gray-400 mt-1">
              Current zone: <strong>Zone {row.original.zone}</strong>
            </p>
          </div>

          <div className="flex gap-3">
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
            <h2 className="text-lg font-semibold text-gray-900">Delete Zone</h2>
            <p className="text-gray-500 mt-1 text-sm">
              Are you sure you want to delete the route from{" "}
              <strong>{row.original.fromCity?.name}</strong> to{" "}
              <strong>{row.original.toCity?.name}</strong>?
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

      {/* ── Activate / De-activate Modal ── */}
      <ModalShell
        open={isActivateModal}
        onClose={() => setIsActivateModal(false)}
      >
        <div className="text-center space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">
            {row.original.isActive ? "De-Activate" : "Activate"} Zone
          </h2>
          <p className="text-gray-500 text-sm">
            Are you sure you want to{" "}
            {row.original.isActive ? "de-activate" : "activate"} the route from{" "}
            <strong>{row.original.fromCity?.name}</strong> to{" "}
            <strong>{row.original.toCity?.name}</strong>?
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => setIsActivateModal(false)}
              className="flex-1 px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </button>
            <Button
              isLoading={pausing || reinstating}
              onClick={onToggleActive}
              className="flex-1"
            >
              Proceed
            </Button>
          </div>
        </div>
      </ModalShell>
    </>
  );
}

export const ZoneColumns: ColumnDef<Zone>[] = [
  {
    accessorKey: "",
    header: "S/N",
    cell: ({ row }) => <div>{row.index + 1}</div>,
  },
  {
    accessorKey: "zone",
    header: "Zone",
    cell: ({ row }) => (
      <div className="font-medium">Zone {row.getValue("zone")}</div>
    ),
  },
  {
    id: "fromCity",
    header: "From",
    cell: ({ row }) => <div>{row.original.fromCity?.name}</div>,
  },
  {
    id: "toCity",
    header: "To",
    cell: ({ row }) => <div>{row.original.toCity?.name}</div>,
  },
  {
    id: "isActive",
    header: "Status",
    cell: ({ row }) => (
      <div
        className={cn(
          row.original.isActive
            ? "text-green-700 bg-green-50 border-green-200"
            : "text-red-700 bg-red-50 border-red-200",
          "rounded-2xl px-2 py-1 w-fit border text-xs font-medium",
        )}
      >
        {row.original.isActive ? "Active" : "Inactive"}
      </div>
    ),
  },
  {
    id: "action",
    header: "Action",
    cell: ({ row }) => <ZoneActionCell row={row} />,
  },
];
