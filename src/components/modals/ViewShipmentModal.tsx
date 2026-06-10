"use client";

import * as Dialog from "@radix-ui/react-dialog";

import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { deleteShipmentSchema } from "@/lib/validation";
import { Input, TextArea } from "../ui/input";
import { Button } from "../ui/button";
import {
  useCancelShipmentMutation,
  useGetUserShipmentsByIdQuery,
} from "@/store/slice/apiSlice";
import { SERVICE_DELIVERY_MAP, SERVICE_OPTIONS } from "./CreateShipmentModal";

// ─── Types ────────────────────────────────────────────────────────────────────

// ─── Icons ────────────────────────────────────────────────────────────────────

function ReviewStep({
  data,
}: {
  data: {
    shipment?: any;
    quote?: any;
  };
}) {
  const shipment = data.shipment;

  const service = shipment?.serviceType ?? "STANDARD";
  const deliveryTime = SERVICE_DELIVERY_MAP[service] ?? "—";
  const serviceLabel =
    SERVICE_OPTIONS.find((s) => s.value === service)?.label ?? service;

  const rows = (items: { label: string; value?: string | number | null }[]) =>
    items.map(({ label, value }) => (
      <div
        key={label}
        className="flex justify-between items-center py-[5px] border-b border-gray-100 last:border-none"
      >
        <span className="text-xs text-gray-500">{label}</span>
        <span className="text-xs font-medium text-gray-800">
          {value ?? "—"}
        </span>
      </div>
    ));

  return (
    <div>
      {/* 💰 Price card */}
      <div className="bg-gray-900 rounded-2xl p-5 mb-5 text-center">
        <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-1">
          Total Price
        </p>
        <p className="text-4xl font-bold text-white tracking-tight font-mono">
          ₦{shipment?.quotedPrice?.toLocaleString() ?? "—"}
        </p>

        <div className="border-t border-dashed border-gray-700 my-3" />

        <div className="flex justify-around">
          <div className="text-left">
            <p className="text-[10px] text-gray-400">Delivery Time</p>
            <p className="text-sm font-semibold text-white">{deliveryTime}</p>
          </div>

          <div className="w-px bg-gray-700" />

          <div className="text-left">
            <p className="text-[10px] text-gray-400">Service Type</p>
            <p className="text-sm font-semibold text-white">{serviceLabel}</p>
          </div>
        </div>
      </div>

      {/* 📦 Order Details */}
      <div className="mb-4">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-2">
          Order Details
        </p>

        {rows([
          {
            label: "Route",
            value: `${shipment?.fromCity?.name ?? "—"} → ${
              shipment?.toCity?.name ?? "—"
            }`,
          },
          {
            label: "Weight",
            value: shipment?.weight
              ? `${shipment.weight} ${shipment.weightUnit}`
              : "—",
          },
          {
            label: "Distance",
            value: shipment?.distanceKm ? `${shipment.distanceKm} km` : "—",
          },
          {
            label: "Insurance Value",
            value: shipment?.insuranceValue
              ? `₦${shipment.insuranceValue?.toLocaleString()}`
              : "—",
          },
          {
            label: "Pickup Date",
            value: shipment?.pickupDate
              ? new Date(shipment.pickupDate).toLocaleDateString()
              : "—",
          },
          // {
          //   label: "Sub Total",
          //   value: `₦${shipment?.breakdown?.subtotal?.toLocaleString() ?? "0"}`,
          // },
        ])}

        {/* 🔥 Dynamic Surcharges */}
        {shipment?.surchargeBreakdown?.map((item: any) => (
          <div
            key={item.type}
            className="flex justify-between items-center py-[5px] border-b border-gray-100"
          >
            <span className="text-xs text-gray-500">{item.label}</span>
            <span className="text-xs font-medium text-gray-800">
              ₦{item.amount?.toLocaleString()}
            </span>
          </div>
        ))}

        <div className="flex justify-between items-center py-[5px]">
          <span className="text-xs font-semibold text-gray-900">Total</span>
          <span className="text-sm font-bold text-gray-900">
            ₦{shipment?.quotedPrice?.toLocaleString() ?? "—"}
          </span>
        </div>
      </div>

      <div className="h-px bg-gray-100 my-4" />

      {/* 🚚 Delivery Details */}
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-2">
          Delivery Details
        </p>

        {rows([
          { label: "Sender Name", value: shipment?.senderName },
          { label: "Sender Phone", value: shipment?.senderPhone },
          { label: "Full Address", value: shipment?.senderAddress },
          { label: "Sender City", value: shipment?.senderCity },
          { label: "Sender State", value: shipment?.senderState },
        ])}

        <div className="h-px bg-gray-100 my-2" />

        {rows([
          { label: "Receiver Name", value: shipment?.recipientName },
          { label: "Receiver Phone", value: shipment?.recipientPhone },
          { label: "Full Address", value: shipment?.recipientAddress },
          { label: "Receiver City", value: shipment?.recipientCity },
          { label: "Receiver State", value: shipment?.recipientState },
          { label: "Notes", value: shipment?.notes },
        ])}
      </div>
    </div>
  );
}

