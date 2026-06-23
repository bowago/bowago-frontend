"use client";
import { useState } from "react";
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
          style={{
            background:
              "radial-gradient(circle, rgba(204,0,0,0.12) 0%, transparent 70%)",
          }}
        />
        <div
          className="absolute bottom-0 -left-20 w-[500px] h-[500px] rounded-full"
          style={{
            background:
              "radial-gradient(circle, rgba(204,0,0,0.06) 0%, transparent 70%)",
          }}
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
            <Image
              src="/bowago-logo.svg"
              alt="BowaGO"
              width={100}
              height={40}
              loading="eager"
            />
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
            Real-time updates, route map, and full delivery timeline — enter
            your tracking number below.
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
            <Link href="/" className="hover:text-white transition-colors">
              Home
            </Link>
            <Link
              href="/auth/login"
              className="hover:text-white transition-colors"
            >
              Admin Login
            </Link>
            <Link
              href="/auth/signup"
              className="hover:text-white transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}


// ── Share Tracking Button ─────────────────────────────────────────────────────
function ShareTrackingButton({ trackingNumber }: { trackingNumber: string }) {
  const [copied, setCopied] = useState(false);
  const trackUrl = typeof window !== "undefined"
    ? `${window.location.origin}/track?q=${trackingNumber}`
    : `/track?q=${trackingNumber}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(trackUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleWhatsApp = () => {
    const msg = encodeURIComponent(`Track my BowaGO shipment (${trackingNumber}): ${trackUrl}`);
    window.open(`https://wa.me/?text=${msg}`, "_blank");
  };

  return (
    <div className="flex items-center gap-2 mt-4">
      <span className="text-xs text-gray-400 font-medium">Share:</span>
      <button
        onClick={handleWhatsApp}
        className="flex items-center gap-1.5 bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
      >
        <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="currentColor">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 00-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
        WhatsApp
      </button>
      <button
        onClick={handleCopy}
        className="flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
      >
        {copied ? "✓ Copied!" : "Copy Link"}
      </button>
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
