import Hero from "@/components/landing/Hero";
import HowItWorks from "@/components/landing/HowItWorks";
import Features from "@/components/landing/Features";
import Occasions from "@/components/landing/Occasions";
import PricingPreview from "@/components/landing/PricingPreview";
import Testimonials from "@/components/landing/Testimonials";
import FAQ from "@/components/landing/FAQ";
import CallToAction from "@/components/landing/CallToAction";

export default function Home() {
  return (
    <>
      <Hero />
      <HowItWorks />
      <Features />
      <Occasions />
      <PricingPreview />
      <Testimonials />
      <FAQ />
      <CallToAction />
    </>
  );
}
