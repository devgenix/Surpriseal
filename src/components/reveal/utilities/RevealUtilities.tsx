"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { ScratchCard } from "../ScratchCard";
import { X as XIcon, ChevronLeft, ChevronRight, Play, Pause, Volume2, VolumeX, Video as VideoIcon, Mic } from "lucide-react";

const triggerHaptic = () => {
  if (typeof window !== "undefined" && window.navigator.vibrate) {
    window.navigator.vibrate(10);
  }
};

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
function StackGallery({ 
  media, 
  isAutoplay, 
  onComplete,
  globalVolume = 1,
  isGlobalMuted = false,
  onMediaPlayStatusChange
}: { 
  media: any[], 
  isAutoplay?: boolean, 
  onComplete?: (manual?: boolean) => void,
  globalVolume?: number,
  isGlobalMuted?: boolean,
  onMediaPlayStatusChange?: (playing: boolean) => void
}) {
  const [cards, setCards] = useState(media);
  const [currentIndex, setCurrentIndex] = useState(0);
  const videoRefs = useRef<{ [key: string]: HTMLVideoElement | null }>({});

  useEffect(() => {
    setCards(media);
  }, [media]);

  const moveToEnd = useCallback(() => {
    // Stop any video on the current top card
    const topCard = cards[cards.length - 1];
    if (topCard && topCard.type === "video") {
        videoRefs.current[topCard.id]?.pause();
    }

    setCards(prev => {
      const newArray = [...prev];
      const popped = newArray.pop();
      if (popped) newArray.unshift(popped);
      return newArray;
    });
    setCurrentIndex(prev => prev + 1);
  }, [cards]);

  useEffect(() => {
    const topCard = cards[cards.length - 1];
    if (topCard?.type === "video") {
        const video = videoRefs.current[topCard.id];
        if (video) {
            video.volume = globalVolume;
            video.muted = isGlobalMuted;
            if (isAutoplay) {
                video.play().catch(() => {});
                onMediaPlayStatusChange?.(true);
            }
        }
    } else {
        onMediaPlayStatusChange?.(false);
    }
  }, [cards, isAutoplay, globalVolume, isGlobalMuted, onMediaPlayStatusChange]);

  useEffect(() => {
    if (!isAutoplay) return;

    const currentCard = cards[cards.length - 1];
    if (!currentCard) return;

    const isVideo = currentCard.type === "video";
    // For autoplaying video, we wait for it to end. For images, we use a fixed duration.
    if (isVideo) return; // Handled by onEnded

    const duration = 4000;
    const timer = setTimeout(() => {
      if (currentIndex < media.length - 1) moveToEnd();
      else onComplete?.();
    }, duration);

    return () => clearTimeout(timer);
  }, [isAutoplay, currentIndex, cards, media.length, moveToEnd, onComplete]);

  const handleDragEnd = useCallback((event: any, info: any) => {
    const swipeThreshold = 50;
    if (Math.abs(info.offset.x) > swipeThreshold || Math.abs(info.offset.y) > swipeThreshold) {
      moveToEnd();
    }
  }, [moveToEnd]);

  return (
    <div className="relative w-full h-full flex items-center justify-center p-8 overflow-hidden touch-none">
      {isAutoplay && (
        <div className="absolute top-0 left-0 w-full h-1 z-[200] bg-white/10">
            <motion.div 
               key={currentIndex}
               className="h-full bg-primary" 
               initial={{ width: "0%" }}
               animate={{ width: "100%" }}
               transition={{ duration: 4, ease: "linear" }}
            />
        </div>
      )}
      {cards.map((item, i) => {
        const isTop = i === cards.length - 1;
        const reverseIndex = cards.length - 1 - i;
        const baseRotation = ((item.id.charCodeAt(0) || 0) % 5 - 2); 

        return (
          <motion.div
            key={item.id}
            layout
            onPointerDown={() => isAutoplay && triggerHaptic()}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ 
                scale: 1 - reverseIndex * 0.05, 
                y: reverseIndex * 15,
                opacity: reverseIndex > 4 ? 0 : 1,
                rotate: isTop ? 0 : baseRotation * (reverseIndex * 1.5),
                zIndex: i
            }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            style={{ originX: 0.5, originY: 1 }}
            drag={(!isAutoplay && isTop) ? true : false} 
            dragConstraints={{ top: 0, bottom: 0, left: 0, right: 0 }}
            dragElastic={1}
            onDragEnd={isTop ? handleDragEnd : undefined}
            whileDrag={{ scale: 1.05, cursor: 'grabbing' }}
            className={cn(
                "absolute w-[85%] sm:w-[80%] max-w-[320px] lg:max-w-[550px] aspect-[4/5] rounded-xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5)] overflow-hidden cursor-grab bg-white p-2 sm:p-3 border border-black/5",
                isTop ? "pointer-events-auto" : "pointer-events-none"
            )}
          >
              {item.type === "video" ? (
                  <video 
                    ref={el => { videoRefs.current[item.id] = el; }}
                    src={item.url}
                    className="w-full h-full object-cover rounded-lg pointer-events-none"
                    muted={isGlobalMuted}
                    playsInline
                    onPlay={() => onMediaPlayStatusChange?.(true)}
                    onEnded={() => {
                        onMediaPlayStatusChange?.(false);
                        if (isAutoplay) {
                            if (currentIndex < media.length - 1) moveToEnd();
                            else onComplete?.();
                        }
                    }}
                  />
              ) : (
                <img src={item.url} className="w-full h-full object-cover rounded-lg shadow-inner pointer-events-none" draggable={false} />
              )}
          </motion.div>
        );
      })}
    </div>
  );
}
function GridGallery({ 
  media, 
  onLightboxToggle, 
  isAutoplay, 
  onComplete,
  globalVolume = 1,
  isGlobalMuted = false,
  onMediaPlayStatusChange
}: { 
  media: any[], 
  onLightboxToggle?: (open: boolean) => void, 
  isAutoplay?: boolean, 
  onComplete?: (manual?: boolean) => void,
  globalVolume?: number,
  isGlobalMuted?: boolean,
  onMediaPlayStatusChange?: (playing: boolean) => void
}) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [[page, direction], setPage] = useState([0, 0]);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isScrolling, setIsScrolling] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Notify parent of lightbox state
  useEffect(() => {
    onLightboxToggle?.(selectedIndex !== null);
    if (selectedIndex === null) onMediaPlayStatusChange?.(false);
  }, [selectedIndex, onLightboxToggle, onMediaPlayStatusChange]);

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

  // Autoplay Logic
  useEffect(() => {
    if (!isAutoplay) return;

    if (selectedIndex === null && !isScrolling) {
      // Step 1: Dynamic Scroll based on content size
      setIsScrolling(true);
      const container = containerRef.current;
      if (container && media.length > 0) {
        const totalHeight = container.scrollHeight - container.clientHeight;
        // 1s per image (roughly), capped for sanity
        const dynamicDuration = Math.min(20000, Math.max(6000, media.length * 1000));
        
        const scrollSequence = async () => {
            // Manual step-based scroll for ultra-fine speed control
            const fps = 60;
            const totalFrames = (dynamicDuration / 1000) * fps;
            
            const animateScroll = (target: number, duration: number) => {
                return new Promise<void>((resolve) => {
                    const start = container.scrollTop;
                    const change = target - start;
                    let currentFrame = 0;
                    
                    const animate = () => {
                        currentFrame++;
                        const progress = currentFrame / totalFrames;
                        // Ease in-out quad
                        const ease = progress < 0.5 ? 2 * progress * progress : -1 + (4 - 2 * progress) * progress;
                        container.scrollTop = start + change * ease;
                        
                        if (currentFrame < totalFrames) {
                            requestAnimationFrame(animate);
                        } else {
                            resolve();
                        }
                    };
                    requestAnimationFrame(animate);
                });
            };

            await animateScroll(totalHeight, dynamicDuration);
            await new Promise(r => setTimeout(r, 1000)); // Pause at bottom
            await animateScroll(0, dynamicDuration);
            
            setIsScrolling(false);
            setPage([0, 0]); 
            setSelectedIndex(0);
        };
        
        scrollSequence();
      } else if (media.length > 0) {
        setSelectedIndex(0);
      }
    } else if (selectedIndex !== null) {
      const currentItem = media[wrappedIndex];
      const isVideo = currentItem?.type === "video";
      
      if (isVideo) {
          // Video handles its own completion in onEnded
          const video = videoRef.current;
          if (video) {
              video.volume = globalVolume;
              video.muted = isGlobalMuted;
              video.play().catch(() => {});
          }
          return;
      }

      const duration = 4000;
      const timer = setTimeout(() => {
        if (page < media.length - 1) {
          handleNext();
        } else {
          onComplete?.();
        }
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [isAutoplay, selectedIndex, page, media.length, onComplete, isScrolling, globalVolume, isGlobalMuted]);

  useEffect(() => {
      if (selectedIndex !== null && media[wrappedIndex]?.type === "video" && videoRef.current) {
          videoRef.current.volume = globalVolume;
          videoRef.current.muted = isGlobalMuted;
      }
  }, [globalVolume, isGlobalMuted, selectedIndex, wrappedIndex, media]);

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
      x: direction > 0 ? '100%' : '-100%',
      opacity: 0,
      scale: 0.95
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
      scale: 1
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? '100%' : '-100%',
      opacity: 0,
      scale: 0.95
    })
  };

  return (
    <div className="w-full h-full relative">
      <style jsx global>{`
        .custom-scroll::-webkit-scrollbar { display: none; }
        .custom-scroll { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      {isAutoplay && selectedIndex !== null && media[wrappedIndex]?.type !== "video" && (
        <div className="absolute top-0 left-0 w-full h-1 z-[200] bg-white/10">
            <motion.div 
               key={selectedIndex}
               className="h-full bg-primary" 
               initial={{ width: "0%" }}
               animate={{ width: "100%" }}
               transition={{ duration: 4, ease: "linear" }}
            />
        </div>
      )}

      {/* Scrollable Container */}
      <div 
        ref={containerRef} 
        onClick={() => isAutoplay && triggerHaptic()}
        className="w-full h-full p-6 sm:p-12 overflow-y-auto scrollbar-none relative"
      >
        <div className="w-full grid grid-cols-2 md:grid-cols-2 gap-2 sm:gap-8 pt-12 pb-48 px-2 md:px-8 max-w-5xl mx-auto h-max min-h-full">
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
              className="w-full relative group cursor-zoom-in shadow-2xl border-[4px] md:border-[10px] border-[#f8f8f8] bg-[#f8f8f8] rounded-lg md:rounded-sm overflow-hidden"
              onClick={(e) => {
                e.stopPropagation();
                if (!isAutoplay) {
                    setSelectedIndex(i);
                    setPage([0, 0]);
                } else {
                    triggerHaptic();
                }
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
    </div>

      <AnimatePresence initial={false}>
        {selectedIndex !== null && (
            <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, pointerEvents: 'none' as any }}
            className="absolute inset-0 z-[150] flex items-center justify-center bg-black/95 backdrop-blur-3xl overflow-hidden"
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
                backgroundImage: media[wrappedIndex].type === 'image' ? `url(${media[wrappedIndex].url})` : 'none',
                backgroundPosition: 'center',
                backgroundSize: 'cover',
                backgroundColor: 'rgba(0,0,0,0.5)'
              }}
            />

            {/* Close Button Top Right */}
            <button 
                onClick={(e) => {
                    e.stopPropagation();
                    if (!isAutoplay) setSelectedIndex(null);
                    else triggerHaptic();
                }}
                className="absolute top-4 right-4 sm:top-8 sm:right-8 text-white/50 hover:text-white p-3 rounded-full bg-white/10 hover:bg-white/20 transition-all z-[140]"
            >
                <XIcon size={24} />
            </button>

            {/* Nav Arrows */}
            {media.length > 1 && (
              <div className="absolute inset-x-2 sm:inset-x-8 top-1/2 -translate-y-1/2 justify-between items-center z-[130] flex pointer-events-none">
                <button 
                  onClick={handlePrev} 
                  className="text-white/60 hover:text-white p-3 rounded-full bg-white/5 hover:bg-white/20 backdrop-blur-xl transition-all pointer-events-auto shadow-2xl border border-white/10"
                >
                  <ChevronLeft size={20} className="sm:size-8" />
                </button>
                <button 
                  onClick={handleNext} 
                  className="text-white/60 hover:text-white p-3 rounded-full bg-white/5 hover:bg-white/20 backdrop-blur-xl transition-all pointer-events-auto shadow-2xl border border-white/10"
                >
                  <ChevronRight size={20} className="sm:size-8" />
                </button>
              </div>
            )}

            <div className="w-full h-full relative z-[100] overflow-hidden">
                  <AnimatePresence initial={false} custom={direction} mode="wait">
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
                      className="absolute inset-0 flex items-center justify-center p-4 sm:p-12 lg:p-24"
                    >
                      {media[wrappedIndex].type === "video" ? (
                          <div className="relative w-full h-full flex items-center justify-center">
                              <video 
                                ref={videoRef}
                                src={media[wrappedIndex].url}
                                className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                                controls={!isAutoplay}
                                autoPlay={isAutoplay}
                                playsInline
                                muted={isGlobalMuted}
                                onPlay={() => onMediaPlayStatusChange?.(true)}
                                onPause={() => onMediaPlayStatusChange?.(false)}
                                onEnded={() => {
                                    onMediaPlayStatusChange?.(false);
                                    if (isAutoplay) {
                                        if (page < media.length - 1) {
                                            handleNext();
                                        } else {
                                            setSelectedIndex(null);
                                            onComplete?.();
                                        }
                                    }
                                }}
                              />
                          </div>
                      ) : (
                        <div className="relative w-full h-full flex items-center justify-center">
                            <motion.img
                                layoutId={page === 0 ? `grid-image-content-${media[selectedIndex].id}` : undefined}
                                src={media[wrappedIndex].url}
                                className="w-auto h-auto max-w-full max-h-full object-contain shadow-2xl select-none rounded-[4px] md:rounded-[8px]"
                                draggable={false}
                            />
                        </div>
                      )}
                    </motion.div>
                  </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SlideshowGallery({ 
  media, 
  isAutoplay, 
  onComplete,
  globalVolume = 1,
  isGlobalMuted = false,
  onMediaPlayStatusChange 
}: { 
  media: any[], 
  isAutoplay?: boolean, 
  onComplete?: () => void,
  globalVolume?: number,
  isGlobalMuted?: boolean,
  onMediaPlayStatusChange?: (playing: boolean) => void
}) {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  const next = useCallback(() => {
    if (index >= media.length - 1) {
        onComplete?.();
    } else {
        setDirection(1);
        setIndex(prev => prev + 1);
    }
  }, [index, media.length, onComplete, isAutoplay]);

  const prev = useCallback(() => {
    if (isAutoplay) {
        triggerHaptic();
        return;
    }
    setDirection(-1);
    setIndex(prev => (prev - 1 + media.length) % media.length);
  }, [media.length, isAutoplay]);

  useEffect(() => {
    if (!isAutoplay) return;
    
    const current = media[index];
    if (current?.type === "video") return; // Handled by ended event

    const timer = setTimeout(next, 5000);
    return () => clearTimeout(timer);
  }, [index, isAutoplay, next, media]);

  useEffect(() => {
    const current = media[index];
    if (current?.type === "video" && videoRef.current) {
        videoRef.current.volume = globalVolume;
        videoRef.current.muted = isGlobalMuted;
        if (isAutoplay) {
            videoRef.current.play().catch(() => {});
            onMediaPlayStatusChange?.(true);
        }
    } else {
        onMediaPlayStatusChange?.(false);
    }
  }, [index, media, isAutoplay, globalVolume, isGlobalMuted, onMediaPlayStatusChange]);

  const swipeVariants = {
    enter: (direction: number) => ({ x: direction > 0 ? 1000 : -1000, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (direction: number) => ({ x: direction < 0 ? 1000 : -1000, opacity: 0 })
  };

  return (
    <div className="w-full h-full relative flex items-center justify-center overflow-hidden">
        {isAutoplay && media[index].type !== "video" && (
            <div className="absolute top-0 left-0 w-full h-1 z-[200] bg-white/10">
                <motion.div 
                    key={index}
                    className="h-full bg-primary" 
                    initial={{ width: "0%" }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 5, ease: "linear" }}
                />
            </div>
        )}
        {isAutoplay && (
            <div 
                className="absolute inset-x-0 bottom-0 h-48 z-20" 
                onTouchStart={triggerHaptic}
                onMouseDown={triggerHaptic}
            />
        )}
        <AnimatePresence initial={false} custom={direction}>
            <motion.div
                key={index}
                custom={direction}
                variants={swipeVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ x: { type: "spring", stiffness: 300, damping: 30 }, opacity: { duration: 0.2 } }}
                className="absolute inset-0 flex items-center justify-center p-4 sm:p-20"
            >
                {media[index].type === "video" ? (
                    <video 
                        ref={videoRef}
                        src={media[index].url}
                        className="max-w-full max-h-full rounded-2xl shadow-2xl"
                        controls={!isAutoplay}
                        autoPlay={isAutoplay}
                        muted={isGlobalMuted}
                        playsInline
                        onPlay={() => onMediaPlayStatusChange?.(true)}
                        onEnded={() => {
                            onMediaPlayStatusChange?.(false);
                            if (isAutoplay) next();
                        }}
                    />
                ) : (
                    <img 
                      src={media[index].url} 
                      className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl" 
                    />
                )}
            </motion.div>
        </AnimatePresence>
        
        {!isAutoplay && (
            <>
                <button 
                    onClick={() => {
                        if (isAutoplay) triggerHaptic();
                        else prev();
                    }} 
                    className="absolute left-4 size-12 rounded-full bg-black/20 backdrop-blur-md flex items-center justify-center text-white z-10 hover:bg-black/40 transition-all"
                >
                    <ChevronLeft size={24} />
                </button>
                <button 
                    onClick={() => {
                        if (isAutoplay) triggerHaptic();
                        else next();
                    }} 
                    className="absolute right-4 size-12 rounded-full bg-black/20 backdrop-blur-md flex items-center justify-center text-white z-10 hover:bg-black/40 transition-all"
                >
                    <ChevronRight size={24} />
                </button>
            </>
        )}
    </div>
  );
}

export function GalleryUtility({ config, onLightboxToggle, isAutoplay, onComplete, globalVolume, isGlobalMuted, onMediaPlayStatusChange }: { config: any, onLightboxToggle?: (open: boolean) => void, isAutoplay?: boolean, onComplete?: (manual?: boolean) => void, globalVolume?: number, isGlobalMuted?: boolean, onMediaPlayStatusChange?: (playing: boolean) => void }) {
  const media = config.media || [];

  if (media.length === 0) {
      return (
          <div className="w-full h-full flex items-center justify-center">
              <p className="text-white/50 text-sm font-bold uppercase tracking-widest">No Media Available</p>
          </div>
      );
  }

  if (config.layout === "stack") {
      return <StackGallery media={media} isAutoplay={isAutoplay} onComplete={onComplete} globalVolume={globalVolume} isGlobalMuted={isGlobalMuted} onMediaPlayStatusChange={onMediaPlayStatusChange} />;
  }

  if (config.layout === "grid") {
      return <GridGallery media={media} onLightboxToggle={onLightboxToggle} isAutoplay={isAutoplay} onComplete={onComplete} globalVolume={globalVolume} isGlobalMuted={isGlobalMuted} onMediaPlayStatusChange={onMediaPlayStatusChange} />;
  }

  // Fallback to slideshow for default or slideshow mode
  return <SlideshowGallery media={media} isAutoplay={isAutoplay} onComplete={onComplete} globalVolume={globalVolume} isGlobalMuted={isGlobalMuted} onMediaPlayStatusChange={onMediaPlayStatusChange} />;
}

// --- Composition Utility ---
export function CompositionUtility({ config, isAutoplay, onComplete, onMediaPlayStatusChange, globalVolume = 1, isGlobalMuted = false, shouldSilenceMusic = false }: { config: any, isAutoplay?: boolean, onComplete?: (manual?: boolean) => void, onMediaPlayStatusChange?: (playing: boolean) => void, globalVolume?: number, isGlobalMuted?: boolean, shouldSilenceMusic?: boolean }) {
    const paperStyle = config.paperStyle || "glass";
    const containerRef = useRef<HTMLDivElement>(null);
    
    const styles: Record<string, string> = {
        none: "bg-transparent shadow-none border-none",
        glass: "bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl rounded-lg",
        midnight: "bg-black/40 backdrop-blur-xl border border-white/10 shadow-2xl rounded-lg text-white",
        parchment: "bg-[#f4efe1] border-2 border-[#dcd1b3] shadow-inner rounded-sm relative overflow-hidden text-[#4a3b2a]",
        golden: "bg-white border-2 border-[#d4af37] shadow-[0_5px_40px_rgba(212,175,55,0.15)] rounded-lg relative text-black",
        aurora: "bg-white/5 backdrop-blur-md border border-white/20 shadow-2xl rounded-lg overflow-hidden",
        typewriter: "bg-[#fafafa] border border-[#e5e5e5] shadow-lg rounded-none relative text-black font-mono",
        velvet: "bg-[#4a0404] border-b-4 border-r-4 border-black/40 shadow-2xl rounded-lg text-[#f5e6d3]"
    };

    // Split content to animate elements individually if possible
    const text = config.text || "Life is full of surprises...";
    const media = config.media || [];
    const wordCount = text.replace(/<[^>]*>/g, '').split(/\s+/).length || 10;
    // Beginner reader pace: approx 2s per word
    const readingTime = Math.max(12000, wordCount * 2000);
    
    useEffect(() => {
        if (!isAutoplay) {
            onMediaPlayStatusChange?.(false);
            return;
        }
        if (shouldSilenceMusic) onMediaPlayStatusChange?.(true);

        const timer = setTimeout(() => {
            onComplete?.();
            onMediaPlayStatusChange?.(false);
        }, readingTime);

        // Auto-scroll logic
        let scrollInterval: NodeJS.Timeout;
        let scrollStartTimeout: NodeJS.Timeout;

        if (containerRef.current) {
            const container = containerRef.current;
            const scrollHeight = container.scrollHeight;
            const clientHeight = container.clientHeight;
            
            if (scrollHeight > clientHeight) {
                const totalScroll = scrollHeight - clientHeight;
                const scrollSpeed = totalScroll / (readingTime - 2000); // Start scrolling after 1s, end 1s before
                
                scrollStartTimeout = setTimeout(() => {
                    let currentScroll = 0;
                    scrollInterval = setInterval(() => {
                        currentScroll += scrollSpeed * 10; // offset per 10ms
                        container.scrollTo({ top: currentScroll, behavior: 'auto' });
                        if (currentScroll >= totalScroll) clearInterval(scrollInterval);
                    }, 10);
                }, 1000);
            }
        }

        return () => {
            clearTimeout(timer);
            clearTimeout(scrollStartTimeout);
            if (scrollInterval) clearInterval(scrollInterval);
            onMediaPlayStatusChange?.(false);
        };
    }, [isAutoplay, readingTime, onComplete, onMediaPlayStatusChange, shouldSilenceMusic]);

    const contentParts = text
        .split(/(?=<p|<img|<div)/g)
        .filter(Boolean);

    const [bounce, setBounce] = useState(false);
    const handleInterference = () => {
        if (isAutoplay) {
            triggerHaptic();
            setBounce(true);
            setTimeout(() => setBounce(false), 400);
        }
    };

    return (
        <div 
            ref={containerRef} 
            onWheel={handleInterference}
            onTouchStart={handleInterference}
            className={cn(
                "w-full h-full overflow-y-auto pt-24 pb-48 px-4 sm:px-8 scrollbar-none custom-scroll relative transition-transform duration-300",
                bounce && "scale-[0.98]"
            )}
        >
            <motion.div
                animate={bounce ? { y: [0, -10, 10, -5, 0] } : { y: 0 }}
                transition={{ duration: 0.4 }}
                className="w-full h-full"
            >
                {isAutoplay && (
                    <div className="absolute top-0 left-0 w-full h-1 z-[200] bg-white/10">
                        <motion.div 
                            className="h-full bg-primary" 
                            initial={{ width: "0%" }}
                            animate={{ width: "100%" }}
                            transition={{ duration: readingTime / 1000, ease: "linear" }}
                        />
                    </div>
                )}
                
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
                
                <div className="w-full min-h-full flex flex-col items-center justify-start pointer-events-none">
                    <motion.div 
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={cn(
                            "w-full max-w-2xl p-6 flex flex-col gap-8 transition-all duration-1000 h-auto min-h-[50vh] flex-shrink-0 pointer-events-auto",
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
                            <div className="absolute inset-0 pointer-events-none border-4 border-[#d4af37]/10 rounded-lg m-1" />
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
                            <div className="space-y-6">
                                {media.map((item: any, mIdx: number) => (
                                    <motion.div
                                        key={item.id || mIdx}
                                        initial={{ opacity: 0, y: 20 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true, margin: "-10%" }}
                                        transition={{ duration: 0.8, delay: mIdx * 0.1, ease: [0.21, 1, 0.44, 1] }}
                                        className="rounded-xl overflow-hidden shadow-lg border border-white/10 bg-black/20"
                                    >
                                        {item.type === "video" ? (
                                            <video 
                                                src={item.url} 
                                                className="w-full aspect-video object-cover" 
                                                controls={!isAutoplay}
                                                autoPlay={isAutoplay}
                                                muted={isGlobalMuted}
                                                playsInline
                                            />
                                        ) : (
                                            <img src={item.url} className="w-full object-cover" />
                                        )}
                                    </motion.div>
                                ))}
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true, margin: "-10%" }}
                                    transition={{ duration: 0.8, delay: (media.length > 0 ? media.length * 0.1 : 0), ease: [0.21, 1, 0.44, 1] }}
                                >
                                    <div dangerouslySetInnerHTML={{ __html: text }} />
                                </motion.div>
                            </div>
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
            </motion.div>
        </div>
    );
}

// --- Video Utility ---
export function VideoUtility({ config, isAutoplay, onComplete, globalVolume, isGlobalMuted, onMediaPlayStatusChange }: { config: any, isAutoplay?: boolean, onComplete?: (manual?: boolean) => void, globalVolume?: number, isGlobalMuted?: boolean, onMediaPlayStatusChange?: (playing: boolean) => void }) {
    const [isPlaying, setIsPlaying] = useState(isAutoplay);
    const videoRef = useRef<HTMLVideoElement>(null);
    const [progress, setProgress] = useState(0);

    const togglePlay = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (videoRef.current) {
            if (isPlaying) videoRef.current.pause();
            else videoRef.current.play();
            setIsPlaying(!isPlaying);
            onMediaPlayStatusChange?.(!isPlaying);
        }
    };

    const handleTimeUpdate = () => {
        if (videoRef.current) {
            const p = (videoRef.current.currentTime / videoRef.current.duration) * 100;
            setProgress(p);
        }
    };

    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.volume = globalVolume ?? 1;
            videoRef.current.muted = isGlobalMuted ?? false;
        }
    }, [globalVolume, isGlobalMuted]);

    useEffect(() => {
        if (isAutoplay && videoRef.current) {
            videoRef.current.play().catch(() => setIsPlaying(false));
            setIsPlaying(true);
            onMediaPlayStatusChange?.(true);
        } else {
            onMediaPlayStatusChange?.(false);
        }
        return () => onMediaPlayStatusChange?.(false);
    }, [isAutoplay, onMediaPlayStatusChange]);

    if (!config.mediaUrl) return (
        <div className="flex flex-col items-center justify-center text-white/40 gap-4">
            <VideoIcon size={48} />
            <p className="text-[10px] font-black uppercase tracking-widest">No Video Uploaded</p>
        </div>
    );

    return (
        <div className="w-full h-full relative group flex items-center justify-center overflow-hidden bg-black/20">
            {isAutoplay && (
                <div className="absolute top-0 left-0 w-full h-1 z-[250] bg-white/10">
                    <motion.div 
                        className="h-full bg-primary" 
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.1, ease: "linear" }}
                    />
                </div>
            )}
            <video
                ref={videoRef}
                src={config.mediaUrl}
                onTimeUpdate={handleTimeUpdate}
                onClick={togglePlay}
                onEnded={() => {
                   if (isAutoplay) onComplete?.();
                   onMediaPlayStatusChange?.(false);
                   setIsPlaying(false);
                }}
                className="w-full h-full object-contain cursor-pointer"
                playsInline
                loop={config.loop}
            />
            
            {/* Custom Video Controls overlay */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none group-hover:opacity-100 opacity-0 transition-opacity bg-black/20">
                <button 
                    onClick={togglePlay}
                    className="size-20 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white pointer-events-auto hover:scale-110 active:scale-95 transition-all"
                >
                    {isPlaying ? <Pause size={32} fill="white" /> : <Play size={32} fill="white" className="ml-1" />}
                </button>
            </div>

            {/* Progress Bar */}
            <div className="absolute bottom-0 left-0 w-full h-1.5 bg-white/10 overflow-hidden">
                <div 
                    className="h-full bg-primary transition-all duration-300 ease-linear" 
                    style={{ width: `${progress}%` }} 
                />
            </div>
        </div>
    );
}

// --- Audio Utility ---
export function AudioUtility({ config, isAutoplay, onComplete, globalVolume, isGlobalMuted, onMediaPlayStatusChange }: { config: any, isAutoplay?: boolean, onComplete?: (manual?: boolean) => void, globalVolume?: number, isGlobalMuted?: boolean, onMediaPlayStatusChange?: (playing: boolean) => void }) {
    const [isPlaying, setIsPlaying] = useState(isAutoplay);
    const audioRef = useRef<HTMLAudioElement>(null);
    const [progress, setProgress] = useState(0);

    const togglePlay = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (audioRef.current) {
            if (isPlaying) audioRef.current.pause();
            else audioRef.current.play();
            setIsPlaying(!isPlaying);
            onMediaPlayStatusChange?.(!isPlaying);
        }
    };

    const handleTimeUpdate = () => {
        if (audioRef.current) {
            const p = (audioRef.current.currentTime / audioRef.current.duration) * 100;
            setProgress(p);
        }
    };

    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = globalVolume ?? 1;
            audioRef.current.muted = isGlobalMuted ?? false;
        }
    }, [globalVolume, isGlobalMuted]);

    useEffect(() => {
        if (isAutoplay && audioRef.current) {
            audioRef.current.play().catch(() => setIsPlaying(false));
            setIsPlaying(true);
            onMediaPlayStatusChange?.(true);
        }
    }, [isAutoplay, onMediaPlayStatusChange]);

    if (!config.mediaUrl) return (
        <div className="flex flex-col items-center justify-center text-white/40 gap-4">
            <Mic size={48} />
            <p className="text-[10px] font-black uppercase tracking-widest">No Audio Uploaded</p>
        </div>
    );

    return (
        <div className="w-full h-full flex flex-col items-center justify-center p-0 text-center bg-black/10 relative group">
            {isAutoplay && (
                <div className="absolute top-0 left-0 w-full h-1 z-[250] bg-white/10">
                    <motion.div 
                        className="h-full bg-primary" 
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.1, ease: "linear" }}
                    />
                </div>
            )}
            <audio
                ref={audioRef}
                src={config.mediaUrl}
                onTimeUpdate={handleTimeUpdate}
                onEnded={() => {
                   if (isAutoplay) onComplete?.();
                   onMediaPlayStatusChange?.(false);
                   setIsPlaying(false);
                }}
                loop={config.loop}
            />
            
            <div className="relative mb-8">
                {/* Visualizer Animation */}
                <div className="flex items-end gap-1 h-12 mb-4 justify-center">
                    {[...Array(12)].map((_, i) => (
                        <motion.div
                            key={i}
                            animate={isPlaying ? { height: [10, 48, 10] } : { height: 10 }}
                            transition={{ repeat: Infinity, duration: 0.5 + Math.random(), ease: "easeInOut" }}
                            className="w-1.5 bg-primary rounded-full opacity-60"
                        />
                    ))}
                </div>

                <motion.div
                    animate={isPlaying ? { scale: [1, 1.1, 1] } : { scale: 1 }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="size-48 rounded-full bg-white/5 backdrop-blur-xl border border-white/10 flex items-center justify-center shadow-2xl relative z-10"
                >
                    <div className="size-40 rounded-full border border-primary/20 flex items-center justify-center">
                         <div className="size-32 rounded-full border border-primary/40 flex items-center justify-center">
                            <button 
                                onClick={togglePlay}
                                className="size-24 rounded-full bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/20 hover:scale-110 active:scale-95 transition-all"
                            >
                                {isPlaying ? <Pause size={32} fill="white" /> : <Play size={32} fill="white" className="ml-1" />}
                            </button>
                         </div>
                    </div>
                </motion.div>
                
                {/* Orbital Rings */}
                <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 pointer-events-none opacity-20">
                     <div className="size-64 border border-white/20 rounded-full absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-ping" />
                     <div className="size-80 border border-white/10 rounded-full absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-spin duration-[10s]" />
                </div>
            </div>

            <div className="space-y-4 max-w-xs">
                <h3 className="text-xl font-black text-white uppercase tracking-tighter">Audio Message</h3>
                <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.3em]">
                    {isPlaying ? "Playing..." : "Paused"}
                </p>
                
                {/* Progress Bar */}
                <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                    <motion.div 
                        className="h-full bg-primary" 
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.5, ease: "linear" }}
                    />
                </div>
            </div>
        </div>
    );
}
