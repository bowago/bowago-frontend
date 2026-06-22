"use client";
import { classifyAuthError } from "@/lib/authErrors";

import { useController, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";

import { useEffect, useState } from "react";
import { OTPFormData, otpSchema } from "@/lib/validation";
import { AlertBanner, AuthCardHeader, BackLink } from "../layout/authLayout";
import { OTPInput } from "../ui/input";
import { Button } from "../ui/button";
import {
  useResendOtpMutation,
  useVerifyEmailMutation,
} from "@/store/slice/apiSlice";
import { useParams, useRouter } from "next/navigation";

interface VerifyOTPFormProps {
  email: string;
}

export function VerifyOTPForm({ email }: VerifyOTPFormProps) {
  const router = useRouter();

  const [resendOTP, { isLoading: isResending }] = useResendOtpMutation();
  const [verifyEMAIL, { isLoading: isLoadingVerifyEmail, data }] =
    useVerifyEmailMutation();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<OTPFormData>({
    resolver: yupResolver(otpSchema),
    defaultValues: { otp: "" },
  });

  useEffect(() => {
    if (data) {
      router.push("/auth/login");
    }
  }, [data]);

  const { field } = useController({ name: "otp", control });

  const onSubmit = (data: OTPFormData) => {
    verifyEMAIL({ email, code: data.otp });
  };

  const handleResend = () => {
    resendOTP({ email, type: "EMAIL_VERIFY" });
  };

  return (
    <div>
      <BackLink onClick={() => {}} label="Back" />

      <AuthCardHeader
        title="Enter OTP"
        subtitle="Enter the 6-digit OTP sent to your registered email"
      />

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
        <OTPInput
          value={field.value}
          onChange={field.onChange}
          length={6}
          error={errors.otp?.message}
        />

        <p className="text-sm text-gray-500">
          Didn't get the code?{" "}
          <button
            type="button"
            onClick={handleResend}
            disabled={isResending}
            className="text-red-600 font-semibold hover:underline disabled:opacity-50 transition-colors"
          >
            {isResending ? "Sending..." : "Send Again"}
          </button>
        </p>

        <p className="text-xs text-gray-400 text-center -mt-2 mb-1">Can't find it? Check your spam/junk folder.</p>
        <Button type="submit" fullWidth isLoading={isLoadingVerifyEmail}>
          Verify Signup
        </Button>

        <p className="text-center text-sm text-black mt-5">
          Email already verified?{" "}
          <button
            onClick={() => router.push("/auth/login")}
            className="text-link"
          >
            Login
          </button>
        </p>
      </form>
    </div>
  );
}
