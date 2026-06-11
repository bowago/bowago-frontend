import { MoveLeft, X, ArrowLeft } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

interface AuthLayoutProps {
  children: ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen w-full relative overflow-y-auto flex items-start justify-center">
      {/* Red gradient background — matches BowaGO brand */}
      <div
        className="absolute inset-0 -z-20"
        style={{
          background:
            "radial-gradient(ellipse at 30% 20%, #cc0000 0%, #990000 35%, #1a0000 70%, #000000 100%)",
        }}
      />
      <div
        className="absolute inset-0 opacity-40 -z-10"
        style={{
          background:
            "radial-gradient(circle at 20% 15%, #ff4444 0%, transparent 50%)",
        }}
      />
      {/* Subtle noise texture */}
      <div
        className="absolute inset-0 opacity-5 -z-10"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E\")",
        }}
      />

      {/* Top nav bar — back to home */}
      <div className="fixed top-0 left-0 right-0 z-50 px-4 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-white/60 hover:text-white text-sm font-medium transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            Back to Home
          </Link>
          <div className="hidden sm:flex items-center gap-4 text-xs text-white/40">
            <Link
              href="/track"
              className="hover:text-white/70 transition-colors"
            >
              Track Shipment
            </Link>
            <Link href="/faq" className="hover:text-white/70 transition-colors">
              FAQ
            </Link>
          </div>
        </div>
      </div>

      <div className="w-full max-w-5xl mx-auto px-4 pt-20 pb-8 min-h-screen flex items-center justify-center">
        {/* Desktop: logo left, card right */}
        <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
          {/* Logo — hidden on mobile, shown on desktop */}
          <div className="hidden lg:flex flex-col gap-6">
            <Image
              src="/bowago-logo.svg"
              width={340}
              height={153}
              alt="BowaGO"
              priority
              loading="eager"
            />
            <div className="space-y-3 text-white/80">
              {[
                "Real-time tracking across Nigeria",
                "Transparent pricing — no hidden fees",
                "Express, Standard & Economy options",
              ].map((f) => (
                <div key={f} className="flex items-center gap-3 text-sm">
                  <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                    <div className="w-2 h-2 rounded-full bg-white" />
                  </div>
                  {f}
                </div>
              ))}
            </div>
          </div>

          {/* Mobile logo */}
          <div className="lg:hidden flex justify-center mb-2">
            <Image
              src="/bowago-logo.svg"
              width={160}
              height={72}
              alt="BowaGO"
              priority
              loading="eager"
            />
          </div>

          {/* Auth card */}
          <div className="bg-white rounded-2xl md:rounded-3xl shadow-2xl p-6 md:p-10 w-full max-w-md mx-auto lg:max-w-none">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

export function AuthCardHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-6">
      <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{title}</h1>
      {subtitle && <p className="text-base text-gray-500 mt-1">{subtitle}</p>}
    </div>
  );
}

export function BackLink({
  onClick,
  label = "Back",
}: {
  onClick?: () => void;
  label?: string;
}) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-6 transition-colors group"
    >
      <MoveLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
      {label}
    </button>
  );
}

export function CancelLink({
  onClick,
}: {
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
}) {
  return (
    <a
      href="#"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-6 transition-colors"
    >
      <X className="w-4 h-4" /> Cancel
    </a>
  );
}

export function Divider({ label = "or" }: { label?: string }) {
  return (
    <div className="flex items-center gap-3 my-5">
      <div className="flex-1 h-px bg-gray-200" />
      <span className="text-xs text-gray-400 font-medium uppercase tracking-wide">
        {label}
      </span>
      <div className="flex-1 h-px bg-gray-200" />
    </div>
  );
}

export function AlertBanner({
  message,
  type = "error",
}: {
  message: string;
  type?: "error" | "success";
}) {
  return (
    <div
      className={`rounded-xl px-4 py-3 text-sm font-medium mb-4 ${
        type === "error"
          ? "bg-red-50 text-red-700 border border-red-100"
          : "bg-green-50 text-green-700 border border-green-100"
      }`}
    >
      {message}
    </div>
  );
}
