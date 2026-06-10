"use client";
import TicketTableView from "@/components/layout/TicketTableView";
import AddTicketModal from "@/components/modals/AddTicketModal";
import { Plus } from "lucide-react";
import { useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";

export default function TicketsPage() {
  const [open, setOpen] = useState(false);
  const user = useSelector((s: RootState) => s.auth.user);
  const isAdmin = user?.role === "ADMIN";
  return (
    <div className="pb-10">
      <div className="flex items-center justify-between mb-6">
        <div className="text-dashboard-heading">
          {isAdmin ? "Support Tickets" : "My Tickets"}
        </div>
        {!isAdmin && (
          <button
            onClick={() => setOpen(true)}
            className="flex items-center gap-2 bg-brand text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-red-700 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" /> New Ticket
          </button>
        )}
      </div>
      <TicketTableView />
      <AddTicketModal isOpen={open} setIsOpen={setOpen} />
    </div>
  );
}
