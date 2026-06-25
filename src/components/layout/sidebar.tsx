"use client";

import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { logoutUser } from "@/store/slice/authSlice";
import { cn } from "@/utils/cn";
import {
  LayoutDashboard, Package, Map, FileText, Ticket, AlertTriangle,
  HelpCircle, Settings, LogOut, ChevronDown, ChevronRight, Layers,
  Shield, Users, Receipt, AlertCircle, Percent, ClipboardList, Tag,
  MapPin, Box, BookOpen, X, BarChart2, MessageSquare, Wallet,
  Building2, UserCheck,
} from "lucide-react";

const ICON_CLS = "w-4 h-4 flex-shrink-0";

interface MenuItem {
  label: string;
  href: string;
  /** role = top-level ADMIN or CUSTOMER */
  roles: string[];
  /**
   * subRoles: which adminSubRole values can see this item.
   * undefined = all admin subRoles.
   * Empty array [] = only CUSTOMER (no admin sub-role check needed).
   */
  subRoles?: string[];
  icon: React.ReactNode;
  children?: MenuItem[];
}

// Sub-role groupings
const ALL_ADMIN_SUBROLES = [
  "SUPER_ADMIN","LOGISTICS_MANAGER","ROLE_ADMIN",
  "ROLE_DISPATCHER","ROLE_FINANCE","ROLE_AGENT","ROLE_MASTER",
];
const SUPER = ["SUPER_ADMIN","LOGISTICS_MANAGER"];
const RATE_MANAGERS  = [...SUPER, "ROLE_ADMIN"];
const OPS_ROLES      = [...SUPER, "ROLE_ADMIN", "ROLE_DISPATCHER", "ROLE_MASTER"];
const FINANCE_ROLES  = [...SUPER, "ROLE_ADMIN", "ROLE_FINANCE"];
const TICKET_ROLES   = [...SUPER, "ROLE_ADMIN", "ROLE_AGENT"];
const TEAM_ROLES     = [...SUPER, "ROLE_MASTER"];

