"use client";

import { useState } from "react";
import {
  useGetInsuranceDisclaimerQuery,
  usePublishInsuranceDisclaimerMutation,
  useGetInsuranceDisclaimerHistoryQuery,
} from "@/store/slice/apiSlice";
import { Input, TextArea } from "../ui/input";
import { Button } from "../ui/button";
import { Loader2 } from "lucide-react";

export default function InsuranceDisclaimerView() {
  const { data, isLoading } = useGetInsuranceDisclaimerQuery();
  const { data: historyData } = useGetInsuranceDisclaimerHistoryQuery();
  const [publish, { isLoading: publishing }] = usePublishInsuranceDisclaimerMutation();

  const current = (data as any)?.data?.disclaimer;
  const history = (historyData as any)?.data?.disclaimers ?? [];

  const [version, setVersion] = useState("");
  const [body, setBody] = useState("");
  const [liabilityLimitNaira, setLiabilityLimitNaira] = useState(0);
  const [showForm, setShowForm] = useState(false);

  const onPublish = async () => {
    await publish({
      version,
      body,
      liabilityLimitKobo: Math.round(liabilityLimitNaira * 100),
    }).unwrap();
    setVersion("");
    setBody("");
    setLiabilityLimitNaira(0);
    setShowForm(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-700 mb-1">
          Current Disclaimer
        </h3>
        {current ? (
          <>
            <p className="text-xs text-gray-400 mb-3">
              Version {current.version} — effective{" "}
              {new Date(current.effectiveFrom).toLocaleDateString()}
            </p>
            <p className="text-sm text-gray-700 whitespace-pre-line">{current.body}</p>
            <p className="text-sm font-medium text-gray-900 mt-3">
              Liability limit: ₦{(current.liabilityLimitKobo / 100).toLocaleString()}
            </p>
          </>
        ) : (
          <p className="text-sm text-gray-400">
            No disclaimer published yet — customers won&apos;t see an
            uninsured-risk notice until one is published.
          </p>
        )}
      </div>

      {!showForm ? (
        <Button onClick={() => setShowForm(true)} className="px-6">
          Publish New Version
        </Button>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-semibold text-gray-700">Publish New Version</h3>
          <Input
            label="Version"
            placeholder="e.g. v1.1"
            value={version}
            onChange={(e) => setVersion(e.target.value)}
          />
          <TextArea
            label="Disclaimer Text"
            placeholder="Shown to customers who decline insurance..."
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />
          <Input
            label="Liability Limit"
            type="number"
            min={0}
            value={liabilityLimitNaira}
            onChange={(e) => setLiabilityLimitNaira(Number(e.target.value))}
            rightElement={<span className="text-xs">₦</span>}
          />
          <div className="flex gap-2">
            <Button
              onClick={onPublish}
              isLoading={publishing}
              disabled={!version || !body || liabilityLimitNaira <= 0}
              className="px-6"
            >
              Publish
            </Button>
            <button
              onClick={() => setShowForm(false)}
              className="text-sm text-gray-500 px-4"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {history.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Version History</h3>
          <div className="space-y-2">
            {history.map((d: any) => (
              <div
                key={d.id}
                className="bg-white rounded-xl border border-gray-100 p-4 flex items-center justify-between"
              >
                <div>
                  <span className="font-medium text-gray-900">{d.version}</span>
                  <span className="text-xs text-gray-400 ml-2">
                    {new Date(d.effectiveFrom).toLocaleDateString()}
                  </span>
                </div>
                <span className="text-sm text-gray-600">
                  ₦{(d.liabilityLimitKobo / 100).toLocaleString()} limit
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
