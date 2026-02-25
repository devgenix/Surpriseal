import { Currency } from "../currency";

export interface PricingFeature {
  title: string;
  desc?: string;
}

export interface PlanDefinition {
  id: "base" | "premium";
  title: string;
  description: string;
  price: Record<Currency, number>;
  features: PricingFeature[];
  buttonText: string;
}

export interface AddonDefinition {
  id: string;
  title: string;
  description: string;
  price: Record<Currency, number>;
  badge?: string;
}

export const PLANS: PlanDefinition[] = [
  {
    id: "base",
    title: "Base Plan",
    description: "Start with the essentials, customize as you go.",
    price: {
      NGN: 2500,
      USD: 4,
    },
    features: [
      { title: "Structured reveal timeline", desc: "Build anticipation step-by-step." },
      { title: "Interactive celebration page", desc: "Confetti, animations, and love." },
      { title: "Gallery (Up to 10 memories)", desc: "Upload photos and video messages." },
      { title: "Background music selection", desc: "Set the perfect mood." },
      { title: "30-day hosting included", desc: "Live for a full month." },
    ],
    buttonText: "Continue with Base",
  },
  {
    id: "premium",
    title: "Premium Plan",
    description: "The ultimate experience. All add-ons included.",
    price: {
      NGN: 7000,
      USD: 8,
    },
    features: [
      { title: "Everything in Base + All Add-ons" },
      { title: "Extended 1-Year Hosting" },
      { title: "Gallery (Up to 25 memories)" },
      { title: "Custom Personalized URL" },
      { title: "Whitelabel (No Branding)" },
      { title: "Scheduled Reveal Date" },
      { title: "Priority Support" },
    ],
    buttonText: "Upgrade to Premium",
  },
];

export const ADDONS: AddonDefinition[] = [
  {
    id: "extendedHosting",
    title: "Extended Hosting",
    description: "Keep the celebration live for a full year.",
    price: { NGN: 2000, USD: 2 },
    badge: "+1 Year",
  },
  {
    id: "extraMedia",
    title: "Extra Media",
    description: "Add 25 extra photos and video messages.",
    price: { NGN: 2000, USD: 2 },
    badge: "+25 Media",
  },
  {
    id: "customUrl",
    title: "Custom URL",
    description: "Create a personalized link like /our-anniversary.",
    price: { NGN: 1000, USD: 1 },
    badge: "Personalized",
  },
  {
    id: "removeBranding",
    title: "Remove Branding",
    description: "Remove 'Powered by Surpriseal' for a custom feel.",
    price: { NGN: 1000, USD: 1 },
    badge: "White Label",
  },
  {
    id: "scheduledReveal",
    title: "Scheduled Reveal",
    description: "Unlock the surprise at a precise date and time.",
    price: { NGN: 1000, USD: 1 },
    badge: "Perfect Timing",
  },
];
