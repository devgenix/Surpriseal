"use client";

import { useState, useEffect } from "react";
import Container from "@/components/ui/Container";

const testimonials = [
  {
    quote: "Seeing my mom's face as the video messages unfolded was priceless. She cried tears of pure joy! Surpriseal turned a simple birthday into a lifelong memory.",
    catchphrase: "Create moments that last a lifetime.",
    author: "Elena R.",
    role: "Daughter & Creator",
    avatar: "/images/landing/avatars/avatar-1.png",
    reactionImg: "/images/landing/occasions/birthday.png",
    color: "bg-rose-400",
  },
  {
    quote: "The structured reveal is a game-changer. Building anticipation with photos before the gift card appeared made the whole experience so much more modern and special.",
    catchphrase: "Modernize the way you celebrate.",
    author: "David K.",
    role: "Tech Professional",
    avatar: "/images/landing/avatars/avatar-2.png",
    reactionImg: "/images/landing/hero-surprise.png",
    color: "bg-blue-400",
  },
  {
    quote: "We used it for our teacher's retirement. Collecting 30+ video messages was seamless. It's the most polished way to show someone they are truly loved.",
    catchphrase: "The most polished way to say thanks.",
    author: "Sarah L.",
    role: "Community Organizer",
    avatar: "/images/landing/avatars/avatar-3.png",
    reactionImg: "/images/landing/occasions/retirement.png",
    color: "bg-purple-400",
  },
];

export default function Testimonials() {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const current = testimonials[activeIndex];

  return (
    <section className="py-16 md:py-24 bg-white border-t border-[#f3eae7] overflow-hidden">
      <Container>
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left: Emotive Visual Panel */}
          <div className="relative h-[320px] md:h-[480px] w-full rounded-3xl overflow-hidden shadow-2xl group">
            {/* Reaction Image */}
            <div className="absolute inset-0 transition-all duration-1000">
              <img 
                key={current.reactionImg}
                src={current.reactionImg} 
                alt="Emotional reaction to a surprise" 
                className="w-full h-full object-cover grayscale-[0.2] transition-all duration-1000 group-hover:grayscale-0 group-hover:scale-105 animate-in fade-in zoom-in duration-800"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
            </div>
            
            {/* Floating Avatars Stacks */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex -space-x-6">
                {testimonials.map((t, i) => (
                  <div 
                    key={i}
                    className={`h-16 w-16 md:h-24 md:w-24 rounded-full border-4 border-white shadow-xl overflow-hidden transition-all duration-700 ${i === activeIndex ? 'scale-125 z-20 rotate-0' : 'scale-90 z-10 opacity-40 rotate-12'}`}
                  >
                    <img src={t.avatar} alt={t.author} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            </div>

            <div className="absolute bottom-6 left-6 right-6 md:bottom-10 md:left-10 md:right-10 bg-white/10 backdrop-blur-md p-4 md:p-6 rounded-2xl border border-white/20 shadow-lg transform transition-transform group-hover:scale-[1.02]">
              <p className="text-white font-bold text-lg md:text-xl leading-snug italic animate-in slide-in-from-bottom-2 duration-500">
                &ldquo;{current.catchphrase}&rdquo;
              </p>
            </div>
          </div>

          {/* Right: Content */}
          <div className="relative">
            <div className="absolute -top-12 -left-8 text-9xl text-primary/5 font-serif select-none">
              &ldquo;
            </div>
            
            <div key={activeIndex} className="relative space-y-8 animate-in fade-in slide-in-from-right-4 duration-700">
              <div className="min-h-[200px] md:min-h-[220px]">
                <blockquote className="text-xl md:text-2xl lg:text-3xl text-[#1b110e] font-medium leading-relaxed italic">
                  {current.quote}
                </blockquote>
                
                <div className="flex items-center gap-4 mt-8">
                  <div className={`h-12 w-12 md:h-14 md:w-14 rounded-full border-2 border-white shadow-md overflow-hidden`}>
                    <img src={current.avatar} alt={current.author} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <div className="font-bold text-base md:text-lg text-[#1b110e]">{current.author}</div>
                    <div className="text-[#97604e] font-medium text-sm">{current.role}</div>
                  </div>
                </div>
              </div>

              {/* Progress dots */}
              <div className="flex gap-3 pt-4">
                {testimonials.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveIndex(i)}
                    className={`h-2 rounded-full transition-all duration-500 ${
                      i === activeIndex ? "w-10 bg-primary" : "w-2 bg-[#e7d6d0]"
                    }`}
                    aria-label={`Go to testimonial ${i + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
