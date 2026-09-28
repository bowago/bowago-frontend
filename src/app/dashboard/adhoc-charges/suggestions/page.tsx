"use client";

import AdhocSuggestionQueueView from "@/components/layout/AdhocSuggestionQueueView";

export default function AdhocSuggestionsPage() {
  return (
    <div className="pb-10">
      <div className="mb-6">
        <div className="text-dashboard-heading">Suggestion Queue</div>
        <p className="text-sm text-gray-500 mt-1">
          SUGGEST-behaviour rule matches waiting on a decision. Approving a
          post-booking suggestion pauses the shipment and asks the customer
          to approve the extra charge — nothing is ever billed silently.
        </p>
      </div>
      <AdhocSuggestionQueueView />
    </div>
  );
}
