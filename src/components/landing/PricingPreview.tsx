"use client";

import Link from "next/link";
import { useCurrency } from "@/context/CurrencyContext";
import Container from "@/components/ui/Container";

const perks = [
  "Unlimited photos & videos",
  "Full access to all premium themes",
  "Password protection included",
  "Lifetime archive access",
];

export default function PricingPreview() {
  const { formattedPrice, isLoading } = useCurrency();

  return (
    <section
      id="pricing"
      className="py-20 bg-[#fff0eb]/30"
    >
      <Container>
        <h2 className="text-3xl font-bold text-[#1b110e] mb-4">
          Simple, Transparent Pricing
        </h2>
        <p className="text-[#97604e] mb-12">
          One flat fee for a premium experience. No monthly subscriptions.
        </p>

        <div className="bg-white rounded-3xl shadow-[0_10px_40px_-10px_rgba(27,17,14,0.08)] p-8 md:p-12 border border-[#f3eae7] relative overflow-hidden">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8 md:gap-12">
            {/* Left: Plan info */}
            <div className="text-left md:w-1/2">
              <h3 className="text-2xl font-bold text-[#1b110e] mb-2">
                The Celebration Pass
              </h3>
              <p className="text-[#97604e] mb-6">
                Everything you need for one unforgettable event.
              </p>
              <ul className="space-y-3">
                {perks.map((perk) => (
                  <li
                    key={perk}
                    className="flex items-center gap-3 text-sm font-medium text-[#1b110e]"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="h-5 w-5 text-green-500 flex-shrink-0"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {perk}
                  </li>
                ))}
              </ul>
            </div>

            {/* Divider */}
            <div className="h-px w-full md:w-px md:h-48 bg-gray-100" />

            {/* Right: Price + CTA */}
            <div className="text-center md:w-1/2 flex flex-col items-center justify-center">
              <span className="text-sm text-[#97604e] mb-1">starts from</span>
              <div
                className={`flex items-baseline justify-center text-primary mb-2 transition-opacity duration-300 ${
                  isLoading ? "opacity-0" : "opacity-100"
                }`}
              >
                <span className="text-5xl font-extrabold tracking-tight">
                  {formattedPrice}
                </span>
              </div>
              <span className="text-sm text-[#97604e] font-medium mb-6">
                per celebration
              </span>
              <Link
                href="/dashboard/create"
                className="w-full max-w-[240px] bg-primary text-white font-bold text-lg py-4 rounded-xl shadow-[0_4px_20px_-2px_rgba(230,76,25,0.15)] hover:bg-primary/90 hover:shadow-[0_8px_30px_-2px_rgba(230,76,25,0.35)] transition-all text-center block"
              >
                Create Now
              </Link>
              <Link
                href="/pricing"
                className="mt-4 text-sm font-semibold text-primary hover:text-primary/80 transition-colors flex items-center justify-center gap-1"
              >
                View detailed pricing
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="h-4 w-4"
                >
                  <path
                    fillRule="evenodd"
                    d="M3 10a.75.75 0 0 1 .75-.75h10.638L10.23 5.29a.75.75 0 1 1 1.04-1.08l5.5 5.25a.75.75 0 0 1 0 1.08l-5.5 5.25a.75.75 0 1 1-1.04-1.08l4.158-3.96H3.75A.75.75 0 0 1 3 10Z"
                    clipRule="evenodd"
                  />
                </svg>
              </Link>
              <p className="mt-4 text-xs text-[#97604e]">
                100% money-back guarantee if not satisfied.
              </p>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
