"use client";
import { useState } from "react";
import {
  Shield,
  Smartphone,
  Mail,
  CheckCircle,
  Loader2,
  Lock,
} from "lucide-react";
import {
  useSetup2FAMutation,
  useVerify2FAMutation,
  useDisable2FAMutation,
} from "@/store/slice/apiSlice";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { Button } from "@/components/ui/button";

type Step = "choose" | "pending" | "verify" | "done" | "manage" | "disable";
type Method = "SMS" | "EMAIL";

export default function TwoFASetupSection() {
  const user = useSelector((s: RootState) => s.auth.user);

  // If the account already has 2FA enabled, start on the "manage" screen
  // instead of the setup flow.
  const [step, setStep] = useState<Step>(
    (user as any)?.twoFactorEnabled ? "manage" : "choose",
  );
  const [method, setMethod] = useState<Method>("EMAIL");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const [setup2FA, { isLoading: setting }] = useSetup2FAMutation();
  const [verify2FA, { isLoading: verifying }] = useVerify2FAMutation();
  const [disable2FA, { isLoading: disabling }] = useDisable2FAMutation();

  const handleSetup = async () => {
    setError("");
    try {
      await setup2FA({ method }).unwrap();
      setStep("pending");
    } catch (e: any) {
      setError(e?.data?.message ?? "Failed to initiate 2FA. Try again.");
    }
  };

  // handleVerify
  const handleVerify = async () => {
    setError("");
    if (otp.length !== 6) {
      setError("Please enter the 6-digit code");
      return;
    }
    try {
      await verify2FA({ otp, method }).unwrap();
      setStep("done");
    } catch (e: any) {
      setError(e?.data?.message ?? "Invalid code. Please try again.");
    }
  };

  const handleDisable = async () => {
    setError("");
    if (!password) {
      setError("Enter your password to confirm");
      return;
    }
    try {
      await disable2FA({ password }).unwrap();
      setPassword("");
      setStep("choose");
    } catch (e: any) {
      setError(e?.data?.message ?? "Incorrect password");
    }
  };

  return (
    <div className="max-w-md">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-brand/10 rounded-xl flex items-center justify-center">
          <Shield className="w-5 h-5 text-brand" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">
            Two-Factor Authentication
          </h3>
          <p className="text-sm text-gray-500">
            Add an extra layer of security to your account
          </p>
        </div>
      </div>

      {step === "choose" && (
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Two-factor authentication (2FA) adds an extra step when you log in,
            keeping your account secure even if your password is compromised.
          </p>
          <div className="space-y-3">
            <p className="text-sm font-medium text-gray-700">
              Choose your 2FA method:
            </p>
            {(
              [
                {
                  value: "EMAIL",
                  label: "Email OTP",
                  desc: `Send a 6-digit code to ${user?.email ?? "your email"}`,
                  icon: Mail,
                  disabled: false,
                },
                {
                  value: "SMS",
                  label: "SMS OTP",
                  desc: user?.phone
                    ? `Send a 6-digit code to ${user.phone}`
                    : "Add a phone number in Personal Info to enable this",
                  icon: Smartphone,
                  disabled: !user?.phone,
                },
              ] as const
            ).map(({ value, label, desc, icon: Icon, disabled }) => (
              <button
                key={value}
                onClick={() => !disabled && setMethod(value)}
                disabled={disabled}
                className={`w-full flex items-start gap-3 p-4 rounded-xl border-2 transition-all text-left ${
                  disabled
                    ? "border-gray-100 bg-gray-50 opacity-60 cursor-not-allowed"
                    : method === value
                      ? "border-brand bg-brand/5"
                      : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${method === value && !disabled ? "bg-brand/10" : "bg-gray-100"}`}
                >
                  <Icon
                    className={`w-4 h-4 ${method === value && !disabled ? "text-brand" : "text-gray-500"}`}
                  />
                </div>
                <div>
                  <p className="font-medium text-sm text-gray-900">{label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
                </div>
                {!disabled && (
                  <div
                    className={`ml-auto w-4 h-4 rounded-full border-2 flex-shrink-0 mt-1 ${method === value ? "border-brand bg-brand" : "border-gray-300"}`}
                  />
                )}
              </button>
            ))}
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button className="w-full" isLoading={setting} onClick={handleSetup}>
            Enable 2FA via {method === "EMAIL" ? "Email" : "SMS"}
          </Button>
        </div>
      )}

      {step === "pending" && (
        <div className="space-y-6">
          <div className="bg-brand/5 border border-brand/20 rounded-xl p-4 text-sm text-brand">
            A 6-digit code has been sent to your{" "}
            {method === "EMAIL" ? "email" : "phone"}. Enter it below to complete
            2FA setup.
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Verification Code
            </label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={otp}
              onChange={(e) =>
                setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
              }
              placeholder="000000"
              className="w-full text-center text-2xl font-mono tracking-[0.5em] border-2 border-gray-200 rounded-xl py-4 focus:outline-none focus:border-brand transition-colors"
            />
            <p className="text-xs text-gray-400 mt-2 text-center">
              Code expires in 10 minutes
            </p>
          </div>
          {error && <p className="text-sm text-red-600 text-center">{error}</p>}
          <div className="flex gap-3">
            <Button
              className="flex-1"
              onClick={() => {
                setStep("choose");
                setOtp("");
                setError("");
              }}
            >
              Back
            </Button>
            <Button
              className="flex-1"
              isLoading={verifying}
              onClick={handleVerify}
            >
              Verify Code
            </Button>
          </div>
          <button
            onClick={handleSetup}
            disabled={setting}
            className="w-full text-sm text-brand hover:underline disabled:opacity-50"
          >
            Resend code
          </button>
        </div>
      )}

      {step === "done" && (
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">2FA Enabled!</h3>
            <p className="text-sm text-gray-500 mt-1">
              Your account is now protected with two-factor authentication via{" "}
              {method === "EMAIL" ? "email" : "SMS"}.
            </p>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-xs text-green-700">
            You'll be asked for a verification code each time you log in.
          </div>
          <button
            onClick={() => {
              setStep("choose");
              setOtp("");
              setError("");
            }}
            className="text-sm text-brand hover:underline"
          >
            Change 2FA method
          </button>
        </div>
      )}
      {step === "manage" && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl p-4">
            <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-green-800">
                Two-factor authentication is enabled
              </p>
              <p className="text-xs text-green-700 mt-0.5">
                You'll be asked for a 6-digit email code each time you log in.
              </p>
            </div>
          </div>

          {/* FIX: accounts that already had 2FA enabled (including before
              this session-token fix shipped) had no way to refresh their
              mfaVerifiedAt session — setup2FA used to refuse to send a code
              once 2FA was already on. It now will, so this button lets
              anyone re-verify on demand, e.g. right before visiting a
              2FA-gated page like Invoices. */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <p className="text-sm font-medium text-amber-800 mb-1">
              Accessing a secure page like Invoices?
            </p>
            <p className="text-xs text-amber-700 mb-3">
              If you're being asked to verify again, request a fresh code below.
            </p>
            {error && <p className="text-sm text-red-600 mb-2">{error}</p>}
            <Button isLoading={setting} onClick={handleSetup} className="w-full">
              Send Verification Code
            </Button>
          </div>

          <button
            onClick={() => {
              setStep("disable");
              setError("");
            }}
            className="text-sm text-red-600 hover:underline"
          >
            Disable two-factor authentication
          </button>
        </div>
      )}

      {step === "disable" && (
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
            Disabling 2FA will remove the extra verification step at login.
            Enter your password to confirm.
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Lock className="w-3.5 h-3.5 inline mr-1" />
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-brand transition-colors"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-3">
            <Button
              className="flex-1"
              onClick={() => {
                setStep("manage");
                setPassword("");
                setError("");
              }}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 bg-red-600 hover:bg-red-700"
              isLoading={disabling}
              onClick={handleDisable}
            >
              Disable 2FA
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
