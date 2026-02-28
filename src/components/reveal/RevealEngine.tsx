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
  Gift,
  Play,
  Pause,
  Maximize2,
  Minimize2,
  Expand,
  Shrink,
  ShieldAlert
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ScratchUtility, GalleryUtility, CompositionUtility, VideoUtility, AudioUtility } from "./utilities/RevealUtilities";
import ReactionCollector from "./ReactionCollector";

interface Scene {
  id: string;
  type: "scratch" | "gallery" | "composition" | "video" | "audio";
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
  const [isUnlocked, setIsUnlocked] = useState(isPreview || !moment?.unlockConfig || moment?.unlockConfig?.type === "none");
  const [showUnlockUI, setShowUnlockUI] = useState(false);
  const [isReacting, setIsReacting] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [unlockError, setUnlockError] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [showHint, setShowHint] = useState(false);
  const [shake, setShake] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isAudioBlocked, setIsAudioBlocked] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [isAutoplay, setIsAutoplay] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [isInternalMediaPlaying, setIsInternalMediaPlaying] = useState(false);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const volumeTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Auto-close volume slider timer
  useEffect(() => {
    if (showVolumeSlider) {
        if (volumeTimerRef.current) clearTimeout(volumeTimerRef.current);
        volumeTimerRef.current = setTimeout(() => setShowVolumeSlider(false), 2000);
    }
    return () => {
        if (volumeTimerRef.current) clearTimeout(volumeTimerRef.current);
    }
  }, [showVolumeSlider]);
  const autoplayTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Audio Refs
  const globalSoundRef = useRef<Howl | null>(null);
  const globalYtPlayerRef = useRef<any>(null);
  const sceneSoundRef = useRef<Howl | null>(null);
  const sceneYtPlayerRef = useRef<any>(null);
  
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isUIVisible, setIsUIVisible] = useState(true);
  const lastGlobalMusicRef = useRef<string>("");
  const lastSceneMusicRef = useRef<string>("");

  // Sync fullscreen state
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

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

  // Reset lightbox state when changing scenes
  useEffect(() => {
    setIsLightboxOpen(false);
  }, [currentSceneIndex]);

  // Hierarchy Theme Selection
  const activeThemeId = useMemo(() => {
    // Override with Golden Gala theme specifically for the Final End Screen
    if (currentSceneIndex === scenes.length) return "golden-gala";

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
  }, [style.themeId, currentScene?.config, moment?.occasionId, currentSceneIndex, scenes.length]);

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
  const isSplash = currentSceneIndex === -1;
  const isFinal = currentSceneIndex === scenes.length;

  // Helper to determine music state for any index
  const getMusicState = useCallback((index: number) => {
    const splash = index === -1;
    const final = index === scenes.length;
    const scene = scenes[index];

    const prefersGlobal = splash 
      ? style.splashConfig?.useGlobalMusic !== false 
      : (final || scene?.config?.useGlobalMusic !== false);

    // Silence background music for video/audio playbacks OR when internal media is playing
    const isMediaScene = scene?.type === "video" || scene?.type === "audio";
    const shouldSilenceMusic = isMediaScene || isInternalMediaPlaying || isReacting;

    return {
      prefersGlobal,
      useGlobalMusic: prefersGlobal && !shouldSilenceMusic,
      useSceneMusic: !prefersGlobal && !shouldSilenceMusic
    };
  }, [scenes, style, isReacting, isInternalMediaPlaying]);

  const { useGlobalMusic, useSceneMusic, prefersGlobal } = getMusicState(currentSceneIndex);

  // Track Metadata
  const globalYtId = style.ytMusicId;
  const globalUrl = style.musicUrl;
  
  const sceneYtId = !prefersGlobal ? (isSplash ? style.splashConfig?.ytMusicId : currentScene?.config?.ytMusicId) : null;
  const sceneUrl = !prefersGlobal ? (isSplash ? style.splashConfig?.musicUrl : currentScene?.config?.musicUrl) : null;
  
  const sceneStart = !prefersGlobal ? (isSplash ? style.splashConfig?.audioStart || 0 : currentScene?.config?.audioStart || 0) : 0;
  const sceneDuration = !prefersGlobal ? (isSplash ? style.splashConfig?.audioDuration || 0 : currentScene?.config?.audioDuration || 0) : 0;

  // Main Audio Update Effect
  useEffect(() => {
    if (!isYtReady && (globalYtId || sceneYtId)) return;

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
        lastGlobalMusicRef.current = globalYtId;
      } else if (lastGlobalMusicRef.current !== globalYtId) {
        if (typeof globalYtPlayerRef.current.loadVideoById === 'function') {
          globalYtPlayerRef.current.loadVideoById(globalYtId);
          lastGlobalMusicRef.current = globalYtId;
        }
      }

      // Vol Control & State
      const player = globalYtPlayerRef.current;
      if (typeof player?.setVolume === 'function') {
        const targetVol = isMuted ? 0 : (useGlobalMusic ? Math.round(volume * 100) : 0);
        player.setVolume(targetVol);
        if (useGlobalMusic && !isPreview && !isMuted) player.playVideo();
        else if (!useGlobalMusic) player.pauseVideo();
      }
    } else if (globalUrl) {
       if (!globalSoundRef.current || lastGlobalMusicRef.current !== globalUrl) {
         if (globalSoundRef.current) globalSoundRef.current.unload();
         globalSoundRef.current = new Howl({ src: [globalUrl], loop: true, volume: volume });
         lastGlobalMusicRef.current = globalUrl;
       }
       globalSoundRef.current.volume(volume);
       globalSoundRef.current.mute(isMuted || !useGlobalMusic);
       if (useGlobalMusic && !isPreview && !isMuted) globalSoundRef.current.play();
       else if (!useGlobalMusic) globalSoundRef.current.pause();
    } else {
      if (globalYtPlayerRef.current) globalYtPlayerRef.current.stopVideo();
      if (globalSoundRef.current) globalSoundRef.current.stop();
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
         lastSceneMusicRef.current = sceneYtId;
      } else if (lastSceneMusicRef.current !== sceneYtId) {
         if (typeof sceneYtPlayerRef.current.loadVideoById === 'function') {
           sceneYtPlayerRef.current.loadVideoById({ videoId: sceneYtId, startSeconds: sceneStart });
           lastSceneMusicRef.current = sceneYtId;
         }
      }

      // Vol Control & State
      const player = sceneYtPlayerRef.current;
      if (typeof player?.setVolume === 'function') {
        const targetVol = isMuted ? 0 : (useSceneMusic ? Math.round(volume * 100) : 0);
        player.setVolume(targetVol);
        if (useSceneMusic && !isPreview && !isMuted) player.playVideo();
        else if (!useSceneMusic) player.pauseVideo();
      }
    } else if (sceneUrl) {
       if (!sceneSoundRef.current || lastSceneMusicRef.current !== sceneUrl) {
         if (sceneSoundRef.current) sceneSoundRef.current.unload();
         sceneSoundRef.current = new Howl({ src: [sceneUrl], loop: true, volume: volume });
         if (sceneStart > 0) sceneSoundRef.current.seek(sceneStart);
         lastSceneMusicRef.current = sceneUrl;
       }
       sceneSoundRef.current.volume(volume);
       sceneSoundRef.current.mute(isMuted || !useSceneMusic);
       if (useSceneMusic && !isPreview && !isMuted) sceneSoundRef.current.play();
       else if (!useSceneMusic) sceneSoundRef.current.pause();
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
  }, [currentSceneIndex, style, isYtReady, isMuted, volume, isPreview, isReacting, useGlobalMusic, useSceneMusic, globalYtId, sceneYtId, globalUrl, sceneUrl, sceneStart, sceneDuration]);

  // Audio Interaction Handler
  const startAudioOnInteraction = useCallback((targetIndex?: number) => {
    // Force set isMuted to false if we're calling this from an interaction
    setIsMuted(false);
    
    // Determine which music state to activate
    const indexToUse = targetIndex !== undefined ? targetIndex : currentSceneIndex;
    const { useGlobalMusic: targetUseGlobal, useSceneMusic: targetUseScene } = getMusicState(indexToUse);

    // Explicitly trigger play for the ACTIVE source ONLY
    try {
      if (targetUseGlobal) {
        if (globalYtPlayerRef.current?.playVideo) globalYtPlayerRef.current.playVideo();
        if (globalSoundRef.current) globalSoundRef.current.play();
        // Ensure scene music is paused
        if (sceneYtPlayerRef.current?.pauseVideo) sceneYtPlayerRef.current.pauseVideo();
        if (sceneSoundRef.current) sceneSoundRef.current.pause();
      } else if (targetUseScene) {
        if (sceneYtPlayerRef.current?.playVideo) sceneYtPlayerRef.current.playVideo();
        if (sceneSoundRef.current) sceneSoundRef.current.play();
        // Ensure global music is paused
        if (globalYtPlayerRef.current?.pauseVideo) globalYtPlayerRef.current.pauseVideo();
        if (globalSoundRef.current) globalSoundRef.current.pause();
      }
      setIsAudioBlocked(false);
    } catch (err) {
      console.warn("Audio playback was blocked by browser", err);
      setIsAudioBlocked(true);
    }
  }, [currentSceneIndex, getMusicState]);

  const handleUnlock = useCallback(async () => {
    const config = moment?.unlockConfig;
    if (!config) {
      setIsUnlocked(true);
      setCurrentSceneIndex(0);
      return;
    }

    setIsVerifying(true);
    setUnlockError(null);

    // Simulate a slight delay for "Security Feel"
    await new Promise(r => setTimeout(r, 800));

    let correct = false;
    if (config.type === "password") {
      correct = inputValue.trim().toLowerCase() === String(config.password).trim().toLowerCase();
    } else if (config.type === "qa") {
      correct = inputValue.trim().toLowerCase() === String(config.answer).trim().toLowerCase();
    }

    if (correct) {
      setIsUnlocked(true);
      setShowUnlockUI(false);
      setCurrentSceneIndex(0);
      startAudioOnInteraction(0);
    } else {
      setUnlockError("Incorrect entry. Please try again.");
      setShake(true);
      setTimeout(() => setShake(false), 500);
    }
    setIsVerifying(false);
  }, [moment?.unlockConfig, inputValue, startAudioOnInteraction]);

  const nextScene = useCallback((isManual = false) => {
    // Proactively request full-screen on mobile when opening the surprise manually
    if (isManual && typeof window !== "undefined" && window.innerWidth < 1024 && !document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    }

    if (currentSceneIndex === -1 && !isUnlocked) {
      setShowUnlockUI(true);
      return;
    }

    const nextIndex = currentSceneIndex + 1;
    if (nextIndex <= scenes.length) {
       startAudioOnInteraction(nextIndex);
       setCurrentSceneIndex(nextIndex);
       // Stop autoplay when reaching the final screen
       if (nextIndex === scenes.length) {
         setIsAutoplay(false);
       }
    }
  }, [currentSceneIndex, scenes.length, startAudioOnInteraction, isUnlocked, setIsAutoplay]);

  const prevScene = useCallback(() => {
    const targetIndex = currentSceneIndex - 1;
    if (targetIndex >= -1) {
      // Start music for the TARGET scene immediately in the interaction loop
      startAudioOnInteraction(targetIndex);
      setCurrentSceneIndex(targetIndex);
    }
  }, [currentSceneIndex, startAudioOnInteraction]);

  // Autoplay fallback logic for scenes that don't support onComplete or as a safety net
  const startAutoplayTimer = useCallback(() => {
    if (autoplayTimerRef.current) clearTimeout(autoplayTimerRef.current);

    // If on splash, trigger nextScene immediately with a small delay
    if (currentSceneIndex === -1 && isAutoplay) {
      autoplayTimerRef.current = setTimeout(() => nextScene(false), 2000);
      return;
    }

    if (currentSceneIndex >= scenes.length) return;

    const scene = scenes[currentSceneIndex];
    if (scene.type === "scratch") {
      autoplayTimerRef.current = setTimeout(() => {
        if (isAutoplay) nextScene(false);
      }, 10000);
    }
  }, [currentSceneIndex, scenes, isAutoplay, nextScene]);

  useEffect(() => {
    if (isAutoplay) {
      startAutoplayTimer();
    } else {
      if (autoplayTimerRef.current) clearTimeout(autoplayTimerRef.current);
    }
    return () => {
      if (autoplayTimerRef.current) clearTimeout(autoplayTimerRef.current);
    };
  }, [isAutoplay, currentSceneIndex, startAutoplayTimer]);

  // Map media objects for the current scene
  const sceneData = useMemo(() => {
    if (!currentScene) return null;
    const media = (currentScene.config.mediaIds || []).map((id: string) =>
      moment.media?.find((m: any) => m.id === id)
    ).filter(Boolean);

    return {
      ...currentScene.config,
      media,
      mediaUrl: currentScene.config.mediaUrl || media[0]?.url, // Support both direct URL and media library selection
      recipientName: moment.recipientName
    };
  }, [currentScene, moment]);

  // Determine if we should show the mute button
  const hasAnyMusic = useMemo(() => {
    // Check global
    if (style.ytMusicId || style.musicUrl) return true;

    // Check splash
    if (style.splashConfig?.ytMusicId || style.splashConfig?.musicUrl) return true;

    // Check all scenes for custom music
    return (scenes || []).some((s: any) => s.config?.ytMusicId || s.config?.musicUrl);
  }, [style, scenes]);

  return (
    <div
      className="relative w-full h-full bg-black overflow-hidden font-display select-none"
      onClick={() => startAudioOnInteraction()}
    >

      {/* Background Layer */}
      <ThemeBackground themeId={activeThemeId} isPreview={isPreview} moment={moment} />

      {/* Persistent Music Indicator */}
      <AnimatePresence>
      {isUIVisible && (useGlobalMusic ? style.musicMetadata : currentScene?.config?.musicMetadata) && (
        <motion.div
          key={`music-indicator-${currentSceneIndex}`}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-8 right-8 flex items-center gap-3 px-4 py-2 bg-white/5 backdrop-blur-md border border-white/10 rounded-lg max-w-[200px] z-40 pointer-events-none"
        >
          {((useGlobalMusic ? style.musicMetadata : currentScene?.config?.musicMetadata)).thumbnail && (
            <img
              src={(useGlobalMusic ? style.musicMetadata : currentScene?.config?.musicMetadata).thumbnail}
              className="size-8 rounded-lg border border-white/10"
              alt="Music"
            />
          )}
          <div className="flex-1 min-w-0 text-left">
            <p className="text-[10px] font-black text-white truncate">
              {(useGlobalMusic ? style.musicMetadata : currentScene?.config?.musicMetadata).title}
            </p>
            <p className="text-[8px] font-bold text-primary uppercase tracking-widest flex items-center gap-1">
              <Music2 size={8} /> {useGlobalMusic ? "Themesong" : "Scene Music"}
            </p>
          </div>
        </motion.div>
      )}
      </AnimatePresence>

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
              className="mt-12 text-white/40 text-[10px] font-black uppercase tracking-[0.3em] bg-white/5 px-8 py-4 rounded-lg border border-white/10 backdrop-blur-md cursor-pointer hover:bg-white/10 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
              nextScene(true);
            }}
          >
            Open Surprise
          </motion.div>

          {/* Unlock Overlay */}
          <AnimatePresence>
            {showUnlockUI && !isUnlocked && (
              <UnlockOverlay
                moment={moment}
                inputValue={inputValue}
                setInputValue={setInputValue}
                isVerifying={isVerifying}
                error={unlockError}
                onUnlock={handleUnlock}
                showHint={showHint}
                setShowHint={setShowHint}
                shake={shake}
                onClose={() => setShowUnlockUI(false)}
              />
            )}
          </AnimatePresence>


          </motion.div>
        )}

        {/* Dynamic Scenes */}
        {currentSceneIndex >= 0 && currentSceneIndex < scenes.length && currentScene && (
          <motion.div
            key={currentScene.id}
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            className={cn(
              "absolute inset-0 flex items-center justify-center transition-all duration-300",
              isLightboxOpen ? "z-[70]" : "z-20"
            )}
          >
            {currentScene.type === "scratch" && (
              <ScratchUtility config={sceneData} onComplete={nextScene} />
            )}
            {currentScene.type === "gallery" && (
              <GalleryUtility
                config={sceneData}
                onLightboxToggle={setIsLightboxOpen}
                isAutoplay={isAutoplay}
                onComplete={nextScene}
                globalVolume={volume}
                isGlobalMuted={isMuted}
                onMediaPlayStatusChange={setIsInternalMediaPlaying}
              />
            )}
            {currentScene.type === "composition" && (
              <CompositionUtility
                config={sceneData}
                isAutoplay={isAutoplay}
                onComplete={nextScene}
                globalVolume={volume}
                isGlobalMuted={isMuted}
                onMediaPlayStatusChange={setIsInternalMediaPlaying}
                shouldSilenceMusic={sceneData.media.some((m: any) => m.type === 'video')}
              />
            )}
            {currentScene.type === "video" && (
              <VideoUtility
                config={sceneData}
                isAutoplay={isAutoplay}
                onComplete={nextScene}
                globalVolume={volume}
                isGlobalMuted={isMuted}
                onMediaPlayStatusChange={setIsInternalMediaPlaying}
              />
            )}
            {currentScene.type === "audio" && (
              <AudioUtility
                config={sceneData}
                isAutoplay={isAutoplay}
                onComplete={nextScene}
                globalVolume={volume}
                isGlobalMuted={isMuted}
                onMediaPlayStatusChange={setIsInternalMediaPlaying}
              />
            )}
          </motion.div>
        )}

        {/* Branding/Final End Screen */}
        {currentSceneIndex === scenes.length && (() => {
           const showBranding = moment?.plan !== "premium" && !moment?.paidAddons?.includes("removeBranding") && !moment?.selectedAddons?.includes("removeBranding");

           return (
             <motion.div
               key="end-branding"
               initial={{ opacity: 0, scale: 0.9 }}
               animate={{ opacity: 1, scale: 1 }}
               className="absolute inset-0 flex flex-col items-center justify-center z-[100] text-center p-8 bg-black/40 backdrop-blur-md"
             >
               <motion.div
                 initial={{ opacity: 0, y: 20 }}
                 animate={{ opacity: 1, y: 0 }}
                 className="max-w-md w-full"
               >
                  <AnimatePresence mode="popLayout">
                    {!isReacting && (
                      <motion.div
                        key="end-content"
                        initial={{ opacity: 0, scale: 0.9, height: 0 }}
                        animate={{ opacity: 1, scale: 1, height: 'auto' }}
                        exit={{ opacity: 0, scale: 0.9, height: 0, overflow: 'hidden' }}
                        className="flex flex-col items-center"
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
                               Surprise Complete!
                             </h2>
                             <p className="text-white/40 font-bold uppercase tracking-widest text-[10px] mb-12">
                               Let them know how it made you feel below 👇
                             </p>
                             {moment?.styleConfig?.showReactions === false && (
                               <button
                                 onClick={() => setCurrentSceneIndex(-1)}
                                 className="w-full py-5 bg-white/10 text-white border border-white/20 rounded-2xl font-black uppercase tracking-[0.2em] text-xs hover:bg-white/20 active:scale-95 transition-all mb-8"
                               >
                                 Watch Again
                               </button>
                             )}
                           </>
                         )}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {(!showBranding && moment?.styleConfig?.showReactions !== false) && (
                     <motion.div layout className="animate-in fade-in slide-in-from-bottom-8 duration-700 delay-500 fill-mode-both w-full">
                       <ReactionCollector
                         momentId={moment?.id}
                         isPreview={isPreview}
                         onActiveChange={setIsReacting}
                         onWatchAgain={() => setCurrentSceneIndex(-1)}
                       />
                     </motion.div>
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
      {currentSceneIndex >= 0 && currentSceneIndex < scenes.length && (
         <div className="absolute bottom-6 sm:bottom-10 inset-x-0 flex items-center justify-center gap-1.5 sm:gap-6 z-50 px-2 sm:px-4">
            <button
              onClick={(e) => { e.stopPropagation(); prevScene(); }}
              disabled={isAutoplay}
              className={cn(
                "size-10 sm:size-12 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white transition-all shrink-0",
                isAutoplay ? "opacity-20 cursor-not-allowed" : "hover:bg-white/20 active:scale-90"
              )}
            >
              <ChevronLeft size={20} className="sm:size-6" />
            </button>

            <div className="flex h-10 sm:h-12 items-center gap-1 sm:gap-2 px-2 sm:px-3 rounded-full bg-white/5 backdrop-blur-sm border border-white/10 shrink-0">
               {/* Autoplay Toggle */}
               <button
                 onClick={(e) => { e.stopPropagation(); setIsAutoplay(!isAutoplay); }}
                 className={cn(
                   "flex items-center gap-2 px-2 sm:px-3 h-7 sm:h-8 rounded-full transition-all text-[9px] sm:text-[10px] font-black uppercase tracking-widest",
                    isAutoplay ? "bg-primary text-white" : "bg-white/10 text-white/60 hover:text-white"
                 )}
               >
                 {isAutoplay ? <Pause size={10} className="sm:size-3" fill="white" /> : <Play size={10} className="sm:size-3" fill="white" />}
                 <span className="hidden sm:inline">{isAutoplay ? "Autoplay On" : "Autoplay"}</span>
               </button>

               <div className="w-[1px] h-3 sm:h-4 bg-white/10 mx-0.5 sm:mx-1" />

               <div className="text-[9px] sm:text-[10px] font-black text-white/60 uppercase tracking-widest px-1 sm:px-2 min-w-[32px] sm:min-w-[40px] text-center">
                 {currentSceneIndex + 1} / {scenes.length}
               </div>

                <div className="w-[1px] h-3 sm:h-4 bg-white/10 mx-0.5 sm:mx-1" />

                <button
                  onClick={(e) => { e.stopPropagation(); setIsUIVisible(!isUIVisible); }}
                  className="flex items-center justify-center size-7 sm:size-8 rounded-full bg-white/10 text-white/60 hover:text-white hover:bg-white/20 transition-all"
                  title={isUIVisible ? "Minimize UI" : "Expand UI"}
                >
                  {isUIVisible ? <Shrink size={14} className="sm:size-4" /> : <Expand size={14} className="sm:size-4" />}
                </button>
            </div>

            <button
              onClick={(e) => { e.stopPropagation(); nextScene(true); }}
              disabled={isAutoplay}
              className={cn(
                "size-10 sm:size-12 rounded-full text-white flex items-center justify-center shadow-lg transition-all shrink-0",
                isAutoplay
                  ? "bg-primary/40 opacity-50 cursor-not-allowed"
                  : "bg-primary shadow-primary/20 hover:bg-primary/90 active:scale-90"
              )}
            >
              <ChevronRight size={20} className="sm:size-6" />
            </button>
         </div>
      )}

      {/* Persistence Controls (Mute, Fullscreen, etc) */}
      <div className="absolute top-8 left-8 flex flex-col-reverse sm:flex-row items-center sm:items-start gap-3 z-[110]">
        <AnimatePresence>
        {isUIVisible && (
          <>
        <div className="relative flex flex-col items-center">
            <motion.div
                layout
                initial={false}
                className="flex flex-col items-center gap-2 p-2 rounded-lg bg-white/10 backdrop-blur-md border border-white/20 text-white shadow-lg transition-all w-[44px] overflow-hidden"
            >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsMuted(!isMuted);
                    if (volumeTimerRef.current) clearTimeout(volumeTimerRef.current);
                    volumeTimerRef.current = setTimeout(() => setShowVolumeSlider(false), 2000);
                  }}
                  className="flex items-center justify-center hover:text-primary transition-colors p-1"
                  title={isMuted ? "Unmute" : "Mute"}
                >
                  {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                </button>

                <div className="w-4 h-[1px] bg-white/20" />

                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        setShowVolumeSlider(!showVolumeSlider);
                    }}
                    className="text-[9px] font-black tracking-tighter hover:text-primary transition-colors text-center -mt-0.5 opacity-80 w-full flex justify-center p-1"
                >
                    {Math.round(volume * 100)}%
                </button>

                <AnimatePresence>
                    {showVolumeSlider && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 120, opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            onMouseEnter={() => { if (volumeTimerRef.current) clearTimeout(volumeTimerRef.current); }}
                            onMouseLeave={() => {
                                volumeTimerRef.current = setTimeout(() => setShowVolumeSlider(false), 2000);
                            }}
                            className="flex flex-col items-center py-2 gap-2 w-full"
                        >
                            <div className="flex-1 w-1.5 bg-white/10 rounded-full relative group/slider cursor-pointer h-[100px]">
                                <input
                                    type="range"
                                    min="0"
                                    max="1"
                                    step="0.01"
                                    value={volume}
                                    onChange={(e) => {
                                        const val = parseFloat(e.target.value);
                                        setVolume(val);
                                        if (isMuted && val > 0) setIsMuted(false);
                                        if (volumeTimerRef.current) clearTimeout(volumeTimerRef.current);
                                        volumeTimerRef.current = setTimeout(() => setShowVolumeSlider(false), 2000);
                                    }}
                                    className="absolute inset-0 opacity-0 cursor-pointer z-10"
                                    style={{
                                        WebkitAppearance: 'slider-vertical',
                                        height: '100px',
                                        width: '24px',
                                        left: '-9px'
                                    }}
                                />
                                <motion.div
                                    className="absolute bottom-0 left-0 w-full bg-primary rounded-full"
                                    style={{ height: `${volume * 100}%` }}
                                />
                                
                                {/* Slider Thumb Handle */}
                                <motion.div 
                                    className="absolute left-1/2 -translate-x-1/2 size-3 bg-white rounded-full shadow-lg border border-primary/20 z-20 pointer-events-none"
                                    style={{ bottom: `calc(${volume * 100}% - 6px)` }}
                                />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
        
        <button 
          onClick={(e) => { 
            e.stopPropagation();
            if (!document.fullscreenElement) {
              document.documentElement.requestFullscreen().catch((err) => {
                console.error(`Error attempting to enable fullscreen mode: ${err.message}`);
              });
            } else {
              document.exitFullscreen();
            }
          }}
          className="size-10 sm:size-12 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white transition-all hover:bg-white/20 active:scale-90 lg:hidden"
          title="Toggle Fullscreen"
        >
          {isFullscreen ? <Minimize2 size={20} className="sm:size-6" /> : <Maximize2 size={20} className="sm:size-6" />}
        </button>
          </>
        )}
        </AnimatePresence>
      </div>

      {/* Hidden YouTube Players */}
      <div id="yt-player-global" className="fixed inset-0 pointer-events-none opacity-0 z-[-1]" />
      <div id="yt-player-scene" className="fixed inset-0 pointer-events-none opacity-0 z-[-1]" />
      
      {/* Audio Permission Modal */}
      <AnimatePresence>
        {isAudioBlocked && !isMuted && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 20, opacity: 0 }}
              className="w-full max-w-sm bg-surface border border-primary/20 rounded-3xl shadow-2xl overflow-hidden pointer-events-auto"
            >
              <div className="p-8 text-center space-y-6">
                <div className="size-20 rounded-3xl bg-primary/10 flex items-center justify-center text-primary mx-auto relative">
                  <Music2 size={40} />
                  <div className="absolute -top-2 -right-2 size-8 bg-primary text-white rounded-full flex items-center justify-center shadow-lg animate-bounce">
                    <Volume2 size={16} />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-xl font-black uppercase tracking-tight">Experience with Sound</h3>
                  <p className="text-[10px] text-text-muted font-bold leading-relaxed uppercase tracking-widest">
                    The surprise is best with its custom soundtrack. Tap below to enable audio.
                  </p>
                </div>

                <div className="flex gap-3 pt-2">
                  <button 
                    onClick={() => setIsAudioBlocked(false)}
                    className="flex-1 py-4 rounded-2xl bg-black/5 dark:bg-white/5 text-[10px] font-black uppercase tracking-widest hover:bg-black/10 dark:hover:bg-white/10 transition-all"
                  >
                    Silent Mode
                  </button>
                  <button 
                    onClick={() => startAudioOnInteraction()}
                    className="flex-2 py-4 px-8 rounded-2xl bg-primary text-white text-[10px] font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    <Volume2 size={14} /> Enable Sound
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
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

function UnlockOverlay({ 
  moment, 
  inputValue, 
  setInputValue, 
  isVerifying, 
  error, 
  onUnlock, 
  showHint, 
  setShowHint,
  shake,
  onClose
}: any) {
  const config = moment?.unlockConfig || {};
  const isPassword = config.type === "password";
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl"
    >
      <div className="absolute inset-0" onClick={onClose} />
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ 
          scale: 1, 
          opacity: 1,
          x: shake ? [-6, 6, -6, 6, 0] : 0 
        }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ 
          type: "spring", 
          damping: 25, 
          stiffness: 200,
          x: { duration: 0.4 }
        }}
        className="w-full max-w-md bg-surface/10 dark:bg-black/40 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden pointer-events-auto relative"
      >
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>

        <div className="p-8 sm:p-10 text-center space-y-8">
          {/* Header */}
          <div className="space-y-3">
            <div className="size-16 rounded-2xl bg-primary/20 flex items-center justify-center text-primary mx-auto mb-2 border border-primary/20 ring-4 ring-primary/5">
              {isPassword ? <Lock size={28} /> : <HelpCircle size={28} />}
            </div>
            <h2 className="text-2xl font-black text-white uppercase tracking-tight leading-tight">
              {isPassword ? "Secure Moment" : "Security Question"}
            </h2>
            <p className="text-[10px] text-white/50 font-bold uppercase tracking-[0.2em] leading-relaxed">
              {isPassword 
                ? "Enter the secret key to unlock" 
                : (config.question || "Answer correctly to proceed")}
            </p>
          </div>

          {/* Input Area */}
          <div className="space-y-4">
            <div className="relative group">
              <input 
                type={isPassword ? "password" : "text"}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && onUnlock()}
                className={cn(
                  "w-full h-16 bg-white/5 border-2 rounded-2xl px-6 text-center text-xl font-black text-white outline-none transition-all placeholder:text-white/10",
                  error 
                    ? "border-red-500/50 bg-red-500/5 ring-4 ring-red-500/5" 
                    : "border-white/10 focus:border-primary focus:bg-white/10 focus:ring-4 focus:ring-primary/5"
                )}
                placeholder={isPassword ? "••••••" : "Your Answer..."}
                autoFocus
              />
              {isVerifying && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm rounded-2xl">
                  <Loader2 className="animate-spin text-primary" size={24} />
                </div>
              )}
            </div>

            {error && (
              <motion.p 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-[10px] font-black uppercase tracking-widest text-red-400 flex items-center justify-center gap-2"
              >
                <AlertCircle size={12} /> {error}
              </motion.p>
            )}
          </div>

          {/* Actions */}
          <div className="space-y-6 pt-2">
            <button 
              onClick={onUnlock}
              disabled={isVerifying || !inputValue.trim()}
              className="w-full h-16 rounded-2xl bg-white text-black font-black uppercase tracking-[0.3em] text-xs shadow-xl shadow-white/5 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center gap-2"
            >
              {isVerifying ? "Verifying..." : "Unlock Surprise"}
            </button>

            {config.hint && (
              <div className="pt-2">
                {!showHint ? (
                  <button 
                    onClick={() => setShowHint(true)}
                    className="text-[9px] font-black text-white/30 hover:text-white/60 uppercase tracking-widest transition-colors"
                  >
                    Need a Hint?
                  </button>
                ) : (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-xl bg-white/5 border border-white/10"
                  >
                    <p className="text-[9px] font-bold text-primary uppercase tracking-[0.2em] mb-1">Creator's Hint</p>
                    <p className="text-xs font-medium text-white/70 italic leading-relaxed">
                      "{config.hint}"
                    </p>
                  </motion.div>
                )}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
