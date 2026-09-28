"use client";

import InsuranceDisclaimerView from "@/components/layout/InsuranceDisclaimerView";

export default function InsuranceDisclaimerPage() {
  return (
    <div className="pb-10">
      <div className="mb-6">
        <div className="text-dashboard-heading">Insurance Disclaimer</div>
        <p className="text-sm text-gray-500 mt-1">
          The uninsured-risk notice shown to customers who decline insurance
          at booking, and the liability limit that applies to them.
        </p>
      </div>
      <InsuranceDisclaimerView />
    </div>
  );
}
