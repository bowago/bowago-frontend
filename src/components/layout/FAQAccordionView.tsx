"use client";

import { useGetFAQQuery } from "@/store/slice/apiSlice";
import { useState } from "react";
import { ChevronDown, Search, Loader2, HelpCircle } from "lucide-react";
import { FAQ, FAQCategory } from "../table/columns/faq-column";

const CATEGORIES = [
  { label: "All", value: "" },
  { label: "Pricing", value: "PRICING" },
  { label: "Shipping Rules", value: "SHIPPING_RULES" },
  { label: "Tracking", value: "TRACKING" },
  { label: "Payments", value: "PAYMENTS" },
  { label: "Account", value: "ACCOUNT" },
  { label: "Packaging", value: "PACKAGING" },
  { label: "Claims", value: "CLAIMS" },
] satisfies { label: string; value: string }[];

type FAQResponse =
  | FAQ[]
  | { data?: FAQ[] | { faqs?: FAQ[]; faq?: FAQ[] }; faqs?: FAQ[]; faq?: FAQ[] };

const getFAQ = (response?: FAQResponse): FAQ[] => {
  if (!response) return [];
  if (Array.isArray(response)) return response;
  if (Array.isArray((response as any).data)) return (response as any).data;
  if ((response as any).data?.faqs) return (response as any).data.faqs;
  if ((response as any).data?.faq) return (response as any).data.faq;
  return (response as any).faqs ?? (response as any).faq ?? [];
};

interface FAQAccordionViewProps {
  dark?: boolean; // for public page
}

export default function FAQAccordionView({
  dark = false,
}: FAQAccordionViewProps) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("");
  const [openId, setOpenId] = useState<string | null>(null);

  const { data, isLoading, isError } = useGetFAQQuery({
    category: category || undefined,
    search: search || undefined,
  });

  const faqs = getFAQ(data as FAQResponse | undefined);

  const toggle = (id: string) => setOpenId((prev) => (prev === id ? null : id));

  const inputCls = dark
    ? "bg-white/10 border border-white/20 text-white placeholder-white/40 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-brand/60 transition-all"
    : "bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-brand/40 transition-all";

  const catBtnBase =
    "px-4 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap cursor-pointer";
  const catActive = dark ? "bg-brand text-white" : "bg-brand text-white";
  const catInactive = dark
    ? "bg-white/10 text-white/60 hover:bg-white/20"
    : "bg-gray-100 text-gray-600 hover:bg-gray-200";

  return (
    <div className="flex flex-col gap-6">
      {/* Search + category filters */}
      <div className="flex flex-col gap-4">
        <div className="relative">
          <Search
            className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 ${dark ? "text-white/30" : "text-gray-400"}`}
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search questions..."
            className={`w-full pl-10 ${inputCls}`}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setCategory(cat.value)}
              className={`${catBtnBase} ${category === cat.value ? catActive : catInactive}`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div
          className={`flex items-center gap-3 py-8 ${dark ? "text-white/50" : "text-gray-400"}`}
        >
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">Loading FAQs...</span>
        </div>
      )}

      {/* Error */}
      {isError && (
        <div
          className={`text-sm py-4 ${dark ? "text-red-400" : "text-red-600"}`}
        >
          Unable to load FAQs. Please try again later.
        </div>
      )}

      {/* Empty */}
      {!isLoading && !isError && faqs.length === 0 && (
        <div
          className={`flex flex-col items-center py-12 gap-3 ${dark ? "text-white/30" : "text-gray-400"}`}
        >
          <HelpCircle className="w-10 h-10 opacity-40" />
          <p className="text-sm">
            No FAQs found{search ? ` for "${search}"` : ""}
          </p>
        </div>
      )}

      {/* Accordion items */}
      {!isLoading && faqs.length > 0 && (
        <div className="flex flex-col gap-2">
          {faqs.map((faq: FAQ) => {
            const isOpen = openId === faq.id;
            return (
              <div
                key={faq.id}
                className={`rounded-xl border overflow-hidden transition-all duration-200 ${
                  dark
                    ? isOpen
                      ? "border-brand/40 bg-white/5"
                      : "border-white/10 bg-white/5 hover:border-white/20"
                    : isOpen
                      ? "border-brand/30 bg-red-50/50"
                      : "border-gray-200 bg-white hover:border-gray-300"
                }`}
              >
                <button
                  onClick={() => toggle(faq.id)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left cursor-pointer"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0 pr-4">
                    {/* Category pill */}
                    {faq.category && (
                      <span
                        className={`flex-shrink-0 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${
                          dark
                            ? "bg-brand/20 text-brand"
                            : "bg-brand/10 text-brand"
                        }`}
                      >
                        {faq.category.replace(/_/g, " ")}
                      </span>
                    )}
                    <span
                      className={`text-sm font-semibold leading-snug ${dark ? "text-white" : "text-gray-900"}`}
                    >
                      {faq.question}
                    </span>
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 flex-shrink-0 transition-transform duration-200 ${
                      isOpen ? "rotate-180" : ""
                    } ${dark ? "text-white/40" : "text-gray-400"}`}
                  />
                </button>

                {isOpen && (
                  <div
                    className={`px-5 pb-5 text-sm leading-relaxed border-t ${
                      dark
                        ? "border-white/10 text-white/70"
                        : "border-gray-100 text-gray-600"
                    }`}
                  >
                    <div className="pt-4">{faq.answer}</div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
