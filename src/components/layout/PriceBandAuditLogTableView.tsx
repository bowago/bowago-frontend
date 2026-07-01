"use client";

import { AppTable } from "@/components/table/Table";
import { useGetPriceBandAuditLogQuery } from "@/store/slice/apiSlice";
import {
  PriceBandAuditLog,
  PriceBandAuditLogColumns,
} from "../table/columns/price-band-audit-log-column";

type AuditLogResponse = {
  data?: {
    logs?: PriceBandAuditLog[];
  };
};

export default function PriceBandAuditLogTableView() {
  const { data, isLoading, isError } = useGetPriceBandAuditLogQuery({});

  const logs = (data as AuditLogResponse | undefined)?.data?.logs ?? [];

  if (isLoading) return <div className="text-sm text-gray-500 py-6">Loading rate version history...</div>;
  if (isError) return <div className="text-sm text-red-500 py-6">Unable to load rate version history.</div>;

  return (
    <div>
      {logs.length === 0 ? (
        <div className="text-sm text-gray-400 py-10 text-center border rounded-xl">
          No rate changes have been recorded yet. Edits to price bands will
          appear here as versions, each with a rollback option.
        </div>
      ) : (
        <AppTable columns={PriceBandAuditLogColumns} data={logs} />
      )}
    </div>
  );
}
