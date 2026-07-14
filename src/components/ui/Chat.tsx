"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import {
  useCreateTicketMutation,
  useGetMyTicketQuery,
  useGetTicketByIdQuery,
  useReplyToTicketMutation,
  useGetCannedResponsesQuery,
} from "@/store/slice/apiSlice";
import type { CreateTicketFormData } from "@/lib/validation/quote";
import {
  MessageCircle,
  X,
  Send,
  ChevronLeft,
  Plus,
  Loader2,
  BookOpen,
  AlertCircle,
} from "lucide-react";

// ─── Socket hook (inline — avoids a circular import) ─────────────────────────

const WS_URL =
  (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_WS_URL) ||
  (typeof process !== "undefined" &&
    process.env?.NEXT_PUBLIC_API_BASE_URL?.replace(/\/api.*$/, "")) ||
  "";

interface LiveMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  body: string;
  isInternal: boolean;
  createdAt: string;
}

function useTicketSocket(
  ticketId: string | null,
  onMessage: (m: LiveMessage) => void,
) {
  const socketRef = useRef<any>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!ticketId || !WS_URL) return;
    let mounted = true;

    import("socket.io-client")
      .then(({ io }) => {
        if (!mounted) return;
        const socket = io(WS_URL, {
          transports: ["websocket", "polling"],
          reconnection: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 2000,
        });
        socketRef.current = socket;

        socket.on("connect", () => {
          if (mounted) {
            setConnected(true);
            socket.emit("ticket:join", ticketId);
          }
        });
        socket.on("disconnect", () => {
          if (mounted) setConnected(false);
        });
        socket.on(
          "ticket:message",
          (data: { ticketId: string; message: LiveMessage }) => {
            if (
              mounted &&
              data.ticketId === ticketId &&
              !data.message.isInternal
            ) {
              onMessage(data.message);
            }
          },
        );
      })
      .catch(() => {});

    return () => {
      mounted = false;
      if (socketRef.current) {
        socketRef.current.emit("ticket:leave", ticketId);
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setConnected(false);
    };
  }, [ticketId]);

  return connected;
}

// ─── Types ────────────────────────────────────────────────────────────────────

type View = "home" | "new-ticket" | "thread";

const CATEGORIES = [
  { value: "TRACKING", label: "Tracking Issue" },
  { value: "PAYMENT", label: "Payment Problem" },
  { value: "DELIVERY_ISSUE", label: "Delivery Issue" },
  { value: "DAMAGED_GOODS", label: "Damaged Goods" },
  { value: "ACCOUNT", label: "Account Help" },
  { value: "OTHER", label: "Other" },
];

const PRIORITIES = [
  { value: "LOW", label: "Low" },
  { value: "NORMAL", label: "Normal" },
  { value: "HIGH", label: "High" },
  { value: "URGENT", label: "Urgent" },
];

// ─── Thread View ──────────────────────────────────────────────────────────────

