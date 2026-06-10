"use client";
import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useVerifyPaymentMutation } from "@/store/slice/apiSlice";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

export default function PaymentCallbackPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const reference = searchParams.get("reference") ?? searchParams.get("trxref");
  const [verify] = useVerifyPaymentMutation();
  const [state, setState] = useState<"loading" | "success" | "failed">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!reference) {
      setState("failed");
      setMessage("No payment reference found.");
      return;
    }
    verify({ reference })
      .unwrap()
      .then((data: any) => {
        if (data?.data?.payment?.status === "PAID" || data?.success) {
          setState("success");
          setMessage("Your payment was successful! Your shipment is now being processed.");
        } else {
          setState("failed");
          setMessage("Payment could not be confirmed. Please contact support.");
        }
      })
      .catch(() => {
        setState("failed");
        setMessage("Payment verification failed. Please contact support.");
      });
  }, [reference]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white rounded-2xl shadow-sm border p-10 max-w-md w-full text-center">
        {state === "loading" && (
          <>
            <Loader2 className="animate-spin w-12 h-12 text-[#2E75B6] mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-800">Verifying Payment...</h2>
            <p className="text-gray-500 text-sm mt-2">Please wait while we confirm your transaction.</p>
          </>
        )}
        {state === "success" && (
          <>
            <CheckCircle className="w-14 h-14 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-800">Payment Successful!</h2>
            <p className="text-gray-500 text-sm mt-2">{message}</p>
            {reference && (
              <p className="font-mono text-xs text-gray-400 mt-2 bg-gray-50 px-3 py-1.5 rounded-lg">
                Ref: {reference}
              </p>
            )}
            <div className="flex flex-col gap-3 mt-6">
              <button
                onClick={() => router.push("/dashboard/shipments")}
                className="w-full bg-[#1F3A70] text-white py-3 rounded-xl font-medium text-sm"
              >
                View My Shipments
              </button>
              <button
                onClick={() => router.push("/dashboard/invoice")}
                className="w-full border text-gray-600 py-3 rounded-xl font-medium text-sm"
              >
                View Invoice
              </button>
            </div>
          </>
        )}
        {state === "failed" && (
          <>
            <XCircle className="w-14 h-14 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-800">Payment Failed</h2>
            <p className="text-gray-500 text-sm mt-2">{message}</p>
            <div className="flex flex-col gap-3 mt-6">
              <button
                onClick={() => router.push("/dashboard/shipments")}
                className="w-full bg-[#1F3A70] text-white py-3 rounded-xl font-medium text-sm"
              >
                Back to Shipments
              </button>
              <button
                onClick={() => router.push("/dashboard")}
                className="w-full border text-gray-600 py-3 rounded-xl font-medium text-sm"
              >
                Go to Dashboard
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