const menuList: MenuItem[] = [
  // ── Dashboard ──────────────────────────────────────────────────────────────
  {
    label: "Dashboard",
    href: "/dashboard",
    roles: ["ADMIN", "CUSTOMER"],
    icon: <LayoutDashboard className={ICON_CLS} />,
  },

  // ── Rate Management (super + role_admin only) ──────────────────────────────
  {
    label: "Rate Management",
    href: "/dashboard/rate",
    roles: ["ADMIN"],
    subRoles: RATE_MANAGERS,
    icon: <Percent className={ICON_CLS} />,
    children: [
      { label: "All Rates",    href: "/dashboard/rate",        roles: ["ADMIN"], subRoles: RATE_MANAGERS, icon: <Layers className={ICON_CLS} /> },
      { label: "Zones",        href: "/dashboard/rate/zones",  roles: ["ADMIN"], subRoles: RATE_MANAGERS, icon: <Map className={ICON_CLS} /> },
      { label: "Cities",       href: "/dashboard/rate/cities", roles: ["ADMIN"], subRoles: RATE_MANAGERS, icon: <MapPin className={ICON_CLS} /> },
      { label: "Boxes",        href: "/dashboard/rate/boxes",  roles: ["ADMIN"], subRoles: RATE_MANAGERS, icon: <Box className={ICON_CLS} /> },
      { label: "Audit Trail",  href: "/dashboard/rate/audit",  roles: ["ADMIN"], subRoles: RATE_MANAGERS, icon: <ClipboardList className={ICON_CLS} /> },
    ],
  },

  // ── Surcharges (super + role_admin only) ──────────────────────────────────
  {
    label: "Surcharges",
    href: "/dashboard/surcharges",
    roles: ["ADMIN"],
    subRoles: RATE_MANAGERS,
    icon: <Tag className={ICON_CLS} />,
    children: [
      { label: "All Surcharges",  href: "/dashboard/surcharges",           roles: ["ADMIN"], subRoles: RATE_MANAGERS, icon: <Tag className={ICON_CLS} /> },
      { label: "Surcharge Audit", href: "/dashboard/surcharges/audit-log", roles: ["ADMIN"], subRoles: SUPER,         icon: <ClipboardList className={ICON_CLS} /> },
    ],
  },

  // ── Shipments (all operational roles + customer) ───────────────────────────
  {
    label: "Shipments",
    href: "/dashboard/shipments",
    roles: ["CUSTOMER", "ADMIN"],
    subRoles: OPS_ROLES,
    icon: <Package className={ICON_CLS} />,
  },

  // ── Invoice (finance + super + customer) ──────────────────────────────────
  {
    label: "Invoice",
    href: "/dashboard/invoice",
    roles: ["CUSTOMER", "ADMIN"],
    subRoles: FINANCE_ROLES,
    icon: <Receipt className={ICON_CLS} />,
  },

  // ── Failed Webhooks (super only) ──────────────────────────────────────────
  {
    label: "Failed Webhooks",
    href: "/dashboard/payment/webhooks",
    roles: ["ADMIN"],
    subRoles: SUPER,
    icon: <AlertTriangle className={ICON_CLS} />,
  },

  // ── Support (agents + super) ──────────────────────────────────────────────
  {
    label: "Support",
    href: "/dashboard/tickets",
    roles: ["ADMIN"],
    subRoles: TICKET_ROLES,
    icon: <Ticket className={ICON_CLS} />,
    children: [
      { label: "All Tickets",      href: "/dashboard/tickets",                 roles: ["ADMIN"], subRoles: TICKET_ROLES,  icon: <Ticket className={ICON_CLS} /> },
      { label: "Claims",           href: "/dashboard/tickets/claims/admin",    roles: ["ADMIN"], subRoles: TICKET_ROLES,  icon: <AlertCircle className={ICON_CLS} /> },
      { label: "Agent KPI",        href: "/dashboard/support/kpi",             roles: ["ADMIN"], subRoles: SUPER,         icon: <BarChart2 className={ICON_CLS} /> },
      { label: "Canned Responses", href: "/dashboard/support/canned-responses",roles: ["ADMIN"], subRoles: TICKET_ROLES,  icon: <MessageSquare className={ICON_CLS} /> },
    ],
  },

  // ── Team Management (master + super) ─────────────────────────────────────
  {
    label: "Team",
    href: "/dashboard/team",
    roles: ["ADMIN"],
    subRoles: TEAM_ROLES,
    icon: <UserCheck className={ICON_CLS} />,
  },

  // ── Users (super + role_admin) ────────────────────────────────────────────
  {
    label: "Users",
    href: "/dashboard/users",
    roles: ["ADMIN"],
    subRoles: RATE_MANAGERS,
    icon: <Users className={ICON_CLS} />,
    children: [
      { label: "All Users",           href: "/dashboard/users",       roles: ["ADMIN"], subRoles: RATE_MANAGERS, icon: <Users className={ICON_CLS} /> },
      { label: "Custom Capabilities", href: "/dashboard/users/roles", roles: ["ADMIN"], subRoles: SUPER,         icon: <Shield className={ICON_CLS} /> },
    ],
  },

  // ── Admin FAQ ─────────────────────────────────────────────────────────────
  {
    label: "FAQ",
    href: "/dashboard/faq/admin",
    roles: ["ADMIN"],
    subRoles: RATE_MANAGERS,
    icon: <BookOpen className={ICON_CLS} />,
  },

  // ── Customer-only items ───────────────────────────────────────────────────
  {
    label: "My Support",
    href: "/dashboard/tickets",
    roles: ["CUSTOMER"],
    icon: <Ticket className={ICON_CLS} />,
    children: [
      { label: "My Tickets", href: "/dashboard/tickets",       roles: ["CUSTOMER"], icon: <Ticket className={ICON_CLS} /> },
      { label: "My Claims",  href: "/dashboard/tickets/claims",roles: ["CUSTOMER"], icon: <AlertCircle className={ICON_CLS} /> },
    ],
  },
  {
    label: "FAQ",
    href: "/dashboard/faq",
    roles: ["CUSTOMER"],
    icon: <BookOpen className={ICON_CLS} />,
  },
];

