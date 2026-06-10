"use client";
import Sidebar from "@/components/layout/sidebar";
import { QuickActionDropdown } from "@/components/ui/button/quick-action-button";
import { useAppSelector } from "@/hooks/useStore";
import { Bell, HelpCircle, Menu } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { useGetNotificationsQuery } from "@/store/slice/apiSlice";

export default function Layout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const token    = useAppSelector(s => s.auth.accessToken);
  const userRole = useAppSelector(s => s.auth.user?.role);
  const router   = useRouter();
  const [ready, setReady] = useState(false);

  const { data: notifData } = useGetNotificationsQuery(undefined, { skip: !token });
  const unreadCount = (notifData?.data?.notifications ?? []).filter((n: any) => !n.isRead).length;

  useEffect(() => {
    if (!token) { router.push("/auth/login"); }
    else { setReady(true); }
  }, [router, token]);

  if (!ready) return null;

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Sidebar */}
      <Sidebar mobileVisible={sidebarOpen} closeModal={() => setSidebarOpen(false)} />

      {/* Main content */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Top header */}
        <header className="h-16 flex-shrink-0 bg-white border-b border-gray-100 flex items-center justify-between px-4 md:px-6 shadow-sm">
          {/* Mobile hamburger */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-xl hover:bg-gray-100 transition-colors"
          >
            <Menu className="w-5 h-5 text-gray-600" />
          </button>

          {/* Desktop spacer */}
          <div className="hidden lg:block" />

          {/* Right actions */}
          <div className="flex items-center gap-2 md:gap-3">
            <button className="relative w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors">
              <HelpCircle className="w-5 h-5 text-gray-500" />
            </button>

            <button className="relative w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors">
              <Bell className="w-5 h-5 text-gray-500" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-brand rounded-full flex items-center justify-center">
                  <span className="text-[9px] text-white font-bold">{unreadCount > 9 ? "9+" : unreadCount}</span>
                </span>
              )}
            </button>

            <div className="hidden sm:block">
              <QuickActionDropdown role={userRole ?? ""} />
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <div className="px-4 md:px-8 py-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
