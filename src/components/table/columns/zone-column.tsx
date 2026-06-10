import { Button } from "@/components/ui/button";
import * as Dialog from "@radix-ui/react-dialog";
import {
  useDeleteBoxMutation,
  useDeleteZoneMutation,
  usePauseZoneMutation,
  useReInstateZoneMutation,
} from "@/store/slice/apiSlice";
import { ColumnDef } from "@tanstack/react-table";
import { useState } from "react";
import { cn } from "@/lib/utils";

export type Zone = {
  id: string;
  zone: number;
  isActive: boolean;
  fromCity: {
    name: string;
  };
  toCity: {
    name: string;
  };
};

export const ZoneColumns: ColumnDef<Zone>[] = [
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
    header: "Active",
    cell: ({ row }) => (
      <div
        className={cn(
          row.original.isActive
            ? "text-green-700 bg-green-50 border-green-200"
            : "text-red-700 bg-red-50 border-red-200",
          "rounded-2xl px-2 py-1 w-fit border",
        )}
      >
        {row.original.isActive ? "Active" : "InActive"}
      </div>
    ),
  },

  {
    id: "action",
    header: "Action",
    cell: ({ row }) => {
      const [isDeleteModal, setIsDeleteModal] = useState(false);
      const [isActivateModal, setIsActivateModal] = useState(false);

      // ⚠️ ideally create useDeleteZoneMutation
      const [handleDeleteZone, { isLoading }] = useDeleteZoneMutation();
      const [handlPauseZone, { isLoading: isLoadingPause }] =
        usePauseZoneMutation();
      const [handleReInstateZone, { isLoading: isLoadingReInstate }] =
        useReInstateZoneMutation();

      const onDelete = () => {
        handleDeleteZone({ id: row.original.id })
          .unwrap()
          .then(() => setIsDeleteModal(false));
      };
      const onActivateZone = () => {
        row.original.isActive
          ? handlPauseZone({ id: row.original.id })
              .unwrap()
              .then(() => setIsActivateModal(false))
          : handleReInstateZone({ id: row.original.id })
              .unwrap()
              .then(() => setIsActivateModal(false));
      };

      return (
        <>
          <div className="flex gap-2">
            <button
              onClick={() => setIsDeleteModal(true)}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-1 rounded-md text-sm"
            >
              Delete
            </button>
            <button
              onClick={() => setIsActivateModal(true)}
              className={cn(
                row.original.isActive
                  ? "bg-gray-200 hover:bg-gray-300 text-gray-600 "
                  : "bg-amber-200 hover:bg-amber-300 text-amber-600",
                "px-4 py-1 rounded-md text-sm",
              )}
            >
              {row.original.isActive ? "De-Activate" : "Activate"}
            </button>
          </div>

          <div className="flex items-center justify-center">
            <Dialog.Root open={isDeleteModal} onOpenChange={setIsDeleteModal}>
              <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 animate-[fadeIn_150ms_ease]" />
                <Dialog.Content
                  className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-white rounded-2xl shadow-2xl w-full max-w-xl p-6 focus:outline-none"
                  style={{ maxHeight: "90vh", overflowY: "auto" }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <Dialog.Close asChild>
                      <button className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600">
                        <svg
                          viewBox="0 0 24 24"
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={2.5}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </Dialog.Close>
                    <span className="w-6" />
                  </div>

                  <div className="text-center p-6">
                    <h2 className="text-xl font-semibold">Delete Zone</h2>
                    <p className="text-gray-500 mt-2">
                      Are you sure you want to delete route from{" "}
                      <strong>{row.original.fromCity?.name}</strong> to{" "}
                      <strong>{row.original.toCity?.name}</strong>?
                    </p>

                    <Button
                      isLoading={isLoading}
                      onClick={onDelete}
                      className="mt-4 w-full"
                    >
                      Proceed
                    </Button>
                  </div>
                </Dialog.Content>
              </Dialog.Portal>
            </Dialog.Root>
            <Dialog.Root
              open={isActivateModal}
              onOpenChange={setIsActivateModal}
            >
              <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 animate-[fadeIn_150ms_ease]" />
                <Dialog.Content
                  className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-white rounded-2xl shadow-2xl w-full max-w-xl p-6 focus:outline-none"
                  style={{ maxHeight: "90vh", overflowY: "auto" }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <Dialog.Close asChild>
                      <button className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600">
                        <svg
                          viewBox="0 0 24 24"
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={2.5}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </Dialog.Close>
                    <span className="w-6" />
                  </div>

                  <div className="text-center p-6">
                    <h2 className="text-xl font-semibold">
                      {row.original.isActive ? "De-Activate" : "Activate"} Zone
                    </h2>
                    <p className="text-gray-500 mt-2">
                      Are you sure you want to{" "}
                      {row.original.isActive ? "De-Activate" : "Activate"} route
                      from <strong>{row.original.fromCity?.name}</strong> to{" "}
                      <strong>{row.original.toCity?.name}</strong>?
                    </p>

                    <Button
                      isLoading={isLoadingPause || isLoadingReInstate}
                      onClick={onActivateZone}
                      className="mt-4 w-full"
                    >
                      Proceed
                    </Button>
                  </div>
                </Dialog.Content>
              </Dialog.Portal>
            </Dialog.Root>

            <style>{`
                  @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
                  @keyframes slideUp { from { opacity: 0; transform: translate(-50%, -46%) } to { opacity: 1; transform: translate(-50%, -50%) } }
                `}</style>
          </div>
        </>
      );
    },
  },
];
