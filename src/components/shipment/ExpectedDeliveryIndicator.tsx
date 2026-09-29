"use client";

import { AlertTriangle, Clock, CalendarCheck } from "lucide-react";

// ─── Pure timing calc ────────────────────────────────────────────────────────
// Never shown to customers — this is purely an internal ops signal for admins,
// dispatchers, and drivers deciding what needs attention right now. The
// customer already sees their own delivery estimate elsewhere; this is about
// giving staff a loud, at-a-glance "is this one at risk" read, not repeating
// the same information neutrally.
type Urgency = "overdue" | "dueSoon" | "dueTomorrow" | "onTrack";

const RESOLVED_STATUSES = new Set(["DELIVERED", "CANCELLED", "RETURNED", "FAILED"]);

function computeUrgency(estimatedDelivery: string | Date, now: Date): { urgency: Urgency; label: string } {
  const eta = new Date(estimatedDelivery).getTime();
  const diffMs = eta - now.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);

  if (diffHours < 0) {
    const overdueHours = Math.abs(diffHours);
    const days = Math.floor(overdueHours / 24);
    const label =
      days >= 1
        ? `Overdue by ${days} day${days === 1 ? "" : "s"}`
        : `Overdue by ${Math.max(1, Math.round(overdueHours))} hour${Math.round(overdueHours) === 1 ? "" : "s"}`;
    return { urgency: "overdue", label };
  }
  if (diffHours <= 24) {
    return { urgency: "dueSoon", label: diffHours <= 3 ? "Due within hours" : "Due today" };
  }
  if (diffHours <= 48) {
    return { urgency: "dueTomorrow", label: "Due tomorrow" };
  }
  const days = Math.ceil(diffHours / 24);
  return { urgency: "onTrack", label: `Expected in ${days} day${days === 1 ? "" : "s"}` };
}

const STYLES: Record<Urgency, { bg: string; icon: React.ElementType }> = {
  overdue: { bg: "bg-red-600 text-white border-red-700", icon: AlertTriangle },
  dueSoon: { bg: "bg-amber-500 text-white border-amber-600", icon: Clock },
  dueTomorrow: { bg: "bg-amber-100 text-amber-800 border-amber-200", icon: Clock },
  onTrack: { bg: "bg-gray-100 text-gray-600 border-gray-200", icon: CalendarCheck },
};

function formatDate(d: string | Date) {
  return new Date(d).toLocaleString("en-NG", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

export type ExpectedDeliveryIndicatorProps = {
  estimatedDelivery?: string | Date | null;
  status?: string;
  /** Present once the automatic SLA-breach sweep has already notified this
   * customer — lets staff see at a glance that an overdue shipment has
   * already been handled, instead of duplicating the alert. */
  delayAlert?: { alertedAt?: string | Date; reason?: string | null } | null;
  /** "banner" for a detail page/modal, "badge" for a compact table cell. */
  variant?: "banner" | "badge";
  className?: string;
};

/**
 * Staff-only: how much time is left before the customer's expected delivery
 * date, color-coded by risk — red once overdue, amber once due today/
 * tomorrow, neutral otherwise. Callers are responsible for the role gate
 * (this component has no opinion on who's allowed to see it); it renders
 * nothing when there's no estimate or the shipment is already resolved
 * (delivered/cancelled/returned/failed), since there's nothing to flag.
 *
 * Relates to the Delay Alert system (delayAlert.controller.js /
 * slaBreachScheduler.service.js): once a shipment goes overdue, an
 * automatic sweep notifies the customer and records a DelayAlert row. If
 * that has already happened, this shows "Customer already notified"
 * instead of implying a fresh, unhandled breach — and links to the Delay
 * Alerts page either way so staff can act (or double-check) in one click.
 */
export default function ExpectedDeliveryIndicator({
  estimatedDelivery,
  status,
  delayAlert,
  variant = "banner",
  className = "",
}: ExpectedDeliveryIndicatorProps) {
  if (!estimatedDelivery) return null;
  if (status && RESOLVED_STATUSES.has(status)) return null;

  const { urgency, label } = computeUrgency(estimatedDelivery, new Date());
  const { bg, icon: Icon } = STYLES[urgency];
  const alreadyAlerted = urgency === "overdue" && !!delayAlert;

  if (variant === "badge") {
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border ${bg} ${className}`}
        title={
          alreadyAlerted
            ? `Customer already notified of this delay${delayAlert?.reason ? `: ${delayAlert.reason}` : ""}`
            : `Customer's expected delivery: ${formatDate(estimatedDelivery)}`
        }
      >
        <Icon className="w-3 h-3" />
        {label}
        {alreadyAlerted && <span className="opacity-80">· notified</span>}
      </span>
    );
  }

  return (
    <div className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${bg} ${className}`}>
      <Icon className="w-5 h-5 shrink-0" />
      <div className="flex-1">
        <p className="text-sm font-semibold">{label}</p>
        <p className={`text-xs ${urgency === "onTrack" ? "text-gray-500" : "opacity-90"}`}>
          Customer&apos;s expected delivery: {formatDate(estimatedDelivery)} · staff-only view
        </p>
        {alreadyAlerted && (
          <p className="text-xs opacity-90 mt-0.5">
            ✓ Customer already notified{delayAlert?.alertedAt ? ` on ${formatDate(delayAlert.alertedAt)}` : ""}
            {delayAlert?.reason ? ` — ${delayAlert.reason}` : ""}
          </p>
        )}
      </div>
      {(urgency === "overdue" || urgency === "dueSoon") && (
        <a
          href="/dashboard/delay-alerts"
          className="text-xs font-semibold underline underline-offset-2 shrink-0 whitespace-nowrap"
        >
          {alreadyAlerted ? "View alerts" : "Send delay alert"}
        </a>
      )}
    </div>
  );
}
