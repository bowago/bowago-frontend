"use client";
import { useState } from "react";
import {
  useGetUsersQuery,
  useUpdateUserRoleMutation,
} from "@/store/slice/apiSlice";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { useRouter } from "next/navigation";
import {
  Search,
  Shield,
  UserCheck,
  UserX,
  ChevronDown,
  Users,
  Loader2,
  MoreVertical,
} from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog/dialog";
import { Button } from "@/components/ui/button";

const SUB_ROLES = [
  { value: "CUSTOMER", label: "Customer (no admin access)" },
  { value: "LOGISTICS_MANAGER", label: "Logistics Manager" },
  { value: "ROLE_ADMIN", label: "Custom Admin (ROLE_ADMIN)" },
  { value: "ROLE_AGENT", label: "CS Agent" },
  { value: "ROLE_MASTER", label: "Company Master" },
  { value: "ROLE_DISPATCHER", label: "Dispatcher" },
  { value: "ROLE_FINANCE", label: "Finance" },
  { value: "ROLE_USER", label: "Company User" },
];

const roleBadge: Record<string, string> = {
  ADMIN: "bg-red-100 text-red-700",
  CUSTOMER: "bg-blue-100 text-blue-700",
};

const subRoleBadge: Record<string, string> = {
  SUPER_ADMIN: "bg-purple-100 text-purple-700",
  LOGISTICS_MANAGER: "bg-orange-100 text-orange-700",
  ROLE_ADMIN: "bg-yellow-100 text-yellow-700",
  ROLE_AGENT: "bg-green-100 text-green-700",
  ROLE_MASTER: "bg-indigo-100 text-indigo-700",
  ROLE_DISPATCHER: "bg-cyan-100 text-cyan-700",
  ROLE_FINANCE: "bg-pink-100 text-pink-700",
};

type User = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  role: string;
  adminSubRole: string | null;
  isActive: boolean;
  isEmailVerified: boolean;
  createdAt: string;
};

