"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import {
  useGetIntegrationAppQuery,
  useUpdateIntegrationAppMutation,
  useIntegrationAppActionMutation,
  useRevokeIntegrationKeyMutation,
  useGetIntegrationSharesQuery,
  useShareShipmentWithAppMutation,
  useCancelIntegrationShareMutation,
  useGetIntegrationDeliveriesQuery,
  useRetryIntegrationDeliveryMutation,
} from "@/store/slice/apiSlice";
import { AlertTriangle, ArrowLeft, Loader2, RotateCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { errorToast, successToast } from "@/lib/toast/toast";
import CredentialsDialog from "@/components/shipment/CredentialsDialog";

const EVENTS = [
  ["shipment.created", "A shipment is shared with the app"],
  ["shipment.updated", "A shared shipment changes (status or route)"],
  ["shipment.cancelled", "A shared shipment is cancelled"],
];

const SYNC_STYLE: Record<string, string> = {
  QUEUED: "bg-gray-100 text-gray-600 border-gray-200",
  NOTIFIED: "bg-blue-50 text-blue-700 border-blue-200",
  ACKNOWLEDGED: "bg-blue-50 text-blue-700 border-blue-200",
  CONFIRMED: "bg-green-50 text-green-700 border-green-200",
  COMPLETED: "bg-green-100 text-green-800 border-green-200",
  REJECTED: "bg-red-50 text-red-700 border-red-200",
  FAILED: "bg-red-50 text-red-700 border-red-200",
  CANCELLED: "bg-gray-100 text-gray-500 border-gray-200",
  DELIVERED: "bg-green-50 text-green-700 border-green-200",
  PENDING: "bg-amber-50 text-amber-700 border-amber-200",
};

const Badge = ({ v }: { v: string }) => (
  <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full border", SYNC_STYLE[v] ?? SYNC_STYLE.QUEUED)}>{v}</span>
);

const field = "w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30";
const card = "bg-white border rounded-2xl p-5 space-y-3";

export default function IntegrationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const me = useSelector((s: RootState) => s.auth.user) as any;
  const allowed = ["SUPER_ADMIN", "LOGISTICS_MANAGER"].includes(me?.adminSubRole);

  const { data, isLoading } = useGetIntegrationAppQuery(id, { skip: !allowed });
  const app = data?.data;
  const [deliveryState, setDeliveryState] = useState("");
  const { data: sharesRes } = useGetIntegrationSharesQuery({ id }, { skip: !allowed });
  const { data: delRes } = useGetIntegrationDeliveriesQuery({ id, state: deliveryState || undefined }, { skip: !allowed, refetchOnFocus: true });

  const [update, { isLoading: saving }] = useUpdateIntegrationAppMutation();
  const [act, { isLoading: acting }] = useIntegrationAppActionMutation();
  const [revoke] = useRevokeIntegrationKeyMutation();
  const [share, { isLoading: sharing }] = useShareShipmentWithAppMutation();
  const [cancelShare] = useCancelIntegrationShareMutation();
  const [retry] = useRetryIntegrationDeliveryMutation();

  const [webhookUrl, setWebhookUrl] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [events, setEvents] = useState<string[]>([]);
  const [statusMapText, setStatusMapText] = useState("");
  const [shipmentId, setShipmentId] = useState("");
  const [creds, setCreds] = useState<{ title: string; items: { label: string; value: string }[] } | null>(null);

  useEffect(() => {
    if (!app) return;
    setWebhookUrl(app.webhookUrl ?? "");
    setBaseUrl(app.baseUrl ?? "");
    setContactEmail(app.contactEmail ?? "");
    setEvents(Array.isArray(app.subscribedEvents) ? app.subscribedEvents : []);
    setStatusMapText(app.statusMap ? JSON.stringify(app.statusMap, null, 2) : "");
  }, [app]);

  if (!allowed) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3 text-gray-400">
        <AlertTriangle className="w-10 h-10 opacity-30" />
        <p className="font-medium text-gray-600">Not available for your role</p>
      </div>
    );
  }
  if (isLoading || !app) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-brand" /></div>;

  const shares: any[] = sharesRes?.data ?? [];
  const deliveries: any[] = delRes?.data ?? [];
  const active = app.status === "ACTIVE";

  const save = async () => {
    let statusMap: any = null;
    if (statusMapText.trim()) {
      try {
        statusMap = JSON.parse(statusMapText);
        if (typeof statusMap !== "object" || Array.isArray(statusMap)) throw new Error();
      } catch {
        return errorToast("The status map must be a JSON object, e.g. {\"handed-over\": \"DELIVERED\"}.");
      }
    }
    try {
      await update({ id, body: { webhookUrl: webhookUrl || null, baseUrl: baseUrl || null, contactEmail: contactEmail || null, subscribedEvents: events, statusMap } }).unwrap();
    } catch {
      /* shown by the mutation */
    }
  };

  const issue = async (action: "keys" | "webhook-secret") => {
    try {
      const r: any = await act({ id, action, body: {} }).unwrap();
      setCreds(
        action === "keys"
          ? { title: "New API key", items: [{ label: "API key", value: r.data.apiKey }] }
          : { title: "New webhook secret", items: [{ label: "Webhook signing secret", value: r.data.webhookSecret }] },
      );
    } catch {
      /* shown by the mutation */
    }
  };

  const simple = async (action: string, ok: string, body: Record<string, any> = {}) => {
    try {
      await act({ id, action, body }).unwrap();
      successToast(ok);
    } catch {
      /* shown by the mutation */
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <Link href="/dashboard/integrations" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800"><ArrowLeft className="w-4 h-4" /> Connected apps</Link>

      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="dashboard-heading">{app.name}</h1>
          <Badge v={app.status} />
        </div>
        <div className="flex gap-2">
          {active && <button disabled={acting} onClick={() => simple("ping", "Test event queued")} className="px-3 py-1.5 text-sm rounded-lg border hover:bg-gray-50">Send test event</button>}
          {active && <button disabled={acting} onClick={() => simple("suspend", "App suspended", { reason: "Suspended by admin" })} className="px-3 py-1.5 text-sm rounded-lg border text-red-600 hover:bg-red-50">Suspend</button>}
          {app.status === "SUSPENDED" && <button disabled={acting} onClick={() => simple("reactivate", "App reactivated")} className="px-3 py-1.5 text-sm rounded-lg bg-brand text-white">Reactivate</button>}
        </div>
      </div>
      {app.suspendedReason && <p className="text-sm text-gray-500">Reason: {app.suspendedReason}</p>}

      {/* Settings */}
      <div className={card}>
        <h2 className="font-semibold">Settings</h2>
        <div className="grid md:grid-cols-2 gap-3">
          <label className="text-xs text-gray-500">Webhook URL (https)<input className={cn(field, "mt-1")} value={webhookUrl} onChange={(e) => setWebhookUrl(e.target.value)} /></label>
          <label className="text-xs text-gray-500">Base URL<input className={cn(field, "mt-1")} value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} /></label>
          <label className="text-xs text-gray-500">Contact email<input className={cn(field, "mt-1")} value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} /></label>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-1">Events sent to this app</p>
          <div className="space-y-1">
            {EVENTS.map(([ev, label]) => (
              <label key={ev} className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={events.includes(ev)} onChange={(e) => setEvents((x) => (e.target.checked ? [...x, ev] : x.filter((y) => y !== ev)))} />
                <code className="text-xs">{ev}</code> <span className="text-gray-400">{label}</span>
              </label>
            ))}
          </div>
        </div>
        <label className="block text-xs text-gray-500">
          Status words that differ from the defaults (JSON, optional)
          <textarea className={cn(field, "mt-1 font-mono text-xs h-24")} placeholder='{"handed-over": "DELIVERED"}' value={statusMapText} onChange={(e) => setStatusMapText(e.target.value)} />
        </label>
        <div className="flex justify-end">
          <button onClick={save} disabled={saving} className="px-4 py-2 text-sm rounded-lg bg-brand text-white disabled:opacity-60 flex items-center gap-2">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />} Save settings
          </button>
        </div>
      </div>

      {/* Credentials */}
      {active && (
        <div className={card}>
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Credentials</h2>
            <div className="flex gap-2">
              <button onClick={() => issue("keys")} disabled={acting} className="px-3 py-1.5 text-sm rounded-lg border hover:bg-gray-50">New API key</button>
              <button onClick={() => issue("webhook-secret")} disabled={acting} className="px-3 py-1.5 text-sm rounded-lg border hover:bg-gray-50">Rotate webhook secret</button>
            </div>
          </div>
          <p className="text-xs text-gray-400">Old keys keep working until you revoke them, so the app can switch without downtime.</p>
          <div className="divide-y">
            {(app.keys ?? []).map((k: any) => (
              <div key={k.id} className="py-2 flex items-center gap-3 text-sm">
                <code className="text-xs">{k.keyPrefix}…</code>
                <span className="text-gray-400 flex-1">{k.label || "—"} · last used {k.lastUsedAt ? new Date(k.lastUsedAt).toLocaleString() : "never"}</span>
                {k.active ? (
                  <button onClick={() => revoke({ id, keyId: k.id })} className="text-xs text-red-600 hover:underline">Revoke</button>
                ) : (
                  <span className="text-xs text-gray-400">revoked</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Shipments shared */}
      <div className={card}>
        <h2 className="font-semibold">Shared shipments</h2>
        {active && (
          <div className="flex gap-2">
            <input className={field} placeholder="Shipment ID to share (from the shipment's page address)" value={shipmentId} onChange={(e) => setShipmentId(e.target.value.trim())} />
            <button
              disabled={sharing || !shipmentId}
              onClick={async () => {
                try {
                  await share({ id, shipmentId }).unwrap();
                  setShipmentId("");
                } catch {
                  /* shown by the mutation */
                }
              }}
              className="shrink-0 px-4 py-2 text-sm rounded-lg bg-brand text-white disabled:opacity-60"
            >
              Share
            </button>
          </div>
        )}
        {shares.length === 0 ? (
          <p className="text-sm text-gray-400">Nothing shared yet.</p>
        ) : (
          <div className="divide-y">
            {shares.map((s) => (
              <div key={s.id} className="py-2 flex items-center gap-3 text-sm">
                <Link href={`/dashboard/shipments/${s.shipment.id}`} className="font-mono text-xs hover:underline">{s.shipment.trackingNumber}</Link>
                <span className="text-gray-400 flex-1">{s.shipment.senderCity} → {s.shipment.recipientCity} · BowaGO: {s.shipment.status.toLowerCase().replace(/_/g, " ")}{s.lastExternalStatus ? ` · app said ${s.lastExternalStatus}` : ""}</span>
                {s.rejectedReason && <span className="text-xs text-red-600">{s.rejectedReason}</span>}
                <Badge v={s.syncStatus} />
                {!["COMPLETED", "CANCELLED", "REJECTED"].includes(s.syncStatus) && (
                  <button onClick={() => cancelShare({ id, syncId: s.id })} className="text-xs text-red-600 hover:underline">Cancel</button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Deliveries */}
      <div className={card}>
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Webhook deliveries</h2>
          <select value={deliveryState} onChange={(e) => setDeliveryState(e.target.value)} className="rounded-lg border px-2 py-1 text-sm">
            <option value="">All</option>
            <option value="PENDING">Pending</option>
            <option value="DELIVERED">Delivered</option>
            <option value="FAILED">Failed</option>
          </select>
        </div>
        {deliveries.length === 0 ? (
          <p className="text-sm text-gray-400">No deliveries.</p>
        ) : (
          <div className="divide-y">
            {deliveries.map((d) => (
              <div key={d.id} className="py-2 flex items-center gap-3 text-sm">
                <code className="text-xs w-40 shrink-0">{d.event}</code>
                <span className="text-gray-400 flex-1 min-w-0 truncate">
                  {new Date(d.createdAt).toLocaleString()} · {d.attempts} attempt{d.attempts === 1 ? "" : "s"}
                  {d.lastStatusCode ? ` · HTTP ${d.lastStatusCode}` : ""}{d.lastError ? ` · ${d.lastError}` : ""}
                </span>
                <Badge v={d.state} />
                {d.state === "FAILED" && (
                  <button onClick={() => retry({ id, deliveryId: d.id })} className="text-xs text-brand hover:underline flex items-center gap-1"><RotateCw className="w-3 h-3" /> Retry</button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <CredentialsDialog open={!!creds} title={creds?.title ?? ""} creds={creds?.items ?? []} onClose={() => setCreds(null)} />
    </div>
  );
}
