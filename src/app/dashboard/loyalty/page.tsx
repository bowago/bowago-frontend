"use client";

import LoyaltyFullView from "@/components/layout/LoyaltyView";
import { Award } from "lucide-react";

export default function LoyaltyPage() {
  return (
    <div className="pb-12">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 rounded-xl bg-brand/10 flex items-center justify-center">
          <Award className="w-5 h-5 text-brand" />
        </div>
        <div>
          <h1 className="dashboard-heading leading-none">Rewards</h1>
          <p className="text-sm text-gray-500 mt-0.5">Earn points on every delivery. Redeem at checkout.</p>
        </div>
      </div>
      <LoyaltyFullView />
    </div>
  );
}
