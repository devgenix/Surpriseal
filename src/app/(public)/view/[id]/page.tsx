"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc, increment } from "firebase/firestore";
import { Loader2, Gift, Heart, Cake, PartyPopper, ArrowRight, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ReactConfetti from "react-confetti";
import { ScratchCard } from "@/components/reveal/ScratchCard";

type RevealStep = "countdown" | "splash" | "interaction" | "celebration" | "scratch" | "reveal";

export default function PublicViewPage() {
  const params = useParams();
  const router = useRouter();
  const { id } = params as { id: string };

  const [loading, setLoading] = useState(true);
  const [momentData, setMomentData] = useState<any>(null);
  const [currentStep, setCurrentStep] = useState<RevealStep>("splash");
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });

  // Load moment data
  useEffect(() => {
    async function fetchData() {
      if (!id) return;
      try {
        // Try moments first
        let docRef = doc(db!, "moments", id);
        let docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
          // Try drafts (for preview purposes)
          docRef = doc(db!, "drafts", id);
          docSnap = await getDoc(docRef);
        }

        if (docSnap.exists()) {
          const data = docSnap.data();
          setMomentData(data);
          
          // Increment view count
          await updateDoc(docRef, { views: increment(1) });

          // Check for scheduled reveal
          if (data.scheduledReveal && data.revealTime) {
            const revealDate = data.revealTime.toDate().getTime();
            const now = Date.now();
            if (revealDate > now) {
              setTimeLeft(revealDate - now);
              setCurrentStep("countdown");
            }
          }
        } else {
          router.push("/");
        }
      } catch (err) {
        console.error("Error fetching moment:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id, router]);

  // Handle window resize for confetti
  useEffect(() => {
    const handleResize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Countdown timer
  useEffect(() => {
    if (currentStep !== "countdown") return;
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1000) {
          clearInterval(interval);
          setCurrentStep("splash");
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
      <div className="h-screen w-full flex items-center justify-center bg-[#FFFBF8]">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  const occasion = momentData?.occasionId || "Birthday";
  const recipient = momentData?.recipientName || "Darling";

  const getCelebrationIcon = () => {
    switch (occasion) {
      case "Anniversary": return <Heart className="w-20 h-20 text-red-500" />;
      case "Birthday": return <Cake className="w-20 h-20 text-primary" />;
      default: return <PartyPopper className="w-20 h-20 text-primary" />;
    }
  };

  return (
    <div className="h-screen w-full bg-[#FFFBF8] dark:bg-[#1b110e] overflow-hidden relative font-display">
      <AnimatePresence mode="wait">
        
        {/* Step: Countdown */}
        {currentStep === "countdown" && (
          <motion.div 
            key="countdown"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center h-full text-center px-6"
          >
            <div className="p-6 rounded-full bg-primary/5 mb-8">
              <Gift className="w-12 h-12 text-primary animate-bounce" />
            </div>
            <h2 className="text-2xl font-bold text-[#1b110e] dark:text-white mb-2">Something special is coming...</h2>
            <p className="text-[#97604e] mb-8 font-medium">For {recipient}</p>
            <div className="text-4xl font-black text-primary tabular-nums tracking-wider px-8 py-4 bg-white dark:bg-white/5 border border-[#e7d6d0] rounded-2xl shadow-xl">
              {formatCountdown(timeLeft)}
            </div>
          </motion.div>
        )}

        {/* Step: Splash */}
        {currentStep === "splash" && (
          <motion.div 
            key="splash"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            className="flex flex-col items-center justify-center h-full text-center px-6 bg-gradient-to-b from-primary/5 to-transparent"
          >
            <h1 className="text-5xl sm:text-7xl font-black text-primary mb-6 tracking-tighter">
              {recipient},
            </h1>
            <p className="text-xl sm:text-2xl font-bold text-[#1b110e] dark:text-white mb-12">
              Someone has shared a special moment with you.
            </p>
            <button 
              onClick={() => setCurrentStep("interaction")}
              className="group flex items-center gap-3 px-10 py-5 bg-primary text-white text-xl font-black rounded-full shadow-2xl shadow-primary/30 hover:scale-105 transition-transform active:scale-95"
            >
              Open Surprise
              <ArrowRight className="group-hover:translate-x-1 transition-transform" />
            </button>
          </motion.div>
        )}

        {/* Step: Interaction */}
        {currentStep === "interaction" && (
          <motion.div 
            key="interaction"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex flex-col items-center justify-center h-full text-center px-6"
          >
            <h2 className="text-3xl sm:text-4xl font-black text-[#1b110e] dark:text-white mb-12 leading-tight">
              {occasion === "Anniversary" ? "Are you ready for some love?" : "Are you ready to celebrate?"}
            </h2>
            <div className="flex gap-4">
              <button 
                onClick={() => setCurrentStep("celebration")}
                className="px-12 py-5 bg-emerald-500 text-white text-xl font-black rounded-2xl shadow-xl shadow-emerald-500/20 hover:scale-105 transition-transform active:scale-95"
              >
                Yes! ✨
              </button>
              <button 
                onClick={() => alert("Oh, come on! Don't be shy! 😉")}
                className="px-8 py-5 border-2 border-[#e7d6d0] text-[#97604e] text-lg font-bold rounded-2xl hover:bg-gray-50 transition-colors"
              >
                Not yet
              </button>
            </div>
          </motion.div>
        )}

        {/* Step: Celebration */}
        {currentStep === "celebration" && (
          <motion.div 
            key="celebration"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center h-full text-center px-6 z-50"
          >
            <ReactConfetti 
              width={windowSize.width} 
              height={windowSize.height}
              numberOfPieces={300}
              recycle={false}
              colors={occasion === "Anniversary" ? ["#EF4444", "#FCA5A5", "#FFFFFF"] : ["#e64c19", "#FFDCC3", "#FFFBF8", "#e64c19"]}
            />
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1.2, 1] }}
              transition={{ duration: 0.8, times: [0, 0.6, 1] }}
              className="mb-8"
            >
              {getCelebrationIcon()}
            </motion.div>
            <h2 className="text-4xl sm:text-6xl font-black text-primary mb-8 tracking-tighter uppercase">
              Yay!!! 🎉
            </h2>
            <button 
              onClick={() => setCurrentStep("scratch")}
              className="px-10 py-5 bg-primary text-white text-xl font-black rounded-full shadow-2xl shadow-primary/30 animate-pulse"
            >
              See your message
            </button>
          </motion.div>
        )}

        {/* Step: Scratch */}
        {currentStep === "scratch" && (
          <motion.div 
            key="scratch"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center h-full text-center px-4"
          >
            <div className="w-full max-w-sm aspect-square bg-white dark:bg-white/5 rounded-3xl overflow-hidden shadow-2xl border-4 border-white dark:border-white/10 relative">
              <ScratchCard 
                width={window.innerWidth < 400 ? 320 : 384} 
                height={window.innerWidth < 400 ? 320 : 384}
                onComplete={() => setTimeout(() => setCurrentStep("reveal"), 1000)}
                coverColor={occasion === "Anniversary" ? "#EF4444" : "#e64c19"}
              >
                <div className="flex flex-col items-center gap-4 text-center">
                  <Sparkles className="w-8 h-8 text-primary animate-pulse" />
                  <p className="text-xl font-bold text-[#1b110e] dark:text-white leading-relaxed">
                    {momentData?.personalMessage?.substring(0, 100)}...
                  </p>
                </div>
              </ScratchCard>
            </div>
            <p className="mt-8 text-sm font-bold text-[#97604e] uppercase tracking-widest animate-pulse">
              Scratch the surface to reveal
            </p>
          </motion.div>
        )}

        {/* Step: Reveal */}
        {currentStep === "reveal" && (
          <motion.div 
            key="reveal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="h-full w-full overflow-y-auto px-4 py-12 bg-[#FFFBF8] dark:bg-[#1b110e]"
          >
            <div className="max-w-2xl mx-auto flex flex-col items-center">
              
              <div className="text-center mb-16">
                <span className="inline-block px-4 py-1.5 bg-primary/10 text-primary rounded-full text-xs font-black uppercase tracking-widest mb-4">
                  {occasion} Message
                </span>
                <h2 className="text-4xl sm:text-5xl font-black text-[#1b110e] dark:text-white mb-8 tracking-tight leading-tight">
                  For {recipient}
                </h2>
                <div className="w-20 h-1.5 bg-primary rounded-full mx-auto" />
              </div>

              <div className="w-full p-8 sm:p-12 bg-white dark:bg-white/5 rounded-[2rem] shadow-xl border border-[#e7d6d0] mb-12 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5">
                  {getCelebrationIcon()}
                </div>
                <p className="text-xl sm:text-2xl text-[#1b110e] dark:text-white leading-relaxed font-medium whitespace-pre-wrap">
                  {momentData?.personalMessage}
                </p>
              </div>

              {/* Media Gallery */}
              {momentData?.media && momentData.media.length > 0 && (
                <div className="w-full mb-20">
                  <h3 className="text-2xl font-black text-[#1b110e] dark:text-white mb-8 flex items-center gap-2">
                    <Sparkles className="text-primary" />
                    Memory Lane
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {momentData.media.map((item: any, idx: number) => (
                      <motion.div 
                        key={item.id}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="aspect-square rounded-2xl overflow-hidden border border-[#e7d6d0] shadow-md group"
                      >
                        {item.type === "video" ? (
                          <video src={item.url} autoPlay muted loop playsInline className="w-full h-full object-cover" />
                        ) : (
                          <img src={item.url} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                        )}
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Conversion Footer */}
              <div className="w-full py-12 px-8 bg-primary rounded-[2rem] text-center shadow-2xl shadow-primary/30 mb-8">
                <h4 className="text-2xl font-black text-white mb-4">Create your own unforgettable moment!</h4>
                <p className="text-white/80 font-bold mb-8">Surprise someone special today.</p>
                <button 
                  onClick={() => router.push("/")}
                  className="px-8 py-4 bg-white text-primary text-lg font-black rounded-xl hover:scale-105 transition-transform active:scale-95"
                >
                  Get Started — It's Free! 🎁
                </button>
              </div>

            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
