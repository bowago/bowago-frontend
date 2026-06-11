"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog/dialog";
import { useDeleteCityMutation } from "@/store/slice/apiSlice";
import { ColumnDef, Row } from "@tanstack/react-table";
import { useRouter } from "next/navigation";
import { useState } from "react";

export type Cities = {
  id: string;
  name: string;
  region: string;
  state: string;
};

export const citiesColumns: ColumnDef<Cities>[] = [
  {
    accessorKey: "",
    header: "S/N",
    cell: ({ row }) => <div>{row.index + 1}</div>,
  },

  {
    accessorKey: "name",
    header: "City",
    cell: ({ row }) => <div>{row.getValue("name")}</div>,
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
    cell: ({ row }) => {
      const [handleDeleteCity, {isLoading}] = useDeleteCityMutation();
      const [isDeleteModal, setIsDeleteModal] = useState(false);
      const router = useRouter();

      const onDeleteCity = () => {
        handleDeleteCity({ id: row.original.id });
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
                <h2 className="text-xl font-semibold">Delete City</h2>
                <p className="text-gray-500 mt-2">
                  Are you sure you want to delete ({row.getValue("state")})
                  city?
                </p>
                <Button onClick={onDeleteCity} isLoading={isLoading} className="mt-4 w-full">
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
