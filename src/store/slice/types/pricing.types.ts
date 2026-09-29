// ─── pricing.types.ts ─────────────────────────────────────────────────────────
// Types for the offering-based pricing domain. A "shipping option" is always a
// (shipmentMode, serviceType) pair — combinations BowaGO does not operate do
// not exist, so nothing here should build its own mode × service grid.
//
// These mirror src/services/pricing/core.js#evaluateOffering and
// src/services/quoteSnapshot.js on the backend — keep them in sync.

export type ShipmentMode = "AIR" | "LAND" | "SEA";
export type ServiceType = "EXPRESS" | "STANDARD" | "ECONOMY";
export type PricingMode = "STANDARD" | "CONTRACT" | "PROMO";

export type DeliveryEstimate = {
  minDays: number;
  maxDays: number;
  label: string;
  source: "CONFIGURED" | "SNAPSHOT";
} | null;

export type PriceLine = {
  type: string;
  label: string;
  description?: string | null;
  amount: number;
  amountKobo?: number;
  vatApplicable?: boolean;
  category: "SURCHARGE" | "ADHOC" | "TAX" | "INSURANCE";
};

export type AppliedDiscount = {
  type: "CONTRACT_FIXED" | "CONTRACT_PERCENT" | "PROMO_FLAT" | "PROMO_PERCENT" | string;
  label: string;
  originalPrice?: number;
  discountAmount: number;
  discountPercent?: number;
} | null;

export type PromoStatus = {
  status: "APPLIED" | "NOT_APPLICABLE" | "BELOW_MIN_ORDER" | "SKIPPED_CONTRACT";
  message?: string;
} | null;

// Explicit, render-ready price components. Never reconstruct a subtotal by
// subtracting one of these from `totalNaira` — every component is provided.
export type PricingBlock = {
  standardBasePriceNaira: number;
  commercialAdjustmentNaira: number;
  basePriceNaira: number;
  surchargeTotalNaira: number;
  adhocTotalNaira: number;
  insurancePremiumNaira: number | null;
  taxNaira: number;
  totalNaira: number;
  // Deprecated aliases, kept for older screens:
  fuelSurchargeNaira?: number;
  remoteAreaFeeNaira?: number;
  adhocChargesNaira?: number;
  vatNaira?: number;
  basePriceKobo?: number;
  totalPriceKobo?: number;
};

// A single priced, purchasable shipping option — the unit the offerings
// endpoint and a persisted quote both render.
export type ShippingOffering = {
  available: true;
  offeringId: string | null;
  shipmentMode: ShipmentMode;
  serviceType: ServiceType;
  displayName: string;
  zone?: number;
  billableWeightKg: number;
  deliveryEstimate: DeliveryEstimate;
  pricingMode: PricingMode;
  appliedDiscount: AppliedDiscount;
  promoStatus: PromoStatus;
  basePrice: number;
  finalBasePrice: number;
  surchargeTotal: number;
  adhocTotal: number;
  insurancePremium: number;
  tax: number;
  total: number;
  currency: "NGN";
  surchargeBreakdown: PriceLine[];
  requiresDangerousGoodsNotice?: boolean;
};

export type UnavailableOffering = {
  available: false;
  offeringId: string | null;
  shipmentMode: ShipmentMode;
  serviceType: ServiceType;
  displayName: string;
  reasonCode:
    | "NOT_OFFERED"
    | "MODE_INACTIVE"
    | "OFFERING_INACTIVE"
    | "LANE_UNAVAILABLE"
    | "WEIGHT_BELOW_MIN"
    | "WEIGHT_ABOVE_MAX"
    | "DIMENSION_LIMIT"
    | "NO_SLA"
    | "NO_RATE";
  reason: string;
};

export type RouteInfo = {
  zone: number;
  distanceKm: number | null;
  fromCity: { id: string; name: string; region?: string; state?: string };
  toCity: { id: string; name: string; region?: string; state?: string };
};

// POST /quotes/offerings response — every real option for a route + parcel.
export type GetOfferingsRequest = {
  originCity: string;
  destinationCity: string;
  weightKg?: number;
  tons?: number;
  cartons?: number;
  boxDimensionId?: string;
  lengthCm?: number;
  widthCm?: number;
  heightCm?: number;
  insuranceSelected?: boolean;
  declaredValue?: number;
  promoCode?: string;
  // Optional filters — omit both to see every operated option.
  shipmentMode?: ShipmentMode;
  serviceType?: ServiceType;
};

