"use client";
import SurchargeTableView from "@/components/layout/SurchargeTableView";
import AddSurchargeModal from "@/components/modals/AddSurchargeModal";
import { Plus } from "lucide-react";
import { useState } from "react";

export default function SurchargesPage() {
  const [open, setOpen] = useState(false);
  return (
    <div className="pb-10">
      <div className="flex items-center justify-between mb-6">
        <div className="text-dashboard-heading">Surcharges</div>
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 bg-brand text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-red-700 transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Add Surcharge
        </button>
      </div>
      <SurchargeTableView />
      <AddSurchargeModal isOpen={open} setIsOpen={setOpen} />
    </div>
  );
}
