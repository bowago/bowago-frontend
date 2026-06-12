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
import {
  regionOptions,
  statesForRegion,
  getRegionForState,
} from "@/lib/nigeria-states";

export type Cities = {
  id: string;
  name: string;
  region: string;
  state: string;
};

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

  // When region changes, clear state if it no longer belongs to that region
  const handleRegionChange = (region: string) => {
    setEditForm((f) => ({
      ...f,
      region,
      state: getRegionForState(f.state) === region ? f.state : "",
    }));
  };

  // When state changes, auto-fill its region
  const handleStateChange = (state: string) => {
    const region = getRegionForState(state);
    setEditForm((f) => ({ ...f, state, region: region || f.region }));
  };

  const onSaveEdit = () => {
    handleEditCity({ id: row.original.id, ...editForm })
      .unwrap()
      .then(() => setIsEditModal(false));
  };

  // ── Delete flow ──
  // Step 1: attempt a plain delete.
  // - No dependents → deletes immediately.
  // - Has dependent zone/km routes → backend returns 409 with details,
  //   which we show with a "delete anyway" cascade option.
  const [dependencyInfo, setDependencyInfo] = useState<null | {
    zoneRoutes: number;
    kmRoutes: number;
    total: number;
    message: string;
  }>(null);

  const onDeleteCity = () => {
    setDependencyInfo(null);
    handleDeleteCity({ id: row.original.id })
      .unwrap()
      .then(() => setIsDeleteModal(false))
      .catch((err: any) => {
        if (err?.status === 409 && err?.data) {
          setDependencyInfo({
            zoneRoutes: err.data.data?.dependents?.zoneRoutes ?? 0,
            kmRoutes: err.data.data?.dependents?.kmRoutes ?? 0,
            total: err.data.data?.dependents?.total ?? 0,
            message: err.data.message ?? "",
          });
        }
      });
  };

  const onForceDeleteCity = () => {
    handleDeleteCity({ id: row.original.id, force: true })
      .unwrap()
      .then(() => {
        setDependencyInfo(null);
        setIsDeleteModal(false);
      });
  };

  const closeDeleteModal = () => {
    setIsDeleteModal(false);
    setDependencyInfo(null);
  };

  return (
    <>
      <div className="flex gap-2">
        {isSuperAdmin && (
          <button
            onClick={openEdit}
            className="flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-md text-sm transition-colors"
          >
            <Pencil className="w-3.5 h-3.5" />
            Edit
          </button>
        )}
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
              {/* City Name */}
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

              {/* Region dropdown — filters state list */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Region
                </label>
                <select
                  value={editForm.region}
                  onChange={(e) => handleRegionChange(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand bg-white"
                >
                  <option value="">Select region</option>
                  {regionOptions.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* State dropdown — auto-fills region when selected */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  State
                </label>
                <select
                  value={editForm.state}
                  onChange={(e) => handleStateChange(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand bg-white"
                >
                  <option value="">
                    {editForm.region
                      ? "Select state"
                      : "Select region first or pick any state"}
                  </option>
                  {statesForRegion(editForm.region).map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
                {editForm.state && (
                  <p className="text-xs text-gray-400 mt-1">
                    Region auto-set to:{" "}
                    <span className="font-medium text-gray-600">
                      {getRegionForState(editForm.state) || editForm.region}
                    </span>
                  </p>
                )}
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
        </DialogContent>
      </Dialog>

      {/* ── Delete Modal ── */}
      <Dialog open={isDeleteModal} onOpenChange={closeDeleteModal}>
        <DialogContent>
          <div className="text-center p-6 space-y-4">
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto ${
                dependencyInfo ? "bg-amber-50" : "bg-red-50"
              }`}
            >
              <Trash2
                className={`w-5 h-5 ${
                  dependencyInfo ? "text-amber-600" : "text-red-600"
                }`}
              />
            </div>

            {!dependencyInfo ? (
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Delete City
                </h2>
                <p className="text-gray-500 mt-1 text-sm">
                  Are you sure you want to delete{" "}
                  <strong>{row.original.name}</strong>?
                </p>
              </div>
            ) : (
              <div className="text-left">
                <h2 className="text-lg font-semibold text-gray-900 text-center">
                  Can&apos;t delete &mdash; routes attached
                </h2>
                <p className="text-gray-500 mt-2 text-sm text-center">
                  <strong>{row.original.name}</strong> is currently used by:
                </p>
                <ul className="mt-3 space-y-1.5 text-sm text-gray-700 bg-amber-50 border border-amber-100 rounded-lg px-4 py-3">
                  {dependencyInfo.zoneRoutes > 0 && (
                    <li className="flex justify-between">
                      <span>Zone matrix routes</span>
                      <span className="font-semibold">
                        {dependencyInfo.zoneRoutes}
                      </span>
                    </li>
                  )}
                  {dependencyInfo.kmRoutes > 0 && (
                    <li className="flex justify-between">
                      <span>Distance (KM) routes</span>
                      <span className="font-semibold">
                        {dependencyInfo.kmRoutes}
                      </span>
                    </li>
                  )}
                </ul>
                <p className="text-xs text-gray-400 mt-3 text-center">
                  Deleting this city will permanently remove these{" "}
                  {dependencyInfo.total} route(s) as well. This cannot be
                  undone.
                </p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={closeDeleteModal}
                className="flex-1 px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              {!dependencyInfo ? (
                <Button
                  onClick={onDeleteCity}
                  isLoading={deleting}
                  className="flex-1 bg-red-600 hover:bg-red-700"
                >
                  Delete
                </Button>
              ) : (
                <Button
                  onClick={onForceDeleteCity}
                  isLoading={deleting}
                  className="flex-1 bg-amber-600 hover:bg-amber-700"
                >
                  Delete city + {dependencyInfo.total} route(s)
                </Button>
              )}
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
