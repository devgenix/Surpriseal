"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { 
  Music, 
  Layout, 
  Play, 
  Pause,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  Heart,
  Check,
  MoveUp,
  MoveDown,
  Layers,
  Settings,
  Image as ImageIcon,
  Loader2,
  Music2,
  Search,
  X,
  Palette,
  Smartphone,
  Monitor,
  RefreshCcw,
  UploadCloud,
  Lock,
  ChevronRight,
  Laptop,
  Sparkles,
  Scroll,
  Moon,
  Award,
  PenTool,
  Gift
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useCreation } from "@/context/CreationContext";
import { useDebounce } from "@/hooks/useDebounce";
import RevealEngine from "../reveal/RevealEngine";
import { Button } from "@/components/ui/button";
import { uploadFile, deleteFile } from "@/lib/upload";
import { auth } from "@/lib/firebase";
import AudioTrimmer from "./AudioTrimmer";
import { optimizeImage } from "@/lib/image";
import { Select } from "@/components/ui/Select";
import { getMediaLimit } from "@/lib/pricing-utils";
import { ADDONS, PLANS } from "@/lib/constants/pricing";
import { useCurrency } from "@/context/CurrencyContext";
import { formatPrice } from "@/lib/currency";
import RichTextEditor, { RichTextEditorRef } from "./RichTextEditor";
import { prepareMomentForEngine, DEFAULT_SCENES } from "../reveal/utilities/RevealEngineUtils";

interface Scene {
  id: string;
  type: "gallery" | "composition";
  config: any;
  music?: string;
}

interface RevealStudioProps {
  draftId: string;
  onSave: (updates: any) => Promise<void>;
}

