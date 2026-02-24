"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Howl } from "howler";
import { Canvas } from "@react-three/fiber";
import { Stars, Sparkles as Sparkles3D } from "@react-three/drei";
import { 
  Volume2, 
  VolumeX, 
  ChevronRight, 
  ChevronLeft,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ScratchUtility, GalleryUtility, CompositionUtility } from "./utilities/RevealUtilities";

interface Scene {
  id: string;
  type: "scratch" | "gallery" | "composition";
  config: any;
  music?: string;
}

interface RevealEngineProps {
  moment: any;
  isPreview?: boolean;
}

export default function RevealEngine({ moment, isPreview = false }: RevealEngineProps) {
  const [currentSceneIndex, setCurrentSceneIndex] = useState(-1); // -1 for splash/intro
  const [isMuted, setIsMuted] = useState(false);
  const soundRef = useRef<Howl | null>(null);
  const lastMusicUrlRef = useRef<string>("");

  const scenes = useMemo(() => moment?.styleConfig?.scenes || [], [moment]);
  const style = moment?.styleConfig || {};

  // Auto-theme selection based on occasion if not manually set
  const activeThemeId = useMemo(() => {
    if (style.themeId) return style.themeId;
    const occasion = moment?.occasionId;
    if (occasion === "birthday") return "birthday-classic";
    if (occasion === "anniversary") return "anniversary-gold";
    if (occasion === "wedding") return "elegant-noir";
    if (occasion === "valentine") return "romantic-rose";
    return "surprise-neon";
  }, [style.themeId, moment?.occasionId]);

  const currentScene = scenes[currentSceneIndex];

  // Sound Management
  useEffect(() => {
    const sceneMusic = currentScene?.config?.musicUrl;
    const projectMusic = style.musicUrl;
    const musicUrl = sceneMusic || projectMusic || "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3";
    
    // Check if we already have this music loaded
    if (soundRef.current && lastMusicUrlRef.current === musicUrl) {
      return;
    }

    lastMusicUrlRef.current = musicUrl;

    // Stop and unload previous sound
    if (soundRef.current) {
      soundRef.current.stop();
      soundRef.current.unload();
    }

    soundRef.current = new Howl({
      src: [musicUrl],
      loop: true,
      volume: 0.5,
      autoplay: true, // Try to autoplay, if blocked onplayerror will handle it
      mute: isMuted,
      html5: true,
      onplayerror: function() {
        soundRef.current?.once('unlock', function() {
          soundRef.current?.play();
        });
      }
    });

    // If in preview, we definitely want to try playing immediately 
    // since the user just interacted with the "Live Preview" button
    if (isPreview) {
      soundRef.current.play();
    }

    return () => {
      soundRef.current?.stop();
      soundRef.current?.unload();
    };
  }, [style.musicUrl, currentScene?.config?.musicUrl, isPreview]);

  useEffect(() => {
    if (soundRef.current) {
      soundRef.current.mute(isMuted);
    }
  }, [isMuted]);



  // Audio Segment Logic (Per Scene)
  useEffect(() => {
    if (!soundRef.current || !currentScene) return;

    const config = currentScene.config;
    const start = config.audioStart || 0;
    const duration = config.audioDuration || 0;

    if (duration > 0) {
      // Seek to start position
      soundRef.current.seek(start);
      
      const checkLoop = setInterval(() => {
        if (!soundRef.current) return;
        const currentPos = soundRef.current.seek();
        
        // Loop back if we exceed the duration
        if (currentPos >= (start + duration)) {
          soundRef.current.seek(start);
        }
      }, 100);

      return () => clearInterval(checkLoop);
    } else {
      // Reset to 0 for splash/intro
      soundRef.current.seek(0);
    }
  }, [currentSceneIndex, scenes, !!soundRef.current]);

  const nextScene = useCallback(() => {
    // Start music on first interaction
    if (soundRef.current && !soundRef.current.playing()) {
      soundRef.current.play();
    }

    if (currentSceneIndex < scenes.length - 1) {
      setCurrentSceneIndex(prev => prev + 1);
    } else if (scenes.length === 0) {
      // If we are at intro and there are no scenes, show a temporary end state
      setCurrentSceneIndex(1); 
    }
  }, [currentSceneIndex, scenes.length, isPreview]);

  const prevScene = useCallback(() => {
    if (currentSceneIndex > -1) {
      setCurrentSceneIndex(prev => prev - 1);
    }
  }, [currentSceneIndex]);

  // Map media objects for the current scene
  const sceneData = useMemo(() => {
    if (!currentScene) return null;
    const media = (currentScene.config.mediaIds || []).map((id: string) => 
      moment.media?.find((m: any) => m.id === id)
    ).filter(Boolean);

    return {
      ...currentScene.config,
      media,
      mediaUrl: media[0]?.url, // Convenience for single-media utilities
      recipientName: moment.recipientName
    };
  }, [currentScene, moment]);

  return (
    <div className="relative w-full h-full bg-black overflow-hidden font-display select-none">
      
      {/* Background Layer */}
      <ThemeBackground themeId={activeThemeId} isPreview={isPreview} />

      <AnimatePresence mode="wait">
        
        {/* Intro Splash */}
        {currentSceneIndex === -1 && (
          <motion.div
            key="intro"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            className="absolute inset-0 flex flex-col items-center justify-center z-10 text-center p-6 cursor-pointer"
            onClick={() => {
              console.log("Reveal splash clicked, advancing to first scene...");
              nextScene();
            }}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", damping: 12 }}
              className="size-48 bg-primary/20 rounded-full flex items-center justify-center mb-8 border border-primary/30"
            >
               <span className="text-6xl animate-bounce">🎁</span>
            </motion.div>
            <h1 className="text-4xl font-black text-white uppercase tracking-tighter mb-2">
              {moment.occasionId 
                ? `A ${moment.occasionId.split('_').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')} Surprise` 
                : "A Special Surprise"}
            </h1>
            <p className="text-white/60 font-bold uppercase tracking-widest text-xs">
              Created for {moment.recipientName || "Someone Special"}
            </p>
            <motion.div 
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="mt-12 text-white/40 text-[10px] font-black uppercase tracking-[0.3em]"
            >
              Tap to begin
            </motion.div>
          </motion.div>
        )}

        {/* Dynamic Scenes */}
        {currentSceneIndex >= 0 && currentScene && (
          <motion.div
            key={currentScene.id}
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            className="absolute inset-0 flex items-center justify-center z-20"
          >
            {currentScene.type === "scratch" && (
              <ScratchUtility config={sceneData} onComplete={() => {}} />
            )}
            {currentScene.type === "gallery" && (
              <GalleryUtility config={sceneData} />
            )}
            {currentScene.type === "composition" && (
              <CompositionUtility config={sceneData} />
            )}
          </motion.div>
        )}

        {/* Fallback if no scenes */}
        {currentSceneIndex >= 0 && scenes.length === 0 && (
          <motion.div
            key="no-scenes"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 flex flex-col items-center justify-center z-20 text-center p-6"
          >
             <h2 className="text-2xl font-bold text-white mb-2">The journey is just beginning!</h2>
             <p className="text-white/40 uppercase tracking-widest text-xs font-bold">This moment is being prepared.</p>
          </motion.div>
        )}

      </AnimatePresence>

      {/* Navigation Controls */}
      {currentSceneIndex >= 0 && (
        <div className="absolute bottom-10 inset-x-0 flex items-center justify-center gap-6 z-50">
           <button 
             onClick={prevScene}
             className="size-12 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-all active:scale-90"
           >
             <ChevronLeft size={24} />
           </button>
           
           <div className="px-4 py-2 rounded-full bg-white/5 backdrop-blur-sm border border-white/10 text-[10px] font-black text-white/60 uppercase tracking-widest">
             {currentSceneIndex + 1} / {scenes.length}
           </div>

           {currentSceneIndex < scenes.length - 1 ? (
             <button 
               onClick={nextScene}
               className="size-12 rounded-full bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all active:scale-90"
             >
               <ChevronRight size={24} />
             </button>
           ) : (
             <button 
                onClick={() => isPreview ? null : window.location.reload()}
                className="px-6 h-12 rounded-full bg-green-500 text-white font-black uppercase tracking-widest text-xs shadow-lg shadow-green-500/20 active:scale-95 transition-all"
             >
               Replay
             </button>
           )}
        </div>
      )}

      {/* Persistence Controls (Mute, etc) */}
      <div className="absolute top-8 right-8 flex items-center gap-3 z-50">
        <button 
          onClick={() => setIsMuted(!isMuted)}
          className="size-10 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-all"
        >
          {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
        </button>
      </div>

    </div>
  );
}

function ThemeBackground({ themeId, isPreview }: { themeId: string, isPreview?: boolean }) {
  const themeConfig = {
    "birthday-classic": {
      colorIdx: 0,
      sparkleColor: "#ec4899",
      bgColor: "bg-gradient-to-b from-[#1b110e] to-black"
    },
    "anniversary-gold": {
      colorIdx: 1,
      sparkleColor: "#f59e0b",
      bgColor: "bg-gradient-to-b from-[#1b1a0e] to-black"
    },
    "surprise-neon": {
      colorIdx: 2,
      sparkleColor: "#8b5cf6",
      bgColor: "bg-gradient-to-b from-[#0e1b1b] to-black"
    },
    "elegant-noir": {
      colorIdx: 3,
      sparkleColor: "#ffffff",
      bgColor: "bg-gradient-to-b from-[#111111] to-black"
    },
    "romantic-rose": {
      colorIdx: 4,
      sparkleColor: "#f43f5e",
      bgColor: "bg-gradient-to-b from-[#1b0e0e] to-black"
    }
  }[themeId as keyof typeof themeConfig] || {
    colorIdx: 0,
    sparkleColor: "#3b82f6",
    bgColor: "bg-gradient-to-b from-black to-[#0e1b1b]"
  };

  return (
    <div className={cn("absolute inset-0 z-0", themeConfig.bgColor)}>
      <Canvas camera={{ position: [0, 0, 1] }}>
        <Stars 
          radius={100} 
          depth={50} 
          count={5000} 
          factor={4} 
          saturation={0} 
          fade 
          speed={1} 
        />
        <Sparkles3D 
          count={200} 
          scale={10} 
          size={isPreview ? 1 : 2} 
          speed={0.3} 
          opacity={0.4} 
          color={themeConfig.sparkleColor} 
        />
        <ambientLight intensity={0.5} />
      </Canvas>
      {/* Premium Glassmorphism Overlay */}
      <div className="absolute inset-0 bg-black/20 pointer-events-none transition-colors duration-1000" />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80 pointer-events-none" />
    </div>
  );
}
