"use client";

import Link from "next/link";
import Image from "next/image";
import { Package, AlertTriangle, CheckCircle, XCircle, Info, Box, Shield } from "lucide-react";
import PublicHeader from "@/components/layout/PublicHeader";

const GUIDELINES = [
  {
    title: "Choose the Right Box",
    icon: Box,
    accent: "#3B82F6",
    items: [
      "Use a new, sturdy corrugated cardboard box.",
      "The box should be 2–3 inches larger than your item on all sides for cushioning.",
      "Never reuse damaged, wet, or weakened boxes.",
      "Use BowaGO standard boxes for guaranteed handling compatibility.",
    ],
  },
  {
    title: "Cushioning & Protection",
    icon: Shield,
    accent: "#10B981",
    items: [
      "Wrap individual items in at least 5 cm of bubble wrap.",
      "Fill all empty space with foam peanuts, air pillows, or crumpled paper.",
      "Fragile items: double-box with 7 cm cushioning between boxes.",
      "Items must not shift when the sealed box is shaken.",
      "Electronics: use anti-static bubble wrap and original packaging where possible.",
    ],
  },
  {
    title: "Sealing Your Package",
    icon: CheckCircle,
    accent: "#F59E0B",
    items: [
      "Use the H-tape method: tape all seams including edges and corners.",
      "Use pressure-sensitive tape at least 5 cm wide.",
      "Never use string, rope, masking tape, or thin cellophane tape.",
      "Apply at least 3 strips of tape over the opening seam.",
    ],
  },
  {
    title: "Labelling",
    icon: Package,
    accent: "#8B5CF6",
    items: [
      "Place the shipping label on the largest flat surface of the box.",
      "Never place labels over seams, tape, or corners.",
      "Include a secondary label inside in case the outer one is damaged.",
      "Remove or cover all old labels and barcodes from reused boxes.",
    ],
  },
];

const SPECIAL = [
  { name: "Electronics",       icon: "💻", tip: "Anti-static wrap. 5 cm cushioning on all sides. Declare value for insurance. Mark 'FRAGILE – ELECTRONICS'." },
  { name: "Glassware",         icon: "🫙", tip: "Wrap each piece individually. Use cell dividers. Double-box with 7 cm cushioning. Mark 'FRAGILE – GLASS'." },
  { name: "Clothing",          icon: "👕", tip: "Poly mailers for soft goods. Seal in plastic bag inside box to protect against moisture." },
  { name: "Documents",         icon: "📄", tip: "Rigid cardboard envelopes. Never fold important documents. Mark 'DO NOT BEND'." },
  { name: "Artwork",           icon: "🖼️", tip: "Corner protectors on frames. Wrap in glassine paper before bubble wrap. Use art shipping box." },
  { name: "Liquids",           icon: "🧴", tip: "Leak-proof primary container. Wrap in absorbent material. Seal in plastic bag. Mark 'THIS SIDE UP'." },
];

const PROHIBITED = [
  "Explosives, fireworks, and flammable substances",
  "Illegal drugs and narcotics",
  "Live animals (unless pre-approved with documentation)",
  "Perishable foods without prior approval",
  "Cash or negotiable instruments without declared value and insurance",
  "Lithium batteries exceeding airline transport limits",
  "Weapons, firearms, and ammunition without proper licensing",
  "Human remains without proper documentation",
  "Counterfeit or copyright-infringing materials",
];

