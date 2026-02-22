import Link from "next/link";
import Container from "@/components/ui/Container";

export default function Hero() {
  return (
    <section className="relative py-16 lg:py-24 bg-[#fcf9f8] overflow-hidden">
      {/* Floating Emojis/Icons for emotional appeal */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[15%] left-[5%] animate-bounce duration-[3000ms] opacity-20 text-4xl">❤️</div>
        <div className="absolute top-[60%] left-[8%] animate-pulse opacity-20 text-4xl">✨</div>
        <div className="absolute top-[20%] right-[10%] animate-bounce duration-[4000ms] opacity-20 text-4xl">🥳</div>
        <div className="absolute bottom-[15%] right-[5%] animate-pulse opacity-20 text-4xl">🎁</div>
      </div>

      <Container className="relative z-10">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-8 items-center">
          {/* Left: Copy */}
          <div className="max-w-2xl text-center lg:text-left">
            <h1 className="text-4xl font-extrabold tracking-tight text-[#1b110e] sm:text-5xl lg:text-7xl mb-6 leading-[1.1]">
              The Most Meaningful Way to{" "}
              <span className="text-primary relative inline-block">
                Celebrate
                <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 200 8" fill="none">
                  <path d="M1 5.5C40 2 120 2 199 5.5" stroke="#e64c19" strokeWidth="3" strokeLinecap="round"/>
                </svg>
              </span>
            </h1>

            <p className="text-xl text-[#97604e] mb-8 max-w-lg leading-relaxed mx-auto lg:mx-0 font-medium">
              Create a digital journey of memories and surprises they&apos;ll cherish forever. Simple to build, impossible to forget.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/dashboard/create"
                className="inline-flex items-center justify-center rounded-xl bg-primary px-8 py-4 text-base font-bold text-white shadow-[0_4px_20px_-2px_rgba(230,76,25,0.15)] transition-all hover:bg-primary/90 hover:shadow-[0_8px_30px_-2px_rgba(230,76,25,0.35)]"
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
            <div className="mt-8 flex items-center gap-4 text-sm text-[#97604e]">
              <div className="flex -space-x-2">
                {["bg-orange-200", "bg-rose-200", "bg-purple-200"].map((bg, i) => (
                  <div
                    key={i}
                    className={`h-8 w-8 rounded-full border-2 border-white ${bg} flex items-center justify-center text-xs font-bold text-white`}
                  />
                ))}
              </div>
              <p>Loved by 10,000+ creators</p>
            </div>
          </div>

          {/* Right: Card visual */}
          <div className="relative min-h-[400px] w-full flex items-center justify-center">
            {/* Blob */}
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 to-purple-100 rounded-full blur-3xl opacity-60 scale-90 pointer-events-none" />

            {/* Card */}
            <div className="relative w-full aspect-square max-w-[460px] bg-white rounded-2xl shadow-[0_10px_40px_-10px_rgba(27,17,14,0.1)] p-6 rotate-2 hover:rotate-0 transition-transform duration-500 border border-[#f3eae7]">
              <div className="w-full h-full rounded-xl overflow-hidden bg-[#fcf9f8] relative">
                {/* Gradient bg stand-in for the gift image */}
                <div className="absolute inset-0 bg-gradient-to-br from-rose-100 via-orange-50 to-purple-100" />

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
                      className={`absolute ${dot.size} rounded-full ${dot.color}`}
                      style={{ top: dot.top, left: dot.left }}
                    />
                  ))}
                </div>

                {/* Inner card */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8">
                  <div className="bg-white/90 backdrop-blur-md p-6 rounded-2xl shadow-lg max-w-xs transform hover:scale-105 transition-transform">
                    <div className="flex h-14 w-14 mx-auto mb-3 items-center justify-center rounded-full bg-primary/10">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className="h-8 w-8 text-primary"
                      >
                        <path d="M9.375 3a1.875 1.875 0 0 0 0 3.75h1.875v4.5H3.375A1.875 1.875 0 0 1 1.5 9.375v-.75c0-1.036.84-1.875 1.875-1.875h3.193A3.375 3.375 0 0 1 12 2.753a3.375 3.375 0 0 1 5.432 3.997h3.193c1.035 0 1.875.84 1.875 1.875v.75c0 1.036-.84 1.875-1.875 1.875H13.5v-4.5h1.875a1.875 1.875 0 1 0-1.875-1.875V6.75h-3V4.875C10.5 3.839 9.661 3 8.625 3h.75ZM11.25 12.75H3v6.75a2.25 2.25 0 0 0 2.25 2.25h6v-9ZM12.75 21.75h6a2.25 2.25 0 0 0 2.25-2.25v-6.75h-8.25v9Z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold text-[#1b110e] mb-1">
                      Surprise for Sarah!
                    </h3>
                    <p className="text-sm text-[#97604e]">Tap to unlock your journey</p>
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
