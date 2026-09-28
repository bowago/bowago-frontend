"use client";

import { AppTable } from "@/components/table/Table";
import { useGetAdhocChargeTypesQuery } from "@/store/slice/apiSlice";
import { AdhocChargeTypeColumns } from "../table/columns/adhoc-charge-type-column";

export default function AdhocChargeTypeTableView() {
  const { data, isLoading } = useGetAdhocChargeTypesQuery();
  const chargeTypes = (data as any)?.data?.chargeTypes ?? [];

  if (isLoading) return <p className="text-sm text-gray-400 py-6">Loading charge types...</p>;
  if (chargeTypes.length === 0)
    return (
      <p className="text-sm text-gray-400 py-6 text-center">
        No adhoc charge types yet. Create one to start defining extra fees
        (oversize handling, storage, weekend pickup, etc).
      </p>
    );

  return <AppTable columns={AdhocChargeTypeColumns} data={chargeTypes} />;
}
