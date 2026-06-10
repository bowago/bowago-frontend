"use client";
import { useState } from "react";
import { Shield, Smartphone, Mail, CheckCircle, Loader2 } from "lucide-react";
import { useSetup2FAMutation, useVerify2FAMutation } from "@/store/slice/apiSlice";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { Button } from "@/components/ui/button";

type Step = "choose" | "pending" | "verify" | "done";
type Method = "SMS" | "EMAIL";

export default function TwoFASetupSection() {
  const user = useSelector((s: RootState) => s.auth.user);
  const [step, setStep] = useState<Step>("choose");
  const [method, setMethod] = useState<Method>("EMAIL");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");

  const [setup2FA, { isLoading: setting }] = useSetup2FAMutation();
  const [verify2FA, { isLoading: verifying }] = useVerify2FAMutation();

  const handleSetup = async () => {
    setError("");
    try {
      await setup2FA({ method }).unwrap();
      setStep("pending");
    } catch (e: any) {
      setError(e?.data?.message ?? "Failed to initiate 2FA. Try again.");
    }
  };

  const handleVerify = async () => {
    setError("");
    if (otp.length !== 6) { setError("Please enter the 6-digit code"); return; }
    try {
      await verify2FA({ otp }).unwrap();
      setStep("done");
    } catch (e: any) {
      setError(e?.data?.message ?? "Invalid code. Please try again.");
    }
  };

  return (
    <div className="max-w-md">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-brand/10 rounded-xl flex items-center justify-center">
          <Shield className="w-5 h-5 text-brand" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">Two-Factor Authentication</h3>
          <p className="text-sm text-gray-500">Add an extra layer of security to your account</p>
        </div>
      </div>

      {step === "choose" && (
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Two-factor authentication (2FA) adds an extra step when you log in, keeping your account secure even if your password is compromised.
          </p>
          <div className="space-y-3">
            <p className="text-sm font-medium text-gray-700">Choose your 2FA method:</p>
            {([
              { value: "EMAIL", label: "Email OTP", desc: `Send a 6-digit code to ${user?.email ?? "your email"}`, icon: Mail },
              { value: "SMS",   label: "SMS OTP",   desc: `Send a 6-digit code to ${user?.phone ?? "your phone"}`, icon: Smartphone },
            ] as const).map(({ value, label, desc, icon: Icon }) => (
              <button
                key={value}
                onClick={() => setMethod(value)}
                className={`w-full flex items-start gap-3 p-4 rounded-xl border-2 transition-all text-left ${
                  method === value
                    ? "border-brand bg-brand/5"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${method === value ? "bg-brand/10" : "bg-gray-100"}`}>
                  <Icon className={`w-4 h-4 ${method === value ? "text-brand" : "text-gray-500"}`} />
                </div>
                <div>
                  <p className="font-medium text-sm text-gray-900">{label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
                </div>
                <div className={`ml-auto w-4 h-4 rounded-full border-2 flex-shrink-0 mt-1 ${method === value ? "border-brand bg-brand" : "border-gray-300"}`} />
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
            A 6-digit code has been sent to your {method === "EMAIL" ? "email" : "phone"}. Enter it below to complete 2FA setup.
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Verification Code</label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="000000"
              className="w-full text-center text-2xl font-mono tracking-[0.5em] border-2 border-gray-200 rounded-xl py-4 focus:outline-none focus:border-brand transition-colors"
            />
            <p className="text-xs text-gray-400 mt-2 text-center">Code expires in 10 minutes</p>
          </div>
          {error && <p className="text-sm text-red-600 text-center">{error}</p>}
          <div className="flex gap-3">
            <Button  className="flex-1" onClick={() => { setStep("choose"); setOtp(""); setError(""); }}>
              Back
            </Button>
            <Button className="flex-1" isLoading={verifying} onClick={handleVerify}>
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
              Your account is now protected with two-factor authentication via {method === "EMAIL" ? "email" : "SMS"}.
            </p>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-xs text-green-700">
            You'll be asked for a verification code each time you log in.
          </div>
          <button
            onClick={() => { setStep("choose"); setOtp(""); setError(""); }}
            className="text-sm text-brand hover:underline"
          >
            Change 2FA method
          </button>
        </div>
      )}
    </div>
  );
}