export type GetOfferingsResponse = {
  route: RouteInfo;
  billableWeightKg: number | null;
  offerings: ShippingOffering[];
  unavailable: UnavailableOffering[];
};

// POST /quotes — persists ONE product as a 15-minute-TTL quote.
export type GenerateQuoteRequest = {
  originCity: string;
  destinationCity: string;
  weightKg?: number;
  tons?: number;
  cartons?: number;
  boxDimensionId?: string;
  lengthCm?: number;
  widthCm?: number;
  heightCm?: number;
  // Provide either the pair, or offeringId (from a prior offerings call).
  shipmentMode?: ShipmentMode;
  serviceType?: ServiceType;
  offeringId?: string;
  insuranceSelected?: boolean;
  declaredValue: number;
  promoCode?: string;
  termsAccepted: true;
};

export type GenerateQuoteResponse = {
  quoteId: string;
  status: "GENERATED";
  expiresAt: string;
  expiresInSeconds: number;
  origin: { city: string; id: string };
  destination: { city: string; id: string };
  zone: number;
  distanceKm: number | null;
  offeringId: string | null;
  shipmentMode: ShipmentMode;
  serviceType: ServiceType;
  displayName: string;
  deliveryEstimate: DeliveryEstimate;
  billableWeightKg: number;
  requiresDangerousGoodsNotice: boolean;
  declaredValueNaira: number;
  pricing: PricingBlock;
  surcharges: PriceLine[];
  adhocCharges: Array<{
    chargeTypeId: string;
    name: string;
    reason?: string | null;
    amountKobo: number;
    amountNaira: number;
    vatApplicable: boolean;
  }>;
  adhocSuggestionsPending: number;
  surchargeBreakdown: PriceLine[];
  pricingMode: PricingMode;
  appliedDiscount: AppliedDiscount;
  promoStatus: PromoStatus;
  currency: "NGN";
};

// ── Delivery SLA (zone × shipmentMode × serviceType) ──────────────────────────
export type DeliverySLARow = {
  id: string;
  zone: number;
  shipmentMode: ShipmentMode;
  serviceType: ServiceType;
  minDays: number;
  maxDays: number;
  label: string;
};

export type UpsertDeliverySLARequest = {
  zone: number;
  shipmentMode: ShipmentMode;
  serviceType: ServiceType;
  minDays: number;
  maxDays: number;
  reason?: string;
};

// ── Shipment mode settings (PHYSICAL characteristics only — never a delivery
// promise; that lives in DeliverySLA) ─────────────────────────────────────────
export type ShipmentModeSetting = {
  mode: ShipmentMode;
  isActive: boolean;
  volumetricDivisor: number;
  maxWeightKg: number | null;
  maxLongestSideCm: number | null;
  notes: string | null;
};

export type UpdateShipmentModeRequest = {
  mode: ShipmentMode;
  isActive?: boolean;
  volumetricDivisor?: number;
  maxWeightKg?: number | null;
  maxLongestSideCm?: number | null;
  notes?: string | null;
  reason?: string;
};

// ── Service offerings (admin) — the real, purchasable products ───────────────
export type OfferingLane = {
  id: string;
  offeringId: string;
  fromCityId?: string | null;
  toCityId?: string | null;
  zone?: number | null;
  isAvailable: boolean;
  reason?: string | null;
};

export type OfferingCoverageRow = {
  zone: number;
  hasSla: boolean;
  sla: { id: string; minDays: number; maxDays: number; label: string } | null;
  hasRate: boolean;
  rateBandCount: number;
  sellable: boolean;
  missing: Array<"RATE" | "SLA">;
};

export type ServiceOffering = {
  id: string;
  shipmentMode: ShipmentMode;
  serviceType: ServiceType;
  displayName: string | null;
  description: string | null;
  isActive: boolean;
  allowsNoSla: boolean;
  minWeightKg: number | null;
  maxWeightKg: number | null;
  maxLongestSideCm: number | null;
  minChargeNaira: number | null;
  sortOrder: number;
  notes: string | null;
  lanes: OfferingLane[];
  coverage: {
    zones: number;
    sellableZones: number;
    missingSla: number[];
    missingRate: number[];
  };
};

