"use client";

import { useGetFeaturedFAQsQuery } from "@/store/slice/apiSlice";

// Skeleton for loading state
const FAQSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
    {[1, 2, 3, 4].map((i) => (
      <div
        key={i}
        className="bg-white/5 border border-white/10 rounded-2xl p-5 animate-pulse"
      >
        <div className="h-4 bg-white/10 rounded w-3/4 mb-3" />
        <div className="h-3 bg-white/5 rounded w-full mb-1.5" />
        <div className="h-3 bg-white/5 rounded w-4/5" />
      </div>
    ))}
  </div>
);

export default function FeaturedFAQs() {
  const { data, isLoading } = useGetFeaturedFAQsQuery();
  const faqs: any[] = data?.data?.faqs ?? [];

  if (isLoading) return <FAQSkeleton />;

  if (faqs.length === 0) {
    // No featured FAQs yet — show a placeholder so the section isn't empty
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 col-span-2 text-center text-white/30 text-sm py-10">
          No featured FAQs yet.
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
      {faqs.map((item: any) => (
        <div
          key={item.id}
          className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:border-white/20 transition-all"
        >
          <p className="font-semibold text-white text-sm mb-2">
            {item.question}
          </p>
          <p className="text-white/50 text-sm leading-relaxed">{item.answer}</p>
        </div>
      ))}
    </div>
  );
}
