"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import {
  useGetUserByIdQuery,
  useToggleUserActiveMutation,
  useUpdateUserRoleMutation,
  useDeleteUserMutation,
} from "@/store/slice/apiSlice";
import {
  ArrowLeft,
  Shield,
  Mail,
  Phone,
  MapPin,
  Package,
  Calendar,
  CheckCircle,
  XCircle,
  Loader2,
  Trash2,
  UserCheck,
  UserX,
  ChevronDown,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog/dialog";

// Base roles available to all admins. This page (and its updateRole
// mutation → setAdminRole) is Internal BowaGo Administration only — it can
// never assign an Enterprise role. Enterprise team roles are managed via
// /dashboard/team instead.
const SUB_ROLES = [
  { value: "CUSTOMER", label: "Customer (no admin access)" },
  { value: "LOGISTICS_MANAGER", label: "Logistics Manager" },
  { value: "ROLE_ADMIN", label: "Custom Admin" },
];

// Only Super Admins can assign or see the SUPER_ADMIN role
const SUPER_ADMIN_ROLE = { value: "SUPER_ADMIN", label: "Super Admin (full access)" };

const subRoleBadge: Record<string, string> = {
  SUPER_ADMIN: "bg-purple-100 text-purple-700",
  LOGISTICS_MANAGER: "bg-orange-100 text-orange-700",
  ROLE_ADMIN: "bg-yellow-100 text-yellow-700",
};

const shipmentStatusColor: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-700",
  PROCESSING: "bg-blue-100 text-blue-700",
  IN_TRANSIT: "bg-indigo-100 text-indigo-700",
  DELIVERED: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-700",
};

const paymentStatusColor: Record<string, string> = {
  PAID: "bg-green-100 text-green-700",
  PENDING: "bg-yellow-100 text-yellow-700",
  FAILED: "bg-red-100 text-red-700",
};

