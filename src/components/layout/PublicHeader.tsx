"use client";

/**
 * PublicHeader — shared navbar for every page outside /dashboard.
 *
 * Before this, each public page (home, /track, /faq, /packaging-guide)
 * hand-rolled its own <nav>, all slightly different and all desktop-only
 * (the menu links were `hidden md:flex` with no mobile fallback at all).
 * This component is the single source of truth: same links, same auth
 * state handling, and an animated slide-down mobile menu.
 *
 * Menu items: Quote (/#quote), Track (/track), FAQ (/faq),
 * Packaging (/packaging-guide). "Services" removed per request.
 */

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { Menu, X } from "lucide-react";

const NAV_LINKS = [
  { label: "Quote", href: "/#quote" },
  { label: "Track", href: "/track" },
  { label: "FAQ", href: "/faq" },
  { label: "Packaging", href: "/packaging-guide" },
];

export default function PublicHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  const user = useSelector((s: RootState) => s.auth.user) as any;
  const accessToken = useSelector((s: RootState) => s.auth.accessToken);
  const isAuthenticated = !!accessToken && !!user;

  // Close the mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Lock body scroll while the mobile menu is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const isActive = (href: string) => {
    if (href === "/#quote") return pathname === "/";
    return pathname === href || pathname?.startsWith(`${href}/`);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex-shrink-0">
          <Image src="/bowago-logo.svg" alt="BowaGO" width={110} height={44} />
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-white/70">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className={`transition-colors hover:text-white ${
                isActive(link.href) ? "text-white" : ""
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Right side: auth + mobile toggle */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-3">
            {isAuthenticated ? (
              <Link
                href="/dashboard"
                className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-full border border-white/15 hover:border-white/30 bg-white/5 hover:bg-white/10 transition-colors"
              >
                {user?.avatar ? (
                  <Image
                    src={user.avatar}
                    alt={user?.firstName ?? "Account"}
                    width={32}
                    height={32}
                    className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                  />
                ) : (
                  <span className="w-8 h-8 rounded-full bg-brand/20 text-brand flex items-center justify-center text-xs font-bold flex-shrink-0">
                    {user?.firstName?.[0]}
                    {user?.lastName?.[0]}
                  </span>
                )}
                <span className="text-sm font-medium text-white/90">Dashboard</span>
              </Link>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className="text-sm text-white/70 hover:text-white transition-colors"
                >
                  Login
                </Link>
                <Link
                  href="/auth/signup"
                  className="bg-brand hover:bg-red-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen((v) => !v)}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
            className="md:hidden w-9 h-9 flex items-center justify-center rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors relative"
          >
            <Menu
              className={`w-5 h-5 absolute transition-all duration-200 ${
                mobileOpen ? "opacity-0 rotate-90 scale-50" : "opacity-100 rotate-0 scale-100"
              }`}
            />
            <X
              className={`w-5 h-5 absolute transition-all duration-200 ${
                mobileOpen ? "opacity-100 rotate-0 scale-100" : "opacity-0 -rotate-90 scale-50"
              }`}
            />
          </button>
        </div>
      </div>

      {/* Mobile menu overlay + slide-down panel */}
      <div
        className={`md:hidden fixed inset-0 top-16 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
          mobileOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setMobileOpen(false)}
      />
      <div
        className={`md:hidden absolute left-0 right-0 top-16 bg-black border-b border-white/10 overflow-hidden transition-all duration-300 ease-out ${
          mobileOpen ? "max-h-[420px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="px-4 py-5 flex flex-col gap-1">
          {NAV_LINKS.map((link, i) => (
            <Link
              key={link.label}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              style={{ transitionDelay: mobileOpen ? `${i * 40}ms` : "0ms" }}
              className={`text-base font-medium px-3 py-3 rounded-lg transition-all duration-300 ${
                mobileOpen ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-3"
              } ${
                isActive(link.href)
                  ? "text-white bg-white/10"
                  : "text-white/70 hover:text-white hover:bg-white/5"
              }`}
            >
              {link.label}
            </Link>
          ))}

          <div className="h-px bg-white/10 my-3" />

          {isAuthenticated ? (
            <Link
              href="/dashboard"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-2 px-3 py-3 rounded-lg bg-white/5 text-white/90 text-sm font-medium"
            >
              {user?.avatar ? (
                <Image
                  src={user.avatar}
                  alt={user?.firstName ?? "Account"}
                  width={28}
                  height={28}
                  className="w-7 h-7 rounded-full object-cover flex-shrink-0"
                />
              ) : (
                <span className="w-7 h-7 rounded-full bg-brand/20 text-brand flex items-center justify-center text-xs font-bold flex-shrink-0">
                  {user?.firstName?.[0]}
                  {user?.lastName?.[0]}
                </span>
              )}
              Go to Dashboard
            </Link>
          ) : (
            <div className="flex flex-col gap-2 px-3">
              <Link
                href="/auth/login"
                onClick={() => setMobileOpen(false)}
                className="text-center text-sm text-white/80 border border-white/15 rounded-xl py-2.5"
              >
                Login
              </Link>
              <Link
                href="/auth/signup"
                onClick={() => setMobileOpen(false)}
                className="text-center bg-brand hover:bg-red-700 text-white py-2.5 rounded-xl text-sm font-semibold transition-colors"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
