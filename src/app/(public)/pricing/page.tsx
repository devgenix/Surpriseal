"use client";

import { useState } from "react";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import Container from "@/components/ui/Container";
import { useCurrency } from "@/context/CurrencyContext";
import CallToAction from "@/components/landing/CallToAction";
import { PLANS, ADDONS } from "@/lib/constants/pricing";
import { formatPrice } from "@/lib/currency";

const basePlan = PLANS.find(p => p.id === "base")!;
const premiumPlan = PLANS.find(p => p.id === "premium")!;
const addons = ADDONS;

export default function PricingPage() {
  const { formattedPrice, currency, isLoading } = useCurrency();
  const [selectedPlanId, setSelectedPlanId] = useState<"base" | "premium">("base");

  const currentPlan = selectedPlanId === "base" ? basePlan : premiumPlan;

  return (
    <div className="relative">
      {/* Background grid + glow */}
      <div
        className="absolute inset-0 z-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundSize: "40px 40px",
          backgroundImage:
            "radial-gradient(circle, #e64c19 1px, transparent 1px)",
        }}
      />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-primary/5 rounded-full blur-3xl -z-10" />

      {/* Hero */}
      <Container className="py-12 md:py-24 text-center z-10 relative flex flex-col items-center">
        <h1 className="text-3xl md:text-6xl font-black text-[#1b110e] leading-[1.1] mb-6 tracking-tight px-4 md:px-0">
          Simple, Intentional{" "}
          <br className="hidden md:block" />
          <span className="text-primary relative inline-block">
            Pricing
            <svg
              className="absolute w-full h-3 -bottom-1 left-0 text-primary opacity-20"
              fill="none"
              viewBox="0 0 200 9"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M2.00025 6.99997C25.7501 2.99999 83.2265 -2.48625 197.997 1.99999"
                stroke="currentColor"
                strokeLinecap="round"
                strokeWidth="3"
              />
            </svg>
          </span>
        </h1>

        <p className="text-base md:text-lg text-[#97604e] max-w-xl mx-auto leading-relaxed px-6 md:px-0 mb-12">
          One perfect package to craft unforgettable digital memories. No hidden
          fees, just pure joy delivered beautifully.
        </p>

        {/* Plan Toggle */}
        <div className="flex p-1 bg-[#f3eae7] rounded-xl mb-8">
          <button
            onClick={() => setSelectedPlanId("base")}
            className={cn(
              "px-6 py-2 rounded-lg text-sm font-bold transition-all",
              selectedPlanId === "base" ? "bg-white text-[#1b110e] shadow-sm" : "text-[#97604e] hover:text-[#1b110e]"
            )}
          >
            Base Plan
          </button>
          <button
            onClick={() => setSelectedPlanId("premium")}
            className={cn(
              "px-6 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2",
              selectedPlanId === "premium" ? "bg-white text-[#1b110e] shadow-sm" : "text-[#97604e] hover:text-[#1b110e]"
            )}
          >
            Premium Upgrade
            <Sparkles className="h-3.5 w-3.5 text-primary" />
          </button>
        </div>
      </Container>

      {/* Pricing + Add-ons Grid */}
      <Container className="pb-24 z-10 relative">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">

          {/* LEFT — Sticky Pricing Card */}
          <div className="md:col-span-7 lg:col-span-8 md:sticky md:top-24 max-w-2xl">
              {/* Glow border */}
              <div className="relative group">
                {selectedPlanId === "premium" && (
                  <div className="absolute -inset-1 bg-gradient-to-r from-primary via-[#ff8c69] to-primary rounded-2xl blur opacity-30 animate-pulse duration-3000" />
                )}
                <div className={cn(
                  "absolute -inset-1 rounded-2xl blur opacity-20 group-hover:opacity-35 transition duration-700",
                  selectedPlanId === "premium" ? "bg-primary" : "bg-[#f3eae7]"
                )} />

                <div className="relative bg-white rounded-2xl p-6 md:p-10 border border-[#f3eae7] shadow-[0_20px_40px_-10px_rgba(230,76,25,0.1)] flex flex-col h-full animate-in fade-in zoom-in-95 duration-500">
                  {/* Card header */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                    <div>
                      <h2 className="text-xl md:text-2xl font-bold text-[#1b110e] flex items-center gap-2">
                        {currentPlan.title}
                        {selectedPlanId === "premium" && <Sparkles className="h-5 w-5 text-primary" />}
                      </h2>
                      <p className="text-[#97604e] text-xs md:text-sm mt-1">
                        {currentPlan.description}
                      </p>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="flex items-baseline flex-wrap gap-2 md:gap-3 mb-8 border-b border-[#f3eae7] pb-8">
                    <span className="text-xs md:text-sm text-[#97604e] font-medium">
                      {selectedPlanId === "base" ? "starts from" : "all-inclusive for"}
                    </span>
                    <span
                      className={`text-4xl md:text-5xl font-black text-[#1b110e] tracking-tight transition-opacity duration-300 ${
                        isLoading ? "opacity-0" : "opacity-100"
                      }`}
                    >
                      {formatPrice(currentPlan.price[currency], currency)}
                    </span>
                    <span className="text-xs md:text-sm text-[#97604e]">
                      per celebration
                    </span>
                  </div>

                  {/* Features */}
                  <div className="flex-grow space-y-5 mb-10">
                    {currentPlan.features.map((f) => (
                      <div key={f.title} className="flex items-start gap-4">
                        <div className={cn(
                          "flex-shrink-0 h-6 w-6 rounded-full flex items-center justify-center transition-colors",
                          selectedPlanId === "premium" ? "bg-primary/10 text-primary" : "bg-green-100 text-green-600"
                        )}>
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                            className="h-3.5 w-3.5"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                        <div>
                          <p className="font-bold text-[#1b110e] text-sm">
                            {f.title}
                          </p>
                          {f.desc && <p className="text-xs text-[#97604e] mt-0.5">{f.desc}</p>}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* CTA */}
                  <Link
                    href="/dashboard/create"
                    className="w-full py-4 rounded-lg bg-primary hover:bg-primary/90 text-white text-base font-bold shadow-lg shadow-primary/25 transition-all hover:-translate-y-0.5 flex items-center justify-center gap-2"
                  >
                    {selectedPlanId === "base" ? "Start with Base" : "Get the Premium Pass"}
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="h-5 w-5"
                    >
                      <path
                        fillRule="evenodd"
                        d="M3 10a.75.75 0 0 1 .75-.75h10.638L10.23 5.29a.75.75 0 1 1 1.04-1.08l5.5 5.25a.75.75 0 0 1 0 1.08l-5.5 5.25a.75.75 0 1 1-1.04-1.08l4.158-3.96H3.75A.75.75 0 0 1 3 10Z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </Link>
                </div>
              </div>
          </div>

          {/* RIGHT — Add-ons (natural page scroll, left card stays sticky) */}
          <div className={cn(
            "md:col-span-5 lg:col-span-4 max-w-xl transition-all duration-500",
            selectedPlanId === "premium" ? "opacity-40 grayscale-[0.5] pointer-events-none" : "opacity-100"
          )}>
            <div className="space-y-6">

              <div className="px-1">
                <h3 className="text-lg font-bold text-[#1b110e] mb-2">
                  Enhance your surprise
                </h3>
                <p className="text-sm text-[#97604e]">
                  {selectedPlanId === "premium" 
                    ? "All add-ons below are included with your Premium Upgrade."
                    : "Customize your experience with these optional extras at checkout."}
                </p>
              </div>

              {/* Add-on: Extended Hosting */}
              <div className="bg-white p-6 rounded-xl border border-[#e7d6d0] hover:border-primary/50 transition-colors cursor-pointer group">
                <div className="flex items-center gap-4 mb-3">
                  <div className="h-10 w-10 rounded-lg bg-orange-50 text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="h-5 w-5"
                    >
                      <path
                        fillRule="evenodd"
                        d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25ZM12.75 6a.75.75 0 0 0-1.5 0v6c0 .414.336.75.75.75h4.5a.75.75 0 0 0 0-1.5h-3.75V6Z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-bold text-[#1b110e] text-sm">
                      {addons[0].title}
                    </h4>
                    <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded">
                      {addons[0].badge}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-[#97604e] mb-3 leading-relaxed">
                  {addons[0].description}
                </p>
                <div className="flex items-center justify-between border-t border-dashed border-[#e7d6d0] pt-3">
                  <span className="text-xs font-semibold text-[#97604e]">
                    Add for only
                  </span>
                  <span className="text-sm font-bold text-[#1b110e]">
                    {formatPrice(addons[0].price[currency], currency)}
                  </span>
                </div>
              </div>

              {/* Add-on: Extra Media */}
              <div className="bg-white p-6 rounded-xl border border-[#e7d6d0] hover:border-primary/50 transition-colors cursor-pointer group">
                <div className="flex items-center gap-4 mb-3">
                  <div className="h-10 w-10 rounded-lg bg-orange-50 text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="h-5 w-5"
                    >
                      <path
                        fillRule="evenodd"
                        d="M11.47 2.47a.75.75 0 0 1 1.06 0l4.5 4.5a.75.75 0 0 1-1.06 1.06l-3.22-3.22V16.5a.75.75 0 0 1-1.5 0V4.81L8.03 8.03a.75.75 0 0 1-1.06-1.06l4.5-4.5ZM3 15.75a.75.75 0 0 1 .75.75v2.25a1.5 1.5 0 0 0 1.5 1.5h13.5a1.5 1.5 0 0 0 1.5-1.5V16.5a.75.75 0 0 1 1.5 0v2.25a3 3 0 0 1-3 3H5.25a3 3 0 0 1-3-3V16.5a.75.75 0 0 1 .75-.75Z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-bold text-[#1b110e] text-sm">
                      {addons[1].title}
                    </h4>
                    <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded">
                      {addons[1].badge}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-[#97604e] mb-3 leading-relaxed">
                  {addons[1].description}
                </p>
                <div className="flex items-center justify-between border-t border-dashed border-[#e7d6d0] pt-3">
                  <span className="text-xs font-semibold text-[#97604e]">
                    Add for only
                  </span>
                  <span className="text-sm font-bold text-[#1b110e]">
                    {formatPrice(addons[1].price[currency], currency)}
                  </span>
                </div>
              </div>

              {/* Add-on: Custom URL */}
              <div className="bg-white p-6 rounded-xl border border-[#e7d6d0] hover:border-primary/50 transition-colors cursor-pointer group">
                <div className="flex items-center gap-4 mb-3">
                  <div className="h-10 w-10 rounded-lg bg-orange-50 text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="h-5 w-5"
                    >
                      <path
                        fillRule="evenodd"
                        d="M19.902 4.098a3.75 3.75 0 0 0-5.304 0l-4.5 4.5a3.75 3.75 0 0 0 1.035 6.037.75.75 0 0 1-.646 1.353 5.25 5.25 0 0 1-1.449-8.452l4.5-4.5a5.25 5.25 0 1 1 7.424 7.424l-1.757 1.757a.75.75 0 1 1-1.06-1.06l1.757-1.757a3.75 3.75 0 0 0 0-5.304Zm-7.389 4.267a.75.75 0 0 1 1-.353 5.25 5.25 0 0 1 1.449 8.452l-4.5 4.5a5.25 5.25 0 1 1-7.424-7.424l1.757-1.757a.75.75 0 1 1 1.06 1.06l-1.757 1.757a3.75 3.75 0 1 0 5.304 5.304l4.5-4.5a3.75 3.75 0 0 0-1.035-6.037.75.75 0 0 1-.354-1Z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-bold text-[#1b110e] text-sm">
                      {addons[2].title}
                    </h4>
                    <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded">
                      {addons[2].badge}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-[#97604e] mb-3 leading-relaxed">
                  {addons[2].description}
                </p>
                <div className="flex items-center justify-between border-t border-dashed border-[#e7d6d0] pt-3">
                  <span className="text-xs font-semibold text-[#97604e]">
                    Add for only
                  </span>
                  <span className="text-sm font-bold text-[#1b110e]">
                    {formatPrice(addons[2].price[currency], currency)}
                  </span>
                </div>
              </div>

              {/* Add-on: Remove Branding */}
              <div className="bg-white p-6 rounded-xl border border-[#e7d6d0] hover:border-primary/50 transition-colors cursor-pointer group">
                <div className="flex items-center gap-4 mb-3">
                  <div className="h-10 w-10 rounded-lg bg-orange-50 text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="h-5 w-5"
                    >
                      <path
                        fillRule="evenodd"
                        d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25Zm-4.5 7.5a.75.75 0 0 1 .75-.75h7.5a.75.75 0 0 1 0 1.5h-7.5a.75.75 0 0 1-.75-.75Zm0 4.5a.75.75 0 0 1 .75-.75h7.5a.75.75 0 0 1 0 1.5h-7.5a.75.75 0 0 1-.75-.75Z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-bold text-[#1b110e] text-sm">
                      {addons[3].title}
                    </h4>
                    <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded">
                      {addons[3].badge}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-[#97604e] mb-3 leading-relaxed">
                  {addons[3].description}
                </p>
                <div className="flex items-center justify-between border-t border-dashed border-[#e7d6d0] pt-3">
                  <span className="text-xs font-semibold text-[#97604e]">
                    Add for only
                  </span>
                  <span className="text-sm font-bold text-[#1b110e]">
                    {formatPrice(addons[3].price[currency], currency)}
                  </span>
                </div>
              </div>

              {/* Add-on: Scheduled Reveal */}
              <div className="bg-white p-6 rounded-xl border border-[#e7d6d0] hover:border-primary/50 transition-colors cursor-pointer group">
                <div className="flex items-center gap-4 mb-3">
                  <div className="h-10 w-10 rounded-lg bg-orange-50 text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="h-5 w-5"
                    >
                      <path
                        fillRule="evenodd"
                        d="M6.75 2.25A.75.75 0 0 1 7.5 3v1.5h9V3a.75.75 0 0 1 1.5 0v1.5h.75a3 3 0 0 1 3 3v11.25a3 3 0 0 1-3 3H3.75a3 3 0 0 1-3-3V7.5a3 3 0 0 1 3-3h.75V3a.75.75 0 0 1 .75-.75ZM3.75 9a.75.75 0 0 0-.75.75v8.25c0 .414.336.75.75.75h16.5a.75.75 0 0 0 .75-.75V9.75a.75.75 0 0 0-.75-.75H3.75Z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-bold text-[#1b110e] text-sm">
                      {addons[4].title}
                    </h4>
                    <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded">
                      {addons[4].badge}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-[#97604e] mb-3 leading-relaxed">
                  {addons[4].description}
                </p>
                <div className="flex items-center justify-between border-t border-dashed border-[#e7d6d0] pt-3">
                  <span className="text-xs font-semibold text-[#97604e]">
                    Add for only
                  </span>
                  <span className="text-sm font-bold text-[#1b110e]">
                    {formatPrice(addons[4].price[currency], currency)}
                  </span>
                </div>
              </div>

              {/* Social proof */}
              <div className="flex flex-col items-center text-center gap-3 opacity-70">
                <div className="flex -space-x-2">
                  {[
                    "/images/landing/avatars/avatar-3.png",
                    "/images/landing/avatars/avatar-1.png",
                    "/images/landing/avatars/avatar-2.png"
                  ].map((src, i) => (
                    <div
                      key={i}
                      className="h-8 w-8 rounded-full border-2 border-white shadow-sm overflow-hidden"
                    >
                      <img src={src} alt={`User ${i + 1}`} className="w-full h-full object-cover" />
                    </div>
                  ))}
                  <div className="h-8 w-8 rounded-full ring-2 ring-white bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
                    +2k
                  </div>
                </div>
                <p className="text-xs text-[#97604e]">
                  Join 2,000+ happy celebrants
                </p>
              </div>

            </div>
          </div>
        </div>
      </Container>

      {/* Testimonial strip */}
      <section className="w-full border-t border-[#f3eae7] bg-white py-16">
        <Container className="text-center">
          <div className="flex justify-center mb-6 text-primary gap-0.5">
            {[...Array(5)].map((_, i) => (
              <svg
                key={i}
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="h-5 w-5"
              >
                <path
                  fillRule="evenodd"
                  d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401Z"
                  clipRule="evenodd"
                />
              </svg>
            ))}
          </div>
          <h3 className="text-2xl md:text-3xl font-bold text-[#1b110e] mb-4">
            &ldquo;The best {formattedPrice} I ever spent!&rdquo;
          </h3>
          <p className="text-lg text-[#97604e] italic max-w-2xl mx-auto mb-8">
            &ldquo;I used Supriseal for my partner&apos;s birthday and she was
            in tears (happy ones!). The reveal timeline makes it so much more
            special than just sending a text.&rdquo;
          </p>
          <div className="flex items-center justify-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rose-300 to-orange-400 flex items-center justify-center text-white font-bold text-lg">
              S
            </div>
            <div className="text-left">
              <p className="text-sm font-bold text-[#1b110e]">Sarah Jenkins</p>
              <p className="text-xs text-[#97604e]">Verified Buyer</p>
            </div>
          </div>
        </Container>
      </section>

      <CallToAction />
    </div>
  );
}
