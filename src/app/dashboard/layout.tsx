"use client";
import Sidebar from "@/components/layout/sidebar";
import { QuickActionDropdown } from "@/components/ui/button/quick-action-button";
import { useAppSelector } from "@/hooks/useStore";
import { Bell, HelpCircle, Menu, Check, CheckCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useEffect, useState, useRef } from "react";
import {
  useGetUnreadNotificationCountQuery,
  useGetNotificationsQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
} from "@/store/slice/apiSlice";

// ─── Notification bell with dropdown panel ────────────────────────────────────
function NotificationBell() {
  const token = useAppSelector((s) => s.auth.accessToken);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Lightweight unread count poll every 30 seconds
  const { data: countData } = useGetUnreadNotificationCountQuery(undefined, {
    skip: !token,
    pollingInterval: 30_000,
    refetchOnFocus: true,
  });
  const unreadCount = countData?.data?.count ?? 0;

  // Full list only when panel is open
  const { data: notifData, refetch } = useGetNotificationsQuery(undefined, {
    skip: !token || !open,
    pollingInterval: open ? 15_000 : 0,
  });
  const notifications: any[] = notifData?.data?.notifications ?? [];

  const [markRead] = useMarkNotificationReadMutation();
  const [markAllRead, { isLoading: markingAll }] = useMarkAllNotificationsReadMutation();

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Refetch when panel opens
  useEffect(() => {
    if (open) refetch();
  }, [open]);

  const handleMarkRead = async (id: string) => {
    await markRead({ id });
  };

  const handleMarkAllRead = async () => {
    await markAllRead();
  };

  const typeIcon: Record<string, string> = {
    PAYMENT: "💳",
    SHIPMENT_UPDATE: "📦",
    SYSTEM: "🔔",
    SUPPORT: "🎫",
    DEFAULT: "🔔",
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5 text-gray-500" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-brand rounded-full flex items-center justify-center">
            <span className="text-[9px] text-white font-bold">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <p className="text-sm font-semibold text-gray-900">Notifications</p>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                disabled={markingAll}
                className="flex items-center gap-1 text-xs text-brand hover:text-red-700 font-medium"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-gray-400">
                No notifications yet
              </div>
            ) : (
              notifications.slice(0, 20).map((n: any) => (
                <div
                  key={n.id}
                  onClick={() => !n.isRead && handleMarkRead(n.id)}
                  className={`flex gap-3 px-4 py-3 cursor-pointer transition-colors ${
                    n.isRead ? "bg-white" : "bg-red-50 hover:bg-red-100"
                  }`}
                >
                  <span className="text-lg flex-shrink-0 mt-0.5">
                    {typeIcon[n.type] ?? typeIcon.DEFAULT}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${n.isRead ? "text-gray-700" : "text-gray-900 font-medium"}`}>
                      {n.title}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.body}</p>
                    <p className="text-[10px] text-gray-400 mt-1">
                      {new Date(n.createdAt).toLocaleString()}
                    </p>
                  </div>
                  {!n.isRead && (
                    <div className="w-2 h-2 rounded-full bg-brand flex-shrink-0 mt-2" />
                  )}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-2.5 border-t border-gray-100 text-center">
              <a href="/dashboard/notifications" className="text-xs text-brand font-medium hover:underline">
                View all notifications
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Dashboard layout ─────────────────────────────────────────────────────────
export default function Layout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const token = useAppSelector((s) => s.auth.accessToken);
  const userRole = useAppSelector((s) => s.auth.user?.role);
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!token) { router.push("/auth/login"); }
    else { setReady(true); }
  }, [router, token]);

  if (!ready) return null;

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar mobileVisible={sidebarOpen} closeModal={() => setSidebarOpen(false)} />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <header className="h-16 flex-shrink-0 bg-white border-b border-gray-100 flex items-center justify-between px-4 md:px-6 shadow-sm">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-xl hover:bg-gray-100 transition-colors"
          >
            <Menu className="w-5 h-5 text-gray-600" />
          </button>
          <div className="hidden lg:block" />

          <div className="flex items-center gap-2 md:gap-3">
            <button className="relative w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors">
              <HelpCircle className="w-5 h-5 text-gray-500" />
            </button>
            <NotificationBell />
            <div className="hidden sm:block">
              <QuickActionDropdown role={userRole ?? ""} />
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="px-4 md:px-8 py-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
