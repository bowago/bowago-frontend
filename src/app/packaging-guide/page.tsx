"use client";

import Link from "next/link";
import Image from "next/image";
import {
  Package,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Info,
  Box,
  Shield,
  Cpu,
  GlassWater,
  Shirt,
  FileText,
  Frame,
  Droplets,
  Loader2,
} from "lucide-react";
import PublicHeader from "@/components/layout/PublicHeader";
import { useGetPackagingGuidesQuery, useGetPolicyQuery } from "@/store/slice/apiSlice";

// Icon lookup — the API only returns category + title, not an icon, so we
// keep a small title→icon map for known guide names and fall back to a
// sensible per-category default for anything a business admin adds later.
const TITLE_ICONS: Record<string, any> = {
  "Choose the Right Box": Box,
  "Cushioning & Protection": Shield,
  "Sealing Your Package": CheckCircle,
  Labelling: Package,
  Electronics: Cpu,
  Glassware: GlassWater,
  Clothing: Shirt,
  Documents: FileText,
  Artwork: Frame,
  Liquids: Droplets,
};
const CATEGORY_ICONS: Record<string, any> = {
  GENERAL: Box,
  FRAGILE: Shield,
  ELECTRONICS: Cpu,
  CLOTHING: Shirt,
  DANGEROUS_GOODS: XCircle,
};
const CATEGORY_ACCENTS: Record<string, string> = {
  GENERAL: "#3B82F6",
  FRAGILE: "#06B6D4",
  ELECTRONICS: "#3B82F6",
  CLOTHING: "#8B5CF6",
  DANGEROUS_GOODS: "#EF4444",
};

function iconFor(title: string, category: string) {
  return TITLE_ICONS[title] || CATEGORY_ICONS[category] || Info;
}

/** Guide bodies are stored as either a markdown-style bullet list
 * ("- item\n- item") or a single sentence. Split into an array either way
 * so the render logic doesn't need to care which. */
function bodyToItems(body: string): string[] {
  const lines = body.split("\n").map((l) => l.replace(/^-\s*/, "").trim()).filter(Boolean);
  return lines.length > 0 ? lines : [body];
}

