"use client";

import { useState, useEffect } from "react";
import Container from "@/components/ui/Container";

const testimonials = [
  {
    quote: "Seeing my mom's face as the video messages unfolded was priceless. She cried tears of pure joy! Surpriseal turned a simple birthday into a lifelong memory.",
    author: "Elena R.",
    role: "Daughter & Creator",
    avatar: "E",
    color: "bg-rose-400",
  },
  {
    quote: "The structured reveal is a game-changer. Building anticipation with photos before the gift card appeared made the whole experience so much more modern and special.",
    author: "David K.",
    role: "Tech Professional",
    avatar: "D",
    color: "bg-blue-400",
  },
  {
    quote: "We used it for our teacher's retirement. Collecting 30+ video messages was seamless. It's the most polished way to show someone they are truly loved.",
    author: "Sarah L.",
    role: "Community Organizer",
    avatar: "S",
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
    <section className="py-24 bg-white border-t border-[#f3eae7] overflow-hidden">
      <Container>
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left: Emotive Visual Panel */}
          <div className="relative h-[450px] w-full rounded-3xl overflow-hidden shadow-2xl group">
            <div className="absolute inset-0 bg-gradient-to-br from-rose-100 via-orange-50 to-purple-100 animate-gradient-slow" />
            
            {/* Floating Decorative Elements */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-10 left-10 text-6xl animate-bounce duration-[3000ms]">✨</div>
              <div className="absolute bottom-10 right-10 text-6xl animate-bounce duration-[4000ms] delay-500">💝</div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex -space-x-6">
                {testimonials.map((t, i) => (
                  <div 
                    key={i}
                    className={`h-24 w-24 rounded-full border-4 border-white shadow-xl flex items-center justify-center text-3xl font-bold text-white transition-all duration-700 ${t.color} ${i === activeIndex ? 'scale-125 z-20 rotate-0' : 'scale-90 z-10 opacity-40 rotate-12'}`}
                  >
                    {t.avatar}
                  </div>
                ))}
              </div>
            </div>

            <div className="absolute bottom-8 left-8 right-8 bg-white/80 backdrop-blur-md p-6 rounded-2xl border border-white/20 shadow-lg transform transition-transform group-hover:scale-[1.02]">
              <p className="text-[#1b110e] font-bold text-xl leading-snug italic">
                &ldquo;Create moments that last a lifetime.&rdquo;
              </p>
            </div>
          </div>

          {/* Right: Story Content */}
          <div className="flex flex-col">
            <div className="mb-8">
              <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary font-bold text-xs uppercase tracking-widest mb-4">
                Real Stories
              </span>
              <h2 className="text-4xl lg:text-5xl font-extrabold text-[#1b110e] mb-6 tracking-tight leading-tight">
                Trusted by <br />
                <span className="text-primary">thoughtful</span> creators
              </h2>
            </div>

            <div className="relative min-h-[200px]">
              {/* Animated Quote */}
              <div key={activeIndex} className="animate-in fade-in slide-in-from-right-4 duration-700">
                <blockquote className="text-2xl text-[#1b110e] font-medium leading-[1.6] mb-8 relative">
                  <span className="absolute -top-6 -left-4 text-6xl text-primary/10 font-serif">&ldquo;</span>
                  {current.quote}
                </blockquote>
                
                <div className="flex items-center gap-4">
                  <div className={`h-14 w-14 rounded-full ${current.color} flex items-center justify-center text-white font-bold text-xl shadow-lg`}>
                    {current.avatar}
                  </div>
                  <div>
                    <div className="font-bold text-lg text-[#1b110e]">{current.author}</div>
                    <div className="text-[#97604e] font-medium">{current.role}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Pagination Dots */}
            <div className="flex gap-3 mt-12">
              {testimonials.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveIndex(i)}
                  className={`h-2 rounded-full transition-all duration-500 ${i === activeIndex ? 'w-12 bg-primary' : 'w-2 bg-gray-200 hover:bg-gray-300'}`}
                  aria-label={`Go to testimonial ${i + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
