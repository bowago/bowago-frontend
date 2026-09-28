"use client";

import { useEffect } from "react";
import { useGetShipmentModesQuery } from "@/store/slice/apiSlice";

export type ShipmentModeValue = "AIR" | "LAND" | "SEA";

export const MODE_META: Record<
  ShipmentModeValue,
  { label: string; blurb: string; transitFallback: string }
> = {
  AIR: { label: "Air", blurb: "Fastest, higher cost", transitFallback: "Fastest" },
  LAND: { label: "Land", blurb: "Balanced speed & cost", transitFallback: "Standard" },
  SEA: { label: "Sea", blurb: "Slowest, lowest cost", transitFallback: "Slowest" },
};

const ALL_MODES: ShipmentModeValue[] = ["AIR", "LAND", "SEA"];

/**
 * Modes an admin has left switched ON in Shipment Mode Settings — the single
 * source every quote/booking form should build its Mode picker from, so
 * deactivating a mode in the admin screen removes it everywhere at once.
 *
 * If the settings request fails we fall back to all three rather than
 * leaving the form with no modes at all; the server also rejects an inactive
 * mode (assertModeActive), so a stale option can never actually be booked.
 */
export function useActiveShipmentModes(
  current?: string,
  onCurrentInvalid?: (fallback: ShipmentModeValue) => void,
) {
  const { data, isLoading, isError } = useGetShipmentModesQuery();
  const rows: { mode: ShipmentModeValue; isActive: boolean; transitHoursDefault?: number | null }[] =
    (data as any)?.data?.modes ?? [];

  const active: ShipmentModeValue[] =
    isError || rows.length === 0
      ? ALL_MODES
      : ALL_MODES.filter((m) => rows.find((r) => r.mode === m)?.isActive !== false);

  const transitHours = (mode: string) =>
    rows.find((r) => r.mode === mode)?.transitHoursDefault ?? null;

  // If the currently selected mode was switched off, move to one that's on.
  useEffect(() => {
    if (isLoading || !onCurrentInvalid || active.length === 0) return;
    if (current && !active.includes(current as ShipmentModeValue)) {
      onCurrentInvalid(active.includes("LAND") ? "LAND" : active[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, current, active.join(",")]);

  return {
    modes: active,
    options: active.map((m) => ({
      value: m,
      label: MODE_META[m].label,
      description: MODE_META[m].blurb,
    })),
    isLoading,
    transitHours,
  };
}