export default function UserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const me = useSelector((s: RootState) => s.auth.user);
  const isSuperAdmin = me?.adminSubRole === "SUPER_ADMIN";

  const { data, isLoading, isError, error, refetch } = useGetUserByIdQuery({ id });
  const [toggleStatus, { isLoading: toggling }] = useToggleUserActiveMutation();
  const [updateRole, { isLoading: updatingRole }] = useUpdateUserRoleMutation();
  const [deleteUser, { isLoading: deleting }] = useDeleteUserMutation();

  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [newSubRole, setNewSubRole] = useState("");

  const user = data?.data?.user;
  const shipments: any[] = data?.data?.shipments ?? [];

  const openRoleModal = () => {
    setNewSubRole(user?.adminSubRole ?? "CUSTOMER");
    setRoleModalOpen(true);
  };

  const handleToggleStatus = async () => {
    await toggleStatus({ userId: id, isActive: !user?.isActive });
    refetch();
  };

  const handleRoleUpdate = async () => {
    if (newSubRole === "CUSTOMER") {
      await updateRole({ userId: id, role: "CUSTOMER" });
    } else {
      await updateRole({ userId: id, adminSubRole: newSubRole });
    }
    setRoleModalOpen(false);
    refetch();
  };

  const handleDelete = async () => {
    await deleteUser({ id });
    router.push("/dashboard/users");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-brand" />
      </div>
    );
  }

  if (isError || !user) {
    const status = (error as any)?.status;
    const backendMessage = (error as any)?.data?.message as string | undefined;
    const isForbidden = status === 403;
    const isNotFound = status === 404;

    let heading = "User not found or could not be loaded";
    let detail =
      "The user may have been deleted or the link is invalid.";

    if (isForbidden) {
      heading = "Access denied — admin permission required";
      detail = "You may not have the required role to view this user's profile.";
    } else if (isNotFound) {
      heading = "User not found";
      detail = backendMessage ?? "This user does not exist or was removed.";
    } else if (isError) {
      // Anything else (500, network error, etc.) — surface the real message
      // instead of a generic "not found" so it's clear something else broke.
      heading = "Something went wrong loading this user";
      detail =
        backendMessage ?? `Unexpected error${status ? ` (status ${status})` : ""}. Please try again.`;
    }

    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3 text-gray-400">
        <XCircle className="w-10 h-10 opacity-30" />
        <p className="font-medium text-gray-600">{heading}</p>
        <p className="text-xs text-gray-400 max-w-sm text-center">{detail}</p>
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="text-sm text-brand hover:underline"
          >
            Go back
          </button>
          {!isForbidden && !isNotFound && (
            <button
              onClick={() => refetch()}
              className="text-sm text-brand hover:underline"
            >
              Retry
            </button>
          )}
        </div>

        {/* ── Debug panel (Super Admin only) ──
            Shows the raw RTK Query state so we can see exactly what the API
            returned. Remove once the root cause is confirmed. */}
        {isSuperAdmin && (
          <div className="w-full max-w-2xl mt-6 text-left">
            <p className="text-xs font-semibold text-gray-500 mb-2">
              🔧 Debug info (visible to Super Admin only)
            </p>
            <div className="grid grid-cols-1 gap-3 text-xs">
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                <p className="font-mono text-gray-400 mb-1">
                  requested id (from useParams):
                </p>
                <pre className="text-gray-700 break-all">{String(id)}</pre>
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                <p className="font-mono text-gray-400 mb-1">
                  isLoading={String(isLoading)} · isError={String(isError)} · status={String(status)}
                </p>
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                <p className="font-mono text-gray-400 mb-1">data (RTK Query result):</p>
                <pre className="text-gray-700 overflow-x-auto max-h-64">
                  {JSON.stringify(data, null, 2) ?? "undefined"}
                </pre>
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                <p className="font-mono text-gray-400 mb-1">error (RTK Query result):</p>
                <pre className="text-gray-700 overflow-x-auto max-h-64">
                  {JSON.stringify(error, null, 2) ?? "undefined"}
                </pre>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  const initials =
    `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`.toUpperCase();

  return (
    <div className="pb-12 max-w-5xl">
      {/* Back + title */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-gray-600" />
        </button>
        <div>
          <div className="text-dashboard-heading">User Profile</div>
          <p className="text-sm text-gray-400 mt-0.5">
            {user.firstName} {user.lastName}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* ── Left column: profile card ── */}
        <div className="lg:col-span-1 space-y-4">
          {/* Profile card */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            {/* Avatar */}
            <div className="flex flex-col items-center text-center mb-5">
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={`${user.firstName} ${user.lastName}`}
                  className="w-20 h-20 rounded-full object-cover border-2 border-gray-100 mb-3"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-brand/10 flex items-center justify-center text-brand text-2xl font-bold mb-3">
                  {initials}
                </div>
              )}
              <h2 className="text-lg font-semibold text-gray-900">
                {user.firstName} {user.lastName}
              </h2>
              <p className="text-sm text-gray-400">{user.email}</p>

              {/* Badges */}
              <div className="flex flex-wrap gap-1.5 justify-center mt-3">
                <span
                  className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                    user.role === "ADMIN"
                      ? "bg-red-100 text-red-700"
                      : "bg-blue-100 text-blue-700"
                  }`}
                >
                  {user.role}
                </span>
                {user.adminSubRole && (
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                      subRoleBadge[user.adminSubRole] ??
                      "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {user.adminSubRole.replace(/_/g, " ")}
                  </span>
                )}
              </div>
            </div>

            {/* Info rows */}
            <div className="space-y-3 border-t border-gray-50 pt-4">
              {user.phone && (
                <div className="flex items-center gap-2.5 text-sm">
                  <Phone className="w-4 h-4 text-gray-300 flex-shrink-0" />
                  <span className="text-gray-600">{user.phone}</span>
                </div>
              )}
              <div className="flex items-center gap-2.5 text-sm">
                <Mail className="w-4 h-4 text-gray-300 flex-shrink-0" />
                <span className="text-gray-600">{user.email}</span>
              </div>
              <div className="flex items-center gap-2.5 text-sm">
                <Calendar className="w-4 h-4 text-gray-300 flex-shrink-0" />
                <span className="text-gray-500">
                  Joined{" "}
                  {new Date(user.createdAt).toLocaleDateString("en-NG", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              </div>
              <div className="flex items-center gap-2.5 text-sm">
                <Package className="w-4 h-4 text-gray-300 flex-shrink-0" />
                <span className="text-gray-500">
                  {user._count?.shipments ?? shipments.length} shipment
                  {(user._count?.shipments ?? shipments.length) !== 1
                    ? "s"
                    : ""}
                </span>
              </div>
            </div>

            {/* Verification pills */}
            <div className="flex gap-2 mt-4 pt-4 border-t border-gray-50">
              <div
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium ${
                  user.isEmailVerified
                    ? "bg-green-50 text-green-600"
                    : "bg-gray-50 text-gray-400"
                }`}
              >
                {user.isEmailVerified ? (
                  <CheckCircle className="w-3.5 h-3.5" />
                ) : (
                  <XCircle className="w-3.5 h-3.5" />
                )}
                Email
              </div>
              <div
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium ${
                  user.isActive
                    ? "bg-green-50 text-green-600"
                    : "bg-red-50 text-red-500"
                }`}
              >
                {user.isActive ? (
                  <CheckCircle className="w-3.5 h-3.5" />
                ) : (
                  <XCircle className="w-3.5 h-3.5" />
                )}
                {user.isActive ? "Active" : "Suspended"}
              </div>
            </div>
          </div>

          {/* Actions card */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-2.5">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
              Actions
            </p>

            {/* Toggle status */}
            <button
              onClick={handleToggleStatus}
              disabled={toggling}
              className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                user.isActive
                  ? "text-red-600 hover:bg-red-50 border border-red-100"
                  : "text-green-600 hover:bg-green-50 border border-green-100"
              }`}
            >
              {toggling ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : user.isActive ? (
                <UserX className="w-4 h-4" />
              ) : (
                <UserCheck className="w-4 h-4" />
              )}
              {user.isActive ? "Suspend account" : "Activate account"}
            </button>

            {/* Set role (super admin only, non-super-admin targets, not self, not Enterprise) */}
            {isSuperAdmin &&
              user.role !== "ENTERPRISE" &&
              user.adminSubRole !== "SUPER_ADMIN" &&
              user.id !== me?.id && (
                <button
                  onClick={openRoleModal}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm font-medium text-brand hover:bg-brand/5 border border-brand/20 transition-colors"
                >
                  <Shield className="w-4 h-4" />
                  Change role
                </button>
              )}

            {/* Delete (super admin only) */}
            {isSuperAdmin && user.adminSubRole !== "SUPER_ADMIN" && (
              <button
                onClick={() => setDeleteModalOpen(true)}
                className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 border border-red-100 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Delete user
              </button>
            )}
          </div>

          {/* Saved addresses */}
          {user.addresses?.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                Saved Addresses
              </p>
              <div className="space-y-2.5">
                {user.addresses.map((addr: any) => (
                  <div key={addr.id} className="flex items-start gap-2.5">
                    <MapPin className="w-4 h-4 text-gray-300 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-gray-700 font-medium">
                        {addr.label ?? "Address"}
                        {addr.isDefault && (
                          <span className="ml-1.5 text-[10px] bg-brand/10 text-brand px-1.5 py-0.5 rounded-full">
                            Default
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-gray-400">
                        {[addr.street, addr.city, addr.state]
                          .filter(Boolean)
                          .join(", ")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Right column: shipment history ── */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
            <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900">
                Recent Shipments
              </h3>
              <span className="text-xs text-gray-400">Last 10</span>
            </div>

            {shipments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-300">
                <Package className="w-10 h-10 mb-2 opacity-40" />
                <p className="text-sm">No shipments yet</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {shipments.map((s) => (
                  <div
                    key={s.id}
                    className="px-5 py-3.5 flex items-center justify-between hover:bg-gray-50/50 transition-colors cursor-pointer"
                    onClick={() => router.push(`/dashboard/shipments/${s.id}`)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Package className="w-4 h-4 text-gray-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-800">
                          {s.trackingNumber}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {s.senderCity} → {s.recipientCity}
                        </p>
                        <p className="text-xs text-gray-300 mt-0.5">
                          {new Date(s.createdAt).toLocaleDateString("en-NG", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${
                          shipmentStatusColor[s.status] ??
                          "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {s.status}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${
                          paymentStatusColor[s.paymentStatus] ??
                          "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {s.paymentStatus}
                      </span>
                      {s.quotedPrice != null && (
                        <span className="text-xs font-semibold text-gray-700">
                          ₦{Number(s.quotedPrice).toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Role modal ── */}
      <Dialog open={roleModalOpen} onOpenChange={setRoleModalOpen}>
        <DialogContent size="xl">
          <div className="p-6 space-y-5">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-brand/10 flex items-center justify-center flex-shrink-0">
                <Shield className="w-5 h-5 text-brand" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-gray-900">
                  Change Sub-Role
                </h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  Update permissions for{" "}
                  <span className="font-medium text-gray-800">
                    {user.firstName} {user.lastName}
                  </span>
                </p>
              </div>
            </div>

            <div className="border-t border-gray-100" />

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">
                New Sub-Role
              </label>
              <div className="relative">
                <select
                  value={newSubRole}
                  onChange={(e) => setNewSubRole(e.target.value)}
                  className="w-full appearance-none border border-gray-200 rounded-xl px-4 py-2.5 pr-10 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand/40"
                >
                  {isSuperAdmin && (
                    <option key="SUPER_ADMIN" value="SUPER_ADMIN">
                      {SUPER_ADMIN_ROLE.label}
                    </option>
                  )}
                  {SUB_ROLES.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            <div className="flex gap-3 pt-1">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => setRoleModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                isLoading={updatingRole}
                onClick={handleRoleUpdate}
              >
                Assign Role
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Delete confirmation modal ── */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent size="xl">
          <div className="p-6 space-y-5">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-gray-900">
                  Delete User
                </h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  This action is permanent and cannot be undone.
                </p>
              </div>
            </div>

            <div className="border-t border-gray-100" />

            <div className="bg-red-50 rounded-xl p-4 text-sm text-red-700">
              You are about to permanently delete{" "}
              <span className="font-semibold">
                {user.firstName} {user.lastName}
              </span>{" "}
              ({user.email}). All their data, shipments, and history will be
              removed.
            </div>

            <div className="flex gap-3 pt-1">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => setDeleteModalOpen(false)}
              >
                Cancel
              </Button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-60"
              >
                {deleting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                Delete permanently
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
