"use client";

import { AppTable } from "@/components/table/Table";
import { useGetAllInvoiceQuery } from "@/store/slice/apiSlice";
import { Filter } from "lucide-react";
import { useState } from "react";
import { InvoiceColumns } from "../table/columns/invoice-rate-column";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";

export default function InvoiceTableView() {
  const user = useSelector((s: RootState) => s.auth.user);
  const isAdmin = user?.role === "ADMIN";

  const [filters, setFilters] = useState({ search: "", status: "" });
  const [appliedFilters, setAppliedFilters] = useState(filters);

  const { data, isLoading } = useGetAllInvoiceQuery({
    status: appliedFilters.status || undefined,
    admin: isAdmin,
  });

  const invoices = data?.data?.invoices ?? [];

  const handleChange = (key: string, value: string) =>
    setFilters((prev) => ({ ...prev, [key]: value }));

  const applyFilters = () => setAppliedFilters(filters);

  const clearFilters = () => {
    const empty = { search: "", status: "" };
    setFilters(empty);
    setAppliedFilters(empty);
  };

  const removeFilter = (key: string) => {
    setFilters((prev) => ({ ...prev, [key]: "" }));
    setAppliedFilters((prev) => ({ ...prev, [key]: "" }));
  };

  // Client-side search filter on invoice number / reference
  const filtered = invoices.filter((inv: any) => {
    if (!appliedFilters.search) return true;
    const q = appliedFilters.search.toLowerCase();
    return (
      inv.invoiceNumber?.toLowerCase().includes(q) ||
      inv.reference?.toLowerCase().includes(q) ||
      inv.shipment?.trackingNumber?.toLowerCase().includes(q)
    );
  });

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-end mb-4">
        <input
          value={filters.search}
          onChange={(e) => handleChange("search", e.target.value)}
          placeholder="Search Invoice No. / Reference / Tracking"
          className="border rounded-md p-2 text-sm min-w-[260px]"
        />
        <select
          value={filters.status}
          onChange={(e) => handleChange("status", e.target.value)}
          className="border rounded-md p-2 text-sm"
        >
          <option value="">All Status</option>
          <option value="PAID">Paid</option>
          <option value="PENDING">Pending</option>
          <option value="FAILED">Failed</option>
          <option value="REFUNDED">Refunded</option>
        </select>
        <button
          onClick={applyFilters}
          className="bg-red-600 text-white px-5 py-2 rounded-md flex gap-2 items-center text-sm"
        >
          Filter <Filter size={16} />
        </button>
        {Object.values(appliedFilters).some(Boolean) && (
          <button onClick={clearFilters} className="text-red-600 text-sm font-medium">
            Clear All
          </button>
        )}
      </div>

      {/* Applied Filters */}
      <div className="flex flex-wrap gap-2 items-center mb-4">
        {Object.entries(appliedFilters).map(([key, value]) =>
          value ? (
            <span
              key={key}
              className="flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-md text-sm"
            >
              {key}: {value}
              <button onClick={() => removeFilter(key)} className="text-red-500 hover:text-red-700">✕</button>
            </span>
          ) : null
        )}
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-12 text-gray-400 text-sm">
          Loading invoices...
        </div>
      )}

      {!isLoading && filtered.length === 0 && (
        <div className="flex items-center justify-center py-12 text-gray-400 text-sm">
          No invoices found
        </div>
      )}

      {!isLoading && filtered.length > 0 && (
        <AppTable columns={InvoiceColumns} data={filtered} />
      )}
    </div>
  );
}