const otherMenuList: MenuItem[] = [
  {
    label: "Settings",
    href: "/dashboard/settings",
    roles: ["ADMIN", "CUSTOMER"],
    icon: <Settings className={ICON_CLS} />,
  },
];

// ── Role badge colours ────────────────────────────────────────────────────────
const SUB_ROLE_BADGE: Record<string, string> = {
  SUPER_ADMIN:       "bg-purple-50 text-purple-600 border border-purple-200",
  LOGISTICS_MANAGER: "bg-orange-50 text-orange-600 border border-orange-200",
  ROLE_ADMIN:        "bg-red-50 text-brand border border-brand/20",
  ROLE_AGENT:        "bg-green-50 text-green-600 border border-green-200",
  ROLE_MASTER:       "bg-indigo-50 text-indigo-600 border border-indigo-200",
  ROLE_DISPATCHER:   "bg-cyan-50 text-cyan-600 border border-cyan-200",
  ROLE_FINANCE:      "bg-pink-50 text-pink-600 border border-pink-200",
};

// ── Logout Modal ──────────────────────────────────────────────────────────────
function LogoutModal({ open, onCancel, onConfirm }: { open: boolean; onCancel: () => void; onConfirm: () => void }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6 text-center">
        <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <LogOut className="w-6 h-6 text-brand" />
        </div>
        <h2 className="text-lg font-bold text-gray-900 mb-2">Sign Out</h2>
        <p className="text-gray-500 text-sm mb-6">Are you sure you want to log out of your account?</p>
        <div className="flex gap-3">
          <button onClick={onCancel}
            className="flex-1 border border-gray-200 text-gray-700 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button onClick={onConfirm}
            className="flex-1 bg-brand text-white py-2.5 rounded-xl text-sm font-bold hover:bg-red-700 transition-colors">
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Sidebar ───────────────────────────────────────────────────────────────────
export default function Sidebar({ mobileVisible, closeModal }: { mobileVisible: boolean; closeModal: () => void }) {
  const dispatch  = useDispatch();
  const pathname  = usePathname();
  const router    = useRouter();
  const modalEl   = useRef<HTMLDivElement>(null);
  const user      = useSelector((s: any) => s.auth.user);
  const userRole  = user?.role ?? "CUSTOMER";
  const subRole   = user?.adminSubRole ?? "";

  const [logoutOpen, setLogoutOpen] = useState(false);
  const [openMenus, setOpenMenus]   = useState<Record<string, boolean>>({});

  const toggle = (label: string) =>
    setOpenMenus(prev => ({ ...prev, [label]: !prev[label] }));

  useEffect(() => {
    menuList.forEach(item => {
      if (item.children?.some(c => pathname.startsWith(c.href))) {
        setOpenMenus(prev => ({ ...prev, [item.label]: true }));
      }
    });
  }, [pathname]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (mobileVisible && modalEl.current && !modalEl.current.contains(e.target as Node)) {
        closeModal();
      }
    };
    document.addEventListener("click", handler, true);
    return () => document.removeEventListener("click", handler, true);
  }, [mobileVisible, closeModal]);

  const handleLogout = () => {
    dispatch(logoutUser());
    router.push("/auth/login");
    setLogoutOpen(false);
  };

  /** Returns true if this menu item is visible to the current user */
  const canSee = (item: MenuItem): boolean => {
    if (!item.roles.includes(userRole)) return false;
    // Customer — no sub-role restriction needed
    if (userRole === "CUSTOMER") return true;
    // Admin — check subRoles whitelist if defined
    if (item.subRoles) return item.subRoles.includes(subRole);
    // No restriction defined → visible to all admins
    return true;
  };

  const filterItems = (list: MenuItem[]): MenuItem[] =>
    list
      .filter(canSee)
      .map(item => ({
        ...item,
        children: item.children?.filter(canSee),
      }));

  const renderItems = (items: MenuItem[]) =>
    filterItems(items).map(item => {
      const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
      const isOpen   = openMenus[item.label];
      const hasKids  = !!item.children?.length;

      return (
        <div key={item.label + item.href}>
          <button
            onClick={() => {
              if (hasKids) { toggle(item.label); }
              else { mobileVisible && closeModal(); router.push(item.href); }
            }}
            className={cn(
              "flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm transition-all text-left",
              isActive && !hasKids
                ? "bg-brand/10 text-brand font-semibold"
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
            )}
          >
            <span className={isActive && !hasKids ? "text-brand" : "text-gray-400"}>
              {item.icon}
            </span>
            <span className="flex-1">{item.label}</span>
            {hasKids && (isOpen
              ? <ChevronDown className="w-3.5 h-3.5 text-gray-400"/>
              : <ChevronRight className="w-3.5 h-3.5 text-gray-400"/>
            )}
          </button>

          {hasKids && isOpen && (
            <div className="ml-4 mt-1 space-y-0.5 pl-3 border-l-2 border-gray-100">
              {item.children!.map(child => {
                const childActive = pathname === child.href || pathname.startsWith(child.href + "/");
                return (
                  <button
                    key={child.label + child.href}
                    onClick={() => { mobileVisible && closeModal(); router.push(child.href); }}
                    className={cn(
                      "flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm transition-all text-left",
                      childActive
                        ? "bg-brand/10 text-brand font-semibold"
                        : "text-gray-500 hover:bg-gray-100 hover:text-gray-800",
                    )}
                  >
                    <span className={childActive ? "text-brand" : "text-gray-400"}>{child.icon}</span>
                    {child.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      );
    });

  return (
    <>
      <LogoutModal open={logoutOpen} onCancel={() => setLogoutOpen(false)} onConfirm={handleLogout} />

      {mobileVisible && (
        <div className="fixed inset-0 bg-black/30 z-10 lg:hidden" onClick={closeModal} />
      )}

      <div
        ref={modalEl}
        className={cn(
          "flex flex-col h-screen bg-white border-r border-gray-100 overflow-y-auto transition-all duration-300 z-20",
          "fixed lg:relative w-64",
          mobileVisible ? "left-0" : "-left-64 lg:left-0",
        )}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-gray-50">
          <Image src="/bowago-dark-logo.svg" alt="BowaGO" width={110} height={44} loading="eager"/>
          <button onClick={closeModal} className="lg:hidden p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <X className="w-4 h-4 text-gray-500"/>
          </button>
        </div>

        {/* Nav */}
        <div className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 px-3 mb-2">Menu</p>
          {renderItems(menuList)}
          <div className="pt-4 pb-1">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 px-3 mb-2">Other</p>
          </div>
          {renderItems(otherMenuList)}
        </div>

        {/* User footer */}
        <div className="border-t border-gray-100 px-3 py-4">
          <div className="flex items-start gap-3 px-2 mb-3">
            <div className="w-9 h-9 rounded-xl bg-brand/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-brand font-bold text-sm">
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-gray-900 truncate leading-tight">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-gray-400 truncate mt-0.5">{user?.email}</p>
              <div className="flex flex-wrap gap-1 mt-2">
                <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wide ${
                  user?.role === "ADMIN"
                    ? "bg-red-50 text-brand border border-brand/20"
                    : "bg-blue-50 text-blue-600 border border-blue-200"
                }`}>
                  {user?.role ?? "CUSTOMER"}
                </span>
                {user?.role === "ADMIN" && user?.adminSubRole && (
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium capitalize ${
                    SUB_ROLE_BADGE[user.adminSubRole] ?? "bg-gray-50 text-gray-600 border border-gray-200"
                  }`}>
                    {user.adminSubRole.replace(/_/g, " ").replace("ROLE ", "")}
                  </span>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={() => setLogoutOpen(true)}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm text-red-600 hover:bg-red-50 transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4"/>
            Sign Out
          </button>
        </div>
      </div>
    </>
  );
}
