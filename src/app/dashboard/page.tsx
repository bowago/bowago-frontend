"use client";

import { useState } from "react";
import Link from "next/link";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import StatCard from "@/components/cards/StatCard";
import ShipmentCard from "@/components/cards/ShipmentCard";
import ServiceDistribution from "@/components/charts/ServiceDistribution";
import ShipmentTrend from "@/components/charts/ShipmentTrend";
import TopRoutes from "@/components/List/TopRoute";
import { LoyaltyDashboardCard } from "@/components/layout/LoyaltyView";
import {
  ChevronDown,
  Clock,
  Package,
  PackagePlus,
  Route,
  Users,
  Wallet,
  Ticket,
  Truck,
} from "lucide-react";
import {
  useGetAdminDashboardQuery,
  useGetAdminShipmentsQuery,
  useGetUserShipmentsQuery,
  useGetInvoiceFinancialOverviewQuery,
  useGetAllTicketQuery,
} from "@/store/slice/apiSlice";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

type ShipmentItem = {
  id: string;
  trackingNumber: string;
  status: string;
  senderCity: string;
  recipientCity: string;
  quotedPrice: number;
  estimatedDelivery?: string;
};

function getShipmentList(data: any): ShipmentItem[] {
  const d = data?.data;
  if (Array.isArray(d)) return d.slice(0, 3);
  if (d?.shipments) return d.shipments.slice(0, 3);
  return [];
}

// ── Role helpers ───────────────────────────────────────────────────────────────
const SUPER = ["SUPER_ADMIN", "LOGISTICS_MANAGER"];
const isSuperRole = (s: string) => SUPER.includes(s);
const isDispatcher = (s: string) => s === "ROLE_DISPATCHER";
const isFinance = (s: string) => s === "ROLE_FINANCE";
const isAgent = (s: string) => s === "ROLE_AGENT";
const isMaster = (s: string) => s === "ROLE_MASTER";

