import * as yup from "yup";

export const serviceSchema = yup.object({
  service: yup
    .string()
    .oneOf(
      [
        "air_freight",
        "sea_freight",
        "road_freight",
        "custom_clearance",
        "warehousing",
        "agro_export",
      ],
      "Please select a valid service",
    )
    .required("Please select a service"),
});
export const deleteShipmentSchema = yup.object({
  reason: yup
    .string()
    .required("Enter reason for cancelling"),
});

export const routeSchema = yup.object({
  origin: yup
    .string()
    .min(2, "Origin must be at least 2 characters")
    .required("Origin location is required"),

  destination: yup
    .string()
    .min(2, "Destination must be at least 2 characters")
    .required("Destination is required"),

  pickupDate: yup.string().required("Pick up date is required"),

  deliveryDate: yup
    .string()
    .required("Delivery date is required")
    .test(
      "is-after-pickup",
      "Delivery date must be after pick up date",
      function (value) {
        const { pickupDate } = this.parent;
        if (!pickupDate || !value) return true;
        return new Date(value) >= new Date(pickupDate);
      },
    ),
});

export const cargoSchema = yup.object({
  cargoType: yup.string().required("Cargo type is required"),

  totalWeight: yup
    .number()
    .min(1, "Weight must be at least 1 kg")
    .required("Total weight is required"),

  length: yup
    .string()
    .matches(/^\d+(\.\d+)?$/, "Length must be a valid number")
    .required("Length is required"),

  width: yup
    .string()
    .matches(/^\d+(\.\d+)?$/, "Width must be a valid number")
    .required("Width is required"),

  height: yup
    .string()
    .matches(/^\d+(\.\d+)?$/, "Height must be a valid number")
    .required("Height is required"),

  itemDescription: yup
    .string()
    .min(10, "Description must be at least 10 characters")
    .required("Item description is required"),
});

export const addCitiesSchema = yup.object({
  name: yup
    .string()
    .min(2, "Origin must be at least 2 characters")
    .required("Origin location is required"),

  region: yup
    .string()
    .min(2, "Region must be at least 2 characters")
    .required("region is required"),

  state: yup
    .string()
    .min(2, "State must be at least 2 characters")
    .required("State is required"),
});

export const addBoxDimensionSchema = yup.object({
  categoryId: yup
    .string()
    .required("Category ID is required")
    .matches(
      /^[A-Z0-9-]+$/,
      "Category ID must be uppercase and contain no spaces",
    ),

  displayName: yup
    .string()
    .min(2, "Display name must be at least 2 characters")
    .required("Display name is required"),

  lengthCm: yup
    .number()
    .typeError("Length must be a number")
    .positive("Length must be greater than 0")
    .required("Length is required"),

  widthCm: yup
    .number()
    .typeError("Width must be a number")
    .positive("Width must be greater than 0")
    .required("Width is required"),

  heightCm: yup
    .number()
    .typeError("Height must be a number")
    .positive("Height must be greater than 0")
    .required("Height is required"),

  bestFor: yup
    .string()
    .min(3, "Best for must be at least 3 characters")
    .required("Best for is required"),

  weightKgLimit: yup
    .number()
    .typeError("Weight limit must be a number")
    .positive("Weight limit must be greater than 0")
    .required("Weight limit is required"),
});

export const addZoneSchema = yup.object({
  fromCityId: yup
    .string()
    .min(2, "From city must be at least 2 characters")
    .required("From city is required"),

  toCityId: yup
    .string()
    .min(2, "To city must be at least 2 characters")
    .required("To city is required"),

  zone: yup
    .number()
    .min(1)
    .max(4)
    .typeError("Zone must be a number")
    .positive("Zone must be greater than 0")
    .required("Zone is required"),
});

export const createTicketSchema = yup.object({
  subject: yup
    .string()
    .trim()
    .min(3, "Subject must be at least 3 characters")
    .required("Subject is required"),

  category: yup
    .string()
    .oneOf(
      [
        "TRACKING",
        "PAYMENT",
        "PRICING_DISPUTE",
        "DAMAGED_GOODS",
        "DELIVERY_ISSUE",
        "ACCOUNT",
        "OTHER",
      ],
      "Please select a valid category",
    )
    .required("Category is required"),

  // Accept either a tracking number (human-friendly) or a shipmentId UUID.
  // The backend resolves trackingNumber → shipmentId automatically.
  trackingNumber: yup
    .string()
    .trim()
    .optional(),

  shipmentId: yup
    .string()
    .trim()
    // FIX: CreateTicketForm sets a default value of "" for shipmentId (it's
    // not a visible field in the UI). yup's .optional() only skips validation
    // for `undefined`, not for an empty string — so .uuid() was still running
    // against "" and failing every single submission with an invisible error
    // (shipmentId has no rendered <input>, so the error never appeared on
    // screen). This is why "the ticket system does not work": the form was
    // silently blocked by react-hook-form before it ever called the API.
    .transform((value) => (value === "" ? undefined : value))
    .uuid("Shipment ID must be a valid UUID")
    .optional(),

  body: yup
    .string()
    .trim()
    .min(10, "Body must be at least 10 characters")
    .required("Body is required"),

  priority: yup
    .string()
    .oneOf(["LOW", "NORMAL", "HIGH", "URGENT"], "Please select a valid priority")
    .required("Priority is required"),
});

export type CreateTicketFormData = yup.InferType<typeof createTicketSchema>;

