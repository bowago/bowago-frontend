"use client";

import ZonesRateManagementView from "@/components/layout/ZonesRateManagementView";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import AddZoneModal from "@/components/modals/AddZoneModal";

export default function Page() {
  const [isOpenCityModal, setIsOpenCityModal] = useState(false);

  return (
    <div className=" space-y-6">
      <div className="flex flex-row justify-between flex-1">
        <h1 className="dashboard-heading">All Zone</h1>

        <Button onClick={() => setIsOpenCityModal(true)}>Add New Zone</Button>
      </div>
      <ZonesRateManagementView />

      <AddZoneModal isOpen={isOpenCityModal} setIsOpen={setIsOpenCityModal} />
    </div>
  );
}