export default function UsersPage() {
  const router = useRouter();
  const user = useSelector((s: RootState) => s.auth.user);
  const isSuperAdmin = user?.adminSubRole === "SUPER_ADMIN";

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newSubRole, setNewSubRole] = useState("");
  const [roleModalOpen, setRoleModalOpen] = useState(false);

  const { data, isLoading, isError, error, refetch } = useGetUsersQuery({
    search,
    role: roleFilter,
  });
  const [updateRole, { isLoading: updating }] = useUpdateUserRoleMutation();

  const users: User[] = data?.data?.users ?? data?.data ?? [];

  const openRoleModal = (u: User) => {
    setSelectedUser(u);
    setNewSubRole(u.adminSubRole ?? "CUSTOMER");
    setRoleModalOpen(true);
  };

  const handleRoleUpdate = async () => {
    if (!selectedUser) return;
    if (newSubRole === "CUSTOMER") {
      await updateRole({ userId: selectedUser.id, role: "CUSTOMER" });
    } else {
      await updateRole({ userId: selectedUser.id, adminSubRole: newSubRole });
    }
    setRoleModalOpen(false);
    refetch();
  };

  return (
    <div className="pb-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="text-dashboard-heading">User Management</div>
          <p className="text-sm text-gray-500 mt-1">
            Manage user accounts, roles, and permissions
          </p>
        </div>
        {isSuperAdmin && (
          <button
            onClick={() => router.push("/dashboard/users/roles")}
            className="flex items-center gap-2 bg-brand text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-red-700 transition-colors"
          >
            <Shield className="w-4 h-4" /> Manage Custom Roles
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/30"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30"
        >
          <option value="">All Roles</option>
          <option value="ADMIN">Admin</option>
          <option value="CUSTOMER">Customer</option>
        </select>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-brand" />
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-2">
          <UserX className="w-12 h-12 mb-2 opacity-30" />
          <p className="font-medium text-gray-600">
            {(error as any)?.status === 403
              ? "Access denied — admin permission required to view users"
              : "Failed to load users. Please try again."}
          </p>
          <button
            onClick={() => refetch()}
            className="text-sm text-brand hover:underline mt-1"
          >
            Retry
          </button>
        </div>
      ) : users.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <Users className="w-12 h-12 mb-3 opacity-30" />
          <p>No users found</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    User
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Role
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Sub Role
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Status
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Joined
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {users.map((u) => (
                  <tr
                    key={u.id}
                    className="hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-gray-900">
                          {u.firstName} {u.lastName}
                        </p>
                        <p className="text-xs text-gray-400">{u.email}</p>
                        {u.phone && (
                          <p className="text-xs text-gray-400">{u.phone}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-medium ${roleBadge[u.role] ?? "bg-gray-100 text-gray-600"}`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {u.adminSubRole ? (
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-medium ${subRoleBadge[u.adminSubRole] ?? "bg-gray-100 text-gray-600"}`}
                        >
                          {u.adminSubRole.replace(/_/g, " ")}
                        </span>
                      ) : (
                        <span className="text-gray-300 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <div
                          className={`w-2 h-2 rounded-full ${u.isActive ? "bg-green-500" : "bg-gray-300"}`}
                        />
                        <span
                          className={`text-xs font-medium ${u.isActive ? "text-green-600" : "text-gray-400"}`}
                        >
                          {u.isActive ? "Active" : "Inactive"}
                        </span>
                      </div>
                      {u.isEmailVerified && (
                        <p className="text-[10px] text-blue-500 mt-0.5">
                          Email verified
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {isSuperAdmin &&
                          u.adminSubRole !== "SUPER_ADMIN" &&
                          u.id !== user?.id && (
                            <button
                              onClick={() => openRoleModal(u)}
                              className="text-xs text-brand border border-brand/30 px-2.5 py-1 rounded-lg hover:bg-brand/5 transition-colors"
                            >
                              Set Role
                            </button>
                          )}
                        <button
                          onClick={() =>
                            router.push(`/dashboard/users/${u.id}`)
                          }
                          className="text-xs text-gray-500 border border-gray-200 px-2.5 py-1 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          View
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Role assignment modal */}
      <Dialog open={roleModalOpen} onOpenChange={setRoleModalOpen}>
        <DialogContent size="xl">
          <div className="p-6 space-y-5">
            {/* Header */}
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-brand/10 flex items-center justify-center">
                <Shield className="w-5 h-5 text-brand" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-gray-900">
                  Assign Admin Sub-Role
                </h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  Update permissions for{" "}
                  <span className="font-medium text-gray-800">
                    {selectedUser?.firstName} {selectedUser?.lastName}
                  </span>
                </p>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-gray-100" />

            {/* User info pill */}
            <div className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3">
              <div className="w-8 h-8 rounded-full bg-brand/15 flex items-center justify-center text-brand font-semibold text-sm">
                {selectedUser?.firstName?.[0]}
                {selectedUser?.lastName?.[0]}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {selectedUser?.firstName} {selectedUser?.lastName}
                </p>
                <p className="text-xs text-gray-400">{selectedUser?.email}</p>
              </div>
              {selectedUser?.adminSubRole && (
                <span
                  className={`ml-auto px-2.5 py-1 rounded-full text-xs font-medium ${subRoleBadge[selectedUser.adminSubRole] ?? "bg-gray-100 text-gray-600"}`}
                >
                  {selectedUser.adminSubRole.replace(/_/g, " ")}
                </span>
              )}
            </div>

            {/* Select */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">
                New Sub-Role
              </label>
              <div className="relative">
                <select
                  value={newSubRole}
                  onChange={(e) => setNewSubRole(e.target.value)}
                  className="w-full appearance-none border border-gray-200 rounded-xl px-4 py-2.5 pr-10 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand/40 transition-colors"
                >
                  {SUB_ROLES.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
              <p className="text-xs text-gray-400">
                This controls what admin actions the user can perform.
              </p>
            </div>

            {/* Actions */}
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
                isLoading={updating}
                onClick={handleRoleUpdate}
              >
                Assign Role
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
