"use client";

import AuditTrailTableView from "@/components/layout/AuditTrailTableView";

export default function Page() {
  return (
    <div className=" space-y-6">
      <div className="flex flex-row justify-between flex-1">
        <h1 className="dashboard-heading">Audit Trail</h1>
      </div>

      <AuditTrailTableView />
    </div>
  );
}
