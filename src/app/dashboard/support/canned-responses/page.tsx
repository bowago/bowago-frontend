"use client";

import { useState } from "react";
import {
  Plus,
  Search,
  Copy,
  Check,
  Pencil,
  Trash2,
  X,
  Loader2,
  MessageSquare,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────
interface CannedResponse {
  id: string;
  title: string;
  body: string;
  category?: string;
  isActive: boolean;
  createdAt: string;
}

// ── API hooks (add to apiSlice.ts — see apiSlice.additions.ts) ───────────────
import {
  useGetCannedResponsesQuery,
  useCreateCannedResponseMutation,
  useUpdateCannedResponseMutation,
  useDeleteCannedResponseMutation,
} from "@/store/slice/apiSlice";

// ── Category colours ──────────────────────────────────────────────────────────
const CATEGORY_COLORS: Record<string, string> = {
  Payment: "bg-blue-100 text-blue-700",
  Tracking: "bg-purple-100 text-purple-700",
  Delay: "bg-amber-100 text-amber-700",
  Claims: "bg-red-100 text-red-600",
  General: "bg-gray-100 text-gray-600",
};

const CATEGORIES = [
  "General",
  "Payment",
  "Tracking",
  "Delay",
  "Claims",
  "Customs",
  "Other",
];

// ── Card ──────────────────────────────────────────────────────────────────────
function ResponseCard({
  item,
  onEdit,
  onDelete,
}: {
  item: CannedResponse;
  onEdit: (item: CannedResponse) => void;
  onDelete: (id: string) => void;
}) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(item.body);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const catColor =
    CATEGORY_COLORS[item.category ?? "General"] ?? "bg-gray-100 text-gray-600";

  return (
    <div className="bg-white border border-gray-100 rounded-xl p-4 space-y-2 hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-gray-900 truncate">
            {item.title}
          </p>
          {item.category && (
            <span
              className={`inline-block mt-0.5 px-2 py-0.5 rounded-full text-[10px] font-medium ${catColor}`}
            >
              {item.category}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={copy}
            title="Copy to clipboard"
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-700"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-green-600" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
          </button>
          <button
            onClick={() => onEdit(item)}
            title="Edit"
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-700"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDelete(item.id)}
            title="Delete"
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 transition-colors text-gray-400 hover:text-red-500"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      <p className="text-xs text-gray-500 line-clamp-3 leading-relaxed">
        {item.body}
      </p>
    </div>
  );
}

// ── Form modal ────────────────────────────────────────────────────────────────
function ResponseFormModal({
  initial,
  onClose,
}: {
  initial?: CannedResponse | null;
  onClose: () => void;
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [body, setBody] = useState(initial?.body ?? "");
  const [category, setCategory] = useState(initial?.category ?? "General");

  const [create, { isLoading: creating }] = useCreateCannedResponseMutation();
  const [update, { isLoading: updating }] = useUpdateCannedResponseMutation();
  const saving = creating || updating;

  const handleSave = async () => {
    if (!title.trim() || !body.trim()) return;
    if (initial) {
      await update({ id: initial.id, title, body, category }).unwrap();
    } else {
      await create({ title, body, category }).unwrap();
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-900">
            {initial ? "Edit Template" : "New Template"}
          </h2>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Title
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Customs Delay Explanation"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Body
            </label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Dear [Customer Name], Thank you for reaching out…"
              rows={6}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none"
            />
          </div>
        </div>

        <div className="flex gap-3 pt-1">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !title.trim() || !body.trim()}
            className="flex-1 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-medium hover:bg-black transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {initial ? "Save Changes" : "Create Template"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function CannedResponsesPage() {
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("");
  const [editing, setEditing] = useState<CannedResponse | null | false>(false);

  const { data, isLoading } = useGetCannedResponsesQuery(
    catFilter ? { category: catFilter } : {},
  );
  const [deleteResponse, { isLoading: deleting }] =
    useDeleteCannedResponseMutation();

  const raw: CannedResponse[] =
    (data as any)?.data?.responses ?? (data as any)?.responses ?? [];

  const filtered = raw.filter(
    (r) =>
      r.title.toLowerCase().includes(search.toLowerCase()) ||
      r.body.toLowerCase().includes(search.toLowerCase()),
  );

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this template?")) return;
    await deleteResponse({ id });
  };

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="dashboard-heading">Canned Responses</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Pre-approved templates for consistent customer replies
          </p>
        </div>
        <button
          onClick={() => setEditing(null)}
          className="flex items-center gap-2 bg-brand text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-red-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Template
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search templates…"
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
        </div>
        <select
          value={catFilter}
          onChange={(e) => setCatFilter(e.target.value)}
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
        >
          <option value="">All Categories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="animate-spin w-7 h-7 text-gray-400" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-400">
          <MessageSquare className="w-10 h-10" />
          <p className="text-sm">
            {raw.length === 0
              ? "No templates yet. Create your first one."
              : "No templates match your search."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((item) => (
            <ResponseCard
              key={item.id}
              item={item}
              onEdit={(i) => setEditing(i)}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Form modal */}
      {editing !== false && (
        <ResponseFormModal
          initial={editing}
          onClose={() => setEditing(false)}
        />
      )}
    </div>
  );
}
