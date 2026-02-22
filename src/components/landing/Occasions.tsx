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

const occasions = [
  {
    title: "Happy Birthdays",
    description: "Celebrate special birthdays with heartfelt video messages from friends and family.",
    icon: "🎂",
    bgColor: "bg-[#FFF9F2]",
  },
  {
    title: "Weddings",
    description: "Create unforgettable wedding Tributes with messages from loved ones near and far.",
    icon: "👰",
    bgColor: "bg-[#FFF5F8]",
  },
  {
    title: "Anniversaries",
    description: "Honor milestone anniversaries with personalized video collections from colleagues and friends.",
    icon: "🍾",
    bgColor: "bg-[#F0FFF4]",
  },
  {
    title: "Retirements",
    description: "Send off retiring colleagues with meaningful video Tributes celebrating their career.",
    icon: "🎉",
    bgColor: "bg-[#F0F7FF]",
  },
  {
    title: "In Memory or Funeral",
    description: "Create touching memorial Tributes to honor and remember loved ones who have passed.",
    icon: "🕯️",
    bgColor: "bg-[#F7F2FF]",
  },
  {
    title: "Graduations",
    description: "Congratulate graduates with inspiring video messages from family, friends, and mentors.",
    icon: "🎓",
    bgColor: "bg-[#F5F2FF]",
  },
  {
    title: "Teacher Appreciation",
    description: "Show gratitude to educators with heartfelt video Tributes from students and parents.",
    icon: "🫶",
    bgColor: "bg-[#FFF9F0]",
  },
  {
    title: "Promotions",
    description: "Celebrate career advancements with congratulatory video messages from teammates.",
    icon: "⭐",
    bgColor: "bg-[#FFFFF0]",
  },
  {
    title: "Get Well Soon",
    description: "Send healing wishes and support through uplifting video messages during recovery.",
    icon: "❤️",
    bgColor: "bg-[#FFF0F0]",
  },
  {
    title: "New Baby",
    description: "Welcome new arrivals with warm video congratulations from family and friends.",
    icon: "🧸",
    bgColor: "bg-[#F0FBFF]",
  },
];

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
      className={`${occasion.bgColor} rounded-2xl p-6 flex flex-col items-center text-center transition-all md:hover:scale-[1.03] md:hover:shadow-2xl md:hover:shadow-black/20 duration-500 group border border-white/10 h-full`}
    >
      <div className="text-4xl mb-4 md:mb-6 transform transition-transform group-hover:scale-125 duration-500 drop-shadow-sm grayscale-[0.2] group-hover:grayscale-0">
        {occasion.icon}
      </div>
      <h3 className="text-lg font-bold text-[#1b110e] mb-3 leading-tight tracking-tight">{occasion.title}</h3>
      <p className="text-[#97604e] text-[11px] leading-relaxed mb-6 flex-grow font-medium">
        {occasion.description}
      </p>
      <Link
        href="/dashboard/create"
        className="w-full bg-[#1b110e] text-white text-[13px] font-bold py-3 rounded-xl hover:bg-primary transition-all shadow-md active:scale-95"
      >
        Start a Surprise
      </Link>
    </div>
  );
}

