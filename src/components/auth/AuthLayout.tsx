"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}

const slides = [
  {
    image: "https://images.unsplash.com/photo-1513201099705-a9746e1e201f?q=80&w=2897&auto=format&fit=crop",
    title: "Every unforgettable moment starts with intention.",
    description: "Join thousands of creators designing structured, interactive celebration pages that bring people together."
  },
  {
    image: "https://images.unsplash.com/photo-1530103043960-ef38714abb15?q=80&w=2938&auto=format&fit=crop",
    title: "Shared memories, beautifully organized.",
    description: "Create a unique timeline of your best moments and share them with the people who matter most."
  },
  {
    image: "https://images.unsplash.com/photo-1527529482837-4698179dc6ce?q=80&w=2940&auto=format&fit=crop",
    title: "The ultimate surprise experience, crafted by you.",
    description: "Design every step of the journey, from the first reveal to the final gift. Make it truly yours."
  }
];

export default function AuthLayout({ children }: AuthLayoutProps) {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex h-screen w-full flex-row overflow-hidden">
      {/* Left Pane: Visual & Emotional Anchor */}
      <div className="hidden lg:flex lg:w-5/12 xl:w-1/2 relative flex-col justify-between overflow-hidden bg-[#211511]">
        {/* Background Images with Crossfade */}
        {slides.map((slide, index) => (
          <div 
            key={index}
            className={`absolute inset-0 z-0 transition-opacity duration-1000 ease-in-out ${index === currentSlide ? 'opacity-100' : 'opacity-0'}`}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent z-10"></div>
            <div 
              className={`h-full w-full bg-cover bg-center transition-transform duration-[10s] ease-linear ${index === currentSlide ? 'scale-110' : 'scale-100'}`} 
              style={{ backgroundImage: `url('${slide.image}')` }}
            ></div>
          </div>
        ))}
        
        {/* Content */}
        <div className="relative z-20 flex h-full flex-col justify-between p-12 text-white">
          <Link href="/" className="flex items-center gap-2 group w-fit">
            <span className="material-symbols-outlined text-primary text-4xl transition-transform group-hover:scale-110">celebration</span>
            <span className="text-xl font-bold tracking-tight">Supriseal</span>
          </Link>
          
          <div className="max-w-md animate-in fade-in slide-in-from-bottom-4 duration-700">
            <h2 key={`title-${currentSlide}`} className="mb-4 text-4xl font-bold leading-tight tracking-tight lg:text-5xl animate-in fade-in slide-in-from-bottom-2 duration-500">
              {slides[currentSlide].title}
            </h2>
            <p key={`desc-${currentSlide}`} className="text-lg text-white/80 font-medium animate-in fade-in slide-in-from-bottom-1 duration-500">
              {slides[currentSlide].description}
            </p>
          </div>

          <div className="flex gap-2">
            {slides.map((_, index) => (
              <div 
                key={index} 
                className={`h-1.5 rounded-full transition-all duration-300 ${index === currentSlide ? 'w-8 bg-primary' : 'w-2 bg-white/30'}`}
              ></div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Pane: Authentication Form */}
      <div className="flex w-full lg:w-7/12 xl:w-1/2 flex-col bg-[#f8f6f6] overflow-y-auto">
        <div className="flex flex-1 flex-col justify-center items-center p-6 sm:p-12 lg:p-24 relative">
          <div className="w-full max-w-[480px]">
             {children}
          </div>
          
          {/* Agreement Text at Bottom */}
          <div className="mt-8 text-center text-xs text-[#97604e] max-w-[320px]">
            By signing in you agree to our{" "}
            <Link href="/terms" className="underline hover:text-[#1b110e] transition-colors">Terms of Service</Link>
            {" "}and{" "}
            <Link href="/privacy" className="underline hover:text-[#1b110e] transition-colors">Privacy Policy</Link>.
          </div>
        </div>
      </div>
    </div>
  )
}
