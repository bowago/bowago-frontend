import * as yup from "yup";

export const loginSchema = yup.object({
  email: yup
    .string()
    .email("Please enter a valid email address")
    .required("Email address is required"),
  password: yup
    .string()
    .min(8, "Password must be at least 8 characters")
    .required("Password is required"),
});

export const forgotPasswordSchema = yup.object({
  email: yup
    .string()
    .email("Please enter a valid email address")
    .required("Email address is required"),
});

export const otpSchema = yup.object({
  otp: yup
    .string()
    .length(6, "OTP must be 6 digits")
    .matches(/^\d+$/, "OTP must contain only numbers")
    .required("OTP is required"),
});

export const resetPasswordSchema = yup.object({
  otp: yup
    .string()
    .length(6, "OTP must be 6 digits")
    .matches(/^\d+$/, "OTP must contain only numbers")
    .required("OTP is required"),
  password: yup
    .string()
    .min(12, "Password must be at least 12 characters")
    .matches(/[a-z]/, "Password must contain at least one lowercase letter")
    .matches(/[A-Z]/, "Password must contain at least one uppercase letter")
    .matches(/[0-9]/, "Password must contain at least one number")
    .matches(
      /[^A-Za-z0-9]/,
      "Password must contain at least one special character",
    )
    .required("Password is required"),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref("password")], "Passwords do not match")
    .required("Please confirm your password"),
});

export const changePasswordSchema = yup.object({
  currentPassword: yup
    .string()
    .required("Current password is required")
    .label("Current Password"),
  newPassword: yup
    .string()
    .min(12, "Password must be at least 12 characters")
    .matches(/[a-z]/, "Password must contain at least one lowercase letter")
    .matches(/[A-Z]/, "Password must contain at least one uppercase letter")
    .matches(/[0-9]/, "Password must contain at least one number")
    .matches(
      /[^A-Za-z0-9]/,
      "Password must contain at least one special character",
    )
    .required()
    .label("New Password"),
});

export const signupSchema = yup.object({
  fullName: yup
    .string()
    .min(2, "Name must be at least 2 characters")
    .required("Full name is required"),
  email: yup
    .string()
    .email("Please enter a valid email address")
    .required("Email address is required"),
  businessName: yup.string().optional(),
  phoneNumber: yup
    .string()
    .matches(/^\+?[0-9\s\-()]{7,15}$/, "Please enter a valid phone number")
    .required("Phone number is required"),
  password: yup
    .string()
    .min(12, "Password must be at least 12 characters")
    .matches(/[a-z]/, "Must contain at least one lowercase letter")
    .matches(/[A-Z]/, "Must contain at least one uppercase letter")
    .matches(/[0-9]/, "Must contain at least one number")
    .matches(/[^A-Za-z0-9]/, "Must contain at least one special character")
    .required("Password is required"),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref("password")], "Passwords do not match")
    .required("Please confirm your password"),
});
export const trackingSchema = yup.object({
  trackingId: yup
    .string()
    .min(2, "Tracking ID must be at least 2 characters")
    .required("Tracking ID is required"),
});

export const personalInformationSchema = yup.object({
  firstName: yup.string().min(2, "First name must be at least 2 characters"),
  lastName: yup.string().min(2, "Last name must be at least 2 characters"),
  email: yup.string().email("Please enter a valid email address"),
  phone: yup
    .string()
    .matches(/^\+?[0-9\s\-()]{7,15}$/, "Please enter a valid phone number"),
  streetAddress: yup
    .string()
    .min(5, "Street address must be at least 5 characters"),
  city: yup.string().min(2, "City must be at least 2 characters"),
  state: yup.string().min(2, "State must be at least 2 characters"),
  country: yup.string().min(2, "Country must be at least 2 characters"),
  zipCode: yup
    .string()
    .matches(/^[0-9]{4,10}$/, "Please enter a valid ZIP code"),
});

export const companyInformationSchema = yup.object({
  companyName: yup
    .string()
    .min(2, "Company name must be at least 2 characters")
    .required("Company name is required"),

  industry: yup.string().optional(),

  email: yup.string().email("Please enter a valid email address").optional(),

  companyPhone: yup
    .string()
    .matches(/^\+?[0-9\s\-()]{7,15}$/, "Please enter a valid phone number")
    .optional(),

  companyWebsite: yup
    .string()
    .url("Please enter a valid website URL")
    .nullable()
    .optional(),

  streetAddress: yup
    .string()
    .min(5, "Street address must be at least 5 characters")
    .optional(),

  city: yup.string().min(2, "City must be at least 2 characters").optional(),

  state: yup.string().min(2, "State must be at least 2 characters").optional(),

  country: yup
    .string()
    .min(2, "Country must be at least 2 characters")
    .optional(),

  zipCode: yup
    .string()
    .matches(/^[0-9]{4,10}$/, "Please enter a valid ZIP code")
    .optional(),
});

