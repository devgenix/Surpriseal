"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { ScratchCard } from "../ScratchCard";
import { X as XIcon, ChevronLeft, ChevronRight } from "lucide-react";

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
function StackGallery({ media }: { media: any[] }) {
  const [cards, setCards] = useState(media);

  useEffect(() => {
    setCards(media);
  }, [media]);

  const moveToEnd = () => {
    setCards(prev => {
      const newArray = [...prev];
      const topCard = newArray.pop();
      if (topCard) newArray.unshift(topCard);
      return newArray;
    });
  };

  const handleDragEnd = (event: any, info: any) => {
    const swipeThreshold = 50;
    const velocityThreshold = 500;
    
    if (
      Math.abs(info.offset.x) > swipeThreshold || 
      Math.abs(info.offset.y) > swipeThreshold ||
      Math.abs(info.velocity.x) > velocityThreshold ||
      Math.abs(info.velocity.y) > velocityThreshold
    ) {
      moveToEnd();
    }
  };

  return (
    <div className="relative w-full h-full flex items-center justify-center p-8 overflow-hidden touch-none">
      {cards.map((item, i) => {
        const isTop = i === cards.length - 1;
        const reverseIndex = cards.length - 1 - i;
        
        // Randomize base rotation per card slightly so they always look same in stack
        // Using item's ID or index to create a pseudo-random rotation
        const baseRotation = ((item.id.charCodeAt(0) || 0) % 5 - 2); 

        return (
          <motion.div
            key={item.id}
            layout
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ 
                scale: 1 - reverseIndex * 0.05, 
                y: reverseIndex * 15, // stack downwards slightly
                opacity: reverseIndex > 4 ? 0 : 1, // Max 5 visible behind
                rotate: isTop ? 0 : baseRotation * (reverseIndex * 1.5),
                zIndex: i
            }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            style={{ originX: 0.5, originY: 1 }}
            drag={isTop ? true : false} 
            dragConstraints={{ top: 0, bottom: 0, left: 0, right: 0 }}
            dragElastic={1}
            onDragEnd={isTop ? handleDragEnd : undefined}
            whileDrag={{ scale: 1.05, cursor: 'grabbing' }}
            className={cn(
                "absolute w-[80%] max-w-[320px] aspect-[4/5] rounded-xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5)] overflow-hidden cursor-grab bg-[#f8f8f8] p-2 sm:p-3 border border-black/5",
                isTop ? "pointer-events-auto" : "pointer-events-none"
            )}
          >
              <img src={item.url} className="w-full h-full object-cover rounded-lg shadow-inner pointer-events-none" draggable={false} />
          </motion.div>
        );
      })}
      
      {cards.length > 1 && (
        <div className="absolute bottom-12 text-white/50 text-[10px] font-black uppercase tracking-widest text-center w-full pointer-events-none animate-pulse">
          Swipe cards
        </div>
      )}
    </div>
  );
}

