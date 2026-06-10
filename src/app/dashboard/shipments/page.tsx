"use client";

import AdminShipmentView from "@/components/layout/AdminShipmentView";
import ShipmentView from "@/components/layout/ShipmentView";
import CreateShipmentModal from "@/components/modals/CreateShipmentModal";
import { Button } from "@/components/ui/button";
import { useAppSelector } from "@/hooks/useStore";
import { useState } from "react";

export default function ShipmentsPage() {
  const userRole = useAppSelector((state) => state.auth.user?.role);

  const [isOpenBoxModal, setIsOpenBoxModal] = useState(false);

  return (
    <div className=" space-y-6">
      <div className="flex flex-row justify-between flex-1">
        <h1 className="dashboard-heading">Shipments</h1>

        {userRole === "CUSTOMER" && (
          <Button onClick={() => setIsOpenBoxModal(true)}>
            Create Shipment
          </Button>
        )}
      </div>
      {userRole === "ADMIN" ? <AdminShipmentView /> : <ShipmentView />}
      <CreateShipmentModal
        isOpen={isOpenBoxModal}
        setIsOpen={setIsOpenBoxModal}
      />
    </div>
  );
}
