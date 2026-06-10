"use client";

import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { Mail, Lock } from "lucide-react";
import Link from "next/link";
import { AlertBanner, AuthCardHeader } from "../layout/authLayout";
import { LoginFormData, loginSchema } from "@/lib/validation";
import { Input } from "../ui/input/Input";
import { Button } from "../ui/button/button";
import { SocialLogin } from "../ui/button/social-button";
import { useRouter } from "next/navigation";
import { useLoginMutation } from "@/store/slice/apiSlice";
import { useState } from "react";

export function LoginForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState("");

  const [onLogin, { isLoading }] = useLoginMutation();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: yupResolver(loginSchema),
  });

  const onSubmit = async (formData: LoginFormData) => {
    setServerError("");
    try {
      // unwrap() throws on error, resolves with data on success
      const result = await onLogin(formData).unwrap();
      // onQueryStarted in apiSlice already dispatches token + user to Redux
      // Just redirect — token is already in store
      if (result?.data?.accessToken) {
        router.push("/dashboard");
      }
    } catch (err: any) {
      const msg =
        err?.data?.message ||
        err?.error?.data?.message ||
        err?.message ||
        "Login failed. Check your email and password.";
      setServerError(msg);
    }
  };

  return (
    <>
      <AuthCardHeader
        title="Login"
        subtitle="Enter your login details to continue"
      />

      {serverError && <AlertBanner message={serverError} type="error" />}

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-col gap-4 mt-6"
      >
        <Input
          label="Email Address"
          type="email"
          placeholder="Enter mail address"
          leftIcon={<Mail size={15} />}
          error={errors.email?.message}
          {...register("email")}
        />

        <div className="flex flex-col gap-1">
          <Input
            label="Password"
            type="password"
            placeholder="••••••••••••••••••••"
            leftIcon={<Lock size={15} />}
            error={errors.password?.message}
            {...register("password")}
          />
          <div className="flex justify-end">
            <Link href="/auth/forgot-password" className="text-link">
              Forgot Password?
            </Link>
          </div>
        </div>

        <Button type="submit" isLoading={isLoading} fullWidth className="mt-1">
          Login
        </Button>
      </form>

      <SocialLogin label="Login with" />

      <p className="text-center text-sm text-black mt-5">
        Don&apos;t have an account yet?{" "}
        <Link href="/auth/signup" className="text-link">
          Sign Up
        </Link>
      </p>
    </>
  );
}
