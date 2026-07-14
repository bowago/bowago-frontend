"use client";
import ShipmentDetailView from "@/components/layout/ShippingDetailsView";
import { documentColumns } from "@/components/table/columns/document-columns";
import { AppTable } from "@/components/table/Table";
import {
  Tabs,
  TabsList,
  TabsContent,
  TabsTrigger,
} from "@/components/ui/tabs/tabs";
import {
  Filter,
  MoveLeft,
  Loader2,
  CreditCard,
  Download,
  AlertTriangle,
  Wrench,
  LocateFixed,
} from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import { useState } from "react";
import {
  useGetUserShipmentsByIdQuery,
  useUpdateShipmentStatusMutation,
  useInitiateShipmentPaymentMutation,
  useInitPendingPaymentMutation,
  useDownloadInvoiceMutation,
  useGetShipmentAdjustmentsQuery,
} from "@/store/slice/apiSlice";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { Dialog, DialogContent } from "@/components/ui/dialog/dialog";
import PriceAdjustmentResponseModal from "@/components/modals/PriceAdjustmentResponseModal";
import CreatePriceAdjustmentForm from "@/components/form/CreatePriceAdjustmentForm";

const STATUS_OPTIONS = [
  "PENDING",
  "CONFIRMED",
  "PICKED_UP",
  "IN_TRANSIT",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "FAILED",
  "RETURNED",
];

const statusColor: Record<string, string> = {
  PENDING: "bg-yellow-400 text-black",
  CONFIRMED: "bg-blue-400 text-white",
  PICKED_UP: "bg-indigo-400 text-white",
  IN_TRANSIT: "bg-orange-400 text-white",
  OUT_FOR_DELIVERY: "bg-purple-400 text-white",
  DELIVERED: "bg-green-500 text-white",
  FAILED: "bg-red-500 text-white",
  RETURNED: "bg-gray-500 text-white",
  CANCELLED: "bg-gray-300 text-black",
};

function progressFromStatus(status: string): number {
  const order = [
    "PENDING",
    "CONFIRMED",
    "PICKED_UP",
    "IN_TRANSIT",
    "OUT_FOR_DELIVERY",
    "DELIVERED",
  ];
  const idx = order.indexOf(status);
  return idx < 0 ? 0 : Math.round(((idx + 1) / order.length) * 100);
}

