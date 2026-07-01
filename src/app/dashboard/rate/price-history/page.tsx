"use client";

import PriceBandAuditLogTableView from "@/components/layout/PriceBandAuditLogTableView";
import { MoveLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export default function PriceBandHistoryPage() {
  const router = useRouter();
  return (
    <div className="pb-10">
      <div className="flex items-center gap-3 mb-2">
        <button onClick={() => router.back()} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <MoveLeft className="w-5 h-5" />
        </button>
        <div className="text-dashboard-heading">Pricing Version Control</div>
      </div>
      <p className="text-sm text-gray-500 mb-6 ml-12">
        Every rate change is kept as a version. Roll back any entry to restore
        the price band to how it was right before that change — nothing is
        deleted, and a rollback itself becomes a new version.
      </p>
      <PriceBandAuditLogTableView />
    </div>
  );
}
