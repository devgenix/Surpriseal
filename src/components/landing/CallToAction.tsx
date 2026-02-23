import Link from "next/link";
import Container from "@/components/ui/Container";

export default function CallToAction() {
  return (
    <section className="py-24 bg-[#211511] text-white text-center relative overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 opacity-20">
        <img 
          src="/images/landing/celebration-bg.png" 
          alt="Celebration background" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#211511] via-transparent to-[#211511]" />
      </div>

      {/* Radial glow */}
      <div
        className="absolute top-0 left-0 w-full h-full opacity-30 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at center, #e64c19 0%, transparent 70%)",
        }}
      />

      <Container className="relative z-10">
        <h2 className="text-4xl sm:text-5xl font-extrabold mb-6 tracking-tight">
          Ready to make their day?
        </h2>
        <p className="text-lg sm:text-xl text-white/80 mb-10 max-w-xl mx-auto font-medium leading-relaxed">
          Join thousands of others creating meaningful moments. It takes less than
          5 minutes to set up.
        </p>
        <Link
          href="/dashboard/create"
          className="inline-block bg-primary hover:bg-primary/90 text-white font-bold text-xl py-5 px-12 rounded-lg shadow-[0_0_40px_rgba(230,76,25,0.4)] transition-all hover:scale-105 active:scale-100"
        >
          Start a Surprise
        </Link>
      </Container>
    </section>
  );
}
