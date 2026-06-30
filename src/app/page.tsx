"use client";
import FeaturedFAQs from "@/components/layout/FeaturedFAQs";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import {
  useGetCitiesQuery,
  useGetDimensionsQuery,
  useCreateQuoteMutation,
} from "@/store/slice/apiSlice";
import { saveShipmentDraft } from "@/lib/shipmentDraft";
import LandingAuthModal from "@/components/modals/LandingAuthModal";
import {
  Loader2,
  Truck,
  Shield,
  Clock,
  ChevronRight,
  ArrowRight,
  Package,
  MapPin,
  Zap,
  BarChart3,
  Globe,
  CheckCircle,
  ArrowDown,
  Search,
} from "lucide-react";

type City = { id: string; name: string; state: string };
type DimensionOption = {
  id: string;
  displayName: string;
  weightKgLimit: number;
  bestFor: string;
};

export default function LandingPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [trackingId, setTrackingId] = useState("");
  const [fromCity, setFromCity] = useState("");
  const [toCity, setToCity] = useState("");
  const [weight, setWeight] = useState("");
  const [boxDimensionId, setBoxDimensionId] = useState("");
  const [boxQuantity, setBoxQuantity] = useState("1");
  const [serviceType, setServiceType] = useState("STANDARD");
  const [quoteResult, setQuoteResult] = useState<any>(null);
  // Custom dimension toggle — hidden until the user explicitly opts in
  const [useCustomDimension, setUseCustomDimension] = useState(false);
  const [customLength, setCustomLength] = useState("");
  const [customWidth, setCustomWidth] = useState("");
  const [customHeight, setCustomHeight] = useState("");
  const [customWeight, setCustomWeight] = useState("");

  const user = useSelector((s: RootState) => s.auth.user) as any;
  const accessToken = useSelector((s: RootState) => s.auth.accessToken);
  const isAuthenticated = !!accessToken && !!user;
  const [authModalOpen, setAuthModalOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const { data: citiesData } = useGetCitiesQuery({});
  const cities: City[] = citiesData?.data?.cities ?? [];
  const { data: dimensionData } = useGetDimensionsQuery({});
  const dimensions: DimensionOption[] = dimensionData?.data?.dimensions ?? [];
  const [createQuote, { isLoading: quoting }] = useCreateQuoteMutation();

  const handleTrack = (e: React.FormEvent) => {
    e.preventDefault();
    if (trackingId.trim())
      router.push(`/track?q=${encodeURIComponent(trackingId.trim())}`);
  };

  const handleQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fromCity || !toCity) return;

    const isCustom = useCustomDimension && !boxDimensionId;
    if (
      isCustom &&
      (!customLength || !customWidth || !customHeight || !customWeight)
    )
      return;
    if (!isCustom && !boxDimensionId && !weight) return;

    try {
      const result = await createQuote({
        fromCity,
        toCity,
        weightKg: boxDimensionId
          ? 0
          : isCustom
            ? parseFloat(customWeight)
            : parseFloat(weight),
        tons: 0,
        cartons: boxDimensionId
          ? Math.max(1, parseInt(boxQuantity || "1", 10))
          : 1,
        boxDimensionId: isCustom ? undefined : boxDimensionId,
        customLength: isCustom ? parseFloat(customLength) : undefined,
        customWidth: isCustom ? parseFloat(customWidth) : undefined,
        customHeight: isCustom ? parseFloat(customHeight) : undefined,
        serviceType,
      }).unwrap();
      setQuoteResult((result as any)?.data?.quote ?? (result as any)?.data);
    } catch {}
  };

  const fmt = (n?: number) =>
    n != null ? `₦${Number(n).toLocaleString()}` : "—";

  const stats = [
    { value: "42+", label: "Cities", icon: <Globe className="w-5 h-5" /> },
    {
      value: "98%",
      label: "On-Time Delivery",
      icon: <CheckCircle className="w-5 h-5" />,
    },
    {
      value: "24/7",
      label: "Live Tracking",
      icon: <BarChart3 className="w-5 h-5" />,
    },
    { value: "100%", label: "Insured", icon: <Shield className="w-5 h-5" /> },
  ];

  const features = [
    {
      icon: <Truck className="w-6 h-6" />,
      title: "Door-to-Door",
      desc: "Pickup and delivery from any address across our Nigerian coverage zone",
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: "Express Options",
      desc: "Same-day and next-day delivery for time-critical shipments",
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Insured Cargo",
      desc: "Optional coverage up to declared value for high-value shipments",
    },
    {
      icon: <BarChart3 className="w-6 h-6" />,
      title: "B2B Contract Rates",
      desc: "Custom pricing for businesses shipping at volume or on contract",
    },
  ];

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden">
      {/* ── Navbar ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <Image
            src="/bowago-logo.svg"
            alt="BowaGO"
            width={110}
            height={44}
            className="flex-shrink-0"
          />
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-white/70">
            <a href="#quote" className="hover:text-white transition-colors">
              Quote
            </a>
            <a href="#track" className="hover:text-white transition-colors">
              Track
            </a>
            <a href="#features" className="hover:text-white transition-colors">
              Services
            </a>
            <Link href="/faq" className="hover:text-white transition-colors">
              FAQ
            </Link>
          </div>
          <div className="flex items-center gap-3">
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
                <span className="hidden sm:block text-sm font-medium text-white/90">
                  Dashboard
                </span>
              </Link>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className="text-sm text-white/70 hover:text-white transition-colors hidden sm:block"
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
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative pt-24 md:pt-32 pb-20 px-4 overflow-hidden">
        {/* Background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div
            className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full"
            style={{
              background:
                "radial-gradient(circle, rgba(204,0,0,0.15) 0%, transparent 70%)",
            }}
          />
          <div
            className="absolute top-1/2 -left-20 w-[400px] h-[400px] rounded-full"
            style={{
              background:
                "radial-gradient(circle, rgba(204,0,0,0.08) 0%, transparent 70%)",
            }}
          />
          {/* Grid lines */}
          <div
            className="absolute inset-0 opacity-5"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
              backgroundSize: "60px 60px",
            }}
          />
        </div>

        <div className="max-w-7xl mx-auto relative">
          {/* Badge */}
          <div
            className={`inline-flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2 rounded-full text-sm text-white/70 mb-8 transition-all duration-700 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
          >
            <div className="w-2 h-2 rounded-full bg-brand animate-pulse" />
            Fast, Reliable Nigerian Logistics
          </div>

          {/* Headline */}
          <div className="max-w-3xl mb-8">
            <h1
              className={`text-4xl md:text-6xl lg:text-7xl font-black leading-[1.05] tracking-tight mb-6 transition-all duration-700 delay-100 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
            >
              Ship Anywhere.
              <br />
              <span className="text-brand">Track Everything.</span>
            </h1>
            <p
              className={`text-lg md:text-xl text-white/60 max-w-xl leading-relaxed transition-all duration-700 delay-200 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
            >
              Express, standard, and economy shipping across Nigeria with
              transparent pricing and real-time tracking.
            </p>
          </div>

          {/* CTA buttons */}
          <div
            className={`flex flex-wrap gap-4 mb-16 transition-all duration-700 delay-300 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
          >
            <Link
              href="/auth/login"
              className="inline-flex items-center gap-2 bg-brand hover:bg-red-700 text-white px-6 py-3.5 rounded-xl font-bold text-sm transition-all hover:scale-105"
            >
              Book a Shipment <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="#track"
              className="inline-flex items-center gap-2 border border-white/20 hover:border-white/40 text-white/80 hover:text-white px-6 py-3.5 rounded-xl font-medium text-sm transition-all"
            >
              Track Package <Search className="w-4 h-4" />
            </a>
          </div>

          {/* Stats row */}
          <div
            className={`grid grid-cols-2 md:grid-cols-4 gap-4 transition-all duration-700 delay-400 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
          >
            {stats.map((s, i) => (
              <div
                key={s.label}
                className="bg-white/5 border border-white/10 rounded-2xl p-4 hover:bg-white/10 transition-all"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className="text-brand mb-2">{s.icon}</div>
                <div className="text-2xl font-black text-white">{s.value}</div>
                <div className="text-xs text-white/50 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="flex justify-center mt-16">
          <a
            href="#quote"
            className="flex flex-col items-center gap-2 text-white/30 hover:text-white/60 transition-colors animate-bounce"
          >
            <span className="text-xs tracking-wider uppercase">Scroll</span>
            <ArrowDown className="w-4 h-4" />
          </a>
        </div>
      </section>

      {/* ── Quote + Track ── */}
      <section id="quote" className="py-20 px-4 bg-[#0a0a0a]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-black mb-3">
              Instant <span className="text-brand">Quote</span> &{" "}
              <span className="text-brand">Tracking</span>
            </h2>
            <p className="text-white/50">
              Get a price in seconds or track your package — no signup required
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Quote card */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 md:p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-brand/20 rounded-xl flex items-center justify-center">
                  <Package className="w-5 h-5 text-brand" />
                </div>
                <div>
                  <h3 className="font-bold text-white">Instant Quote</h3>
                  <p className="text-xs text-white/50">
                    Calculate shipping cost instantly
                  </p>
                </div>
              </div>

              <form onSubmit={handleQuote} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  {[
                    {
                      label: "From City",
                      value: fromCity,
                      setter: setFromCity,
                    },
                    { label: "To City", value: toCity, setter: setToCity },
                  ].map(({ label, value, setter }) => (
                    <div key={label}>
                      <label className="block text-xs text-white/50 mb-1.5">
                        {label}
                      </label>
                      <select
                        value={value}
                        onChange={(e) => setter(e.target.value)}
                        required
                        className="w-full bg-white/10 border border-white/20 text-white rounded-xl px-3 py-2.5 text-sm focus:border-brand/60 focus:bg-white/15 transition-all [&>option]:bg-gray-900 [&>option]:text-white"
                      >
                        <option value="">Select city</option>
                        {cities.map((c) => (
                          <option key={c.id} value={c.name}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between border-2 border-white/15 rounded-xl px-3 py-2.5 bg-white/5">
                  <label className="block text-xs text-white/70 font-medium">
                    Package Size
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setUseCustomDimension((v) => !v);
                      setBoxDimensionId("");
                    }}
                    className="text-[11px] text-brand hover:text-red-400 font-bold transition-colors underline underline-offset-2"
                  >
                    {useCustomDimension
                      ? "Use a predefined box instead"
                      : "Enter custom dimensions instead"}
                  </button>
                </div>

                {!useCustomDimension && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-white/50 mb-1.5">
                        Box Type (optional)
                      </label>
                      <select
                        value={boxDimensionId}
                        onChange={(e) => setBoxDimensionId(e.target.value)}
                        className="w-full bg-white/10 border border-white/20 text-white rounded-xl px-3 py-2.5 text-sm focus:border-brand/60 transition-all [&>option]:bg-gray-900 [&>option]:text-white"
                      >
                        <option value="">No box — enter weight</option>
                        {dimensions.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.displayName} (max {d.weightKgLimit}kg ·{" "}
                            {d.bestFor})
                          </option>
                        ))}
                      </select>
                    </div>
                    {boxDimensionId ? (
                      <div>
                        <label className="block text-xs text-white/50 mb-1.5">
                          Number of Boxes
                        </label>
                        <input
                          type="number"
                          step="1"
                          min="1"
                          value={boxQuantity}
                          onChange={(e) => setBoxQuantity(e.target.value)}
                          placeholder="e.g. 1"
                          required
                          className="w-full bg-white/10 border border-white/20 text-white placeholder-white/30 rounded-xl px-3 py-2.5 text-sm focus:border-brand/60 transition-all"
                        />
                      </div>
                    ) : (
                      <div>
                        <label className="block text-xs text-white/50 mb-1.5">
                          Weight (kg)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          min="0.1"
                          value={weight}
                          onChange={(e) => setWeight(e.target.value)}
                          placeholder="e.g. 5"
                          required
                          className="w-full bg-white/10 border border-white/20 text-white placeholder-white/30 rounded-xl px-3 py-2.5 text-sm focus:border-brand/60 transition-all"
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Custom dimensions — hidden until the user toggles this on */}
                {useCustomDimension && (
                  <div className="grid grid-cols-2 gap-3 border-2 border-brand/40 bg-brand/10 rounded-xl p-3">
                    <div>
                      <label className="block text-xs text-white/50 mb-1.5">
                        Weight (kg)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        min="0.1"
                        value={customWeight}
                        onChange={(e) => setCustomWeight(e.target.value)}
                        placeholder="e.g. 5"
                        required
                        className="w-full bg-white/10 border border-white/20 text-white placeholder-white/30 rounded-xl px-3 py-2.5 text-sm focus:border-brand/60 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-white/50 mb-1.5">
                        Length (cm)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        min="0.1"
                        value={customLength}
                        onChange={(e) => setCustomLength(e.target.value)}
                        placeholder="e.g. 40"
                        required
                        className="w-full bg-white/10 border border-white/20 text-white placeholder-white/30 rounded-xl px-3 py-2.5 text-sm focus:border-brand/60 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-white/50 mb-1.5">
                        Width (cm)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        min="0.1"
                        value={customWidth}
                        onChange={(e) => setCustomWidth(e.target.value)}
                        placeholder="e.g. 30"
                        required
                        className="w-full bg-white/10 border border-white/20 text-white placeholder-white/30 rounded-xl px-3 py-2.5 text-sm focus:border-brand/60 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-white/50 mb-1.5">
                        Height (cm)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        min="0.1"
                        value={customHeight}
                        onChange={(e) => setCustomHeight(e.target.value)}
                        placeholder="e.g. 20"
                        required
                        className="w-full bg-white/10 border border-white/20 text-white placeholder-white/30 rounded-xl px-3 py-2.5 text-sm focus:border-brand/60 transition-all"
                      />
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-white/50 mb-1.5">
                      Service
                    </label>
                    <select
                      value={serviceType}
                      onChange={(e) => setServiceType(e.target.value)}
                      className="w-full bg-white/10 border border-white/20 text-white rounded-xl px-3 py-2.5 text-sm focus:border-brand/60 transition-all [&>option]:bg-gray-900"
                    >
                      <option value="STANDARD">Standard</option>
                      <option value="EXPRESS">Express</option>
                      <option value="ECONOMY">Economy</option>
                    </select>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={quoting}
                  className="w-full bg-brand hover:bg-red-700 text-white py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-60 hover:scale-[1.02]"
                >
                  {quoting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Zap className="w-4 h-4" />
                  )}
                  {quoting ? "Calculating..." : "Get Instant Quote"}
                </button>
              </form>

              {/* Quote result */}
              {quoteResult && (
                <div className="mt-5 bg-brand/10 border border-brand/30 rounded-xl p-5">
                  <div className="text-center mb-4">
                    <p className="text-xs text-white/50 uppercase tracking-wide">
                      Estimated Price
                    </p>
                    <p className="text-3xl font-black text-brand mt-1">
                      {fmt(
                        quoteResult.pricing?.totalNaira ?? quoteResult.total,
                      )}
                    </p>
                    {quoteResult.zone && (
                      <p className="text-xs text-white/40 mt-1">
                        Zone {quoteResult.zone} ·{" "}
                        {quoteResult.distanceKm?.toLocaleString()} km
                      </p>
                    )}
                    {/* Gap 2: show pricing mode badge for enterprise/promo users */}
                    {quoteResult.pricingMode &&
                      quoteResult.pricingMode !== "STANDARD" && (
                        <span
                          className={`inline-block mt-2 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                            quoteResult.pricingMode === "CONTRACT"
                              ? "bg-green-500/20 text-green-400"
                              : "bg-yellow-500/20 text-yellow-400"
                          }`}
                        >
                          {quoteResult.pricingMode === "CONTRACT"
                            ? "Enterprise Rate Applied"
                            : "Promo Rate Applied"}
                        </span>
                      )}
                  </div>

                  {/* Gap 1: always show Base Price line item, then surcharges */}
                  <div className="space-y-1 mb-3">
                    {/* Base price — derived from breakdown or pricing struct */}
                    {(quoteResult.breakdown?.finalBasePrice != null ||
                      quoteResult.pricing?.basePriceNaira != null) && (
                      <div className="flex justify-between text-xs text-white/60 py-1 border-b border-white/10">
                        <span>Base Price</span>
                        <span>
                          {fmt(
                            quoteResult.pricing?.basePriceNaira ??
                              quoteResult.breakdown?.finalBasePrice,
                          )}
                        </span>
                      </div>
                    )}
                    {/* Surcharge line items from DB (FUEL, VAT, etc.) */}
                    {quoteResult.surchargeBreakdown?.map((s: any) => (
                      <div
                        key={s.label}
                        className="flex justify-between text-xs text-white/60 py-1"
                      >
                        <span>{s.label}</span>
                        <span>{fmt(s.amount)}</span>
                      </div>
                    ))}
                    {/* Applied discount if any */}
                    {quoteResult.appliedDiscount && (
                      <div className="flex justify-between text-xs text-green-400 py-1">
                        <span>
                          {quoteResult.appliedDiscount.label ?? "Discount"}
                        </span>
                        <span>
                          -
                          {fmt(
                            quoteResult.appliedDiscount.discountAmount ??
                              quoteResult.appliedDiscount.amount,
                          )}
                        </span>
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const isCustom = useCustomDimension && !boxDimensionId;
                      saveShipmentDraft({
                        fromCity,
                        toCity,
                        serviceType,
                        boxSize: isCustom
                          ? undefined
                          : boxDimensionId || undefined,
                        weight: boxDimensionId
                          ? undefined
                          : isCustom
                            ? parseFloat(customWeight) || undefined
                            : parseFloat(weight) || undefined,
                        length: isCustom
                          ? parseFloat(customLength) || undefined
                          : undefined,
                        width: isCustom
                          ? parseFloat(customWidth) || undefined
                          : undefined,
                        height: isCustom
                          ? parseFloat(customHeight) || undefined
                          : undefined,
                        cartons: boxDimensionId
                          ? parseInt(boxQuantity || "1", 10)
                          : undefined,
                        isCustomDimension: isCustom,
                      });
                      if (isAuthenticated) {
                        router.push("/dashboard/shipments?openCreate=1");
                      } else {
                        setAuthModalOpen(true);
                      }
                    }}
                    className="mt-4 w-full inline-flex items-center justify-center gap-2 bg-brand hover:bg-red-700 text-white py-2.5 rounded-xl text-sm font-bold transition-all"
                  >
                    Book This Shipment <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Track card */}
            <div
              id="track"
              className="bg-white/5 border border-white/10 rounded-2xl p-6 md:p-8 flex flex-col"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-brand/20 rounded-xl flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-brand" />
                </div>
                <div>
                  <h3 className="font-bold text-white">Track Shipment</h3>
                  <p className="text-xs text-white/50">
                    Real-time updates, no login required
                  </p>
                </div>
              </div>

              <form onSubmit={handleTrack} className="space-y-4 flex-1">
                <div>
                  <label className="block text-xs text-white/50 mb-1.5">
                    Tracking Number
                  </label>
                  <input
                    type="text"
                    value={trackingId}
                    onChange={(e) => setTrackingId(e.target.value)}
                    placeholder="e.g. BWG-ABC123456"
                    required
                    className="w-full bg-white/10 border border-white/20 text-white placeholder-white/30 rounded-xl px-3 py-2.5 text-sm focus:border-brand/60 transition-all"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-white/10 hover:bg-white/20 border border-white/20 text-white py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2"
                >
                  <Search className="w-4 h-4" />
                  Track Package
                </button>
              </form>

              <div className="mt-6 pt-6 border-t border-white/10">
                <p className="text-sm text-white/40 mb-3">
                  Full tracking with map view:
                </p>
                <Link
                  href="/track"
                  className="inline-flex items-center gap-2 text-brand hover:text-red-400 text-sm font-medium transition-colors"
                >
                  Open Tracking Portal <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="py-20 px-4 bg-black">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-black mb-3">
              Why Choose <span className="text-brand">BowaGO</span>?
            </h2>
            <p className="text-white/50 max-w-lg mx-auto">
              Built for Nigerian businesses that need fast, reliable, and
              transparent logistics
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {features.map((f, i) => (
              <div
                key={f.title}
                className="group bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 hover:border-brand/30 transition-all duration-300"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className="w-12 h-12 bg-brand/10 group-hover:bg-brand/20 rounded-xl flex items-center justify-center mb-4 text-brand transition-all">
                  {f.icon}
                </div>
                <h3 className="font-bold text-white mb-2">{f.title}</h3>
                <p className="text-sm text-white/50 leading-relaxed">
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ Preview ── */}
      <section className="py-16 px-4 bg-[#0a0a0a]">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-end justify-between mb-10">
            <div>
              <h2 className="text-3xl md:text-4xl font-black mb-2">
                Common <span className="text-brand">Questions</span>
              </h2>
              <p className="text-white/50">
                Quick answers to what people ask most
              </p>
            </div>
            <Link
              href="/faq"
              className="hidden md:inline-flex items-center gap-2 text-sm text-brand hover:text-red-400 font-semibold transition-colors"
            >
              View all FAQs <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <FeaturedFAQs />

          <div className="text-center md:hidden">
            <Link
              href="/faq"
              className="inline-flex items-center gap-2 text-sm text-brand font-semibold"
            >
              View all FAQs <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Testimonials & Certifications ── */}
      <section className="py-16 px-4 bg-black">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-black mb-2">
              Trusted by <span className="text-brand">Businesses</span>
            </h2>
            <p className="text-white/50">What our customers say about BowaGO</p>
          </div>

          {/* Testimonial cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-14">
            {[
              {
                name: "Adaeze Okonkwo",
                role: "E-commerce Owner, Lagos",
                quote:
                  "BowaGO transformed our fulfillment. Real-time tracking and instant quotes save us hours every week. Our customers love the transparency.",
                rating: 5,
              },
              {
                name: "Emeka Nwosu",
                role: "Operations Manager, Abuja",
                quote:
                  "Switching to BowaGO cut our logistics costs by 20%. The zone-based pricing is fair and the delivery SLAs are actually met. Highly recommended.",
                rating: 5,
              },
              {
                name: "Fatima Aliyu",
                role: "Small Business Owner, Kano",
                quote:
                  "As a small business, I needed reliability. BowaGO gives me peace of mind — packages arrive on time and I can track every step from my phone.",
                rating: 5,
              },
            ].map((t) => (
              <div
                key={t.name}
                className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-brand/30 transition-all"
              >
                <div className="flex gap-0.5 mb-4">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <span key={i} className="text-yellow-400 text-sm">
                      ★
                    </span>
                  ))}
                </div>
                <p className="text-white/70 text-sm leading-relaxed mb-5">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-brand/20 flex items-center justify-center text-brand font-bold text-sm">
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-white text-sm font-semibold">{t.name}</p>
                    <p className="text-white/40 text-xs">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Certifications & trust badges */}
          <div className="border-t border-white/10 pt-10">
            <p className="text-center text-white/30 text-xs uppercase tracking-widest mb-6">
              Certifications & Compliance
            </p>
            <div className="flex flex-wrap items-center justify-center gap-6 md:gap-10">
              {[
                { label: "CAC Registered", sub: "RC 7654321" },
                { label: "Paystack Secured", sub: "PCI-DSS Compliant" },
                { label: "NIPOST Compliant", sub: "Licensed Courier" },
                { label: "SSL Encrypted", sub: "256-bit TLS" },
              ].map((badge) => (
                <div
                  key={badge.label}
                  className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5"
                >
                  <div className="w-6 h-6 rounded-full bg-brand/20 flex items-center justify-center">
                    <span className="text-brand text-xs">✓</span>
                  </div>
                  <div>
                    <p className="text-white/80 text-xs font-semibold">
                      {badge.label}
                    </p>
                    <p className="text-white/30 text-[10px]">{badge.sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-20 px-4 relative overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse at center, rgba(204,0,0,0.15) 0%, transparent 70%)",
          }}
        />
        <div className="max-w-3xl mx-auto text-center relative">
          <h2 className="text-3xl md:text-5xl font-black mb-4 leading-tight">
            Ready to ship <span className="text-brand">smarter</span>?
          </h2>
          <p className="text-white/50 mb-10 text-lg">
            Join thousands of businesses using BowaGO for fast, transparent
            Nigerian logistics.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/auth/signup"
              className="inline-flex items-center justify-center gap-2 bg-brand hover:bg-red-700 text-white px-8 py-4 rounded-xl font-bold text-base transition-all hover:scale-105"
            >
              Create Free Account <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/auth/login"
              className="inline-flex items-center justify-center gap-2 border border-white/20 hover:border-white/40 text-white/80 hover:text-white px-8 py-4 rounded-xl font-medium text-base transition-all"
            >
              Sign In
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
              href="/auth/signup"
              className="hover:text-white transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>
      </footer>

      <LandingAuthModal isOpen={authModalOpen} setIsOpen={setAuthModalOpen} />
    </div>
  );
}
