"use client";

import { useState } from "react";
import {
  useGetOrgInvitesQuery,
  useInviteMemberMutation,
  useCancelOrgInviteMutation,
  useResendOrgInviteMutation,
} from "@/store/slice/apiSlice";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { successToast, warningToast, errorToast } from "@/lib/toast/toast";
import {
  UserPlus,
  Mail,
  RotateCcw,
  Loader2,
  Trash2,
  X,
  Clock,
  CheckCircle,
  AlertCircle,
  Shield,
  Eye,
  Truck,
  BarChart2,
  Crown,
} from "lucide-react";
import { format } from "date-fns";

// ─── Role definitions with permission summary ─────────────────────────────────

const ROLES = [
  {
    value: "ROLE_USER",
    label: "Tracking Only",
    description: "Can only track shipments — no other access",
    icon: Eye,
    color: "bg-purple-50 border-purple-200 text-purple-700",
    accent: "#7C3AED",
    permissions: ["Track shipments by number"],
    restricted: true,
  },
  {
    value: "ROLE_DISPATCHER",
    label: "Dispatcher",
    description: "Create & manage shipments, view tracking",
    icon: Truck,
    color: "bg-blue-50 border-blue-200 text-blue-700",
    accent: "#1D4ED8",
    permissions: [
      "Create & manage shipments",
      "View tracking",
      "Manage deliveries",
    ],
    restricted: false,
  },
  {
    value: "ROLE_FINANCE",
    label: "Finance",
    description: "View invoices, payments & financial reports",
    icon: BarChart2,
    color: "bg-green-50 border-green-200 text-green-700",
    accent: "#15803D",
    permissions: [
      "View invoices & payments",
      "Download financial reports",
      "View shipment costs",
    ],
    restricted: false,
  },
  {
    value: "ROLE_AGENT",
    label: "Customer Service",
    description: "Handle customer-related workflows and support",
    icon: Eye,
    color: "bg-teal-50 border-teal-200 text-teal-700",
    accent: "#0F766E",
    permissions: [
      "View and manage customer interactions",
      "View shipment tracking",
    ],
    restricted: false,
  },
  {
    value: "ROLE_MASTER",
    label: "Master",
    description: "Manage team & full company access",
    icon: Crown,
    color: "bg-red-50 border-red-200 text-red-700",
    accent: "#CC0000",
    permissions: [
      "Everything in the company",
      "Invite & manage team members",
      "Restrict access",
    ],
    restricted: false,
  },
];

const STATUS_BADGE: Record<
  string,
  { label: string; className: string; icon: any }
> = {
  PENDING: {
    label: "Pending",
    className: "bg-yellow-100 text-yellow-700",
    icon: Clock,
  },
  ACCEPTED: {
    label: "Accepted",
    className: "bg-green-100 text-green-700",
    icon: CheckCircle,
  },
  EXPIRED: {
    label: "Expired",
    className: "bg-gray-100 text-gray-500",
    icon: AlertCircle,
  },
  CANCELLED: {
    label: "Cancelled",
    className: "bg-red-100 text-red-500",
    icon: X,
  },
};

// ─── Role picker card ─────────────────────────────────────────────────────────

