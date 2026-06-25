"use client";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ChevronDown, PlusCircle, Package, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import RequestQuoteModal from "@/components/modals/RequestQuoteModal";
import { useState } from "react";
import CreateShipmentModal from "@/components/modals/CreateShipmentModal";

type Role = "ADMIN" | "CUSTOMER";

interface QuickActionProps {
  role: Role | string;
}

export const QuickActionDropdown = ({ role }: QuickActionProps) => {
  const [isOpenQuote, setIsOpenQuote]       = useState(false);
  const [isOpenShipment, setIsOpenShipment] = useState(false);
  // Prefill data passed from the quote modal → shipment modal
  const [shipmentPrefill, setShipmentPrefill] = useState<{
    fromCity?: string;
    toCity?: string;
  } | null>(null);

  const adminActions = [
    { label: "Add Rate",          icon: <PlusCircle size={16} />, onClick: () => console.log("Add Rate") },
    { label: "Add Contract Rate", icon: <FileText size={16} />,   onClick: () => console.log("Add Contract Rate") },
    { label: "Add Promo Rate",    icon: <FileText size={16} />,   onClick: () => console.log("Add Promo Rate") },
  ];

  const customerActions = [
    { label: "Get Quote",    icon: <FileText size={16} />, onClick: () => setIsOpenQuote(true) },
    { label: "Add Shipment", icon: <Package size={16} />,  onClick: () => { setShipmentPrefill(null); setIsOpenShipment(true); } },
  ];

  const actions = role === "ADMIN" ? adminActions : customerActions;

  const handleCreateShipmentFromQuote = (prefill: { fromCity: string; toCity: string }) => {
    setShipmentPrefill(prefill);
    setIsOpenShipment(true);
  };

  return (
    <>
      <Popover>
        <PopoverTrigger asChild>
          <Button className="flex items-center gap-2">
            Quick Action
            <ChevronDown size={16} />
          </Button>
        </PopoverTrigger>

        <PopoverContent align="end" className="w-56 p-2 rounded-xl shadow-lg">
          <div className="flex flex-col gap-1">
            {actions.map((action, i) => (
              <button
                key={i}
                onClick={action.onClick}
                className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-gray-100 transition-colors"
              >
                {action.icon}
                {action.label}
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>

      <RequestQuoteModal
        isOpen={isOpenQuote}
        setIsOpen={setIsOpenQuote}
        onCreateShipment={handleCreateShipmentFromQuote}
      />

      <CreateShipmentModal
        isOpen={isOpenShipment}
        setIsOpen={setIsOpenShipment}
        initialValue={shipmentPrefill}
      />
    </>
  );
};
