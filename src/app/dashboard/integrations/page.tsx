"use client";

import { useState } from "react";
import Link from "next/link";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import {
  useGetIntegrationAppsQuery,
  useCreateIntegrationAppMutation,
  useIntegrationAppActionMutation,
} from "@/store/slice/apiSlice";
import { AlertTriangle, CheckCircle2, Inbox, Loader2, Plug, Plus, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { errorToast, successToast } from "@/lib/toast/toast";
import { getApiErrorMessage } from "@/lib/errors/apiError";
import CredentialsDialog from "@/components/shipment/CredentialsDialog";

type App = {
  id: string;
  name: string;
  slug: string;
  status: "PENDING" | "ACTIVE" | "SUSPENDED" | "REJECTED";
  webhookUrl: string | null;
  contactEmail: string | null;
  lastWebhookAt: string | null;
  lastInboundAt: string | null;
  failedDeliveries: number;
  _count?: { syncs: number };
};

const STATUS_STYLE: Record<string, string> = {
  ACTIVE: "bg-green-50 text-green-700 border-green-200",
  PENDING: "bg-amber-50 text-amber-700 border-amber-200",
  SUSPENDED: "bg-gray-100 text-gray-500 border-gray-200",
  REJECTED: "bg-red-50 text-red-700 border-red-200",
};

const ago = (iso: string | null) => {
  if (!iso) return "never";
  const m = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m} min ago`;
  if (m < 1440) return `${Math.round(m / 60)} h ago`;
  return `${Math.round(m / 1440)} d ago`;
};

const field = "w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30";

export default function IntegrationsPage() {
  const me = useSelector((s: RootState) => s.auth.user) as any;
  const allowed = ["SUPER_ADMIN", "LOGISTICS_MANAGER"].includes(me?.adminSubRole);

  const { data, isLoading, isError, refetch } = useGetIntegrationAppsQuery(undefined, { skip: !allowed, refetchOnFocus: true });
  const [create, { isLoading: creating }] = useCreateIntegrationAppMutation();
  const [act, { isLoading: acting }] = useIntegrationAppActionMutation();

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", contactEmail: "", baseUrl: "", webhookUrl: "" });
  const [creds, setCreds] = useState<{ title: string; items: { label: string; value: string }[] } | null>(null);

  const apps: App[] = data?.data ?? [];
  const pending = apps.filter((a) => a.status === "PENDING");

  if (!allowed) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3 text-gray-400">
        <AlertTriangle className="w-10 h-10 opacity-30" />
        <p className="font-medium text-gray-600">Not available for your role</p>
        <p className="text-xs max-w-sm text-center">Managing connected apps needs the integrations permission.</p>
      </div>
    );
  }

  const approve = async (a: App) => {
    if (!a.webhookUrl) return errorToast("Set a webhook URL on this app before approving it.");
    try {
      const r: any = await act({ id: a.id, action: "approve" }).unwrap();
      setCreds({ title: `${a.name} approved`, items: [{ label: "API key", value: r.data.apiKey }, { label: "Webhook signing secret", value: r.data.webhookSecret }] });
    } catch {
      /* mutation shows the error */
    }
  };

  const submit = async () => {
    if (!form.name.trim()) return errorToast("Give the app a name.");
    try {
      await create({
        name: form.name.trim(),
        contactEmail: form.contactEmail || undefined,
        baseUrl: form.baseUrl || undefined,
        webhookUrl: form.webhookUrl || undefined,
      }).unwrap();
      setForm({ name: "", contactEmail: "", baseUrl: "", webhookUrl: "" });
      setShowForm(false);
    } catch {
      /* shown by the mutation */
    }
  };

  const reject = async (a: App) => {
    try {
      await act({ id: a.id, action: "reject", body: {} }).unwrap();
      successToast(`${a.name} rejected`);
    } catch (e: any) {
      errorToast(getApiErrorMessage(e, "Failed"));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="dashboard-heading">Connected apps</h1>
          <p className="text-sm text-gray-400 mt-1 max-w-2xl">
            Third-party systems (such as Corelynx) that receive BowaGO shipments, confirm them and report status back.
            An app can only see shipments you share with it.
          </p>
        </div>
        <button onClick={() => setShowForm((v) => !v)} className="shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl bg-brand text-white text-sm hover:opacity-90">
          <Plus className="w-4 h-4" /> Register app
        </button>
      </div>

      {pending.length > 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          {pending.length} app{pending.length === 1 ? " is" : "s are"} waiting for approval.
        </div>
      )}

      {showForm && (
        <div className="bg-white border rounded-2xl p-5 space-y-3 max-w-2xl">
          <h2 className="font-semibold">Register an app</h2>
          <input className={field} placeholder="App name (e.g. Corelynx)" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input className={field} placeholder="Contact email" value={form.contactEmail} onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} />
          <input className={field} placeholder="App base URL (optional)" value={form.baseUrl} onChange={(e) => setForm({ ...form, baseUrl: e.target.value })} />
          <input className={field} placeholder="Webhook URL, where BowaGO sends events (https)" value={form.webhookUrl} onChange={(e) => setForm({ ...form, webhookUrl: e.target.value })} />
          <p className="text-xs text-gray-400">The app starts as pending. Nothing works until you approve it, which issues its API key and signing secret.</p>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm rounded-lg border hover:bg-gray-50">Cancel</button>
            <button onClick={submit} disabled={creating} className="px-4 py-2 text-sm rounded-lg bg-brand text-white disabled:opacity-60 flex items-center gap-2">
              {creating && <Loader2 className="w-4 h-4 animate-spin" />} Register
            </button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-brand" /></div>
      ) : isError ? (
        <div className="flex flex-col items-center py-20 text-gray-400 gap-2">
          <XCircle className="w-12 h-12 opacity-30" />
          <p className="font-medium text-gray-600">Failed to load apps</p>
          <button onClick={() => refetch()} className="text-sm text-brand hover:underline">Retry</button>
        </div>
      ) : apps.length === 0 ? (
        <div className="flex flex-col items-center py-20 text-gray-400">
          <Inbox className="w-12 h-12 mb-3 opacity-30" />
          <p>No apps connected yet</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm divide-y divide-gray-100">
          {apps.map((a) => (
            <div key={a.id} className="p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center shrink-0"><Plug className="w-5 h-5 text-gray-500" /></div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Link href={`/dashboard/integrations/${a.id}`} className="font-semibold text-gray-900 hover:underline">{a.name}</Link>
                  <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full border", STATUS_STYLE[a.status])}>{a.status}</span>
                  {a.failedDeliveries > 0 && (
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full border bg-red-50 text-red-700 border-red-200">
                      {a.failedDeliveries} failed webhook{a.failedDeliveries === 1 ? "" : "s"}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-400 truncate">
                  {a.webhookUrl ?? "No webhook URL"} · {a._count?.syncs ?? 0} shipments · last sent {ago(a.lastWebhookAt)} · last heard from {ago(a.lastInboundAt)}
                </p>
              </div>
              {a.status === "PENDING" && (
                <div className="flex gap-2">
                  <button onClick={() => approve(a)} disabled={acting} className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg bg-brand text-white disabled:opacity-60">
                    <CheckCircle2 className="w-4 h-4" /> Approve
                  </button>
                  <button onClick={() => reject(a)} disabled={acting} className="px-3 py-1.5 text-sm rounded-lg border hover:bg-gray-50">Reject</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <CredentialsDialog open={!!creds} title={creds?.title ?? ""} creds={creds?.items ?? []} onClose={() => setCreds(null)} />
    </div>
  );
}