export type CreateOfferingRequest = {
  shipmentMode: ShipmentMode;
  serviceType: ServiceType;
  displayName?: string;
  description?: string;
  isActive?: boolean;
  allowsNoSla?: boolean;
  minWeightKg?: number | null;
  maxWeightKg?: number | null;
  maxLongestSideCm?: number | null;
  minChargeNaira?: number | null;
  sortOrder?: number;
  notes?: string;
  reason?: string;
};

export type UpdateOfferingRequest = { id: string } & Partial<Omit<CreateOfferingRequest, "shipmentMode" | "serviceType">>;

export type AddOfferingLaneRequest = {
  offeringId: string;
  fromCityId?: string;
  toCityId?: string;
  zone?: number;
  isAvailable?: boolean;
  reason?: string;
};

export type RateWarning = {
  code: "AIR_CHEAPER_THAN_LAND" | "SEA_DEARER_THAN_AIR" | "SEA_DEARER_THAN_LAND";
  zone: number;
  serviceType: ServiceType;
  probeKg: number;
  message: string;
};

// ── Contract (negotiated) rates — explicit mode/service scope, several per user
export type ContractRate = {
  id: string;
  userId: string;
  label: string | null;
  shipmentMode: ShipmentMode | null; // null = all modes
  serviceType: ServiceType | null; // null = all services
  discountPercent: number | null;
  fixedPricePerKgByZone: Record<string, number> | null;
  isActive: boolean;
  validFrom: string | null;
  validUntil: string | null;
  notes: string | null;
};

export type CreateContractRateRequest = {
  userId: string;
  label?: string;
  shipmentMode?: ShipmentMode | null;
  serviceType?: ServiceType | null;
  discountPercent?: number;
  fixedPricePerKgByZone?: Record<string, number>;
  validFrom?: string;
  validUntil?: string;
  notes?: string;
};

export type UpdateContractRateRequest = { id: string } & Partial<Omit<CreateContractRateRequest, "userId">> & { isActive?: boolean };

// ── Promo codes — explicit mode/service scope (empty = applies to all) ───────
export type PromoCode = {
  id: string;
  code: string;
  description: string | null;
  discountPercent: number | null;
  flatDiscount: number | null;
  minOrderAmount: number | null;
  maxUses: number | null;
  usedCount: number;
  isActive: boolean;
  validFrom: string | null;
  validUntil: string | null;
  shipmentMode: ShipmentMode | null;
  serviceType: ServiceType | null;
};

export type CreatePromoCodeRequest = {
  code: string;
  description?: string;
  discountPercent?: number;
  flatDiscount?: number;
  minOrderAmount?: number;
  maxUses?: number;
  validFrom?: string;
  validUntil?: string;
  shipmentMode?: ShipmentMode;
  serviceType?: ServiceType;
};

export type UpdatePromoCodeRequest = { id: string } & Partial<CreatePromoCodeRequest> & { isActive?: boolean };

// ── Price bands (standard rates) ──────────────────────────────────────────────
export type PriceBand = {
  id: string;
  label: string | null;
  shipmentMode: ShipmentMode;
  serviceType: ServiceType;
  isActive: boolean;
  zone: number | null;
  pricePerKg: number | null;
  basePrice: number | null;
  fixedPricePerKgByZone: Record<string, number> | null;
  minKg: number;
  maxKg: number | null;
  minTons: number;
  maxTons: number | null;
  minCartons: number;
  maxCartons: number | null;
  validFrom: string | null;
  validUntil: string | null;
  notes: string | null;
};

// ── Surcharges ─────────────────────────────────────────────────────────────────
// appliesTo is a comma-list of tokens, e.g. "ALL", "AIR", "STANDARD,ECONOMY" —
// not a single category. This is the one canonical Surcharge shape; table
// columns and forms should import this rather than declaring their own.
export type Surcharge = {
  id: string;
  type: "FUEL" | "REMOTE_AREA" | "VAT" | "FRAGILE" | "INSURANCE" | "OVERSIZE" | string;
  label: string;
  description: string | null;
  ratePercent: number | null;
  flatAmount: number | null;
  isActive: boolean;
  appliesTo: string;
};
