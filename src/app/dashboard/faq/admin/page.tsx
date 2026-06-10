"use client";
import FAQTableView from "@/components/layout/FAQTableView";
import AddFAQModal from "@/components/modals/AddFAQModal";
import { Plus } from "lucide-react";
import { useState } from "react";

export default function FAQAdminPage() {
  const [open, setOpen] = useState(false);
  return (
    <div className="pb-10">
      <div className="flex items-center justify-between mb-6">
        <div className="text-dashboard-heading">FAQ Management</div>
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 bg-brand text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-red-700 transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Add FAQ
        </button>
      </div>
      <FAQTableView />
      <AddFAQModal isOpen={open} setIsOpen={setOpen} />
    </div>
  );
}
