"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Container from "@/components/ui/Container";
import Section from "@/components/ui/Section";
import { PricingCard } from "@/components/create/PricingCard";
import { BASE_PRICES, PREMIUM_PRICES, formatPrice } from "@/lib/currency";
import { useCurrency } from "@/context/CurrencyContext";
import { db, auth } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp, updateDoc, doc } from "firebase/firestore";
import { onAuthStateChanged, User } from "firebase/auth";
import { Loader2, CheckCircle2 } from "lucide-react";

export default function CreatePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const { currency } = useCurrency();
  const [loading, setLoading] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [draftId, setDraftId] = useState<string | null>(null);

  useEffect(() => {
    if (!auth) return;
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoadingAuth(false);
    });
    return () => unsubscribe();
  }, []);

  const handleSelectPlan = async (plan: "base" | "premium") => {
    if (!user) {
      // Redirect to login or show auth modal?
      // For now, let's just alert
      alert("Please sign in to create a surprise!");
      return;
    }

    setLoading(plan);

    try {
      const draftData = {
        userId: user.uid,
        plan,
        currency,
        basePrice: plan === "base" ? BASE_PRICES[currency] : PREMIUM_PRICES[currency],
        status: "draft",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        step: 0,
      };

      const docRef = await addDoc(collection(db!, "drafts"), draftData);
      setDraftId(docRef.id);
      setLastSaved(new Date());
      
      // Navigate to the next step
      // router.push(`/create/${docRef.id}/details`);
      // For phase 1, we'll just show the last saved status
    } catch (error) {
      console.error("Error creating draft:", error);
    } finally {
      setLoading(null);
    }
  };

  if (loadingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Section className="py-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <Container>
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-extrabold mb-4 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Start Your Surprise
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Choose the perfect plan for your digital gift. All plans include core surprise features.
            </p>
            

          </div>

          <div className="grid md:grid-cols-2 gap-8 items-stretch">
            <PricingCard
              title="Base Plan"
              description="Perfect for a simple, heartfelt surprise."
              price={formatPrice(BASE_PRICES[currency], currency)}
              features={[
                "Core Surprise Engine",
                "Digital Gift Reveal",
                "Personalized Message",
                "Standard 7-day Hosting",
                "Basic Media Upload (1 image/video)",
              ]}
              buttonText="Continue with Base + Add-ons"
              onSelect={() => handleSelectPlan("base")}
              loading={loading === "base"}
            />
            
            <PricingCard
              title="Premium Plan"
              description="The ultimate surprise experience with all extras."
              price={formatPrice(PREMIUM_PRICES[currency], currency)}
              highlighted
              features={[
                "Everything in Base + All Add-ons",
                "Extended 30-day Hosting",
                "Extra Media (Up to 10 images/videos)",
                "Custom Short URL",
                "Remove Surpriseal Branding",
                "Scheduled Reveal Date",
                "Priority Support",
              ]}
              buttonText="Continue with All-Inclusive"
              onSelect={() => handleSelectPlan("premium")}
              loading={loading === "premium"}
            />
          </div>

          {lastSaved && (
            <div className="mt-12 flex items-center justify-center gap-2 text-sm text-muted-foreground animate-in fade-in duration-500">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span>Draft created! Last saved at {lastSaved.toLocaleTimeString()}</span>
              {draftId && <span className="ml-2 font-mono text-xs opacity-50">(ID: {draftId})</span>}
            </div>
          )}
        </div>
      </Container>
    </Section>
  );
}
