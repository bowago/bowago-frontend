"use client";

import {
  Award,
  ChevronRight,
  Gem,
  Gift,
  Star,
  TrendingUp,
  Zap,
} from "lucide-react";
import { useGetMyLoyaltyQuery } from "@/store/slice/apiSlice";

const TIER_CONFIG: Record<
  string,
  { color: string; bg: string; border: string; icon: string; label: string }
> = {
  BRONZE: {
    color: "text-orange-700",
    bg: "bg-orange-50",
    border: "border-orange-200",
    icon: "Award",
    label: "Bronze",
  },
  SILVER: {
    color: "text-gray-600",
    bg: "bg-gray-50",
    border: "border-gray-300",
    icon: "Star",
    label: "Silver",
  },
  GOLD: {
    color: "text-yellow-700",
    bg: "bg-yellow-50",
    border: "border-yellow-300",
    icon: "Zap",
    label: "Gold",
  },
  PLATINUM: {
    color: "text-purple-700",
    bg: "bg-purple-50",
    border: "border-purple-300",
    icon: "Gem",
    label: "Platinum",
  },
};

const TX_TYPE_LABEL: Record<
  string,
  { label: string; color: string; sign: string }
> = {
  EARN: { label: "Earned", color: "text-green-600", sign: "+" },
  REDEEM: { label: "Redeemed", color: "text-orange-600", sign: "-" },
  ADJUST: { label: "Adjusted", color: "text-blue-600", sign: "±" },
  EXPIRE: { label: "Expired", color: "text-gray-400", sign: "-" },
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// ── Compact version for the dashboard ────────────────────────────────────────
export function LoyaltyDashboardCard() {
  const { data, isLoading } = useGetMyLoyaltyQuery();
  const loyalty = (data as any)?.data?.loyalty;
  if (isLoading || !loyalty) return null;

  const tier = TIER_CONFIG[loyalty.tier] ?? TIER_CONFIG.BRONZE;
  const progressPct =
    loyalty.pointsToNext > 0
      ? Math.round(
          ((loyalty.lifetimePoints -
            (loyalty.lifetimePoints -
              (loyalty.lifetimePoints % loyalty.pointsToNext))) /
            (loyalty.lifetimePoints + loyalty.pointsToNext)) *
            100,
        )
      : 100;

  return (
    <div className={`rounded-2xl border ${tier.border} ${tier.bg} p-5`}>
      {/* Tier Info */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {(() => {
            const icons: Record<string, any> = { Award, Star, Zap, Gem };
            const I = icons[tier?.icon] ?? Award;
            return <I className="w-5 h-5" />;
          })()}
          <div>
            <p className="text-xs text-gray-500">Loyalty Tier</p>
            <p className={`text-sm font-bold ${tier.color}`}>{tier.label}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-gray-800">
            {loyalty.points.toLocaleString()}
          </p>
          <p className="text-xs text-gray-500">points available</p>
        </div>
      </div>

      {loyalty.nextTier && (
        <div>
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>{loyalty.lifetimePoints.toLocaleString()} pts lifetime</span>
            <span>
              {loyalty.pointsToNext.toLocaleString()} to {loyalty.nextTier}
            </span>
          </div>
          <div className="h-1.5 bg-white/60 rounded-full overflow-hidden">
            <div
              className="h-full bg-current rounded-full transition-all"
              style={{
                width: `${Math.min(100, progressPct)}%`,
                color: tier.color,
              }}
            />
          </div>
        </div>
      )}

      {loyalty.currentMultiplier > 1 && (
        <div className="mt-3 flex items-center gap-1.5 text-xs text-gray-600">
          <Zap className="w-3 h-3 text-yellow-500" />
          <span className="font-medium">
            {loyalty.currentMultiplier}× earn rate
          </span>{" "}
          on all shipments
        </div>
      )}
    </div>
  );
}

// ── Full loyalty page content ─────────────────────────────────────────────────
export default function LoyaltyFullView() {
  const { data, isLoading } = useGetMyLoyaltyQuery();
  const loyalty = (data as any)?.data?.loyalty;

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 bg-gray-100 rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (!loyalty) return null;

  const tier = TIER_CONFIG[loyalty.tier] ?? TIER_CONFIG.BRONZE;
  const tiers = ["BRONZE", "SILVER", "GOLD", "PLATINUM"];
  const tierIdx = tiers.indexOf(loyalty.tier);

  return (
    <div className="space-y-6">
      {/* Hero card */}
      <div className={`rounded-2xl border-2 ${tier.border} ${tier.bg} p-6`}>
        <div className="flex items-start justify-between mb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              {(() => {
                const icons: Record<string, any> = { Award, Star, Zap, Gem };
                const I = icons[tier?.icon] ?? Award;
                return <I className="w-5 h-5" />;
              })()}
              <div>
                <p className={`text-xl font-bold ${tier.color}`}>
                  {tier.label} Member
                </p>
                <p className="text-xs text-gray-500">
                  {loyalty.lifetimePoints.toLocaleString()} lifetime points
                </p>
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-gray-800">
              {loyalty.points.toLocaleString()}
            </p>
            <p className="text-sm text-gray-500">points to spend</p>
          </div>
        </div>

        {/* Progress to next tier */}
        {loyalty.nextTier ? (
          <div>
            <div className="flex justify-between text-xs text-gray-600 mb-2">
              <span>{loyalty.tier}</span>
              <span className="font-medium">
                {loyalty.pointsToNext.toLocaleString()} pts to{" "}
                {loyalty.nextTier}
              </span>
            </div>
            <div className="h-2 bg-white/70 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${tier.color.replace(
                  "text-",
                  "bg-",
                )}`}
                style={{
                  width: `${Math.min(
                    100,
                    Math.round(
                      (loyalty.lifetimePoints /
                        (loyalty.lifetimePoints + loyalty.pointsToNext)) *
                        100,
                    ),
                  )}%`,
                }}
              />
            </div>
          </div>
        ) : (
          <p className="text-sm font-medium text-purple-600 flex items-center gap-1.5">
            <Gem className="w-4 h-4" /> You've reached the highest tier!
          </p>
        )}

        {loyalty.currentMultiplier > 1 && (
          <div className="mt-4 flex items-center gap-2 text-sm">
            <Zap className="w-4 h-4 text-yellow-500" />
            <span>
              You earn <strong>{loyalty.currentMultiplier}× points</strong> on
              every shipment as a {tier.label} member
            </span>
          </div>
        )}
      </div>

      {/* Tier roadmap */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">
          Tier Benefits
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {tiers.map((t, i) => {
            const tc = TIER_CONFIG[t];
            const isActive = t === loyalty.tier;
            const isPast = i < tierIdx;
            return (
              <div
                key={t}
                className={`rounded-xl border p-3 text-center ${
                  isActive
                    ? `${tc.border} ${tc.bg}`
                    : isPast
                      ? "bg-gray-50 border-gray-200 opacity-70"
                      : "bg-white border-gray-100"
                }`}
              >
                <div className="text-2xl mb-1">{tc.icon}</div>
                <p
                  className={`text-xs font-semibold ${isActive ? tc.color : "text-gray-600"}`}
                >
                  {tc.label}
                </p>
                <p className="text-[10px] text-gray-400 mt-0.5">
                  {t === "BRONZE"
                    ? "Start"
                    : t === "SILVER"
                      ? "500 pts"
                      : t === "GOLD"
                        ? "2,000 pts"
                        : "5,000 pts"}
                </p>
                <p
                  className={`text-[10px] font-medium mt-1 ${isActive ? tc.color : "text-gray-400"}`}
                >
                  {t === "BRONZE"
                    ? "1× earn"
                    : t === "SILVER"
                      ? "1.25× earn"
                      : t === "GOLD"
                        ? "1.5× earn"
                        : "2× earn"}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* How to earn */}
      <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-1.5">
          <Gift className="w-4 h-4 text-brand" /> How to earn & spend
        </h3>
        <div className="space-y-2 text-xs text-gray-600">
          <div className="flex items-start gap-2">
            <TrendingUp className="w-3.5 h-3.5 text-green-500 mt-0.5 flex-shrink-0" />
            <span>
              Earn 1 point for every ₦100 spent on delivered shipments.{" "}
              {loyalty.currentMultiplier > 1 &&
                `Your ${tier.label} tier gives you ${loyalty.currentMultiplier}× that.`}
            </span>
          </div>
          <div className="flex items-start gap-2">
            <Star className="w-3.5 h-3.5 text-orange-400 mt-0.5 flex-shrink-0" />
            <span>
              Spend points at checkout — 1 point = ₦1 discount. Minimum 50
              points per redemption.
            </span>
          </div>
          <div className="flex items-start gap-2">
            <Award className="w-3.5 h-3.5 text-purple-400 mt-0.5 flex-shrink-0" />
            <span>Points never expire as long as your account is active.</span>
          </div>
        </div>
      </div>

      {/* Recent transactions */}
      {loyalty.recentTransactions?.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">
            Recent Activity
          </h3>
          <div className="space-y-2">
            {loyalty.recentTransactions.map((tx: any) => {
              const txConfig = TX_TYPE_LABEL[tx.type] ?? TX_TYPE_LABEL.EARN;
              return (
                <div
                  key={tx.id}
                  className="flex items-center justify-between bg-white border border-gray-100 rounded-xl px-4 py-3"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-700 truncate">
                      {tx.description}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {formatDate(tx.createdAt)}
                    </p>
                  </div>
                  <div className="ml-3 text-right flex-shrink-0">
                    <p className={`text-sm font-semibold ${txConfig.color}`}>
                      {txConfig.sign}
                      {Math.abs(tx.points).toLocaleString()}
                    </p>
                    <p className="text-[10px] text-gray-400">
                      {txConfig.label}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
