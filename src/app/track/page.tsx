"use client";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { TrackingForm } from "@/components/form/TrackerForm";
import Link from "next/link";
import Image from "next/image";
import { Package, Map, Bell, ArrowLeft, ArrowRight } from "lucide-react";

const features = [
  {
    icon: <Package className="w-5 h-5" />,
    title: "Real-Time Updates",
    desc: "Live status at every stage of your delivery journey",
  },
  {
    icon: <Map className="w-5 h-5" />,
    title: "Route Tracking",
    desc: "Interactive map showing your package's current location",
  },
  {
    icon: <Bell className="w-5 h-5" />,
    title: "Instant Alerts",
    desc: "Email and push notifications at every status change",
  },
];

function TrackPageInner() {
  const searchParams = useSearchParams();
  const prefill = searchParams.get("q") ?? "";

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute -top-40 -right-40 w-[700px] h-[700px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(204,0,0,0.12) 0%, transparent 70%)" }}
        />
        <div
          className="absolute bottom-0 -left-20 w-[500px] h-[500px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(204,0,0,0.06) 0%, transparent 70%)" }}
        />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <ArrowLeft className="w-4 h-4 text-white/40 group-hover:text-white/70 transition-colors" />
            <Image src="/bowago-logo.svg" alt="BowaGO" width={100} height={40} />
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/auth/login"
              className="text-sm text-white/60 hover:text-white transition-colors hidden sm:block"
            >
              Login
            </Link>
            <Link
              href="/auth/signup"
              className="bg-brand hover:bg-red-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <div className="relative pt-28 pb-12 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-1.5 rounded-full text-xs text-white/60 mb-6">
            <div className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse" />
            No login required
          </div>
          <h1 className="text-4xl md:text-6xl font-black leading-tight tracking-tight mb-4">
            Track Your <span className="text-brand">Shipment</span>
          </h1>
          <p className="text-white/50 text-lg max-w-xl mx-auto">
            Real-time updates, route map, and full delivery timeline — enter your tracking number below.
          </p>
        </div>
      </div>

      {/* Main tracker card */}
      <div className="relative px-4 pb-16">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white/5 border border-white/10 rounded-2xl md:rounded-3xl p-6 md:p-10 backdrop-blur-sm">
            <TrackingForm prefillTrackingId={prefill} dark />
          </div>
        </div>
      </div>

      {/* Feature pills */}
      <div className="px-4 pb-20">
        <div className="max-w-3xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4">
          {features.map((f) => (
            <div
              key={f.title}
              className="group bg-white/5 hover:bg-white/10 border border-white/10 hover:border-brand/30 rounded-2xl p-5 transition-all duration-300"
            >
              <div className="w-10 h-10 bg-brand/10 group-hover:bg-brand/20 rounded-xl flex items-center justify-center text-brand mb-3 transition-all">
                {f.icon}
              </div>
              <h3 className="font-bold text-white text-sm mb-1">{f.title}</h3>
              <p className="text-white/50 text-xs leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-white/10 py-6 px-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-white/30">
          <span>© {new Date().getFullYear()} BowaGO Logistics Ltd.</span>
          <div className="flex items-center gap-5">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <Link href="/auth/login" className="hover:text-white transition-colors">Admin Login</Link>
            <Link href="/auth/signup" className="hover:text-white transition-colors">Get Started</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function TrackPage() {
  return (
    <Suspense>
      <TrackPageInner />
    </Suspense>
  );
}
