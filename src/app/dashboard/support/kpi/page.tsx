"use client";

import { useState } from "react";
import { useGetAgentKpiQuery } from "@/store/slice/apiSlice";
import {
  Clock,
  CheckCircle,
  Star,
  TrendingUp,
  AlertTriangle,
  RefreshCw,
  BarChart2,
  Users,
} from "lucide-react";

interface AgentKpi {
  agentId: string;
  agentName: string;
  totalTickets: number;
  resolvedTickets: number;
  escalatedTickets: number;
  resolutionRate: number;
  avgFirstResponseMinutes: number | null;
  avgResolutionMinutes: number | null;
  avgCsatScore: number | null;
  csatResponses: number;
}

interface KpiData {
  kpi: AgentKpi[];
  team: {
    totalTickets: number;
    totalResolved: number;
    totalEscalated: number;
    period: { from: string; to: string };
  };
}

function formatMinutes(min: number | null) {
  if (min == null) return "—";
  if (min < 60) return `${min}m`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function ScoreBadge({ score }: { score: number | null }) {
  if (score == null)
    return <span className="text-gray-400 text-xs">No data</span>;
  const color =
    score >= 4.5
      ? "text-green-600 bg-green-50"
      : score >= 3.5
        ? "text-yellow-600 bg-yellow-50"
        : "text-red-600 bg-red-50";
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${color}`}
    >
      <Star className="w-3 h-3 fill-current" />
      {score.toFixed(1)}
    </span>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color = "blue",
}: {
  icon: any;
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
}) {
  const colors: Record<string, string> = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-green-50 text-green-600",
    yellow: "bg-yellow-50 text-yellow-600",
    red: "bg-red-50 text-red-600",
  };
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
      <div className="flex items-center gap-3 mb-3">
        <div
          className={`w-9 h-9 rounded-xl flex items-center justify-center ${colors[color]}`}
        >
          <Icon className="w-4 h-4" />
        </div>
        <span className="text-sm text-gray-500 font-medium">{label}</span>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

export default function AgentKpiPage() {
  const [from, setFrom] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().slice(0, 10);
  });
  const [to, setTo] = useState(() => new Date().toISOString().slice(0, 10));

  const { data, isLoading, refetch } = useGetAgentKpiQuery({ from, to });
  const result: KpiData | undefined = data?.data;

  const team = result?.team;
  const kpi: AgentKpi[] = result?.kpi ?? [];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BarChart2 className="w-6 h-6 text-[#1F3A70]" />
            Agent KPI Dashboard
          </h1>
        </div>
        {/* Date filter */}
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <span className="text-gray-400 text-sm">to</span>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={() => refetch()}
            className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:text-gray-800 hover:bg-gray-50 transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Team totals */}
      {team && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatCard
            icon={Users}
            label="Total Tickets"
            value={team.totalTickets}
            color="blue"
          />
          <StatCard
            icon={CheckCircle}
            label="Resolved"
            value={team.totalResolved}
            color="green"
            sub={
              team.totalTickets > 0
                ? `${Math.round((team.totalResolved / team.totalTickets) * 100)}% resolution rate`
                : undefined
            }
          />
          <StatCard
            icon={AlertTriangle}
            label="Escalated"
            value={team.totalEscalated}
            color="red"
            sub="4-hour SLA breaches"
          />
          <StatCard
            icon={TrendingUp}
            label="SLA Adherence"
            color="yellow"
            value={
              team.totalTickets > 0
                ? `${Math.round(((team.totalTickets - team.totalEscalated) / team.totalTickets) * 100)}%`
                : "—"
            }
            sub="Tickets resolved before escalation"
          />
        </div>
      )}

      {/* Per-agent table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Per-Agent Breakdown</h2>
          <span className="text-xs text-gray-400">
            {kpi.length} agent{kpi.length !== 1 ? "s" : ""}
          </span>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-gray-400 text-sm">
            Loading KPI data...
          </div>
        ) : kpi.length === 0 ? (
          <div className="p-10 text-center">
            <BarChart2 className="w-10 h-10 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">
              No data for selected period.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-5 py-3 font-medium text-gray-600">
                    Agent
                  </th>
                  <th className="text-center px-4 py-3 font-medium text-gray-600">
                    Tickets
                  </th>
                  <th className="text-center px-4 py-3 font-medium text-gray-600">
                    Resolved
                  </th>
                  <th className="text-center px-4 py-3 font-medium text-gray-600">
                    <span title="First response time">1st Response</span>
                  </th>
                  <th className="text-center px-4 py-3 font-medium text-gray-600">
                    Resolution
                  </th>
                  <th className="text-center px-4 py-3 font-medium text-gray-600">
                    CSAT
                  </th>
                  <th className="text-center px-4 py-3 font-medium text-gray-600">
                    Escalated
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {kpi.map((agent) => {
                  // SLA flags
                  const responseOk =
                    agent.avgFirstResponseMinutes == null ||
                    agent.avgFirstResponseMinutes <= 60;
                  const resolutionOk =
                    agent.avgResolutionMinutes == null ||
                    agent.avgResolutionMinutes <= 120;
                  return (
                    <tr key={agent.agentId} className="hover:bg-gray-50/50">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#1F3A70]/10 flex items-center justify-center text-xs font-bold text-[#1F3A70]">
                            {agent.agentName
                              .split(" ")
                              .map((n) => n[0])
                              .slice(0, 2)
                              .join("")}
                          </div>
                          <span className="font-medium text-gray-900">
                            {agent.agentName}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center font-medium text-gray-700">
                        {agent.totalTickets}
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span
                          className={`font-medium ${agent.resolutionRate >= 80 ? "text-green-600" : "text-yellow-600"}`}
                        >
                          {agent.resolutionRate}%
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span
                          className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                            responseOk
                              ? "bg-green-50 text-green-600"
                              : "bg-red-50 text-red-500"
                          }`}
                        >
                          {formatMinutes(agent.avgFirstResponseMinutes)}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span
                          className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                            resolutionOk
                              ? "bg-green-50 text-green-600"
                              : "bg-red-50 text-red-500"
                          }`}
                        >
                          {formatMinutes(agent.avgResolutionMinutes)}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <div className="flex flex-col items-center gap-0.5">
                          <ScoreBadge score={agent.avgCsatScore} />
                          {agent.csatResponses > 0 && (
                            <span className="text-xs text-gray-400">
                              {agent.csatResponses} review
                              {agent.csatResponses !== 1 ? "s" : ""}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center">
                        {agent.escalatedTickets > 0 ? (
                          <span className="text-xs font-medium text-red-500 bg-red-50 px-2 py-0.5 rounded-full">
                            {agent.escalatedTickets}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">0</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* PRD SLA targets reference */}
      <div className="mt-4 flex flex-wrap gap-4 text-xs text-gray-400">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-green-400 inline-block" />
          First response target: &lt; 1h
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-green-400 inline-block" />
          Resolution target: &lt; 2h
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-yellow-400 inline-block" />
          CSAT target: ≥ 4 stars
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-red-400 inline-block" />
          Auto-escalation after 4h of inactivity
        </span>
      </div>
    </div>
  );
}
