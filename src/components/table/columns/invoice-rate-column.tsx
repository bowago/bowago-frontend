"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog/dialog";
import { ColumnDef } from "@tanstack/react-table";
import { useState, useEffect } from "react";

import { useDownloadInvoiceMutation } from "@/store/slice/apiSlice";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

export type Invoice = {
  invoiceNumber: string;
  paymentId: string;
  reference: string;
  amount: number;
  currency: string;
  status: "PENDING" | "PAID" | "FAILED" | "REFUNDED";
  paidAt: string | null;
  shipment: {
    trackingNumber: string;
    senderCity: string;
    recipientCity: string;
    status: string;
  };
};

const StatusBadge = ({ status }: { status: Invoice["status"] }) => {
  const styles: Record<Invoice["status"], string> = {
    PAID: "bg-green-100 text-green-600",
    PENDING: "bg-yellow-100 text-yellow-600",
    FAILED: "bg-red-100 text-red-600",
    REFUNDED: "bg-purple-100 text-purple-600",
  };
  return (
    <span
      className={`px-2 py-1 text-xs rounded-full font-medium capitalize ${styles[status] ?? "bg-gray-100 text-gray-500"}`}
    >
      {status.toLowerCase()}
    </span>
  );
};

export const InvoiceColumns: ColumnDef<Invoice>[] = [
  {
    header: "S/N",
    cell: ({ row }) => <div>{row.index + 1}</div>,
  },
  {
    accessorKey: "invoiceNumber",
    header: "Invoice No.",
    cell: ({ row }) => (
      <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
        {row.getValue<string>("invoiceNumber")}
      </span>
    ),
  },
  {
    accessorKey: "reference",
    header: "Reference",
    cell: ({ row }) => (
      <span className="font-mono text-xs text-gray-500">
        {row.getValue<string>("reference")}
      </span>
    ),
  },
  {
    id: "route",
    header: "Route",
    cell: ({ row }) => {
      const { senderCity, recipientCity, trackingNumber } =
        row.original.shipment ?? {};
      return (
        <div className="text-xs">
          <div className="font-medium">
            {senderCity} → {recipientCity}
          </div>
          <div className="text-gray-400 font-mono mt-0.5">{trackingNumber}</div>
        </div>
      );
    },
  },
  {
    accessorKey: "amount",
    header: "Amount",
    cell: ({ row }) => {
      const amount = row.getValue<number>("amount");
      const currency = row.original.currency;
      return (
        <span className="font-semibold text-sm">
          {currency === "NGN" ? "₦" : currency} {(amount ?? 0).toLocaleString()}
        </span>
      );
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <StatusBadge status={row.getValue<Invoice["status"]>("status")} />
    ),
  },
  {
    accessorKey: "paidAt",
    header: "Paid At",
    cell: ({ row }) => {
      const paidAt = row.getValue<string | null>("paidAt");
      if (!paidAt) return <span className="text-gray-400 text-xs">—</span>;
      return (
        <div className="text-xs">
          <div>{new Date(paidAt).toLocaleDateString()}</div>
          <div className="text-gray-400">
            {new Date(paidAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
        </div>
      );
    },
  },
  {
    id: "action",
    header: "Action",
    cell: ({ row }) => <InvoiceActions row={row.original} />,
  },
];

// --- Actions cell extracted to get hooks access ----
function InvoiceActions({ row }: { row: Invoice }) {
  const { paymentId } = row;
  const token = useSelector((s: RootState) => s.auth.accessToken);
  const [downloadInvoice, { isLoading: downloading }] =
    useDownloadInvoiceMutation();
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isSendOpen, setIsSendOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState("");

  const handleSendEmail = async () => {
    setSendError("");
    try {
      setIsSending(true);
      const res = await fetch(`${API_BASE}/invoices/${paymentId}/email`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.message || "Failed to send");
      }
      setIsSendOpen(false);
    } catch (e: any) {
      setSendError(e.message || "Failed to send invoice");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex gap-2">
      <button
        onClick={() => setIsDetailsOpen(true)}
        className="text-gray-500 border px-3 py-1 rounded-md text-xs hover:bg-gray-50"
      >
        View
      </button>
      <button
        onClick={() =>
          downloadInvoice({
            paymentId,
            filename: `invoice-${row.invoiceNumber}.pdf`,
          })
        }
        disabled={downloading}
        className="text-blue-500 border border-blue-400 px-3 py-1 rounded-md text-xs hover:bg-blue-50 disabled:opacity-50"
      >
        {downloading ? "..." : "Download"}
      </button>
      <button
        onClick={() => setIsSendOpen(true)}
        className="text-green-500 border border-green-400 px-3 py-1 rounded-md text-xs hover:bg-green-50"
      >
        Send
      </button>

      {/* View Details Modal */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent>
          <InvoiceDetailsModal paymentId={paymentId} token={token ?? ""} />
        </DialogContent>
      </Dialog>

      {/* Send Modal */}
      <Dialog open={isSendOpen} onOpenChange={setIsSendOpen}>
        <DialogContent>
          <div className="text-center p-6">
            <h2 className="text-lg font-semibold">Send Invoice</h2>
            <p className="text-gray-500 mt-2 text-sm">
              Send invoice{" "}
              <span className="font-mono">{row.invoiceNumber}</span> to the
              customer's registered email?
            </p>
            {sendError && (
              <p className="text-red-500 text-sm mt-2">{sendError}</p>
            )}
            <div className="flex gap-3 mt-4">
              <Button className="flex-1" onClick={() => setIsSendOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleSendEmail}
                isLoading={isSending}
                className="flex-1"
              >
                Send
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Invoice Details Modal — uses RTK/auth-aware fetch
const InvoiceDetailsModal = ({
  paymentId,
  token,
}: {
  paymentId: string;
  token: string;
}) => {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    fetch(`${API_BASE}/invoices/${paymentId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((json) =>
        setData(
          json?.data?.invoice ?? json?.data?.payment ?? json?.data ?? json,
        ),
      )
      .catch(() =>
        setError("Failed to load invoice details. Please try again."),
      )
      .finally(() => setIsLoading(false));
  }, [paymentId, token]);

  if (isLoading)
    return (
      <div className="p-6 text-center text-gray-400 text-sm">Loading...</div>
    );
  if (error || !data)
    return (
      <div className="p-6 text-center text-red-500 text-sm">
        {error ?? "No data found."}
      </div>
    );

  const rows: [string, string][] = [
    ["Invoice No.", data.invoiceNumber ?? data.reference ?? "—"],
    ["Reference", data.reference ?? "—"],
    [
      "Amount",
      `₦ ${(data.amountNaira ?? (data.amountKobo ? data.amountKobo / 100 : (data.amount ?? 0))).toLocaleString()}`,
    ],
    ["Status", data.status ?? "—"],
    ["Paid At", data.paidAt ? new Date(data.paidAt).toLocaleString() : "—"],
    ...(data.shipment
      ? [
          ["Tracking No.", data.shipment.trackingNumber ?? "—"] as [
            string,
            string,
          ],
          [
            "Route",
            `${data.shipment.senderCity ?? "?"} → ${data.shipment.recipientCity ?? "?"}`,
          ] as [string, string],
          ["Shipment Status", data.shipment.status ?? "—"] as [string, string],
        ]
      : []),
  ];

  return (
    <div className="p-6">
      <h2 className="text-lg font-semibold mb-4">Invoice Details</h2>
      <div className="space-y-2">
        {rows.map(([label, value]) => (
          <div
            key={label}
            className="flex justify-between text-sm border-b border-gray-50 pb-1.5"
          >
            <span className="text-gray-500">{label}</span>
            <span className="font-medium text-right max-w-[60%] break-all">
              {value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
