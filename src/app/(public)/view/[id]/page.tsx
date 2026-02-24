"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc, increment, query, collection, where, getDocs } from "firebase/firestore";
import { Loader2, Gift, Heart, Cake, PartyPopper, ArrowRight, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertModal } from "@/components/ui/AlertModal";

import RevealEngine from "@/components/reveal/RevealEngine";

type RevealStep = "countdown" | "engine";

export default function PublicViewPage() {
  const params = useParams();
  const router = useRouter();
  const { id } = params as { id: string };

  const [loading, setLoading] = useState(true);
  const [momentData, setMomentData] = useState<any>(null);
  const [currentStep, setCurrentStep] = useState<RevealStep>("engine");
  const [timeLeft, setTimeLeft] = useState<number>(0);

  // Load moment data
  useEffect(() => {
    async function fetchData() {
      if (!id) return;
      try {
        setLoading(true);

        // 1. Collect potential matches from moments collection
        const results: any[] = [];
        
        // Direct ID Lookup
        const momentSnap = await getDoc(doc(db!, "moments", id));
        if (momentSnap.exists()) {
          results.push({ id: momentSnap.id, data: momentSnap.data() });
        }
        
        // Slug Lookup (Case-insensitive via lowercase match)
        const slugLower = id.toLowerCase();
        const momentSlugSnap = await getDocs(query(collection(db!, "moments"), where("urlSlug", "==", slugLower)));
        momentSlugSnap.forEach(doc => {
          // Avoid duplicates if ID match already found
          if (!results.find(r => r.id === doc.id)) {
            results.push({ id: doc.id, data: doc.data() });
          }
        });

        if (results.length > 0) {
          // 2. Select the most recent version
          const winner = results.sort((a, b) => {
            const timeA = a.data.updatedAt?.toMillis() || a.data.publishedAt?.toMillis() || a.data.createdAt?.toMillis() || 0;
            const timeB = b.data.updatedAt?.toMillis() || b.data.publishedAt?.toMillis() || b.data.createdAt?.toMillis() || 0;
            return timeB - timeA;
          })[0];
          
          setMomentData(winner.data);
          
          // Increment views
          const winnerRef = doc(db!, "moments", winner.id);
          await updateDoc(winnerRef, { views: increment(1) });
          
          handleSchedule(winner.data);
        } else {
          router.push("/");
        }
      } catch (err) {
        console.error("Error fetching moment:", err);
      } finally {
        setLoading(false);
      }
    }

    function handleSchedule(data: any) {
      if (data.scheduledReveal && data.revealTime) {
        const revealDate = data.revealTime.toDate().getTime();
        const now = Date.now();
        if (revealDate > now) {
          setTimeLeft(revealDate - now);
          setCurrentStep("countdown");
        } else {
          setCurrentStep("engine");
        }
      } else {
        setCurrentStep("engine");
      }
    }

    fetchData();
  }, [id, router]);

  // Countdown timer
  useEffect(() => {
    if (currentStep !== "countdown") return;
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1000) {
          clearInterval(interval);
          setCurrentStep("engine");
          return 0;
        }
        return prev - 1000;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [currentStep]);

  const formatCountdown = (ms: number) => {
    const seconds = Math.floor((ms / 1000) % 60);
    const minutes = Math.floor((ms / (1000 * 60)) % 60);
    const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);
    const days = Math.floor(ms / (1000 * 60 * 60 * 24));
    return `${days}d ${hours}h ${minutes}m ${seconds}s`;
  };

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#1b110e]">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  const recipient = momentData?.recipientName || "Someone Special";
  const showBranding = momentData?.plan !== "premium" && !momentData?.paidAddons?.includes("removeBranding");

  // Align with RevealStudio's previewMoment logic for consistency
  const engineMoment = momentData ? {
    ...momentData,
    styleConfig: {
      ...momentData.styleConfig,
      scenes: momentData.styleConfig?.scenes?.length > 0 
        ? momentData.styleConfig.scenes 
        : [{ id: "1", type: "scratch", config: { coverColor: "#e64c19", isFullScreen: false } }]
    },
    recipientName: momentData.recipientName || "Someone Special",
    senderName: momentData.senderName || "",
    isAnonymous: momentData.isAnonymous || false,
    personalMessage: momentData.personalMessage || "",
    media: momentData.media || []
  } : null;

  return (
    <div className="h-screen w-full bg-black overflow-hidden relative font-display">
      <AnimatePresence mode="wait">
        
        {/* Step: Countdown */}
        {currentStep === "countdown" && (
          <motion.div 
            key="countdown"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center h-full text-center px-6 bg-[#1b110e]"
          >
            <div className="p-6 rounded-full bg-primary/5 mb-8">
              <Gift className="w-12 h-12 text-primary animate-bounce" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Something special is coming...</h2>
            <p className="text-[#97604e] mb-8 font-medium">For {recipient}</p>
            <div className="text-4xl font-black text-primary tabular-nums tracking-wider px-8 py-4 bg-white/5 border border-white/10 rounded-2xl shadow-xl">
              {formatCountdown(timeLeft)}
            </div>
          </motion.div>
        )}


        {/* Step: Reveal Engine */}
        {currentStep === "engine" && (
          <motion.div
            key="engine"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="h-full w-full"
          >
            {/* Pass refined moment to engine */}
            {engineMoment && <RevealEngine moment={engineMoment} />}
            
            {/* Conversion Footer (Floating) - Only show if branding is not removed */}
            {showBranding && (
              <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-[100] w-full max-w-xs transition-transform hover:scale-105 active:scale-95">
                <button 
                    onClick={() => router.push("/")}
                    className="w-full py-4 bg-white/10 backdrop-blur-xl border border-white/20 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-2xl"
                  >
                    Create your own 🎁
                  </button>
              </div>
            )}
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
