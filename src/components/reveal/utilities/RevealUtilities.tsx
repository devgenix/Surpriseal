"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { ScratchCard } from "../ScratchCard";

// --- Scratch Utility ---
export function ScratchUtility({ config, onComplete }: { config: any, onComplete: () => void }) {
  const [revealed, setRevealed] = useState(false);

  return (
    <div className={cn(
      "relative flex items-center justify-center transition-all duration-700",
      config.isFullScreen ? "w-full h-full" : "w-[90%] aspect-[4/5] max-w-sm"
    )}>
      <ScratchCard
        coverColor={config.coverColor || "#e64c19"}
        onComplete={() => {
          setRevealed(true);
          setTimeout(onComplete, 2000);
        }}
      >
        <div className="w-full h-full bg-[#1b110e] flex flex-col items-center justify-center p-0 text-center relative overflow-hidden">
            {config.mediaUrl ? (
               <img src={config.mediaUrl} className="w-full h-full object-cover" />
            ) : (
                <div className="flex flex-col items-center gap-4 p-8 text-white">
                    <span className="text-4xl italic font-serif">Something special...</span>
                    <p className="text-[10px] font-bold uppercase tracking-widest opacity-50">Scratch to reveal</p>
                </div>
            )}
        </div>
      </ScratchCard>
    </div>
  );
}

// --- Gallery Utility ---
export function GalleryUtility({ config }: { config: any }) {
  const media = config.media || [];
  const [slideshowIndex, setSlideshowIndex] = useState(0);

  useEffect(() => {
    if (config.layout === "slideshow") {
      const timer = setInterval(() => {
        setSlideshowIndex(prev => (prev + 1) % media.length);
      }, 3000);
      return () => clearInterval(timer);
    }
  }, [config.layout, media.length]);
  
  if (config.layout === "stack") {
      return (
          <div className="relative w-full h-full flex items-center justify-center p-8">
              {media.map((item: any, i: number) => (
                  <motion.div
                    key={item.id}
                    initial={{ scale: 0.8, y: 20, opacity: 0 }}
                    animate={{ 
                        scale: 1 - i * 0.05, 
                        y: -i * 20, 
                        opacity: 1,
                        rotate: (i % 2 === 0 ? 1 : -1) * (i * 2)
                    }}
                    className="absolute w-[80%] aspect-[3/4] rounded-2xl border-4 border-white shadow-xl overflow-hidden"
                  >
                      <img src={item.url} className="w-full h-full object-cover" />
                  </motion.div>
              ))}
          </div>
      );
  }

  if (config.layout === "slideshow" && media.length > 0) {
    const currentItem = media[slideshowIndex];
    return (
      <div className="w-full h-full flex items-center justify-center relative overflow-hidden">
        {/* Blurred Background Layer */}
        <div 
          className="hidden sm:block absolute inset-0 z-0 scale-110 blur-2xl opacity-40"
          style={{ 
            backgroundImage: `url(${currentItem.url})`,
            backgroundPosition: 'center',
            backgroundSize: 'cover'
          }}
        />
        
        <AnimatePresence mode="wait">
          <motion.div
            key={slideshowIndex}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="relative z-10 w-full h-full flex items-center justify-center p-8 sm:p-12"
          >
             <div className="relative w-full h-full lg:rounded-3xl overflow-hidden shadow-2xl lg:border-4 border-white/20 lg:bg-black/20 lg:backdrop-blur-sm">
                <img 
                  src={currentItem.url} 
                  className="w-full h-full object-contain" 
                  alt={`Gallery ${slideshowIndex}`}
                />
             </div>
          </motion.div>
        </AnimatePresence>
      </div>
    )
  }

  return (
    <div className="w-full h-full grid grid-cols-2 gap-4 p-8">
      {media.map((item: any, i: number) => (
        <motion.div
            key={item.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
            className="aspect-square rounded-xl overflow-hidden shadow-lg border-2 border-white"
        >
            <img src={item.url} className="w-full h-full object-cover" />
        </motion.div>
      ))}
    </div>
  );
}

// --- Composition Utility ---
export function CompositionUtility({ config }: { config: any }) {
    return (
        <div className="w-full h-full flex flex-col items-center justify-center p-12 text-center gap-10">
            <AnimatePresence mode="wait">
                {config.mediaUrl && (
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="w-full aspect-video rounded-3xl overflow-hidden shadow-2xl border-4 border-white/50"
                    >
                        <img src={config.mediaUrl} className="w-full h-full object-cover" />
                    </motion.div>
                )}
            </AnimatePresence>
            
            <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-3xl font-serif italic text-text-main leading-relaxed"
            >
                {config.text || "Life is full of surprises..."}
            </motion.p>
        </div>
    );
}
