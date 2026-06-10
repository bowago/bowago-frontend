"use client";
import ClaimsTableView from "@/components/layout/ClaimsTableView";

export default function AdminClaimsPage() {
  return (
    <div className="pb-10">
      <div className="text-dashboard-heading mb-6">Claims Management</div>
      <ClaimsTableView />
    </div>
  );
}
