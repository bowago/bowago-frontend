"use client";

import AdhocChargeTypeTableView from "@/components/layout/AdhocChargeTypeTableView";
import AdhocChargeTypeModal from "@/components/modals/AdhocChargeTypeModal";
import { Plus } from "lucide-react";
import { useState } from "react";

export default function AdhocChargesPage() {
  const [open, setOpen] = useState(false);
  return (
    <div className="pb-10">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="text-dashboard-heading">Adhoc Charge Types</div>
          <p className="text-sm text-gray-500 mt-1">
            Extra fees admin can attach to a quote or shipment — oversize
            handling, extra packaging, storage, re-delivery, weekend pickup,
            and so on.
          </p>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 bg-brand text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-red-700 transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Add Charge Type
        </button>
      </div>
      <AdhocChargeTypeTableView />
      <AdhocChargeTypeModal isOpen={open} setIsOpen={setOpen} />
    </div>
  );
}
