"use client";

import { useState } from "react";
import { AlertTriangle, CheckCircle, ChevronDown, Loader2, MessageSquare, TrendingDown, X } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog/dialog";
import { Button } from "@/components/ui/button";
import {
  useAcknowledgePriceAdjustmentMutation,
  useDowngradePriceAdjustmentMutation,
  useCancelPriceAdjustmentMutation,
  useContactSupportForAdjustmentMutation,
} from "@/store/slice/apiSlice";

type PriceAdjustment = {
  id: string;
  originalPrice: number;
  adjustedPrice: number;
  difference: number;
  reason: string;
  actualWeightKg?: number;
  proofImageUrls?: string[] | null;
  responseDeadline?: string | null;
  status: string;
};

type Props = {
  adjustment: PriceAdjustment;
  shipmentServiceType?: string; // "EXPRESS" | "STANDARD" | "ECONOMY"
  trackingNumber?: string;
  onClose: () => void;
  onResolved?: () => void;
};

const SERVICE_TIERS = ["ECONOMY", "STANDARD", "EXPRESS"];

const formatNaira = (n: number) =>
  `₦${n.toLocaleString("en-NG", { minimumFractionDigits: 0 })}`;

const formatDeadline = (d?: string | null) => {
  if (!d) return null;
  const dt = new Date(d);
  const diffMs = dt.getTime() - Date.now();
  const diffH = Math.floor(diffMs / (1000 * 60 * 60));
  const diffM = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  if (diffMs <= 0) return "Deadline passed";
  if (diffH > 0) return `${diffH}h ${diffM}m remaining`;
  return `${diffM}m remaining`;
};

type Option = "PAY" | "DOWNGRADE" | "CANCEL" | "SUPPORT" | null;

