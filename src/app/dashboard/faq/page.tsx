"use client";
import FAQAccordionView from "@/components/layout/FAQAccordionView";

export default function FAQPage() {
  return (
    <div className="pb-10 max-w-3xl">
      <div className="text-dashboard-heading mb-2">Help & FAQ</div>
      <p className="text-sm text-gray-500 mb-6">
        Find answers to common questions about shipping, pricing, and tracking.
      </p>
      <FAQAccordionView />
    </div>
  );
}
