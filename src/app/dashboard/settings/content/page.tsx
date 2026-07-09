"use client";

import { useState, useEffect } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Package,
  FileText,
  AlertTriangle,
} from "lucide-react";
import {
  useGetPackagingGuidesQuery,
  useCreatePackagingGuideMutation,
  useUpdatePackagingGuideMutation,
  useDeletePackagingGuideMutation,
  useListPoliciesQuery,
  useGetPolicyQuery,
  useUpsertPolicyMutation,
  useDeletePolicyMutation,
} from "@/store/slice/apiSlice";

const CATEGORIES = ["GENERAL", "FRAGILE", "DANGEROUS_GOODS", "ELECTRONICS", "CLOTHING"];

type GuideForm = {
  id?: string;
  title: string;
  body: string;
  category: string;
  sortOrder: number;
  isDangerous: boolean;
};

const EMPTY_GUIDE: GuideForm = {
  title: "",
  body: "",
  category: "GENERAL",
  sortOrder: 0,
  isDangerous: false,
};

function PackagingGuidesTab() {
  const { data, isLoading } = useGetPackagingGuidesQuery();
  const [createGuide] = useCreatePackagingGuideMutation();
  const [updateGuide] = useUpdatePackagingGuideMutation();
  const [deleteGuide] = useDeletePackagingGuideMutation();

  const guides: any[] = (data as any)?.data?.guides ?? [];
  const [form, setForm] = useState<GuideForm | null>(null);

  const startEdit = (g?: any) =>
    setForm(
      g
        ? { id: g.id, title: g.title, body: g.body, category: g.category, sortOrder: g.sortOrder, isDangerous: g.isDangerous }
        : { ...EMPTY_GUIDE },
    );

  const save = async () => {
    if (!form) return;
    if (!form.title.trim() || !form.body.trim()) return;
    if (form.id) {
      await updateGuide({ id: form.id, ...form });
    } else {
      await createGuide(form);
    }
    setForm(null);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">
          Powers the public <code className="bg-gray-100 px-1.5 py-0.5 rounded">/packaging-guide</code> page. Items marked "Dangerous" show as prohibited items.
        </p>
        <button
          onClick={() => startEdit()}
          className="flex items-center gap-2 bg-brand text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-red-700 transition-colors cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" /> Add Guide
        </button>
      </div>

      {isLoading ? (
        <div className="text-sm text-gray-400 py-8 text-center">Loading…</div>
      ) : (
        <div className="border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
              <tr>
                <th className="text-left px-4 py-3">Title</th>
                <th className="text-left px-4 py-3">Category</th>
                <th className="text-left px-4 py-3">Order</th>
                <th className="text-left px-4 py-3">Flags</th>
                <th className="text-right px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {guides.map((g) => (
                <tr key={g.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">{g.title}</td>
                  <td className="px-4 py-3 text-gray-500">{g.category}</td>
                  <td className="px-4 py-3 text-gray-500">{g.sortOrder}</td>
                  <td className="px-4 py-3">
                    {g.isDangerous && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-red-50 text-red-600 text-xs font-medium">
                        <AlertTriangle className="w-3 h-3" /> Dangerous
                      </span>
                    )}
                    {!g.isActive && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-gray-100 text-gray-500 text-xs font-medium ml-1">
                        Inactive
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => startEdit(g)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 cursor-pointer">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Delete "${g.title}"?`)) deleteGuide({ id: g.id });
                        }}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {guides.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                    No packaging guides yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {form && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg">{form.id ? "Edit" : "Add"} Packaging Guide</h3>
              <button onClick={() => setForm(null)} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-500">Title</label>
                <input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm"
                  placeholder="e.g. Choose the Right Box"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500">
                  Body {form.category === "GENERAL" && !form.isDangerous ? "(one line per bullet point)" : ""}
                </label>
                <textarea
                  value={form.body}
                  onChange={(e) => setForm({ ...form, body: e.target.value })}
                  rows={5}
                  className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm"
                  placeholder={"- Use a sturdy box\n- Wrap fragile items in bubble wrap"}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-500">Category</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500">Sort Order</label>
                  <input
                    type="number"
                    value={form.sortOrder}
                    onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })}
                    className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-600">
                <input
                  type="checkbox"
                  checked={form.isDangerous}
                  onChange={(e) => setForm({ ...form, isDangerous: e.target.checked })}
                />
                Mark as dangerous / prohibited item
              </label>
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <button onClick={() => setForm(null)} className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 cursor-pointer">
                Cancel
              </button>
              <button onClick={save} className="px-4 py-2 rounded-lg text-sm font-semibold bg-brand text-white hover:bg-red-700 cursor-pointer">
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const POLICY_KEY_SUGGESTIONS = [
  "terms_of_service",
  "refund_policy",
  "pricing_policy",
  "liability",
  "privacy_policy",
  "weight_discrepancy_policy",
];

function PoliciesTab() {
  const { data, isLoading } = useListPoliciesQuery();
  const [upsertPolicy] = useUpsertPolicyMutation();
  const [deletePolicy] = useDeletePolicyMutation();
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [form, setForm] = useState<{ key: string; title: string; body: string } | null>(null);

  const policies: any[] = (data as any)?.data?.policies ?? [];
  const { data: fullPolicy } = useGetPolicyQuery({ key: editingKey! }, { skip: !editingKey });

  const startEdit = (key?: string) => {
    if (key) {
      setEditingKey(key);
      // form gets populated once fullPolicy loads (see effect-like pattern below)
      setForm({ key, title: "", body: "" });
    } else {
      setEditingKey(null);
      setForm({ key: "", title: "", body: "" });
    }
  };

  // Populate form once the full policy body arrives
  useEffect(() => {
    if (editingKey && fullPolicy) {
      const p = (fullPolicy as any)?.data?.policy;
      if (p) setForm({ key: p.key, title: p.title, body: p.body });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingKey, fullPolicy]);

  const save = async () => {
    if (!form || !form.key.trim() || !form.title.trim() || !form.body.trim()) return;
    await upsertPolicy(form);
    setForm(null);
    setEditingKey(null);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">
          Terms, refund policy, and other legal/policy text — fetched by key via <code className="bg-gray-100 px-1.5 py-0.5 rounded">GET /policies/:key</code>.
        </p>
        <button
          onClick={() => startEdit()}
          className="flex items-center gap-2 bg-brand text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-red-700 transition-colors cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" /> Add Policy
        </button>
      </div>

      {isLoading ? (
        <div className="text-sm text-gray-400 py-8 text-center">Loading…</div>
      ) : (
        <div className="border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
              <tr>
                <th className="text-left px-4 py-3">Key</th>
                <th className="text-left px-4 py-3">Title</th>
                <th className="text-left px-4 py-3">Updated</th>
                <th className="text-right px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {policies.map((p) => (
                <tr key={p.key} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs text-gray-600">{p.key}</td>
                  <td className="px-4 py-3 font-medium text-gray-800">{p.title}</td>
                  <td className="px-4 py-3 text-gray-500">{new Date(p.updatedAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => startEdit(p.key)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 cursor-pointer">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Deactivate "${p.title}"?`)) deletePolicy({ key: p.key });
                        }}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {policies.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-gray-400">
                    No policies yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {form && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg">{editingKey ? "Edit" : "Add"} Policy</h3>
              <button onClick={() => { setForm(null); setEditingKey(null); }} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-500">Key</label>
                <input
                  value={form.key}
                  disabled={!!editingKey}
                  onChange={(e) => setForm({ ...form, key: e.target.value })}
                  className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm disabled:bg-gray-50 disabled:text-gray-400"
                  placeholder="terms_of_service"
                  list="policy-key-suggestions"
                />
                <datalist id="policy-key-suggestions">
                  {POLICY_KEY_SUGGESTIONS.map((k) => <option key={k} value={k} />)}
                </datalist>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500">Title</label>
                <input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm"
                  placeholder="Terms of Service"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500">Body (Markdown or HTML)</label>
                <textarea
                  value={form.body}
                  onChange={(e) => setForm({ ...form, body: e.target.value })}
                  rows={8}
                  className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <button onClick={() => { setForm(null); setEditingKey(null); }} className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 cursor-pointer">
                Cancel
              </button>
              <button onClick={save} className="px-4 py-2 rounded-lg text-sm font-semibold bg-brand text-white hover:bg-red-700 cursor-pointer">
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ContentManagementPage() {
  const [tab, setTab] = useState<"guides" | "policies">("guides");

  return (
    <div className="pb-10">
      <div className="text-dashboard-heading mb-1">Content Management</div>
      <p className="text-sm text-gray-500 mb-6">
        Manage packaging guides and policy content shown on public pages.
      </p>

      <div className="flex gap-2 mb-6 border-b border-gray-200">
        <button
          onClick={() => setTab("guides")}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px cursor-pointer ${
            tab === "guides" ? "border-brand text-brand" : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          <Package className="w-4 h-4" /> Packaging Guides
        </button>
        <button
          onClick={() => setTab("policies")}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px cursor-pointer ${
            tab === "policies" ? "border-brand text-brand" : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          <FileText className="w-4 h-4" /> Policies
        </button>
      </div>

      {tab === "guides" ? <PackagingGuidesTab /> : <PoliciesTab />}
    </div>
  );
}
