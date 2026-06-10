"use client";

import { AppTable } from "@/components/table/Table";
import { useGetAuditTrailQuery } from "@/store/slice/apiSlice";
import { useState } from "react";

import { ZoneColumns } from "../table/columns/zone-column";

export default function AuditTrailTableView() {
  const [filters, setFilters] = useState({
    fromCity: "",
    toCity: "",
  });

  const [appliedFilters, setAppliedFilters] = useState(filters);

  const { data, isLoading } = useGetAuditTrailQuery({});

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
      fromCity: "",
      toCity: "",
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
      {isLoading && <div>...Loading all audit </div>}
      {/* Table */}
      {data?.data?.logs && (
        <AppTable columns={ZoneColumns} data={data?.data?.logs} />
      )}
    </div>
  );
}
