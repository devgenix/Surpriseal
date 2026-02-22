"use client";

import { useCurrency } from "@/context/CurrencyContext";
import Container from "@/components/ui/Container";

export default function Testimonials() {
  const { formattedPrice } = useCurrency();
  return (
    <section className="py-20 bg-white border-t border-[#f3eae7]">
      <Container>
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Left: Image panel */}
          <div className="relative h-[400px] w-full rounded-2xl overflow-hidden shadow-lg">
            {/* Gradient background instead of external image */}
            <div className="absolute inset-0 bg-gradient-to-br from-rose-200 via-orange-100 to-amber-200" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

            {/* Decorative elements to suggest "party" photo */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex -space-x-4">
                {[
                  { bg: "bg-rose-400", size: "h-24 w-24", label: "😄" },
                  { bg: "bg-orange-400", size: "h-28 w-28", label: "🎉" },
                  { bg: "bg-amber-400", size: "h-24 w-24", label: "😊" },
                ].map((item, i) => (
                  <div
                    key={i}
                    className={`${item.size} rounded-full ${item.bg} border-4 border-white/30 flex items-center justify-center text-3xl shadow-lg`}
                  >
                    {item.label}
                  </div>
                ))}
              </div>
            </div>

            <div className="absolute bottom-6 left-6 text-white max-w-xs">
              <p className="font-bold text-lg leading-snug">
                &ldquo;The look on her face when she reached the final reveal was priceless.&rdquo;
              </p>
            </div>
          </div>

          {/* Right: Quote */}
          <div>
            <span className="text-primary font-bold tracking-wider text-sm uppercase mb-2 block">
              Stories
            </span>
            <h2 className="text-3xl font-bold text-[#1b110e] mb-6">
              Trusted by thoughtful gift-givers
            </h2>
            <blockquote className="text-xl text-[#1b110e] font-medium italic mb-8 leading-relaxed">
              &ldquo;I wanted something more than just a card for our anniversary. Supriseal let me
              tell our story in a way that felt like a digital scavenger hunt. Best {formattedPrice}
              I&apos;ve ever spent.&rdquo;
            </blockquote>
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-rose-300 to-orange-400 flex items-center justify-center text-white font-bold text-lg shadow">
                A
              </div>
              <div>
                <div className="font-bold text-[#1b110e]">Amara N.</div>
                <div className="text-sm text-[#97604e]">Created an Anniversary Surprise</div>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