export default function PackagingGuidePage() {
  const { data, isLoading } = useGetPackagingGuidesQuery();
  const { data: policyData } = useGetPolicyQuery({ key: "weight_discrepancy_policy" });

  const grouped: Record<string, any[]> = (data as any)?.data?.grouped ?? {};
  const dangerousGoods: any[] = (data as any)?.data?.dangerousGoods ?? [];
  const weightPolicy = (policyData as any)?.data?.policy?.body;

  // GENERAL category = the main step-by-step guidelines section
  const GUIDELINES = (grouped.GENERAL ?? [])
    .filter((g) => !g.isDangerous)
    .map((g) => ({ title: g.title, items: bodyToItems(g.body), icon: iconFor(g.title, g.category), accent: CATEGORY_ACCENTS.GENERAL }));

  // Everything else non-dangerous = special category tips
  const SPECIAL = Object.entries(grouped)
    .filter(([cat]) => cat !== "GENERAL" && cat !== "DANGEROUS_GOODS")
    .flatMap(([cat, guides]) =>
      (guides as any[])
        .filter((g) => !g.isDangerous)
        .map((g) => ({ name: g.title, tip: g.body, icon: iconFor(g.title, cat), accent: CATEGORY_ACCENTS[cat] || "#8B5CF6" })),
    );

  const PROHIBITED = dangerousGoods.map((g) => g.body || g.title);

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden">
      {/* ── Background glow ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute -top-40 -right-40 w-[700px] h-[700px] rounded-full"
          style={{
            background:
              "radial-gradient(circle, rgba(204,0,0,0.10) 0%, transparent 70%)",
          }}
        />
        <div
          className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full"
          style={{
            background:
              "radial-gradient(circle, rgba(204,0,0,0.06) 0%, transparent 70%)",
          }}
        />
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
            Pack Smart.
            <br />
            <span className="text-red-500">Ship Safe.</span>
          </h1>
          <p className="text-white/50 text-lg leading-relaxed">
            Properly packaged shipments arrive on time and intact. Follow these
            guidelines to protect your goods and avoid delays or damage claims.
          </p>
        </div>
      </section>

      {isLoading && (
        <div className="flex justify-center py-16">
          <Loader2 className="w-6 h-6 text-white/30 animate-spin" />
        </div>
      )}

      {/* ── Main guidelines ── */}
      {GUIDELINES.length > 0 && (
        <section className="py-10 px-4">
          <div className="max-w-3xl mx-auto space-y-5">
            {GUIDELINES.map((g) => {
              const Icon = g.icon;
              return (
                <div
                  key={g.title}
                  className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-6"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center"
                      style={{ background: g.accent + "22" }}
                    >
                      <Icon className="w-5 h-5" style={{ color: g.accent }} />
                    </div>
                    <h2 className="font-bold text-white text-lg">{g.title}</h2>
                  </div>
                  <ul className="space-y-2.5">
                    {g.items.map((item: string, i: number) => (
                      <li
                        key={i}
                        className="flex items-start gap-2.5 text-sm text-white/60"
                      >
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
      )}

      {/* ── Special categories ── */}
      {SPECIAL.length > 0 && (
        <section className="py-10 px-4 bg-white/[0.02]">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center gap-2 mb-6">
              <Info className="w-5 h-5 text-white/40" />
              <h2 className="text-xl font-bold text-white">Special Categories</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {SPECIAL.map((cat) => (
                <div
                  key={cat.name}
                  className="border border-white/10 rounded-xl p-4 bg-white/5 hover:bg-white/8 transition-colors"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center"
                      style={{ background: cat.accent + "22" }}
                    >
                      <cat.icon
                        className="w-4 h-4"
                        style={{ color: cat.accent }}
                      />
                    </div>
                    <h3 className="font-semibold text-white text-sm">
                      {cat.name}
                    </h3>
                  </div>
                  <p className="text-xs text-white/40 leading-relaxed">
                    {cat.tip}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Prohibited items ── */}
      {PROHIBITED.length > 0 && (
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
                Shipping prohibited items will result in immediate cancellation,
                seizure, and possible legal action.
              </p>
              <ul className="space-y-2">
                {PROHIBITED.map((item: string, i: number) => (
                  <li
                    key={i}
                    className="flex items-start gap-2.5 text-sm text-red-300/70"
                  >
                    <XCircle className="w-4 h-4 text-red-500/40 shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      )}

      {/* ── Weight policy ── */}
      {weightPolicy && (
        <section className="py-10 px-4 bg-white/[0.02]">
          <div className="max-w-3xl mx-auto">
            <div className="rounded-2xl border border-yellow-500/20 bg-yellow-500/5 p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-xl bg-yellow-500/20 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-yellow-400" />
                </div>
                <h2 className="font-bold text-white">
                  Weight Discrepancy Policy
                </h2>
              </div>
              <p className="text-sm text-white/50 leading-relaxed">
                {weightPolicy}
              </p>
            </div>
          </div>
        </section>
      )}

      {/* ── CTA ── */}
      <section className="py-16 px-4 text-center">
        <div className="max-w-md mx-auto space-y-4">
          <h2 className="text-2xl font-bold">Ready to ship?</h2>
          <p className="text-white/40 text-sm">
            Create your shipment now with confidence.
          </p>
          <div className="flex gap-3 justify-center">
            <Link
              href="/dashboard"
              className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-xl transition-colors"
            >
              Go to Dashboard
            </Link>
            <Link
              href="/track"
              className="px-6 py-2.5 border border-white/20 hover:border-white/40 text-sm font-semibold rounded-xl transition-colors"
            >
              Track a Shipment
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-white/10 py-8 px-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-white/30">
          <div className="flex items-center gap-3">
            <Image
              src="/bowago-logo.svg"
              alt="BowaGO"
              width={80}
              height={32}
              loading="eager"
            />
            <span>© {new Date().getFullYear()} BowaGO Logistics Ltd.</span>
          </div>
          <div className="flex items-center gap-6">
            <Link
              href="/auth/login"
              className="hover:text-white transition-colors"
            >
              Admin Portal
            </Link>
            <Link href="/track" className="hover:text-white transition-colors">
              Track Shipment
            </Link>
            <Link href="/faq" className="hover:text-white transition-colors">
              FAQ
            </Link>
            <Link
              href="/packaging-guide"
              className="hover:text-white transition-colors"
            >
              Packaging
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
