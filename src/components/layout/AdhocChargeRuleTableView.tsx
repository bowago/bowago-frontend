"use client";

import { AppTable } from "@/components/table/Table";
import { useGetAdhocChargeRulesQuery } from "@/store/slice/apiSlice";
import { AdhocChargeRuleColumns } from "../table/columns/adhoc-charge-rule-column";

export default function AdhocChargeRuleTableView() {
  const { data, isLoading } = useGetAdhocChargeRulesQuery();
  const rules = (data as any)?.data?.rules ?? [];

  if (isLoading) return <p className="text-sm text-gray-400 py-6">Loading rules...</p>;
  if (rules.length === 0)
    return (
      <p className="text-sm text-gray-400 py-6 text-center">
        No suggestion rules yet. Create one to auto-apply or suggest a charge
        when a parcel&apos;s weight or volume crosses a threshold.
      </p>
    );

  return <AppTable columns={AdhocChargeRuleColumns} data={rules} />;
}
