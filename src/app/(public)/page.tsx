import Hero from "@/components/landing/Hero";
import HowItWorks from "@/components/landing/HowItWorks";
import Features from "@/components/landing/Features";
import PricingPreview from "@/components/landing/PricingPreview";
import Testimonials from "@/components/landing/Testimonials";
import CallToAction from "@/components/landing/CallToAction";

export default function Home() {
  return (
    <>
      <Hero />
      <HowItWorks />
      <Features />
      <PricingPreview />
      <Testimonials />
      <CallToAction />
    </>
  );
}
