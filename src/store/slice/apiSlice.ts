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
import { authTokenChange, logoutUser, setUserData } from "./authSlice";
import { StaffResponseData } from "./types/staff.types";
import { errorToast, successToast } from "@/lib/toast/toast";
import {
  ContractRateFormData,
  CreateClaimFormData,
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

console.log("API_BASE_URL", API_BASE_URL);
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
      // Store the new tokens
      store.dispatch(
        authTokenChange({
          // @ts-expect-error
          accessToken: refreshResult.data.accessToken,
          refreshToken:
            // @ts-expect-error
            refreshResult.data.refreshToken ?? authState.refreshToken,
        }),
      );
      // Retry the original request
      result = await baseQuery(args, store, extraOptions);
    } else {
      store.dispatch(logoutUser());
    }
  }
  return result;
};

export const apiSlice = createApi({
  reducerPath: "api",
  tagTypes: [
    "Dimension",
    "Zone",
    "StandardRate",
    "ContractRate",
    "PromoRate",
    "Shipment",
    "Surcharge",
    "SurchargeAuditLog",
    "Ticket",
    "Claim",
    "FAQ",
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
          // console.log(data);
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
    updateUserProfile: builder.mutation<unknown, {
      firstName?: string;
      lastName?: string;
      phone?: string;
      avatar?: string;
    }>({
      query: (body) => ({
        url: `/users/me`,
        method: "PATCH",
        body,
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
      invalidatesTags: ["Zone"],
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
        boxDimensionId: string;
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
        label: string;
        discountPercent: number;
        fixedPricePerKgByZone: {
          [zone: string]: number;
        };
        isActive: boolean;
        validUntil: string;
        notes: string;
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
      invalidatesTags: ["Zone"],
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
      invalidatesTags: ["Zone"],
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
      invalidatesTags: ["Zone"],
    }),
    // useInitiateShipmentPaymentMutation
    InitiateShipmentPayment: builder.mutation<any, { shipmentId: string; callbackUrl?: string }>({
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
    CreateClaim: builder.mutation<unknown, CreateClaimFormData>({
      query: (formData) => ({
        url: "/claims",
        method: "POST",
        body: formData,
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
    // useCreateFAQMutation
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

    // useDeleteCityMutation
    deleteCity: builder.mutation<unknown, { id: string }>({
      query: (formData) => ({
        url: `/pricing/cities/${formData?.id}`,
        method: "DELETE",
        body: formData,
      }),
      async onQueryStarted(args, { queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          if (data) {
            successToast("City Deleted Successfully");
          }
        } catch (error) {
          const errorM = error as CustomError;
          errorToast(errorM.error?.data?.message || "Unexpected errror");
        }
      },
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
    }),

    // useGetPromoRateQuery
    GetPromoRate: builder.query<
      any,
      {
        isActive?: boolean;
      }
    >({
      query: (params) => {
        const searchParams = new URLSearchParams();

        if (params?.isActive) {
          searchParams.append("isActive", params.isActive.toString());
        }
        return `/promo-rates?${searchParams.toString()}`;
      },
      providesTags: ["PromoRate"], // Label this data as 'Post'
    }),

    // useGetStandardRateQuery
    GetStandardRate: builder.query<any, { zone: number }>({
      query: (params) => {
        const searchParams = new URLSearchParams();

        if (params?.zone) {
          searchParams.append("zone", String(params.zone));
        }
        return `/pricing/price-bands?${searchParams.toString()}`;
      },
      providesTags: ["StandardRate"], // Label this data as 'Post'
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
        if (params?.page)   searchParams.append("page",   String(params.page));
        if (params?.limit)  searchParams.append("limit",  String(params.limit));
        const qs = searchParams.toString();
        // Admin role hits /invoices/admin, customer hits /invoices/my
        const base = params?.admin ? "/invoices/admin" : "/invoices/my";
        return `${base}${qs ? "?" + qs : ""}`;
      },
      providesTags: ["Shipment"],
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
    // useGetClaimsQuery
    GetClaims: builder.query<unknown, void>({
      query: () => {
        return `/claims`;
      },
      providesTags: ["Claim"],
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
    // useGetZoneQuery
    GetZone: builder.query<any, { fromCity: string; toCity: string }>({
      query: (params) => {
        const searchParams = new URLSearchParams();

        if (params?.fromCity) {
          searchParams.append("fromCity", params.fromCity);
        }

        if (params?.toCity) {
          searchParams.append("toCity", params.toCity);
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
    GetUsers: builder.query<any, any>({
      query: () => {
        return `/users`;
      },
    }),

    // useGetAdminDashboardQuery
    GetAdminDashboard: builder.query<any, void>({
      query: () => "/admin/dashboard",
      providesTags: ["Shipment"],
    }),

    // useGetAdminInvoicesQuery
    GetAdminInvoices: builder.query<any, { status?: string; page?: number } | void>({
      query: (params) => {
        const searchParams = new URLSearchParams();
        if (params?.status) searchParams.append("status", params.status);
        if (params?.page)   searchParams.append("page",   String(params.page));
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
          errorToast(errorM.error?.data?.message || "Payment verification failed");
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
    UpdateShipmentStatus: builder.mutation<unknown, { id: string; status: string; location?: string; description?: string }>({
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

    // useGetPricingStatsQuery — already exists as GetRateOverview, but add canonical name
    GetPricingStats: builder.query<any, void>({
      query: () => "/pricing/stats",
      providesTags: ["StandardRate", "ContractRate", "PromoRate"],
    }),

    // useGetNotificationsQuery
    GetNotifications: builder.query<any, { page?: number } | void>({
      query: (params) => {
        const qs = params?.page ? `?page=${params.page}` : "";
        return `/notifications${qs}`;
      },
    }),

    // useMarkNotificationReadMutation
    MarkNotificationRead: builder.mutation<unknown, { id: string }>({
      query: ({ id }) => ({
        url: `/notifications/${id}/read`,
        method: "PATCH",
      }),
    }),


    // ─── 2FA ─────────────────────────────────────────────────────────────────
    Setup2FA: builder.mutation<any, { method: "SMS" | "EMAIL" }>({
      query: (body) => ({ url: "/auth/setup-2fa", method: "POST", body }),
      async onQueryStarted(_, { queryFulfilled }) {
        try { await queryFulfilled; }
        catch (e: any) { errorToast(e.error?.data?.message || "2FA setup failed"); }
      },
    }),
    Verify2FA: builder.mutation<any, { otp: string }>({
      query: (body) => ({ url: "/auth/verify-2fa", method: "POST", body }),
      async onQueryStarted(_, { queryFulfilled }) {
        try { const { data } = await queryFulfilled; if (data) successToast("2FA verified successfully"); }
        catch (e: any) { errorToast(e.error?.data?.message || "Verification failed"); }
      },
    }),

    // ─── User Management ──────────────────────────────────────────────────────
    UpdateUserRole: builder.mutation<any, { userId: string; adminSubRole: string }>({
      query: ({ userId, ...body }) => ({ url: `/users/${userId}/role`, method: "PATCH", body }),
      async onQueryStarted(_, { queryFulfilled }) {
        try { const { data } = await queryFulfilled; if (data) successToast("Role updated successfully"); }
        catch (e: any) { errorToast(e.error?.data?.message || "Role update failed"); }
      },
      invalidatesTags: [],
    }),
    ToggleUserActive: builder.mutation<any, { userId: string; isActive: boolean }>({
      query: ({ userId, isActive }) => ({ url: `/users/${userId}/status`, method: "PATCH", body: { isActive } }),
      async onQueryStarted(_, { queryFulfilled }) {
        try { const { data } = await queryFulfilled; if (data) successToast("User status updated"); }
        catch (e: any) { errorToast(e.error?.data?.message || "Status update failed"); }
      },
    }),

    // useGetRateOverviewQuery
    GetRateOverview: builder.query<any, any>({
      query: () => {
        return `/pricing/stats`;
      },
      providesTags: ["StandardRate", "ContractRate", "PromoRate"],
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
  useInitiateShipmentPaymentMutation,
  useGetUserShipmentsQuery,
  useGetUserShipmentsByIdQuery,
  useGetAdminShipmentsQuery,
  useCreateTicketMutation,
  useCreateClaimMutation,
  useCreateFAQMutation,
  // settings
  useGetUserProfileQuery,
  useUpdateUserProfileMutation,

  // users
  useGetUsersQuery,
  useUpdateUserRoleMutation,
  useToggleUserActiveMutation,
  useSetup2FAMutation,
  useVerify2FAMutation,

  // invoice
  useGetAllInvoiceQuery,
  useGetInvoiceFinancialOverviewQuery,
  useGetAllTicketQuery,
  useGetClaimsQuery,
  useGetFAQQuery,

  // rate management
  useAddCityMutation,
  useGetCitiesQuery,
  useDeleteCityMutation,
  useAddBoxDimensionMutation,
  useGetDimensionsQuery,
  useDeleteBoxMutation,
  useAddZoneMutation,
  useGetZoneQuery,
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
  useDeleteZoneMutation,
  usePauseZoneMutation,
  useReInstateZoneMutation,
  useCreateSurchargeMutation,
  useDeleteSurchargeMutation,
  useEditSurchargeMutation,
  useGetSurchargesQuery,
  useGetSurchargeAuditLogQuery,
  useGetRateOverviewQuery,
  useGetAdminDashboardQuery,
  useGetAdminInvoicesQuery,
  useVerifyPaymentMutation,
  useDeletePromoRateMutation,
  useUpdateShipmentStatusMutation,
  useGetPricingStatsQuery,
  useGetNotificationsQuery,
  useMarkNotificationReadMutation,
} = apiSlice;