export default function Page() {
  const [selectedMonth, setSelectedMonth] = useState(
    MONTHS[new Date().getMonth()],
  );
  const [monthOpen, setMonthOpen] = useState(false);

  const user = useSelector((s: RootState) => s.auth.user) as any;
  const role = user?.role;
  const subRole = user?.adminSubRole ?? "";

  const isCustomer = role === "CUSTOMER";
  const isAdmin = role === "ADMIN";
  const showRevenue =
    isAdmin && (isSuperRole(subRole) || subRole === "ROLE_ADMIN");
  const showCharts =
    isAdmin &&
    (isSuperRole(subRole) || subRole === "ROLE_ADMIN" || isDispatcher(subRole));
  const showUsers = isAdmin && isSuperRole(subRole);

  // ── Data fetching — skip what the role doesn't need ──────────────────────
  const { data: dashData, isLoading: dashLoading } = useGetAdminDashboardQuery(
    undefined,
    { skip: !isAdmin || isAgent(subRole) },
  );
  const { data: shipmentsData } = useGetAdminShipmentsQuery(
    {
      status:
        "PENDING,CONFIRMED,AWAITING_PICKUP,PICKED_UP,IN_TRANSIT,OUT_FOR_DELIVERY",
    },
    { skip: !isAdmin || isFinance(subRole) },
  );
  const { data: financeData } = useGetInvoiceFinancialOverviewQuery(undefined, {
    skip: !isFinance(subRole),
  });
  const { data: ticketData } = useGetAllTicketQuery({ status: "OPEN" } as any, {
    skip: !isAgent(subRole),
  });
  const { data: myData } = useGetUserShipmentsQuery({}, { skip: isAdmin });

  const stats = (dashData as any)?.data;
  const finStats = (financeData as any)?.data?.summary;
  const myShipments: any[] = (() => {
    const d = (myData as any)?.data;
    if (Array.isArray(d)) return d;
    return d?.shipments ?? [];
  })();

  const activeShipments = isAdmin
    ? getShipmentList(shipmentsData)
    : myShipments
        .filter(
          (s: any) =>
            !["DELIVERED", "CANCELLED", "RETURNED"].includes(s.status),
        )
        .slice(0, 3);

  const openTickets =
    (ticketData as any)?.data?.tickets?.length ??
    (ticketData as any)?.meta?.total ??
    0;

  // ── DISPATCHER view ───────────────────────────────────────────────────────
  if (isDispatcher(subRole)) {
    const total =
      (shipmentsData as any)?.meta?.total ??
      getShipmentList(shipmentsData).length ??
      0;
    const active = getShipmentList(shipmentsData);
    return (
      <div className="pb-10">
        <div className="text-dashboard-heading">Dashboard</div>
        <main className="flex-1 overflow-auto">
          <div className="grid grid-cols-2 xl:grid-cols-3 gap-4 mb-6 mt-4">
            <StatCard
              icon={<PackagePlus className="w-6 h-6 text-orange-500" />}
              iconBg="bg-orange-50"
              value={String(total)}
              label="Total Shipments"
              trend={0}
              trendPositive
              delay={0}
            />
            <StatCard
              icon={<Truck className="w-6 h-6 text-blue-500" />}
              iconBg="bg-blue-50"
              value={String(active.length)}
              label="Active Shipments"
              trend={0}
              trendPositive
              delay={80}
            />
            <StatCard
              icon={<Package className="w-6 h-6 text-green-500" />}
              iconBg="bg-green-50"
              value={String(stats?.shipments?.delivered ?? 0)}
              label="Delivered Today"
              trend={0}
              trendPositive
              delay={160}
            />
          </div>
          {showCharts && (
            <div className="grid grid-cols-12 gap-4 mb-6">
              <div className="col-span-7">
                <ShipmentTrend />
              </div>
              <div className="col-span-5">
                <TopRoutes />
              </div>
            </div>
          )}
          <ActiveShipmentsSection items={active} />
        </main>
      </div>
    );
  }

  // ── FINANCE view ──────────────────────────────────────────────────────────
  if (isFinance(subRole)) {
    return (
      <div className="pb-10">
        <div className="text-dashboard-heading">Dashboard</div>
        <main className="flex-1 overflow-auto mt-4">
          <div className="bg-gradient-to-r from-[#1F3A70] to-[#2E75B6] rounded-2xl p-5 mb-6 flex items-center justify-between text-white">
            <div>
              <p className="text-sm opacity-75">Total Revenue (All Time)</p>
              <p className="text-3xl font-bold mt-1">
                ₦{Number(finStats?.totalRevenueNaira ?? 0).toLocaleString()}
              </p>
            </div>
            <Wallet className="w-10 h-10 opacity-30" />
          </div>
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
            <StatCard
              icon={<Wallet className="w-6 h-6 text-green-500" />}
              iconBg="bg-green-50"
              value={`₦${Number(finStats?.pendingRevenueNaira ?? 0).toLocaleString()}`}
              label={`${finStats?.pendingInvoices ?? 0} Pending Invoices`}
              trend={0}
              trendPositive
              delay={0}
            />
            <StatCard
              icon={<Clock className="w-6 h-6 text-blue-500" />}
              iconBg="bg-blue-50"
              value={String(finStats?.paidInvoices ?? 0)}
              label="Paid Invoices"
              trend={0}
              trendPositive
              delay={80}
            />
            <StatCard
              icon={<Route className="w-6 h-6 text-red-400" />}
              iconBg="bg-red-50"
              value={`₦${Number(finStats?.refundedNaira ?? 0).toLocaleString()}`}
              label={`${finStats?.refundedCount ?? 0} Refunds`}
              trend={0}
              trendPositive
              delay={160}
            />
          </div>
        </main>
      </div>
    );
  }

  // ── AGENT view ────────────────────────────────────────────────────────────
  if (isAgent(subRole)) {
    return (
      <div className="pb-10">
        <div className="text-dashboard-heading">Dashboard</div>
        <main className="flex-1 overflow-auto mt-4">
          <div className="grid grid-cols-2 xl:grid-cols-3 gap-4 mb-6">
            <StatCard
              icon={<Ticket className="w-6 h-6 text-orange-500" />}
              iconBg="bg-orange-50"
              value={String(openTickets)}
              label="Open Tickets"
              trend={0}
              trendPositive
              delay={0}
            />
            <StatCard
              icon={<Package className="w-6 h-6 text-blue-500" />}
              iconBg="bg-blue-50"
              value={String(stats?.shipments?.total ?? 0)}
              label="Total Shipments"
              trend={0}
              trendPositive
              delay={80}
            />
          </div>
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 text-sm text-blue-700">
            Head to <strong>Support → All Tickets</strong> to manage customer
            tickets.
          </div>
        </main>
      </div>
    );
  }

  // ── MASTER (enterprise owner) view ────────────────────────────────────────
  if (isMaster(subRole)) {
    const total = getShipmentList(shipmentsData).length;
    const active = getShipmentList(shipmentsData);
    return (
      <div className="pb-10">
        <div className="text-dashboard-heading">Dashboard</div>
        <main className="flex-1 overflow-auto mt-4">
          <div className="grid grid-cols-2 xl:grid-cols-3 gap-4 mb-6">
            <StatCard
              icon={<PackagePlus className="w-6 h-6 text-orange-500" />}
              iconBg="bg-orange-50"
              value={String(total)}
              label="Company Shipments"
              trend={0}
              trendPositive
              delay={0}
            />
            <StatCard
              icon={<Package className="w-6 h-6 text-purple-500" />}
              iconBg="bg-purple-50"
              value={String(active.length)}
              label="Active Shipments"
              trend={0}
              trendPositive
              delay={80}
            />
          </div>
          <ActiveShipmentsSection items={active} />
        </main>
      </div>
    );
  }

  // ── CUSTOMER view ─────────────────────────────────────────────────────────
  if (isCustomer) {
    const total = myShipments.length;
    const pending = myShipments.filter(
      (s: any) => s.paymentStatus === "PENDING" || s.status === "PENDING",
    ).length;
    const delivered = myShipments.filter(
      (s: any) => s.status === "DELIVERED",
    ).length;
    const inTransit = myShipments.filter(
      (s: any) => ["IN_TRANSIT", "OUT_FOR_DELIVERY", "PICKED_UP"].includes(s.status),
    ).length;

    return (
      <div className="pb-10">
        <div className="text-dashboard-heading">Dashboard</div>
        <main className="flex-1 overflow-auto mt-4">
          {/* Stats row */}
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
            <StatCard
              icon={<PackagePlus className="w-6 h-6 text-orange-500" />}
              iconBg="bg-orange-50"
              value={String(total)}
              label="Total Shipments"
              trend={0}
              trendPositive
              delay={0}
            />
            <StatCard
              icon={<Truck className="w-6 h-6 text-blue-500" />}
              iconBg="bg-blue-50"
              value={String(inTransit)}
              label="In Transit"
              trend={0}
              trendPositive
              delay={60}
            />
            <StatCard
              icon={<Package className="w-6 h-6 text-purple-500" />}
              iconBg="bg-purple-50"
              value={String(pending)}
              label="Pending Payment"
              trend={0}
              trendPositive
              delay={80}
            />
            <StatCard
              icon={<Clock className="w-6 h-6 text-green-500" />}
              iconBg="bg-green-50"
              value={String(delivered)}
              label="Delivered"
              trend={0}
              trendPositive
              delay={160}
            />
          </div>

          {/* Two-column layout: active shipments + loyalty */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
            <div className="xl:col-span-2">
              <ActiveShipmentsSection items={activeShipments} />
              <div className="mt-4 text-right">
                <Link href="/dashboard/orders" className="text-sm text-brand hover:underline">
                  View full order history →
                </Link>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-600 mb-3">Loyalty Rewards</h3>
              <LoyaltyDashboardCard />
              <Link
                href="/dashboard/loyalty"
                className="flex items-center justify-center gap-1.5 mt-3 text-xs text-brand hover:underline"
              >
                View rewards & history →
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // ── SUPER_ADMIN / LOGISTICS_MANAGER / ROLE_ADMIN — full dashboard ─────────
  return (
    <div className="pb-10">
      <div className="text-dashboard-heading">Dashboard</div>
      <main className="flex-1 overflow-auto">
        <div>
          {/* Month picker */}
          <div className="flex items-center justify-end mb-6">
            <div className="relative">
              <button
                onClick={() => setMonthOpen(!monthOpen)}
                className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-700 font-medium hover:bg-gray-50 transition-colors shadow-sm"
              >
                {selectedMonth}
                <ChevronDown
                  className={`w-4 h-4 text-gray-400 transition-transform ${monthOpen ? "rotate-180" : ""}`}
                />
              </button>
              {monthOpen && (
                <div className="absolute right-0 top-full mt-1 w-44 bg-white border border-gray-100 rounded-xl shadow-xl z-20 overflow-hidden">
                  {MONTHS.map((m) => (
                    <button
                      key={m}
                      onClick={() => {
                        setSelectedMonth(m);
                        setMonthOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 ${m === selectedMonth ? "text-brand font-semibold bg-red-50" : "text-gray-700"}`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
            <StatCard
              icon={<PackagePlus className="w-6 h-6 text-orange-500" />}
              iconBg="bg-orange-50"
              value={dashLoading ? "..." : String(stats?.shipments?.total ?? 0)}
              label="Total Shipments"
              trend={0}
              trendPositive={true}
              delay={0}
            />
            <StatCard
              icon={<Package className="w-6 h-6 text-purple-500" />}
              iconBg="bg-purple-50"
              value={
                dashLoading ? "..." : String(stats?.shipments?.pending ?? 0)
              }
              label="Pending Shipments"
              trend={0}
              trendPositive={true}
              delay={80}
            />
            <StatCard
              icon={<Clock className="w-6 h-6 text-blue-400" />}
              iconBg="bg-blue-50"
              value={
                dashLoading ? "..." : String(stats?.shipments?.delivered ?? 0)
              }
              label="Delivered"
              trend={0}
              trendPositive={true}
              delay={160}
            />
            {showUsers && (
              <StatCard
                icon={<Users className="w-6 h-6 text-pink-400" />}
                iconBg="bg-pink-50"
                value={
                  dashLoading ? "..." : String(stats?.users?.customers ?? 0)
                }
                label="Customers"
                trend={0}
                trendPositive={true}
                delay={240}
              />
            )}
          </div>

          {/* Revenue banner — super admin and role_admin only */}
          {showRevenue && stats?.revenue && (
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

          {/* Charts */}
          {showCharts && (
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
          )}

          <ActiveShipmentsSection items={activeShipments} />
        </div>
      </main>
    </div>
  );
}

// ── Shared active shipments section ───────────────────────────────────────────
function ActiveShipmentsSection({ items }: { items: ShipmentItem[] }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-display font-bold text-gray-900">
          Active Shipments
        </h2>
        <button
          onClick={() => (window.location.href = "/dashboard/shipments")}
          className="text-sm font-semibold text-brand hover:underline"
        >
          See all
        </button>
      </div>
      {items.length === 0 ? (
        <div className="text-center py-12 text-gray-400 text-sm">
          No active shipments
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {items.map((s: ShipmentItem, i: number) => (
            <ShipmentCard
              key={s.id}
              id={s.trackingNumber}
              trackingId={s.trackingNumber}
              status={s.status as any}
              from={s.senderCity}
              to={s.recipientCity}
              progress={50}
              currentLocation={s.senderCity}
              estDelivery={
                s.estimatedDelivery
                  ? new Date(s.estimatedDelivery).toLocaleDateString("en-NG", {
                      dateStyle: "medium",
                    })
                  : "TBD"
              }
              delay={i * 80}
            />
          ))}
        </div>
      )}
    </div>
  );
}
