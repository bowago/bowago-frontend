"use client";
import { useState } from "react";
import ShipmentCard from "@/components/cards/ShipmentCard";
import StatCard from "@/components/cards/StatCard";
import ServiceDistribution from "@/components/charts/ServiceDistribution";
import ShipmentTrend from "@/components/charts/ShipmentTrend";
import TopRoutes from "@/components/List/TopRoute";
import {
  ChevronDown,
  Clock,
  Package,
  PackagePlus,
  Route,
  Users,
} from "lucide-react";
import {
  useGetAdminDashboardQuery,
  useGetAdminShipmentsQuery,
  useGetUserShipmentsQuery,
} from "@/store/slice/apiSlice";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const CURRENT_MONTH = MONTHS[new Date().getMonth()];

type ShipmentItem = {
  id: string;
  trackingNumber: string;
  status: string;
  senderCity: string;
  recipientCity: string;
  quotedPrice: number;
  estimatedDelivery?: string;
};

export default function Page() {
  const [selectedMonth, setSelectedMonth] = useState(CURRENT_MONTH);
  const [open, setOpen] = useState(false);

  const user = useSelector((s: RootState) => s.auth.user);
  const isAdmin = user?.role === "ADMIN";

  // Admin gets full dashboard stats; customers get their own shipments count
  const { data: dashData, isLoading: dashLoading } = useGetAdminDashboardQuery(undefined, {
    skip: !isAdmin,
  });
  const { data: shipmentsData } = useGetAdminShipmentsQuery(
    // "Active" = anything still progressing toward delivery — not just
    // IN_TRANSIT. A freshly-booked PENDING shipment is just as "active"
    // from an operations standpoint and shouldn't be hidden here.
    { status: "PENDING,CONFIRMED,PICKED_UP,IN_TRANSIT,OUT_FOR_DELIVERY" },
    { skip: !isAdmin }
  );

  // Customers query their own shipments for the stats cards
  const { data: myShipmentData } = useGetUserShipmentsQuery({}, { skip: isAdmin });
  const myShipments: any[] = (() => {
    const d = (myShipmentData as any)?.data;
    if (Array.isArray(d)) return d;
    if (d?.shipments) return d.shipments;
    return [];
  })();

  const myTotal = myShipments.length;
  const myPending = myShipments.filter((s: any) => s.status === "PENDING" || s.paymentStatus === "PENDING").length;
  const myDelivered = myShipments.filter((s: any) => s.status === "DELIVERED").length;

  const stats = dashData?.data;
  const activeShipments: ShipmentItem[] = (() => {
    if (!isAdmin) {
      // Customer: show their own non-delivered shipments
      return myShipments
        .filter((s: any) => !["DELIVERED", "CANCELLED", "RETURNED"].includes(s.status))
        .slice(0, 3);
    }
    if (!shipmentsData) return [];
    const d = (shipmentsData as any)?.data;
    if (Array.isArray(d)) return d.slice(0, 3);
    if (d?.shipments) return d.shipments.slice(0, 3);
    return [];
  })();

  return (
    <div className="pb-10">
      <div className="text-dashboard-heading">Dashboard</div>
      <main className="flex-1 overflow-auto">
        <div>
          {/* Month selector */}
          <div className="flex items-center justify-end mb-6">
            <div className="relative">
              <button
                onClick={() => setOpen(!open)}
                className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-700 font-medium hover:bg-gray-50 transition-colors shadow-sm"
              >
                {selectedMonth}
                <ChevronDown
                  className={`w-4 h-4 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`}
                />
              </button>
              {open && (
                <div className="absolute right-0 top-full mt-1 w-44 bg-white border border-gray-100 rounded-xl shadow-xl z-20 overflow-hidden">
                  {MONTHS.map((m) => (
                    <button
                      key={m}
                      onClick={() => { setSelectedMonth(m); setOpen(false); }}
                      className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors ${m === selectedMonth ? "text-[#e8432d] font-semibold bg-red-50" : "text-gray-700"}`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
            <StatCard
              icon={<PackagePlus className="w-6 h-6 text-orange-500" />}
              iconBg="bg-orange-50"
              value={isAdmin ? (dashLoading ? "..." : String(stats?.shipments?.total ?? 0)) : String(myTotal)}
              label="Total Shipments"
              trend={0}
              trendPositive={true}
              delay={0}
            />
            <StatCard
              icon={<Package className="w-6 h-6 text-purple-500" />}
              iconBg="bg-purple-50"
              value={isAdmin ? (dashLoading ? "..." : String(stats?.shipments?.pending ?? 0)) : String(myPending)}
              label="Pending Shipments"
              trend={0}
              trendPositive={true}
              delay={80}
            />
            <StatCard
              icon={<Clock className="w-6 h-6 text-blue-400" />}
              iconBg="bg-blue-50"
              value={isAdmin ? (dashLoading ? "..." : String(stats?.shipments?.delivered ?? 0)) : String(myDelivered)}
              label="Delivered"
              trend={0}
              trendPositive={true}
              delay={160}
            />
            <StatCard
              icon={<Users className="w-6 h-6 text-pink-400" />}
              iconBg="bg-pink-50"
              value={dashLoading ? "..." : String(stats?.users?.customers ?? 0)}
              label="Customers"
              trend={0}
              trendPositive={true}
              delay={240}
            />
          </div>

          {/* Revenue banner (admin only) */}
          {isAdmin && stats?.revenue && (
            <div className="bg-gradient-to-r from-[#1F3A70] to-[#2E75B6] rounded-2xl p-5 mb-6 flex items-center justify-between text-white">
              <div>
                <p className="text-sm opacity-75">Total Revenue (All Time)</p>
                <p className="text-3xl font-bold mt-1">
                  ₦{Number(stats.revenue.total).toLocaleString()}
                </p>
              </div>
              <Route className="w-10 h-10 opacity-30" />
            </div>
          )}

          {/* Charts row */}
          <div className="grid grid-cols-12 gap-4 mb-6">
            <div className="col-span-4">
              <ServiceDistribution />
            </div>
            <div className="col-span-5">
              <ShipmentTrend />
            </div>
            <div className="col-span-3">
              <TopRoutes />
            </div>
          </div>

          {/* Active Shipments */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-display font-bold text-gray-900">
                Active Shipments
              </h2>
              <button
                onClick={() => window.location.href = "/dashboard/shipments"}
                className="text-sm font-semibold text-[#e8432d] hover:underline transition-all"
              >
                See all
              </button>
            </div>
            {activeShipments.length === 0 ? (
              <div className="text-center py-12 text-gray-400 text-sm">
                No active shipments
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {activeShipments.map((s: ShipmentItem, i: number) => (
                  <ShipmentCard
                    key={s.id}
                    id={s.trackingNumber}
                    trackingId={s.trackingNumber}
                    status={s.status as any}
                    from={s.senderCity}
                    to={s.recipientCity}
                    progress={50}
                    currentLocation={s.senderCity}
                    estDelivery={s.estimatedDelivery
                      ? new Date(s.estimatedDelivery).toLocaleDateString("en-NG", { dateStyle: "medium" })
                      : "TBD"}
                    delay={i * 80}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
