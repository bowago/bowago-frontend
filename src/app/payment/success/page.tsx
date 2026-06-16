"use client";
// Legacy redirect — Paystack may hit /payment/success from old callback config.
// We forward to the real callback page preserving all query params.
import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";

function RedirectInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  useEffect(() => {
    const ref = searchParams.get("ref") ?? searchParams.get("reference") ?? "";
    router.replace(`/dashboard/payment/callback?reference=${ref}&status=success`);
  }, []);
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="animate-spin w-8 h-8 text-gray-400" />
    </div>
  );
}
export default function Page() {
  return <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin w-8 h-8 text-gray-400" /></div>}><RedirectInner /></Suspense>;
}
