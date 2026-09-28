"use client";

import { useGetInsuranceDisclaimerQuery } from "@/store/slice/apiSlice";

/**
 * The uninsured-risk notice shown wherever a customer has left insurance off.
 * Reads the disclaimer an admin published under Adhoc Charges -> Insurance
 * Disclaimer (text + liability limit). If none has been published yet it
 * falls back to a generic notice, so the warning is never silently absent.
 */
export default function UninsuredNotice({
  declaredValue,
  premiumNaira,
}: {
  declaredValue: number;
  premiumNaira?: number;
}) {
  const { data } = useGetInsuranceDisclaimerQuery();
  const disclaimer = (data as any)?.data?.disclaimer as
    | { version: string; body: string; liabilityLimitKobo: number }
    | null
    | undefined;

  return (
    <div className="space-y-1.5 text-xs text-amber-700">
      {disclaimer ? (
        <>
          <p className="whitespace-pre-line">{disclaimer.body}</p>
          <p className="font-semibold">
            Maximum liability without insurance: ₦
            {(disclaimer.liabilityLimitKobo / 100).toLocaleString()}
          </p>
        </>
      ) : (
        <p>
          You have not selected insurance. If this shipment is lost or damaged,
          compensation is limited to the standard liability limit.
        </p>
      )}
      {declaredValue > 0 && (
        <p>
          You&apos;ve declared these items are worth ₦
          {declaredValue.toLocaleString()}.
          {premiumNaira && premiumNaira > 0
            ? ` Insurance for this shipment would cost ₦${premiumNaira.toLocaleString()} and covers the full declared value.`
            : ""}
        </p>
      )}
    </div>
  );
}