function ThreadView({
  ticketId,
  currentUserId,
  onBack,
}: {
  ticketId: string;
  currentUserId: string;
  onBack: () => void;
}) {
  const [reply, setReply] = useState("");
  const [localMessages, setLocalMessages] = useState<any[]>([]);
  const [showTemplates, setShowTemplates] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data, isLoading, refetch } = useGetTicketByIdQuery(ticketId, {
    pollingInterval: 0, // real-time via socket; no polling needed
  });
  const [sendReply, { isLoading: isSending }] = useReplyToTicketMutation();
  const { data: cannedData } = useGetCannedResponsesQuery();

  const payload: any = (data as any)?.data ?? data ?? {};
  const ticket = payload?.ticket;
  const messages: any[] = ticket?.messages ?? [];

  // Merge DB messages + live socket messages (dedup by id)
  const allMessages = [
    ...messages,
    ...localMessages.filter((lm) => !messages.find((m: any) => m.id === lm.id)),
  ].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );

  // Socket real-time
  const isConnected = useTicketSocket(ticketId, (msg) => {
    if (msg.senderId !== currentUserId) {
      setLocalMessages((prev) => {
        if (prev.find((m) => m.id === msg.id)) return prev;
        return [...prev, { ...msg }];
      });
    }
  });

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [allMessages.length]);

  const handleSend = async () => {
    if (!reply.trim() || isSending) return;
    const optimistic = {
      id: `opt-${Date.now()}`,
      senderId: currentUserId,
      senderRole: "CUSTOMER",
      body: reply,
      isInternal: false,
      createdAt: new Date().toISOString(),
    };
    setLocalMessages((prev) => [...prev, optimistic]);
    const text = reply;
    setReply("");
    try {
      await sendReply({ id: ticketId, body: text }).unwrap();
      refetch();
    } catch {
      setLocalMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
      setReply(text);
    }
  };

  const cannedList: any[] = (cannedData as any)?.data?.responses ?? [];

  const fmt = (d: string) =>
    new Date(d).toLocaleTimeString("en-NG", {
      hour: "2-digit",
      minute: "2-digit",
    });

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-5 h-5 animate-spin text-[#CC0000]" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-[#CC0000]">
        <button onClick={onBack} className="text-white/80 hover:text-white">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-white text-sm font-semibold truncate">
            {ticket?.subject ?? "Support Ticket"}
          </p>
          <div className="flex items-center gap-2">
            <span
              className={`w-1.5 h-1.5 rounded-full ${isConnected ? "bg-green-300" : "bg-gray-400"}`}
            />
            <p className="text-white/70 text-xs">
              {isConnected ? "Live" : "Connecting…"} · #{ticket?.ticketNumber}
            </p>
          </div>
        </div>
        <span
          className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
            ticket?.status === "RESOLVED"
              ? "bg-green-100 text-green-700"
              : ticket?.status === "ESCALATED"
                ? "bg-red-100 text-red-700"
                : "bg-white/20 text-white"
          }`}
        >
          {ticket?.status?.replace("_", " ")}
        </span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
        {allMessages.length === 0 ? (
          <div className="text-center text-gray-400 text-xs pt-8">
            No messages yet. Send the first one.
          </div>
        ) : (
          allMessages
            .filter((m: any) => !m.isInternal)
            .map((m: any) => {
              const isMine = m.senderId === currentUserId;
              return (
                <div
                  key={m.id}
                  className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[78%] rounded-2xl px-3.5 py-2.5 text-sm shadow-sm ${
                      isMine
                        ? "bg-[#CC0000] text-white rounded-br-sm"
                        : "bg-white text-gray-800 rounded-bl-sm border border-gray-100"
                    }`}
                  >
                    {!isMine && (
                      <p className="text-[10px] font-semibold text-[#CC0000] mb-1">
                        {m.senderName || "Support Agent"}
                      </p>
                    )}
                    <p className="whitespace-pre-wrap leading-relaxed">
                      {m.body}
                    </p>
                    <p
                      className={`text-[10px] mt-1 text-right ${isMine ? "text-white/60" : "text-gray-400"}`}
                    >
                      {fmt(m.createdAt)}
                    </p>
                  </div>
                </div>
              );
            })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Canned responses picker */}
      {showTemplates && cannedList.length > 0 && (
        <div className="border-t bg-white max-h-32 overflow-y-auto">
          {cannedList.map((c: any) => (
            <button
              key={c.id}
              onClick={() => {
                setReply(c.body);
                setShowTemplates(false);
              }}
              className="w-full text-left px-4 py-2.5 hover:bg-gray-50 text-xs border-b border-gray-50 last:border-0"
            >
              <p className="font-medium text-gray-800">{c.title}</p>
              <p className="text-gray-500 truncate">{c.body}</p>
            </button>
          ))}
        </div>
      )}

      {/* Reply box */}
      {ticket?.status !== "CLOSED" && (
        <div className="border-t bg-white px-3 py-3 flex items-end gap-2">
          {cannedList.length > 0 && (
            <button
              onClick={() => setShowTemplates((v) => !v)}
              title="Use a template"
              className={`p-2 rounded-lg transition-colors flex-shrink-0 ${showTemplates ? "bg-[#CC0000]/10 text-[#CC0000]" : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"}`}
            >
              <BookOpen className="w-4 h-4" />
            </button>
          )}
          <textarea
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Type a message…"
            rows={1}
            className="flex-1 resize-none border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#CC0000]/20 focus:border-[#CC0000] min-h-[38px] max-h-24"
            style={{ height: "auto" }}
            onInput={(e) => {
              const t = e.currentTarget;
              t.style.height = "auto";
              t.style.height = Math.min(t.scrollHeight, 96) + "px";
            }}
          />
          <button
            onClick={handleSend}
            disabled={!reply.trim() || isSending}
            className="w-9 h-9 flex items-center justify-center bg-[#CC0000] text-white rounded-xl hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex-shrink-0"
          >
            {isSending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
      )}
      {ticket?.status === "CLOSED" && (
        <div className="border-t px-4 py-3 text-center text-xs text-gray-500 bg-gray-50">
          This ticket is closed. Open a new ticket to continue.
        </div>
      )}
    </div>
  );
}

