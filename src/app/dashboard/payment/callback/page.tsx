"use client";
import { Suspense } from "react";
import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useVerifyPaymentMutation } from "@/store/slice/apiSlice";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

function PaymentCallbackInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const reference = searchParams.get("reference") ?? searchParams.get("trxref");
  const statusHint = searchParams.get("status"); // from backend redirect — used for initial UI only

  const [verify] = useVerifyPaymentMutation();
  const [state, setState] = useState<"loading" | "success" | "failed">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    // No reference at all — nothing to verify
    if (!reference) {
      setState("failed");
      setMessage("No payment reference found. Please contact support.");
      return;
    }

    // Always call verifyPayment — this is what actually updates the DB
    // (sets paymentStatus=PAID, status=CONFIRMED, creates tracking event etc).
    // The ?status hint from the backend redirect is only used for the loading
    // message to give the user faster feedback, not to skip verification.
    verify({ reference })
      .unwrap()
      .then((data: any) => {
        const paymentStatus = data?.data?.payment?.status;
        if (paymentStatus === "PAID") {
          setState("success");
          setMessage("Your payment was successful! Your shipment is now confirmed.");
        } else {
          // Paystack returned success but our DB says otherwise —
          // could be a race; show soft message
          setState("failed");
          setMessage(
            statusHint === "success"
              ? "Payment received but confirmation is still processing. Check your shipments in a moment."
              : "Payment could not be confirmed. Please contact support."
          );
        }
      })
      .catch((err: any) => {
        const msg = err?.data?.message || "";
        // "Payment record not found" means the reference doesn't match any
        // payment we created — likely a duplicate tab or stale redirect.
        setState("failed");
        setMessage(
          msg || "Payment verification failed. Please check your shipments or contact support."
        );
      });
  }, [reference]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white rounded-2xl shadow-sm border p-10 max-w-md w-full text-center">

        {state === "loading" && (
          <>
            <Loader2 className="animate-spin w-12 h-12 text-brand mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-800">Verifying Payment...</h2>
            <p className="text-gray-500 text-sm mt-2">
              {statusHint === "success"
                ? "Payment received — confirming your shipment..."
                : "Please wait while we confirm your transaction."}
            </p>
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
                className="w-full bg-brand text-white py-3 rounded-xl font-medium text-sm"
              >
                View My Shipments
              </button>
              <button
                onClick={() => router.push("/dashboard/invoice")}
                className="w-full border text-gray-600 py-3 rounded-xl font-medium text-sm"
              >
                View Invoice
              </button>
              {/* Gap 7: Packaging guide — Sprint 5 DoD: accessible within 2 clicks of booking confirmation */}
              <button
                onClick={() => router.push("/packaging-guide")}
                className="w-full border border-dashed border-gray-300 text-gray-500 py-3 rounded-xl font-medium text-sm hover:border-gray-400 hover:text-gray-700 transition-colors"
              >
                📦 How to Package Your Item
              </button>
            </div>
          </>
        )}

        {state === "failed" && (
          <>
            <XCircle className="w-14 h-14 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-800">Payment Not Confirmed</h2>
            <p className="text-gray-500 text-sm mt-2">{message}</p>
            <div className="flex flex-col gap-3 mt-6">
              <button
                onClick={() => router.push("/dashboard/shipments")}
                className="w-full bg-brand text-white py-3 rounded-xl font-medium text-sm"
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

export default function PaymentCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin w-8 h-8 text-gray-400" />
      </div>
    }>
      <PaymentCallbackInner />
    </Suspense>
  );
}
