"use client";

import { useController, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { Lock } from "lucide-react";

import { useEffect, useState } from "react";
import {
  ChangePasswordFormData,
  changePasswordSchema,
  ResetPasswordFormData,
  resetPasswordSchema,
} from "@/lib/validation";
import { AlertBanner, AuthCardHeader, CancelLink } from "../layout/authLayout";
import { Input, OTPInput } from "../ui/input";
import { Button } from "../ui/button";
import {
  useChangePasswordMutation,
  useResetPasswordMutation,
} from "@/store/slice/apiSlice";
import { useRouter } from "next/navigation";

// interface ResetPasswordFormProps {
//   resetToken: string;
//   onCancel?: () => void;
//   onSuccess?: () => void;
// }

export function ChangePasswordForm() {
  const router = useRouter();

  const [resetPassword, { data, isLoading }] = useChangePasswordMutation();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ChangePasswordFormData>({
    resolver: yupResolver(changePasswordSchema),
    defaultValues: { currentPassword: "", newPassword: "" },
  });

  const onSubmit = (data: ChangePasswordFormData) => {
    resetPassword(data);
  };

  useEffect(() => {
    if (data) {
      router.push("/auth/login");
    }
  }, [data]);

  return (
    <div className="w-1/3">
      <div>
        <h1 className="text-xl font-bold text-black">Change Password</h1>
        {
          <p className="text-base text-gray-500">
            Update your password to strengthen your security
          </p>
        }

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col gap-4 mt-6"
        >
          <Input
            label="Current Password"
            type="password"
            placeholder="••••••••••••••••••••"
            leftIcon={<Lock size={15} />}
            error={errors.currentPassword?.message}
            {...register("currentPassword")}
          />

          <Input
            label="Confirm Password"
            type="password"
            placeholder="••••••••••••••••••••"
            leftIcon={<Lock size={15} />}
            error={errors.newPassword?.message}
            {...register("newPassword")}
          />

          <Button
            type="submit"
            fullWidth
            isLoading={isLoading}
            className="mt-2"
          >
            Change Password
          </Button>
        </form>
      </div>
    </div>
  );
}
