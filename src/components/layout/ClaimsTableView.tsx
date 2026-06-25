"use client";

/**
 * ClaimsTableView — Sprint 6/7 fixes
 *
 * Fixed:
 *  - Admin view now calls GET /claims (all), customer view calls GET /claims/my
 *  - Admin can review a claim: approve / reject / mark paid inline
 *  - Status filter actually filters
 *  - Shows evidence image count
 *  - Claim type shows DAMAGE / LOSS / OTHER correctly
 */

import { useState } from "react";
import { AppTable } from "@/components/table/Table";
import {
  useGetClaimsQuery,
  useGetMyClaimsQuery,
  useReviewClaimMutation,
} from "@/store/slice/apiSlice";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { ColumnDef } from "@tanstack/react-table";
import { Filter, CheckCircle, XCircle, CreditCard, Eye } from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────
type ClaimStatus = "SUBMITTED" | "UNDER_REVIEW" | "APPROVED" | "REJECTED" | "PAID";

interface ClaimImage { url: string; publicId?: string; }

interface Claim {
  id: string;
  shipmentId: string;
  type: string;
  description: string;
  declaredValue: number;
  claimAmount: number;
  approvedAmount?: number;
  status?: ClaimStatus;
  reviewNote?: string;
  bankName?: string;
  accountNumber?: string;
  accountName?: string;
  images?: ClaimImage[];
  createdAt?: string;
  shipment?: { trackingNumber?: string };
  user?: { firstName?: string; lastName?: string; email?: string };
}

const STATUS_STYLES: Record<string, string> = {
  SUBMITTED:    "bg-blue-50 text-blue-700",
  UNDER_REVIEW: "bg-yellow-50 text-yellow-700",
  APPROVED:     "bg-green-50 text-green-700",
  REJECTED:     "bg-red-50 text-red-600",
  PAID:         "bg-purple-50 text-purple-700",
};

const TYPE_LABELS: Record<string, string> = {
  DAMAGE: "Damage",
  LOSS:   "Loss",
  OTHER:  "Other",
};

const fmt = (n?: number) =>
  new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(n ?? 0);

