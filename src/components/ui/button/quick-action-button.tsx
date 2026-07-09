"use client";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ChevronDown, PlusCircle, Package, FileText, UserPlus, CreditCard, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import RequestQuoteModal from "@/components/modals/RequestQuoteModal";
import { useState } from "react";
import { useRouter } from "next/navigation";
import CreateShipmentModal from "@/components/modals/CreateShipmentModal";
import { ShipmentDraft } from "@/lib/shipmentDraft";

type Role = "ADMIN" | "ENTERPRISE" | "CUSTOMER";

interface QuickActionProps {
  role: Role | string;
}

export const QuickActionDropdown = ({ role }: QuickActionProps) => {
  const router = useRouter();
  const [isOpenQuote, setIsOpenQuote] = useState(false);
  const [isOpenShipment, setIsOpenShipment] = useState(false);
  // Prefill data passed from the quote modal → shipment modal
  const [shipmentPrefill, setShipmentPrefill] = useState<ShipmentDraft | null>(
    null,
  );

  // ── Internal BowaGo Administration — platform-wide admin actions only ──────
  const adminActions = [
    {
      label: "Add Rate",
      icon: <PlusCircle size={16} />,
      onClick: () => router.push("/dashboard/rate"),
    },
    {
      label: "Add Contract Rate",
      icon: <FileText size={16} />,
      onClick: () => router.push("/dashboard/rate"),
    },
    {
      label: "Add Zone",
      icon: <FileText size={16} />,
      onClick: () => router.push("/dashboard/rate/zones"),
    },
    {
      label: "Create Enterprise",
      icon: <UserPlus size={16} />,
      onClick: () => router.push("/dashboard/users"),
    },
  ];

  // ── Enterprise tenant — company shipment/team actions only, no platform
  // administration ────────────────────────────────────────────────────────
  const enterpriseActions = [
    {
      label: "Get Quote",
      icon: <FileText size={16} />,
      onClick: () => setIsOpenQuote(true),
    },
    {
      label: "Create Shipment",
      icon: <Package size={16} />,
      onClick: () => {
        setShipmentPrefill(null);
        setIsOpenShipment(true);
      },
    },
    {
      label: "Track Shipment",
      icon: <Truck size={16} />,
      onClick: () => router.push("/dashboard/shipments"),
    },
    {
      label: "Invite Team Member",
      icon: <UserPlus size={16} />,
      onClick: () => router.push("/dashboard/team"),
    },
    {
      label: "Pay Invoice",
      icon: <CreditCard size={16} />,
      onClick: () => router.push("/dashboard/invoice"),
    },
  ];

  // ── Customer — self-service shipping actions only ───────────────────────
  const customerActions = [
    {
      label: "Get Quote",
      icon: <FileText size={16} />,
      onClick: () => setIsOpenQuote(true),
    },
    {
      label: "Book Shipment",
      icon: <Package size={16} />,
      onClick: () => {
        setShipmentPrefill(null);
        setIsOpenShipment(true);
      },
    },
    {
      label: "Track Shipment",
      icon: <Truck size={16} />,
      onClick: () => router.push("/dashboard/shipments"),
    },
    {
      label: "View Invoice",
      icon: <CreditCard size={16} />,
      onClick: () => router.push("/dashboard/invoice"),
    },
  ];

  const actions =
    role === "ADMIN"
      ? adminActions
      : role === "ENTERPRISE"
        ? enterpriseActions
        : customerActions;

  const handleCreateShipmentFromQuote = (prefill: ShipmentDraft) => {
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
