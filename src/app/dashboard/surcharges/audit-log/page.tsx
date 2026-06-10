"use client";
import SurchargeAuditLogTableView from "@/components/layout/SurchargeAuditLogTableView";
import { MoveLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export default function SurchargeAuditLogPage() {
  const router = useRouter();
  return (
    <div className="pb-10">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <MoveLeft className="w-5 h-5" />
        </button>
        <div className="text-dashboard-heading">Surcharge Audit Log</div>
      </div>
      <SurchargeAuditLogTableView />
    </div>
  );
}
