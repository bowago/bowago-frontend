"use client";

import CitiesRateManagementView from "@/components/layout/CitiesRateManagementView";
import ShipmentView from "@/components/layout/ShipmentView";
import AddCitiesModal from "@/components/modals/AddCitiesModal";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export default function Page() {
  const [isOpenCityModal, setIsOpenCityModal] = useState(false);

  return (
    <div className=" space-y-6">
      <div className="flex flex-row justify-between flex-1">
        <h1 className="dashboard-heading">All Cities</h1>

        <Button onClick={() => setIsOpenCityModal(true)}>Add New City</Button>
      </div>
      <CitiesRateManagementView />

      <AddCitiesModal isOpen={isOpenCityModal} setIsOpen={setIsOpenCityModal} />
    </div>
  );
}
