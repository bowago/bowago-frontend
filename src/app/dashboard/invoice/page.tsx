"use client";
import { useState } from "react";
import StatCard from "@/components/cards/StatCard";
import { ChevronDown, LucideReceiptText } from "lucide-react";
import InvoiceTableView from "@/components/layout/InvoiceTableView";
import { useGetInvoiceFinancialOverviewQuery } from "@/store/slice/apiSlice";

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 5 }, (_, i) => CURRENT_YEAR - i);

type InvoiceFinancialOverviewResponse = {
  data?: {
    summary?: {
      totalRevenueNaira?: number;
      paidInvoices?: number;
      pendingRevenueNaira?: number;
      pendingInvoices?: number;
      refundedNaira?: number;
      refundedCount?: number;
      currency?: string;
    };
  };
};

const formatMoney = (amount = 0, currency = "NGN") =>
  new Intl.NumberFormat("en-NG", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount);

export default function Page() {
  // Default to current month + year
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(MONTHS[now.getMonth()]);
  const [selectedYear, setSelectedYear] = useState(CURRENT_YEAR);
  const [monthOpen, setMonthOpen] = useState(false);
  const [yearOpen, setYearOpen] = useState(false);

  const { data, isLoading } = useGetInvoiceFinancialOverviewQuery();
  const overview = data as InvoiceFinancialOverviewResponse | undefined;
  const summary = overview?.data?.summary;
  const currency = summary?.currency ?? "NGN";

  return (
    <div className="pb-10">
      <div className="text-dashboard-heading">Invoice</div>
      <main className="flex-1 overflow-auto">
        <div>
          {/* Month + Year selectors */}
          <div className="flex items-center justify-end gap-2 mb-6">
            {/* Year selector */}
            <div className="relative">
              <button
                onClick={() => { setYearOpen(!yearOpen); setMonthOpen(false); }}
                className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-700 font-medium hover:bg-gray-50 transition-colors shadow-sm"
              >
                {selectedYear}
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${yearOpen ? "rotate-180" : ""}`} />
              </button>
              {yearOpen && (
                <div className="absolute right-0 top-full mt-1 w-28 bg-white border border-gray-100 rounded-xl shadow-xl z-20 overflow-hidden">
                  {YEARS.map((y) => (
                    <button
                      key={y}
                      onClick={() => { setSelectedYear(y); setYearOpen(false); }}
                      className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors ${y === selectedYear ? "text-[#e8432d] font-semibold bg-red-50" : "text-gray-700"}`}
                    >
                      {y}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Month selector */}
            <div className="relative">
              <button
                onClick={() => { setMonthOpen(!monthOpen); setYearOpen(false); }}
                className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-700 font-medium hover:bg-gray-50 transition-colors shadow-sm"
              >
                {selectedMonth}
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${monthOpen ? "rotate-180" : ""}`} />
              </button>
              {monthOpen && (
                <div className="absolute right-0 top-full mt-1 w-44 bg-white border border-gray-100 rounded-xl shadow-xl z-20 overflow-hidden max-h-64 overflow-y-auto">
                  {MONTHS.map((m) => (
                    <button
                      key={m}
                      onClick={() => { setSelectedMonth(m); setMonthOpen(false); }}
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
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
            <StatCard icon={<LucideReceiptText className="w-6 h-6 text-green-500" />} iconBg="bg-green-50"
              value={isLoading ? "..." : formatMoney(summary?.totalRevenueNaira, currency)}
              label="Total Revenue" trend={0} withTrend={false} delay={0} />
            <StatCard icon={<LucideReceiptText className="w-6 h-6 text-orange-500" />} iconBg="bg-orange-50"
              value={isLoading ? "..." : formatMoney(summary?.pendingRevenueNaira, currency)}
              label={`${summary?.pendingInvoices ?? 0} Pending Invoices`} trend={0} withTrend={false} delay={80} />
            <StatCard icon={<LucideReceiptText className="w-6 h-6 text-red-400" />} iconBg="bg-red-50"
              value={isLoading ? "..." : formatMoney(summary?.refundedNaira, currency)}
              label={`${summary?.refundedCount ?? 0} Refunds`} trend={0} withTrend={false} delay={160} />
            <StatCard icon={<LucideReceiptText className="w-6 h-6 text-blue-500" />} iconBg="bg-blue-50"
              value={isLoading ? "..." : String(summary?.paidInvoices ?? 0)}
              label="Paid Invoice Count" trend={0} withTrend={false} delay={240} />
          </div>

          <InvoiceTableView />
        </div>
      </main>
    </div>
  );
}
