"use client";

import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { Mail } from "lucide-react";
import { useEffect, useState } from "react";
import { ForgotPasswordFormData, forgotPasswordSchema } from "@/lib/validation";
import { AlertBanner, AuthCardHeader, BackLink } from "../layout/authLayout";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { useRouter } from "next/navigation";
import { useForgotPasswordMutation } from "@/store/slice/apiSlice";

export function ForgotPasswordForm({}) {
  const router = useRouter();


    const [onForgotPassword, {isLoading, data, originalArgs}] = useForgotPasswordMutation();

      useEffect(() => {
        if (data) {
          router.push(`/auth/reset-password/${originalArgs?.email}`);
        }
      }, [data]);
    

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: yupResolver(forgotPasswordSchema),
  });

  const onSubmit = (data: ForgotPasswordFormData) => {
  
    onForgotPassword(data);
  };

  return (
    <div className="z-20">
      <BackLink onClick={() => router.push("/auth/login")} label="Back" />

      <AuthCardHeader
        title="Forgot Password"
        subtitle="Enter the email address associated with the account"
      />


      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-col gap-4 mt-8"
      >
        <Input
          label="Email Address"
          type="email"
          placeholder="Enter mail address"
          leftIcon={<Mail size={15} />}
          error={errors.email?.message}
          {...register("email")}
        />

        <Button type="submit" fullWidth isLoading={isLoading} className="mt-1">
          Send OTP
        </Button>
      </form>
    </div>
  );
}