export default function ViewShipmentModal({
  isOpen,
  setIsOpen,
  id,
}: {
  isOpen: boolean;
  setIsOpen: (e: boolean) => void;
  id: string;
}) {
  const { isLoading: isLoadingShipmentDetails, data: shipmentData } =
    useGetUserShipmentsByIdQuery({ id });

  const shipmentDetails = shipmentData?.data ?? {};
  const [handleCancelShipment, { isLoading }] = useCancelShipmentMutation();

  console.log({ shipmentDetails });

  // ── Step 2 form ──
  const deleteShipmentForm = useForm<{ reason: string }>({
    resolver: yupResolver(deleteShipmentSchema),
    defaultValues: {
      reason: "",
    },
  });

  const reset = () => {
    deleteShipmentForm.reset({});
    setIsOpen(false);
  };

  const handleOpenChange = (v: boolean) => {
    setIsOpen(v);
    if (!v) reset();
  };

  const DeleteForm = () => {
    const {
      register,
      handleSubmit,
      formState: { errors },
    } = deleteShipmentForm;

    const onSubmit = (data: { reason: string }) => {
      // normalize categoryId
      handleCancelShipment({ id: id, reason: data.reason })
        .unwrap()
        .then(() => reset());
      // TODO: replace with actual mutation
    };

    return (
      <form className="mt-10" onSubmit={handleSubmit(onSubmit)}>
        <TextArea
          label="Reason for cancelling"
          {...register("reason")}
          error={errors.reason?.message}
        />

        <div className="flex justify-end mt-5">
          <Button
            isLoading={isLoading}
            type="submit"
            className="px-5 py-2 text-xs"
          >
            Cancel
          </Button>
        </div>
      </form>
    );
  };

  return (
    <div className="flex items-center justify-center">
      <Dialog.Root open={isOpen} onOpenChange={handleOpenChange}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 animate-[fadeIn_150ms_ease]" />
          <Dialog.Content
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-white rounded-2xl shadow-2xl w-full max-w-xl p-6 focus:outline-none"
            style={{ maxHeight: "90vh", overflowY: "auto" }}
          >
            <div className="flex items-center justify-between mb-1">
              <Dialog.Close asChild>
                <button className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600">
                  <svg
                    viewBox="0 0 24 24"
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </Dialog.Close>
              <Dialog.Title className="text-xl font-bold text-gray-900">
                {shipmentDetails?.shipment?.trackingNumber} Shipment
              </Dialog.Title>
              <span className="w-6" />
            </div>

            {isLoadingShipmentDetails && (
              <div
                className="mx-auto inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"
                role="status"
              >
                <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">
                  Loading...
                </span>
              </div>
            )}

            <ReviewStep data={shipmentDetails} />
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp { from { opacity: 0; transform: translate(-50%, -46%) } to { opacity: 1; transform: translate(-50%, -50%) } }
      `}</style>
    </div>
  );
}
