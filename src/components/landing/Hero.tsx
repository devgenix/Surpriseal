import Link from "next/link";
import Container from "@/components/ui/Container";

export default function Hero() {
  return (
    <section className="relative py-12 lg:py-24 bg-[#fcf9f8] lg:min-h-screen overflow-hidden flex items-center">
      <Container className="relative z-10 mx-auto">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-8 items-center">
          {/* Left: Copy */}
          <div className="max-w-2xl text-center lg:text-left">
            <h1 className="text-3xl font-extrabold tracking-tight text-[#1b110e] sm:text-5xl lg:text-7xl mb-6 leading-[1.15] px-2 sm:px-0">
              The Most Meaningful Way to{" "}
              <span className="text-primary relative inline-block">
                Celebrate
                <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 200 8" fill="none">
                  <path d="M1 5.5C40 2 120 2 199 5.5" stroke="#e64c19" strokeWidth="3" strokeLinecap="round"/>
                </svg>
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-[#97604e] mb-8 max-w-lg leading-relaxed mx-auto lg:mx-0 font-medium px-4 sm:px-0">
              Create a digital journey of memories and surprises they&apos;ll cherish forever. Simple to build, impossible to forget.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/dashboard/create"
                className="inline-flex items-center justify-center rounded-lg bg-primary px-8 py-4 text-base font-bold text-white shadow-[0_4px_20px_-2px_rgba(230,76,25,0.15)] transition-all hover:bg-primary/90 hover:shadow-[0_8px_30px_-2px_rgba(230,76,25,0.35)]"
              >
                Start a Surprise
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="ml-2 h-5 w-5"
                >
                  <path
                    fillRule="evenodd"
                    d="M3 10a.75.75 0 0 1 .75-.75h10.638L10.23 5.29a.75.75 0 1 1 1.04-1.08l5.5 5.25a.75.75 0 0 1 0 1.08l-5.5 5.25a.75.75 0 1 1-1.04-1.08l4.158-3.96H3.75A.75.75 0 0 1 3 10Z"
                    clipRule="evenodd"
                  />
                </svg>
              </Link>
            </div>

            {/* Social proof */}
            <div className="mt-8 flex items-center justify-center lg:justify-start gap-4 text-sm text-[#97604e]">
              <div className="flex -space-x-2">
                {[
                  "/images/landing/avatars/avatar-1.png",
                  "/images/landing/avatars/avatar-2.png",
                  "/images/landing/avatars/avatar-3.png"
                ].map((src, i) => (
                  <div
                    key={i}
                    className={`h-10 w-10 rounded-full border-2 border-white shadow-sm overflow-hidden`}
                  >
                    <img src={src} alt={`User ${i + 1}`} className="w-full h-full object-cover" />
                  </div>
                ))}
                <div className="h-10 w-10 rounded-full bg-primary/10 border-2 border-white flex items-center justify-center text-[10px] font-bold text-primary">
                  +10k
                </div>
              </div>
              <p className="font-medium">Loved by 10,000+ creators</p>
            </div>
          </div>

          {/* Right: Card visual */}
          <div className="relative min-h-[400px] w-full hidden lg:flex items-center justify-center">
            {/* Blob */}
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 to-purple-100 rounded-full blur-3xl opacity-60 scale-90 pointer-events-none" />

            {/* Card */}
            <div className="relative w-full aspect-square max-w-[460px] bg-white rounded-2xl shadow-[0_20px_60px_-15px_rgba(27,17,14,0.15)] p-6 rotate-2 hover:rotate-0 transition-transform duration-700 border border-[#f3eae7]">
              <div className="w-full h-full rounded-xl overflow-hidden bg-[#fcf9f8] relative">
                {/* Hero Gift Image */}
                <div className="absolute inset-0">
                  <img 
                    src="/images/landing/hero-surprise.png" 
                    alt="Happy person receiving a surprise" 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                </div>

                {/* Confetti dots decoration */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                  {[
                    { top: "10%", left: "15%", size: "h-3 w-3", color: "bg-primary/40" },
                    { top: "20%", left: "75%", size: "h-2 w-2", color: "bg-purple-400/50" },
                    { top: "70%", left: "10%", size: "h-2 w-2", color: "bg-rose-400/50" },
                    { top: "80%", left: "80%", size: "h-3 w-3", color: "bg-amber-400/50" },
                    { top: "40%", left: "85%", size: "h-2 w-2", color: "bg-primary/30" },
                  ].map((dot, i) => (
                    <div
                      key={i}
                      className={`absolute ${dot.size} rounded-full ${dot.color} animate-pulse`}
                      style={{ top: dot.top, left: dot.left, animationDelay: `${i * 0.5}s` }}
                    />
                  ))}
                </div>

                {/* Inner card content - slightly translucent glassmorphism */}
                <div className="absolute bottom-6 left-0 right-0 flex flex-col items-center justify-center text-center px-8">
                  <div className="bg-white/80 backdrop-blur-lg p-5 rounded-2xl shadow-xl border border-white/20 max-w-xs transform hover:scale-105 transition-transform">
                    <div className="flex h-12 w-12 mx-auto mb-3 items-center justify-center rounded-full bg-primary/10">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className="h-7 w-7 text-primary"
                      >
                        <path d="M9.375 3a1.875 1.875 0 0 0 0 3.75h1.875v4.5H3.375A1.875 1.875 0 0 1 1.5 9.375v-.75c0-1.036.84-1.875 1.875-1.875h3.193A3.375 3.375 0 0 1 12 2.753a3.375 3.375 0 0 1 5.432 3.997h3.193c1.035 0 1.875.84 1.875 1.875v.75c0 1.036-.84 1.875-1.875 1.875H13.5v-4.5h1.875a1.875 1.875 0 1 0-1.875-1.875V6.75h-3V4.875C10.5 3.839 9.661 3 8.625 3h.75ZM11.25 12.75H3v6.75a2.25 2.25 0 0 0 2.25 2.25h6v-9ZM12.75 21.75h6a2.25 2.25 0 0 0 2.25-2.25v-6.75h-8.25v9Z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-bold text-[#1b110e] mb-1">
                      Surprise for Sarah!
                    </h3>
                    <p className="text-xs text-[#97604e] font-medium">Tap to unlock your journey</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