function GridGallery({ media }: { media: any[] }) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [[page, direction], setPage] = useState([0, 0]);

  const activeIndex = selectedIndex !== null ? (selectedIndex + page) % media.length : 0;
  const wrappedIndex = activeIndex < 0 ? media.length + activeIndex : activeIndex;

  const paginate = (newDirection: number) => {
    setPage([page + newDirection, newDirection]);
  };

  const handleNext = (e?: any) => {
    e?.stopPropagation?.();
    paginate(1);
  };

  const handlePrev = (e?: any) => {
    e?.stopPropagation?.();
    paginate(-1);
  };

  // Keyboard Navigation
  useEffect(() => {
    if (selectedIndex === null) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") handleNext();
      if (e.key === "ArrowLeft") handlePrev();
      if (e.key === "Escape") setSelectedIndex(null);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedIndex, handleNext, handlePrev]);

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 500 : -500,
      opacity: 0,
      scale: 0.9
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
      scale: 1
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 500 : -500,
      opacity: 0,
      scale: 0.9
    })
  };

  return (
    <div className="w-full h-full overflow-y-auto scrollbar-none custom-scroll relative bg-black/10">
      <style jsx global>{`
        .custom-scroll::-webkit-scrollbar { display: none; }
        .custom-scroll { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
      
      {/* Refined Grid Layout - 1 col Mobile, 2 col Desktop */}
      <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8 pt-12 pb-48 px-0 md:px-8 max-w-5xl mx-auto h-max min-h-full">
        {media.map((item: any, i: number) => {
          const rotation = (i % 2 === 0) ? -1 : 1; 
          
          return (
            <motion.div
              layoutId={selectedIndex === null ? `grid-container-${item.id}` : undefined}
              key={item.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "100px" }}
              transition={{ delay: (i % 4) * 0.1, duration: 0.6 }}
              style={{ rotate: rotation }}
              className="w-full relative group cursor-zoom-in shadow-2xl border-y md:border-[10px] border-[#f8f8f8] bg-[#f8f8f8] rounded-none md:rounded-sm overflow-hidden"
              onClick={() => {
                setSelectedIndex(i);
                setPage([0, 0]);
              }}
              whileHover={{ scale: 1.02, rotate: 0, zIndex: 10 }}
            >
              <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none" />
              <div className="relative w-full aspect-[4/5] bg-black/10">
                <motion.img 
                  layoutId={selectedIndex === null ? `grid-image-content-${item.id}` : undefined}
                  src={item.url} 
                  className="w-full h-full object-cover pointer-events-none" 
                  loading="lazy" 
                />
              </div>
            </motion.div>
          );
        })}
      </div>

      <AnimatePresence initial={false}>
        {selectedIndex !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-3xl overflow-hidden"
            onClick={() => setSelectedIndex(null)}
          >
            {/* Dynamic Background */}
            <motion.div 
              key={`bg-${wrappedIndex}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1 }}
              className="absolute inset-0 scale-110 blur-[100px] pointer-events-none"
              style={{
                backgroundImage: `url(${media[wrappedIndex].url})`,
                backgroundPosition: 'center',
                backgroundSize: 'cover'
              }}
            />

            {/* Close Button Top Right */}
            <button 
                onClick={() => setSelectedIndex(null)}
                className="absolute top-4 right-4 sm:top-8 sm:right-8 text-white/50 hover:text-white p-3 rounded-full bg-white/10 hover:bg-white/20 transition-all z-[120]"
            >
                <XIcon size={24} />
            </button>

            {/* Nav Arrows - STRICT Desktop (md and up) */}
            {media.length > 1 && (
              <div className="hidden md:flex absolute inset-x-8 top-1/2 -translate-y-1/2 justify-between items-center z-[110] pointer-events-none">
                <button 
                  onClick={handlePrev} 
                  className="text-white/40 hover:text-white p-4 rounded-full bg-black/20 hover:bg-black/60 backdrop-blur-md transition-all pointer-events-auto shadow-2xl"
                >
                  <ChevronLeft size={32} />
                </button>
                <button 
                  onClick={handleNext} 
                  className="text-white/40 hover:text-white p-4 rounded-full bg-black/20 hover:bg-black/60 backdrop-blur-md transition-all pointer-events-auto shadow-2xl"
                >
                  <ChevronRight size={32} />
                </button>
              </div>
            )}

            <div 
              className="w-full h-full flex items-center justify-center relative z-[100]"
              onClick={() => setSelectedIndex(null)}
            >
                <AnimatePresence initial={false} custom={direction} mode="popLayout">
                    <motion.div
                        key={page}
                        custom={direction}
                        variants={variants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{
                            x: { type: "spring", stiffness: 300, damping: 30 },
                            opacity: { duration: 0.2 }
                        }}
                        drag
                        dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                        dragElastic={0.8}
                        onDragEnd={(e, { offset, velocity }) => {
                            const swipeThreshold = 50;
                            const dismissThreshold = 80;

                            if (Math.abs(offset.y) > dismissThreshold) {
                                setSelectedIndex(null);
                                return;
                            }

                            if (offset.x < -swipeThreshold) {
                                handleNext();
                            } else if (offset.x > swipeThreshold) {
                                handlePrev();
                            }
                        }}
                        className="absolute inset-0 flex items-center justify-center p-0 sm:p-12 cursor-pointer active:cursor-grabbing"
                    >
                        <motion.img
                            layoutId={page === 0 ? `grid-image-content-${media[selectedIndex].id}` : undefined}
                            src={media[wrappedIndex].url}
                            className="max-w-[95%] max-h-[90vh] sm:max-h-[85vh] object-contain shadow-2xl transition-transform active:scale-95"
                            draggable={false}
                            onClick={(e) => {
                                e.stopPropagation();
                                setSelectedIndex(null);
                            }}
                        />
                    </motion.div>
                </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SlideshowGallery({ media }: { media: any[] }) {
  const [slideshowIndex, setSlideshowIndex] = useState(0);

  useEffect(() => {
    if (media.length > 0) {
      const timer = setInterval(() => {
        setSlideshowIndex(prev => (prev + 1) % media.length);
      }, 3000);
      return () => clearInterval(timer);
    }
  }, [media.length]);

  if (media.length === 0) return null;
  const currentItem = media[slideshowIndex];

  return (
    <div className="w-full h-full flex items-center justify-center relative overflow-hidden">
        {/* Blurred Background Layer */}
        <div 
          className="hidden sm:block absolute inset-0 z-0 scale-110 blur-2xl opacity-40 transition-all duration-1000"
          style={{ 
            backgroundImage: `url(${currentItem?.url})`,
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
                  src={currentItem?.url} 
                  className="w-full h-full object-contain pointer-events-none" 
                  alt={`Gallery ${slideshowIndex}`}
                />
             </div>
          </motion.div>
        </AnimatePresence>
      </div>
  );
}

export function GalleryUtility({ config }: { config: any }) {
  const media = config.media || [];

  if (media.length === 0) {
      return (
          <div className="w-full h-full flex items-center justify-center">
              <p className="text-white/50 text-sm font-bold uppercase tracking-widest">No Media Available</p>
          </div>
      );
  }

  if (config.layout === "stack") {
      return <StackGallery media={media} />;
  }

  if (config.layout === "grid") {
      return <GridGallery media={media} />;
  }

  // Fallback to slideshow for default or slideshow mode
  return <SlideshowGallery media={media} />;
}

// --- Composition Utility ---
export function CompositionUtility({ config }: { config: any }) {
    const paperStyle = config.paperStyle || "glass";
    
    const styles: Record<string, string> = {
        none: "bg-transparent shadow-none border-none",
        glass: "bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl rounded-[2.5rem]",
        midnight: "bg-black/40 backdrop-blur-xl border border-white/10 shadow-2xl rounded-[2.5rem] text-white",
        parchment: "bg-[#f4efe1] border-2 border-[#dcd1b3] shadow-inner rounded-sm relative overflow-hidden text-[#4a3b2a]",
        golden: "bg-white border-2 border-[#d4af37] shadow-[0_5px_40px_rgba(212,175,55,0.15)] rounded-2xl relative text-black",
        aurora: "bg-white/5 backdrop-blur-md border border-white/20 shadow-2xl rounded-[3rem] overflow-hidden",
        typewriter: "bg-[#fafafa] border border-[#e5e5e5] shadow-lg rounded-none relative text-black font-mono",
        velvet: "bg-[#4a0404] border-b-4 border-r-4 border-black/40 shadow-2xl rounded-2xl text-[#f5e6d3]"
    };

    // Split content to animate elements individually if possible
    // This is a simple heuristic: split by tags
    const contentParts = (config.text || "Life is full of surprises...")
        .split(/(?=<p|<img|<div)/g)
        .filter(Boolean);

    return (
        <div className="w-full h-full overflow-y-auto pt-24 pb-48 px-4 sm:px-12 scrollbar-none custom-scroll">
            <style jsx global>{`
                .custom-scroll::-webkit-scrollbar { display: none; }
                .custom-scroll { -ms-overflow-style: none; scrollbar-width: none; }
                @keyframes aurora-gradient {
                    0% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                    100% { background-position: 0% 50%; }
                }
                .aurora-bg {
                    background: linear-gradient(-45deg, rgba(238, 119, 82, 0.1), rgba(231, 60, 126, 0.1), rgba(35, 166, 213, 0.1), rgba(35, 213, 171, 0.1));
                    background-size: 400% 400%;
                    animation: aurora-gradient 15s ease infinite;
                }
            `}</style>
            
            <div className="w-full min-h-full flex flex-col items-center justify-start">
                <motion.div 
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                        "w-full max-w-2xl p-6 flex flex-col gap-8 transition-all duration-1000 h-auto min-h-[50vh] flex-shrink-0",
                        styles[paperStyle],
                        paperStyle === "aurora" ? "aurora-bg" : ""
                    )}
                >
                {/* Style Specific Overlays */}
                {paperStyle === "parchment" && (
                    <div className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-multiply" 
                        style={{ backgroundImage: 'url(https://www.transparenttextures.com/patterns/natural-paper.png)' }} 
                    />
                )}
                {paperStyle === "golden" && (
                    <div className="absolute inset-0 pointer-events-none border-4 border-[#d4af37]/10 rounded-2xl m-1" />
                )}
                {paperStyle === "typewriter" && (
                    <div className="absolute inset-x-0 top-0 h-8 bg-black/5 flex items-center px-4 justify-between border-b border-black/10">
                        <div className="flex gap-1">
                            <div className="size-2 rounded-full bg-black/10" />
                            <div className="size-2 rounded-full bg-black/10" />
                        </div>
                    </div>
                )}

                {/* Rich Content Reveal */}
                <div className="rich-text-container w-full">
                    {contentParts.map((part: string, idx: number) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-10%" }}
                            transition={{ duration: 0.8, delay: idx * 0.1, ease: [0.21, 1, 0.44, 1] }}
                            dangerouslySetInnerHTML={{ __html: part }}
                        />
                    ))}
                </div>

                {/* Signature / End Ornament */}
                <motion.div 
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 0.3 }}
                    className="mt-12 flex items-center justify-center"
                >
                    <div className="h-px w-12 bg-current opacity-30" />
                    <span className="mx-4 text-xs tracking-[0.5em] font-black uppercase">End of Note</span>
                    <div className="h-px w-12 bg-current opacity-30" />
                </motion.div>
                </motion.div>
            </div>
        </div>
    );
}
