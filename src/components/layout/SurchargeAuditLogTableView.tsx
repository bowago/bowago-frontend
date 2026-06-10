"use client";

import { AppTable } from "@/components/table/Table";
import { useGetSurchargeAuditLogQuery } from "@/store/slice/apiSlice";
import {
  SurchargeAuditLog,
  SurchargeAuditLogColumns,
} from "../table/columns/surcharge-audit-log-column";

type SurchargeAuditLogResponse = {
  data?: {
    logs?: SurchargeAuditLog[];
    auditLogs?: SurchargeAuditLog[];
    data?: SurchargeAuditLog[];
  };
};

const getAuditLogs = (response?: SurchargeAuditLogResponse) => {
  const payload = response?.data;

  if (!payload) return [];

  if (Array.isArray(payload.logs)) return payload.logs;
  if (Array.isArray(payload.auditLogs)) return payload.auditLogs;
  if (Array.isArray(payload.data)) return payload.data;

  return [];
};

export default function SurchargeAuditLogTableView() {
  const { data, isLoading } = useGetSurchargeAuditLogQuery({
    entityType: "Surcharge",
  });

  const auditLogs = getAuditLogs(data as SurchargeAuditLogResponse | undefined);

  return (
    <div>
      {isLoading && <div>...Loading surcharge audit log</div>}
      {!isLoading && (
        <AppTable columns={SurchargeAuditLogColumns} data={auditLogs} />
      )}
    </div>
  );
}
