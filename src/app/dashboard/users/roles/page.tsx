"use client";

import { useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import {
  useGetCapabilitiesQuery,
  useGetAdminRolesQuery,
  useGetUsersQuery,
  useAssignCustomRoleMutation,
  useUpdateCustomRoleMutation,
  useRevokeCustomRoleMutation,
} from "@/store/slice/apiSlice";
import { Dialog, DialogContent } from "@/components/ui/dialog/dialog";
import { Button } from "@/components/ui/button";
import {
  Shield,
  ShieldCheck,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  AlertTriangle,
  Search,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────────────

type Capability = { key: string; label: string; description: string };

type AdminRolePerm = {
  id: string;
  userId: string;
  roleLabel: string | null;
  notes: string | null;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    adminSubRole: string | null;
    isActive: boolean;
  };
  creator: { id: string; firstName: string; lastName: string } | null;
  [key: string]: any; // canManage*, canView*, canBulkNotify flags
};

type StaffUser = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  adminSubRole: string | null;
};

// ─── Page ───────────────────────────────────────────────────────────────────

export default function CustomCapabilitiesPage() {
  const me = useSelector((state: RootState) => state.auth.user);
  const isSuperAdmin = (me as any)?.adminSubRole === "SUPER_ADMIN";

  const { data: capData, isLoading: capsLoading } = useGetCapabilitiesQuery(
    undefined,
    { skip: !isSuperAdmin },
  );
  const { data: rolesData, isLoading: rolesLoading, refetch } =
    useGetAdminRolesQuery({ limit: 50 }, { skip: !isSuperAdmin });

  const [revokeRole, { isLoading: revoking }] = useRevokeCustomRoleMutation();

  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [editingPerm, setEditingPerm] = useState<AdminRolePerm | null>(null);
  const [revokeTarget, setRevokeTarget] = useState<AdminRolePerm | null>(null);

  const capabilities: Capability[] = capData?.data?.capabilities ?? [];
  const perms: AdminRolePerm[] = rolesData?.data?.perms ?? [];

  if (!isSuperAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3 text-gray-400">
        <AlertTriangle className="w-10 h-10 opacity-30" />
        <p className="font-medium text-gray-600">Super Admin only</p>
        <p className="text-xs text-gray-400 max-w-sm text-center">
          Only Super Admins can create or modify custom admin capabilities
          for ROLE_ADMIN staff members.
        </p>
      </div>
    );
  }

  const onRevoke = async () => {
    if (!revokeTarget) return;
    await revokeRole({ userId: revokeTarget.userId }).unwrap();
    setRevokeTarget(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="dashboard-heading">Custom Admin Capabilities</h1>
          <p className="text-sm text-gray-400 mt-1">
            Assign granular permissions to ROLE_ADMIN staff. Only Super Admins
            can create or modify these.
          </p>
        </div>
        <Button
          onClick={() => setAssignModalOpen(true)}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Assign Custom Role
        </Button>
      </div>

      {/* List of custom-capability staff */}
      {rolesLoading || capsLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-brand" />
        </div>
      ) : perms.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400 bg-white rounded-2xl border border-gray-100">
          <Shield className="w-12 h-12 mb-3 opacity-30" />
          <p>No custom roles assigned yet</p>
          <button
            onClick={() => setAssignModalOpen(true)}
            className="text-sm text-brand hover:underline mt-2"
          >
            Assign your first custom role
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm divide-y divide-gray-100">
          {perms.map((perm) => {
            const enabledCaps = capabilities.filter((c) => perm[c.key]);
            return (
              <div key={perm.id} className="p-4">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-full bg-brand/10 flex items-center justify-center text-brand font-semibold text-sm flex-shrink-0">
                      {perm.user.firstName?.[0]}
                      {perm.user.lastName?.[0]}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {perm.user.firstName} {perm.user.lastName}
                        {perm.roleLabel && (
                          <span className="ml-2 text-xs font-medium text-brand bg-brand/10 px-2 py-0.5 rounded-full">
                            {perm.roleLabel}
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-gray-400">{perm.user.email}</p>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {enabledCaps.length === 0 ? (
                          <span className="text-xs text-gray-400 italic">
                            No capabilities enabled
                          </span>
                        ) : (
                          enabledCaps.map((c) => (
                            <span
                              key={c.key}
                              className="text-[11px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full"
                              title={c.description}
                            >
                              {c.label}
                            </span>
                          ))
                        )}
                      </div>
                      {perm.notes && (
                        <p className="text-xs text-gray-400 mt-1.5 italic">
                          "{perm.notes}"
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => setEditingPerm(perm)}
                      className="flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-md text-sm transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      Edit
                    </button>
                    <button
                      onClick={() => setRevokeTarget(perm)}
                      className="flex items-center gap-1.5 bg-red-50 hover:bg-red-100 text-red-600 px-3 py-1.5 rounded-md text-sm transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Revoke
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Assign new custom role */}
      <CapabilityFormModal
        open={assignModalOpen}
        onClose={() => setAssignModalOpen(false)}
        capabilities={capabilities}
        mode="create"
        onDone={() => {
          setAssignModalOpen(false);
          refetch();
        }}
      />

      {/* Edit existing custom role */}
      <CapabilityFormModal
        open={!!editingPerm}
        onClose={() => setEditingPerm(null)}
        capabilities={capabilities}
        mode="edit"
        existing={editingPerm}
        onDone={() => {
          setEditingPerm(null);
          refetch();
        }}
      />

      {/* Revoke confirmation */}
      <Dialog open={!!revokeTarget} onOpenChange={() => setRevokeTarget(null)}>
        <DialogContent>
          <div className="text-center p-6 space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto">
              <Trash2 className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Revoke Custom Role
              </h2>
              <p className="text-gray-500 mt-1 text-sm">
                This removes all custom capabilities for{" "}
                <strong>
                  {revokeTarget?.user.firstName} {revokeTarget?.user.lastName}
                </strong>{" "}
                and reverts their sub-role to{" "}
                <strong>LOGISTICS_MANAGER</strong>.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setRevokeTarget(null)}
                className="flex-1 px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <Button
                onClick={onRevoke}
                isLoading={revoking}
                className="flex-1 bg-red-600 hover:bg-red-700"
              >
                Revoke
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Create/Edit Modal ─────────────────────────────────────────────────────────

function CapabilityFormModal({
  open,
  onClose,
  capabilities,
  mode,
  existing,
  onDone,
}: {
  open: boolean;
  onClose: () => void;
  capabilities: Capability[];
  mode: "create" | "edit";
  existing?: AdminRolePerm | null;
  onDone: () => void;
}) {
  const [search, setSearch] = useState("");
  const { data: usersData, isLoading: usersLoading } = useGetUsersQuery(
    { search, role: "ADMIN" },
    { skip: mode !== "create" || !open },
  );

  const [assign, { isLoading: assigning }] = useAssignCustomRoleMutation();
  const [update, { isLoading: updating }] = useUpdateCustomRoleMutation();

  const [selectedUserId, setSelectedUserId] = useState("");
  const [roleLabel, setRoleLabel] = useState("");
  const [notes, setNotes] = useState("");
  const [caps, setCaps] = useState<Record<string, boolean>>({});

  // Reset/prefill form when modal opens
  const resetForm = (perm?: AdminRolePerm | null) => {
    setSelectedUserId(perm?.userId ?? "");
    setRoleLabel(perm?.roleLabel ?? "");
    setNotes(perm?.notes ?? "");
    const initial: Record<string, boolean> = {};
    capabilities.forEach((c) => {
      initial[c.key] = perm ? !!perm[c.key] : false;
    });
    setCaps(initial);
    setSearch("");
  };

  // Only reset when the modal transitions to open, or the edit target changes
  const [lastOpenKey, setLastOpenKey] = useState<string | null>(null);
  const openKey = `${open}-${existing?.id ?? "new"}`;
  if (open && openKey !== lastOpenKey) {
    resetForm(mode === "edit" ? existing : null);
    setLastOpenKey(openKey);
  }
  if (!open && lastOpenKey !== null) {
    setLastOpenKey(null);
  }

  const toggleCap = (key: string) => {
    setCaps((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSubmit = async () => {
    if (mode === "create") {
      if (!selectedUserId) return;
      await assign({
        userId: selectedUserId,
        roleLabel: roleLabel || undefined,
        notes: notes || undefined,
        ...caps,
      }).unwrap();
    } else if (existing) {
      await update({
        userId: existing.userId,
        roleLabel,
        notes,
        ...caps,
      }).unwrap();
    }
    onDone();
  };

  const users: StaffUser[] = usersData?.data?.users ?? usersData?.data ?? [];
  // In edit mode, only ROLE_ADMIN/non-SUPER_ADMIN — handled server-side too
  const selectableUsers = users.filter((u) => u.adminSubRole !== "SUPER_ADMIN");

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent size="lg">
        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-brand/10 flex items-center justify-center flex-shrink-0">
              <ShieldCheck className="w-5 h-5 text-brand" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">
                {mode === "create"
                  ? "Assign Custom Capabilities"
                  : `Edit Capabilities — ${existing?.user.firstName} ${existing?.user.lastName}`}
              </h2>
              <p className="text-sm text-gray-500 mt-0.5">
                {mode === "create"
                  ? "Select a staff member, then toggle the capabilities they should have. This sets their sub-role to ROLE_ADMIN."
                  : "Update the capabilities for this ROLE_ADMIN staff member."}
              </p>
            </div>
          </div>

          {/* User picker — create mode only */}
          {mode === "create" && (
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">
                Staff Member
              </label>
              <div className="relative mb-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search admin staff by name or email..."
                  className="w-full border border-gray-200 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand/40"
                />
              </div>
              <div className="border border-gray-200 rounded-xl max-h-48 overflow-y-auto">
                {usersLoading ? (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 className="w-5 h-5 animate-spin text-brand" />
                  </div>
                ) : selectableUsers.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-6">
                    No admin staff found
                  </p>
                ) : (
                  selectableUsers.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => setSelectedUserId(u.id)}
                      className={`w-full flex items-center justify-between px-4 py-2.5 text-left text-sm transition-colors ${
                        selectedUserId === u.id
                          ? "bg-brand/5 text-brand"
                          : "hover:bg-gray-50 text-gray-700"
                      }`}
                    >
                      <span>
                        {u.firstName} {u.lastName}{" "}
                        <span className="text-gray-400">({u.email})</span>
                      </span>
                      {u.adminSubRole && (
                        <span className="text-xs text-gray-400">
                          {u.adminSubRole.replace(/_/g, " ")}
                        </span>
                      )}
                    </button>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Role label + notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">
                Role Label
              </label>
              <input
                value={roleLabel}
                onChange={(e) => setRoleLabel(e.target.value)}
                placeholder="e.g. Rate Manager, CS Lead"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand/40"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">
                Notes (optional)
              </label>
              <input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Internal note about this assignment"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand/40"
              />
            </div>
          </div>

          {/* Capability toggles */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">
              Capabilities
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {capabilities.map((cap) => (
                <button
                  key={cap.key}
                  type="button"
                  onClick={() => toggleCap(cap.key)}
                  className={`flex items-start gap-3 p-3 rounded-xl border text-left transition-colors ${
                    caps[cap.key]
                      ? "border-brand bg-brand/5"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <span
                    className={`mt-0.5 w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                      caps[cap.key]
                        ? "border-brand bg-brand"
                        : "border-gray-300"
                    }`}
                  >
                    {caps[cap.key] && (
                      <svg viewBox="0 0 24 24" className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-gray-800">{cap.label}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{cap.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <Button
              onClick={handleSubmit}
              isLoading={assigning || updating}
              disabled={mode === "create" && !selectedUserId}
              className="flex-1"
            >
              {mode === "create" ? "Assign Role" : "Save Changes"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
