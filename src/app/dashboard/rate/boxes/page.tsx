"use client";

import BoxesRateManagementView from "@/components/layout/BoxesRateManagementView";
import CitiesRateManagementView from "@/components/layout/CitiesRateManagementView";
import ShipmentView from "@/components/layout/ShipmentView";
import AddBoxDimensionModal from "@/components/modals/AddBoxDimensionModal";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export default function Page() {
  const [isOpenBoxModal, setIsOpenBoxModal] = useState(false);

  return (
    <div className=" space-y-6">
      <div className="flex flex-row justify-between flex-1">
        <h1 className="dashboard-heading">All Boxes</h1>

        <Button onClick={() => setIsOpenBoxModal(true)}>Add New Box</Button>
      </div>
      <BoxesRateManagementView />

      <AddBoxDimensionModal
        isOpen={isOpenBoxModal}
        setIsOpen={setIsOpenBoxModal}
      />
    </div>
  );
}