// ─── New Ticket Form ───────────────────────────────────────────────────────────

function NewTicketForm({
  onCreated,
  onBack,
}: {
  onCreated: (id: string) => void;
  onBack: () => void;
}) {
  const [form, setForm] = useState<CreateTicketFormData>({
    subject: "",
    category: "OTHER",
    priority: "NORMAL",
    body: "",
  });
  const [error, setError] = useState("");
  const [createTicket, { isLoading }] = useCreateTicketMutation();

  const handleSubmit = async () => {
    if (!form.subject.trim() || !form.body.trim()) {
      setError("Please fill in all fields.");
      return;
    }
    setError("");
    try {
      const res: any = await createTicket(form).unwrap();
      const id = res?.data?.ticket?.id;
      if (id) onCreated(id);
    } catch (e: any) {
      setError(
        e?.data?.message || "Failed to create ticket. Please try again.",
      );
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-4 py-3 bg-[#CC0000]">
        <button onClick={onBack} className="text-white/80 hover:text-white">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <p className="text-white text-sm font-semibold">New Support Ticket</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">
            Subject
          </label>
          <input
            value={form.subject}
            onChange={(e) =>
              setForm((p) => ({ ...p, subject: e.target.value }))
            }
            placeholder="Brief description of your issue"
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#CC0000]/20 focus:border-[#CC0000]"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">
            Category
          </label>
          <select
            value={form.category}
            onChange={(e) =>
              setForm((p) => ({
                ...p,
                category: e.target.value as CreateTicketFormData["category"],
              }))
            }
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#CC0000]/20 focus:border-[#CC0000] bg-white"
          >
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">
            Priority
          </label>
          <select
            value={form.priority}
            onChange={(e) =>
              setForm((p) => ({
                ...p,
                priority: e.target.value as CreateTicketFormData["priority"],
              }))
            }
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#CC0000]/20 focus:border-[#CC0000] bg-white"
          >
            {PRIORITIES.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">
            Message
          </label>
          <textarea
            value={form.body}
            onChange={(e) => setForm((p) => ({ ...p, body: e.target.value }))}
            placeholder="Describe your issue in detail…"
            rows={5}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#CC0000]/20 focus:border-[#CC0000] resize-none"
          />
        </div>
        {error && (
          <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
            {error}
          </div>
        )}
      </div>

      <div className="border-t px-4 py-3">
        <button
          onClick={handleSubmit}
          disabled={isLoading}
          className="w-full bg-[#CC0000] text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
          Send Ticket
        </button>
      </div>
    </div>
  );
}

// ─── Home View ────────────────────────────────────────────────────────────────

function HomeView({
  userId,
  onNewTicket,
  onOpenTicket,
}: {
  userId: string;
  onNewTicket: () => void;
  onOpenTicket: (id: string) => void;
}) {
  const { data, isLoading } = useGetMyTicketQuery(
    { status: undefined },
    {
      pollingInterval: 30_000,
    },
  );
  const tickets: any[] = (data as any)?.data?.tickets ?? [];
  const open = tickets.filter(
    (t: any) => !["CLOSED", "RESOLVED"].includes(t.status),
  );
  const recent = tickets.slice(0, 5);

  const statusColor: Record<string, string> = {
    OPEN: "bg-yellow-100 text-yellow-700",
    IN_PROGRESS: "bg-blue-100 text-blue-700",
    ESCALATED: "bg-red-100 text-red-700",
    RESOLVED: "bg-green-100 text-green-700",
    CLOSED: "bg-gray-100 text-gray-500",
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-5 py-5 bg-gradient-to-b from-[#CC0000] to-[#a50000]">
        <div className="flex items-center gap-2 mb-1">
          <img
            src="/bowago-logo.svg"
            alt="BowaGO"
            className="h-6 brightness-0 invert"
          />
        </div>
        <p className="text-white text-lg font-bold mt-2">How can we help?</p>
        <p className="text-white/70 text-xs mt-0.5">
          Our support team typically replies in minutes.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* New ticket CTA */}
        <button
          onClick={onNewTicket}
          className="w-full flex items-center gap-3 bg-white border border-gray-200 rounded-2xl p-4 hover:border-[#CC0000]/40 hover:shadow-md transition-all text-left group"
        >
          <div className="w-10 h-10 rounded-xl bg-[#CC0000]/10 flex items-center justify-center flex-shrink-0 group-hover:bg-[#CC0000]/20 transition-colors">
            <Plus className="w-5 h-5 text-[#CC0000]" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">
              Start a new conversation
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              Tracking, payments, delivery issues & more
            </p>
          </div>
        </button>

        {/* Open tickets */}
        {open.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Active Tickets ({open.length})
            </p>
            <div className="space-y-2">
              {open.map((t: any) => (
                <button
                  key={t.id}
                  onClick={() => onOpenTicket(t.id)}
                  className="w-full flex items-start gap-3 bg-white border border-gray-200 rounded-xl p-3.5 hover:border-[#CC0000]/30 hover:shadow-sm transition-all text-left"
                >
                  <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <MessageCircle className="w-4 h-4 text-gray-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {t.subject}
                      </p>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${statusColor[t.status] ?? "bg-gray-100 text-gray-500"}`}
                      >
                        {t.status?.replace("_", " ")}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {t.ticketNumber}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Past tickets */}
        {recent.filter((t: any) => ["CLOSED", "RESOLVED"].includes(t.status))
          .length > 0 && (
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Past Tickets
            </p>
            <div className="space-y-1.5">
              {recent
                .filter((t: any) => ["CLOSED", "RESOLVED"].includes(t.status))
                .slice(0, 3)
                .map((t: any) => (
                  <button
                    key={t.id}
                    onClick={() => onOpenTicket(t.id)}
                    className="w-full flex items-center gap-3 rounded-xl px-3.5 py-2.5 hover:bg-gray-100 transition-colors text-left"
                  >
                    <p className="text-sm text-gray-700 truncate flex-1">
                      {t.subject}
                    </p>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${statusColor[t.status] ?? ""}`}
                    >
                      {t.status}
                    </span>
                  </button>
                ))}
            </div>
          </div>
        )}

        {isLoading && (
          <div className="flex justify-center py-4">
            <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Widget ──────────────────────────────────────────────────────────────

export function UserChat() {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<View>("home");
  const [activeTicketId, setActiveTicketId] = useState<string | null>(null);

  const user = useSelector((s: RootState) => s.auth.user);
  const token = useSelector((s: RootState) => s.auth.accessToken);

  // Only render for authenticated customers (not admins who have the full dashboard)
  if (!token || !user || (user as any).role === "ADMIN") return null;

  const userId = (user as any).id ?? "";

  const handleOpenTicket = (id: string) => {
    setActiveTicketId(id);
    setView("thread");
  };

  const handleTicketCreated = (id: string) => {
    setActiveTicketId(id);
    setView("thread");
  };

  const handleBack = () => {
    setActiveTicketId(null);
    setView("home");
  };

  const handleToggle = () => {
    if (!open) setView("home");
    setOpen((v) => !v);
  };

  return (
    <>
      {/* Chat Panel */}
      {open && (
        <div
          className="fixed bottom-20 right-5 z-50 w-[360px] h-[540px] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden"
          style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.18)" }}
        >
          {view === "home" && (
            <HomeView
              userId={userId}
              onNewTicket={() => setView("new-ticket")}
              onOpenTicket={handleOpenTicket}
            />
          )}
          {view === "new-ticket" && (
            <NewTicketForm
              onCreated={handleTicketCreated}
              onBack={handleBack}
            />
          )}
          {view === "thread" && activeTicketId && (
            <ThreadView
              ticketId={activeTicketId}
              currentUserId={userId}
              onBack={handleBack}
            />
          )}
        </div>
      )}

      {/* FAB */}
      <button
        onClick={handleToggle}
        aria-label={open ? "Close support chat" : "Open support chat"}
        className="fixed bottom-5 right-5 z-50 w-14 h-14 bg-[#CC0000] text-white rounded-full shadow-lg hover:bg-red-700 hover:scale-105 transition-all flex items-center justify-center"
        style={{ boxShadow: "0 8px 24px rgba(204,0,0,0.4)" }}
      >
        {open ? (
          <X className="w-6 h-6" />
        ) : (
          <MessageCircle className="w-6 h-6" />
        )}
      </button>
    </>
  );
}
