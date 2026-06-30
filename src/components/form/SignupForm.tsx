"use client";
import { classifyAuthError } from "@/lib/authErrors";

import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { User, Mail, Building2, Phone, Lock } from "lucide-react";
import { useState } from "react";
import { SignupFormData, signupSchema } from "@/lib/validation";
import { AlertBanner, AuthCardHeader } from "../layout/authLayout";
import { Input } from "../ui/input";
import { Button, SocialLogin } from "../ui/button";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSignupMutation } from "@/store/slice/apiSlice";

interface SignupFormProps {
  onSuccess?: () => void;
  onLogin?: () => void;
}

export function SignupForm({ onSuccess, onLogin }: SignupFormProps) {
  const router = useRouter();
  const [onSignup, { isLoading }] = useSignupMutation({});
  const [serverError, setServerError] = useState("");

  const {
    setError,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(signupSchema),
  });

  const onSubmit = async (data: SignupFormData) => {
    setServerError("");
    const parts = data.fullName.trim().split(/\s+/);
    if (parts.length < 2) {
      setError("fullName", { message: "Enter first name and last name" });
      return;
    }
    const [firstname, ...rest] = parts;
    const lastname = rest.join(" ");
    try {
      await onSignup({
        email: data.email,
        password: data.password,
        firstName: firstname,
        lastName: lastname,
        phone: data.phoneNumber,
      }).unwrap();
      router.push(`/auth/verify-otp/${data.email}`);
    } catch (err: any) {
      setServerError(classifyAuthError(err));
    }
  };

  return (
    <>
      <AuthCardHeader
        title="Sign Up"
        subtitle="Create an account to continue usage."
      />

      {serverError && <AlertBanner message={serverError} type="error" />}

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        {/* Full Name — full width */}
        <Input
          label="Full Name"
          type="text"
          placeholder="John Doe"
          leftIcon={<User size={15} />}
          error={errors.fullName?.message}
          {...register("fullName")}
        />

        {/* Email — full width */}
        <Input
          label="Email Address"
          type="email"
          placeholder="you@example.com"
          leftIcon={<Mail size={15} />}
          error={errors.email?.message}
          {...register("email")}
        />

        {/* Phone + Business side by side */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Phone Number"
            type="tel"
            placeholder="08012345678"
            leftIcon={<Phone size={15} />}
            error={errors.phoneNumber?.message}
            {...register("phoneNumber")}
          />
          <Input
            label="Business Name (Optional)"
            type="text"
            placeholder="Acme Ltd"
            leftIcon={<Building2 size={15} />}
            error={errors.businessName?.message}
            {...register("businessName")}
          />
        </div>

        {/* Password + Confirm side by side */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Password"
            type="password"
            placeholder="••••••••••••"
            leftIcon={<Lock size={15} />}
            error={errors.password?.message}
            {...register("password")}
          />
          <Input
            label="Confirm Password"
            type="password"
            placeholder="••••••••••••"
            leftIcon={<Lock size={15} />}
            error={errors.confirmPassword?.message}
            {...register("confirmPassword")}
          />
        </div>

        <Button type="submit" fullWidth className="mt-1" isLoading={isLoading}>
          Sign Up
        </Button>
      </form>

      <SocialLogin label="Sign Up with" />

      <p className="text-center text-sm text-gray-600 font-medium mt-4">
        Already have an account?{" "}
        {onLogin ? (
          <button
            type="button"
            onClick={onLogin}
            className="text-link font-semibold"
          >
            Login
          </button>
        ) : (
          <Link href="/auth/login" className="text-link">
            Login
          </Link>
        )}
      </p>
    </>
  );
}
