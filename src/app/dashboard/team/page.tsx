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
import { SelectInput } from "@/components/ui/input";
import {
  UserPlus,
  Mail,
  RotateCcw,
  X,
  Clock,
  CheckCircle,
  AlertCircle,
  ChevronDown,
} from "lucide-react";
import { format } from "date-fns";

const ROLE_OPTIONS = [
  { value: "ROLE_DISPATCHER", label: "Dispatcher — Create & manage shipments" },
  { value: "ROLE_FINANCE", label: "Finance — View invoices & payments" },
  { value: "ROLE_USER", label: "Viewer — Read-only access" },
  { value: "ROLE_MASTER", label: "Master — Manage team" },
  { value: "ROLE_ADMIN", label: "Admin — Full company access" },
];

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  PENDING:   { label: "Pending",   className: "bg-yellow-100 text-yellow-700" },
  ACCEPTED:  { label: "Accepted",  className: "bg-green-100 text-green-700" },
  EXPIRED:   { label: "Expired",   className: "bg-gray-100 text-gray-500" },
  CANCELLED: { label: "Cancelled", className: "bg-red-100 text-red-500" },
};

export default function TeamManagementPage() {
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState("");
  const [inviteForm, setInviteForm] = useState({ email: "", role: "ROLE_DISPATCHER" });
  const [formError, setFormError] = useState<string | null>(null);

  const { data, isLoading, refetch } = useGetOrgInvitesQuery(
    filterStatus ? { status: filterStatus } : undefined
  );
  const [inviteMember, { isLoading: isSending }] = useInviteMemberMutation();
  const [cancelInvite, { isLoading: isCancelling }] = useCancelOrgInviteMutation();
  const [resendInvite, { isLoading: isResending }] = useResendOrgInviteMutation();

  const invites: any[] = data?.data?.invites ?? [];

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteForm.email.trim()) { setFormError("Email is required"); return; }
    if (!inviteForm.role) { setFormError("Select a role"); return; }
    setFormError(null);

    try {
      await inviteMember(inviteForm).unwrap();
      setInviteForm({ email: "", role: "ROLE_DISPATCHER" });
      setShowInviteForm(false);
      refetch();
    } catch (err: any) {
      setFormError(err?.data?.message || "Failed to send invite");
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Team Management</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Invite team members and manage their access roles.
          </p>
        </div>
        <Button onClick={() => setShowInviteForm((v) => !v)} className="flex items-center gap-2">
          <UserPlus className="w-4 h-4" />
          Invite Member
        </Button>
      </div>

      {/* Invite Form */}
      {showInviteForm && (
        <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-6 shadow-sm">
          <h2 className="font-semibold text-gray-900 mb-4">Send an Invite</h2>
          <form onSubmit={handleInvite} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Email address"
                type="email"
                value={inviteForm.email}
                onChange={(e) => { setInviteForm((p) => ({ ...p, email: e.target.value })); setFormError(null); }}
                placeholder="teammate@company.ng"
                required
              />
              <SelectInput
                label="Role"
                value={inviteForm.role}
                onValueChange={(val) => setInviteForm((p) => ({ ...p, role: val }))}
                options={ROLE_OPTIONS}
              />
            </div>

            {formError && (
              <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
                <AlertCircle className="w-4 h-4" />
                {formError}
              </div>
            )}

            <div className="flex gap-3 justify-end">
              <Button
                type="button"
                variant="secondary"
                onClick={() => { setShowInviteForm(false); setFormError(null); }}
              >
                Cancel
              </Button>
              <Button type="submit" isLoading={isSending} className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Send Invite
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Filter */}
      <div className="flex items-center gap-3 mb-4">
        <span className="text-sm text-gray-500 font-medium">Filter:</span>
        {["", "PENDING", "ACCEPTED", "EXPIRED", "CANCELLED"].map((s) => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              filterStatus === s
                ? "bg-[#1F3A70] text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {s || "All"}
          </button>
        ))}
      </div>

      {/* Invites Table */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="p-8 text-center text-gray-400 text-sm">Loading invites...</div>
        ) : invites.length === 0 ? (
          <div className="p-12 text-center">
            <UserPlus className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No invites yet</p>
            <p className="text-gray-400 text-sm mt-1">Invite your first team member above.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Email</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Role</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Status</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Expires</th>
                <th className="text-right px-5 py-3 font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {invites.map((invite: any) => {
                const badge = STATUS_BADGE[invite.status] ?? STATUS_BADGE.PENDING;
                return (
                  <tr key={invite.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-3.5 font-medium text-gray-800">{invite.email}</td>
                    <td className="px-5 py-3.5 text-gray-600">
                      {invite.role.replace("ROLE_", "")}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.className}`}>
                        {badge.label}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-gray-500 text-xs">
                      {invite.expiresAt
                        ? format(new Date(invite.expiresAt), "dd MMM yyyy")
                        : "—"}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-2">
                        {/* Resend — for PENDING or EXPIRED */}
                        {["PENDING", "EXPIRED"].includes(invite.status) && (
                          <button
                            onClick={() => resendInvite({ id: invite.id }).then(() => refetch())}
                            disabled={isResending}
                            className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 px-2 py-1 rounded hover:bg-blue-50 transition-colors"
                            title="Resend invite"
                          >
                            <RotateCcw className="w-3 h-3" />
                            Resend
                          </button>
                        )}
                        {/* Cancel — for PENDING */}
                        {invite.status === "PENDING" && (
                          <button
                            onClick={() => {
                              if (confirm(`Cancel invite for ${invite.email}?`)) {
                                cancelInvite({ id: invite.id }).then(() => refetch());
                              }
                            }}
                            disabled={isCancelling}
                            className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 px-2 py-1 rounded hover:bg-red-50 transition-colors"
                            title="Cancel invite"
                          >
                            <X className="w-3 h-3" />
                            Cancel
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