export default function RevealStudio({ draftId, onSave }: RevealStudioProps) {
  const { momentData, setCanContinue } = useCreation();
  
  const [scenes, setScenes] = useState<Scene[]>(
    momentData?.styleConfig?.scenes || DEFAULT_SCENES
  );
  const [activeSceneId, setActiveSceneId] = useState<string>("splash");
  const [previewDevice, setPreviewDevice] = useState<"mobile" | "desktop">("mobile");
  
  // Aesthetics Settings State
  const [thumbnailMode, setThumbnailMode] = useState<"upload" | "library">("upload");
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);
  const [isSettingGlobalMusic, setIsSettingGlobalMusic] = useState(false);
  const { currency } = useCurrency();
  const showBrandingFinal = momentData?.plan !== "premium" && !momentData?.selectedAddons?.includes("removeBranding") && !momentData?.paidAddons?.includes("removeBranding");

  const toggleAddon = async (addonId: string) => {
    if (!momentData || momentData.plan === "premium") return;
    
    const isPublished = momentData?.status === "Published";
    const isPaid = momentData?.paidAddons?.includes(addonId);
    if (isPublished && isPaid) return;

    const currentAddons = momentData.selectedAddons || [];
    const isAdding = !currentAddons.includes(addonId);
    
    let newAddons;
    if (isAdding) {
      newAddons = [...currentAddons, addonId];
    } else {
      newAddons = currentAddons.filter((id: string) => id !== addonId);
    }
    
    const basePrice = PLANS.find(p => p.id === (momentData.plan || "base"))?.price[currency] || 0;
    const addonsPrice = newAddons.reduce((acc: number, id: string) => {
      const addon = ADDONS.find(a => a.id === id);
      return acc + (addon?.price[currency] || 0);
    }, 0);
    
    const newTotal = basePrice + addonsPrice;
    await onSave({ selectedAddons: newAddons, totalPrice: newTotal });
  };

  // YouTube Music Search State
  const [ytSearchQuery, setYtSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(ytSearchQuery, 500);
  const [isSearching, setIsSearching] = useState(false);
  const [ytResults, setYtResults] = useState<any[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [playingId, setPlayingId] = useState<string | null>(null);
  
  const [isProcessingThumbnail, setIsProcessingThumbnail] = useState<string | null>(null);
  const [uploadingFiles, setUploadingFiles] = useState<Record<string, number>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Collapsible sections state
  const [isMasterExpanded, setIsMasterExpanded] = useState(true);
  const [isScreenExpanded, setIsScreenExpanded] = useState(true);
  const [insertingToEditor, setInsertingToEditor] = useState(false);
  const [isEditorModalOpen, setIsEditorModalOpen] = useState(false);
  const [isMediaPickerOpenInModal, setIsMediaPickerOpenInModal] = useState(false);
  const editorRef = useRef<RichTextEditorRef>(null);
  const mediaLibraryRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCanContinue(scenes.length > 0);
  }, [scenes, setCanContinue]);

  const style = momentData?.styleConfig || {};
  const maxAllowed = getMediaLimit(momentData);
  const imageUrl = momentData?.imageUrl || "";
  const activeScene = scenes.find(s => s.id === activeSceneId);

  const handleUpdateScenes = async (newScenes: Scene[]) => {
    setScenes(newScenes);
    await onSave({
      styleConfig: {
        ...momentData?.styleConfig,
        scenes: newScenes
      }
    });
  };


  const updateStyle = async (updates: any) => {
    await onSave({
      styleConfig: { ...style, ...updates }
    });
  };



  const addScene = () => {
    const newScene: Scene = {
      id: Math.random().toString(36).substr(2, 9),
      type: "composition",
      config: { text: "" }
    };
    handleUpdateScenes([...scenes, newScene]);
    setActiveSceneId(newScene.id);
  };

  const deleteScene = (id: string) => {
    if (scenes.length <= 1) return;
    const newScenes = scenes.filter(s => s.id !== id);
    handleUpdateScenes(newScenes);
    if (activeSceneId === id) setActiveSceneId(newScenes[0].id);
  };

  const updateSceneConfig = (id: string, updates: any) => {
    const newScenes = scenes.map(s => 
      s.id === id ? { ...s, config: { ...s.config, ...updates } } : s
    );
    handleUpdateScenes(newScenes);
  };

  const changeSceneType = (id: string, type: Scene["type"]) => {
    const newScenes = scenes.map(s => 
      s.id === id ? { ...s, type, config: getDefaultConfig(type) } : s
    );
    handleUpdateScenes(newScenes);
  };

  const getDefaultConfig = (type: Scene["type"]) => {
    switch (type) {
      case "gallery": return { layout: "grid", mediaIds: [] };
      case "composition": return { text: "", mediaIds: [] };
      default: return {};
    }
  };

  const toggleMedia = (mediaId: string) => {
    const isComposition = activeScene?.type === "composition";
    
    // For Composition scenes, clicking an image should ONLY insert it into the editor
    if (insertingToEditor || isComposition) {
      const media = momentData?.media?.find((m: any) => m.id === mediaId);
      if (media && editorRef.current) {
        editorRef.current.insertImage(media.url);
        // Only turn off the "special insertion" mode if it was explicitly turned on
        if (insertingToEditor) setInsertingToEditor(false);
      }
      // If it's a composition scene, we strictly don't want to update the gallery mediaIds
      if (isComposition) return;
    }

    if (!activeScene) return;
    const currentMediaIds = activeScene.config.mediaIds || [];
    const isSelected = currentMediaIds.includes(mediaId);
    
    let newMediaIds;
    if (activeScene.type === "gallery") {
      newMediaIds = isSelected 
        ? currentMediaIds.filter((id: string) => id !== mediaId)
        : [...currentMediaIds, mediaId];
    } else {
      newMediaIds = [mediaId];
    }
    
    updateSceneConfig(activeSceneId, { mediaIds: newMediaIds });
  };

  const isMediaSelected = (mediaId: string) => {
    return activeScene?.config?.mediaIds?.includes(mediaId);
  };

  // Music Logic
  const toggleMusic = async (song: any) => {
    if (!activeScene) return;
    const currentYtId = activeScene.config.ytMusicId;
    const isSelected = currentYtId === song.videoId;
    
    const updates = isSelected 
      ? { ytMusicId: null, musicMetadata: null, musicUrl: null }
      : { 
          ytMusicId: song.videoId, 
          musicMetadata: {
            title: song.title || "Unknown Title",
            artist: song.author || song.artist || "Unknown Artist",
            thumbnail: song.thumbnail || "",
            duration: song.duration || ""
          },
          musicUrl: `https://www.youtube.com/watch?v=${song.videoId}` 
        };
        
    updateSceneConfig(activeSceneId, updates);
  };

  const setGlobalMusic = async (song: any) => {
    const updates = { 
      ytMusicId: song.videoId, 
      musicMetadata: {
        title: song.title || "Unknown Title",
        artist: song.author || song.artist || "Unknown Artist",
        thumbnail: song.thumbnail || "",
        duration: song.duration || ""
      },
      musicUrl: `https://www.youtube.com/watch?v=${song.videoId}` 
    };
        
    if (activeScene && activeScene.id !== "splash" && activeScene.config.useGlobalMusic === false) {
      updateSceneConfig(activeSceneId, updates);
    } else {
      await onSave({
        styleConfig: { ...style, ...updates }
      });
    }
    
    setIsSettingGlobalMusic(false);
    setShowSearchResults(false);
    setYtSearchQuery("");
  };

  // Thumbnail Management
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !auth.currentUser) return;

    if (thumbnailMode === "upload") {
      setUploadingThumbnail(true);
      try {
        const file = files[0];
        const optimized = await optimizeImage(file, 800, 0.7);
        const path = `users/${auth.currentUser.uid}/moments/${draftId}/cover-${Date.now()}.webp`;
        const downloadURL = await uploadFile(optimized, path);
        await onSave({ imageUrl: downloadURL });
      } catch (err) {
        console.error("Cover upload error:", err);
      } finally {
        setUploadingThumbnail(false);
      }
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    const currentMedia = momentData?.media || [];
    const remainingSlots = Math.max(0, maxAllowed - currentMedia.length);
    const filesToUpload = Array.from(files).slice(0, remainingSlots);

    const newMediaItems: any[] = [];

    for (const file of filesToUpload) {
      const tempId = Math.random().toString(36).substr(2, 9);
      const path = `users/${auth.currentUser.uid}/moments/${draftId}/${tempId}-${file.name}`;
      
      setUploadingFiles(prev => ({ ...prev, [tempId]: 0 }));

      try {
        const downloadURL = await uploadFile(file, path, (progress) => {
          setUploadingFiles(prev => ({ ...prev, [tempId]: Math.round(progress) }));
        });

        const newMediaItem = {
          id: tempId,
          type: file.type.startsWith("video/") ? "video" : "image",
          url: downloadURL,
          name: file.name,
          uploadedAt: new Date().toISOString()
        };

        newMediaItems.push(newMediaItem);
      } catch (error) {
        console.error("Upload failed:", error);
      } finally {
        setUploadingFiles(prev => {
          const newState = { ...prev };
          delete newState[tempId];
          return newState;
        });
      }
    }

    if (newMediaItems.length > 0) {
      await onSave({
        media: [...(momentData?.media || []), ...newMediaItems]
      });
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSetThumbnail = async (media: any) => {
    setIsProcessingThumbnail(media.id);
    try {
      await onSave({ imageUrl: media.url });
    } catch (err) {
      console.error("Error setting thumbnail:", err);
    } finally {
      setIsProcessingThumbnail(null);
    }
  };

  const handleYTSearch = useCallback(async (query: string) => {
    if (!query.trim()) return;
    try {
      setIsSearching(true);
      const res = await fetch(`/api/yt-music/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setYtResults(data.songs || []);
      setShowSearchResults(true);
    } catch (err) {
      console.error("YouTube search error:", err);
    } finally {
      setIsSearching(false);
    }
  }, []);

  useEffect(() => {
    if (debouncedSearchQuery) {
      handleYTSearch(debouncedSearchQuery);
    } else {
      setYtResults([]);
      setShowSearchResults(false);
    }
  }, [debouncedSearchQuery, handleYTSearch]);

  const onSaveTheme = async (themeId: string) => {
    if (!activeSceneId) return;
    updateSceneConfig(activeSceneId, { themeId, useGlobalTheme: false });
  };

  // Preview Mock - unified via shared utility
  const previewMoment = useMemo(() => prepareMomentForEngine({
    ...momentData,
    styleConfig: { 
      ...(momentData?.styleConfig || {}),
      scenes 
    }
  }), [momentData, scenes]);

  return (
    <div className="flex-1 w-full flex flex-col h-full overflow-hidden">
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Sidebar: Timeline */}
        <div className="w-64 border-r border-border bg-[#fafafa] dark:bg-black/20 flex flex-col shrink-0 overflow-y-auto">
          {/* Device Preview Toggle */}
          <div className="p-4 border-b border-border">
            <h2 className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-2 flex items-center gap-2">
              <Monitor size={12} />
              Preview Mode
            </h2>
            <div className="flex p-1 bg-black/5 dark:bg-white/5 rounded-lg">
              <button
                onClick={() => setPreviewDevice("mobile")}
                className={cn(
                  "flex-1 flex justify-center items-center py-1.5 text-[10px] font-bold rounded-md transition-all",
                  previewDevice === "mobile" ? "bg-white dark:bg-white/10 shadow-sm text-primary" : "text-text-muted hover:text-text-main"
                )}
              >
                <Smartphone size={14} className="mr-1" /> Mobile
              </button>
              <button
                onClick={() => setPreviewDevice("desktop")}
                className={cn(
                  "flex-1 flex justify-center items-center py-1.5 text-[10px] font-bold rounded-md transition-all",
                  previewDevice === "desktop" ? "bg-white dark:bg-white/10 shadow-sm text-primary" : "text-text-muted hover:text-text-main"
                )}
              >
                <Monitor size={14} className="mr-1" /> Desktop
              </button>
            </div>
          </div>

          <div className="p-4 flex items-center justify-between">
            <h2 className="text-[10px] font-black uppercase tracking-widest text-text-muted">Screens Sequence</h2>
            <button 
              onClick={addScene}
              className="p-1 hover:bg-primary/10 text-primary transition-colors rounded"
            >
              <Plus size={16} />
            </button>
          </div>
          
          <div className="flex flex-col gap-1 p-2">
            {/* 1. Splash Screen (Compulsory) */}
            <div
              onClick={() => setActiveSceneId("splash")}
              className={cn(
                "group flex items-center gap-3 p-3 rounded-lg text-left transition-all cursor-pointer",
                activeSceneId === "splash" 
                  ? "bg-white dark:bg-white/10 shadow-sm border border-border ring-1 ring-primary/20" 
                  : "hover:bg-black/[0.02]"
              )}
            >
              <div className="size-8 rounded-md bg-primary/10 text-primary flex items-center justify-center font-black text-xs">0</div>
              <div className="flex-1 overflow-hidden">
                <p className="text-xs font-bold text-text-main truncate">Splash Screen</p>
                <p className="text-[10px] text-text-muted font-bold truncate">Compulsory First Screen</p>
              </div>
            </div>

            {scenes.map((scene, index) => (
              <div
                key={scene.id}
                onClick={() => setActiveSceneId(scene.id)}
                className={cn(
                  "group flex items-center gap-3 p-3 rounded-lg text-left transition-all cursor-pointer",
                  activeSceneId === scene.id 
                    ? "bg-white dark:bg-white/10 shadow-sm border border-border ring-1 ring-primary/20" 
                    : "hover:bg-black/[0.02]"
                )}
              >
                <div className="size-8 rounded-md bg-primary/10 text-primary flex items-center justify-center font-black text-xs">
                  {index + 1}
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className="text-xs font-bold text-text-main truncate capitalize">{scene.type}</p>
                  <p className="text-[10px] text-text-muted font-bold truncate">Custom Screen</p>
                </div>
                {scenes.length > 1 && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); deleteScene(scene.id); }}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-500 transition-all"
                  >
                    <Trash2 size={12} />
                  </button>
                )}
              </div>
            ))}

            {/* 3. Final Screen (Always shown) */}
            <div
              onClick={() => setActiveSceneId("branding")}
              className={cn(
                "group flex items-center gap-3 p-3 rounded-lg text-left transition-all cursor-pointer",
                activeSceneId === "branding" 
                  ? "bg-white dark:bg-white/10 shadow-sm border border-border ring-1 ring-primary/20" 
                  : "hover:bg-black/[0.02]"
              )}
            >
              <div className="size-8 rounded-md bg-primary/10 text-primary flex items-center justify-center font-black text-xs">{scenes.length + 1}</div>
              <div className="flex-1 overflow-hidden">
                <p className="text-xs font-bold text-text-main truncate">Final Screen</p>
                <p className="text-[10px] text-text-muted font-bold truncate">Compulsory End Screen</p>
              </div>
            </div>

            <div
              onClick={addScene}
              className="group flex items-center gap-3 p-3 rounded-lg border border-dashed border-border hover:border-primary/50 hover:bg-primary/5 text-left transition-all cursor-pointer text-text-muted hover:text-primary mt-1"
            >
              <div className="size-8 rounded-md bg-black/5 dark:bg-white/5 group-hover:bg-primary/10 flex items-center justify-center transition-colors">
                <Plus size={16} />
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="text-xs font-bold truncate">Add Screen</p>
                <p className="text-[10px] text-text-muted truncate">Create a new scene</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Stage */}
        <div className="flex-1 bg-[#f5f5f7] dark:bg-black/40 overflow-hidden relative">
          <div className="h-full flex flex-col lg:flex-row overflow-hidden">
            <div className="flex-1 flex flex-col items-center justify-center p-8 relative">
              <div 
                className={cn(
                  "bg-[#fafafa] dark:bg-black/5 border border-border shadow-2xl flex flex-col overflow-hidden relative transition-all duration-500 ease-in-out",
                  previewDevice === "mobile" 
                    ? "aspect-[9/16] h-full max-h-[700px] w-full max-w-[400px] rounded-[32px]" 
                    : "h-full w-full rounded-lg"
                )}
              >
                <RevealEngine 
                  moment={previewMoment} 
                  isPreview={true} 
                  activeSceneIndex={
                    activeSceneId === "splash" 
                      ? -1 
                      : activeSceneId === "branding" 
                        ? scenes.length 
                        : scenes.findIndex(s => s.id === activeSceneId)
                  } 
                />
              </div>
            </div>

            {/* Right Sidebar: Properties */}
            <div className="w-80 border-l border-border bg-surface shrink-0 p-6 overflow-y-auto scrollbar-none">
              <div className="flex flex-col gap-8">
                <AnimatePresence mode="wait">
                  {/* CASE 1: SPLASH SCREEN SETTINGS */}
                  {activeSceneId === "splash" && (
                    <motion.div
                      key="splash-props"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-8"
                    >
                      {/* Splash Theme */}
                      <section className="space-y-4">
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-text-muted flex items-center gap-2">
                          <Palette size={12} /> Splash Theme
                        </h3>
                        <Select
                          options={[
                            { id: "birthday-classic", title: "Birthday Classic", icon: Gift },
                            { id: "anniversary-gold", title: "Anniversary Gold", icon: Award },
                            { id: "surprise-neon", title: "Surprise Neon", icon: Sparkles },
                            { id: "elegant-noir", title: "Elegant Noir", icon: Moon },
                            { id: "romantic-rose", title: "Romantic Rose", icon: Heart },
                            { id: "party-popper", title: "Party Popper 🎊", icon: Sparkles },
                            { id: "golden-gala", title: "Golden Gala ✨", icon: Sparkles },
                            { id: "midnight-aurora", title: "Midnight Aurora 🌌", icon: Moon },
                          ]}
                          value={style.themeId || "birthday-classic"}
                          onChange={(val) => onSave({ styleConfig: { ...style, themeId: val } })}
                        />
                      </section>

                      {/* Splash Cover (Integrated Library) */}
                      <section className="space-y-4">
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-text-muted flex items-center gap-2">
                          <ImageIcon size={12} /> Splash Cover
                        </h3>
                        <div className="flex flex-col gap-3">
                           {momentData?.imageUrl ? (
                             <div className="relative group aspect-video rounded-lg overflow-hidden border border-border bg-black/5">
                               <img src={momentData.imageUrl} className="w-full h-full object-cover" />
                               <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                 <p className="text-[8px] font-black text-white uppercase tracking-widest">Active Cover</p>
                               </div>
                             </div>
                           ) : (
                             <div className="aspect-video rounded-lg border border-dashed border-border bg-black/[0.02] flex items-center justify-center text-center p-4">
                               <p className="text-[9px] font-bold text-text-muted leading-relaxed uppercase">No cover image set.<br/>Recipients see this first.</p>
                             </div>
                           )}
                           
                           <div className="flex gap-2">
                             <input 
                               type="file" 
                               id="splash-upload" 
                               className="hidden" 
                               accept="image/*"
                               onChange={(e) => {
                                 const file = e.target.files?.[0];
                                 if (file) handleFileUpload(file);
                               }}
                             />
                             <button 
                               onClick={() => document.getElementById('splash-upload')?.click()}
                               className="flex-1 py-3 bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-primary/20 transition-all border border-primary/20"
                             >
                                <div className="flex items-center justify-center gap-2">
                                  {uploadingThumbnail ? <Loader2 size={12} className="animate-spin" /> : <UploadCloud size={12} />}
                                  Upload
                                </div>
                             </button>
                             <button 
                               onClick={() => setThumbnailMode(thumbnailMode === 'library' ? 'upload' : 'library')}
                               className={cn(
                                 "flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all border",
                                 thumbnailMode === 'library' ? "bg-primary text-white border-primary shadow-lg shadow-primary/20" : "bg-black/5 text-text-muted border-border"
                               )}
                             >Library</button>
                           </div>

                           {thumbnailMode === 'library' && (
                             <div className="grid grid-cols-3 gap-2 p-2 bg-black/[0.02] rounded-lg border border-border animate-in fade-in slide-in-from-top-2">
                               {momentData?.media?.map((m: any) => (
                                 <button
                                   key={m.id}
                                   onClick={() => handleSetThumbnail(m)}
                                   className={cn(
                                     "aspect-square rounded-lg overflow-hidden border-2 transition-all",
                                     momentData.imageUrl === m.url ? "border-primary scale-95" : "border-transparent opacity-60 hover:opacity-100"
                                   )}
                                 >
                                    <img src={m.url} className="w-full h-full object-cover" />
                                 </button>
                               ))}
                               {(!momentData?.media || momentData.media.length === 0) && (
                                 <div className="col-span-3 text-center py-4 text-text-muted text-[8px] font-black uppercase italic">Library is empty</div>
                               )}
                             </div>
                           )}
                        </div>
                      </section>

                      {/* Splash Audio */}
                      <section className="space-y-4">
                         <h3 className="text-[10px] font-black uppercase tracking-widest text-text-muted flex items-center gap-2">
                          <Music2 size={12} /> Splash Song
                        </h3>
                        
                        <div className="space-y-3">
                          {style.musicMetadata ? (
                             <div className="space-y-3">
                               <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 flex items-center gap-3 group relative">
                                 <img src={style.musicMetadata.thumbnail} className="size-10 rounded-lg object-cover" />
                                 <div className="flex-1 min-w-0">
                                   <p className="text-[10px] font-black truncate">{style.musicMetadata.title}</p>
                                   <p className="text-[8px] text-primary font-black uppercase tracking-widest">
                                     Global Master Music
                                   </p>
                                 </div>
                                 <button 
                                   onClick={() => {
                                     setIsSettingGlobalMusic(true);
                                     setYtSearchQuery("");
                                   }} 
                                   className="opacity-0 group-hover:opacity-100 p-2 hover:bg-primary/10 rounded-lg transition-all text-primary"
                                 >
                                   <RefreshCcw size={12} />
                                 </button>
                               </div>

                             </div>
                          ) : (
                            <button 
                              onClick={() => {
                                setIsSettingGlobalMusic(true);
                                setYtSearchQuery("");
                              }}
                              className="w-full py-4 border border-dashed border-border rounded-lg bg-black/[0.01] hover:bg-primary/5 hover:border-primary/50 text-[10px] font-black uppercase tracking-widest text-text-muted transition-all"
                            >
                               Set Themesong
                            </button>
                          )}

                          {isSettingGlobalMusic && (
                            <div className="space-y-3 pt-2 animate-in fade-in slide-in-from-top-2">
                               <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={12} />
                                <input 
                                  autoFocus
                                  type="text" 
                                  placeholder="Search themesong..."
                                  className="w-full h-10 pl-9 pr-3 rounded-lg border border-border bg-white text-[10px] font-bold outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                                  value={ytSearchQuery}
                                  onChange={(e) => setYtSearchQuery(e.target.value)}
                                />
                                {isSearching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-primary" size={12} />}
                              </div>
                              {showSearchResults && ytResults.length > 0 && (
                                <div className="bg-white border border-border rounded-lg overflow-hidden max-h-48 overflow-y-auto divide-y divide-border shadow-soft">
                                  {ytResults.map((song) => (
                                    <div key={song.videoId} onClick={() => {
                                      setGlobalMusic(song);
                                      setIsSettingGlobalMusic(false);
                                    }} className="p-2 flex items-center gap-2 cursor-pointer hover:bg-primary/5 transition-colors">
                                      <img src={song.thumbnail} className="size-8 rounded-lg object-cover" />
                                      <div className="flex-1 min-w-0">
                                        <p className="text-[9px] font-black truncate">{song.title}</p>
                                        <p className="text-[8px] text-text-muted font-bold truncate">{song.author}</p>
                                      </div>
                                      <button onClick={(e) => { e.stopPropagation(); setPlayingId(playingId === song.videoId ? null : song.videoId); }} className="size-6 bg-primary/10 text-primary rounded-lg flex items-center justify-center">
                                        {playingId === song.videoId ? <Pause size={10} fill="currentColor" /> : <Play size={10} fill="currentColor" className="ml-0.5" />}
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </section>
                    </motion.div>
                  )}

                  {/* CASE 2: BRANDING / FINAL SCREEN SETTINGS */}
                  {activeSceneId === "branding" && (
                    <motion.div
                      key="branding-props"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-8"
                    >
                      {!showBrandingFinal ? (
                        <div className="space-y-6">
                           <div className="p-6 rounded-2xl bg-primary/5 border border-primary/20 space-y-4">
                              <div className="size-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                                <Sparkles size={24} />
                              </div>
                              <div className="space-y-2">
                                <h3 className="text-xs font-black uppercase text-primary tracking-widest">Reaction Collector</h3>
                                <p className="text-[10px] font-medium text-text-muted leading-relaxed">
                                  Your branding removal is active. Instead of seeing our logo, the recipient will be invited to send you a private reaction or note once they finish viewing.
                                </p>
                              </div>
                           </div>
                           
                           <div className="p-4 rounded-lg border border-dashed border-border bg-black/[0.02]">
                              <p className="text-[8px] font-black uppercase tracking-widest text-text-muted text-center italic leading-relaxed">
                                Heartfelt feedback starts here.
                              </p>
                           </div>
                        </div>
                      ) : (
                        <div className="space-y-6">
                           <div className="p-6 rounded-lg bg-black/[0.02] border border-border space-y-4">
                              <div className="size-12 bg-black/5 rounded-2xl flex items-center justify-center text-text-muted">
                                <Gift size={24} />
                              </div>
                              <div className="space-y-2">
                                <h3 className="text-xs font-black uppercase text-text-main tracking-widest">Surpriseal Branding</h3>
                                <p className="text-[10px] font-medium text-text-muted leading-relaxed">
                                  The recipient will see a beautiful "Created with Surpriseal" screen to conclude their experience.
                                </p>
                              </div>
                           </div>

                           <button 
                             onClick={() => toggleAddon("removeBranding")}
                             disabled={momentData?.status === "Published" && momentData?.paidAddons?.includes("removeBranding")}
                             className={cn(
                               "w-full py-4 rounded-lg font-black uppercase tracking-[0.2em] text-[10px] shadow-2xl transition-all",
                               momentData?.status === "Published" && momentData?.paidAddons?.includes("removeBranding")
                                 ? "text-white bg-green-500 cursor-not-allowed shadow-green-500/40"
                                 : "bg-primary text-white shadow-primary/40 hover:scale-105 active:scale-95"
                             )}
                           >
                             {momentData?.status === "Published" && momentData?.paidAddons?.includes("removeBranding") ? (
                               <span className="flex justify-center items-center gap-2"><CheckCircle2 size={14} /> Enabled</span>
                             ) : (
                               `Remove Branding for ${formatPrice(ADDONS.find(a => a.id === "removeBranding")?.price[currency] || 0, currency)}`
                             )}
                           </button>
                        </div>
                      )}

                      {!showBrandingFinal && momentData?.plan !== "premium" && (
                        <div className="pt-6 border-t border-border animate-in fade-in slide-in-from-top-2">
                          <button 
                            onClick={() => toggleAddon("removeBranding")}
                            disabled={momentData?.status === "Published" && momentData?.paidAddons?.includes("removeBranding")}
                            className={cn(
                              "w-full py-4 border-2 rounded-2xl flex items-center justify-center gap-2 transition-all group",
                              momentData?.status === "Published" && momentData?.paidAddons?.includes("removeBranding")
                                ? "bg-primary/5 border-border text-text-muted cursor-not-allowed"
                                : "border-red-500/20 hover:border-red-500 hover:bg-red-50/50 text-red-500"
                            )}
                          >
                            {momentData?.status === "Published" && momentData?.paidAddons?.includes("removeBranding") ? (
                              <>
                                <CheckCircle2 size={16} className="text-green-500" />
                                <div className="text-left leading-none">
                                  <p className="text-[10px] font-black uppercase tracking-widest text-text-main">No Branding</p>
                                  <p className="text-[8px] font-bold opacity-60 uppercase tracking-tight">Enabled & Paid For</p>
                                </div>
                              </>
                            ) : (
                              <>
                                <Trash2 size={16} className="text-red-500 group-hover:-rotate-12 transition-transform" />
                                <div className="text-left leading-none">
                                  <p className="text-[10px] font-black uppercase tracking-widest">Restore Branding</p>
                                  <p className="text-[8px] font-bold opacity-60 uppercase tracking-tight">Remove this add-on</p>
                                </div>
                              </>
                            )}
                          </button>
                        </div>
                      )}

                      {!showBrandingFinal && (
                         <section className="space-y-4 pt-6 border-t border-border animate-in fade-in slide-in-from-top-2">
                           <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                 <Heart size={14} className="text-pink-500" />
                                 <h4 className="text-[10px] font-black uppercase tracking-widest text-text-main">Reaction Collector</h4>
                              </div>
                              <button 
                                 onClick={() => updateStyle({ showReactions: !style.showReactions })}
                                 className={cn(
                                   "px-2 py-1 rounded-full text-[8px] font-black uppercase tracking-widest transition-all",
                                   style.showReactions 
                                     ? "bg-pink-500 text-white" 
                                     : "bg-pink-50 text-pink-400 border border-pink-100"
                                 )}
                              >
                                {style.showReactions ? "Enabled" : "Disabled"}
                              </button>
                           </div>
                           <p className="text-[10px] font-medium text-text-muted leading-relaxed">
                             When enabled, we'll add a reaction bar to the final screen.
                           </p>
                         </section>
                       )}

                     </motion.div>
                   )}

                   {/* CASE 3: CUSTOM SCREEN SETTINGS */}
                   {activeScene && (
                     <motion.div
                       key="custom-props"
                       initial={{ opacity: 0, x: 20 }}
                       animate={{ opacity: 1, x: 0 }}
                       exit={{ opacity: 0, x: -20 }}
                       className="space-y-8"
                     >
                      <div className="space-y-8 pb-32">
                        {/* Theme Override */}
                        <section className="space-y-4">
                           <h3 className="text-[10px] font-black uppercase tracking-widest text-text-muted flex items-center gap-2">
                            <Palette size={12} /> Theme Style
                          </h3>
                          <div className="flex p-1 bg-black/5 dark:bg-white/5 rounded-lg">
                            <button
                              onClick={() => updateSceneConfig(activeSceneId, { useGlobalTheme: true })}
                              className={cn("flex-1 py-1.5 text-[10px] font-bold rounded-md transition-all", activeScene?.config?.useGlobalTheme !== false ? "bg-white shadow-sm text-primary" : "text-text-muted")}
                            >Global</button>
                            <button
                              onClick={() => updateSceneConfig(activeSceneId, { useGlobalTheme: false })}
                              className={cn("flex-1 py-1.5 text-[10px] font-bold rounded-md transition-all", activeScene?.config?.useGlobalTheme === false ? "bg-white shadow-sm text-primary" : "text-text-muted")}
                            >Custom</button>
                          </div>
                          {activeScene?.config?.useGlobalTheme === false && (
                            <Select
                              options={[
                                { id: "birthday-classic", title: "Birthday Classic", icon: Gift },
                                { id: "anniversary-gold", title: "Anniversary Gold", icon: Award },
                                { id: "surprise-neon", title: "Surprise Neon", icon: Sparkles },
                                { id: "elegant-noir", title: "Elegant Noir", icon: Moon },
                                { id: "romantic-rose", title: "Romantic Rose", icon: Heart },
                                { id: "party-popper", title: "Party Popper 🎊", icon: Sparkles },
                                { id: "golden-gala", title: "Golden Gala ✨", icon: Sparkles },
                                { id: "midnight-aurora", title: "Midnight Aurora 🌌", icon: Moon },
                              ]}
                              value={activeScene.config.themeId || style.themeId || "birthday-classic"}
                              onChange={onSaveTheme}
                            />
                          )}
                        </section>

                        {/* Screen Type Selector */}
                        <section className="space-y-4 pt-4 border-t border-border">
                          <h3 className="text-[10px] font-black uppercase tracking-widest text-text-muted flex items-center gap-2">
                            <Laptop size={12} /> Screen Type
                          </h3>
                          <Select
                            options={[
                              { id: "gallery", title: "Memory Gallery", icon: Layout },
                              { id: "composition", title: "Message Scene", icon: Settings },
                            ]}
                            value={activeScene?.type || "composition"}
                            onChange={(value) => changeSceneType(activeSceneId, value as Scene["type"])}
                          />
                        </section>

                        {/* Screen Configuration */}
                        <section className="space-y-4 pt-4 border-t border-border">
                          <h3 className="text-[10px] font-black uppercase tracking-widest text-text-muted flex items-center gap-2">
                            <Settings size={12} /> Configuration
                          </h3>

                          {activeScene.type === "composition" && (
                            <div className="space-y-4">
                              <div className="space-y-2">
                                <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">Message Paper Style</p>
                                <Select
                                  value={activeScene.config.paperStyle || "glass"}
                                  onChange={(val: string) => updateSceneConfig(activeSceneId, { paperStyle: val })}
                                  options={[
                                    { id: "none", title: "Direct (No Paper)", icon: ImageIcon },
                                    { id: "glass", title: "Modern Glass", icon: Layers },
                                    { id: "midnight", title: "Midnight Silk", icon: Moon },
                                    { id: "parchment", title: "Vintage Parchment", icon: Scroll },
                                    { id: "golden", title: "Royal Gold", icon: Award },
                                    { id: "aurora", title: "Aurora Flow", icon: Sparkles },
                                    { id: "typewriter", title: "Typewriter Page", icon: Laptop },
                                    { id: "velvet", title: "Red Velvet", icon: Heart },
                                  ]}
                                />
                              </div>
                              <RichTextEditor 
                                initialValue={activeScene.config.text || ""}
                                onChange={(html) => updateSceneConfig(activeSceneId, { text: html })}
                                placeholder="Type your message here..."
                                onExpand={() => setIsEditorModalOpen(true)}
                                onOpenMediaLibrary={() => {
                                  mediaLibraryRef.current?.scrollIntoView({ behavior: 'smooth' });
                                }}
                              />
                            </div>
                          )}

                           {activeScene.type === "gallery" && (
                              <div className="space-y-4">
                                <Select 
                                  value={activeScene.config.layout || "grid"}
                                  onChange={(val: string) => updateSceneConfig(activeSceneId, { layout: val })}
                                  options={[
                                    { id: "grid", title: "Masonry Grid", icon: Layout },
                                    { id: "stack", title: "Card Stack", icon: Layers },
                                    { id: "slideshow", title: "Slideshow", icon: Play }
                                  ]}
                                />
                                
                                <div className="space-y-3">
                                   <div className="flex items-center justify-between">
                                     <label className="text-[9px] font-black uppercase tracking-widest text-text-muted">Selected Media</label>
                                     <span className="text-[9px] font-black text-primary">{(activeScene.config.mediaIds || []).length} items</span>
                                   </div>
                                   <div className="grid grid-cols-4 gap-2">
                                      {momentData?.media?.filter((m: any) => isMediaSelected(m.id)).map((m: any) => (
                                        <div key={m.id} className="aspect-square rounded-lg overflow-hidden border border-primary relative group">
                                           <img src={m.url} className="w-full h-full object-cover" />
                                           <button 
                                             onClick={() => toggleMedia(m.id)}
                                             className="absolute inset-0 bg-red-500/80 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity"
                                           >
                                             <Trash2 size={12} />
                                           </button>
                                        </div>
                                      ))}
                                      <button 
                                        onClick={() => mediaLibraryRef.current?.scrollIntoView({ behavior: 'smooth' })}
                                        className="aspect-square rounded-lg border border-dashed border-border bg-black/[0.01] hover:bg-primary/5 hover:border-primary/50 flex items-center justify-center text-text-muted transition-all"
                                      >
                                         <Plus size={14} />
                                      </button>
                                   </div>
                                </div>
                              </div>
                           )}

                           {/* Screen Music Override for Custom Scenes */}
                           <div className="space-y-4 pt-4 border-t border-border">
                             <h3 className="text-[10px] font-black uppercase tracking-widest text-text-muted flex items-center gap-2">
                                <Music size={12} /> Screen Music
                             </h3>
                             <div className="flex p-1 bg-black/5 dark:bg-white/5 rounded-lg">
                               <button
                                 onClick={() => updateSceneConfig(activeSceneId, { useGlobalMusic: true })}
                                 className={cn("flex-1 py-1.5 text-[10px] font-bold rounded-md transition-all", activeScene.config.useGlobalMusic !== false ? "bg-white shadow-sm text-primary" : "text-text-muted")}
                               >Global</button>
                               <button
                                 onClick={() => updateSceneConfig(activeSceneId, { useGlobalMusic: false })}
                                 className={cn("flex-1 py-1.5 text-[10px] font-bold rounded-md transition-all", activeScene.config.useGlobalMusic === false ? "bg-white shadow-sm text-primary" : "text-text-muted")}
                               >Custom</button>
                             </div>
                             
                             {activeScene.config.useGlobalMusic === false && (
                               <div className="space-y-3">
                                  {activeScene.config.musicMetadata ? (
                                    <div className="space-y-3">
                                      <div className="p-2.5 rounded-lg bg-primary/5 border border-primary/20 flex items-center gap-2.5 group relative">
                                         <img src={activeScene.config.musicMetadata.thumbnail} className="size-8 rounded-md object-cover" />
                                         <div className="flex-1 min-w-0">
                                           <p className="text-[9px] font-black truncate">{activeScene.config.musicMetadata.title}</p>
                                           <p className="text-[8px] text-text-muted font-bold truncate">Custom Track</p>
                                         </div>
                                         <button 
                                           onClick={() => {
                                             setIsSettingGlobalMusic(true);
                                             setYtSearchQuery("");
                                           }}
                                           className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-primary/10 rounded-md transition-all text-primary"
                                         >
                                           <RefreshCcw size={10} />
                                         </button>
                                      </div>
                                     </div>
                                  ) : (
                                    <button 
                                      onClick={() => {
                                        setIsSettingGlobalMusic(true);
                                        setYtSearchQuery("");
                                      }}
                                      className="w-full py-3 border border-dashed border-border rounded-lg text-[9px] font-black uppercase tracking-widest text-text-muted hover:bg-primary/5 transition-all"
                                    >Pick Screen Song</button>
                                  )}
                               </div>
                             )}
                           </div>

                        </section>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
                  
                  {/* Shared Media Library (Manage Assets) */}
                  {activeSceneId !== "splash" && activeSceneId !== "branding" && (
                    <section ref={mediaLibraryRef} className="mt-8 pt-8 border-t border-border space-y-6 pb-20">
                      <header className="flex items-center justify-between">
                        <div className="space-y-1">
                          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-text-main flex items-center gap-2">
                            <ImageIcon size={12} className="text-primary" />
                            Asset Library
                          </h3>
                          <p className="text-[8px] font-bold text-text-muted uppercase tracking-widest">Manage Your Memories</p>
                        </div>
                        <button 
                           onClick={() => {
                             setThumbnailMode('library');
                             fileInputRef.current?.click();
                           }}
                           className="size-8 rounded-lg bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
                        >
                          <Plus size={16} />
                        </button>
                      </header>

                      <div className="grid grid-cols-3 gap-2">
                        {momentData?.media?.map((m: any) => (
                          <div 
                           key={m.id} 
                           className={cn(
                             "aspect-square rounded-lg overflow-hidden border-2 transition-all relative group cursor-pointer",
                             isMediaSelected(m.id) ? "border-primary shadow-md scale-95" : "border-transparent bg-black/5 hover:border-primary/30"
                           )}
                           onClick={() => toggleMedia(m.id)}
                          >
                            <img src={m.url} className="w-full h-full object-cover" />
                            
                            {/* Selection Overlay */}
                            <div className={cn(
                              "absolute inset-0 flex items-center justify-center transition-opacity",
                              isMediaSelected(m.id) ? "bg-primary/20 opacity-100" : "bg-black/40 opacity-0 group-hover:opacity-100"
                            )}>
                               {isMediaSelected(m.id) ? (
                                 <div className="size-6 rounded-full bg-white text-primary flex items-center justify-center shadow-sm">
                                   <Check size={14} />
                                 </div>
                               ) : (
                                 <p className="text-[8px] font-black text-white uppercase tracking-widest">Select</p>
                               )}
                            </div>

                            {/* Action Hover */}
                            <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                               <button 
                                 onClick={(e) => {
                                   e.stopPropagation();
                                   handleSetThumbnail(m);
                                 }}
                                 className={cn(
                                   "size-5 rounded-md flex items-center justify-center transition-all",
                                   momentData.imageUrl === m.url ? "bg-orange-500 text-white" : "bg-white/90 text-text-muted hover:text-orange-500"
                                 )}
                                 title="Set as Cover"
                                >
                                 <Sparkles size={10} />
                               </button>
                            </div>
                          </div>
                        ))}
                        
                        {Object.entries(uploadingFiles).map(([id, progress]) => (
                          <div key={id} className="aspect-square rounded-lg border border-dashed border-primary/30 bg-primary/5 flex flex-col items-center justify-center gap-1">
                             <Loader2 size={14} className="animate-spin text-primary" />
                             <span className="text-[8px] font-black text-primary">{progress}%</span>
                          </div>
                        ))}

                        {(!momentData?.media || momentData.media.length === 0) && (
                          <div className="col-span-3 py-10 flex flex-col items-center justify-center gap-2 border border-dashed border-border rounded-2xl bg-black/[0.01]">
                             <div className="size-10 rounded-full bg-black/5 flex items-center justify-center text-text-muted/30">
                               <ImageIcon size={20} />
                             </div>
                             <p className="text-[9px] font-bold text-text-muted uppercase tracking-widest">Library is empty</p>
                          </div>
                        )}
                      </div>

                     {momentData?.media?.length >= maxAllowed && (
                        <div className="p-4 rounded-2xl bg-orange-50 dark:bg-orange-500/10 border border-orange-100 dark:border-orange-500/20 space-y-3">
                          <div className="flex items-center gap-2 text-orange-600">
                            <Lock size={14} />
                            <h4 className="text-[10px] font-black uppercase tracking-widest">Storage Limit Reached</h4>
                          </div>
                          <p className="text-[9px] font-medium text-orange-700/70 leading-relaxed">
                            You've used all {maxAllowed} slots. Upgrade to Plus for unlimited memories and 4K uploads.
                          </p>
                          <button className="w-full py-2 bg-orange-500 text-white text-[9px] font-black uppercase tracking-widest rounded-lg transition-transform active:scale-95 shadow-lg shadow-orange-500/30">
                            Upgrade Now
                          </button>
                        </div>
                      )}
                    </section>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Audio Player */}
          {playingId && (
            <iframe className="hidden" src={`https://www.youtube.com/embed/${playingId}?autoplay=1`} allow="autoplay" />
          )}

          {/* Full Screen Editor Modal */}
          <AnimatePresence>
            {isEditorModalOpen && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-20 bg-black/60 backdrop-blur-md"
              >
                <motion.div 
                  initial={{ scale: 0.9, y: 20 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0.9, y: 20 }}
                  className="w-full max-w-5xl h-full max-h-[90vh] bg-background border border-border rounded-3xl shadow-2xl overflow-hidden flex flex-col"
                >
                  <header className="p-6 border-b border-border flex items-center justify-between bg-surface/50">
                    <div className="flex items-center gap-3">
                      <div className="size-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                        <Settings size={20} />
                      </div>
                      <div>
                        <h2 className="text-lg font-black uppercase tracking-tight">Full Screen Editor</h2>
                        <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Write your heart out</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setIsEditorModalOpen(false)}
                      className="size-10 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 flex items-center justify-center text-text-muted transition-colors"
                    >
                      <X size={20} />
                    </button>
                  </header>

                  <div className="flex-1 flex overflow-hidden">
                    <div className="flex-1 overflow-hidden p-6 bg-surface/30">
                      <RichTextEditor 
                        ref={editorRef}
                        isModal={true}
                        initialValue={activeScene?.config.text || ""}
                        onChange={(html) => updateSceneConfig(activeSceneId, { text: html })}
                        placeholder="Type your heartfelt message here..."
                        onOpenMediaLibrary={() => {
                          setIsMediaPickerOpenInModal(!isMediaPickerOpenInModal);
                        }}
                        onExpand={() => setIsEditorModalOpen(false)}
                      />
                    </div>

                    <AnimatePresence>
                      {isMediaPickerOpenInModal && (
                        <motion.div 
                          initial={{ width: 0, opacity: 0 }}
                          animate={{ width: 320, opacity: 1 }}
                          exit={{ width: 0, opacity: 0 }}
                          className="border-l border-border bg-surface/50 h-full overflow-hidden flex flex-col"
                        >
                          <header className="p-4 border-b border-border flex items-center justify-between bg-surface/50">
                            <div className="flex items-center gap-2">
                              <h3 className="text-[10px] font-black uppercase tracking-widest text-text-muted">Insert Media</h3>
                              <button 
                                onClick={() => fileInputRef.current?.click()}
                                className="size-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center hover:bg-primary/20 transition-colors"
                                title="Upload New"
                              >
                                <Plus size={12} />
                              </button>
                            </div>
                            <button 
                              onClick={() => setIsMediaPickerOpenInModal(false)}
                              className="size-6 rounded-lg hover:bg-black/5 flex items-center justify-center transition-colors"
                            >
                              <X size={14} />
                            </button>
                          </header>
                          
                          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                            <div className="grid grid-cols-2 gap-2">
                               {momentData?.media?.map((m: any) => (
                                 <div 
                                   key={m.id} 
                                   onClick={() => {
                                     if (editorRef.current) {
                                       editorRef.current.insertImage(m.url);
                                     }
                                   }}
                                   className="aspect-square rounded-lg overflow-hidden border-2 border-transparent hover:border-primary cursor-pointer transition-all hover:scale-[1.02] shadow-sm relative group"
                                 >
                                   <img src={m.url} className="w-full h-full object-cover" />
                                   <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                     <Plus size={20} className="text-white drop-shadow-md" />
                                   </div>
                                 </div>
                               ))}
                            </div>
                            
                            {(!momentData?.media || momentData.media.length === 0) && (
                              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
                                 <div className="size-12 rounded-2xl bg-black/5 flex items-center justify-center text-text-muted/30">
                                    <ImageIcon size={24} />
                                 </div>
                                 <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">No media found</p>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <footer className="p-4 border-t border-border flex justify-end bg-surface/50">
                    <button 
                      onClick={() => setIsEditorModalOpen(false)}
                      className="px-8 py-3 bg-primary text-white text-xs font-black uppercase tracking-widest rounded-lg shadow-lg shadow-primary/20 active:scale-95 transition-all"
                    >
                      Done Editing
                    </button>
                  </footer>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    );
}
