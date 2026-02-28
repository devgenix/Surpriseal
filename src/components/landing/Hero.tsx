import Link from "next/link";
import Container from "@/components/ui/Container";

export default function Hero() {
  return (
    <section className="relative py-12 lg:py-24 bg-background lg:min-h-screen overflow-hidden flex items-center">
      <Container className="relative z-10 mx-auto">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-8 items-center">
          {/* Left: Copy */}
          <div className="max-w-2xl text-center lg:text-left">
            <h1 className="text-3xl font-extrabold tracking-tight text-text-main sm:text-5xl lg:text-7xl mb-6 leading-[1.15] px-2 sm:px-0">
              The Most Meaningful Way to{" "}
              <span className="text-primary relative inline-block">
                Celebrate
                <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 200 8" fill="none">
                  <path d="M1 5.5C40 2 120 2 199 5.5" stroke="#e64c19" strokeWidth="3" strokeLinecap="round"/>
                </svg>
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-text-muted mb-8 max-w-lg leading-relaxed mx-auto lg:mx-0 font-medium px-4 sm:px-0">
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

              <Link
                href="/view/example"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-lg border-2 border-[#e64c19]/30 bg-card px-8 py-4 text-base font-bold text-[#e64c19] transition-all hover:border-primary hover:bg-primary/5"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="mr-2 h-5 w-5"
                >
                  <path d="M10 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" />
                  <path
                    fillRule="evenodd"
                    d="M.664 10.59a1.651 1.651 0 0 1 0-1.186A10.004 10.004 0 0 1 10 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0 1 10 17c-4.257 0-7.893-2.66-9.336-6.41ZM14 10a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z"
                    clipRule="evenodd"
                  />
                </svg>
                See Example
              </Link>
            </div>

            {/* Social proof */}
            <div className="mt-8 flex items-center justify-center lg:justify-start gap-4 text-sm text-text-muted">
              <div className="flex -space-x-2">
                {[
                  "/images/landing/avatars/avatar-1.png",
                  "/images/landing/avatars/avatar-2.png",
                  "/images/landing/avatars/avatar-3.png"
                ].map((src, i) => (
                  <div
                    key={i}
                    className={`h-10 w-10 rounded-full border-2 border-background shadow-sm overflow-hidden`}
                  >
                    <img src={src} alt={`User ${i + 1}`} className="w-full h-full object-cover" />
                  </div>
                ))}
                <div className="h-10 w-10 rounded-full bg-primary/10 border-2 border-background flex items-center justify-center text-[10px] font-bold text-primary">
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
            <div className="relative w-full aspect-square max-w-[460px] bg-card rounded-2xl shadow-[0_20px_60px_-15px_rgba(27,17,14,0.15)] p-6 rotate-2 hover:rotate-0 transition-transform duration-700 border border-border">
              <div className="w-full h-full rounded-xl overflow-hidden bg-background relative">
                {/* Hero Gift Image */}
                <div className="absolute inset-0">
                  <img 
                    src="/images/landing/hero-surprise.png" 
                    alt="Happy person receiving a surprise" 
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
