"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Container from "@/components/ui/Container";
import Section from "@/components/ui/Section";
import { PLANS, ADDONS, PlanDefinition, AddonDefinition } from "@/lib/constants/pricing";
import { formatPrice } from "@/lib/currency";
import { useCurrency } from "@/context/CurrencyContext";
import { db, auth } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { onAuthStateChanged, User } from "firebase/auth";
import { Loader2, CheckCircle2, Check, ChevronRight, Info} from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function CreatePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const { currency } = useCurrency();
  const [loading, setLoading] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [draftId, setDraftId] = useState<string | null>(null);

  // Selection states
  const [selectedPlanId, setSelectedPlanId] = useState<"base" | "premium">("base");
  const [selectedAddonIds, setSelectedAddonIds] = useState<string[]>([]);

  useEffect(() => {
    if (!auth) return;
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoadingAuth(false);
    });
    return () => unsubscribe();
  }, []);

  const selectedPlan = useMemo(() => 
    PLANS.find(p => p.id === selectedPlanId)!, 
  [selectedPlanId]);

  const toggleAddon = (addonId: string) => {
    if (selectedPlanId === "premium") return; // All included in premium
    setSelectedAddonIds(prev => 
      prev.includes(addonId) 
        ? prev.filter(id => id !== addonId) 
        : [...prev, addonId]
    );
  };

  const totalPrice = useMemo(() => {
    let total = selectedPlan.price[currency];
    if (selectedPlanId === "base") {
      selectedAddonIds.forEach(id => {
        const addon = ADDONS.find(a => a.id === id);
        if (addon) total += addon.price[currency];
      });
    }
    return total;
  }, [selectedPlan, selectedAddonIds, selectedPlanId, currency]);

  const handleCreate = async () => {
    if (!user) {
      alert("Please sign in to create a surprise!");
      return;
    }

    setLoading(true);

    try {
      const draftData = {
        userId: user.uid,
        plan: selectedPlanId,
        currency,
        basePrice: selectedPlan.price[currency],
        selectedAddons: selectedPlanId === "premium" ? ADDONS.map(a => a.id) : selectedAddonIds,
        totalPrice,
        status: "draft",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        step: 0,
      };

      const docRef = await addDoc(collection(db!, "drafts"), draftData);
      setDraftId(docRef.id);
      setLastSaved(new Date());
      
      router.push(`/create/${docRef.id}/details`);
    } catch (error) {
      console.error("Error creating draft:", error);
    } finally {
      setLoading(false);
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
    <Section className="bg-[#fcf9f8]">
      <Container>
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-3xl md:text-5xl font-extrabold mb-4 text-[#1b110e]">
              Design Your <span className="text-primary italic">Surprise</span>
            </h1>
            <p className="text-[#97604e] text-lg max-w-2xl mx-auto">
              Choose your foundation and add the perfect finishing touches.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8 items-start">
            {/* Left: Plan & Addons Selection */}
            <div className="lg:col-span-2 space-y-8">
              {/* Plan Cards */}
              <div className="grid md:grid-cols-2 gap-6">
                {PLANS.map((plan) => (
                  <Card 
                    key={plan.id}
                    className={cn(
                      "relative cursor-pointer transition-all duration-300 overflow-hidden group border-2",
                      selectedPlanId === plan.id 
                        ? "border-primary shadow-xl shadow-primary/5 bg-white" 
                        : "border-[#f3eae7] hover:border-primary/30 bg-white/50"
                    )}
                    onClick={() => {
                      setSelectedPlanId(plan.id);
                      if (plan.id === "premium") setSelectedAddonIds([]); // Reset selected but premium includes all
                    }}
                  >
                    {plan.id === "premium" && (
                      <div className="absolute top-0 right-0 bg-primary text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg transform group-hover:scale-105 transition-transform">
                        BEST VALUE
                      </div>
                    )}
                    <CardHeader className="pb-4">
                      <CardTitle className="text-2xl font-bold">{plan.title}</CardTitle>
                      <CardDescription className="text-[#97604e] font-medium leading-relaxed">
                        {plan.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="mb-6">
                        <span className="text-3xl font-extrabold text-[#1b110e]">
                          {formatPrice(plan.price[currency], currency)}
                        </span>
                      </div>
                      <ul className="space-y-3">
                        {plan.features.slice(0, 5).map((feature, i) => (
                          <li key={i} className="flex items-start gap-3 text-sm text-[#1b110e]/80">
                            <div className="h-5 w-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                              <Check className="h-3 w-3 text-green-600" />
                            </div>
                            <span className="font-medium">{feature.title}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Add-ons Section */}
              <div className={cn(
                "rounded-lg p-6 lg:p-8 transition-all duration-500",
                selectedPlanId === "premium" 
                  ? "bg-slate-50 border-2 border-slate-200 opacity-60 pointer-events-none" 
                  : "bg-white border-2 border-[#f3eae7] shadow-sm"
              )}>
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h2 className="text-xl md:text-2xl font-bold text-[#1b110e]">
                      Enhance with Add-ons
                    </h2>
                    <p className="text-[#97604e] text-sm mt-1">
                      {selectedPlanId === "premium" 
                        ? "All add-ons are automatically included in Premium." 
                        : "Customise your surprise with special extras."}
                    </p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  {ADDONS.map((addon) => {
                    const isSelected = selectedAddonIds.includes(addon.id) || selectedPlanId === "premium";
                    return (
                      <div
                        key={addon.id}
                        onClick={() => toggleAddon(addon.id)}
                        className={cn(
                          "p-4 rounded-lg border-2 transition-all cursor-pointer flex items-start gap-4",
                          isSelected 
                            ? "border-primary/40 bg-primary/5" 
                            : "border-[#f3eae7] hover:border-primary/20 bg-white"
                        )}
                      >
                        <div className={cn(
                          "h-5 w-5 rounded border-2 flex items-center justify-center transition-colors mt-0.5",
                          isSelected ? "bg-primary border-primary" : "border-[#e7d6d0]"
                        )}>
                          {isSelected && <Check className="h-3 w-3 text-white" strokeWidth={4} />}
                        </div>
                        <div className="flex-grow">
                          <div className="flex items-center justify-between mb-0.5">
                            <span className="font-bold text-[#1b110e] text-sm">{addon.title}</span>
                            <span className="text-xs font-bold text-primary">
                              +{formatPrice(addon.price[currency], currency)}
                            </span>
                          </div>
                          <p className="text-xs text-[#97604e] leading-snug">{addon.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right: Summary / Calculator */}
            <div className="lg:col-sticky lg:top-24">
              <Card className="border-2 border-primary/20 shadow-2xl shadow-primary/5 bg-white overflow-hidden">
                <div className="bg-primary/5 p-6 border-b border-primary/10">
                  <h3 className="font-bold text-[#1b110e] flex items-center gap-2">
                    Order Summary
                  </h3>
                </div>
                <CardContent className="p-6 space-y-4">
                  <div className="flex justify-between text-sm py-2">
                    <span className="text-[#97604e] font-medium">{selectedPlanId === "base" ? "Base Plan" : "Premium Plan"}</span>
                    <span className="text-[#1b110e] font-bold">{formatPrice(selectedPlan.price[currency], currency)}</span>
                  </div>

                  {selectedPlanId === "base" && selectedAddonIds.length > 0 && (
                    <div className="border-t border-dashed border-[#f3eae7] pt-4 space-y-2">
                      <span className="text-[10px] uppercase tracking-wider font-bold text-primary">Selected Add-ons</span>
                      {selectedAddonIds.map(id => {
                        const addon = ADDONS.find(a => a.id === id);
                        return (
                          <div key={id} className="flex justify-between text-xs transition-all animate-in fade-in slide-in-from-left-2">
                            <span className="text-[#1b110e]/70">{addon?.title}</span>
                            <span className="text-[#1b110e] font-medium">+{formatPrice(addon?.price[currency] || 0, currency)}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {selectedPlanId === "premium" ? (
                    <div className="border-t border-dashed border-primary/20 pt-4 space-y-2 bg-primary/5 p-3 rounded-lg animate-in zoom-in-95 duration-500">
                      <div className="flex items-center gap-2 text-primary">
                        <CheckCircle2 className="h-4 w-4" />
                        <span className="text-xs font-bold uppercase tracking-tight">Full Stack Extras Included</span>
                      </div>
                      <p className="text-[10px] text-primary/70 leading-relaxed font-medium">
                        Extended Hosting, Unlimited Media, Custom URL, White Label, and Scheduled Reveal are all active.
                      </p>
                    </div>
                  ) : (
                    <div className="border-t border-dashed border-blue-200 pt-4 space-y-2 bg-blue-50/60 p-3 rounded-lg animate-in zoom-in-95 duration-500">
                      <div className="flex items-center gap-2 text-blue-600">
                        <Info className="h-4 w-4 shrink-0" />
                        <span className="text-xs font-bold uppercase tracking-tight">
                          Flexible Customization
                        </span>
                      </div>

                      <p className="text-xs text-blue-700/90 leading-relaxed">
                        Add additional features and surprise enhancements anytime while
                        creating your celebration — before you go live.
                      </p>
                    </div>
                  )}

                  <div className="border-t-2 border-[#1b110e]/5 pt-4 mt-6">
                    <div className="flex justify-between items-end mb-2">
                      <span className="text-[#1b110e] font-bold">Surprise Cost</span>
                      <div className="text-right">
                        <div className="text-3xl font-black text-[#1b110e] tabular-nums">
                          {formatPrice(totalPrice, currency)}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="p-6 pt-0">
                  <Button 
                    className="w-full h-14 text-lg font-bold shadow-lg shadow-primary/20 group relative overflow-hidden" 
                    size="lg"
                    onClick={handleCreate}
                    disabled={loading}
                  >
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      {loading ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <>
                          {selectedPlanId === "base" ? "Start Creating" : "Go All-Inclusive"}
                          <ChevronRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                        </>
                      )}
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-primary to-orange-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Button>
                </CardFooter>
              </Card>

              {lastSaved && (
                <div className="mt-4 flex items-center justify-center gap-2 text-xs text-green-600 font-medium animate-in fade-in slide-in-from-top-2">
                  <CheckCircle2 className="h-3 w-3" />
                  <span>Draft secured! Ready for the next step.</span>
                </div>
              )}
            </div>
          </div>
      </Container>
    </Section>
  );
}
