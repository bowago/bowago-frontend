"use client";

import { AppTable } from "@/components/table/Table";
import { useGetAllTicketQuery, useGetMyTicketQuery } from "@/store/slice/apiSlice";
import { Filter } from "lucide-react";
import { useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import {
  Ticket,
  TicketColumns,
  TicketStatus,
} from "../table/columns/ticket-column";

type TicketsResponse =
  | Ticket[]
  | {
      data?: Ticket[] | { tickets?: Ticket[] };
      tickets?: Ticket[];
    };

const getTickets = (response?: TicketsResponse): Ticket[] => {
  if (!response) return [];
  if (Array.isArray(response)) return response;
  if (Array.isArray(response.data)) return response.data;
  if (response.data && "tickets" in response.data) {
    return response.data.tickets ?? [];
  }
  return response.tickets ?? [];
};

export default function TicketTableView() {
  const [filters, setFilters] = useState({
    search: "",
    region: "",
    state: "",
    status: "",
  });

  const [appliedFilters, setAppliedFilters] = useState(filters);

  const user = useSelector((s: RootState) => s.auth.user) as any;
  const isAdmin = user?.role === "ADMIN";

  const adminQuery = useGetAllTicketQuery(
    { status: appliedFilters.status || undefined },
    { skip: !isAdmin },
  );
  const customerQuery = useGetMyTicketQuery(
    { status: appliedFilters.status || undefined },
    { skip: isAdmin },
  );
  const { data, isLoading, isError } = isAdmin ? adminQuery : customerQuery;
  const tickets = getTickets(data as TicketsResponse | undefined);

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
      region: "",
      state: "",
      status: "",
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
          placeholder="Search Category ID"
          className="border rounded-md p-2"
        />
        <input
          value={filters.region}
          onChange={(e) => handleChange("region", e.target.value)}
          placeholder="Search name"
          className="border rounded-md p-2"
        />
        <input
          value={filters.state}
          onChange={(e) => handleChange("state", e.target.value)}
          placeholder="Weight"
          className="border rounded-md p-2"
        />
        <select
          value={filters.status}
          onChange={(e) => handleChange("status", e.target.value)}
          className="border rounded-md p-2"
        >
          <option value="">All Statuses</option>
          {(
            [
              "OPEN",
              "IN_PROGRESS",
              "RESOLVED",
              "CLOSED",
              "ESCALATED",
            ] satisfies TicketStatus[]
          ).map((status) => (
            <option key={status} value={status}>
              {status.toLowerCase().replaceAll("_", " ")}
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

      {isLoading && <div>...Loading all tickets</div>}
      {isError && (
        <div className="text-sm text-red-600">Unable to load tickets.</div>
      )}
      {/* Table */}
      <AppTable columns={TicketColumns} data={tickets} />
    </div>
  );
}
