import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog/dialog";
import { useDeleteBoxMutation } from "@/store/slice/apiSlice";
import { ColumnDef } from "@tanstack/react-table";
import { useState } from "react";

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
    cell: ({ row }) => {
      const [isDeleteModal, setIsDeleteModal] = useState(false);

      // ⚠️ replace with your actual mutation
      const [handleDeleteBox, { isLoading }] = useDeleteBoxMutation();

      const onDelete = () => {
        console.log("delete", row.original.id);
        handleDeleteBox({ id: row.original.id });
      };

      return (
        <>
          <button
            onClick={() => setIsDeleteModal(true)}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-1 rounded-md text-sm"
          >
            Delete
          </button>

          <Dialog open={isDeleteModal} onOpenChange={setIsDeleteModal}>
            <DialogContent>
              <div className="text-center p-6">
                <h2 className="text-xl font-semibold">Delete Box Dimension</h2>
                <p className="text-gray-500 mt-2">
                  Are you sure you want to delete ({row.original.displayName})?
                </p>
                <Button
                  isLoading={isLoading}
                  onClick={onDelete}
                  className="mt-4 w-full"
                >
                  Proceed
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </>
      );
    },
  },
];
