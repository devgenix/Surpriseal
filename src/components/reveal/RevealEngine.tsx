"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Howl } from "howler";
import { Canvas, useFrame } from "@react-three/fiber";
import { Stars, Sparkles as Sparkles3D } from "@react-three/drei";
import * as THREE from "three";
import { 
  Volume2, 
  VolumeX, 
  ChevronRight, 
  ChevronLeft,
  X,
  Music2,
  Lock,
  Camera,
  HelpCircle,
  RefreshCcw,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Gift
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
  activeSceneIndex?: number;
}

function Confetti3D({ count = 100, colors = ["#ff0000", "#00ff00", "#0000ff"] }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  
  const particles = useMemo(() => {
    const temp = [];
    for (let i = 0; i < count; i++) {
      const t = Math.random() * Math.PI * 2;
      const r = 4 * Math.sqrt(Math.random());
      const x = r * Math.cos(t);
      const y = Math.random() * 10 - 5;
      const z = (Math.random() * 10 - 5) * 0.5;
      
      temp.push({
        position: new THREE.Vector3(x, y, z),
        rotation: new THREE.Euler(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI),
        scale: Math.random() * 0.1 + 0.05,
        color: new THREE.Color(colors[Math.floor(Math.random() * colors.length)]),
        speed: Math.random() * 0.05 + 0.02,
        rotSpeed: Math.random() * 0.1
      });
    }
    return temp;
  }, [count, colors]);

  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame((_state) => {
    if (!meshRef.current) return;

    particles.forEach((p, i) => {
      p.position.y -= p.speed;
      if (p.position.y < -5) p.position.y = 5;

      p.rotation.x += p.rotSpeed;
      p.rotation.y += p.rotSpeed;

      dummy.position.copy(p.position);
      dummy.rotation.copy(p.rotation);
      dummy.scale.setScalar(p.scale);
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
      meshRef.current!.setColorAt(i, p.color);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <boxGeometry args={[1, 1, 0.1]} />
      <meshStandardMaterial />
    </instancedMesh>
  );
}

export default function RevealEngine({ moment, isPreview = false, activeSceneIndex }: RevealEngineProps) {
  const [currentSceneIndex, setCurrentSceneIndex] = useState(activeSceneIndex ?? -1); // -1 for splash
  const [isLocked, setIsLocked] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [unlockError, setUnlockError] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [isMuted, setIsMuted] = useState(true);
  
  // Audio Refs
  const globalSoundRef = useRef<Howl | null>(null);
  const globalYtPlayerRef = useRef<any>(null);
  const sceneSoundRef = useRef<Howl | null>(null);
  const sceneYtPlayerRef = useRef<any>(null);
  
  const lastGlobalMusicRef = useRef<string>("");
  const lastSceneMusicRef = useRef<string>("");

  const [isYtReady, setIsYtReady] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const scenes = useMemo(() => moment?.styleConfig?.scenes || [], [moment]);
  const style = moment?.styleConfig || {};
  const currentScene = scenes[currentSceneIndex];

  // Sync with activeSceneIndex from parent (Studio)
  useEffect(() => {
    if (activeSceneIndex !== undefined && activeSceneIndex !== null) {
      setCurrentSceneIndex(activeSceneIndex);
    }
  }, [activeSceneIndex]);

  // Hierarchy Theme Selection
  const activeThemeId = useMemo(() => {
    const sceneTheme = currentScene?.config?.themeId;
    const useGlobal = currentScene?.config?.useGlobalTheme !== false;
    
    if (!useGlobal && sceneTheme) return sceneTheme;
    if (style.themeId) return style.themeId;
    
    const occasion = moment?.occasionId;
    if (occasion === "birthday") return "birthday-classic";
    if (occasion === "anniversary") return "anniversary-gold";
    if (occasion === "wedding") return "elegant-noir";
    if (occasion === "valentine") return "romantic-rose";
    return "surprise-neon";
  }, [style.themeId, currentScene?.config, moment?.occasionId]);

  // Initialize YouTube API
  useEffect(() => {
    if (typeof window === "undefined" || (window as any).YT) {
      if ((window as any).YT) setIsYtReady(true);
      return;
    }
    const tag = document.createElement('script');
    tag.src = "https://www.youtube.com/iframe_api";
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

    (window as any).onYouTubeIframeAPIReady = () => {
      setIsYtReady(true);
    };
  }, []);

  // Consolidated Audio Management
  useEffect(() => {
    if (!isYtReady) return;

    const isSplash = currentSceneIndex === -1;
    const isFinal = currentSceneIndex === scenes.length;
    
    // Determine which music to use for the CURRENT state
    const useGlobalMusic = isSplash 
      ? style.splashConfig?.useGlobalMusic !== false 
      : (isFinal || currentScene?.config?.useGlobalMusic !== false);

    // Track Metadata
    const globalYtId = style.ytMusicId;
    const globalUrl = style.musicUrl;
    
    const sceneYtId = !useGlobalMusic ? (isSplash ? style.splashConfig?.ytMusicId : currentScene?.config?.ytMusicId) : null;
    const sceneUrl = !useGlobalMusic ? (isSplash ? style.splashConfig?.musicUrl : currentScene?.config?.musicUrl) : null;
    
    const sceneStart = !useGlobalMusic ? (isSplash ? style.splashConfig?.audioStart || 0 : currentScene?.config?.audioStart || 0) : 0;
    const sceneDuration = !useGlobalMusic ? (isSplash ? style.splashConfig?.audioDuration || 0 : currentScene?.config?.audioDuration || 0) : 0;

    // --- 1. GLOBAL AUDIO MANAGEMENT ---
    if (globalYtId) {
      if (!globalYtPlayerRef.current) {
        globalYtPlayerRef.current = new (window as any).YT.Player('yt-player-global', {
          videoId: globalYtId,
          playerVars: { autoplay: 0, controls: 0, loop: 1, playlist: globalYtId },
          events: {
            onStateChange: (e: any) => {
              if (e.data === (window as any).YT.PlayerState.ENDED) e.target.playVideo();
            }
          }
        });
      } else if (lastGlobalMusicRef.current !== globalYtId) {
        if (typeof globalYtPlayerRef.current.loadVideoById === 'function') {
          globalYtPlayerRef.current.loadVideoById(globalYtId);
          lastGlobalMusicRef.current = globalYtId;
        }
      }

      // Vol Control & State
      const player = globalYtPlayerRef.current;
      if (typeof player?.setVolume === 'function') {
        player.setVolume(isMuted ? 0 : (useGlobalMusic ? 50 : 0));
        if (useGlobalMusic && !isPreview && !isMuted) player.playVideo();
        else if (!useGlobalMusic) player.pauseVideo();
      }
    } else if (globalUrl) {
       if (!globalSoundRef.current || lastGlobalMusicRef.current !== globalUrl) {
         if (globalSoundRef.current) globalSoundRef.current.unload();
         globalSoundRef.current = new Howl({ src: [globalUrl], loop: true, volume: 0.5 });
         lastGlobalMusicRef.current = globalUrl;
       }
       globalSoundRef.current.mute(isMuted || !useGlobalMusic);
       if (useGlobalMusic && !isPreview && !isMuted) globalSoundRef.current.play();
       else if (!useGlobalMusic) globalSoundRef.current.pause();
    }

    // --- 2. SCENE AUDIO MANAGEMENT ---
    if (sceneYtId) {
      if (!sceneYtPlayerRef.current) {
         sceneYtPlayerRef.current = new (window as any).YT.Player('yt-player-scene', {
          videoId: sceneYtId,
          playerVars: { autoplay: 1, controls: 0, loop: 1, playlist: sceneYtId, start: sceneStart },
          events: {
             onStateChange: (e: any) => {
               if (e.data === (window as any).YT.PlayerState.ENDED) e.target.playVideo();
             }
          }
         });
      } else if (lastSceneMusicRef.current !== sceneYtId) {
         if (typeof sceneYtPlayerRef.current.loadVideoById === 'function') {
           sceneYtPlayerRef.current.loadVideoById({ videoId: sceneYtId, startSeconds: sceneStart });
           lastSceneMusicRef.current = sceneYtId;
         }
      }

      // Vol Control & State
      const player = sceneYtPlayerRef.current;
      if (typeof player?.setVolume === 'function') {
        player.setVolume(isMuted ? 0 : (!useGlobalMusic ? 50 : 0));
        if (!useGlobalMusic && !isPreview && !isMuted) player.playVideo();
        else if (useGlobalMusic) player.pauseVideo();
      }
    } else if (sceneUrl) {
       if (!sceneSoundRef.current || lastSceneMusicRef.current !== sceneUrl) {
         if (sceneSoundRef.current) sceneSoundRef.current.unload();
         sceneSoundRef.current = new Howl({ src: [sceneUrl], loop: true, volume: 0.5 });
         lastSceneMusicRef.current = sceneUrl;
       }
       sceneSoundRef.current.mute(isMuted);
       if (sceneStart > 0) sceneSoundRef.current.seek(sceneStart);
       if (!isPreview && !isMuted) sceneSoundRef.current.play();
    } else {
      if (sceneYtPlayerRef.current) sceneYtPlayerRef.current.stopVideo();
      if (sceneSoundRef.current) sceneSoundRef.current.stop();
    }

    // Segment looping interval
    const loopInterval = setInterval(() => {
       if (sceneYtId && sceneDuration > 0 && sceneYtPlayerRef.current?.getCurrentTime) {
         const pos = sceneYtPlayerRef.current.getCurrentTime();
         if (pos >= sceneStart + sceneDuration) sceneYtPlayerRef.current.seekTo(sceneStart);
       }
       if (sceneUrl && sceneDuration > 0 && sceneSoundRef.current) {
         const pos = sceneSoundRef.current.seek();
         if (pos >= sceneStart + sceneDuration) sceneSoundRef.current.seek(sceneStart);
       }
    }, 500);

    return () => clearInterval(loopInterval);
  }, [currentSceneIndex, style, isYtReady, isMuted, isPreview]);

  // Audio Interaction Handler
  const startAudioOnInteraction = useCallback(() => {
    if (isMuted) return;
    if (globalYtPlayerRef.current?.playVideo) globalYtPlayerRef.current.playVideo();
    if (globalSoundRef.current) globalSoundRef.current.play();
    if (sceneYtPlayerRef.current?.playVideo) sceneYtPlayerRef.current.playVideo();
    if (sceneSoundRef.current) sceneSoundRef.current.play();
  }, [isMuted]);

  const nextScene = useCallback(() => {
    // Start music on interaction
    startAudioOnInteraction();

    if (currentSceneIndex < (scenes.length)) {
       setCurrentSceneIndex(prev => prev + 1);
    }
  }, [currentSceneIndex, scenes.length, isPreview, startAudioOnInteraction]);

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
    <div 
      className="relative w-full h-full bg-black overflow-hidden font-display select-none"
      onClick={() => {
        if (isMuted) {
          setIsMuted(false);
          startAudioOnInteraction();
        }
      }}
    >
      
      {/* Background Layer */}
      <ThemeBackground themeId={activeThemeId} isPreview={isPreview} moment={moment} />

      <AnimatePresence mode="wait">
        
        {/* Intro Splash */}
        {currentSceneIndex === -1 && (
          <motion.div
            key="intro"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            className="absolute inset-0 flex flex-col items-center justify-center z-10 text-center p-6"
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
              A Surprise For {moment.recipientName || "Someone Special"}
            </h1>
            <p className="text-white/60 font-bold uppercase tracking-widest text-[10px]">
              Created by {moment.isAnonymous ? "a thoughtful person" : (moment.senderName || "a thoughtful person")}
            </p>
            <motion.div 
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="mt-12 text-white/40 text-[10px] font-black uppercase tracking-[0.3em] bg-white/5 px-8 py-4 rounded-2xl border border-white/10 backdrop-blur-md cursor-pointer hover:bg-white/10 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                nextScene();
              }}
            >
              Open Surprise
            </motion.div>

            {/* Global Music Indicator - Moved to Top Right per User Request */}
            {style.musicMetadata && (
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1 }}
                className="absolute top-8 right-8 flex items-center gap-3 px-4 py-2 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl max-w-[200px] z-[60]"
              >
                {style.musicMetadata.thumbnail && (
                  <img src={style.musicMetadata.thumbnail} className="size-8 rounded-lg border border-white/10" alt="Music" />
                )}
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-[10px] font-black text-white truncate">{style.musicMetadata.title}</p>
                  <p className="text-[8px] font-bold text-primary uppercase tracking-widest flex items-center gap-1">
                    <Music2 size={8} /> Themesong
                  </p>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* Dynamic Scenes */}
        {currentSceneIndex >= 0 && currentSceneIndex < scenes.length && currentScene && (
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

        {/* Branding/Final End Screen */}
        {currentSceneIndex === scenes.length && (() => {
           const showBranding = moment?.plan !== "premium" && !moment?.paidAddons?.includes("removeBranding");
           
           return (
             <motion.div
               key="end-branding"
               initial={{ opacity: 0, scale: 0.9 }}
               animate={{ opacity: 1, scale: 1 }}
               className="absolute inset-0 flex flex-col items-center justify-center z-[100] text-center p-8 bg-black/60 backdrop-blur-3xl"
             >
               <motion.div 
                 initial={{ opacity: 0, y: 20 }}
                 animate={{ opacity: 1, y: 0 }}
                 className="max-w-md w-full"
               >
                  <div className="size-20 bg-primary/20 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-primary/30">
                    <Gift className="text-primary" size={32} />
                  </div>
                  
                  {showBranding ? (
                    <>
                      <h2 className="text-3xl font-black text-white uppercase tracking-tighter mb-4 leading-tight">
                        This beautiful surprise was created with Surpriseal
                      </h2>
                      <p className="text-white/40 font-bold uppercase tracking-widest text-[10px] mb-12">
                        Elevate your gifting experience 🎁
                      </p>
                      
                      <button 
                        onClick={() => window.open("/", "_blank")}
                        className="w-full py-5 bg-primary text-white rounded-2xl font-black uppercase tracking-[0.2em] text-xs shadow-2xl shadow-primary/40 hover:scale-105 active:scale-95 transition-all"
                      >
                        Create your own surprise
                      </button>
                    </>
                  ) : (
                    <>
                      <h2 className="text-3xl font-black text-white uppercase tracking-tighter mb-4 leading-tight">
                        The End of this Moment
                      </h2>
                      <p className="text-white/40 font-bold uppercase tracking-widest text-[10px] mb-12">
                        We hope you enjoyed this surprise!
                      </p>
                      <button 
                        onClick={() => setCurrentSceneIndex(-1)}
                        className="w-full py-5 bg-white/10 text-white border border-white/20 rounded-2xl font-black uppercase tracking-[0.2em] text-xs hover:bg-white/20 active:scale-95 transition-all"
                      >
                        Watch Again
                      </button>
                    </>
                  )}
               </motion.div>
             </motion.div>
           );
        })()}

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
      <div className="absolute top-8 left-8 flex items-center gap-3 z-50">
        <button 
          onClick={() => setIsMuted(!isMuted)}
          className="size-10 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-all"
        >
          {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
        </button>
      </div>

      {/* Hidden YouTube Players */}
      <div id="yt-player-global" className="fixed inset-0 pointer-events-none opacity-0 z-[-1]" />
      <div id="yt-player-scene" className="fixed inset-0 pointer-events-none opacity-0 z-[-1]" />
    </div>
  );
}

function ThemeBackground({ themeId, isPreview, moment }: { themeId: string, isPreview?: boolean, moment: any }) {
  const themes: Record<string, any> = {
    "birthday-classic": {
      sparkleColor: "#ec4899",
      bgColor: "bg-gradient-to-b from-[#2d1b16] to-[#000000]",
      starCount: 3000,
      starFactor: 4,
      sparkleCount: 150,
      confetti: false
    },
    "anniversary-gold": {
      sparkleColor: "#fbbf24",
      bgColor: "bg-gradient-to-br from-[#2d2a16] via-[#1a180e] to-black",
      starCount: 4000,
      starFactor: 6,
      sparkleCount: 200,
      confetti: false
    },
    "surprise-neon": {
      sparkleColor: "#22d3ee",
      bgColor: "bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#0e2d2d] via-black to-black",
      starCount: 2000,
      starFactor: 8,
      sparkleCount: 300,
      confetti: false
    },
    "elegant-noir": {
      sparkleColor: "#ffffff",
      bgColor: "bg-gradient-to-b from-[#1a1a1a] to-black",
      starCount: 6000,
      starFactor: 2,
      sparkleCount: 100,
      confetti: false
    },
    "romantic-rose": {
      sparkleColor: "#f43f5e",
      bgColor: "bg-[conic-gradient(from_0deg_at_50%_50%,_#2d1616,_black,_#2d1616)]",
      starCount: 3000,
      starFactor: 3,
      sparkleCount: 250,
      confetti: false
    },
    "party-popper": {
      sparkleColor: "#ff00ff",
      bgColor: "bg-gradient-to-tr from-[#162d16] via-black to-[#2d162d]",
      starCount: 2000,
      starFactor: 10,
      sparkleCount: 0,
      confetti: true,
      confettiColors: ["#ff0000", "#00ff00", "#0000ff", "#ffff00", "#ff00ff", "#00ffff"]
    },
    "golden-gala": {
      sparkleColor: "#ffd700",
      bgColor: "bg-gradient-to-b from-[#2d2812] to-black",
      starCount: 5000,
      starFactor: 5,
      sparkleCount: 400,
      confetti: true,
      confettiColors: ["#ffd700", "#daa520", "#b8860b", "#fff8dc"]
    },
    "midnight-aurora": {
      sparkleColor: "#4ade80",
      bgColor: "bg-gradient-to-t from-black via-[#061a14] to-[#042d24]",
      starCount: 8000,
      starFactor: 1,
      sparkleCount: 50,
      confetti: false,
      aurora: true
    }
  };

  const themeConfig = themes[themeId] || themes["surprise-neon"];

  return (
    <div className={cn("absolute inset-0 z-0", themeConfig.bgColor)}>
      <Canvas camera={{ position: [0, 0, 5] }}>
        <Stars 
          radius={100} 
          depth={50} 
          count={themeConfig.starCount} 
          factor={themeConfig.starFactor} 
          saturation={0} 
          fade 
          speed={1.5} 
        />
        {themeConfig.sparkleCount > 0 && (
          <Sparkles3D 
            count={themeConfig.sparkleCount} 
            scale={12} 
            size={3} 
            speed={0.5} 
            opacity={0.6} 
            color={themeConfig.sparkleColor} 
          />
        )}
        {themeConfig.confetti && (
          <Confetti3D colors={themeConfig.confettiColors} count={120} />
        )}
        <ambientLight intensity={0.8} />
        <pointLight position={[10, 10, 10]} intensity={1} />
      </Canvas>
      {/* Premium Glassmorphism Overlay */}
      <div className="absolute inset-0 bg-black/30 pointer-events-none transition-colors duration-1000" />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-90 pointer-events-none" />
      
      {/* Specific theme effects */}
      {themeId === "midnight-aurora" && (
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_#4ade8022_0%,_transparent_70%)] animate-pulse" />
      )}
      {themeId === "surprise-neon" && (
        <div className="absolute inset-0 shadow-[inset_0_0_100px_rgba(34,211,238,0.1)]" />
      )}

    </div>
  );
}
