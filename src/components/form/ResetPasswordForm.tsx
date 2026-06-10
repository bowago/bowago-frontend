"use client";

import { useController, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { Lock } from "lucide-react";

import { useEffect, useState } from "react";
import { ResetPasswordFormData, resetPasswordSchema } from "@/lib/validation";
import { AlertBanner, AuthCardHeader, CancelLink } from "../layout/authLayout";
import { Input, OTPInput } from "../ui/input";
import { Button } from "../ui/button";
import { useResetPasswordMutation } from "@/store/slice/apiSlice";
import { useRouter } from "next/navigation";

// interface ResetPasswordFormProps {
//   resetToken: string;
//   onCancel?: () => void;
//   onSuccess?: () => void;
// }

export function ResetPasswordForm({ email }: { email: string }) {
  const router = useRouter();

  const [resetPassword, { data, isLoading }] = useResetPasswordMutation();

  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: yupResolver(resetPasswordSchema),
    defaultValues: { otp: "", confirmPassword: "", password: "" },
  });

  const { field } = useController({ name: "otp", control });

  const onSubmit = (data: ResetPasswordFormData) => {
    resetPassword({ code: data.otp, email: email, newPassword: data.password });
  };

  useEffect(() => {
    if (data) {
      router.push("/auth/login");
    }
  }, [data]);

  return (
    <div>
      <CancelLink onClick={() => router.push("/auth/login")} />

      <div className="mt-6">
        <AuthCardHeader
          title="Reset Password"
          subtitle="Enter Otp and Create a new password for your account"
        />

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col gap-4 mt-6"
        >
          <OTPInput
            value={field.value}
            onChange={field.onChange}
            length={6}
            error={errors.otp?.message}
          />

          <Input
            label="Password"
            type="password"
            placeholder="••••••••••••••••••••"
            leftIcon={<Lock size={15} />}
            error={errors.password?.message}
            {...register("password")}
          />

          <Input
            label="Confirm Password"
            type="password"
            placeholder="••••••••••••••••••••"
            leftIcon={<Lock size={15} />}
            error={errors.confirmPassword?.message}
            {...register("confirmPassword")}
          />

          <Button
            type="submit"
            fullWidth
            isLoading={isLoading}
            className="mt-2"
          >
            Reset Password
          </Button>
        </form>
      </div>
    </div>
  );
}