export const standardRateSchema = yup.object({
  zone: yup
    .number()
    .min(1)
    .max(4)
    .typeError("Zone must be a number")
    .required("Zone is required"),

  minKg: yup.number().required().min(0, "Min kg must be ≥ 0"),

  maxKg: yup.number().required().min(0, "Max kg must be ≥ 0"),

  minTons: yup.number().required().min(0, "Min tons must be ≥ 0"),

  maxTons: yup.number().required().min(0, "Max tons must be ≥ 0"),

  minCartons: yup.number().required().min(0),

  maxCartons: yup.number().required().min(0, "Max cartons must be ≥ 0"),

  serviceType: yup
    .string()
    .notRequired()
    .nullable()
    .default(undefined)
    .label("Service Type"),
  isActive: yup
    .boolean()
    .notRequired()
    .nullable()
    .default(undefined)
    .label("Active"),
  reason: yup.string().nullable().notRequired(),

  pricePerKg: yup.number().required().min(0, "Price must be ≥ 0"),

  basePrice: yup.number().required().min(0, "Base price must be ≥ 0"),
});

export type StandardRateFormData = {
  zone: number;
  minKg: number;
  maxKg: number;
  minTons: number;
  maxTons: number;
  minCartons: number;
  maxCartons: number;
  pricePerKg: number;
  basePrice: number;

  serviceType?: string | null;
  isActive?: boolean | null;
};

export const contractRateSchema = yup.object({
  userId: yup.string().required("User is required"),

  label: yup
    .string()
    .min(3, "Label must be at least 3 characters")
    .required("Label is required"),

  serviceType: yup
    .string()
    .oneOf(["STANDARD", "EXPRESS", "ECONOMY"])
    .required("Service type is required"),

  // ✅ NEW
  pricingType: yup
    .string()
    .oneOf(["discount", "fixed"])
    .required("Pricing type is required"),

  // ✅ Conditional
  discountPercent: yup
    .number()
    .typeError("Discount must be a number")
    .min(0, "Discount cannot be negative")
    .max(100, "Discount cannot exceed 100%")
    .max(100)
    .when("pricingType", {
      is: "discount",
      then: (schema) => schema.required("Discount is required"),
      otherwise: (schema) => schema.nullable().notRequired(),
    }),

  // ✅ Conditional
  fixedPricePerKgByZone: yup
    .object({
      "1": yup
        .number()
        .typeError("Required")
        .min(0, "Price cannot be negative"),
      "2": yup
        .number()
        .typeError("Required")
        .min(0, "Price cannot be negative"),
      "3": yup
        .number()
        .typeError("Required")
        .min(0, "Price cannot be negative"),
      "4": yup
        .number()
        .typeError("Required")
        .min(0, "Price cannot be negative"),
    })
    .when("pricingType", {
      is: "fixed",
      then: (schema) =>
        schema.shape({
          "1": yup
            .number()
            .required("Required")
            .min(0, "Price cannot be negative"),
          "2": yup
            .number()
            .required("Required")
            .min(0, "Price cannot be negative"),
          "3": yup
            .number()
            .required("Required")
            .min(0, "Price cannot be negative"),
          "4": yup
            .number()
            .required("Required")
            .min(0, "Price cannot be negative"),
        }),
      otherwise: (schema) => schema.nullable().notRequired(),
    }),

  isActive: yup.boolean().default(true),

  // String (YYYY-MM-DD) from HTML date inputs — using yup.date() would
  // infer the type as Date and cause a type mismatch with the string value
  // returned by <input type="date">. String + regex keeps the type as string.
  // validFrom blank  → contract is active from the day it is created.
  // validUntil blank → no expiry; contract runs indefinitely.
  validFrom: yup
    .string()
    .nullable()
    .notRequired()
    .test(
      "valid-date",
      "Enter a valid date (YYYY-MM-DD)",
      (val) => !val || /^\d{4}-\d{2}-\d{2}$/.test(val),
    ),

  validUntil: yup
    .string()
    .nullable()
    .notRequired()
    .test(
      "valid-date",
      "Enter a valid date (YYYY-MM-DD)",
      (val) => !val || /^\d{4}-\d{2}-\d{2}$/.test(val),
    )
    .test("after-start", "Must be after the start date", function (val) {
      const { validFrom } = this.parent;
      if (!validFrom || !val) return true;
      return val >= validFrom;
    }),

  notes: yup.string().max(300).nullable().notRequired(),
});

export type ContractRateFormData = yup.InferType<typeof contractRateSchema>;

export type PersonalInformationFormData = yup.InferType<
  typeof personalInformationSchema
>;
export type CompanyInformationFormData = yup.InferType<
  typeof companyInformationSchema
>;
export type LoginFormData = yup.InferType<typeof loginSchema>;
export type SignupFormData = yup.InferType<typeof signupSchema>;
export type TrackingFormData = yup.InferType<typeof trackingSchema>;
export type ForgotPasswordFormData = yup.InferType<typeof forgotPasswordSchema>;
export type OTPFormData = yup.InferType<typeof otpSchema>;
export type ResetPasswordFormData = yup.InferType<typeof resetPasswordSchema>;
export type ChangePasswordFormData = yup.InferType<typeof changePasswordSchema>;