export default function ShipmentDetails() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const user = useSelector((s: RootState) => s.auth.user) as any;
  const isAdmin = user?.role === "ADMIN";
  const adminSubRole = user?.adminSubRole ?? "";
  // Shipment status/location updates are allowed for two groups:
  //  1. Internal BowaGo ops staff (SUPER_ADMIN, LOGISTICS_MANAGER, or a
  //     ROLE_ADMIN holding the canManageShipments capability) — platform-wide,
  //     any shipment.
  //  2. The shipment's OWN enterprise company's ROLE_MASTER or
  //     ROLE_DISPATCHER — scoped to their own company's shipments only.
  //     ROLE_DISPATCHER is intentionally enterprise-only; it never grants
  //     access to another company's or BowaGo's own internal shipments.
  // The backend (requireShipmentDispatchAccess + the company-ownership
  // check inside updateShipmentStatus) is the real enforcement — this is
  // just to decide whether to show the tab at all.
  const isInternalOps =
    isAdmin &&
    ["SUPER_ADMIN", "LOGISTICS_MANAGER", "ROLE_ADMIN"].includes(adminSubRole);

  const [adjustmentModalOpen, setAdjustmentModalOpen] = useState(false);
  const [createAdjustmentOpen, setCreateAdjustmentOpen] = useState(false);

  const { data, isLoading, isError } = useGetUserShipmentsByIdQuery(
    { id },
    {
      skip: !id,
      pollingInterval: 30000,
      refetchOnFocus: true,
      refetchOnReconnect: true,
    },
  );
  const [updateStatus, { isLoading: updating }] =
    useUpdateShipmentStatusMutation();
  const [initiatePayment, { isLoading: payingNow }] =
    useInitiateShipmentPaymentMutation();
  const [initPendingPayment, { isLoading: preparingInvoice }] =
    useInitPendingPaymentMutation();
  const [downloadInvoice, { isLoading: downloadingInvoice }] =
    useDownloadInvoiceMutation();

  // ── Derived state (single declaration) ────────────────────────────────────
  const shipment = (data as any)?.data?.shipment ?? (data as any)?.data ?? null;
  const documents = shipment?.documents ?? [];
  // Populated by getShipment's linked-quote include — see shipment.controller.js.
  const appliedDiscount = (data as any)?.data?.quote?.appliedDiscount ?? null;

  // Enterprise ROLE_MASTER/ROLE_DISPATCHER may dispatch shipments belonging
  // to their OWN company only — "company" is determined by comparing
  // "company root" (a user's masterId if they're staff, or their own id if
  // they ARE the master). This mirrors the backend check in
  // updateShipmentStatus exactly; the backend is what actually enforces it,
  // this just decides whether to show the tab.
  const isEnterpriseDispatcherForThisShipment =
    user?.role === "ENTERPRISE" &&
    ["ROLE_MASTER", "ROLE_DISPATCHER"].includes(user?.enterpriseRole) &&
    shipment?.customer &&
    (user.masterId || user.id) ===
      (shipment.customer.masterId || shipment.customer.id);

  const canDispatch = isInternalOps || isEnterpriseDispatcherForThisShipment;
  const isDispatcher = canDispatch;

  const { data: adjData } = useGetShipmentAdjustmentsQuery(id, { skip: !id });
  const adjustments: any[] = (adjData as any)?.data?.adjustments ?? [];
  const pendingAdjustment = adjustments.find((a) => a.status === "PENDING");

  const handlePayNow = async () => {
    const callbackUrl = `${window.location.origin}/dashboard/payment/callback`;
    const result = await initiatePayment({
      shipmentId: id,
      callbackUrl,
      refundPolicyAccepted: true,
    }).unwrap();
    const authorizationUrl =
      result?.authorizationUrl ?? result?.data?.authorizationUrl;
    if (authorizationUrl) window.location.href = authorizationUrl;
  };

  const handleDownloadInvoice = async () => {
    try {
      const result = await initPendingPayment({ shipmentId: id }).unwrap();
      const paymentId = result?.data?.payment?.id;
      if (!paymentId) return;
      await downloadInvoice({
        paymentId,
        filename: `BowaGO-Invoice-${shipment?.trackingNumber ?? id}.pdf`,
      });
    } catch {
      // errors surfaced via toast
    }
  };

  const [docFilters, setDocFilters] = useState({
    name: "",
    type: "",
    status: "",
  });
  const [appliedDocFilters, setAppliedDocFilters] = useState(docFilters);
  const [statusNote, setStatusNote] = useState("");
  const [newStatus, setNewStatus] = useState("");
  const [locationLabel, setLocationLabel] = useState("");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    null,
  );
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState("");

  const filteredDocs = documents.filter(
    (doc: any) =>
      doc.type?.toLowerCase().includes(appliedDocFilters.type.toLowerCase()) &&
      doc.url?.toLowerCase().includes(appliedDocFilters.name.toLowerCase()),
  );

  // One-click geolocation capture — lets a dispatcher on the road just tap a
  // button instead of looking up/typing coordinates by hand. Uses the
  // browser's native Geolocation API (no third-party SDK needed).
  const handleUseCurrentLocation = () => {
    setLocationError("");
    if (!navigator.geolocation) {
      setLocationError("Geolocation isn't supported on this device/browser.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setLocating(false);
      },
      (err) => {
        setLocationError(
          err.code === err.PERMISSION_DENIED
            ? "Location permission denied. Enable it in your browser settings, or type the location manually."
            : "Couldn't get your location. Try again or type it manually.",
        );
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const handleStatusUpdate = async () => {
    if (!newStatus) return;
    await updateStatus({
      id,
      status: newStatus,
      description: statusNote || `Status updated to ${newStatus}`,
      ...(locationLabel ? { location: locationLabel } : {}),
      ...(coords ? { lat: coords.lat, lng: coords.lng } : {}),
    });
    setNewStatus("");
    setStatusNote("");
    setLocationLabel("");
    setCoords(null);
    setLocationError("");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin w-8 h-8 text-gray-400" />
      </div>
    );
  }

  if (isError || !shipment) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-gray-500">Shipment not found</p>
        <button
          onClick={() => router.back()}
          className="text-sm text-red-600 underline"
        >
          Go back
        </button>
      </div>
    );
  }

  const progress = progressFromStatus(shipment.status);

  return (
    <div className="space-y-6">
      {/* ── Price Adjustment Alert Banner ─────────────────────────────────── */}
      {pendingAdjustment && (
        <div className="bg-orange-50 border border-orange-300 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-orange-800">
              Price adjustment required
            </p>
            <p className="text-xs text-orange-700 mt-0.5">
              A weight discrepancy was found at the hub. This shipment is paused
              until you respond. Additional charge:{" "}
              <strong>₦{pendingAdjustment.difference.toLocaleString()}</strong>
            </p>
          </div>
          {!isAdmin && (
            <button
              onClick={() => setAdjustmentModalOpen(true)}
              className="shrink-0 text-xs font-medium bg-orange-600 text-white rounded-lg px-3 py-1.5 hover:bg-orange-700 transition-colors"
            >
              Respond
            </button>
          )}
        </div>
      )}

      <div className="flex items-center gap-3 justify-between flex-wrap">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()}>
            <MoveLeft />
          </button>
          <h2 className="text-xl font-semibold">
            Shipments / {shipment.trackingNumber}
          </h2>
        </div>

        <div className="flex items-center gap-2">
          {isDispatcher && (
            <button
              onClick={() => setCreateAdjustmentOpen(true)}
              className="flex items-center gap-1.5 bg-gray-800 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-900 transition-colors"
            >
              <Wrench className="w-4 h-4" />
              Price Adjustment
            </button>
          )}
          {shipment.paymentStatus !== "PAID" && (
            <button
              onClick={handlePayNow}
              disabled={payingNow}
              className="flex items-center gap-1.5 bg-brand text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-60"
            >
              {payingNow ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CreditCard className="w-4 h-4" />
              )}
              Pay Now
            </button>
          )}
          <button
            onClick={handleDownloadInvoice}
            disabled={preparingInvoice || downloadingInvoice}
            className="flex items-center gap-1.5 bg-gray-100 text-gray-700 px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors disabled:opacity-60"
          >
            {preparingInvoice || downloadingInvoice ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            Download Invoice
          </button>
        </div>
      </div>

      <Tabs defaultValue="shipment">
        <TabsList>
          <TabsTrigger value="shipment">Shipment Details</TabsTrigger>
          <TabsTrigger value="clearance">Documents</TabsTrigger>
          {canDispatch && (
            <TabsTrigger value="update">Update Status</TabsTrigger>
          )}
        </TabsList>

        <div className="mt-5">
          {/* Shipment Details Tab */}
          <TabsContent value="shipment" className="w-full flex flex-col gap-6">
            <div className="flex flex-col gap-5">
              {/* Hero card */}
              <div className="bg-black text-white rounded-lg p-6">
                <div className="flex justify-between">
                  <div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${statusColor[shipment.status] ?? "bg-gray-200 text-gray-700"}`}
                    >
                      {shipment.status?.replace(/_/g, " ")}
                    </span>
                    <h3 className="text-lg mt-3">
                      {shipment.recipientCity}, {shipment.recipientState}
                    </h3>
                    <p className="text-gray-300 text-sm">
                      From: {shipment.senderCity}, {shipment.senderState}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-sm">
                      {shipment.trackingNumber}
                    </p>
                    <p className="text-gray-300 text-sm mt-1">
                      {shipment.serviceType}
                      {shipment.weight && shipment.weightUnit
                        ? ` · ${shipment.weight} ${shipment.weightUnit}`
                        : shipment.weight
                          ? ` · ${shipment.weight} kg`
                          : ""}
                    </p>
                    <p className="text-gray-300 text-sm mt-1">
                      ₦
                      {Number(
                        shipment.finalPrice ?? shipment.quotedPrice,
                      ).toLocaleString()}
                    </p>
                    {appliedDiscount && (
                      <p className="text-green-400 text-xs mt-1 font-medium">
                        {appliedDiscount.label ??
                          (appliedDiscount.type === "PROMO"
                            ? "Promo Code Applied"
                            : "Enterprise Contract Rate")}{" "}
                        (−₦
                        {Number(
                          appliedDiscount.discountAmount ?? 0,
                        ).toLocaleString()}
                        )
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-6 h-2 bg-gray-700 rounded">
                  <div
                    className="h-2 bg-red-600 rounded transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>

                <div className="mt-3 flex justify-between text-sm">
                  <span className="text-gray-300">
                    {shipment.pickupDate
                      ? `Pickup: ${new Date(shipment.pickupDate).toLocaleDateString()}`
                      : "Awaiting pickup"}
                  </span>
                  <span className="text-gray-300">
                    {shipment.estimatedDelivery
                      ? `ETA: ${new Date(shipment.estimatedDelivery).toLocaleDateString()}`
                      : "ETA: TBD"}
                  </span>
                </div>
              </div>

              {/* Tracking timeline */}
              {shipment.trackingHistory?.length > 0 && (
                <div className="bg-white rounded-lg border p-5">
                  <h3 className="font-semibold text-sm mb-4">
                    Tracking Timeline
                  </h3>
                  <div className="space-y-3">
                    {shipment.trackingHistory.map((evt: any, i: number) => (
                      <div key={evt.id} className="flex gap-3 text-sm">
                        <div className="flex flex-col items-center">
                          <div
                            className={`w-3 h-3 rounded-full border-2 ${i === 0 ? "border-red-500 bg-red-500" : "border-gray-300 bg-white"}`}
                          />
                          {i < shipment.trackingHistory.length - 1 && (
                            <div className="w-0.5 h-6 bg-gray-200 mt-1" />
                          )}
                        </div>
                        <div className="pb-3">
                          <p className="font-medium">
                            {evt.status?.replace(/_/g, " ")}
                          </p>
                          <p className="text-gray-500 text-xs">
                            {evt.description}
                          </p>
                          {evt.location && (
                            <p className="text-gray-400 text-xs">
                              {evt.location}
                            </p>
                          )}
                          <p className="text-gray-400 text-xs mt-0.5">
                            {new Date(evt.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Sender / Recipient info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white border rounded-lg p-4">
                  <h4 className="text-xs font-semibold text-gray-400 uppercase mb-3">
                    Sender
                  </h4>
                  <p className="font-medium">{shipment.senderName}</p>
                  <p className="text-sm text-gray-500">
                    {shipment.senderPhone}
                  </p>
                  <p className="text-sm text-gray-500">
                    {shipment.senderAddress}
                  </p>
                  <p className="text-sm text-gray-500">
                    {shipment.senderCity}, {shipment.senderState}
                  </p>
                </div>
                <div className="bg-white border rounded-lg p-4">
                  <h4 className="text-xs font-semibold text-gray-400 uppercase mb-3">
                    Recipient
                  </h4>
                  <p className="font-medium">{shipment.recipientName}</p>
                  <p className="text-sm text-gray-500">
                    {shipment.recipientPhone}
                  </p>
                  <p className="text-sm text-gray-500">
                    {shipment.recipientAddress}
                  </p>
                  <p className="text-sm text-gray-500">
                    {shipment.recipientCity}, {shipment.recipientState}
                  </p>
                </div>
              </div>

              {/* Package details */}
              <div className="bg-white border rounded-lg p-4">
                <h4 className="text-xs font-semibold text-gray-400 uppercase mb-3">
                  Package Details
                </h4>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-gray-400">Weight</p>
                    <p className="font-medium">
                      {shipment.weight && shipment.weightUnit
                        ? `${shipment.weight} ${shipment.weightUnit}`
                        : shipment.weight
                          ? `${shipment.weight} kg`
                          : shipment.cartons
                            ? `${shipment.cartons} cartons`
                            : "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400">Service</p>
                    <p className="font-medium">{shipment.serviceType}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Fragile</p>
                    <p className="font-medium">
                      {shipment.isFragile ? "Yes" : "No"}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400">Insurance</p>
                    <p className="font-medium">
                      {shipment.requiresInsurance
                        ? `Yes — ₦${Number(shipment.insuranceValue ?? 0).toLocaleString()}`
                        : "No"}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400">Zone</p>
                    <p className="font-medium">{shipment.zone ?? "—"}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Payment</p>
                    <p
                      className={`font-medium ${shipment.paymentStatus === "PAID" ? "text-green-600" : "text-orange-500"}`}
                    >
                      {shipment.paymentStatus}
                    </p>
                  </div>
                </div>
                {shipment.description && (
                  <div className="mt-3 pt-3 border-t text-sm">
                    <p className="text-gray-400">Description</p>
                    <p>{shipment.description}</p>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="clearance" className="w-full">
            <div className="space-y-4">
              <div className="flex flex-wrap gap-4 items-end">
                <input
                  value={docFilters.name}
                  onChange={(e) =>
                    setDocFilters((p) => ({ ...p, name: e.target.value }))
                  }
                  placeholder="Search document"
                  className="border rounded-md p-2 text-sm"
                />
                <select
                  value={docFilters.type}
                  onChange={(e) =>
                    setDocFilters((p) => ({ ...p, type: e.target.value }))
                  }
                  className="border rounded-md p-2 text-sm"
                >
                  <option value="">All Types</option>
                  <option value="pdf">PDF</option>
                  <option value="image">Image</option>
                </select>
                <button
                  onClick={() => setAppliedDocFilters(docFilters)}
                  className="bg-red-600 text-white px-5 py-2 rounded-md flex gap-2 items-center text-sm"
                >
                  Filter <Filter size={16} />
                </button>
              </div>
              {filteredDocs.length === 0 ? (
                <div className="text-center py-12 text-gray-400 text-sm">
                  No documents uploaded
                </div>
              ) : (
                <AppTable columns={documentColumns} data={filteredDocs} />
              )}
            </div>
          </TabsContent>

          {/* Dispatch: Update Status Tab — internal ops staff or the
              shipment's own enterprise company's Master/Dispatcher */}
          {canDispatch && (
            <TabsContent value="update" className="w-full">
              <div className="bg-white border rounded-lg p-6 space-y-4 max-w-md">
                <h3 className="font-semibold">Update Shipment Status</h3>
                <p className="text-sm text-gray-500">
                  Current:{" "}
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor[shipment.status] ?? ""}`}
                  >
                    {shipment.status}
                  </span>
                </p>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">
                    New Status
                  </label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="border rounded-md p-2 text-sm w-full"
                  >
                    <option value="">Select status</option>
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>
                        {s.replace(/_/g, " ")}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Location — feeds the tracking map's current-position
                    marker (ShipmentMap / the public /track page). Previously
                    nothing in the UI ever collected this even though the
                    backend (updateShipmentStatus) always accepted lat/lng,
                    so the map had no real data to show. */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-sm text-gray-600">
                      Location (optional — updates the tracking map)
                    </label>
                    <button
                      type="button"
                      onClick={handleUseCurrentLocation}
                      disabled={locating}
                      className="text-xs font-medium text-red-600 hover:text-red-700 disabled:opacity-50 flex items-center gap-1"
                    >
                      {locating ? (
                        <Loader2 className="animate-spin w-3 h-3" />
                      ) : (
                        <LocateFixed className="w-3 h-3" />
                      )}
                      Use my current location
                    </button>
                  </div>
                  <input
                    type="text"
                    value={locationLabel}
                    onChange={(e) => setLocationLabel(e.target.value)}
                    className="border rounded-md p-2 text-sm w-full"
                    placeholder="e.g. Abuja Regional Hub"
                  />
                  {locationError && (
                    <p className="text-xs text-red-500 mt-1">{locationError}</p>
                  )}
                  {coords && (
                    <p className="text-xs text-gray-400 mt-1">
                      Coordinates captured: {coords.lat.toFixed(5)},{" "}
                      {coords.lng.toFixed(5)}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm text-gray-600 mb-1">
                    Note (optional)
                  </label>
                  <textarea
                    value={statusNote}
                    onChange={(e) => setStatusNote(e.target.value)}
                    className="border rounded-md p-2 text-sm w-full"
                    rows={3}
                    placeholder="e.g. Package arrived at Abuja hub"
                  />
                </div>
                <button
                  onClick={handleStatusUpdate}
                  disabled={!newStatus || updating}
                  className="w-full bg-[#1F3A70] text-white py-2.5 rounded-lg text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {updating && <Loader2 className="animate-spin w-4 h-4" />}
                  Update Status
                </button>
              </div>
            </TabsContent>
          )}
        </div>
      </Tabs>

      {/* Customer: respond to pending price adjustment */}
      {pendingAdjustment && !isAdmin && (
        <Dialog
          open={adjustmentModalOpen}
          onOpenChange={setAdjustmentModalOpen}
        >
          <DialogContent size="lg">
            <PriceAdjustmentResponseModal
              adjustment={pendingAdjustment}
              shipmentServiceType={shipment.serviceType}
              trackingNumber={shipment.trackingNumber}
              onClose={() => setAdjustmentModalOpen(false)}
              onResolved={() => setAdjustmentModalOpen(false)}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Dispatcher: create a weight discrepancy adjustment */}
      {isDispatcher && (
        <Dialog
          open={createAdjustmentOpen}
          onOpenChange={setCreateAdjustmentOpen}
        >
          <DialogContent size="lg">
            <CreatePriceAdjustmentForm
              shipmentId={id}
              trackingNumber={shipment.trackingNumber}
              originalPrice={shipment.quotedPrice}
              onClose={() => setCreateAdjustmentOpen(false)}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
