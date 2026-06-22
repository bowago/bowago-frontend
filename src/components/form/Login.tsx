"use client";
import { classifyAuthError } from "@/lib/authErrors";

import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { Mail, Lock, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { AlertBanner, AuthCardHeader } from "../layout/authLayout";
import { LoginFormData, loginSchema } from "@/lib/validation";
import { Input } from "../ui/input/Input";
import { Button } from "../ui/button/button";
import { SocialLogin } from "../ui/button/social-button";
import { useRouter } from "next/navigation";
import {
  useLoginMutation,
  useVerifyLogin2FAMutation,
} from "@/store/slice/apiSlice";
import { useState } from "react";

export function LoginForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState("");

  // ── 2FA challenge state ──
  // If POST /auth/login returns requires2FA:true, we switch to this step
  // instead of redirecting — a 6-digit code has been emailed to the user.
  const [pending2FAEmail, setPending2FAEmail] = useState<string | null>(null);
  const [otp, setOtp] = useState("");

  const [onLogin, { isLoading }] = useLoginMutation();
  const [verifyLogin2FA, { isLoading: isVerifying2FA }] =
    useVerifyLogin2FAMutation();

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

      if (result?.data?.requires2FA) {
        // 2FA enabled — show OTP step instead of redirecting
        setPending2FAEmail(result.data.email ?? formData.email);
        return;
      }

      // onQueryStarted in apiSlice already dispatches token + user to Redux
      // Just redirect — token is already in store
      if (result?.data?.accessToken) {
        router.push("/dashboard");
      }
    } catch (err: any) {
      setServerError(classifyAuthError(err));
    }
  };

  const onVerify2FA = async () => {
    if (!pending2FAEmail || otp.length !== 6) return;
    setServerError("");
    try {
      const result = await verifyLogin2FA({
        email: pending2FAEmail,
        otp,
      }).unwrap();
      if (result?.data?.accessToken) {
        router.push("/dashboard");
      }
    } catch (err: any) {
      setServerError(classifyAuthError(err));
    }
  };

  // ── 2FA OTP step ──
  if (pending2FAEmail) {
    return (
      <>
        <AuthCardHeader
          title="Two-Factor Verification"
          subtitle={`Enter the 6-digit code sent to ${pending2FAEmail}`}
        />

        {serverError && <AlertBanner message={serverError} type="error" />}

        <div className="flex flex-col gap-4 mt-6">
          <Input
            label="Verification Code"
            type="text"
            inputMode="numeric"
            maxLength={6}
            placeholder="123456"
            leftIcon={<ShieldCheck size={15} />}
            value={otp}
            onChange={(e) =>
              setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
            }
          />

          <Button
            type="button"
            onClick={onVerify2FA}
            isLoading={isVerifying2FA}
            disabled={otp.length !== 6}
            fullWidth
            className="mt-1"
          >
            Verify & Continue
          </Button>

          <button
            type="button"
            onClick={() => {
              setPending2FAEmail(null);
              setOtp("");
              setServerError("");
            }}
            className="text-sm text-gray-500 hover:underline mt-1"
          >
            ← Back to login
          </button>
        </div>
      </>
    );
  }

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
