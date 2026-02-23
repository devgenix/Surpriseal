"use client";

import Link from "next/link";
import Container from "@/components/ui/Container";
import { 
  motion, 
  useMotionValue, 
  useAnimationFrame, 
  useTransform 
} from "framer-motion";
import { useState, useRef, useEffect } from "react";

import { occasions } from "@/lib/constants/occasions";

export default function Occasions() {
  const [isPaused, setIsPaused] = useState(false);
  const baseX = useMotionValue(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Speed factor: lower is slower
  const speed = 0.5;

  useAnimationFrame((t, delta) => {
    if (!isPaused && contentRef.current) {
      // Delta is usually ~16.6ms at 60fps
      // Move baseX by a small amount based on delta and speed
      const moveBy = speed * (delta / 16);
      let nextValue = baseX.get() - moveBy;
      
      // Calculate wrap point: half of the total content width
      const fullWidth = contentRef.current.scrollWidth;
      const halfWidth = fullWidth / 2;

      // Ensure it loops perfectly
      if (nextValue <= -halfWidth) {
        nextValue += halfWidth;
      }
      
      baseX.set(nextValue);
    }
  });

  // Duplicate the list for seamless looping
  const duplicatedOccasions = [...occasions, ...occasions];

  return (
    <section className="bg-[#1b110e] py-16 md:py-24 overflow-hidden relative">
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[10%] left-[-5%] w-96 h-96 bg-primary/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-[10%] right-[-5%] w-96 h-96 bg-purple-500/5 rounded-full blur-3xl"></div>
      </div>
      
      <Container className="relative z-10">
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-4 px-4 md:px-0">
            Use Surpriseal for <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 via-primary/80 to-orange-200">all occasions</span>
          </h2>
          <p className="text-white/60 text-base md:text-lg max-w-2xl mx-auto px-4 md:px-0">
            From milestones to just-becauses, create a digital journey that captures the heart of every moment.
          </p>
        </div>

        {/* Desktop View: Grid */}
        <div className="hidden md:grid grid-cols-5 gap-4">
          {occasions.map((occasion, index) => (
            <OccasionCard key={index} occasion={occasion} />
          ))}
        </div>

        {/* Mobile View: Infinite Marquee */}
        <div className="md:hidden outline-none" ref={containerRef}>
          <div 
            className="flex gap-4 overflow-visible"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
            onTouchStart={() => setIsPaused(true)}
            onTouchEnd={() => setIsPaused(false)}
          >
            <motion.div
              ref={contentRef}
              className="flex gap-4 cursor-grab active:cursor-grabbing"
              style={{ x: baseX, width: "fit-content" }}
              drag="x"
              onDragStart={() => setIsPaused(true)}
              onDragEnd={() => setIsPaused(false)}
            >
              {duplicatedOccasions.map((occasion, index) => (
                <div key={index} className="w-[280px] flex-shrink-0">
                  <OccasionCard occasion={occasion} />
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </Container>
    </section>
  );
}

function OccasionCard({ occasion }: { occasion: typeof occasions[0] }) {
  return (
    <div
      className="relative overflow-hidden rounded-lg transition-all md:hover:scale-[1.03] md:hover:shadow-2xl md:hover:shadow-black/40 duration-500 group border border-white/10 h-[320px]"
    >
      {/* Background Image */}
      <div className="absolute inset-0">
        <img 
          src={occasion.image} 
          alt={occasion.title} 
          className="w-full h-full object-cover grayscale-[0.3] group-hover:grayscale-0 transition-all duration-700 group-hover:scale-110"
        />
        <div className={`absolute inset-0 opacity-20 group-hover:opacity-40 transition-opacity duration-500 ${occasion.bgColor.replace('bg-', 'bg-')}`} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-black/40" />
      </div>

      {/* Content */}
      <div className="relative h-full flex flex-col items-center text-center p-6 z-10">
        <h3 className="text-lg font-bold text-white mb-2 leading-tight tracking-tight drop-shadow-md">
          {occasion.title}
        </h3>
        <p className="text-white/80 text-[11px] leading-relaxed mb-6 font-medium drop-shadow-sm line-clamp-3">
          {occasion.description}
        </p>
        <div className="mt-auto w-full">
          <Link
            href="/dashboard/create"
            className="inline-block w-full bg-white/20 backdrop-blur-md text-white text-[13px] font-bold py-2.5 rounded-lg border border-white/30 hover:bg-white hover:text-[#1b110e] transition-all shadow-lg active:scale-95"
          >
            Start a Surprise
          </Link>
        </div>
      </div>
    </div>
  );
}

