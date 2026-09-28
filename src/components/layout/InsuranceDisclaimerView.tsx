"use client";

import { useState } from "react";
import {
  useGetInsuranceDisclaimerQuery,
  usePublishInsuranceDisclaimerMutation,
  useGetInsuranceDisclaimerHistoryQuery,
  useUpdateInsuranceDisclaimerMutation,
  useDeleteInsuranceDisclaimerMutation,
} from "@/store/slice/apiSlice";
import { Input, TextArea } from "../ui/input";
import { Button } from "../ui/button";
import { Loader2, Pencil, Trash2 } from "lucide-react";

type Disclaimer = {
  id: string;
  version: string;
  body: string;
  liabilityLimitKobo: number;
  effectiveFrom: string;
};

export default function InsuranceDisclaimerView() {
  const { data, isLoading } = useGetInsuranceDisclaimerQuery();
  const { data: historyData } = useGetInsuranceDisclaimerHistoryQuery();
  const [publish, { isLoading: publishing }] = usePublishInsuranceDisclaimerMutation();
  const [update, { isLoading: updating }] = useUpdateInsuranceDisclaimerMutation();
  const [remove, { isLoading: deleting }] = useDeleteInsuranceDisclaimerMutation();

  const current: Disclaimer | null = (data as any)?.data?.disclaimer ?? null;
  const history: Disclaimer[] = (historyData as any)?.data?.disclaimers ?? [];

  // editingId === null -> "publish new version"; otherwise editing that row.
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [version, setVersion] = useState("");
  const [body, setBody] = useState("");
  const [liabilityLimitNaira, setLiabilityLimitNaira] = useState(0);

  const openNew = () => {
    setEditingId(null);
    setVersion("");
    setBody("");
    setLiabilityLimitNaira(0);
    setShowForm(true);
  };

  const openEdit = (d: Disclaimer) => {
    setEditingId(d.id);
    setVersion(d.version);
    setBody(d.body);
    setLiabilityLimitNaira(d.liabilityLimitKobo / 100);
    setShowForm(true);
  };

  const onSave = async () => {
    const liabilityLimitKobo = Math.round(liabilityLimitNaira * 100);
    if (editingId) {
      await update({ id: editingId, version, body, liabilityLimitKobo }).unwrap();
    } else {
      await publish({ version, body, liabilityLimitKobo }).unwrap();
    }
    setShowForm(false);
    setEditingId(null);
  };

  const onDelete = async (d: Disclaimer) => {
    if (
      !window.confirm(
        `Delete disclaimer ${d.version}? Customers who already acknowledged it keep their own record of the text they agreed to.`,
      )
    )
      return;
    await remove({ id: d.id }).unwrap();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  const Actions = ({ d }: { d: Disclaimer }) => (
    <div className="flex items-center gap-2 shrink-0">
      <button
        onClick={() => openEdit(d)}
        className="flex items-center gap-1 text-xs text-gray-500 border border-gray-300 px-2.5 py-1 rounded-md hover:text-gray-800"
      >
        <Pencil size={12} /> Edit
      </button>
      <button
        onClick={() => onDelete(d)}
        disabled={deleting}
        className="flex items-center gap-1 text-xs text-red-500 border border-red-300 px-2.5 py-1 rounded-md hover:text-red-700 disabled:opacity-50"
      >
        <Trash2 size={12} /> Delete
      </button>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-xs text-blue-700">
        <strong>Where customers see this:</strong> when a customer leaves
        insurance switched off, the current disclaimer and its liability limit
        are shown in the booking form (step 1), and again on the review screen
        before the shipment is created. Their acknowledgment is saved with a
        copy of the exact text and limit they saw.
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-1">Current Disclaimer</h3>
            {current ? (
              <p className="text-xs text-gray-400">
                Version {current.version} — effective{" "}
                {new Date(current.effectiveFrom).toLocaleDateString()}
              </p>
            ) : null}
          </div>
          {current && <Actions d={current} />}
        </div>
        {current ? (
          <>
            <p className="text-sm text-gray-700 whitespace-pre-line mt-3">{current.body}</p>
            <p className="text-sm font-medium text-gray-900 mt-3">
              Liability limit: ₦{(current.liabilityLimitKobo / 100).toLocaleString()}
            </p>
          </>
        ) : (
          <p className="text-sm text-gray-400 mt-2">
            No disclaimer published — customers currently see a generic
            uninsured-risk notice with no liability limit.
          </p>
        )}
      </div>

      {!showForm ? (
        <Button onClick={openNew} className="px-6">
          Publish New Version
        </Button>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-semibold text-gray-700">
            {editingId ? "Edit Disclaimer" : "Publish New Version"}
          </h3>
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
              onClick={onSave}
              isLoading={publishing || updating}
              disabled={!version || !body || liabilityLimitNaira <= 0}
              className="px-6"
            >
              {editingId ? "Save Changes" : "Publish"}
            </Button>
            <button
              onClick={() => {
                setShowForm(false);
                setEditingId(null);
              }}
              className="text-sm text-gray-500 px-4"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {history.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">All Versions</h3>
          <div className="space-y-2">
            {history.map((d) => (
              <div
                key={d.id}
                className="bg-white rounded-xl border border-gray-100 p-4 flex items-start justify-between gap-4"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">{d.version}</span>
                    {current?.id === d.id && (
                      <span className="text-[10px] font-semibold bg-green-100 text-green-600 px-2 py-0.5 rounded-full">
                        Current
                      </span>
                    )}
                    <span className="text-xs text-gray-400">
                      {new Date(d.effectiveFrom).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">{d.body}</p>
                  <p className="text-xs text-gray-600 mt-1">
                    ₦{(d.liabilityLimitKobo / 100).toLocaleString()} limit
                  </p>
                </div>
                <Actions d={d} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
