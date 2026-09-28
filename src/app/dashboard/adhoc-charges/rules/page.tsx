"use client";

import AdhocChargeRuleTableView from "@/components/layout/AdhocChargeRuleTableView";
import AdhocChargeRuleModal from "@/components/modals/AdhocChargeRuleModal";
import { Plus } from "lucide-react";
import { useState } from "react";

export default function AdhocChargeRulesPage() {
  const [open, setOpen] = useState(false);
  return (
    <div className="pb-10">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="text-dashboard-heading">Suggestion Rules</div>
          <p className="text-sm text-gray-500 mt-1">
            Weight/volume thresholds that auto-apply or suggest an adhoc
            charge — checked at quote time and again at warehouse weigh-in.
          </p>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 bg-brand text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-red-700 transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Add Rule
        </button>
      </div>
      <AdhocChargeRuleTableView />
      <AdhocChargeRuleModal isOpen={open} setIsOpen={setOpen} />
    </div>
  );
}
