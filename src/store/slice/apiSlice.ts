import {
  BaseQueryFn,
  createApi,
  FetchArgs,
  fetchBaseQuery,
  FetchBaseQueryError,
} from "@reduxjs/toolkit/query/react";
import {
  AuthResponse,
  CustomError,
  IAppResetPassword,
  IContactUpdate,
  ICreateUser,
  IDeleteEmployee,
  IDocumentUploadResponse,
  IEmployeeApprovalRequestBody,
  ILogoResponse,
  IResetPassword,
  ISignup,
  IUpdateEmployee,
} from "./types";
import { RootState } from "../store";
import {
  authTokenChange,
  logoutUser,
  setUserData,
  setMfaVerified,
} from "./authSlice";
import { StaffResponseData } from "./types/staff.types";
import { errorToast, successToast } from "@/lib/toast/toast";
import {
  ContractRateFormData,
  CreateFAQFormData,
  CreateTicketFormData,
} from "@/lib/validation";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";
// const API_CLIENT_KEY_AUTH = process.env.NEXT_PUBLIC_CLIENT_KEY_AUTH ?? "";

export type AdminShipmentQueryParams = {
  status?: string;
  search?: string;
  assignedTo?: string;
  fromDate?: string;
  toDate?: string;
};

export type UserShipmentQueryParams = {
  status?: string;
  search?: string;
};

// console.log("API_CLIENT_KEY", API_CLIENT_KEY);
// console.log("API_CLIENT_KEY_AUTH", API_CLIENT_KEY_AUTH);

export const baseQuery = fetchBaseQuery({
  baseUrl: `${API_BASE_URL}`,
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth?.accessToken;

    if (token) {
      headers.set("authorization", `Bearer ${token.trim()}`);
    }

    return headers;
  },
});

export const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, store, extraOptions) => {
  let result = await baseQuery(args, store, extraOptions);

  const authState = (store.getState() as RootState).auth;

  if (result.error && result.error.status === 401) {
    if (!authState.accessToken || !authState.refreshToken) return result;

    // Try to refresh the token
    const refreshResult = await baseQuery(
      {
        url: "/auth/refresh",
        method: "POST",
        body: {
          refreshToken: authState.refreshToken,
        },
      },
      store,
      extraOptions,
    );

    if (refreshResult.data) {
      // Response is { success, data: { accessToken, refreshToken } }
      const refreshData =
        (refreshResult.data as any)?.data ?? refreshResult.data;
      const newAccessToken = refreshData?.accessToken;
      const newRefreshToken =
        refreshData?.refreshToken ?? authState.refreshToken;

      if (newAccessToken) {
        store.dispatch(
          authTokenChange({
            accessToken: newAccessToken,
            refreshToken: newRefreshToken,
          }),
        );
        // Retry the original request with the new token
        result = await baseQuery(args, store, extraOptions);
      } else {
        store.dispatch(logoutUser());
      }
    } else {
      store.dispatch(logoutUser());
    }
  }

  // ─── Gap 5: 2FA gate — catch MFA codes from ANY endpoint (e.g. invoice ───
  // download/email links reachable from shipment details, sidebar, payment
  // callback, etc.) not just the dedicated Invoices page, and route the
  // user to the right step instead of silently failing.
  if (result.error && result.error.status === 403) {
    const code = (result.error.data as any)?.code;
    if (
      code === "MFA_SETUP_REQUIRED" ||
      code === "MFA_REQUIRED" ||
      code === "MFA_EXPIRED"
    ) {
      if (typeof window !== "undefined") {
        const destination =
          code === "MFA_SETUP_REQUIRED"
            ? "/dashboard/settings?tab=twofa"
            : "/auth/login";
        // Avoid redirect loops if we're already heading there
        if (!window.location.pathname.startsWith(destination.split("?")[0])) {
          window.location.href = destination;
        }
      }
    }
  }

  return result;
};

