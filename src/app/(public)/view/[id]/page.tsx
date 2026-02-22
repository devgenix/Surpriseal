"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Confetti from "react-confetti";
import { Button } from "antd";
import { PlayCircle, Volume2, Heart } from "lucide-react";
import Link from "next/link";

// Mock Data
const surpriseData = {
  recipient: "Sarah",
  openingMessage: "Sarah, you bring so much light into the world. Here are a few moments that make me smile when I think of you...",
  photos: [
    "https://images.unsplash.com/photo-1513201099705-a9746e1e201f?q=80&w=2897&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=2940&auto=format&fit=crop",
  ],
  videoUrl: null, // or URL
  finalMessage: "Happy Birthday! I love you more than words can say. Can't wait to celebrate with you tonight!",
  hasConfetti: true,
};

export default function ExperiencePage() {
  const [stage, setStage] = useState(0);
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    setWindowSize({ width: window.innerWidth, height: window.innerHeight });
  }, []);

  const nextStage = () => setStage((prev) => prev + 1);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.8, ease: "easeInOut" as const } }, 
    exit: { opacity: 0, y: -20, scale: 1.05, transition: { duration: 0.5 } },
  };

  return (
    <div className="fixed inset-0 overflow-hidden bg-background flex items-center justify-center font-sans">
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/15 via-background to-background z-0" />
      <div className="absolute top-0 left-0 w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 z-0 pointer-events-none brightness-100 contrast-150 mix-blend-overlay"></div>
      
      {stage === 4 && surpriseData.hasConfetti && (
         <div className="absolute inset-0 z-50 pointer-events-none">
            <Confetti width={windowSize.width} height={windowSize.height} numberOfPieces={300} gravity={0.15} colors={['#e64c19', '#FFDCC3', '#E88D72', '#FFC107']} />
         </div>
      )}

      <div className="relative z-10 w-full max-w-md px-6 text-center">
        <AnimatePresence mode="wait">
          {/* Stage 0: Welcome */}
          {stage === 0 && (
            <motion.div
              key="welcome"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="flex flex-col items-center"
            >
              <div className="mb-10 p-6 bg-white/50 backdrop-blur-xl rounded-full shadow-2xl ring-1 ring-white/50">
                <Heart className="w-16 h-16 text-primary animate-pulse" fill="currentColor" />
              </div>
              <h1 className="text-4xl font-extrabold text-gray-900 mb-6 tracking-tight">For {surpriseData.recipient}</h1>
              <p className="text-xl text-gray-600 mb-12 font-medium">A special surprise awaits you.</p>
              <Button type="primary" size="large" onClick={nextStage} className="h-16 px-12 text-xl font-bold rounded-full shadow-xl shadow-primary/30 hover:scale-105 transition-all hover:shadow-2xl hover:shadow-primary/40">
                Tap to Open
              </Button>
            </motion.div>
          )}

          {/* Stage 1: Opening Message */}
          {stage === 1 && (
            <motion.div
              key="message"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="flex flex-col items-center max-w-sm mx-auto"
            >
               <div className="bg-white/60 backdrop-blur-md p-8 rounded-3xl shadow-lg border border-white/40 relative">
                  <div className="absolute -top-4 -left-4 text-6xl text-primary/20 font-serif">"</div>
                  <h2 className="text-2xl font-medium text-gray-800 leading-relaxed italic relative z-10">
                    {surpriseData.openingMessage}
                  </h2>
                   <div className="absolute -bottom-8 -right-4 text-6xl text-primary/20 font-serif rotate-180">"</div>
               </div>
               <div className="mt-12">
                  <Button type="text" onClick={nextStage} className="text-gray-500 hover:text-primary text-lg font-medium flex-col h-auto gap-2 group">
                    Continue <span className="text-xs opacity-50 group-hover:translate-y-1 transition-transform">↓</span>
                  </Button>
               </div>
            </motion.div>
          )}

           {/* Stage 2: Photos */}
           {stage === 2 && (
            <motion.div
              key="photos"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="flex flex-col items-center w-full"
            >
               <div className="relative w-full aspect-[4/5] bg-white p-2 rounded-3xl shadow-2xl mb-8 rotate-1 hover:rotate-0 transition-transform duration-500 ring-1 ring-black/5">
                  <div className="w-full h-full rounded-2xl overflow-hidden relative">
                     <img src={surpriseData.photos[0]} className="object-cover w-full h-full" alt="Memory" />
                     <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-60"></div>
                  </div>
               </div>
              <Button type="text" onClick={nextStage} className="text-gray-500 hover:text-primary mt-4">
                Next Memory →
              </Button>
            </motion.div>
          )}

            {/* Stage 3: Video/Voice */}
           {stage === 3 && (
            <motion.div
              key="media"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="flex flex-col items-center w-full"
            >
                <div className="w-full aspect-video bg-black rounded-3xl flex items-center justify-center mb-8 shadow-2xl relative overflow-hidden group cursor-pointer">
                    <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=2940&auto=format&fit=crop')] bg-cover bg-center opacity-40 group-hover:scale-105 transition-transform duration-700"></div>
                    <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center z-10 group-hover:scale-110 transition-transform">
                        <PlayCircle className="w-10 h-10 text-white fill-white" />
                    </div>
                </div>
                <p className="text-gray-600 mb-8 font-medium">Watch this video...</p>
              <Button type="primary" ghost size="large" onClick={nextStage} className="h-14 px-8 rounded-full border-2 border-primary/20 text-primary hover:border-primary hover:bg-primary/5">
                Reveal Surprise ✨
              </Button>
            </motion.div>
          )}

          {/* Stage 4: Final Reveal */}
          {stage === 4 && (
             <motion.div
              key="reveal"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="flex flex-col items-center"
            >
              <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-br from-primary to-accent mb-8 leading-tight tracking-tight drop-shadow-sm">
                {surpriseData.finalMessage}
              </h1>
              <div className="p-8 bg-white/70 backdrop-blur-md rounded-3xl shadow-xl border border-white/60 w-full max-w-sm">
                 <p className="text-gray-600 mb-6 font-medium">Send a reaction back!</p>
                 <div className="flex gap-4 justify-center">
                    <Button shape="circle" size="large" className="w-14 h-14 text-2xl border-none shadow-md bg-white hover:scale-110 transition-transform">❤️</Button>
                    <Button shape="circle" size="large" className="w-14 h-14 text-2xl border-none shadow-md bg-white hover:scale-110 transition-transform">🥺</Button>
                    <Button shape="circle" size="large" className="w-14 h-14 text-2xl border-none shadow-md bg-white hover:scale-110 transition-transform">🎉</Button>
                 </div>
              </div>
               <div className="mt-12">
                   <Link href="/" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-primary transition-colors font-medium">
                     <span className="w-2 h-2 rounded-full bg-primary/40"></span>
                     Created with Surpriseal
                   </Link>
               </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
