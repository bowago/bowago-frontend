"use client";

import { AppTable } from "@/components/table/Table";
import { useGetFAQQuery } from "@/store/slice/apiSlice";
import { Filter } from "lucide-react";
import { useState } from "react";
import { FAQ, FAQCategory, FAQColumns } from "../table/columns/faq-column";

const faqCategoryOptions = [
  { label: "Pricing", value: "PRICING" },
  { label: "Shipping Rules", value: "SHIPPING_RULES" },
  { label: "Tracking", value: "TRACKING" },
  { label: "Payments", value: "PAYMENTS" },
  { label: "Account", value: "ACCOUNT" },
  { label: "Packaging", value: "PACKAGING" },
  { label: "Claims", value: "CLAIMS" },
] satisfies { label: string; value: FAQCategory }[];

type FAQResponse =
  | FAQ[]
  | {
      data?: FAQ[] | { faqs?: FAQ[]; faq?: FAQ[] };
      faqs?: FAQ[];
      faq?: FAQ[];
    };

const getFAQ = (response?: FAQResponse): FAQ[] => {
  if (!response) return [];
  if (Array.isArray(response)) return response;
  if (Array.isArray(response.data)) return response.data;
  if (response.data && "faqs" in response.data) {
    return response.data.faqs ?? [];
  }
  if (response.data && "faq" in response.data) {
    return response.data.faq ?? [];
  }
  return response.faqs ?? response.faq ?? [];
};

export default function FAQTableView() {
  const [filters, setFilters] = useState({
    search: "",
    category: "",
  });

  const [appliedFilters, setAppliedFilters] = useState(filters);

  const { data, isLoading, isError } = useGetFAQQuery({
    category: appliedFilters.category || undefined,
    search: appliedFilters.search || undefined,
  });
  const faqs = getFAQ(data as FAQResponse | undefined);

  // Apply filtering only using appliedFilters

  const handleChange = (key: string, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // Apply filters when button is clicked
  const applyFilters = () => {
    setAppliedFilters(filters);
  };

  const clearFilters = () => {
    const empty = {
      search: "",
      category: "",
    };

    setFilters(empty);
    setAppliedFilters(empty);
  };

  const removeFilter = (key: string) => {
    setAppliedFilters((prev) => ({
      ...prev,
      [key]: "",
    }));

    setFilters((prev) => ({
      ...prev,
      [key]: "",
    }));
  };

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-end">
        <input
          value={filters.search}
          onChange={(e) => handleChange("search", e.target.value)}
          placeholder="Search question or answer"
          className="border rounded-md p-2"
        />
        <select
          value={filters.category}
          onChange={(e) => handleChange("category", e.target.value)}
          className="border rounded-md p-2"
        >
          <option value="">All Categories</option>
          {faqCategoryOptions.map((category) => (
            <option key={category.value} value={category.value}>
              {category.label}
            </option>
          ))}
        </select>

        <button
          onClick={applyFilters}
          className="bg-red-600 text-white px-5 py-2 rounded-md flex gap-2 items-center"
        >
          Filter <Filter size={16} />
        </button>
      </div>

      {/* Applied Filters */}
      <div className="flex flex-wrap gap-2 items-center mb-6 mt-4">
        <span className="text-sm text-gray-500">Applied Filters:</span>

        {Object.entries(appliedFilters).map(([key, value]) =>
          value ? (
            <span
              key={key}
              className="flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-md text-sm"
            >
              {key}: {value}
              <button
                onClick={() => removeFilter(key)}
                className="text-red-500 hover:text-red-700"
              >
                ✕
              </button>
            </span>
          ) : null,
        )}

        {Object.values(appliedFilters).some(Boolean) && (
          <button
            onClick={clearFilters}
            className="text-red-600 text-sm font-medium ml-2"
          >
            Clear All
          </button>
        )}
      </div>

      {isLoading && <div>...Loading all FAQ</div>}
      {isError && (
        <div className="text-sm text-red-600">Unable to load FAQ.</div>
      )}
      {/* Table */}
      <AppTable columns={FAQColumns} data={faqs} />
    </div>
  );
}