// ── Admin Review Panel ────────────────────────────────────────────────────────
function ReviewPanel({ claim, onClose }: { claim: Claim; onClose: () => void }) {
  const [reviewClaim, { isLoading }] = useReviewClaimMutation();
  const [note, setNote]                 = useState(claim.reviewNote ?? "");
  const [approved, setApproved]         = useState(String(claim.approvedAmount ?? claim.claimAmount));

  const update = async (status: string) => {
    await reviewClaim({
      id: claim.id,
      status,
      reviewNote: note || undefined,
      approvedAmount: status === "APPROVED" ? Number(approved) : undefined,
    }).unwrap();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-bold text-gray-900">Review Claim</h3>
            <p className="text-xs text-gray-400 mt-0.5">
              {claim.shipment?.trackingNumber ?? claim.shipmentId.slice(0, 8)}
              {" · "}
              {TYPE_LABELS[claim.type] ?? claim.type}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
        </div>

        <div className="bg-gray-50 rounded-xl p-4 text-sm space-y-1">
          <p><span className="text-gray-500">Customer:</span>{" "}
            {claim.user ? `${claim.user.firstName} ${claim.user.lastName} (${claim.user.email})` : "—"}
          </p>
          <p><span className="text-gray-500">Declared:</span>{" "}{fmt(claim.declaredValue)}</p>
          <p><span className="text-gray-500">Claimed:</span>{" "}{fmt(claim.claimAmount)}</p>
          {claim.images && claim.images.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-2">
              {claim.images.map((img, i) => (
                <a key={i} href={img.url} target="_blank" rel="noopener noreferrer"
                  className="text-xs text-blue-600 underline">
                  Evidence {i + 1}
                </a>
              ))}
            </div>
          )}
        </div>

        <p className="text-sm text-gray-700 bg-yellow-50 p-3 rounded-xl">
          {claim.description}
        </p>

        <div className="space-y-2">
          <label className="text-xs font-medium text-gray-600">Approved Amount (₦)</label>
          <input
            type="number"
            value={approved}
            onChange={e => setApproved(e.target.value)}
            className="w-full border rounded-xl px-3 py-2 text-sm"
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-medium text-gray-600">Review Note</label>
          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            rows={2}
            placeholder="Optional note to customer…"
            className="w-full border rounded-xl px-3 py-2 text-sm resize-none"
          />
        </div>

        <div className="flex gap-2 pt-1">
          <button onClick={() => update("UNDER_REVIEW")} disabled={isLoading}
            className="flex-1 flex items-center justify-center gap-1.5 border border-yellow-400 text-yellow-700 py-2.5 rounded-xl text-sm font-medium hover:bg-yellow-50 transition-colors disabled:opacity-50">
            <Eye className="w-4 h-4" /> Mark Under Review
          </button>
          <button onClick={() => update("APPROVED")} disabled={isLoading}
            className="flex-1 flex items-center justify-center gap-1.5 bg-green-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50">
            <CheckCircle className="w-4 h-4" /> Approve
          </button>
          <button onClick={() => update("REJECTED")} disabled={isLoading}
            className="flex-1 flex items-center justify-center gap-1.5 bg-red-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50">
            <XCircle className="w-4 h-4" /> Reject
          </button>
        </div>

        {claim.status === "APPROVED" && (
          <button onClick={() => update("PAID")} disabled={isLoading}
            className="w-full flex items-center justify-center gap-1.5 bg-purple-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-purple-700 transition-colors disabled:opacity-50">
            <CreditCard className="w-4 h-4" /> Mark as Paid
          </button>
        )}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function ClaimsTableView() {
  const user    = useSelector((s: RootState) => s.auth.user) as any;
  const isAdmin = user?.role === "ADMIN";

  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter,   setTypeFilter]   = useState("");
  const [reviewing,    setReviewing]    = useState<Claim | null>(null);

  // Admin sees all claims; customer sees only their own
  const { data: adminData,    isLoading: adminLoading }    = useGetClaimsQuery({ status: statusFilter || undefined, type: typeFilter || undefined }, { skip: !isAdmin });
  const { data: customerData, isLoading: customerLoading } = useGetMyClaimsQuery(undefined, { skip: isAdmin });

  const isLoading = isAdmin ? adminLoading : customerLoading;

  const raw     = isAdmin ? adminData : customerData;
  const claims: Claim[] = (raw as any)?.data?.claims ?? (raw as any)?.claims ?? [];

  // ── Columns ────────────────────────────────────────────────────────────────
  const columns: ColumnDef<Claim>[] = [
    {
      id: "sn",
      header: "S/N",
      cell: ({ row }) => <span className="text-gray-400 text-xs">{row.index + 1}</span>,
    },
    {
      accessorKey: "shipment",
      header: "Tracking #",
      cell: ({ row }) => (
        <span className="font-mono text-xs">
          {row.original.shipment?.trackingNumber ?? row.original.shipmentId.slice(0, 8) + "…"}
        </span>
      ),
    },
    ...(isAdmin ? [{
      accessorKey: "user",
      header: "Customer",
      cell: ({ row }: any) => (
        <span className="text-xs text-gray-700">
          {row.original.user ? `${row.original.user.firstName} ${row.original.user.lastName}` : "—"}
        </span>
      ),
    }] : []),
    {
      accessorKey: "type",
      header: "Type",
      cell: ({ row }) => (
        <span className="text-xs font-medium">{TYPE_LABELS[row.original.type] ?? row.original.type}</span>
      ),
    },
    {
      accessorKey: "claimAmount",
      header: "Claim Amount",
      cell: ({ row }) => <span className="text-xs">{fmt(row.original.claimAmount)}</span>,
    },
    {
      accessorKey: "images",
      header: "Evidence",
      cell: ({ row }) => (
        <span className="text-xs text-gray-500">
          {row.original.images?.length ?? 0} photo{(row.original.images?.length ?? 0) !== 1 ? "s" : ""}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const s = row.original.status ?? "SUBMITTED";
        return (
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${STATUS_STYLES[s] ?? "bg-gray-100 text-gray-600"}`}>
            {s.replace("_", " ")}
          </span>
        );
      },
    },
    {
      accessorKey: "createdAt",
      header: "Date",
      cell: ({ row }) => (
        <span className="text-xs text-gray-400">
          {row.original.createdAt ? new Date(row.original.createdAt).toLocaleDateString() : "—"}
        </span>
      ),
    },
    ...(isAdmin ? [{
      id: "actions",
      header: "Actions",
      cell: ({ row }: any) => (
        <button
          onClick={() => setReviewing(row.original)}
          className="text-xs bg-gray-900 text-white px-3 py-1.5 rounded-lg hover:bg-gray-700 transition-colors"
        >
          Review
        </button>
      ),
    }] : []),
  ];

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-end mb-4">
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="border rounded-xl px-3 py-2 text-sm bg-white"
        >
          <option value="">All Statuses</option>
          {["SUBMITTED", "UNDER_REVIEW", "APPROVED", "REJECTED", "PAID"].map(s => (
            <option key={s} value={s}>{s.replace("_", " ")}</option>
          ))}
        </select>
        <select
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value)}
          className="border rounded-xl px-3 py-2 text-sm bg-white"
        >
          <option value="">All Types</option>
          <option value="DAMAGE">Damage</option>
          <option value="LOSS">Loss</option>
          <option value="OTHER">Other</option>
        </select>
        {(statusFilter || typeFilter) && (
          <button
            onClick={() => { setStatusFilter(""); setTypeFilter(""); }}
            className="text-sm text-red-600 font-medium"
          >
            Clear filters
          </button>
        )}
      </div>

      {isLoading && <div className="py-10 text-center text-sm text-gray-400">Loading claims…</div>}
      {!isLoading && claims.length === 0 && (
        <div className="py-10 text-center text-sm text-gray-400">No claims found.</div>
      )}
      {!isLoading && claims.length > 0 && (
        <AppTable columns={columns} data={claims} />
      )}

      {reviewing && (
        <ReviewPanel claim={reviewing} onClose={() => setReviewing(null)} />
      )}
    </div>
  );
}
