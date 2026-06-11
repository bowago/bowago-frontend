/**
 * nigeria-states.ts
 * Single source of truth for all Nigerian states + FCT, their regions,
 * and helper utilities.
 *
 * Usage:
 *   import { ALL_STATES, NIGERIAN_REGIONS, REGION_STATES,
 *            STATE_TO_REGION, stateOptions, regionOptions,
 *            statesForRegion } from "@/lib/nigeria-states";
 */

// ─── Core data ─────────────────────────────────────────────────────────────────

export const REGION_STATES: Record<string, string[]> = {
  "North Central": [
    "Benue",
    "FCT",
    "Kogi",
    "Kwara",
    "Nasarawa",
    "Niger",
    "Plateau",
  ],
  "North East": [
    "Adamawa",
    "Bauchi",
    "Borno",
    "Gombe",
    "Taraba",
    "Yobe",
  ],
  "North West": [
    "Jigawa",
    "Kaduna",
    "Kano",
    "Katsina",
    "Kebbi",
    "Sokoto",
    "Zamfara",
  ],
  "South East": [
    "Abia",
    "Anambra",
    "Ebonyi",
    "Enugu",
    "Imo",
  ],
  "South South": [
    "Akwa Ibom",
    "Bayelsa",
    "Cross River",
    "Delta",
    "Edo",
    "Rivers",
  ],
  "South West": [
    "Ekiti",
    "Lagos",
    "Ogun",
    "Ondo",
    "Osun",
    "Oyo",
  ],
};

/** All 36 states + FCT, sorted alphabetically */
export const ALL_STATES: string[] = Object.values(REGION_STATES)
  .flat()
  .sort((a, b) => a.localeCompare(b));

/** All 6 geopolitical regions */
export const NIGERIAN_REGIONS: string[] = Object.keys(REGION_STATES);

/** Reverse map: state name → region name */
export const STATE_TO_REGION: Record<string, string> = Object.entries(
  REGION_STATES,
).reduce<Record<string, string>>((acc, [region, states]) => {
  states.forEach((s) => (acc[s] = region));
  return acc;
}, {});

// ─── Pre-built option arrays (label + value) ───────────────────────────────────

/** Flat list of all states as select options */
export const stateOptions: { label: string; value: string }[] =
  ALL_STATES.map((s) => ({ label: s, value: s }));

/** All regions as select options */
export const regionOptions: { label: string; value: string }[] =
  NIGERIAN_REGIONS.map((r) => ({ label: r, value: r }));

// ─── Helper functions ──────────────────────────────────────────────────────────

/**
 * Returns state options filtered to a given region.
 * Pass `null` or `""` to get all states.
 */
export function statesForRegion(
  region: string | null | undefined,
): { label: string; value: string }[] {
  if (!region) return stateOptions;
  const states = REGION_STATES[region] ?? [];
  return states.map((s) => ({ label: s, value: s }));
}

/**
 * Given a state name, returns its geopolitical region.
 * Returns `""` if not found.
 */
export function getRegionForState(state: string): string {
  return STATE_TO_REGION[state] ?? "";
}