export default function PackagingGuidePage() {
  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden">

      {/* ── Background glow ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-[700px] h-[700px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(204,0,0,0.10) 0%, transparent 70%)" }} />
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(204,0,0,0.06) 0%, transparent 70%)" }} />
      </div>

      <PublicHeader />

      {/* ── Hero ── */}
      <section className="pt-32 pb-16 px-4 text-center relative">
        <div className="max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-white/50 mb-6">
            <Package className="w-3.5 h-3.5" />
            PACKAGING GUIDELINES
          </div>
          <h1 className="text-4xl md:text-5xl font-black mb-4 leading-tight">
            Pack Smart.<br />
            <span className="text-red-500">Ship Safe.</span>
          </h1>
          <p className="text-white/50 text-lg leading-relaxed">
            Properly packaged shipments arrive on time and intact.
            Follow these guidelines to protect your goods and avoid delays or damage claims.
          </p>
        </div>
      </section>

      {/* ── Main guidelines ── */}
      <section className="py-10 px-4">
        <div className="max-w-3xl mx-auto space-y-5">
          {GUIDELINES.map((g) => {
            const Icon = g.icon;
            return (
              <div key={g.title}
                className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{ background: g.accent + "22" }}>
                    <Icon className="w-5 h-5" style={{ color: g.accent }} />
                  </div>
                  <h2 className="font-bold text-white text-lg">{g.title}</h2>
                </div>
                <ul className="space-y-2.5">
                  {g.items.map((item, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-white/60">
                      <CheckCircle className="w-4 h-4 text-white/20 shrink-0 mt-0.5" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Special categories ── */}
      <section className="py-10 px-4 bg-white/[0.02]">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-2 mb-6">
            <Info className="w-5 h-5 text-white/40" />
            <h2 className="text-xl font-bold text-white">Special Categories</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {SPECIAL.map((cat) => (
              <div key={cat.name}
                className="border border-white/10 rounded-xl p-4 bg-white/5 hover:bg-white/8 transition-colors">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">{cat.icon}</span>
                  <h3 className="font-semibold text-white text-sm">{cat.name}</h3>
                </div>
                <p className="text-xs text-white/40 leading-relaxed">{cat.tip}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Prohibited items ── */}
      <section className="py-10 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl bg-red-500/20 flex items-center justify-center">
                <XCircle className="w-5 h-5 text-red-400" />
              </div>
              <h2 className="font-bold text-white text-lg">Prohibited Items</h2>
            </div>
            <p className="text-sm text-white/40 mb-4">
              Shipping prohibited items will result in immediate cancellation, seizure, and possible legal action.
            </p>
            <ul className="space-y-2">
              {PROHIBITED.map((item, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm text-red-300/70">
                  <XCircle className="w-4 h-4 text-red-500/40 shrink-0 mt-0.5" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ── Weight policy ── */}
      <section className="py-10 px-4 bg-white/[0.02]">
        <div className="max-w-3xl mx-auto">
          <div className="rounded-2xl border border-yellow-500/20 bg-yellow-500/5 p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-xl bg-yellow-500/20 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-yellow-400" />
              </div>
              <h2 className="font-bold text-white">Weight Discrepancy Policy</h2>
            </div>
            <p className="text-sm text-white/50 leading-relaxed">
              If the actual weight or dimensions differ from what was declared at booking, your shipment
              is placed on hold. You have 24 hours to pay any additional charges before the shipment
              is automatically cancelled.
            </p>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-16 px-4 text-center">
        <div className="max-w-md mx-auto space-y-4">
          <h2 className="text-2xl font-bold">Ready to ship?</h2>
          <p className="text-white/40 text-sm">Create your shipment now with confidence.</p>
          <div className="flex gap-3 justify-center">
            <Link href="/dashboard"
              className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-xl transition-colors">
              Go to Dashboard
            </Link>
            <Link href="/track"
              className="px-6 py-2.5 border border-white/20 hover:border-white/40 text-sm font-semibold rounded-xl transition-colors">
              Track a Shipment
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-white/10 py-8 px-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-white/30">
          <div className="flex items-center gap-3">
            <Image src="/bowago-logo.svg" alt="BowaGO" width={80} height={32} loading="eager" />
            <span>© {new Date().getFullYear()} BowaGO Logistics Ltd.</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/auth/login" className="hover:text-white transition-colors">Admin Portal</Link>
            <Link href="/track" className="hover:text-white transition-colors">Track Shipment</Link>
            <Link href="/faq" className="hover:text-white transition-colors">FAQ</Link>
            <Link href="/packaging-guide" className="hover:text-white transition-colors">Packaging</Link>
            <Link href="/auth/signup" className="hover:text-white transition-colors">Get Started</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