export const createClaimSchema = yup.object({
  shipmentId: yup
    .string()
    .uuid("Shipment ID must be a valid UUID")
    .required("Shipment ID is required"),

  type: yup.string().oneOf(["DAMAGE", "LOSS", "OTHER"], "Please select a valid claim type").required("Claim type is required"),

  description: yup
    .string()
    .trim()
    .min(20, "Description must be at least 20 characters")
    .max(1000, "Description must be at most 1000 characters")
    .required("Description is required"),

  declaredValue: yup
    .number()
    .typeError("Declared value must be a number")
    .min(0, "Declared value cannot be negative")
    .required("Declared value is required"),

  claimAmount: yup
    .number()
    .typeError("Claim amount must be a number")
    .moreThan(0, "Claim amount must be greater than zero")
    .test(
      "lte-declared",
      "Claim amount cannot exceed the declared value",
      function (value) {
        const declared = Number(this.parent.declaredValue);
        if (!value || !Number.isFinite(declared)) return true;
        return value <= declared;
      },
    )
    .required("Claim amount is required"),

  bankName: yup.string().default(""),

  accountNumber: yup.string().default(""),

  accountName: yup.string().default(""),

  images: yup
    .array()
    .of(yup.string().trim().required())
    .max(5, "You can add up to 5 images")
    .default([]),
});

export type CreateClaimFormData = yup.InferType<typeof createClaimSchema>;

export const createFAQSchema = yup.object({
  question: yup
    .string()
    .trim()
    .min(5, "Question must be at least 5 characters")
    .required("Question is required"),

  answer: yup
    .string()
    .trim()
    .min(10, "Answer must be at least 10 characters")
    .required("Answer is required"),

  category: yup
    .string()
    .oneOf(
      [
        "PRICING",
        "SHIPPING_RULES",
        "TRACKING",
        "PAYMENTS",
        "ACCOUNT",
        "PACKAGING",
        "CLAIMS",
      ],
      "Please select a valid category",
    )
    .required("Category is required"),

  sortOrder: yup
    .number()
    .typeError("Sort order must be a number")
    .min(0, "Sort order cannot be negative")
    .required("Sort order is required"),
});

export type CreateFAQFormData = yup.InferType<typeof createFAQSchema>;

export type AddZoneFormData = yup.InferType<typeof addZoneSchema>;
export type AddBoxDimensionFormData = yup.InferType<
  typeof addBoxDimensionSchema
>;
export type AddCitiesFormData = yup.InferType<typeof addCitiesSchema>;
export type ServiceFormData = yup.InferType<typeof serviceSchema>;
export type RouteFormData = yup.InferType<typeof routeSchema>;
export type CargoFormData = yup.InferType<typeof cargoSchema>;

// ── Promo Code (customer-facing coupon, e.g. LAUNCH20) ─────────────────────
export const promoCodeSchema = yup
  .object({
    code: yup
      .string()
      .uppercase()
      .matches(/^\S+$/, "No spaces allowed")
      .required("Code is required"),

    description: yup.string().nullable(),

    discountPercent: yup
      .number()
      .transform((value, originalValue) => (originalValue === "" || originalValue == null ? null : value))
      .min(0, "Discount cannot be negative")
      .max(100, "Discount cannot exceed 100%")
      .typeError("Must be a number")
      .nullable(),

    flatDiscount: yup
      .number()
      .transform((value, originalValue) => (originalValue === "" || originalValue == null ? null : value))
      .min(0, "Flat discount cannot be negative")
      .typeError("Must be a number")
      .nullable(),

    discountType: yup
      .string()
      .oneOf(["percent", "flat"])
      .required("Pricing type is required"),

    serviceType: yup
      .string()
      .transform((value, originalValue) => (originalValue === "" ? null : value))
      .oneOf(["STANDARD", "EXPRESS", "ECONOMY"])
      .nullable()
      .notRequired(),

    minOrderAmount: yup
      .number()
      .transform((value, originalValue) => (originalValue === "" || originalValue == null ? null : value))
      .min(0, "Minimum order cannot be negative")
      .nullable()
      .notRequired(),

    maxUses: yup
      .number()
      .transform((value, originalValue) => (originalValue === "" || originalValue == null ? null : value))
      .min(0, "Max uses cannot be negative")
      .nullable()
      .notRequired(),

    isActive: yup.boolean().default(true),

    // validFrom blank  → promo active from creation date.
    // validUntil blank → promo never expires.
    validFrom: yup
      .string()
      .nullable()
      .notRequired()
      .test("valid-date", "Enter a valid date (YYYY-MM-DD)", (val) =>
        !val || /^\d{4}-\d{2}-\d{2}$/.test(val),
      ),

    validUntil: yup
      .string()
      .nullable()
      .notRequired()
      .test("valid-date", "Enter a valid date (YYYY-MM-DD)", (val) =>
        !val || /^\d{4}-\d{2}-\d{2}$/.test(val),
      )
      .test("after-start", "Must be after the start date", function (val) {
        const { validFrom } = this.parent;
        if (!validFrom || !val) return true;
        return val >= validFrom;
      }),
  })
  .test(
    "only-one-discount",
    "Provide either Discount (%) or Flat Discount (₦), not both",
    (value) => {
      if (!value) return false;

      const hasPercent =
        value.discountPercent !== null &&
        value.discountPercent !== undefined &&
        value.discountPercent !== 0;

      const hasFlat =
        value.flatDiscount !== null &&
        value.flatDiscount !== undefined &&
        value.flatDiscount !== 0;

      return (hasPercent && !hasFlat) || (!hasPercent && hasFlat);
    },
  );
export type PromoCodeFormData = yup.InferType<typeof promoCodeSchema>;
