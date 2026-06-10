import { ColumnDef } from "@tanstack/react-table";
import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Button } from "@/components/ui/button";
import CancelShipmentModal from "@/components/modals/CancelShipmentModal";
import ViewShipmentModal from "@/components/modals/ViewShipmentModal";

const statusStyles: Record<
  Shipment["status"],
  { label: string; className: string }
> = {
  PENDING: {
    label: "Pending",
    className: "bg-yellow-100 text-yellow-600",
  },
  CONFIRMED: {
    label: "Confirmed",
    className: "bg-blue-100 text-blue-600",
  },
  PICKED_UP: {
    label: "Picked Up",
    className: "bg-indigo-100 text-indigo-600",
  },
  IN_TRANSIT: {
    label: "In Transit",
    className: "bg-purple-100 text-purple-600",
  },
  OUT_FOR_DELIVERY: {
    label: "Out for Delivery",
    className: "bg-orange-100 text-orange-600",
  },
  DELIVERED: {
    label: "Delivered",
    className: "bg-green-100 text-green-600",
  },
  FAILED: {
    label: "Failed",
    className: "bg-red-100 text-red-600",
  },
  CANCELLED: {
    label: "Cancelled",
    className: "bg-gray-200 text-gray-600",
  },
  RETURNED: {
    label: "Returned",
    className: "bg-pink-100 text-pink-600",
  },
  PENDING_ADMIN_REVIEW: {
    label: "Admin Review",
    className: "bg-gray-100 text-gray-500",
  },
};

export type Shipment = {
  id: string;
  trackingNumber: string;
  senderName: string;
  senderCity: string;
  senderPhone: string;
  recipientName: string;
  status: string;
  finalPrice: number;
  pickupDate: string;
  recipientPhone: string;
  recipientCity: string;
};

export const ShipmentColumns: ColumnDef<Shipment>[] = [
  {
    header: "S/N",
    cell: ({ row }) => <div>{row.index + 1}</div>,
  },

  {
    accessorKey: "trackingNumber",
    header: "Tracking No",
    cell: ({ row }) => (
      <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
        {row.getValue<string>("trackingNumber")}
      </span>
    ),
  },

  {
    accessorKey: "senderName",
    header: "Sender",
    cell: ({ row }) => {
      const { senderName, senderPhone, senderCity } = row.original;

      return (
        <div className="text-sm">
          <p className="font-medium">{senderName}</p>
          <p className="text-gray-400 text-xs">
            {senderPhone} - {senderCity}
          </p>
        </div>
      );
    },
  },

  {
    accessorKey: "recipientName",
    header: "Recipient",
    cell: ({ row }) => {
      const { recipientName, recipientPhone, recipientCity } = row.original;

      return (
        <div className="text-sm">
          <p className="font-medium">{recipientName}</p>
          <p className="text-gray-400 text-xs">
            {recipientPhone} - {recipientCity}
          </p>
        </div>
      );
    },
  },

  {
    accessorKey: "quotedPrice",
    header: "Price",
    cell: ({ row }) => (
      <span>₦{row.getValue<number>("quotedPrice")?.toLocaleString()}</span>
    ),
  },

  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue<Shipment["status"]>("status");
      const config = statusStyles[status];

      return (
        <span className={`px-2 py-1 text-xs rounded-full ${config.className}`}>
          {config.label}
        </span>
      );
    },
  },

  {
    accessorKey: "pickupDate",
    header: "Pickup Date",
    cell: ({ row }) => (
      <div className="text-xs">
        {new Date(row.getValue<string>("pickupDate")).toLocaleDateString()}
      </div>
    ),
  },

  // ⚡ Actions (View + Cancel)
  {
    id: "action",
    header: "Action",
    cell: ({ row }) => {
      const [openViewModal, setOpenViewModal] = useState(false);
      const [openCancelModal, setOpenCancelModal] = useState(false);

      const shipment = row.original;

      const handleCancel = () => {
        console.log("Cancel shipment:", shipment.id);
        // 🔥 call your cancel API here
      };

      const handleView = () => {
        console.log("View shipment:", shipment.id);
        // 🔥 navigate to details page
        // router.push(`/shipments/${shipment.id}`)
      };

      return (
        <div className="flex gap-2">
          {/* 👁 View */}
          <button
            onClick={() => setOpenViewModal(true)}
            className="text-blue-500 border border-blue-500 px-3 py-1 rounded-md text-xs"
          >
            View
          </button>

          {/* ❌ Cancel */}
          <button
            onClick={() => setOpenCancelModal(true)}
            className="text-red-500 border border-red-500 px-3 py-1 rounded-md text-xs"
          >
            Cancel
          </button>

          <ViewShipmentModal
            isOpen={openViewModal}
            setIsOpen={setOpenViewModal}
            id={row.original.id}
          />
          <CancelShipmentModal
            isOpen={openCancelModal}
            setIsOpen={setOpenCancelModal}
            id={row.original.id}
          />
        </div>
      );
    },
  },
];

// export const shipmentColumns: ColumnDef<Shipment>[] = [
//   {
//     accessorKey: "shipmentId",
//     header: "Shipment ID",
//     cell: ({ row }) => (
//       <RowClick row={row}>{row.getValue("shipmentId")}</RowClick>
//     ),
//   },

//   {
//     accessorKey: "trackingId",
//     header: "Tracking ID",
//     cell: ({ row }) => (
//       <RowClick row={row}>{row.getValue("trackingId")}</RowClick>
//     ),
//   },

//   {
//     accessorKey: "origin",
//     header: "Shipment Origin",
//     cell: ({ row }) => <RowClick row={row}>{row.getValue("origin")}</RowClick>,
//   },

//   {
//     accessorKey: "destination",
//     header: "Destination",
//     cell: ({ row }) => (
//       <RowClick row={row}>{row.getValue("destination")}</RowClick>
//     ),
//   },

//   {
//     accessorKey: "deliveryDate",
//     header: "Est. Delivery Date",
//     cell: ({ row }) => (
//       <RowClick row={row}>{row.getValue("deliveryDate")}</RowClick>
//     ),
//   },

//   {
//     accessorKey: "status",
//     header: "Status",
//     cell: ({ row }) => {
//       const status: string = row.getValue("status");

//       return (
//         <RowClick row={row}>
//           <span
//             className={`px-3 py-1 text-xs rounded-full capitalize
//             ${
//               status === "in-transit"
//                 ? "bg-yellow-100 text-yellow-700"
//                 : status === "delivered"
//                   ? "bg-green-100 text-green-700"
//                   : "bg-blue-100 text-blue-700"
//             }`}
//           >
//             {status}
//           </span>
//         </RowClick>
//       );
//     },
//   },

//   {
//     id: "action",
//     header: "Action",
//     cell: ({ row }) => {
//       const router = useRouter();

//       return (
//         <button
//           onClick={() =>
//             router.push(`/dashboard/shipments/${row.original.shipmentId}`)
//           }
//           className="bg-red-600 hover:bg-red-700 text-white px-4 py-1 rounded-md text-sm"
//         >
//           Manage
//         </button>
//       );
//     },
//   },
// ];

// const RowClick = ({
//   row,
//   children,
// }: {
//   row: Row<Shipment>;
//   children: React.ReactNode;
// }) => {
//   const router = useRouter();

//   return (
//     <div
//       className="cursor-pointer hover:bg-gray-100 p-2"
//       onClick={() =>
//         router.push(`/dashboard/shipments/${row.original.shipmentId}`)
//       }
//     >
//       {children}
//     </div>
//   );
// };
