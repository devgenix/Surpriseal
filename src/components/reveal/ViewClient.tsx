"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { doc, updateDoc, increment } from "firebase/firestore";
import { Loader2, Gift } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import RevealEngine from "@/components/reveal/RevealEngine";

type RevealStep = "countdown" | "engine";

interface ViewClientProps {
  initialMomentData: any;
  momentId: string;
}

export default function ViewClient({ initialMomentData, momentId }: ViewClientProps) {
  const router = useRouter();
  // Initialize step and countdown
  const [currentStep, setCurrentStep] = useState<RevealStep>(() => {
    if (initialMomentData.scheduledReveal && initialMomentData.revealTime) {
      let revealDate: number;
      const rt = initialMomentData.revealTime;
      if (rt.toDate) revealDate = rt.toDate().getTime();
      else if (rt._seconds) revealDate = rt._seconds * 1000;
      else revealDate = new Date(rt).getTime();

      return revealDate > Date.now() ? "countdown" : "engine";
    }
    return "engine";
  });

  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [hasIncremented, setHasIncremented] = useState(false);

  // Sync timeLeft if we start in countdown
  useEffect(() => {
    if (currentStep === "countdown" && initialMomentData.revealTime) {
      let revealDate: number;
      const rt = initialMomentData.revealTime;
      if (rt.toDate) revealDate = rt.toDate().getTime();
      else if (rt._seconds) revealDate = rt._seconds * 1000;
      else revealDate = new Date(rt).getTime();
      
      const diff = revealDate - Date.now();
      if (diff > 0) setTimeLeft(diff);
      else setCurrentStep("engine");
    }
  }, [currentStep, initialMomentData.revealTime]);

  // View Increment
  useEffect(() => {
    async function incrementView() {
      if (hasIncremented || !db || !momentId) return;
      try {
        const docRef = doc(db, "moments", momentId);
        await updateDoc(docRef, { views: increment(1) });
        setHasIncremented(true);
      } catch (err) {
        console.error("Error incrementing views:", err);
      }
    }
    incrementView();
  }, [momentId, hasIncremented]);

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

  const recipient = initialMomentData.recipientName || "Someone Special";
  const showBranding = initialMomentData.plan !== "premium" && !initialMomentData.paidAddons?.includes("removeBranding");

  // Refine moment for the engine
  const engineMoment = {
    ...initialMomentData,
    styleConfig: {
      ...initialMomentData.styleConfig,
      scenes: initialMomentData.styleConfig?.scenes?.length > 0 
        ? initialMomentData.styleConfig.scenes 
        : [{ id: "1", type: "scratch", config: { coverColor: "#e64c19", isFullScreen: false } }]
    },
    recipientName: initialMomentData.recipientName || "Someone Special",
    senderName: initialMomentData.senderName || "",
    isAnonymous: initialMomentData.isAnonymous || false,
    personalMessage: initialMomentData.personalMessage || "",
    media: initialMomentData.media || []
  };

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
            <RevealEngine moment={engineMoment} />
            
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
