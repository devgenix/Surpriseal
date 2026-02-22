import Link from "next/link";
import Container from "@/components/ui/Container";

export default function CallToAction() {
  return (
    <section className="py-24 bg-[#211511] text-white text-center relative overflow-hidden">
      {/* Radial glow */}
      <div
        className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at top, #e64c19 0%, #211511 60%)",
        }}
      />

      <Container className="relative">
        <h2 className="text-3xl sm:text-4xl font-extrabold mb-6">
          Ready to make their day?
        </h2>
        <p className="text-lg text-white/70 mb-10 max-w-xl mx-auto">
          Join thousands of others creating meaningful moments. It takes less than
          5 minutes to set up.
        </p>
        <Link
          href="/create"
          className="inline-block bg-primary hover:bg-primary/90 text-white font-bold text-lg py-4 px-10 rounded-xl shadow-[0_0_30px_rgba(230,76,25,0.4)] transition-all hover:scale-105"
        >
          Create Your Moment
        </Link>
      </Container>
    </section>
  );
}