function RoleCard({
  role,
  selected,
  onSelect,
}: {
  role: (typeof ROLES)[0];
  selected: boolean;
  onSelect: () => void;
}) {
  const Icon = role.icon;
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full text-left rounded-xl border-2 p-3.5 transition-all ${
        selected
          ? `border-[${role.accent}] bg-white shadow-md ring-2 ring-[${role.accent}]/20`
          : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm"
      }`}
      style={
        selected
          ? {
              borderColor: role.accent,
              boxShadow: `0 0 0 3px ${role.accent}22`,
            }
          : {}
      }
    >
      <div className="flex items-start gap-3">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: selected ? role.accent : "#F3F4F6" }}
        >
          <Icon
            className="w-4 h-4"
            style={{ color: selected ? "#fff" : "#6B7280" }}
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-gray-900">{role.label}</p>
            {role.restricted && (
              <span className="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full font-medium">
                Restricted
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-0.5">{role.description}</p>
          {selected && (
            <ul className="mt-2 space-y-1">
              {role.permissions.map((p) => (
                <li
                  key={p}
                  className="flex items-center gap-1.5 text-xs text-gray-600"
                >
                  <span style={{ color: role.accent }}>✓</span> {p}
                </li>
              ))}
            </ul>
          )}
        </div>
        {selected && (
          <div
            className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
            style={{ background: role.accent }}
          >
            <span className="text-white text-[10px] font-bold">✓</span>
          </div>
        )}
      </div>
    </button>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TeamManagementPage() {
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState("");
  const [inviteForm, setInviteForm] = useState({
    email: "",
    role: "ROLE_DISPATCHER",
  });
  const [formError, setFormError] = useState<string | null>(null);

  const { data, isLoading, refetch } = useGetOrgInvitesQuery(
    filterStatus ? { status: filterStatus } : undefined,
  );
  const [inviteMember, { isLoading: isSending }] = useInviteMemberMutation();
  const [cancelInvite] = useCancelOrgInviteMutation();
  const [resendInvite] = useResendOrgInviteMutation();
  // Per-row loading state — the mutation hook's own isLoading is shared
  // across every row, so with more than one pending invite, clicking
  // Resend on one would show a loading state that looked identical to
  // (or interfered with) every other row's button.
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const invites: any[] = data?.data?.invites ?? [];
  const selectedRoleDef =
    ROLES.find((r) => r.value === inviteForm.role) ?? ROLES[1];

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteForm.email.trim()) {
      setFormError("Email is required");
      return;
    }
    if (!inviteForm.role) {
      setFormError("Select an access level");
      return;
    }
    setFormError(null);
    try {
      const result = await inviteMember(inviteForm).unwrap();
      const emailSent =
        (result as any)?.data?.emailSent ?? (result as any)?.emailSent;
      if (emailSent === false) {
        warningToast(
          "Invite created, but the email failed to send. Use Resend, or share the invite link directly.",
        );
      } else {
        successToast("Invite sent successfully");
      }
      setInviteForm({ email: "", role: "ROLE_DISPATCHER" });
      setShowInviteForm(false);
      refetch();
    } catch (err: any) {
      setFormError(err?.data?.message || "Failed to send invite");
    }
  };

  const roleLabel = (role: string) =>
    ROLES.find((r) => r.value === role)?.label ?? role.replace("ROLE_", "");

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Team Management</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Invite team members and control their access level — including
            restricting to Tracking Only.
          </p>
        </div>
        <Button
          onClick={() => setShowInviteForm((v) => !v)}
          className="flex items-center gap-2"
        >
          <UserPlus className="w-4 h-4" />
          Invite Member
        </Button>
      </div>

      {/* Invite Form */}
      {showInviteForm && (
        <form
          onSubmit={handleInvite}
          className="bg-white border border-gray-200 rounded-2xl p-6 mb-6 shadow-sm"
        >
          <h2 className="font-semibold text-gray-900 mb-1">Send an Invite</h2>
          <p className="text-gray-500 text-sm mb-5">
            The invited person will receive an email to set their password.
          </p>

          {/* Email */}
          <div className="mb-5">
            <Input
              label="Email address"
              type="email"
              value={inviteForm.email}
              onChange={(e) => {
                setInviteForm((p) => ({ ...p, email: e.target.value }));
                setFormError(null);
              }}
              placeholder="teammate@company.ng"
              required
            />
          </div>

          {/* Access level picker */}
          <div className="mb-5">
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Access Level
            </label>

            {/* Tracking Only quick-select banner */}
            {inviteForm.role !== "ROLE_USER" && (
              <div className="flex items-center justify-between bg-purple-50 border border-purple-200 rounded-xl px-4 py-3 mb-3">
                <div className="flex items-center gap-2 text-sm text-purple-700">
                  <Shield className="w-4 h-4" />
                  <span>Need to restrict access?</span>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setInviteForm((p) => ({ ...p, role: "ROLE_USER" }))
                  }
                  className="text-xs font-semibold text-purple-700 hover:text-purple-900 underline"
                >
                  Set Tracking Only
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {ROLES.map((role) => (
                <RoleCard
                  key={role.value}
                  role={role}
                  selected={inviteForm.role === role.value}
                  onSelect={() =>
                    setInviteForm((p) => ({ ...p, role: role.value }))
                  }
                />
              ))}
            </div>
          </div>

          {/* Selected role summary */}
          <div
            className="flex items-center gap-3 rounded-xl px-4 py-3 mb-5 text-sm"
            style={{
              background: `${selectedRoleDef.accent}11`,
              borderLeft: `3px solid ${selectedRoleDef.accent}`,
            }}
          >
            <Shield
              className="w-4 h-4 flex-shrink-0"
              style={{ color: selectedRoleDef.accent }}
            />
            <span style={{ color: selectedRoleDef.accent }}>
              <strong>{selectedRoleDef.label}</strong> —{" "}
              {selectedRoleDef.description}
            </span>
          </div>

          {formError && (
            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2 mb-4">
              <AlertCircle className="w-4 h-4" />
              {formError}
            </div>
          )}

          <div className="flex gap-3 justify-end">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setShowInviteForm(false);
                setFormError(null);
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              isLoading={isSending}
              className="flex items-center gap-2"
            >
              <Mail className="w-4 h-4" />
              Send Invite
            </Button>
          </div>
        </form>
      )}

      {/* Filter tabs */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-sm text-gray-500 font-medium mr-1">Filter:</span>
        {["", "PENDING", "ACCEPTED", "EXPIRED", "CANCELLED"].map((s) => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              filterStatus === s
                ? "bg-[#CC0000] text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {s || "All"}
          </button>
        ))}
      </div>

      {/* Invites table */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="p-8 text-center text-gray-400 text-sm">
            Loading invites…
          </div>
        ) : invites.length === 0 ? (
          <div className="p-12 text-center">
            <UserPlus className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No invites yet</p>
            <p className="text-gray-400 text-sm mt-1">
              Invite your first team member above. You can restrict their access
              to Tracking Only.
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-5 py-3 font-medium text-gray-600">
                  Email
                </th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">
                  Access Level
                </th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">
                  Status
                </th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">
                  Expires
                </th>
                <th className="text-right px-5 py-3 font-medium text-gray-600">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {invites.map((invite: any) => {
                const badge =
                  STATUS_BADGE[invite.status] ?? STATUS_BADGE.PENDING;
                const BadgeIcon = badge.icon;
                const roleDef = ROLES.find((r) => r.value === invite.role);
                const RoleIcon = roleDef?.icon ?? Eye;
                return (
                  <tr
                    key={invite.id}
                    className="hover:bg-gray-50/60 transition-colors"
                  >
                    <td className="px-5 py-3.5 font-medium text-gray-800">
                      {invite.email}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-6 h-6 rounded-md flex items-center justify-center"
                          style={{
                            background: `${roleDef?.accent ?? "#6B7280"}22`,
                          }}
                        >
                          <RoleIcon
                            className="w-3.5 h-3.5"
                            style={{ color: roleDef?.accent ?? "#6B7280" }}
                          />
                        </div>
                        <div>
                          <span className="text-gray-800 font-medium">
                            {roleLabel(invite.role)}
                          </span>
                          {invite.role === "ROLE_USER" && (
                            <span className="ml-1.5 text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full font-medium">
                              Restricted
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.className}`}
                        >
                          <BadgeIcon className="w-3 h-3" />
                          {badge.label}
                        </span>
                        {invite.emailSent === false && (
                          <span
                            title={
                              invite.emailError
                                ? `Email failed: ${invite.emailError}`
                                : "The invite email failed to send — use Resend, or share the invite link directly."
                            }
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-red-50 text-red-600 border border-red-100"
                          >
                            ✉ Email failed
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-gray-500 text-xs">
                      {invite.expiresAt
                        ? format(new Date(invite.expiresAt), "dd MMM yyyy")
                        : "—"}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-2">
                        {["PENDING", "EXPIRED"].includes(invite.status) && (
                          <button
                            onClick={async () => {
                              setResendingId(invite.id);
                              try {
                                const result = await resendInvite({
                                  id: invite.id,
                                }).unwrap();
                                const emailSent =
                                  (result as any)?.data?.emailSent ??
                                  (result as any)?.emailSent;
                                if (emailSent === false) {
                                  warningToast(
                                    "Invite refreshed, but the email failed to send. Share the invite link directly.",
                                  );
                                } else {
                                  successToast("Invite resent successfully");
                                }
                                refetch();
                              } catch (err: any) {
                                errorToast(
                                  err?.data?.message ||
                                    "Failed to resend invite",
                                );
                              } finally {
                                setResendingId(null);
                              }
                            }}
                            disabled={resendingId === invite.id}
                            className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 px-2 py-1 rounded hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                          >
                            {resendingId === invite.id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <RotateCcw className="w-3 h-3" />
                            )}
                            {resendingId === invite.id
                              ? "Resending…"
                              : "Resend"}
                          </button>
                        )}
                        {invite.status === "PENDING" && (
                          <button
                            onClick={async () => {
                              if (
                                !confirm(`Cancel invite for ${invite.email}?`)
                              )
                                return;
                              setDeletingId(invite.id);
                              try {
                                await cancelInvite({ id: invite.id }).unwrap();
                                successToast("Invite cancelled");
                                refetch();
                              } catch (err: any) {
                                errorToast(
                                  err?.data?.message ||
                                    "Failed to cancel invite",
                                );
                              } finally {
                                setDeletingId(null);
                              }
                            }}
                            disabled={deletingId === invite.id}
                            className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 px-2 py-1 rounded hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                          >
                            {deletingId === invite.id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <X className="w-3 h-3" />
                            )}
                            {deletingId === invite.id
                              ? "Cancelling…"
                              : "Cancel"}
                          </button>
                        )}
                        {/* Once an invite is already cancelled or expired, it's
                            a dead end — the endpoint used to reject calling
                            cancel again ("Only pending invites can be
                            cancelled"), so a cancelled invite just sat in the
                            list forever with no way to clear it out. The same
                            endpoint now permanently deletes a terminal invite
                            instead of re-cancelling it. */}
                        {["CANCELLED", "EXPIRED"].includes(invite.status) && (
                          <button
                            onClick={async () => {
                              if (
                                !confirm(
                                  `Permanently remove this invite for ${invite.email}? This can't be undone.`,
                                )
                              )
                                return;
                              setDeletingId(invite.id);
                              try {
                                await cancelInvite({ id: invite.id }).unwrap();
                                successToast("Invite removed");
                                refetch();
                              } catch (err: any) {
                                errorToast(
                                  err?.data?.message ||
                                    "Failed to remove invite",
                                );
                              } finally {
                                setDeletingId(null);
                              }
                            }}
                            disabled={deletingId === invite.id}
                            className="flex items-center gap-1 text-xs text-gray-500 hover:text-red-700 px-2 py-1 rounded hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                          >
                            {deletingId === invite.id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Trash2 className="w-3 h-3" />
                            )}
                            {deletingId === invite.id ? "Removing…" : "Delete"}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
