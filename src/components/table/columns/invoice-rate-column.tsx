import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog/dialog";
import { ColumnDef } from "@tanstack/react-table";
import { useState } from "react";

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
      className={`px-2 py-1 text-xs rounded-full font-medium capitalize ${
        styles[status] ?? "bg-gray-100 text-gray-500"
      }`}
    >
      {status.toLowerCase()}
    </span>
  );
};

export const InvoiceColumns: ColumnDef<Invoice>[] = [
  // S/N
  {
    header: "S/N",
    cell: ({ row }) => <div>{row.index + 1}</div>,
  },

  // Invoice Number
  {
    accessorKey: "invoiceNumber",
    header: "Invoice No.",
    cell: ({ row }) => (
      <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
        {row.getValue<string>("invoiceNumber")}
      </span>
    ),
  },

  // Reference
  {
    accessorKey: "reference",
    header: "Reference",
    cell: ({ row }) => (
      <span className="font-mono text-xs text-gray-500">
        {row.getValue<string>("reference")}
      </span>
    ),
  },

  // Shipment Route
  {
    id: "route",
    header: "Route",
    cell: ({ row }) => {
      const { senderCity, recipientCity, trackingNumber } = row.original.shipment;
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

  // Amount
  {
    accessorKey: "amount",
    header: "Amount",
    cell: ({ row }) => {
      const amount = row.getValue<number>("amount");
      const currency = row.original.currency;
      return (
        <span className="font-semibold text-sm">
          {currency === "NGN" ? "₦" : currency}{" "}
          {amount.toLocaleString()}
        </span>
      );
    },
  },

  // Status
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => <StatusBadge status={row.getValue<Invoice["status"]>("status")} />,
  },

  // Paid At
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

  // Actions
  {
    id: "action",
    header: "Action",
    cell: ({ row }) => {
      const { paymentId } = row.original;
      const [isDetailsOpen, setIsDetailsOpen] = useState(false);
      const [isSendOpen, setIsSendOpen] = useState(false);
      const [isSending, setIsSending] = useState(false);
      const [isDownloading, setIsDownloading] = useState(false);

      const handleDownload = async () => {
        try {
          setIsDownloading(true);
          const res = await fetch(`/invoices/${paymentId}/download`);
          const blob = await res.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `invoice-${paymentId}.pdf`;
          a.click();
          window.URL.revokeObjectURL(url);
        } finally {
          setIsDownloading(false);
        }
      };

      const handleSendEmail = async () => {
        try {
          setIsSending(true);
          await fetch(`/invoices/${paymentId}/email`, { method: "POST" });
          setIsSendOpen(false);
        } finally {
          setIsSending(false);
        }
      };

      return (
        <div className="flex gap-2">
          {/* View Details */}
          <button
            onClick={() => setIsDetailsOpen(true)}
            className="text-gray-500 border px-3 py-1 rounded-md text-xs hover:bg-gray-50"
          >
            View
          </button>

          {/* Download */}
          <button
            onClick={handleDownload}
            disabled={isDownloading}
            className="text-blue-500 border border-blue-400 px-3 py-1 rounded-md text-xs hover:bg-blue-50 disabled:opacity-50"
          >
            {isDownloading ? "..." : "Download"}
          </button>

          {/* Send */}
          <button
            onClick={() => setIsSendOpen(true)}
            className="text-green-500 border border-green-400 px-3 py-1 rounded-md text-xs hover:bg-green-50"
          >
            Send
          </button>

          {/* View Details Modal */}
          <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
            <DialogContent>
              <InvoiceDetailsModal paymentId={paymentId} />
            </DialogContent>
          </Dialog>

          {/* Send Invoice Confirmation Modal */}
          <Dialog open={isSendOpen} onOpenChange={setIsSendOpen}>
            <DialogContent>
              <div className="text-center p-6">
                <h2 className="text-lg font-semibold">Send Invoice</h2>
                <p className="text-gray-500 mt-2 text-sm">
                  Send invoice <span className="font-mono">{row.original.invoiceNumber}</span> to the customer's email?
                </p>
                <div className="flex gap-3 mt-4">
                  <Button
                    
                    className="flex-1"
                    onClick={() => setIsSendOpen(false)}
                  >
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
    },
  },
];

// ---------------------------------------------------------------------------
// Invoice Details Modal — fetches /invoices/{paymentId}
// ---------------------------------------------------------------------------

const InvoiceDetailsModal = ({ paymentId }: { paymentId: string }) => {
  const [data, setData] = useState<Invoice | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch on mount
  useState(() => {
    fetch(`/invoices/${paymentId}`)
      .then((res) => res.json())
      .then((json) => setData(json))
      .catch(() => setError("Failed to load invoice details."))
      .finally(() => setIsLoading(false));
  });

  if (isLoading) {
    return (
      <div className="p-6 text-center text-gray-400 text-sm">Loading...</div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 text-center text-red-500 text-sm">
        {error ?? "No data found."}
      </div>
    );
  }

  const rows: [string, string][] = [
    ["Invoice No.", data.invoiceNumber],
    ["Reference", data.reference],
    ["Amount", `${data.currency === "NGN" ? "₦" : data.currency} ${data.amount.toLocaleString()}`],
    ["Status", data.status],
    ["Paid At", data.paidAt ? new Date(data.paidAt).toLocaleString() : "—"],
    ["Tracking No.", data.shipment.trackingNumber],
    ["Route", `${data.shipment.senderCity} → ${data.shipment.recipientCity}`],
    ["Shipment Status", data.shipment.status],
  ];

  return (
    <div className="p-6">
      <h2 className="text-lg font-semibold mb-4">Invoice Details</h2>
      <div className="space-y-2">
        {rows.map(([label, value]) => (
          <div key={label} className="flex justify-between text-sm">
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