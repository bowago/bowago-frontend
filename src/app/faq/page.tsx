"use client";
import Link from "next/link";
import Image from "next/image";
import FAQAccordionView from "@/components/layout/FAQAccordionView";
import { ArrowLeft, HelpCircle } from "lucide-react";

export default function PublicFAQPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute -top-40 right-0 w-[600px] h-[600px] rounded-full"
          style={{
            background:
              "radial-gradient(circle, rgba(204,0,0,0.10) 0%, transparent 70%)",
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
        <div className="max-w-5xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
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
              href="/track"
              className="text-sm text-white/60 hover:text-white transition-colors hidden sm:block"
            >
              Track Shipment
            </Link>
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
      <div className="relative pt-28 pb-10 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-1.5 rounded-full text-xs text-white/60 mb-6">
            <HelpCircle className="w-3.5 h-3.5" />
            Help Centre
          </div>
          <h1 className="text-4xl md:text-5xl font-black mb-4 tracking-tight">
            Frequently Asked <span className="text-brand">Questions</span>
          </h1>
          <p className="text-white/50 text-lg max-w-xl mx-auto">
            Everything you need to know about BowaGO — pricing, tracking,
            shipping rules, and more.
          </p>
        </div>
      </div>

      {/* FAQ content */}
      <div className="relative px-4 pb-20">
        <div className="max-w-3xl mx-auto">
          <FAQAccordionView dark />
        </div>
      </div>

      {/* Still need help CTA */}
      <div className="relative px-4 pb-20">
        <div className="max-w-3xl mx-auto bg-white/5 border border-white/10 rounded-2xl p-8 text-center">
          <h3 className="text-xl font-bold mb-2">Still have questions?</h3>
          <p className="text-white/50 text-sm mb-6">
            Can't find the answer you're looking for? Our support team is ready
            to help.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/auth/login"
              className="inline-flex items-center justify-center gap-2 bg-brand hover:bg-red-700 text-white px-6 py-3 rounded-xl text-sm font-semibold transition-colors"
            >
              Open a Support Ticket
            </Link>
            <Link
              href="/track"
              className="inline-flex items-center justify-center gap-2 border border-white/20 hover:border-white/40 text-white/80 hover:text-white px-6 py-3 rounded-xl text-sm font-medium transition-colors"
            >
              Track Your Shipment
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-white/10 py-6 px-4">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-white/30">
          <span>© {new Date().getFullYear()} BowaGO Logistics Ltd.</span>
          <div className="flex items-center gap-5">
            <Link href="/" className="hover:text-white transition-colors">
              Home
            </Link>
            <Link href="/track" className="hover:text-white transition-colors">
              Track
            </Link>
            <Link
              href="/auth/login"
              className="hover:text-white transition-colors"
            >
              Admin Login
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
