"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog/dialog";
import {
  useDeleteCityMutation,
  useEditCityMutation,
} from "@/store/slice/apiSlice";
import { RootState } from "@/store/store";
import { ColumnDef } from "@tanstack/react-table";
import { Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { useSelector } from "react-redux";

export type Cities = {
  id: string;
  name: string;
  region: string;
  state: string;
};

const NIGERIAN_REGIONS = [
  "North Central",
  "North East",
  "North West",
  "South East",
  "South South",
  "South West",
];

// ─── Action cell — isolated component so hooks are always called at top level ──
function CityActionCell({ row }: { row: any }) {
  const me = useSelector((state: RootState) => state.auth.user);
  const isSuperAdmin = me?.adminSubRole === "SUPER_ADMIN";

  const [handleDeleteCity, { isLoading: deleting }] = useDeleteCityMutation();
  const [handleEditCity, { isLoading: saving }] = useEditCityMutation();

  const [isDeleteModal, setIsDeleteModal] = useState(false);
  const [isEditModal, setIsEditModal] = useState(false);

  const [editForm, setEditForm] = useState({
    name: row.original.name ?? "",
    region: row.original.region ?? "",
    state: row.original.state ?? "",
  });

  const openEdit = () => {
    setEditForm({
      name: row.original.name ?? "",
      region: row.original.region ?? "",
      state: row.original.state ?? "",
    });
    setIsEditModal(true);
  };

  const onSaveEdit = () => {
    handleEditCity({ id: row.original.id, ...editForm })
      .unwrap()
      .then(() => setIsEditModal(false));
  };

  const onDeleteCity = () => {
    handleDeleteCity({ id: row.original.id })
      .unwrap()
      .then(() => setIsDeleteModal(false));
  };

  return (
    <>
      <div className="flex gap-2">
        {/* Edit — Super Admin only */}
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
          <span className="text-xs text-gray-400 italic">Super Admin only</span>
        )}
      </div>

      {/* ── Edit Modal ── */}
      <Dialog open={isEditModal} onOpenChange={setIsEditModal}>
        <DialogContent>
          <div className="p-6 space-y-5">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Edit City</h2>
              <p className="text-sm text-gray-400 mt-0.5">
                Update name, region, or state for this city.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  City Name
                </label>
                <input
                  value={editForm.name}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, name: e.target.value }))
                  }
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
                  placeholder="e.g. Aba"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Region
                </label>
                <select
                  value={editForm.region}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, region: e.target.value }))
                  }
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand bg-white"
                >
                  <option value="">Select region</option>
                  {NIGERIAN_REGIONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  State
                </label>
                <input
                  value={editForm.state}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, state: e.target.value }))
                  }
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
                  placeholder="e.g. Abia"
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
              <Button
                onClick={onSaveEdit}
                isLoading={saving}
                className="flex-1"
              >
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Delete Modal ── */}
      <Dialog open={isDeleteModal} onOpenChange={setIsDeleteModal}>
        <DialogContent>
          <div className="text-center p-6 space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto">
              <Trash2 className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Delete City
              </h2>
              <p className="text-gray-500 mt-1 text-sm">
                Are you sure you want to delete{" "}
                <strong>{row.original.name}</strong>? This will also remove all
                zone matrix entries for this city.
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
                onClick={onDeleteCity}
                isLoading={deleting}
                className="flex-1 bg-red-600 hover:bg-red-700"
              >
                Delete
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export const citiesColumns: ColumnDef<Cities>[] = [
  {
    accessorKey: "",
    header: "S/N",
    cell: ({ row }) => <div>{row.index + 1}</div>,
  },
  {
    accessorKey: "name",
    header: "City",
    cell: ({ row }) => <div className="font-medium">{row.getValue("name")}</div>,
  },
  {
    accessorKey: "region",
    header: "Region",
    cell: ({ row }) => <div>{row.getValue("region")}</div>,
  },
  {
    accessorKey: "state",
    header: "State",
    cell: ({ row }) => <div>{row.getValue("state")}</div>,
  },
  {
    id: "action",
    header: "Action",
    cell: ({ row }) => <CityActionCell row={row} />,
  },
];
