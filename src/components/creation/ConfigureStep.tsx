"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { PLANS, ADDONS } from "@/lib/constants/pricing";
import { formatPrice } from "@/lib/currency";
import { useCurrency } from "@/context/CurrencyContext";
import { db, auth } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp, getDoc, doc, updateDoc } from "firebase/firestore";
import { onAuthStateChanged, User } from "firebase/auth";
import { 
  Loader2, 
  Check, 
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Trash2
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useCreation } from "@/context/CreationContext";

interface ConfigureStepProps {
  draftId?: string;
}

export default function ConfigureStep({ draftId: initialDraftId }: ConfigureStepProps) {
  const router = useRouter();
  const { momentData, setMomentData, setOnContinue, setSaving, setCanContinue } = useCreation();
  const [user, setUser] = useState<User | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const { currency } = useCurrency();
  const [fetchingDraft, setFetchingDraft] = useState(!!initialDraftId);
  const [localDraftId, setLocalDraftId] = useState<string | null>(initialDraftId || null);

  // Selection states
  const [selectedPlanId, setSelectedPlanId] = useState<"base" | "premium">("base");
  const [selectedAddonIds, setSelectedAddonIds] = useState<string[]>([]);

  // Auth listener
  useEffect(() => {
    if (!auth) return;
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoadingAuth(false);
    });
    return () => unsubscribe();
  }, []);

  // Fetch draft if editing
  useEffect(() => {
    async function fetchDraft() {
      if (!initialDraftId || !db) return;
      try {
        const docRef = doc(db, "drafts", initialDraftId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setMomentData(data); // Full sync to context
          setSelectedPlanId(data.plan || "base");
          setSelectedAddonIds(data.selectedAddons || []);
          setFetchingDraft(false); // Only set to false after setting state
        } else {
           setFetchingDraft(false);
        }
      } catch (error) {
        console.error("Error fetching draft:", error);
        setFetchingDraft(false);
      }
    }
    fetchDraft();
  }, [initialDraftId]);

  const selectedPlan = useMemo(() => 
    PLANS.find(p => p.id === selectedPlanId)!, 
  [selectedPlanId]);

  const toggleAddon = (addonId: string) => {
    if (selectedPlanId === "premium") return; // All included in premium
    
    // Lock paid addons for published moments
    const isPublished = momentData?.status === "Published";
    const isPaid = momentData?.paidAddons?.includes(addonId);
    if (isPublished && isPaid) return;

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

  // Sync with sidebar via context
  useEffect(() => {
    if (fetchingDraft) return; // Wait for initial fetch to complete
    
    setMomentData(prev => ({
      ...prev,
      plan: selectedPlanId,
      selectedAddons: (selectedPlanId === "premium") ? ADDONS.map(a => a.id) : selectedAddonIds,
      totalPrice
    }));
  }, [selectedPlanId, selectedAddonIds, totalPrice, setMomentData, fetchingDraft]);

  const handleContinue = useCallback(async () => {
    if (!user) {
      alert("Please sign in to continue!");
      return;
    }

    if (!db) return;

    setSaving(true);

    try {
      const draftData = {
        userId: user.uid,
        plan: selectedPlanId,
        currency,
        basePrice: selectedPlan.price[currency],
        selectedAddons: (selectedPlanId === "premium") ? ADDONS.map(a => a.id) : selectedAddonIds,
        totalPrice,
        status: "draft",
        lastStepId: "recipient",
        completedSteps: Array.from(new Set([...(momentData?.completedSteps || []), "configure"])),
        updatedAt: serverTimestamp(),
      };

      let finalDraftId = localDraftId;

      if (finalDraftId) {
        // Update existing
        await updateDoc(doc(db, "drafts", finalDraftId), draftData);
      } else {
        // Create new
        const docRef = await addDoc(collection(db, "drafts"), {
          ...draftData,
          createdAt: serverTimestamp(),
        });
        finalDraftId = docRef.id;
      }
      
      router.push(`/dashboard/create/${finalDraftId}/details`);
    } catch (error: any) {
      console.error("Error saving draft:", error);
      alert("Failed to save. Please try again.");
    } finally {
       setSaving(false);
    }
  }, [user, db, selectedPlanId, currency, selectedPlan, selectedAddonIds, totalPrice, localDraftId, router, setSaving]);

  // Register action with layout
  useEffect(() => {
    setOnContinue(() => handleContinue);
    setCanContinue(true); // Step 1 is always valid by default
    return () => setOnContinue(null);
  }, [handleContinue, setOnContinue, setCanContinue]);

  if (loadingAuth || fetchingDraft) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Content Container */}
      <div className="flex-1 w-full max-w-4xl px-4 lg:px-0 mx-auto py-10">
        {/* Header */}
        <div className="mb-12 text-center sm:text-left">
          <h1 className="text-3xl sm:text-5xl font-extrabold mb-4 text-[#1b110e] dark:text-white tracking-tight leading-tight">
            Design Your <span className="text-primary italic">Surprise</span>
          </h1>
          <p className="text-[#97604e] text-lg font-medium">
            Choose your foundation and add the perfect finishing touches.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {PLANS.map((plan) => (
            <Card 
              key={plan.id}
              className={cn(
                "relative cursor-pointer transition-all duration-300 overflow-hidden group border-2",
                selectedPlanId === plan.id 
                  ? "border-primary shadow-xl shadow-primary/5 bg-white dark:bg-[#2a1d19]" 
                  : "border-[#f3eae7] dark:border-[#3a2d29] hover:border-primary/30 bg-white/50 dark:bg-white/5"
              )}
              onClick={() => {
                const isPublished = momentData?.status === "Published";
                const currentPlan = momentData?.plan;
                
                // Prevent downgrade if published
                if (isPublished && currentPlan === "premium" && plan.id === "base") {
                  return;
                }

                setSelectedPlanId(plan.id as "base" | "premium");
                if (plan.id === "premium") setSelectedAddonIds([]); 
              }}
            >
              {plan.id === "premium" && (
                <div className="absolute top-0 right-0 bg-primary text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg">
                  BEST VALUE
                </div>
              )}
              <CardHeader className="pb-4">
                <CardTitle className="text-2xl font-bold dark:text-white">{plan.title}</CardTitle>
                <CardDescription className="text-[#97604e] font-medium leading-relaxed">
                  {plan.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-6">
                  <span className="text-3xl font-extrabold text-[#1b110e] dark:text-white">
                    {formatPrice(plan.price[currency], currency)}
                  </span>
                </div>
                <ul className="space-y-3">
                  {plan.features.slice(0, 5).map((feature, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-[#1b110e]/80 dark:text-white/80">
                      <div className="h-5 w-5 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
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

        {/* Add-ons */}
        <div className={cn(
          "rounded-xl p-6 lg:p-8 transition-all duration-500",
          selectedPlanId === "premium" 
            ? "bg-slate-50 dark:bg-white/5 border-2 border-slate-200 dark:border-white/10 opacity-60 pointer-events-none" 
            : "bg-white dark:bg-[#2a1d19] border-2 border-[#f3eae7] dark:border-[#3a2d29] shadow-sm"
        )}>
          <div className="mb-8">
            <h2 className="text-xl md:text-2xl font-bold text-[#1b110e] dark:text-white">
              Enhance with Add-ons
            </h2>
            <p className="text-[#97604e] text-sm mt-1 font-medium">
              {selectedPlanId === "premium" 
                ? "All add-ons are automatically included in Premium." 
                : "Customise your surprise with special extras."}
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {ADDONS.map((addon) => {
              const isSelected = selectedAddonIds.includes(addon.id) || selectedPlanId === "premium";
              return (
                <div
                  key={addon.id}
                  onClick={() => toggleAddon(addon.id)}
                  className={cn(
                    "p-4 rounded-lg border-2 transition-all flex items-start gap-4",
                    isSelected 
                      ? "border-primary/40 bg-primary/5" 
                      : "border-[#f3eae7] dark:border-[#3a2d29] hover:border-primary/20 bg-white dark:bg-transparent",
                    momentData?.status === "Published" && momentData?.paidAddons?.includes(addon.id)
                      ? "opacity-80 cursor-not-allowed select-none"
                      : "cursor-pointer"
                  )}
                >
                  <div className={cn(
                    "h-5 w-5 rounded border-2 flex items-center justify-center transition-colors mt-0.5",
                    isSelected ? "bg-primary border-primary" : "border-[#e7d6d0] dark:border-[#4a3d39]"
                  )}>
                    {isSelected && <Check className="h-3 w-3 text-white" strokeWidth={4} />}
                  </div>
                  <div className="flex-grow">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="font-bold text-[#1b110e] dark:text-white text-sm">{addon.title}</span>
                      <span className="text-xs font-bold text-primary">
                        +{formatPrice(addon.price[currency], currency)}
                      </span>
                    </div>
                    <p className="text-xs text-[#97604e] leading-snug font-medium">{addon.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
