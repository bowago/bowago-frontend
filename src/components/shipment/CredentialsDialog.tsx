"use client";

import { useState } from "react";
import { Check, Copy, KeyRound } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog/dialog";

type Cred = { label: string; value: string };

function CopyRow({ label, value }: Cred) {
  const [copied, setCopied] = useState(false);
  return (
    <div>
      <p className="text-xs font-semibold text-gray-400 uppercase mb-1">{label}</p>
      <div className="flex gap-2">
        <code className="flex-1 min-w-0 break-all rounded-lg bg-gray-50 border px-3 py-2 text-xs">{value}</code>
        <button
          type="button"
          onClick={async () => {
            await navigator.clipboard.writeText(value);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          }}
          className="shrink-0 px-3 rounded-lg border hover:bg-gray-50"
          aria-label={`Copy ${label}`}
        >
          {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}

/**
 * Credentials the server returns exactly once (API key, webhook secret).
 * Closing this is final: they cannot be shown again, only replaced.
 */
export default function CredentialsDialog({
  open,
  title,
  creds,
  onClose,
}: {
  open: boolean;
  title: string;
  creds: Cred[];
  onClose: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-brand" />
            <h2 className="text-lg font-semibold">{title}</h2>
          </div>
          <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">
            Copy these now and send them to the app&apos;s team through a secure channel. They are not stored in readable
            form and cannot be shown again. If they are lost, issue new ones.
          </p>
          {creds.map((c) => (
            <CopyRow key={c.label} {...c} />
          ))}
          <div className="flex justify-end">
            <button onClick={onClose} className="px-4 py-2 text-sm rounded-lg bg-brand text-white hover:opacity-90">
              I&apos;ve saved them
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
