"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { db, auth } from "@/lib/firebase";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { onAuthStateChanged, User } from "firebase/auth";
import { 
  Loader2, 
  CreditCard,
  CheckCircle2,
  Gift,
  Zap,
  ShieldCheck,
  ChevronRight,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCreation } from "@/context/CreationContext";
import { formatPrice } from "@/lib/currency";
import { useCurrency } from "@/context/CurrencyContext";
import { ADDONS } from "@/lib/constants/pricing";
import Script from "next/script";

declare global {
  interface Window {
    PaystackPop: any;
  }
}

export default function CreationPayPage() {
  const router = useRouter();
  const params = useParams();
  const { id: draftId } = params as { id: string };
  const { currency } = useCurrency();

  const { 
    momentData,
    setMomentData, 
    setOnContinue,
    setCanContinue,
    setSaving
  } = useCreation();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auth check
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (!u) router.push("/login");
    });
    return () => unsubscribe();
  }, [router]);

  // Load draft data
  useEffect(() => {
    async function loadDraft() {
      if (!draftId || !user) return;
      try {
        const docRef = doc(db!, "drafts", draftId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setMomentData(data);
          setLoading(false);
          setCanContinue(true);
        } else {
          router.push("/dashboard");
        }
      } catch (err) {
        console.error("Error loading draft:", err);
      }
    }
    if (user) loadDraft();
  }, [draftId, user, router, setMomentData, setCanContinue]);

  const verifyPayment = async (reference: string) => {
    try {
      const res = await fetch("/api/paystack/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reference, draftId }),
      });
      const data = await res.json();
      if (data.success) {
        router.push(`/dashboard/${draftId}?success=true`);
      } else {
        setError(data.error || "Verification failed");
        setCompleting(false);
        setSaving(false);
      }
    } catch (err) {
      console.error("Verification error:", err);
      setError("Something went wrong during verification.");
      setCompleting(false);
      setSaving(false);
    }
  };

  const handlePaystackPayment = useCallback(() => {
    if (!window.PaystackPop) {
      setError("Payment system is still loading. Please try again in a moment.");
      return;
    }

    setCompleting(true);
    setSaving(true);
    setError(null);

    const handler = window.PaystackPop.setup({
      key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY,
      email: user?.email || "",
      amount: Math.round(amountToPay * 100), // Paystack amount is in kobo (NGN) or cents (USD)
      currency: currency, // Dynamic currency from context
      ref: `mom_${Math.floor(Math.random() * 1000000000 + 1)}`, 
      callback: (response: any) => {
        verifyPayment(response.reference);
      },
      onClose: () => {
        setCompleting(false);
        setSaving(false);
      },
    });

    handler.openIframe();
  }, [user, momentData, draftId, setSaving, currency]);

  const onCompleteAction = useCallback(async () => {
    if (!draftId) return;

    // Use Paystack for both NGN and USD as requested
    handlePaystackPayment();
  }, [draftId, handlePaystackPayment]);

  useEffect(() => {
    setOnContinue(() => onCompleteAction);
    return () => setOnContinue(null);
  }, [onCompleteAction, setOnContinue]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const totalPrice = momentData?.totalPrice || 0;
  const paidAmount = momentData?.paidAmount || 0;
  const amountToPay = Math.max(0, totalPrice - paidAmount);

  return (
    <div className="flex-1 w-full max-w-4xl mx-auto px-4 lg:px-0 py-10">
      <Script src="https://js.paystack.co/v1/inline.js" strategy="lazyOnload" />
      <div className="flex flex-col items-center sm:items-start animate-in fade-in slide-in-from-bottom-4 duration-700">
        
        <div className="mb-10 text-center sm:text-left">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#1b110e] dark:text-white mb-3 tracking-tight">
            Review & Complete
          </h1>
          <p className="text-lg text-[#97604e] font-medium">
            Double check the details and bring your surprise to life.
          </p>
        </div>

        <div className="w-full flex flex-col gap-6">
          
          {error && (
            <div className="p-4 rounded-lg bg-red-50 border border-red-100 flex items-center gap-3 text-red-600 animate-in fade-in slide-in-from-top-2">
              <AlertCircle size={20} />
              <p className="text-sm font-bold">{error}</p>
            </div>
          )}

          {/* Summary Card */}
          <div className="bg-white dark:bg-white/5 border border-[#e7d6d0] rounded-lg overflow-hidden shadow-sm">
            <div className="p-6 border-b border-[#e7d6d0]/50 bg-[#fdf1ec]/30">
              <h3 className="text-sm font-bold text-[#1b110e] uppercase tracking-widest flex items-center gap-2">
                <Gift size={16} className="text-primary" />
                Celebration Summary
              </h3>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-[#97604e] font-medium">Recipient</span>
                <span className="text-[#1b110e] font-bold">{momentData?.recipientName}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-[#97604e] font-medium">Occasion</span>
                <span className="text-[#1b110e] font-bold capitalize">{momentData?.occasionId?.replace('_', ' ')}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-[#97604e] font-medium">Plan</span>
                <span className="text-[#1b110e] font-bold capitalize">{momentData?.plan} Plan</span>
              </div>

              {/* Addons Breakdown */}
              {momentData?.selectedAddons?.length > 0 && (
                <div className="pt-4 mt-4 border-t border-[#e7d6d0]/30">
                  <h4 className="text-[10px] font-bold text-[#97604e] uppercase tracking-wider mb-2">Features Included</h4>
                  <div className="space-y-2">
                    {momentData.selectedAddons.map((addonId: string) => {
                      const addon = ADDONS.find(a => a.id === addonId);
                      const isPaid = momentData.paidAddons?.includes(addonId);
                      return (
                        <div key={addonId} className="flex justify-between items-center text-xs">
                          <div className="flex items-center gap-2">
                            <span className="text-[#1b110e] font-medium">{addon?.title}</span>
                            {isPaid && (
                              <span className="text-[8px] font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded border border-green-100 flex items-center gap-1">
                                <CheckCircle2 size={10} />
                                PAID
                              </span>
                            )}
                          </div>
                          <span className="text-[#97604e] font-bold">{formatPrice(addon?.price[currency] || 0, currency)}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              
              <div className="pt-4 mt-4 border-t border-[#e7d6d0]/50 space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-[#97604e] font-medium">Total Investment</span>
                  <span className="text-[#1b110e] font-bold">{formatPrice(totalPrice, currency)}</span>
                </div>
                
                {paidAmount > 0 && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-green-600 font-medium">Previously Paid</span>
                    <span className="text-green-600 font-bold">-{formatPrice(paidAmount, currency)}</span>
                  </div>
                )}

                <div className="flex justify-between items-center pt-2">
                  <span className="text-base font-bold text-[#1b110e]">Balance Due</span>
                  <span className="text-2xl font-black text-primary">
                    {formatPrice(Math.max(0, totalPrice - paidAmount), currency)}
                  </span>
                </div>
                
                <p className="text-[10px] text-[#97604e] font-bold uppercase tracking-wide">
                  {paidAmount > 0 ? "Incremental update for new features" : "One-time payment • All features included"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
