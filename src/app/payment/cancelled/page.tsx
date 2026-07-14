"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { XCircle, Home, RefreshCw } from "lucide-react";

function CancelledInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reference = searchParams.get("reference") ?? searchParams.get("trxref");

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white rounded-2xl shadow-sm border p-10 max-w-md w-full text-center">
        <XCircle className="w-14 h-14 text-gray-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-800">
          Payment Cancelled
        </h2>
        <p className="text-gray-500 text-sm mt-2">
          You cancelled the checkout — no charge was made to your card or
          account. Your shipment is saved and still awaiting payment whenever
          you're ready.
        </p>
        {reference && (
          <p className="font-mono text-xs text-gray-400 mt-2 bg-gray-50 px-3 py-1.5 rounded-lg">
            Ref: {reference}
          </p>
        )}
        <div className="flex flex-col gap-3 mt-6">
          <button
            onClick={() => router.push("/dashboard/shipments")}
            className="w-full bg-brand text-white py-3 rounded-xl font-medium text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
          >
            <RefreshCw className="w-4 h-4" />
            Try Payment Again
          </button>
          <button
            onClick={() => router.push("/dashboard")}
            className="w-full border text-gray-600 py-3 rounded-xl font-medium text-sm flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors"
          >
            <Home className="w-4 h-4" />
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PaymentCancelledPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50" />
      }
    >
      <CancelledInner />
    </Suspense>
  );
}