export const apiSlice = createApi({
  reducerPath: "api",
  tagTypes: [
    "Dimension",
    "Zone",
    "City",
    "StandardRate",
    "ContractRate",
    "PromoRate",
    "Shipment",
    "Surcharge",
    "SurchargeAuditLog",
    "Ticket",
    "Claim",
    "FAQ",
    "FailedWebhook",
    "AdminRole",
    "User",
    "SavedCard",
    "Invoice",
    "Notification",
    "DeliverySLA",
    "OrgInvite",
    "CannedResponse",
    "AddressChange",
  ],
  baseQuery: baseQueryWithReauth,
  endpoints: (builder) => ({
    // useSignupMutation
    signup: builder.mutation<AuthResponse, ISignup>({
      query: (formData) => ({
        url: "/auth/register",
        method: "POST",
        body: formData,
      }),
      async onQueryStarted(args, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
        } catch (error) {
          const errorM = error as CustomError;
          errorToast(errorM.error?.data?.message || "Unexpected errror");
        }
      },
    }),
    // useLoginMutation
    login: builder.mutation<AuthResponse, { email: string; password: string }>({
      query: (formData) => ({
        url: "/auth/login",
        method: "POST",
        body: formData,
      }),
      async onQueryStarted(args, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;

          // If 2FA is enabled, no tokens are issued yet — the UI should
          // prompt for the emailed code and call useVerifyLogin2FAMutation.
          if ((data as any)?.data?.requires2FA) return;

          const userToken = {
            accessToken: data?.data?.accessToken,
            refreshToken: data?.data?.refreshToken,
          };
          dispatch(authTokenChange(userToken));
          dispatch(setUserData(data.data.user));
        } catch (error) {
          const errorM = error as CustomError;
          errorToast(errorM.error?.data?.message || "Unexpected errror");
        }
      },
    }),
    // useResendOtpMutation
    resendOtp: builder.mutation<AuthResponse, { email: string; type: string }>({
      query: (formData) => ({
        url: "/auth/resend-otp",
        method: "POST",
        body: formData,
      }),
      async onQueryStarted(args, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          successToast("Otp Sent");
        } catch (error) {
          const errorM = error as CustomError;
          errorToast(errorM.error?.data?.message || "Unexpected errror");
        }
      },
    }),
    // useVerifyEmailMutation
    verifyEmail: builder.mutation<
      AuthResponse,
      { email: string; code: string }
    >({
      query: (formData) => ({
        url: "/auth/verify-email",
        method: "POST",
        body: formData,
      }),
      async onQueryStarted(args, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          successToast("Account Verification successful, login");
        } catch (error) {
          const errorM = error as CustomError;
          errorToast(errorM.error?.data?.message || "Unexpected errror");
        }
      },
    }),
    // useForgotPasswordMutation
    forgotPassword: builder.mutation<unknown, { email: string }>({
      query: (formData) => ({
        url: "/auth/forgot-password",
        method: "POST",
        body: formData,
      }),
      async onQueryStarted(args, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          successToast("Otp sent, check email!");
        } catch (error) {
          const errorM = error as CustomError;
          errorToast(errorM.error?.data?.message || "Unexpected errror");
        }
      },
    }),

    // useResetPasswordMutation
    resetPassword: builder.mutation<unknown, IResetPassword>({
      query: (formData) => ({
        url: "/auth/reset-password",
        method: "POST",
        body: formData,
      }),
      async onQueryStarted(args, { queryFulfilled }) {
        try {
          await queryFulfilled;
          successToast("Password Updated successfully, Login!");
        } catch (error) {
          const errorM = error as CustomError;
          errorToast(errorM.error?.data?.message || "Unexpected errror");
        }
      },
    }),

    // useChangePasswordMutation
    changePassword: builder.mutation<
      unknown,
      { currentPassword: string; newPassword: string }
    >({
      query: (formData) => ({
        url: "/auth/change-password",
        method: "POST",
        body: formData,
      }),
      async onQueryStarted(args, { queryFulfilled }) {
        try {
          await queryFulfilled;
          successToast("Password Updated successfully, Login!");
        } catch (error) {
          const errorM = error as CustomError;
          errorToast(errorM.error?.data?.message || "Unexpected errror");
        }
      },
    }),

    trackShipment: builder.query<unknown, { trackingNumber: string }>({
      query: (formData) => ({
        url: `/shipments/track/${formData.trackingNumber}`,
        method: "GET",
      }),
      async onQueryStarted(args, { queryFulfilled }) {
        try {
          await queryFulfilled;
        } catch (error) {
          const errorM = error as CustomError;
          errorToast(errorM.error?.data?.message || "Unexpected errror");
        }
      },
    }),
    // useGetUserProfileQuery
    getUserProfile: builder.query({
      query: () => ({
        url: `/users/me`,
        method: "GET",
      }),
      async onQueryStarted(args, { queryFulfilled }) {
        try {
          await queryFulfilled;
        } catch (error) {
          const errorM = error as CustomError;
          errorToast(errorM.error?.data?.message || "Unexpected errror");
        }
      },
    }),
    // useUpdateUserProfileMutation
    updateUserProfile: builder.mutation<
      unknown,
      {
        firstName?: string;
        lastName?: string;
        phone?: string;
        avatar?: string;
      }
    >({
      query: (body) => ({
        url: `/users/me`,
        method: "PATCH",
        body,
      }),
      async onQueryStarted(args, { queryFulfilled }) {
        try {
          await queryFulfilled;
          successToast("Profile updated successfully");
        } catch (error) {
          const errorM = error as CustomError;
          errorToast(errorM.error?.data?.message || "Unexpected errror");
        }
      },
    }),

    // useUpsertDefaultAddressMutation — creates the default address if none
    // exists, otherwise updates the existing default. Used by the Personal
    // Info "Address Information" section.
    UpsertDefaultAddress: builder.mutation<
      any,
      {
        existingId?: string | null;
        street: string;
        city: string;
        state: string;
        country?: string;
        postalCode?: string;
      }
    >({
      query: ({ existingId, ...body }) => ({
        url: existingId
          ? `/users/me/addresses/${existingId}`
          : `/users/me/addresses`,
        method: existingId ? "PUT" : "POST",
        body: { ...body, isDefault: true },
      }),
      async onQueryStarted(_, { queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          if (data) successToast("Address saved successfully");
        } catch (e: any) {
          errorToast(e.error?.data?.message || "Failed to save address");
        }
      },
    }),

    // ─── Saved Cards (Settings → Payment Method) ──────────────────────────────
    // useGetSavedCardsQuery
    GetSavedCards: builder.query<any, void>({
      query: () => "/users/me/saved-cards",
      providesTags: ["SavedCard"],
    }),
    // useSetDefaultCardMutation
    SetDefaultCard: builder.mutation<any, { id: string }>({
      query: ({ id }) => ({
        url: `/users/me/saved-cards/${id}/default`,
        method: "PATCH",
      }),
      async onQueryStarted(_, { queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          if (data) successToast("Default card updated");
        } catch (e: any) {
          errorToast(e.error?.data?.message || "Failed to update default card");
        }
      },
      invalidatesTags: ["SavedCard"],
    }),
    // useDeleteSavedCardMutation
    DeleteSavedCard: builder.mutation<any, { id: string }>({
      query: ({ id }) => ({
        url: `/users/me/saved-cards/${id}`,
        method: "DELETE",
      }),
      async onQueryStarted(_, { queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          if (data) successToast("Card removed");
        } catch (e: any) {
          errorToast(e.error?.data?.message || "Failed to remove card");
        }
      },
      invalidatesTags: ["SavedCard"],
    }),

    // rate management
    // useAddZoneMutation
    AddZone: builder.mutation<
      unknown,
      { fromCityId: string; toCityId: string; zone: number }
    >({
      query: (formData) => ({
        url: "/pricing/zone-matrix",
        method: "POST",
        body: formData,
      }),
      async onQueryStarted(args, { queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          if (data) {
            successToast("Zone Added Successfully");
          }
        } catch (error) {
          const errorM = error as CustomError;
          errorToast(errorM.error?.data?.message || "Unexpected errror");
        }
      },
      invalidatesTags: ["Zone", "City"],
    }),
    // useAddCityMutation
    addCity: builder.mutation<
      unknown,
      { name: string; region: string; state: string }
    >({
      query: (formData) => ({
        url: "/pricing/cities",
        method: "POST",
        body: formData,
      }),
      async onQueryStarted(args, { queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          if (data) {
            successToast("City Added Successfully");
          }
        } catch (error) {
          const errorM = error as CustomError;
          errorToast(errorM.error?.data?.message || "Unexpected errror");
        }
      },
      invalidatesTags: ["City"],
    }),
    // useCreateQuoteMutation
    CreateQuote: builder.mutation<
      unknown,
      {
        fromCity: string;
        toCity: string;
        weightKg: number;
        tons: number;
        cartons: number;
        boxDimensionId?: string;
        customLength?: number;
        customWidth?: number;
        customHeight?: number;
        serviceType?: string;
        termsAccepted?: boolean;
      }
    >({
      query: (formData) => ({
        url: "/pricing/quote",
        method: "POST",
        body: formData,
      }),
      async onQueryStarted(args, { queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          if (data) {
            successToast("Quote Added Successfully");
          }
        } catch (error) {
          const errorM = error as CustomError;
          errorToast(errorM.error?.data?.message || "Unexpected errror");
        }
      },
    }),
    // useAddBoxDimensionMutation
    AddBoxDimension: builder.mutation<
      unknown,
      {
        categoryId: string;
        displayName: string;
        lengthCm: number;
        widthCm: number;
        heightCm: number;
        bestFor: string;
        weightKgLimit: number;
      }
    >({
      query: (formData) => ({
        url: "/pricing/dimensions",
        method: "POST",
        body: formData,
      }),
      async onQueryStarted(args, { queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          if (data) {
            successToast("Box Dimension Added Successfully");
          }
        } catch (error) {
          const errorM = error as CustomError;
          errorToast(errorM.error?.data?.message || "Unexpected errror");
        }
      },
      invalidatesTags: ["Dimension"],
    }),
    // useCreateSurchargeMutation
    CreateSurcharge: builder.mutation<
      unknown,
      {
        type: string;
        label: string;
        description: string;
        ratePercent: string;
        flatAmount: string;
        appliesTo: string;
      }
    >({
      query: (formData) => ({
        url: "/surcharges",
        method: "POST",
        body: formData,
      }),
      async onQueryStarted(args, { queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          if (data) {
            successToast("Surcharges Added Successfully");
          }
        } catch (error) {
          const errorM = error as CustomError;
          errorToast(errorM.error?.data?.message || "Unexpected errror");
        }
      },
      invalidatesTags: ["Surcharge", "SurchargeAuditLog"],
    }),
    // useAddStandardRateMutation
    AddStandardRate: builder.mutation<
      unknown,
      {
        zone: number;
        minKg: number;
        maxKg: number;
        minTons: number;
        maxTons: number;
        minCartons: number;
        maxCartons: number;
        pricePerKg: number;
        basePrice: number;
      }
    >({
      query: (formData) => ({
        url: "/pricing/price-bands",
        method: "POST",
        body: formData,
      }),
      async onQueryStarted(args, { queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          if (data) {
            successToast("Standard Rate Added Successfully");
          }
        } catch (error) {
          const errorM = error as CustomError;
          errorToast(errorM.error?.data?.message || "Unexpected errror");
        }
      },
      invalidatesTags: ["StandardRate"],
    }),
    // useAddShipmentMutation
    AddShipment: builder.mutation<
      unknown,
      {
        senderName: string;
        senderPhone: string;
        senderAddress: string;
        senderCity: string;
        senderState: string;
        recipientName: string;
        recipientPhone: string;
        recipientAddress: string;
        recipientCity: string;
        recipientState: string;
        description: string;
        weightKg: number;
        tons: number;
        cartons: number;
        boxDimensionId: string;
        serviceType: string;
        isFragile: boolean;
        requiresInsurance: boolean;
        insuranceValue: number;
        pickupDate: string;
        notes: string;
        quoteId?: string;
      }
    >({
      query: (formData) => ({
        url: "/shipments",
        method: "POST",
        body: formData,
      }),
      async onQueryStarted(args, { queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          if (data) {
            successToast("New Shipment Added Successfully");
          }
        } catch (error) {
          const errorM = error as CustomError;
          errorToast(errorM.error?.data?.message || "Unexpected errror");
        }
      },
      invalidatesTags: ["Shipment"],
    }),

    // useGeneratePersistedQuoteMutation — POST /quotes (15-min TTL, returns quoteId)
    // Use this for the booking flow so price is locked at quote time.
    GeneratePersistedQuote: builder.mutation<
      any,
      {
        originCity: string;
        destinationCity: string;
        weightKg?: number;
        tons?: number;
        cartons?: number;
        lengthCm?: number;
        widthCm?: number;
        heightCm?: number;
        boxDimensionId?: string;
        serviceType?: string;
        insuranceSelected?: boolean;
        declaredValue?: number;
        promoCode?: string;
        termsAccepted: true; // Sprint 7: required — logged server-side in consent_logs
      }
    >({
      query: (body) => ({ url: "/quotes", method: "POST", body }),
      async onQueryStarted(_, { queryFulfilled }) {
        try {
          await queryFulfilled;
        } catch (e: any) {
          /* silent — caller handles */
        }
      },
    }),

    // useAddContractRateMutation
    AddContractRate: builder.mutation<unknown, any>({
      query: (formData) => ({
        url: "/contract-rates",
        method: "POST",
        body: formData,
      }),
      async onQueryStarted(args, { queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          if (data) {
            successToast("Contract Rate Added Successfully");
          }
        } catch (error) {
          const errorM = error as CustomError;
          errorToast(errorM.error?.data?.message || "Unexpected errror");
        }
      },
      invalidatesTags: ["StandardRate"],
    }),
    // useAddPromoRateMutation
    AddPromoRate: builder.mutation<unknown, any>({
      query: (formData) => ({
        url: "/promo-rates",
        method: "POST",
        body: formData,
      }),
      async onQueryStarted(args, { queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          if (data) {
            successToast("Promo Rate Added Successfully");
          }
        } catch (error) {
          const errorM = error as CustomError;
          errorToast(errorM.error?.data?.message || "Unexpected errror");
        }
      },
      invalidatesTags: ["PromoRate"],
    }),

    // useEditStandardRateMutation
    EditStandardRate: builder.mutation<
      unknown,
      {
        id: string;
        zone: number;
        minKg: number;
        maxKg: number;
        minTons: number;
        maxTons: number;
        minCartons: number;
        maxCartons: number;
        pricePerKg: number;
        basePrice: number;
        isActive: boolean;
        serviceType: string;
      }
    >({
      query: (formData) => ({
        url: `/pricing/price-bands/${formData.id}`,
        method: "PUT",
        body: formData,
      }),
      async onQueryStarted(args, { queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          if (data) {
            successToast("Standard Rate Edited Successfully");
          }
        } catch (error) {
          const errorM = error as CustomError;
          errorToast(errorM.error?.data?.message || "Unexpected errror");
        }
      },
      invalidatesTags: ["StandardRate"],
    }),

    // useEditContractRateMutation
    EditContractRate: builder.mutation<
      unknown,
      {
        id: string;
        label?: string;
        serviceType?: string;
        discountPercent?: number | null;
        fixedPricePerKgByZone?: {
          [zone: string]: number;
        } | null;
        isActive?: boolean;
        validFrom?: string;
        validUntil?: string;
        notes?: string;
      }
    >({
      query: (formData) => {
        const { id, ...otherFormData } = formData;
        return {
          url: `/contract-rates/${formData.id}`,
          method: "PATCH",
          body: otherFormData,
        };
      },
      async onQueryStarted(args, { queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          if (data) {
            successToast("Contract Rate Edited Successfully");
          }
        } catch (error) {
          const errorM = error as CustomError;
          errorToast(errorM.error?.data?.message || "Unexpected errror");
        }
      },
      invalidatesTags: ["ContractRate"],
    }),
    // useEditPromoRateMutation
    EditPromoRate: builder.mutation<unknown, any>({
      query: (formData) => {
        const { id, ...otherFormData } = formData;
        return {
          url: `/promo-rates/${id}`,
          method: "PATCH",
          body: otherFormData,
        };
      },
      async onQueryStarted(args, { queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          if (data) {
            successToast("Promo Rate Edited Successfully");
          }
        } catch (error) {
          const errorM = error as CustomError;
          errorToast(errorM.error?.data?.message || "Unexpected errror");
        }
      },
      invalidatesTags: ["PromoRate"],
    }),
    // useEditSurchargeMutation
    EditSurcharge: builder.mutation<
      unknown,
      {
        label: string;
        description: string;
        ratePercent: number;
        flatAmount: number;
        isActive: boolean;
        reason: string;
        id: string;
      }
    >({
      query: (formData) => {
        const { id, ...otherFormData } = formData;
        return {
          url: `/surcharges/${formData.id}`,
          method: "PATCH",
          body: otherFormData,
        };
      },
      async onQueryStarted(args, { queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          if (data) {
            successToast("Surcharge Edited Successfully");
          }
        } catch (error) {
          const errorM = error as CustomError;
          errorToast(errorM.error?.data?.message || "Unexpected errror");
        }
      },
      invalidatesTags: ["Surcharge", "SurchargeAuditLog"],
    }),

    // useDeleteContractRateMutation
    DeleteContractRate: builder.mutation<unknown, { id: string }>({
      query: (formData) => ({
        url: `/contract-rates/${formData?.id}`,
        method: "DELETE",
        body: formData,
      }),
      async onQueryStarted(args, { queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          if (data) {
            successToast("Contract Rate Deleted Successfully");
          }
        } catch (error) {
          const errorM = error as CustomError;
          errorToast(errorM.error?.data?.message || "Unexpected errror");
        }
      },
      invalidatesTags: ["ContractRate"],
    }),
    // useDeleteZoneMutation
    DeleteZone: builder.mutation<unknown, { id: string }>({
      query: (formData) => ({
        url: `/pricing/zone-matrix/${formData?.id}`,
        method: "DELETE",
        body: formData,
      }),
      async onQueryStarted(args, { queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          if (data) {
            successToast("Zone Deleted Successfully");
          }
        } catch (error) {
          const errorM = error as CustomError;
          errorToast(errorM.error?.data?.message || "Unexpected errror");
        }
      },
      invalidatesTags: ["Zone", "City"],
    }),
    // useDeleteSurchargeMutation
    DeleteSurcharge: builder.mutation<unknown, { id: string }>({
      query: (formData) => ({
        url: `/surcharges/${formData?.id}`,
        method: "DELETE",
        body: formData,
      }),
      async onQueryStarted(args, { queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          if (data) {
            successToast("Surcharge Deleted Successfully");
          }
        } catch (error) {
          const errorM = error as CustomError;
          errorToast(errorM.error?.data?.message || "Unexpected errror");
        }
      },
      invalidatesTags: ["Surcharge", "SurchargeAuditLog"],
    }),
    // usePauseZoneMutation
    PauseZone: builder.mutation<unknown, { id: string }>({
      query: (formData) => ({
        url: `/pricing/zone-matrix/${formData?.id}/pause`,
        method: "PATCH",
        body: formData,
      }),
      async onQueryStarted(args, { queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          if (data) {
            successToast("Zone Paused Successfully");
          }
        } catch (error) {
          const errorM = error as CustomError;
          errorToast(errorM.error?.data?.message || "Unexpected errror");
        }
      },
      invalidatesTags: ["Zone", "City"],
    }),
    // useReInstateZoneMutation
    ReInstateZone: builder.mutation<unknown, { id: string }>({
      query: (formData) => ({
        url: `/pricing/zone-matrix/${formData?.id}/reinstate`,
        method: "PATCH",
        body: formData,
      }),
      async onQueryStarted(args, { queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          if (data) {
            successToast("Zone Re-Instated Successfully");
          }
        } catch (error) {
          const errorM = error as CustomError;
          errorToast(errorM.error?.data?.message || "Unexpected errror");
        }
      },
      invalidatesTags: ["Zone", "City"],
    }),
    // useInitiateShipmentPaymentMutation
    InitiateShipmentPayment: builder.mutation<
      any,
      { shipmentId: string; callbackUrl?: string; refundPolicyAccepted: true }
    >({
      query: (formData) => ({
        url: `/payments/initialize`,
        method: "POST",
        body: formData,
      }),
      async onQueryStarted(args, { queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          if (data) {
            successToast("Payment initiated Successfully");
          }
        } catch (error) {
          const errorM = error as CustomError;
          errorToast(errorM.error?.data?.message || "Unexpected errror");
        }
      },
      invalidatesTags: ["Shipment"],
    }),

    // useInitPendingPaymentMutation — "Generate Invoice Only": creates/reuses
    // a PENDING payment record (no Paystack call) so an invoice can be
    // downloaded before the customer pays.
    InitPendingPayment: builder.mutation<any, { shipmentId: string }>({
      query: (body) => ({
        url: `/payments/init-pending`,
        method: "POST",
        body,
      }),
      async onQueryStarted(_, { queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          if (data) successToast("Invoice ready");
        } catch (error: any) {
          errorToast(
            error.error?.data?.message || "Failed to generate invoice",
          );
        }
      },
      invalidatesTags: ["Shipment"],
    }),

    // useDownloadInvoiceMutation — fetches the invoice PDF as a blob and
    // triggers a browser download. Requires a paymentId (from
    // InitPendingPayment or an existing Payment record on the shipment).
    DownloadInvoice: builder.mutation<
      void,
      { paymentId: string; filename?: string }
    >({
      query: ({ paymentId }) => ({
        url: `/invoices/${paymentId}/download`,
        method: "GET",
        responseHandler: async (response) => {
          if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw err;
          }
          return response.blob();
        },
        cache: "no-cache",
      }),
      async onQueryStarted({ filename }, { queryFulfilled }) {
        try {
          const blob = (await queryFulfilled).data as unknown as Blob;
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = filename || "invoice.pdf";
          document.body.appendChild(a);
          a.click();
          a.remove();
          window.URL.revokeObjectURL(url);
        } catch (error: any) {
          errorToast(
            error?.data?.message ||
              error?.error?.data?.message ||
              "Failed to download invoice",
          );
        }
      },
    }),

    // useCreateTicketMutation
    CreateTicket: builder.mutation<unknown, CreateTicketFormData>({
      query: (formData) => ({
        url: "/support/tickets",
        method: "POST",
        body: formData,
      }),
      async onQueryStarted(args, { queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          if (data) {
            successToast("Ticket submitted successfully");
          }
        } catch (error) {
          const errorM = error as CustomError;
          errorToast(errorM.error?.data?.message || "Unexpected errror");
        }
      },
      invalidatesTags: ["Ticket"],
    }),
    // useCreateClaimMutation
    // useCreateClaimMutation
    // Gap 2: accepts FormData (multipart/form-data) so multer receives binary file parts.
    // Do NOT set Content-Type — the browser sets it automatically with the multipart boundary.
    CreateClaim: builder.mutation<unknown, FormData>({
      query: (formData) => ({
        url: "/claims",
        method: "POST",
        body: formData,
        // RTK Query / fetch: when body is FormData, browser auto-sets Content-Type: multipart/form-data; boundary=...
        // Explicitly setting Content-Type here would break the boundary and multer would reject the upload.
        formData: true,
      }),
      async onQueryStarted(args, { queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          if (data) {
            successToast("Claim submitted successfully");
          }
        } catch (error) {
          const errorM = error as CustomError;
          errorToast(errorM.error?.data?.message || "Unexpected errror");
        }
      },
      invalidatesTags: ["Claim"],
    }),

    // ─── Sprint 5: Address Change Approval Workflow (frontend was missing) ───
    // useRequestAddressChangeMutation
    RequestAddressChange: builder.mutation<
      unknown,
      {
        shipmentId: string;
        newRecipientAddress: string;
        newRecipientCity: string;
        newRecipientState: string;
        reason?: string;
      }
    >({
      query: (body) => ({
        url: "/address-changes",
        method: "POST",
        body,
      }),
      async onQueryStarted(_args, { queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          if (data) {
            successToast("Address change request submitted — awaiting admin approval");
          }
        } catch (error) {
          const errorM = error as CustomError;
          errorToast(errorM.error?.data?.message || "Unexpected error");
        }
      },
      invalidatesTags: ["AddressChange"],
    }),

    // useMyAddressChangeRequestsQuery
    MyAddressChangeRequests: builder.query<unknown, void>({
      query: () => ({ url: "/address-changes/my", method: "GET" }),
      providesTags: ["AddressChange"],
    }),

    // useListAddressChangeRequestsQuery (Admin)
    ListAddressChangeRequests: builder.query<
      unknown,
      { status?: string; page?: number } | void
    >({
      query: (params) => ({
        url: "/address-changes",
        method: "GET",
        params: params ?? undefined,
      }),
      providesTags: ["AddressChange"],
    }),

    // useReviewAddressChangeMutation (Admin — approve/reject)
    ReviewAddressChange: builder.mutation<
      unknown,
      { id: string; action: "APPROVE" | "REJECT"; reviewNote?: string }
    >({
      query: ({ id, ...body }) => ({
        url: `/address-changes/${id}/review`,
        method: "PATCH",
        body,
      }),
      async onQueryStarted({ action }, { queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          if (data) {
            successToast(
              action === "APPROVE"
                ? "Address change approved — customer notified"
                : "Address change rejected — customer notified",
            );
          }
        } catch (error) {
          const errorM = error as CustomError;
          errorToast(errorM.error?.data?.message || "Unexpected error");
        }
      },
      invalidatesTags: ["AddressChange", "Shipment"],
    }),

    // ─── Sprint 5: Proactive batch Delay Alerts (frontend was missing) ───────
    // useSendDelayAlertMutation
    SendDelayAlert: builder.mutation<
      unknown,
      {
        shipmentIds: string[];
        reason: string;
        newEstimatedDelivery?: string;
        message?: string;
      }
    >({
      query: (body) => ({
        url: "/delay-alerts/send",
        method: "POST",
        body,
      }),
      async onQueryStarted(_args, { queryFulfilled }) {
        try {
          const { data } = (await queryFulfilled) as any;
          const notified = data?.data?.results?.notified;
          successToast(
            typeof notified === "number"
              ? `Delay alert sent to ${notified} customer${notified === 1 ? "" : "s"}`
              : "Delay alert sent",
          );
        } catch (error) {
          const errorM = error as CustomError;
          errorToast(errorM.error?.data?.message || "Unexpected error");
        }
      },
    }),

    // useGetOverdueShipmentsQuery (Admin — candidates for delay alerts)
    GetOverdueShipments: builder.query<unknown, void>({
      query: () => ({ url: "/delay-alerts/overdue", method: "GET" }),
    }),

    CreateFAQ: builder.mutation<unknown, CreateFAQFormData>({
      query: (formData) => ({
        url: "/faq",
        method: "POST",
        body: formData,
      }),
      async onQueryStarted(args, { queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          if (data) {
            successToast("FAQ created successfully");
          }
        } catch (error) {
          const errorM = error as CustomError;
          errorToast(errorM.error?.data?.message || "Unexpected errror");
        }
      },
      invalidatesTags: ["FAQ"],
    }),
    // useCancelPreviewQuery — get refund preview before confirming cancel
    CancelPreview: builder.query<any, { id: string }>({
      query: ({ id }) => `/shipments/${id}/cancel/preview`,
    }),
    // useCancelShipmentMutation
    CancelShipment: builder.mutation<unknown, { id: string; reason: string }>({
      query: ({ id, reason }) => ({
        url: `/shipments/${id}/cancel`,
        method: "POST",
        body: { reason },
      }),
      async onQueryStarted(args, { queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          if (data) {
            successToast("Cancel Successfully");
          }
        } catch (error) {
          const errorM = error as CustomError;
          errorToast(errorM.error?.data?.message || "Unexpected errror");
        }
      },
      invalidatesTags: ["Shipment"],
    }),

    // ─── Sprint 4: Driver location update ─────────────────────────────────────
    UpdateDriverLocation: builder.mutation<
      any,
      { id: string; lat: number; lng: number; location?: string }
    >({
      query: ({ id, ...body }) => ({
        url: `/shipments/${id}/driver-location`,
        method: "POST",
        body,
      }),
      async onQueryStarted(_, { queryFulfilled }) {
        try {
          await queryFulfilled;
        } catch (error) {
          const e = error as CustomError;
          errorToast(e.error?.data?.message || "Location update failed");
        }
      },
    }),

    // ─── Sprint 6: CSV export ─────────────────────────────────────────────────
    // Downloads shipments as a .csv file using blob download pattern
    ExportShipmentsCsv: builder.mutation<
      void,
      { status?: string; fromDate?: string; toDate?: string }
    >({
      queryFn: async (params, api, _extraOptions, _baseQuery) => {
        const qs = new URLSearchParams();
        if (params.status) qs.set("status", params.status);
        if (params.fromDate) qs.set("fromDate", params.fromDate);
        if (params.toDate) qs.set("toDate", params.toDate);

        const state = api.getState() as any;
        const token = state?.auth?.accessToken;
        const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? "";
        const queryStr = qs.toString();

        try {
          const response = await fetch(
            `${baseUrl}/shipments/export/csv${queryStr ? `?${queryStr}` : ""}`,
            {
              headers: {
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
              },
            },
          );
          if (!response.ok) {
            errorToast("CSV export failed");
            return {
              error: { status: response.status, data: "Export failed" } as any,
            };
          }
          const blob = await response.blob();
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `BowaGo-Shipments-${new Date().toISOString().slice(0, 10)}.csv`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          successToast("Shipments exported to CSV");
          return { data: undefined };
        } catch (err: any) {
          errorToast(err?.message || "Export failed");
          return {
            error: { status: "FETCH_ERROR", data: err?.message } as any,
          };
        }
      },
    }),

    // ─── Sprint 6: Canned Responses ───────────────────────────────────────────
    GetCannedResponses: builder.query<any, { category?: string } | void>({
      query: (args) => {
        const category = (args as any)?.category;
        return {
          url: `/support/canned-responses${category ? `?category=${encodeURIComponent(category)}` : ""}`,
        };
      },
      providesTags: ["CannedResponse"],
      async onQueryStarted(_, { queryFulfilled }) {
        try {
          await queryFulfilled;
        } catch {}
      },
    }),

    CreateCannedResponse: builder.mutation<
      any,
      { title: string; body: string; category?: string }
    >({
      query: (body) => ({
        url: "/support/canned-responses",
        method: "POST",
        body,
      }),
      invalidatesTags: ["CannedResponse"],
      async onQueryStarted(_, { queryFulfilled }) {
        try {
          await queryFulfilled;
          successToast("Template created");
        } catch (error) {
          const e = error as CustomError;
          errorToast(e.error?.data?.message || "Failed to create template");
        }
      },
    }),

    UpdateCannedResponse: builder.mutation<
      any,
      {
        id: string;
        title?: string;
        body?: string;
        category?: string;
        isActive?: boolean;
      }
    >({
      query: ({ id, ...body }) => ({
        url: `/support/canned-responses/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["CannedResponse"],
      async onQueryStarted(_, { queryFulfilled }) {
        try {
          await queryFulfilled;
          successToast("Template updated");
        } catch (error) {
          const e = error as CustomError;
          errorToast(e.error?.data?.message || "Failed to update template");
        }
      },
    }),

    DeleteCannedResponse: builder.mutation<any, { id: string }>({
      query: ({ id }) => ({
        url: `/support/canned-responses/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["CannedResponse"],
      async onQueryStarted(_, { queryFulfilled }) {
        try {
          await queryFulfilled;
          successToast("Template deleted");
        } catch (error) {
          const e = error as CustomError;
          errorToast(e.error?.data?.message || "Failed to delete template");
        }
      },
    }),

    // useDeleteCityMutation — pass force:true to cascade-delete dependent routes
    deleteCity: builder.mutation<unknown, { id: string; force?: boolean }>({
      query: ({ id, force }) => ({
        url: `/pricing/cities/${id}${force ? "?force=true" : ""}`,
        method: "DELETE",
      }),
      async onQueryStarted(_, { queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          if (data)
            successToast((data as any)?.message || "City Deleted Successfully");
        } catch (error: any) {
          // 409 = city has dependent zone/km routes — UI shows a confirmation
          // dialog for this instead of a generic error toast.
          if (error?.error?.status === 409) return;
          errorToast(error?.error?.data?.message || "Unexpected error");
        }
      },
      invalidatesTags: ["City", "Zone"],
    }),

    // useDeleteStandardRateMutation
    DeleteStandardRate: builder.mutation<unknown, { id: string }>({
      query: (formData) => ({
        url: `/pricing/price-bands/${formData?.id}`,
        method: "DELETE",
        body: formData,
      }),
      async onQueryStarted(args, { queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          if (data) {
            successToast("Standard Rate Deleted Successfully");
          }
        } catch (error) {
          const errorM = error as CustomError;
          errorToast(errorM.error?.data?.message || "Unexpected errror");
        }
      },
      invalidatesTags: ["StandardRate"],
    }),
    // useDeleteBoxMutation
    DeleteBox: builder.mutation<unknown, { id: string }>({
      query: (formData) => ({
        url: `/pricing/dimensions/${formData?.id}`,
        method: "DELETE",
        body: formData,
      }),
      async onQueryStarted(args, { queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          if (data) {
            successToast("Box Dimension Deleted Successfully");
          }
        } catch (error) {
          const errorM = error as CustomError;
          errorToast(errorM.error?.data?.message || "Unexpected errror");
        }
      },
      invalidatesTags: ["Dimension"],
    }),

    // useGetCitiesQuery
    getCities: builder.query<
      any,
      {
        region?: string;
        state?: string;
        search?: string;
      }
    >({
      query: (params) => {
        const searchParams = new URLSearchParams();

        if (params?.region) {
          searchParams.append("region", params.region);
        }

        if (params?.state) {
          searchParams.append("state", params.state);
        }
        if (params?.search) {
          searchParams.append("search", params.search);
        }

        return `/pricing/cities?${searchParams.toString()}`;
      },
      providesTags: ["City"],
    }),

    // useGetSurchargesQuery
    GetSurcharges: builder.query<
      any,
      {
        active?: boolean;
      }
    >({
      query: (params) => {
        const searchParams = new URLSearchParams();

        if (params?.active) {
          searchParams.append("active", params.active.toString());
        }

        return `/surcharges`;
      },
      providesTags: ["Surcharge"],
    }),

    // useGetSurchargeAuditLogQuery
    GetSurchargeAuditLog: builder.query<
      unknown,
      {
        entityType?: "Surcharge";
      } | void
    >({
      query: (params) => {
        const searchParams = new URLSearchParams();

        searchParams.append("entityType", params?.entityType ?? "Surcharge");

        return `/surcharges/audit-log?${searchParams.toString()}`;
      },
      providesTags: ["SurchargeAuditLog"],
    }),

    // useGetContractRateQuery
    GetContractRate: builder.query<
      any,
      {
        isActive?: boolean;
        search?: string;
      }
    >({
      query: (params) => {
        const searchParams = new URLSearchParams();

        if (params?.isActive) {
          searchParams.append("isActive", params.isActive.toString());
        }

        if (params?.search) {
          searchParams.append("search", params.search);
        }

        return `/contract-rates?${searchParams.toString()}`;
      },
      providesTags: ["ContractRate"],
    }),

    // useGetPromoRateQuery
    GetPromoRate: builder.query<
      any,
      {
        isActive?: boolean;
        serviceType?: string;
        zone?: number | string;
      } | void
    >({
      query: (params) => {
        const searchParams = new URLSearchParams();
        if (params?.isActive)
          searchParams.append("isActive", params.isActive.toString());
        if ((params as any)?.serviceType)
          searchParams.append("serviceType", (params as any).serviceType);
        if ((params as any)?.zone)
          searchParams.append("zone", String((params as any).zone));
        return `/promo-rates?${searchParams.toString()}`;
      },
      providesTags: ["PromoRate"],
    }),

    // useGetStandardRateQuery
    GetStandardRate: builder.query<
      any,
      {
        zone?: number | string;
        serviceType?: string;
        minKg?: number;
        maxKg?: number;
        isActive?: string;
      }
    >({
      query: (params) => {
        const searchParams = new URLSearchParams();
        if (params?.zone) searchParams.append("zone", String(params.zone));
        if (params?.serviceType)
          searchParams.append("serviceType", params.serviceType);
        if (params?.minKg !== undefined)
          searchParams.append("minKg", String(params.minKg));
        if (params?.maxKg !== undefined)
          searchParams.append("maxKg", String(params.maxKg));
        if (params?.isActive) searchParams.append("isActive", params.isActive);
        return `/pricing/price-bands?${searchParams.toString()}`;
      },
      providesTags: ["StandardRate"],
    }),

    // useGetDimensionsQuery
    GetDimensions: builder.query<any, any>({
      query: () => {
        return `/pricing/dimensions`;
      },
      providesTags: ["Dimension"], // Label this data as 'Post'
    }),

    // useGetAllInvoiceQuery — GET /invoices/my (customer) or /invoices (admin)
    GetAllInvoice: builder.query<
      any,
      { status?: string; page?: number; limit?: number; admin?: boolean } | void
    >({
      query: (params) => {
        const searchParams = new URLSearchParams();
        if (params?.status) searchParams.append("status", params.status);
        if (params?.page) searchParams.append("page", String(params.page));
        if (params?.limit) searchParams.append("limit", String(params.limit));
        const qs = searchParams.toString();
        // Admin role hits /invoices/admin, customer hits /invoices/my
        const base = params?.admin ? "/invoices/admin" : "/invoices/my";
        return `${base}${qs ? "?" + qs : ""}`;
      },
      providesTags: ["Shipment"],
    }),

    // useGetMyInvoiceSummaryQuery — customer-scoped invoice stats
    GetMyInvoiceSummary: builder.query<unknown, void>({
      query: () => "/invoices/my-summary",
      providesTags: ["Invoice"],
    }),

    // useGetInvoiceFinancialOverviewQuery
    GetInvoiceFinancialOverview: builder.query<unknown, void>({
      query: () => {
        return `/invoices/financial-overview`;
      },
    }),
    // useGetAllTicketQuery
    GetAllTicket: builder.query<unknown, { status?: string } | void>({
      query: (params) => {
        const searchParams = new URLSearchParams();

        if (params?.status) {
          searchParams.append("status", params.status);
        }

        const queryString = searchParams.toString();
        return `/support/tickets${queryString ? `?${queryString}` : ""}`;
      },
      providesTags: ["Ticket"],
    }),

    // useGetMyTicketQuery — FIX: customer "My Tickets" page was calling
    // GetAllTicket (admin-only /support/tickets, 403 for customers) instead
    // of this endpoint. This is why every customer saw "Unable to load
    // tickets" right after submitting one.
    GetMyTicket: builder.query<unknown, { status?: string } | void>({
      query: (params) => {
        const searchParams = new URLSearchParams();
        if (params?.status) searchParams.append("status", params.status);
        const qs = searchParams.toString();
        return `/support/tickets/my${qs ? `?${qs}` : ""}`;
      },
      providesTags: ["Ticket"],
    }),

    // useGetTicketByIdQuery — full thread + customerContext (admin) for the ticket detail modal
    GetTicketById: builder.query<unknown, string>({
      query: (id) => `/support/tickets/${id}`,
      providesTags: (_r, _e, id) => [{ type: "Ticket", id }],
    }),

    // useUpdateTicketMutation — Admin: assign / change status / change priority.
    // Wires up what were previously "(TODO)" placeholder modals.
    UpdateTicket: builder.mutation<
      unknown,
      { id: string; status?: string; assignedToId?: string; priority?: string }
    >({
      query: ({ id, ...body }) => ({
        url: `/support/tickets/${id}`,
        method: "PATCH",
        body,
      }),
      async onQueryStarted(_args, { queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          if (data) successToast("Ticket updated");
        } catch (error) {
          const errorM = error as CustomError;
          errorToast(errorM.error?.data?.message || "Failed to update ticket");
        }
      },
      invalidatesTags: ["Ticket"],
    }),

    // useReplyToTicketMutation — agent/customer reply on the ticket thread
    ReplyToTicket: builder.mutation<
      unknown,
      { id: string; body: string; isInternal?: boolean }
    >({
      query: ({ id, ...body }) => ({
        url: `/support/tickets/${id}/reply`,
        method: "POST",
        body,
      }),
      async onQueryStarted(_args, { queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          if (data) successToast("Reply sent");
        } catch (error) {
          const errorM = error as CustomError;
          errorToast(errorM.error?.data?.message || "Failed to send reply");
        }
      },
      invalidatesTags: ["Ticket"],
    }),

    GetClaims: builder.query<
      unknown,
      { status?: string; type?: string } | void
    >({
      query: (params) => {
        const q = new URLSearchParams();
        if (params?.status) q.append("status", params.status);
        if (params?.type) q.append("type", params.type);
        const qs = q.toString();
        return `/claims${qs ? `?${qs}` : ""}`;
      },
      providesTags: ["Claim"],
    }),
    // useGetMyClaimsQuery — customer: own claims
    GetMyClaims: builder.query<unknown, void>({
      query: () => `/claims/my`,
      providesTags: ["Claim"],
    }),
    // useGetClaimByIdQuery — single claim detail
    GetClaimById: builder.query<unknown, { id: string }>({
      query: ({ id }) => `/claims/${id}`,
      providesTags: ["Claim"],
    }),
    // useReviewClaimMutation — admin: approve/reject/mark paid
    ReviewClaim: builder.mutation<
      unknown,
      {
        id: string;
        status: string;
        reviewNote?: string;
        approvedAmount?: number;
      }
    >({
      query: ({ id, ...body }) => ({
        url: `/claims/${id}/review`,
        method: "PATCH",
        body,
      }),
      async onQueryStarted(_, { queryFulfilled }) {
        try {
          await queryFulfilled;
          successToast("Claim updated successfully");
        } catch (e: any) {
          errorToast(e.error?.data?.message || "Failed to update claim");
        }
      },
      invalidatesTags: ["Claim"],
    }),
    // useGetFAQQuery
    GetFAQ: builder.query<
      unknown,
      {
        category?: string;
        search?: string;
      } | void
    >({
      query: (params) => {
        const searchParams = new URLSearchParams();

        if (params?.category) {
          searchParams.append("category", params.category);
        }

        if (params?.search) {
          searchParams.append("search", params.search);
        }

        const queryString = searchParams.toString();
        return `/faq${queryString ? `?${queryString}` : ""}`;
      },
      providesTags: ["FAQ"],
    }),
    // useGetUserShipmentsQuery
    GetUserShipments: builder.query<unknown, UserShipmentQueryParams>({
      query: (params) => {
        const searchParams = new URLSearchParams();

        if (params?.status) {
          searchParams.append("status", params.status);
        }

        if (params?.search) {
          searchParams.append("search", params.search);
        }

        const queryString = searchParams.toString();
        return `/shipments/my${queryString ? `?${queryString}` : ""}`;
      },
      providesTags: ["Shipment"],
    }),
    // useGetUserShipmentsByIdQuery
    GetUserShipmentsById: builder.query<any, { id: string }>({
      query: ({ id }) => {
        return `/shipments/${id}`;
      },
      providesTags: ["Shipment"],
    }),
    // useGetAdminShipmentsQuery
    GetAdminShipments: builder.query<unknown, AdminShipmentQueryParams>({
      query: (params) => {
        const searchParams = new URLSearchParams();

        if (params?.status) {
          searchParams.append("status", params.status);
        }

        if (params?.search) {
          searchParams.append("search", params.search);
        }

        if (params?.assignedTo) {
          searchParams.append("assignedTo", params.assignedTo);
        }

        if (params?.fromDate) {
          searchParams.append("fromDate", params.fromDate);
        }

        if (params?.toDate) {
          searchParams.append("toDate", params.toDate);
        }

        const queryString = searchParams.toString();
        return `/shipments${queryString ? `?${queryString}` : ""}`;
      },
      providesTags: ["Shipment"],
    }),
    // useGetZoneByRouteQuery — looks up zone for a specific city pair (used in CreateShipmentModal)
    GetZoneByRoute: builder.query<any, { fromCity: string; toCity: string }>({
      query: ({ fromCity, toCity }) =>
        `/pricing/zone-matrix?fromCity=${encodeURIComponent(fromCity)}&toCity=${encodeURIComponent(toCity)}&exact=true&limit=1`,
      providesTags: ["Zone"],
    }),

    // useGetZoneQuery
    GetZone: builder.query<
      any,
      {
        fromCity?: string;
        toCity?: string;
        page?: number;
        limit?: number;
        isActive?: string;
      }
    >({
      query: (params) => {
        const searchParams = new URLSearchParams();

        if (params?.fromCity) {
          searchParams.append("fromCity", params.fromCity);
        }

        if (params?.toCity) {
          searchParams.append("toCity", params.toCity);
        }

        if (params?.page) {
          searchParams.append("page", String(params.page));
        }

        if (params?.limit) {
          searchParams.append("limit", String(params.limit));
        }

        if (params?.isActive) {
          searchParams.append("isActive", params.isActive);
        }

        return `/pricing/zone-matrix?${searchParams.toString()}`;
      },
      providesTags: ["Zone"], // Label this data as 'Post'
    }),
    // useGetAuditTrailQuery
    GetAuditTrail: builder.query<any, any>({
      query: () => {
        return `/admin/activity-logs`;
      },
    }),
    // useGetUsersQuery
    GetUsers: builder.query<any, { search?: string; role?: string; adminSubRole?: string } | void>({
      query: (params) => {
        const searchParams = new URLSearchParams();
        if (params?.search) searchParams.append("search", params.search);
        if (params?.role) searchParams.append("role", params.role);
        if (params?.adminSubRole) searchParams.append("adminSubRole", params.adminSubRole);
        const qs = searchParams.toString();
        return `/users${qs ? `?${qs}` : ""}`;
      },
      providesTags: ["User"],
    }),

    // useGetAdminDashboardQuery
    GetAdminDashboard: builder.query<any, void>({
      query: () => "/admin/dashboard",
      providesTags: ["Shipment"],
    }),

    // useGetAdminInvoicesQuery
    GetAdminInvoices: builder.query<
      any,
      { status?: string; page?: number } | void
    >({
      query: (params) => {
        const searchParams = new URLSearchParams();
        if (params?.status) searchParams.append("status", params.status);
        if (params?.page) searchParams.append("page", String(params.page));
        const qs = searchParams.toString();
        return `/invoices/financial-overview${qs ? "?" + qs : ""}`;
      },
    }),

    // useVerifyPaymentMutation — called after Paystack redirect to confirm payment
    VerifyPayment: builder.mutation<any, { reference: string }>({
      query: ({ reference }) => ({
        url: `/payments/verify/${reference}`,
        method: "GET",
      }),
      async onQueryStarted(args, { queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          if (data) {
            successToast("Payment verified successfully");
          }
        } catch (error) {
          const errorM = error as CustomError;
          errorToast(
            errorM.error?.data?.message || "Payment verification failed",
          );
        }
      },
      invalidatesTags: ["Shipment"],
    }),

    // useDeletePromoRateMutation
    DeletePromoRate: builder.mutation<unknown, { id: string }>({
      query: ({ id }) => ({
        url: `/promo-rates/${id}`,
        method: "DELETE",
      }),
      async onQueryStarted(args, { queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          if (data) {
            successToast("Promo Rate Deleted Successfully");
          }
        } catch (error) {
          const errorM = error as CustomError;
          errorToast(errorM.error?.data?.message || "Unexpected error");
        }
      },
      invalidatesTags: ["PromoRate"],
    }),

    // useUpdateShipmentStatusMutation — admin updates shipment status
    UpdateShipmentStatus: builder.mutation<
      unknown,
      { id: string; status: string; location?: string; description?: string }
    >({
      query: ({ id, ...body }) => ({
        url: `/shipments/${id}/status`,
        method: "PATCH",
        body,
      }),
      async onQueryStarted(args, { queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          if (data) {
            successToast("Shipment status updated");
          }
        } catch (error) {
          const errorM = error as CustomError;
          errorToast(errorM.error?.data?.message || "Unexpected error");
        }
      },
      invalidatesTags: ["Shipment"],
    }),

    // ── Sprint 8: Assign shipment to a dispatcher ───────────────────────────────
    // PATCH /shipments/:id/assign — requireLogisticsOrAbove
    AssignShipment: builder.mutation<any, { id: string; userId: string }>({
      query: ({ id, userId }) => ({
        url: `/shipments/${id}/assign`,
        method: "PATCH",
        body: { userId },
      }),
      invalidatesTags: ["Shipment"],
      async onQueryStarted(_, { queryFulfilled }) {
        try {
          await queryFulfilled;
          successToast("Dispatcher assigned");
        } catch (error) {
          const e = error as CustomError;
          errorToast(e.error?.data?.message || "Failed to assign dispatcher");
        }
      },
    }),

    // ─── Custom Admin Capabilities (Super Admin) ──────────────────────────────
    // useGetCapabilitiesQuery — full list of toggleable capability flags
    GetCapabilities: builder.query<any, void>({
      query: () => "/admin/roles/capabilities",
    }),
    // useGetAdminRolesQuery — list all staff with custom role assignments
    GetAdminRoles: builder.query<any, { page?: number; limit?: number } | void>(
      {
        query: (params) => {
          const searchParams = new URLSearchParams();
          if (params?.page) searchParams.append("page", String(params.page));
          if (params?.limit) searchParams.append("limit", String(params.limit));
          const qs = searchParams.toString();
          return `/admin/roles${qs ? `?${qs}` : ""}`;
        },
        providesTags: ["AdminRole"],
      },
    ),
    // useGetAdminRoleQuery — get one user's capability set
    GetAdminRole: builder.query<any, { userId: string }>({
      query: ({ userId }) => `/admin/roles/${userId}`,
      providesTags: ["AdminRole"],
    }),
    // useAssignCustomRoleMutation — create/replace a user's capability set (sets adminSubRole to ROLE_ADMIN)
    AssignCustomRole: builder.mutation<
      any,
      {
        userId: string;
        roleLabel?: string;
        notes?: string;
        canManageRates?: boolean;
        canManageUsers?: boolean;
        canManageShipments?: boolean;
        canViewAnalytics?: boolean;
        canManageTickets?: boolean;
        canManageInvoices?: boolean;
        canManageSurcharges?: boolean;
        canManagePromos?: boolean;
        canManageClaims?: boolean;
        canBulkNotify?: boolean;
        canViewAuditLogs?: boolean;
        canManageOrganization?: boolean;
      }
    >({
      query: ({ userId, ...body }) => ({
        url: "/admin/roles",
        method: "POST",
        body: { userId, ...body },
      }),
      async onQueryStarted(_, { queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          if (data)
            successToast(
              (data as any)?.message || "Custom role assigned successfully",
            );
        } catch (e: any) {
          errorToast(e.error?.data?.message || "Failed to assign custom role");
        }
      },
      invalidatesTags: ["AdminRole", "User"],
    }),
    // useUpdateCustomRoleMutation — update capability flags for an existing custom role
    UpdateCustomRole: builder.mutation<
      any,
      { userId: string } & Record<string, boolean | string | undefined>
    >({
      query: ({ userId, ...body }) => ({
        url: `/admin/roles/${userId}`,
        method: "PATCH",
        body,
      }),
      async onQueryStarted(_, { queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          if (data) successToast("Custom role updated successfully");
        } catch (e: any) {
          errorToast(e.error?.data?.message || "Failed to update custom role");
        }
      },
      invalidatesTags: ["AdminRole"],
    }),
    // useRevokeCustomRoleMutation — remove capability set, revert to LOGISTICS_MANAGER
    RevokeCustomRole: builder.mutation<any, { userId: string }>({
      query: ({ userId }) => ({
        url: `/admin/roles/${userId}`,
        method: "DELETE",
      }),
      async onQueryStarted(_, { queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          if (data)
            successToast((data as any)?.message || "Custom role revoked");
        } catch (e: any) {
          errorToast(e.error?.data?.message || "Failed to revoke custom role");
        }
      },
      invalidatesTags: ["AdminRole", "User"],
    }),

    // ─── Webhook Dead Letter Queue (Super Admin) ──────────────────────────────
    // useGetFailedWebhooksQuery
    GetFailedWebhooks: builder.query<
      any,
      { status?: string; page?: number; limit?: number } | void
    >({
      query: (params) => {
        const searchParams = new URLSearchParams();
        if (params?.status) searchParams.append("status", params.status);
        if (params?.page) searchParams.append("page", String(params.page));
        if (params?.limit) searchParams.append("limit", String(params.limit));
        const qs = searchParams.toString();
        return `/payments/webhooks/failed${qs ? `?${qs}` : ""}`;
      },
      providesTags: ["FailedWebhook"],
    }),
    // useRetryFailedWebhookMutation
    RetryFailedWebhook: builder.mutation<any, { id: string }>({
      query: ({ id }) => ({
        url: `/payments/webhooks/failed/${id}/retry`,
        method: "POST",
      }),
      async onQueryStarted(_, { queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          if (data)
            successToast(
              (data as any)?.message || "Webhook re-processed successfully",
            );
        } catch (e: any) {
          errorToast(e.error?.data?.message || "Retry failed");
        }
      },
      invalidatesTags: ["FailedWebhook"],
    }),
    // useDismissFailedWebhookMutation
    DismissFailedWebhook: builder.mutation<any, { id: string }>({
      query: ({ id }) => ({
        url: `/payments/webhooks/failed/${id}/dismiss`,
        method: "POST",
      }),
      async onQueryStarted(_, { queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          if (data) successToast("Webhook entry dismissed");
        } catch (e: any) {
          errorToast(e.error?.data?.message || "Failed to dismiss");
        }
      },
      invalidatesTags: ["FailedWebhook"],
    }),

    // useGetPricingStatsQuery — already exists as GetRateOverview, but add canonical name
    GetPricingStats: builder.query<any, void>({
      query: () => "/pricing/stats",
      providesTags: ["StandardRate", "ContractRate", "PromoRate"],
    }),

    // useEditBoxDimensionMutation — PATCH /pricing/dimensions/:id (Super Admin only)
    EditBoxDimension: builder.mutation<
      any,
      {
        id: string;
        categoryId?: string;
        displayName?: string;
        lengthCm?: number;
        widthCm?: number;
        heightCm?: number;
        bestFor?: string;
        weightKgLimit?: number;
      }
    >({
      query: ({ id, ...body }) => ({
        url: `/pricing/dimensions/${id}`,
        method: "PATCH",
        body,
      }),
      async onQueryStarted(_, { queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          if (data) successToast("Box dimension updated successfully");
        } catch (e: any) {
          errorToast(e.error?.data?.message || "Box dimension update failed");
        }
      },
      invalidatesTags: ["Dimension"],
    }),

    // useEditCityMutation — PATCH /pricing/cities/:id (Super Admin only)
    EditCity: builder.mutation<
      any,
      { id: string; name?: string; region?: string; state?: string }
    >({
      query: ({ id, ...body }) => ({
        url: `/pricing/cities/${id}`,
        method: "PATCH",
        body,
      }),
      async onQueryStarted(_, { queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          if (data) successToast("City updated successfully");
        } catch (e: any) {
          errorToast(e.error?.data?.message || "City update failed");
        }
      },
      invalidatesTags: ["City"],
    }),

    // useEditZoneMutation — PATCH /pricing/zone-matrix/:id (Super Admin only)
    EditZone: builder.mutation<any, { id: string; zone: number }>({
      query: ({ id, zone }) => ({
        url: `/pricing/zone-matrix/${id}`,
        method: "PATCH",
        body: { zone },
      }),
      async onQueryStarted(_, { queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          if (data) successToast("Zone updated successfully");
        } catch (e: any) {
          errorToast(e.error?.data?.message || "Zone update failed");
        }
      },
      invalidatesTags: ["Zone", "City"],
    }),

    // useImportPricingSheetMutation — POST /pricing/import (multipart)
    ImportPricingSheet: builder.mutation<any, FormData>({
      query: (formData) => ({
        url: "/pricing/import",
        method: "POST",
        body: formData,
        // Don't set Content-Type — browser sets multipart boundary automatically
        formData: true,
      }),
      invalidatesTags: ["StandardRate", "Zone"],
      async onQueryStarted(_, { queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          if (data) successToast("Pricing sheet imported successfully");
        } catch (e: any) {
          errorToast(
            e.error?.data?.message ?? "Import failed. Check the file format.",
          );
        }
      },
    }),

    // useExportPricingSheetMutation — Super Admin: download an .xlsx of
    // current pricing/zone/distance/box data in the same layout the
    // importer expects.
    ExportPricingSheet: builder.mutation<void, void>({
      query: () => ({
        url: "/pricing/export",
        method: "GET",
        responseHandler: async (response) => {
          if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw err;
          }
          return response.blob();
        },
        cache: "no-cache",
      }),
      async onQueryStarted(_, { queryFulfilled }) {
        try {
          const blob = (await queryFulfilled).data as unknown as Blob;
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `BowaGO-Pricing-Export-${new Date().toISOString().slice(0, 10)}.xlsx`;
          document.body.appendChild(a);
          a.click();
          a.remove();
          window.URL.revokeObjectURL(url);
          successToast("Pricing data exported");
        } catch (error: any) {
          errorToast(
            error?.data?.message ||
              error?.error?.data?.message ||
              "Export failed",
          );
        }
      },
    }),

    // useGetNotificationsQuery — polls every 30s for real-time bell updates
    GetNotifications: builder.query<any, { page?: number } | void>({
      query: (params) => {
        const qs = params?.page ? `?page=${params.page}` : "";
        return `/notifications${qs}`;
      },
      providesTags: ["Notification"],
    }),

    // useGetUnreadNotificationCountQuery — lightweight poll for bell badge
    GetUnreadNotificationCount: builder.query<any, void>({
      query: () => "/notifications/unread-count",
      providesTags: ["Notification"],
    }),

    // useMarkAllNotificationsReadMutation
    MarkAllNotificationsRead: builder.mutation<any, void>({
      query: () => ({ url: "/notifications/mark-all-read", method: "PATCH" }),
      invalidatesTags: ["Notification"],
      async onQueryStarted(_, { queryFulfilled }) {
        try {
          await queryFulfilled;
        } catch {}
      },
    }),

    // useMarkNotificationReadMutation
    MarkNotificationRead: builder.mutation<unknown, { id: string }>({
      query: ({ id }) => ({
        url: `/notifications/${id}/read`,
        method: "PATCH",
      }),
    }),

    // useDeleteNotificationMutation — delete a single notification
    DeleteNotification: builder.mutation<any, { id: string }>({
      query: ({ id }) => ({
        url: `/notifications/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Notification"],
    }),

    // useBulkDeleteNotificationsMutation — delete by ids array or all (omit ids)
    BulkDeleteNotifications: builder.mutation<any, { ids?: string[] }>({
      query: (body) => ({
        url: "/notifications/bulk",
        method: "DELETE",
        body,
      }),
      invalidatesTags: ["Notification"],
    }),

    // ─── 2FA ─────────────────────────────────────────────────────────────────
    Setup2FA: builder.mutation<any, { method: "SMS" | "EMAIL" }>({
      query: (body) => ({ url: "/auth/setup-2fa", method: "POST", body }),
      async onQueryStarted(_, { queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          if (data)
            successToast((data as any)?.message || "Verification code sent");
        } catch (e: any) {
          errorToast(e.error?.data?.message || "2FA setup failed");
        }
      },
    }),
    Verify2FA: builder.mutation<any, { otp: string; method?: "EMAIL" | "SMS" }>(
      {
        query: (body) => ({ url: "/auth/verify-2fa", method: "POST", body }),
        async onQueryStarted(_, { dispatch, queryFulfilled }) {
          try {
            const { data } = await queryFulfilled;
            if (data) successToast("Two-factor authentication enabled");
            // FIX: the backend now reissues tokens (carrying the mfaVerifiedAt
            // claim requireRecentMFA checks) and the updated user object on
            // setup confirmation. Without dispatching these, twoFactorEnabled
            // stayed stale in redux (and in localStorage via redux-persist)
            // until the next full login — so the Settings tab reverted to
            // "choose a method" on refresh, and the Invoices page kept
            // demanding 2FA even though it had just been enabled.
            const userToken = {
              accessToken: (data as any)?.data?.accessToken,
              refreshToken: (data as any)?.data?.refreshToken,
            };
            if (userToken.accessToken) dispatch(authTokenChange(userToken));
            if ((data as any)?.data?.user) dispatch(setUserData((data as any).data.user));
            dispatch(setMfaVerified(new Date().toISOString()));
          } catch (e: any) {
            errorToast(e.error?.data?.message || "Verification failed");
          }
        },
      },
    ),
    // useDisable2FAMutation
    Disable2FA: builder.mutation<any, { password: string }>({
      query: (body) => ({ url: "/auth/disable-2fa", method: "POST", body }),
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          if (data) successToast("Two-factor authentication disabled");
          if ((data as any)?.data?.user) dispatch(setUserData((data as any).data.user));
        } catch (e: any) {
          errorToast(e.error?.data?.message || "Failed to disable 2FA");
        }
      },
    }),
    // useVerifyLogin2FAMutation — completes login after Login returns requires2FA:true
    VerifyLogin2FA: builder.mutation<
      AuthResponse,
      { email: string; otp: string }
    >({
      query: (body) => ({ url: "/auth/login-2fa", method: "POST", body }),
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          const userToken = {
            accessToken: (data as any)?.data?.accessToken,
            refreshToken: (data as any)?.data?.refreshToken,
          };
          dispatch(authTokenChange(userToken));
          dispatch(setUserData((data as any).data.user));
          // Gap 5: record MFA completion time for invoice page guard
          dispatch(setMfaVerified(new Date().toISOString()));
        } catch (error) {
          const errorM = error as CustomError;
          errorToast(errorM.error?.data?.message || "Invalid or expired code");
        }
      },
    }),

    // ─── User Management ──────────────────────────────────────────────────────
    UpdateUserRole: builder.mutation<
      any,
      { userId: string; adminSubRole?: string; role?: "ADMIN" | "CUSTOMER" }
    >({
      query: ({ userId, ...body }) => ({
        url: `/users/${userId}/role`,
        method: "PATCH",
        body,
      }),
      async onQueryStarted(_, { queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          if (data) successToast("Role updated successfully");
        } catch (e: any) {
          errorToast(e.error?.data?.message || "Role update failed");
        }
      },
      invalidatesTags: ["User", "AdminRole"],
    }),
    ToggleUserActive: builder.mutation<
      any,
      { userId: string; isActive: boolean }
    >({
      query: ({ userId, isActive }) => ({
        url: `/users/${userId}/status`,
        method: "PATCH",
        body: { isActive },
      }),
      async onQueryStarted(_, { queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          if (data) successToast("User status updated");
        } catch (e: any) {
          errorToast(e.error?.data?.message || "Status update failed");
        }
      },
      invalidatesTags: ["User"],
    }),

    // useGetUserByIdQuery
    GetUserById: builder.query<any, { id: string }>({
      query: ({ id }) => `/users/${id}`,
      providesTags: ["User"],
    }),

    // useDeleteUserMutation
    DeleteUser: builder.mutation<any, { id: string }>({
      query: ({ id }) => ({ url: `/users/${id}`, method: "DELETE" }),
      async onQueryStarted(_, { queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          if (data) successToast("User deleted successfully");
        } catch (e: any) {
          errorToast(e.error?.data?.message || "Delete failed");
        }
      },
      invalidatesTags: ["User"],
    }),

    // useDeleteAccountMutation — lets a customer delete their own account
    DeleteAccount: builder.mutation<any, { password: string }>({
      query: (body) => ({
        url: "/users/me",
        method: "DELETE",
        body,
      }),
      async onQueryStarted(_, { queryFulfilled }) {
        try {
          await queryFulfilled;
          successToast("Account deleted successfully");
        } catch (e: any) {
          errorToast(e.error?.data?.message || "Failed to delete account");
        }
      },
    }),

    // useGoogleAuthMutation — exchange a Google ID token for BowaGO tokens
    GoogleAuth: builder.mutation<AuthResponse, { idToken: string }>({
      query: (body) => ({
        url: "/auth/google",
        method: "POST",
        body,
      }),
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          const userToken = {
            accessToken: (data as any)?.data?.accessToken,
            refreshToken: (data as any)?.data?.refreshToken,
          };
          dispatch(authTokenChange(userToken));
          dispatch(setUserData((data as any).data.user));
        } catch (error) {
          const errorM = error as CustomError;
          errorToast(errorM.error?.data?.message || "Google sign-in failed");
        }
      },
    }),

    // useMarkAsPaidMutation — Admin: manually record offline payment
    MarkAsPaid: builder.mutation<
      any,
      {
        shipmentId: string;
        method?: string;
        reference?: string;
        notes?: string;
      }
    >({
      query: ({ shipmentId, ...body }) => ({
        url: `/payments/${shipmentId}/mark-paid`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Shipment"],
      async onQueryStarted(_, { queryFulfilled }) {
        try {
          await queryFulfilled;
          successToast("Shipment marked as paid");
        } catch (e: any) {
          errorToast(e.error?.data?.message || "Failed to mark as paid");
        }
      },
    }),

    // useWaivePaymentMutation — Super Admin: waive/comp a shipment
    WaivePayment: builder.mutation<
      any,
      { shipmentId: string; reason?: string }
    >({
      query: ({ shipmentId, ...body }) => ({
        url: `/payments/${shipmentId}/waive`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Shipment"],
      async onQueryStarted(_, { queryFulfilled }) {
        try {
          await queryFulfilled;
          successToast("Payment waived successfully");
        } catch (e: any) {
          errorToast(e.error?.data?.message || "Failed to waive payment");
        }
      },
    }),

    // useGetFeaturedFAQsQuery — public, homepage FAQ preview (max 4)
    GetFeaturedFAQs: builder.query<any, void>({
      query: () => "/faq/featured",
      providesTags: ["FAQ"],
    }),

    // useToggleFeaturedFAQMutation — Super Admin: toggle isFeatured on a FAQ
    ToggleFeaturedFAQ: builder.mutation<any, { id: string }>({
      query: ({ id }) => ({
        url: `/faq/${id}/toggle-featured`,
        method: "PATCH",
      }),
      async onQueryStarted(_, { queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          successToast((data as any)?.message || "FAQ feature status updated");
        } catch (e: any) {
          errorToast(e.error?.data?.message || "Failed to update FAQ");
        }
      },
      invalidatesTags: ["FAQ"],
    }),

    // useUpdateFAQMutation — Super Admin: update a FAQ item
    UpdateFAQ: builder.mutation<
      any,
      {
        id: string;
        question?: string;
        answer?: string;
        category?: string;
        sortOrder?: number;
        isFeatured?: boolean;
        isActive?: boolean;
      }
    >({
      query: ({ id, ...body }) => ({
        url: `/faq/${id}`,
        method: "PATCH",
        body,
      }),
      async onQueryStarted(_, { queryFulfilled }) {
        try {
          await queryFulfilled;
          successToast("FAQ updated");
        } catch (e: any) {
          errorToast(e.error?.data?.message || "FAQ update failed");
        }
      },
      invalidatesTags: ["FAQ"],
    }),

    // useDeleteFAQMutation — Super Admin: delete a FAQ item
    DeleteFAQ: builder.mutation<any, { id: string }>({
      query: ({ id }) => ({ url: `/faq/${id}`, method: "DELETE" }),
      async onQueryStarted(_, { queryFulfilled }) {
        try {
          await queryFulfilled;
          successToast("FAQ deleted");
        } catch (e: any) {
          errorToast(e.error?.data?.message || "Delete failed");
        }
      },
      invalidatesTags: ["FAQ"],
    }),

    // useGetDeliverySLAQuery — fetches zone×serviceType delivery days for booking modal
    GetDeliverySLA: builder.query<any, void>({
      query: () => "/pricing/delivery-sla",
      providesTags: ["DeliverySLA"],
    }),

    // useUpdateDeliverySLAMutation — Super Admin: edit days for a zone×service
    UpdateDeliverySLA: builder.mutation<
      any,
      { id: string; minDays: number; maxDays: number }
    >({
      query: ({ id, ...body }) => ({
        url: `/pricing/delivery-sla/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["DeliverySLA"],
      async onQueryStarted(_, { queryFulfilled }) {
        try {
          await queryFulfilled;
          successToast("Delivery SLA updated");
        } catch (e: any) {
          errorToast(e.error?.data?.message || "Update failed");
        }
      },
    }),

    // useGetRateOverviewQuery
    GetRateOverview: builder.query<any, any>({
      query: () => {
        return `/pricing/stats`;
      },
      providesTags: ["StandardRate", "ContractRate", "PromoRate"],
    }),

    // ─── Sprint 6: Agent KPI Dashboard ───────────────────────────────────
    // useGetAgentKpiQuery
    GetAgentKpi: builder.query<
      any,
      { from?: string; to?: string; agentId?: string } | void
    >({
      query: (params) => {
        const qs = params
          ? new URLSearchParams(
              Object.fromEntries(
                Object.entries(params).filter(
                  ([, v]) => v !== undefined && v !== "",
                ),
              ) as Record<string, string>,
            ).toString()
          : "";
        return `/support/kpi${qs ? `?${qs}` : ""}`;
      },
      providesTags: ["Ticket"],
    }),

    // useSubmitCsatMutation — customer rates a resolved ticket
    SubmitCsat: builder.mutation<any, { id: string; score: number }>({
      query: ({ id, score }) => ({
        url: `/support/tickets/${id}/csat`,
        method: "POST",
        body: { score },
      }),
      invalidatesTags: ["Ticket"],
    }),

    // ─── Sprint 8: Organization Team Invite ──────────────────────────────
    // useInviteMemberMutation
    InviteMember: builder.mutation<any, { email: string; role: string }>({
      query: (body) => ({
        url: "/organization/invite-member",
        method: "POST",
        body,
      }),
      async onQueryStarted(_, { queryFulfilled }) {
        try {
          await queryFulfilled;
        } catch (e: any) {
          /* caller handles */
        }
      },
      invalidatesTags: ["OrgInvite"],
    }),

    // useAcceptInviteMutation — public: creates account from invite token
    AcceptInvite: builder.mutation<
      any,
      {
        token: string;
        firstName: string;
        lastName: string;
        password: string;
        phone?: string;
      }
    >({
      query: (body) => ({
        url: "/organization/accept-invite",
        method: "POST",
        body,
      }),
    }),

    // useGetOrgInvitesQuery
    GetOrgInvites: builder.query<any, { status?: string } | void>({
      query: (params) => {
        const qs = params?.status ? `?status=${params.status}` : "";
        return `/organization/invites${qs}`;
      },
      providesTags: ["OrgInvite"],
    }),

    // useCancelOrgInviteMutation
    CancelOrgInvite: builder.mutation<any, { id: string }>({
      query: ({ id }) => ({
        url: `/organization/invites/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["OrgInvite"],
    }),

    // useResendOrgInviteMutation
    ResendOrgInvite: builder.mutation<any, { id: string }>({
      query: ({ id }) => ({
        url: `/organization/invites/${id}/resend`,
        method: "POST",
      }),
      invalidatesTags: ["OrgInvite"],
    }),

    // useRegisterOrganizationMutation — self-service upgrade to Business (ROLE_MASTER)
    RegisterOrganization: builder.mutation<
      any,
      {
        companyName: string;
        industry?: string;
        companyEmail?: string;
        companyPhone?: string;
        companyWebsite?: string;
        streetAddress?: string;
        city?: string;
        state?: string;
        country?: string;
        zipCode?: string;
      }
    >({
      query: (body) => ({
        url: "/organization/register",
        method: "POST",
        body,
      }),
      invalidatesTags: ["OrgInvite"],
    }),

    // useGetOrgStatusQuery — check if user is a business + company details
    GetOrgStatus: builder.query<any, void>({
      query: () => "/organization/status",
      providesTags: ["OrgInvite"],
    }),
  }),
});

export const {
  // authentication
  useSignupMutation,
  useLoginMutation,
  useResendOtpMutation,
  useVerifyEmailMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
  useChangePasswordMutation,
  // shipment
  useTrackShipmentQuery,
  useAddShipmentMutation,
  useCancelShipmentMutation,
  useCancelPreviewQuery,
  useInitiateShipmentPaymentMutation,
  useInitPendingPaymentMutation,
  useDownloadInvoiceMutation,
  useGetUserShipmentsQuery,
  useGetUserShipmentsByIdQuery,
  useGetAdminShipmentsQuery,
  useCreateTicketMutation,
  useCreateClaimMutation,
  useCreateFAQMutation,
  // settings
  useGetUserProfileQuery,
  useUpdateUserProfileMutation,
  useUpsertDefaultAddressMutation,
  useGetSavedCardsQuery,
  useSetDefaultCardMutation,
  useDeleteSavedCardMutation,

  // users
  useGetUsersQuery,
  useUpdateUserRoleMutation,
  useToggleUserActiveMutation,
  useGetUserByIdQuery,
  useDeleteUserMutation,
  useDeleteAccountMutation,
  useMarkAsPaidMutation,
  useWaivePaymentMutation,
  useGoogleAuthMutation,
  useSetup2FAMutation,
  useVerify2FAMutation,
  useDisable2FAMutation,
  useVerifyLogin2FAMutation,

  // invoice
  useGetAllInvoiceQuery,
  useGetInvoiceFinancialOverviewQuery,
  useGetMyInvoiceSummaryQuery,
  useGetAllTicketQuery,
  useGetMyTicketQuery,
  useGetTicketByIdQuery,
  useUpdateTicketMutation,
  useReplyToTicketMutation,
  useGetClaimsQuery,
  useGetMyClaimsQuery,
  useGetClaimByIdQuery,
  useReviewClaimMutation,
  useGetFAQQuery,
  useGetFeaturedFAQsQuery,
  useToggleFeaturedFAQMutation,
  useUpdateFAQMutation,
  useDeleteFAQMutation,

  // rate management
  useAddCityMutation,
  useGetCitiesQuery,
  useDeleteCityMutation,
  useAddBoxDimensionMutation,
  useGetDimensionsQuery,
  useDeleteBoxMutation,
  useAddZoneMutation,
  useGetZoneQuery,
  useGetZoneByRouteQuery,
  useAddStandardRateMutation,
  useGetStandardRateQuery,
  useGetContractRateQuery,
  useDeleteStandardRateMutation,
  useEditStandardRateMutation,
  useAddContractRateMutation,
  useEditContractRateMutation,
  useDeleteContractRateMutation,
  useGetPromoRateQuery,
  useAddPromoRateMutation,
  useEditPromoRateMutation,
  useGetAuditTrailQuery,
  useCreateQuoteMutation,
  useGeneratePersistedQuoteMutation,
  useDeleteZoneMutation,
  usePauseZoneMutation,
  useReInstateZoneMutation,
  useCreateSurchargeMutation,
  useDeleteSurchargeMutation,
  useEditSurchargeMutation,
  useGetSurchargesQuery,
  useGetSurchargeAuditLogQuery,
  useGetRateOverviewQuery,
  useGetDeliverySLAQuery,
  useUpdateDeliverySLAMutation,
  useGetAdminDashboardQuery,
  useGetAdminInvoicesQuery,
  useVerifyPaymentMutation,
  useDeletePromoRateMutation,
  useUpdateShipmentStatusMutation,
  useGetPricingStatsQuery,
  useGetCapabilitiesQuery,
  useGetAdminRolesQuery,
  useGetAdminRoleQuery,
  useAssignCustomRoleMutation,
  useUpdateCustomRoleMutation,
  useRevokeCustomRoleMutation,
  useGetFailedWebhooksQuery,
  useRetryFailedWebhookMutation,
  useDismissFailedWebhookMutation,
  useImportPricingSheetMutation,
  useExportPricingSheetMutation,
  useEditBoxDimensionMutation,
  useEditCityMutation,
  useEditZoneMutation,
  useGetNotificationsQuery,
  useGetUnreadNotificationCountQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
  useDeleteNotificationMutation,
  useBulkDeleteNotificationsMutation,
  // Sprint 6: Agent KPI & CSAT
  useGetAgentKpiQuery,
  useSubmitCsatMutation,
  // Sprint 8: Org Team Invite
  useInviteMemberMutation,
  useAcceptInviteMutation,
  useGetOrgInvitesQuery,
  useCancelOrgInviteMutation,
  useResendOrgInviteMutation,
  useRegisterOrganizationMutation,
  useGetOrgStatusQuery,
  useUpdateDriverLocationMutation,
  useExportShipmentsCsvMutation,
  useAssignShipmentMutation,
  useGetCannedResponsesQuery,
  useCreateCannedResponseMutation,
  useUpdateCannedResponseMutation,
  useDeleteCannedResponseMutation,
  // Sprint 5: Address Changes & Delay Alerts
  useRequestAddressChangeMutation,
  useMyAddressChangeRequestsQuery,
  useListAddressChangeRequestsQuery,
  useReviewAddressChangeMutation,
  useSendDelayAlertMutation,
  useGetOverdueShipmentsQuery,
} = apiSlice;
