"use client";

import ShipmentModeSettingsView from "@/components/layout/ShipmentModeSettingsView";

export default function Page() {
  return (
    <div className="space-y-6">
      <div className="flex flex-row justify-between flex-1">
        <h1 className="dashboard-heading">Shipment Modes</h1>
      </div>
      <ShipmentModeSettingsView />
    </div>
  );
}
