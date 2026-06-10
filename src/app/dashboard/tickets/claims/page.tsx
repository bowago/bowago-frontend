"use client";
import ClaimsTableView from "@/components/layout/ClaimsTableView";
import AddClaimsModal from "@/components/modals/AddClaimsModal";
import { Plus } from "lucide-react";
import { useState } from "react";

export default function ClaimsPage() {
  const [open, setOpen] = useState(false);
  return (
    <div className="pb-10">
      <div className="flex items-center justify-between mb-6">
        <div className="text-dashboard-heading">My Claims</div>
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 bg-brand text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-red-700 transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" /> File a Claim
        </button>
      </div>
      <ClaimsTableView />
      <AddClaimsModal isOpen={open} setIsOpen={setOpen} />
    </div>
  );
}
