"use client";

import { ColumnDef } from "@tanstack/react-table";
import { useState } from "react";
import { Star, Pencil, Trash2, Loader2 } from "lucide-react";
import {
  useToggleFeaturedFAQMutation,
  useUpdateFAQMutation,
  useDeleteFAQMutation,
} from "@/store/slice/apiSlice";

export type FAQCategory =
  | "PRICING" | "SHIPPING_RULES" | "TRACKING"
  | "PAYMENTS" | "ACCOUNT" | "PACKAGING" | "CLAIMS" | "OTHER";

export type FAQ = {
  id: string;
  question: string;
  answer: string;
  category: FAQCategory;
  sortOrder: number;
  isActive?: boolean;
  isFeatured?: boolean;
  createdAt?: string;
};

const formatCategory = (v?: string) =>
  v ? v.toLowerCase().replace(/_/g, " ") : "-";

const formatDate = (d?: string) => {
  if (!d) return "-";
  const p = new Date(d);
  return isNaN(p.getTime()) ? "-" : p.toLocaleDateString();
};

// ─── Edit modal ───────────────────────────────────────────────────────────────
function EditFAQModal({ faq, onClose }: { faq: FAQ; onClose: () => void }) {
  const [question, setQuestion] = useState(faq.question);
  const [answer, setAnswer] = useState(faq.answer);
  const [category, setCategory] = useState(faq.category);
  const [sortOrder, setSortOrder] = useState(faq.sortOrder);
  const [updateFAQ, { isLoading }] = useUpdateFAQMutation();

  const handleSave = async () => {
    await updateFAQ({ id: faq.id, question, answer, category, sortOrder }).unwrap();
    onClose();
  };

  const CATEGORIES: FAQCategory[] = [
    "PRICING","SHIPPING_RULES","TRACKING","PAYMENTS","ACCOUNT","PACKAGING","CLAIMS","OTHER"
  ];

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6" onClick={e => e.stopPropagation()}>
        <h2 className="text-lg font-semibold mb-4">Edit FAQ</h2>

        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-gray-700 mb-1 block">Question</label>
            <input value={question} onChange={e => setQuestion(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-700 mb-1 block">Answer</label>
            <textarea value={answer} onChange={e => setAnswer(e.target.value)} rows={4}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-700 mb-1 block">Category</label>
              <select value={category} onChange={e => setCategory(e.target.value as FAQCategory)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm">
                {CATEGORIES.map(c => <option key={c} value={c}>{formatCategory(c)}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-700 mb-1 block">Sort Order</label>
              <input type="number" min={0} value={sortOrder} onChange={e => setSortOrder(Number(e.target.value))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm" />
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-5">
          <button onClick={onClose} className="flex-1 border border-gray-200 rounded-xl py-2 text-sm text-gray-600 hover:bg-gray-50">
            Cancel
          </button>
          <button onClick={handleSave} disabled={isLoading}
            className="flex-1 bg-brand text-white rounded-xl py-2 text-sm font-semibold disabled:opacity-50 hover:bg-red-700">
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Action cell ──────────────────────────────────────────────────────────────
function FAQActionCell({ faq }: { faq: FAQ }) {
  const [editOpen, setEditOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [toggleFeatured, { isLoading: toggling }] = useToggleFeaturedFAQMutation();
  const [deleteFAQ, { isLoading: deleting }] = useDeleteFAQMutation();

  return (
    <>
      <div className="flex items-center gap-2">
        {/* Feature star */}
        <button
          onClick={() => toggleFeatured({ id: faq.id })}
          disabled={toggling}
          title={faq.isFeatured ? "Remove from homepage" : "Feature on homepage (max 4)"}
          className={`p-1.5 rounded-lg transition-colors ${
            faq.isFeatured ? "text-yellow-500 bg-yellow-50" : "text-gray-300 hover:text-yellow-400 hover:bg-yellow-50"
          }`}
        >
          {toggling ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Star className="w-3.5 h-3.5" fill={faq.isFeatured ? "currentColor" : "none"} />}
        </button>

        {/* Edit */}
        <button onClick={() => setEditOpen(true)}
          className="p-1.5 rounded-lg text-gray-400 hover:text-blue-500 hover:bg-blue-50 transition-colors">
          <Pencil className="w-3.5 h-3.5" />
        </button>

        {/* Delete */}
        {confirmDelete ? (
          <div className="flex items-center gap-1">
            <button onClick={() => deleteFAQ({ id: faq.id })} disabled={deleting}
              className="text-xs bg-red-600 text-white px-2 py-1 rounded-lg disabled:opacity-50">
              {deleting ? "..." : "Yes"}
            </button>
            <button onClick={() => setConfirmDelete(false)} className="text-xs border px-2 py-1 rounded-lg">No</button>
          </div>
        ) : (
          <button onClick={() => setConfirmDelete(true)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {editOpen && <EditFAQModal faq={faq} onClose={() => setEditOpen(false)} />}
    </>
  );
}

// ─── Column definitions ───────────────────────────────────────────────────────
export const FAQColumns: ColumnDef<FAQ>[] = [
  {
    id: "sn",
    header: "S/N",
    cell: ({ row }) => <div className="text-gray-400">{row.index + 1}</div>,
  },
  {
    id: "featured",
    header: "Featured",
    cell: ({ row }) => (
      <div className="text-center">
        {row.original.isFeatured ? (
          <span className="inline-flex items-center gap-1 text-xs bg-yellow-50 text-yellow-600 border border-yellow-200 px-2 py-0.5 rounded-full font-medium">
            <Star className="w-3 h-3" fill="currentColor" /> Homepage
          </span>
        ) : (
          <span className="text-gray-300 text-xs">—</span>
        )}
      </div>
    ),
  },
  {
    accessorKey: "question",
    header: "Question",
    cell: ({ row }) => (
      <div className="max-w-[220px] truncate font-medium text-sm">{row.original.question}</div>
    ),
  },
  {
    accessorKey: "answer",
    header: "Answer",
    cell: ({ row }) => (
      <div className="max-w-[280px] truncate text-xs text-gray-500">{row.original.answer}</div>
    ),
  },
  {
    accessorKey: "category",
    header: "Category",
    cell: ({ row }) => (
      <span className="rounded-full bg-gray-100 px-2 py-1 text-xs capitalize text-gray-600">
        {formatCategory(row.original.category)}
      </span>
    ),
  },
  {
    accessorKey: "sortOrder",
    header: "Order",
    cell: ({ row }) => <div className="text-sm text-gray-500">{row.original.sortOrder}</div>,
  },
  {
    accessorKey: "createdAt",
    header: "Date",
    cell: ({ row }) => <div className="text-xs text-gray-400">{formatDate(row.original.createdAt)}</div>,
  },
  {
    id: "action",
    header: "Action",
    cell: ({ row }) => <FAQActionCell faq={row.original} />,
  },
];