export default function PriceAdjustmentResponseModal({
  adjustment,
  shipmentServiceType = "STANDARD",
  trackingNumber,
  onClose,
  onResolved,
}: Props) {
  const [selectedOption, setSelectedOption] = useState<Option>(null);
  const [selectedTier, setSelectedTier] = useState("");
  const [supportMessage, setSupportMessage] = useState("");
  const [payResult, setPayResult] = useState<{ authorizationUrl: string } | null>(null);
  const [done, setDone] = useState(false);
  const [doneMsg, setDoneMsg] = useState("");

  const [acknowledge, { isLoading: isPaying }] = useAcknowledgePriceAdjustmentMutation();
  const [downgrade, { isLoading: isDowngrading }] = useDowngradePriceAdjustmentMutation();
  const [cancel, { isLoading: isCancelling }] = useCancelPriceAdjustmentMutation();
  const [contactSupport, { isLoading: isContacting }] = useContactSupportForAdjustmentMutation();

  const downgradeTiers = SERVICE_TIERS.filter(
    (t) => SERVICE_TIERS.indexOf(t) < SERVICE_TIERS.indexOf(shipmentServiceType),
  );

  const deadline = formatDeadline(adjustment.responseDeadline);

  const handlePay = async () => {
    try {
      const res = await acknowledge(adjustment.id).unwrap();
      const url = res?.data?.payment?.authorizationUrl;
      if (url) {
        setPayResult({ authorizationUrl: url });
      } else {
        setDone(true);
        setDoneMsg("Acknowledged. You can complete payment from your notifications.");
      }
    } catch {}
  };

  const handleDowngrade = async () => {
    if (!selectedTier) return;
    try {
      await downgrade({ id: adjustment.id, newServiceType: selectedTier }).unwrap();
      setDone(true);
      setDoneMsg("Shipment downgraded. It will resume once any remaining payment is processed.");
      onResolved?.();
    } catch {}
  };

  const handleCancel = async () => {
    try {
      await cancel(adjustment.id).unwrap();
      setDone(true);
      setDoneMsg("Shipment cancelled. Your refund has been initiated and will arrive in 3–5 business days.");
      onResolved?.();
    } catch {}
  };

  const handleSupport = async () => {
    try {
      await contactSupport({ id: adjustment.id, message: supportMessage }).unwrap();
      setDone(true);
      setDoneMsg("A support ticket has been opened. A Finance agent will reach out to you shortly.");
    } catch {}
  };

  if (done) {
    return (
      <div className="p-8 text-center">
        <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
        <p className="text-base font-medium mb-1">Got it!</p>
        <p className="text-sm text-gray-500 mb-6">{doneMsg}</p>
        <Button onClick={onClose}>Close</Button>
      </div>
    );
  }

  if (payResult) {
    return (
      <div className="p-8 text-center">
        <p className="text-base font-semibold mb-2">Complete your payment</p>
        <p className="text-sm text-gray-500 mb-6">
          Click below to pay the balance of {formatNaira(adjustment.difference)} and resume your
          shipment.
        </p>
        <a
          href={payResult.authorizationUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block bg-brand text-white text-sm font-medium rounded-xl px-6 py-3"
        >
          Pay {formatNaira(adjustment.difference)} now
        </a>
        <button onClick={onClose} className="block mx-auto mt-4 text-xs text-gray-400 hover:text-gray-600">
          I'll pay later
        </button>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-start gap-3 mb-5">
        <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
          <AlertTriangle className="w-5 h-5 text-orange-600" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">Action Required — Price Adjustment</h2>
          {trackingNumber && (
            <p className="text-sm text-gray-500 mt-0.5">Shipment {trackingNumber}</p>
          )}
        </div>
        <button onClick={onClose} className="ml-auto text-gray-400 hover:text-gray-600">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Price summary */}
      <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-5">
        <div className="flex justify-between text-sm mb-1.5">
          <span className="text-gray-500">Original quote</span>
          <span>{formatNaira(adjustment.originalPrice)}</span>
        </div>
        <div className="flex justify-between text-sm mb-1.5">
          <span className="text-gray-500">Revised price</span>
          <span className="font-semibold">{formatNaira(adjustment.adjustedPrice)}</span>
        </div>
        <div className="border-t border-orange-200 pt-2 mt-2 flex justify-between text-sm font-semibold text-orange-700">
          <span>Balance due</span>
          <span>+{formatNaira(adjustment.difference)}</span>
        </div>
        {adjustment.actualWeightKg && (
          <p className="text-xs text-gray-500 mt-2">
            Actual weight measured at hub: <strong>{adjustment.actualWeightKg}kg</strong>
          </p>
        )}
        {adjustment.reason && (
          <p className="text-xs text-gray-500 mt-1">{adjustment.reason}</p>
        )}
        {deadline && (
          <p className="text-xs text-orange-600 mt-2 font-medium">⏱ {deadline}</p>
        )}
      </div>

      {/* Proof images */}
      {adjustment.proofImageUrls && adjustment.proofImageUrls.length > 0 && (
        <div className="mb-5">
          <p className="text-xs text-gray-500 mb-2">Proof of weight (warehouse photo)</p>
          <div className="flex gap-2 flex-wrap">
            {adjustment.proofImageUrls.map((url, i) => (
              <a key={i} href={url} target="_blank" rel="noreferrer">
                <img
                  src={url}
                  alt={`Proof ${i + 1}`}
                  className="w-20 h-20 object-cover rounded-lg border border-gray-200 hover:opacity-80 transition-opacity"
                />
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Options */}
      <p className="text-sm font-medium text-gray-700 mb-3">What would you like to do?</p>

      <div className="space-y-2.5">
        {/* Option 1: Pay */}
        <div
          className={`border rounded-xl overflow-hidden cursor-pointer transition-colors ${selectedOption === "PAY" ? "border-brand" : "border-gray-200 hover:border-gray-300"}`}
          onClick={() => setSelectedOption("PAY")}
        >
          <div className="flex items-center gap-3 px-4 py-3.5">
            <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 ${selectedOption === "PAY" ? "border-brand bg-brand" : "border-gray-300"}`} />
            <div>
              <p className="text-sm font-medium">Pay the difference ({formatNaira(adjustment.difference)})</p>
              <p className="text-xs text-gray-500">Your shipment resumes immediately after payment</p>
            </div>
          </div>
          {selectedOption === "PAY" && (
            <div className="border-t border-brand/20 px-4 py-3 bg-brand/5">
              <Button onClick={handlePay} isLoading={isPaying} className="w-full">
                Pay {formatNaira(adjustment.difference)} now
              </Button>
            </div>
          )}
        </div>

        {/* Option 2: Downgrade */}
        {downgradeTiers.length > 0 && (
          <div
            className={`border rounded-xl overflow-hidden cursor-pointer transition-colors ${selectedOption === "DOWNGRADE" ? "border-brand" : "border-gray-200 hover:border-gray-300"}`}
            onClick={() => setSelectedOption("DOWNGRADE")}
          >
            <div className="flex items-center gap-3 px-4 py-3.5">
              <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 ${selectedOption === "DOWNGRADE" ? "border-brand bg-brand" : "border-gray-300"}`} />
              <div className="flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-blue-500" />
                <div>
                  <p className="text-sm font-medium">Downgrade service tier</p>
                  <p className="text-xs text-gray-500">Switch to a cheaper tier; price recalculated</p>
                </div>
              </div>
            </div>
            {selectedOption === "DOWNGRADE" && (
              <div className="border-t border-brand/20 px-4 py-3 bg-brand/5 space-y-3">
                <div className="relative">
                  <select
                    value={selectedTier}
                    onChange={(e) => setSelectedTier(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm appearance-none bg-white"
                  >
                    <option value="">Select a tier…</option>
                    {downgradeTiers.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
                <Button
                  onClick={handleDowngrade}
                  isLoading={isDowngrading}
                  disabled={!selectedTier}
                  className="w-full"
                >
                  Confirm downgrade to {selectedTier || "…"}
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Option 3: Cancel */}
        <div
          className={`border rounded-xl overflow-hidden cursor-pointer transition-colors ${selectedOption === "CANCEL" ? "border-red-400" : "border-gray-200 hover:border-gray-300"}`}
          onClick={() => setSelectedOption("CANCEL")}
        >
          <div className="flex items-center gap-3 px-4 py-3.5">
            <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 ${selectedOption === "CANCEL" ? "border-red-400 bg-red-400" : "border-gray-300"}`} />
            <div>
              <p className="text-sm font-medium text-red-600">Cancel shipment & get refund</p>
              <p className="text-xs text-gray-500">A full refund will be initiated (3–5 business days)</p>
            </div>
          </div>
          {selectedOption === "CANCEL" && (
            <div className="border-t border-red-200 px-4 py-3 bg-red-50 space-y-2">
              <p className="text-xs text-red-600">
                Your shipment will be cancelled and your original payment refunded. This cannot be undone.
              </p>
              <Button
                variant="secondary"
                onClick={handleCancel}
                isLoading={isCancelling}
                className="w-full border-red-400 text-red-600 hover:bg-red-50"
              >
                Confirm cancellation
              </Button>
            </div>
          )}
        </div>

        {/* Option 4: Contact support */}
        <div
          className={`border rounded-xl overflow-hidden cursor-pointer transition-colors ${selectedOption === "SUPPORT" ? "border-brand" : "border-gray-200 hover:border-gray-300"}`}
          onClick={() => setSelectedOption("SUPPORT")}
        >
          <div className="flex items-center gap-3 px-4 py-3.5">
            <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 ${selectedOption === "SUPPORT" ? "border-brand bg-brand" : "border-gray-300"}`} />
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-purple-500" />
              <div>
                <p className="text-sm font-medium">Dispute this adjustment</p>
                <p className="text-xs text-gray-500">Open a support ticket — a Finance agent will review</p>
              </div>
            </div>
          </div>
          {selectedOption === "SUPPORT" && (
            <div className="border-t border-brand/20 px-4 py-3 bg-brand/5 space-y-3">
              <textarea
                value={supportMessage}
                onChange={(e) => setSupportMessage(e.target.value)}
                placeholder="Describe your concern (optional)"
                rows={3}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none"
              />
              <Button onClick={handleSupport} isLoading={isContacting} className="w-full">
                Open support ticket
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
