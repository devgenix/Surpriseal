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
  MessageCircleHeart,
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
  onContinue: () => Promise<void>;
}

export default function RevealStudio({ draftId, onSave, onContinue }: RevealStudioProps) {
  const { momentData, setCanContinue, setOnSave, setOnContinue, setIsCinematic } = useCreation();
  
  const [scenes, setScenes] = useState<Scene[]>(
    momentData?.styleConfig?.scenes || DEFAULT_SCENES
  );
  const [activeSceneId, setActiveSceneId] = useState<string>("splash");
  const [previewDevice, setPreviewDevice] = useState<"mobile" | "desktop">("mobile");
  
  const [activeMobileMode, setActiveMobileMode] = useState<"edit" | "preview">("edit");
  const [isScenePickerOpen, setIsScenePickerOpen] = useState(false);
  
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
    
    // Safely disable Reaction Collector if removing Branding Removal
    if (!isAdding && addonId === "removeBranding" && momentData?.styleConfig) {
      await onSave({ 
        selectedAddons: newAddons, 
        totalPrice: newTotal,
        styleConfig: { ...momentData.styleConfig, showReactions: false }
      });
    } else {
      await onSave({ selectedAddons: newAddons, totalPrice: newTotal });
    }
  };

  // YouTube Music Search State
  const [ytSearchQuery, setYtSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(ytSearchQuery, 500);
  const [isSearching, setIsSearching] = useState(false);
  const [ytResults, setYtResults] = useState<any[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [isAudioLoading, setIsAudioLoading] = useState(false);

  const togglePlay = useCallback((id: string | null) => {
    if (playingId === id || id === null) {
      setPlayingId(null);
      setIsAudioLoading(false);
    } else {
      setPlayingId(id);
      setIsAudioLoading(true);
    }
  }, [playingId]);
  
  const [isProcessingThumbnail, setIsProcessingThumbnail] = useState<string | null>(null);
  const [uploadingFiles, setUploadingFiles] = useState<Record<string, number>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Collapsible sections state
  const [isMasterExpanded, setIsMasterExpanded] = useState(true);
  const [isScreenExpanded, setIsScreenExpanded] = useState(true);
  const [insertingToEditor, setInsertingToEditor] = useState(false);

  // Asset Deletion Modal State
  const [assetToDelete, setAssetToDelete] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [isEditorModalOpen, setIsEditorModalOpen] = useState(false);
  const [isMediaPickerOpenInModal, setIsMediaPickerOpenInModal] = useState(false);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [showMediaRemovalModal, setShowMediaRemovalModal] = useState(false);
  
  // Audio Loading Timeout
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (isAudioLoading) {
      timeout = setTimeout(() => {
        setIsAudioLoading(false);
      }, 5000); // 5s timeout safety
    }
    return () => clearTimeout(timeout);
  }, [isAudioLoading]);

  const editorRef = useRef<RichTextEditorRef>(null);
  const modalEditorRef = useRef<RichTextEditorRef>(null);
  const mediaLibraryRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCanContinue(scenes.length > 0);
  }, [scenes, setCanContinue]);

  const style = momentData?.styleConfig || {};
  const maxAllowed = getMediaLimit(momentData);
  const imageUrl = momentData?.imageUrl || "";
  const activeScene = scenes.find(s => s.id === activeSceneId);

  const handleUpdateScenes = (newScenes: Scene[]) => {
    setScenes(newScenes);
  };

  const forceSave = useCallback(async () => {
    try {
      await onSave({
        styleConfig: {
          ...momentData?.styleConfig,
          scenes: scenes
        }
      });
    } catch (err) {
      console.error("Manual save failed:", err);
    }
  }, [onSave, momentData?.styleConfig, scenes]);

  useEffect(() => {
    setOnSave(() => forceSave);
    setOnContinue(() => async () => {
      await forceSave();
      await onContinue();
    });
    return () => {
      setOnSave(null);
      setOnContinue(null);
    };
  }, [forceSave, onContinue, setOnSave, setOnContinue]);


  // Debounced auto-save for scenes
  const debouncedScenes = useDebounce(scenes, 1000);
  const isFirstRender = useRef(true);
  const lastSavedScenesRef = useRef<string>("");

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    const currentScenesStr = JSON.stringify(debouncedScenes);
    if (lastSavedScenesRef.current === currentScenesStr) return;

    const saveUpdatedScenes = async () => {
      try {
        lastSavedScenesRef.current = currentScenesStr;
        await onSave({
          styleConfig: {
            ...momentData?.styleConfig,
            scenes: debouncedScenes
          }
        });
      } catch (err) {
        console.error("Auto-save scenes failed:", err);
      }
    };

    saveUpdatedScenes();
  }, [debouncedScenes]);



  const updateStyle = async (updates: any) => {
    await onSave({
      styleConfig: { ...style, ...updates }
    });
  };



  useEffect(() => {
    setIsCinematic(activeMobileMode === "preview");
    return () => setIsCinematic(false);
  }, [activeMobileMode, setIsCinematic]);

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
    const newScenes = scenes.filter(s => s.id !== id);
    handleUpdateScenes(newScenes);
    if (activeSceneId === id) {
      setActiveSceneId(newScenes.length > 0 ? newScenes[0].id : "splash");
    }
  };

  const updateSceneConfig = (id: string, updates: any) => {
    const newScenes = scenes.map(s => 
      s.id === id ? { ...s, config: { ...s.config, ...updates } } : s
    );
    handleUpdateScenes(newScenes);
  };

  const changeSceneType = (id: string, type: Scene["type"]) => {
    const newScenes = scenes.map(s => 
      s.id === id ? { 
        ...s, 
        type, 
        config: {
          ...getDefaultConfig(type),
          // Preserving music and theme related config
          ytMusicId: s.config?.ytMusicId,
          musicMetadata: s.config?.musicMetadata,
          musicUrl: s.config?.musicUrl,
          useGlobalMusic: s.config?.useGlobalMusic,
          audioStart: s.config?.audioStart,
          audioDuration: s.config?.audioDuration,
          themeId: s.config?.themeId,
          useGlobalTheme: s.config?.useGlobalTheme,
        }
      } : s
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
      if (media) {
        // Try to insert into either the modal editor or the small editor
        const targetEditor = isEditorModalOpen ? modalEditorRef.current : editorRef.current;
        if (targetEditor) {
          targetEditor.insertImage(media.url);
          // Only turn off the "special insertion" mode if it was explicitly turned on
          if (insertingToEditor) setInsertingToEditor(false);
        }
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
  const initiateUpload = useCallback((mode: 'upload' | 'library') => {
    if ((momentData?.media?.length || 0) >= maxAllowed) {
      setShowLimitModal(true);
      return;
    }
    setThumbnailMode(mode);
    // Force a small delay to ensure React state update propagates to the input's multiple/accept attributes
    setTimeout(() => {
      fileInputRef.current?.click();
    }, 10);
  }, [momentData?.media?.length, maxAllowed]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !auth.currentUser) return;
    
    const currentMediaCount = momentData?.media?.length || 0;
    
    // Check Limit
    if (currentMediaCount >= maxAllowed) {
      setShowLimitModal(true);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    if (thumbnailMode === "upload") {
      setUploadingThumbnail(true);
      try {
        const file = files[0];
        const optimized = await optimizeImage(file, 800, 0.7);
        const tempId = Math.random().toString(36).substr(2, 9);
        const path = `users/${auth.currentUser.uid}/moments/${draftId}/cover-${Date.now()}.webp`;
        const fileToUpload = new File([optimized], `cover-${Date.now()}.webp`, { type: 'image/webp' });
        const downloadURL = await uploadFile(fileToUpload, path);
        
        // Also add to library
        const newMediaItem = {
          id: tempId,
          type: "image",
          url: downloadURL,
          name: file.name,
          uploadedAt: new Date().toISOString()
        };

        await onSave({ 
          imageUrl: downloadURL,
          media: [...(momentData?.media || []), newMediaItem]
        });
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
      const isVideo = file.type.startsWith("video/");
      const path = `users/${auth.currentUser.uid}/moments/${draftId}/${tempId}-${isVideo ? file.name : 'optimized.webp'}`;
      
      setUploadingFiles(prev => ({ ...prev, [tempId]: 0 }));

      try {
        let fileToUpload = file;
        if (!isVideo) {
          const optimized = await optimizeImage(file, 1200, 0.8);
          fileToUpload = new File([optimized], 'optimized.webp', { type: 'image/webp' });
        }

        const downloadURL = await uploadFile(fileToUpload, path, (progress) => {
          setUploadingFiles(prev => ({ ...prev, [tempId]: Math.round(progress) }));
        });

        const newMediaItem = {
          id: tempId,
          type: isVideo ? "video" : "image",
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

  const handleDeleteAsset = async (media: any) => {
    setAssetToDelete(media);
    setDeleteError(null);
  };

  const confirmDeleteAsset = async () => {
    if (!assetToDelete) return;
    setIsDeleting(true);
    setDeleteError(null);
    
    try {
      // Remove from moment media
      const newMedia = (momentData?.media || []).filter((m: any) => m.id !== assetToDelete.id);
      
      // Remove from all scenes
      const newScenes = scenes.map(s => ({
        ...s,
        config: {
          ...s.config,
          mediaIds: (s.config.mediaIds || []).filter((id: string) => id !== assetToDelete.id)
        }
      }));

      const updates: any = { 
        media: newMedia,
        styleConfig: {
          ...style,
          scenes: newScenes
        }
      };

      // If it was the cover, clear it
      if (momentData.imageUrl === assetToDelete.url) {
        updates.imageUrl = null;
      }

      await onSave(updates);
      setScenes(newScenes);
      setAssetToDelete(null);
      
      // Attempt to delete from storage as well if we have a path
      try {
        if (assetToDelete.path) {
          await deleteFile(assetToDelete.path);
        }
      } catch (e) {
        console.error("Storage deletion failed:", e);
      }

    } catch (err: any) {
      console.error("Error deleting asset:", err);
      setDeleteError(err.message || "Failed to delete memory. Please try again.");
    } finally {
      setIsDeleting(false);
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
      togglePlay(null);
    }
  }, [debouncedSearchQuery, handleYTSearch, togglePlay]);

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

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else if (document.exitFullscreen) {
      document.exitFullscreen();
    }
  };

  const activeSceneInfo = useMemo(() => {
    if (activeSceneId === "splash") return { title: "Splash Screen", icon: Heart };
    if (activeSceneId === "branding") return { title: "Final Screen", icon: Award };
    const idx = scenes.findIndex(s => s.id === activeSceneId);
    return { title: `Scene ${idx + 1}`, icon: scenes[idx]?.type === "gallery" ? ImageIcon : Scroll };
  }, [activeSceneId, scenes]);

  return (
    <div className="flex-1 w-full flex flex-col h-full overflow-hidden bg-[#f5f5f7] dark:bg-black/40">
      {/* Mobile Header: Mode Switcher & Forced Fullscreen Trigger */}
      <div className="lg:hidden shrink-0 border-b border-border bg-white/80 dark:bg-black/80 backdrop-blur-xl z-[40]">
        <div className="p-4 flex items-center justify-between gap-4 max-w-sm mx-auto">
          <div className="flex-1 flex p-1 bg-black/5 dark:bg-white/5 rounded-lg shadow-inner">
            <button
              onClick={() => setActiveMobileMode("edit")}
              className={cn(
                "flex-1 flex justify-center items-center py-2.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all",
                activeMobileMode === "edit" ? "bg-white dark:bg-white/10 shadow-lg text-primary scale-[1.02]" : "text-text-muted hover:text-text-main"
              )}
            >
              <PenTool size={14} className="mr-2" /> Editor
            </button>
            <button
              onClick={() => {
                setActiveMobileMode("preview");
                toggleFullScreen(); // Proactively try to go fullscreen for preview
              }}
              className={cn(
                "flex-1 flex justify-center items-center py-2.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all",
                activeMobileMode === "preview" ? "bg-white dark:bg-white/10 shadow-lg text-primary scale-[1.02]" : "text-text-muted hover:text-text-main"
              )}
            >
              <Play size={14} className="mr-2" /> Live Preview
            </button>
          </div>
          <button 
            onClick={toggleFullScreen}
            className="size-11 flex items-center justify-center rounded-lg bg-black/5 dark:bg-white/5 text-text-muted active:scale-95 transition-all"
          >
            <Smartphone size={20} />
          </button>
        </div>

        {/* Mobile Scene Switcher Row (Compact) */}
        {activeMobileMode === "edit" && (
          <div className="px-4 pb-4 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setIsScenePickerOpen(true)}
                className="flex-[0.6] flex items-center justify-between px-4 py-3 bg-black/5 dark:bg-white/5 border border-border/50 rounded-lg text-left active:bg-black/10 transition-colors"
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="shrink-0 size-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                    <activeSceneInfo.icon size={14} />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-text-main truncate">
                    {activeSceneInfo.title}
                  </span>
                </div>
                <ChevronDown size={14} className="text-text-muted shrink-0 ml-2" />
              </button>
              
              <button 
                onClick={addScene}
                className="flex-[0.4] flex items-center justify-center gap-2 py-3 bg-primary text-white rounded-lg shadow-lg shadow-primary/20 active:scale-95 transition-all"
              >
                <Plus size={16} />
                <span className="text-[9px] font-black uppercase tracking-widest whitespace-nowrap">New Screen</span>
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Sidebar: Timeline (Desktop Only, or hidden on mobile mobile preview) */}
        <div className={cn(
          "w-64 border-r border-border bg-[#fafafa] dark:bg-black/20 flex flex-col shrink-0 overflow-y-auto z-10",
          "hidden lg:flex" // Hide on mobile entirely, replaced by bottom rail & sidebar settings
        )}>
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
                <button 
                  onClick={(e) => { e.stopPropagation(); deleteScene(scene.id); }}
                  className="p-1 text-text-muted hover:text-red-500 transition-all"
                >
                  <Trash2 size={12} />
                </button>
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

        {/* Scene Picker Bottom Sheet (Mobile Only) */}
        <AnimatePresence>
          {isScenePickerOpen && (
            <div className="lg:hidden fixed inset-0 z-[100] flex items-end justify-center px-4 pb-4">
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }}
                onClick={() => setIsScenePickerOpen(false)}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              />
              <motion.div 
                initial={{ y: "100%" }} 
                animate={{ y: 0 }} 
                exit={{ y: "100%" }}
                className="relative w-full max-w-sm bg-white dark:bg-zinc-900 rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/10 p-6 pb-safe"
              >
                <div className="w-12 h-1.5 bg-black/10 dark:bg-white/10 rounded-full mx-auto mb-6" />
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted">Jump to Screen</h3>
                  <button onClick={() => setIsScenePickerOpen(false)} className="text-text-muted hover:text-text-main p-1">
                    <X size={16} />
                  </button>
                </div>
                <div className="space-y-2 max-h-[60vh] overflow-y-auto no-scrollbar pb-6 px-1">
                  {/* Splash */}
                  <button 
                    onClick={() => { setActiveSceneId("splash"); setIsScenePickerOpen(false); }}
                    className={cn(
                      "w-full flex items-center gap-4 p-4 rounded-lg transition-all",
                      activeSceneId === "splash" ? "bg-primary text-white shadow-lg shadow-primary/20" : "bg-black/5 dark:bg-white/5 text-text-main"
                    )}
                  >
                    <Heart size={18} />
                    <span className="text-xs font-bold uppercase tracking-widest">Splash Screen</span>
                    {activeSceneId === "splash" && <Check size={16} className="ml-auto" />}
                  </button>

                  {/* Scenes */}
                  {scenes.map((scene, index) => (
                    <button 
                      key={scene.id}
                      onClick={() => { setActiveSceneId(scene.id); setIsScenePickerOpen(false); }}
                      className={cn(
                        "w-full flex items-center gap-4 p-4 rounded-lg transition-all",
                        activeSceneId === scene.id ? "bg-primary text-white shadow-lg shadow-primary/20" : "bg-black/5 dark:bg-white/5 text-text-main"
                      )}
                    >
                      {scene.type === "gallery" ? <ImageIcon size={18} /> : <Scroll size={18} />}
                      <span className="text-xs font-bold uppercase tracking-widest">Scene {index + 1}</span>
                      {activeSceneId === scene.id && <Check size={16} className="ml-auto" />}
                    </button>
                  ))}

                  {/* Final */}
                  <button 
                    onClick={() => { setActiveSceneId("branding"); setIsScenePickerOpen(false); }}
                    className={cn(
                      "w-full flex items-center gap-4 p-4 rounded-lg transition-all",
                      activeSceneId === "branding" ? "bg-primary text-white shadow-lg shadow-primary/20" : "bg-black/5 dark:bg-white/5 text-text-main"
                    )}
                  >
                    <Award size={18} />
                    <span className="text-xs font-bold uppercase tracking-widest">Final Screen</span>
                    {activeSceneId === "branding" && <Check size={16} className="ml-auto" />}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Main Stage */}
        <div className="flex-1 lg:bg-[#f5f5f7] dark:lg:bg-black/40 overflow-hidden relative flex flex-col lg:flex-row">
          <div className={cn(
            "flex-1 flex flex-col items-center justify-center p-0 lg:p-8 relative transition-all",
            activeMobileMode === "edit" && "hidden lg:flex"
          )}>
            <div 
              className={cn(
                "bg-[#fafafa] dark:bg-black/5 flex flex-col overflow-hidden relative transition-all duration-500 ease-in-out",
                previewDevice === "mobile" || (typeof window !== 'undefined' && window.innerWidth < 1024)
                  ? "aspect-[9/16] h-full lg:max-h-[700px] w-full lg:max-w-[400px] lg:rounded-[32px] lg:shadow-2xl lg:border lg:border-border" 
                  : "h-full w-full rounded-lg shadow-2xl border border-border"
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

            {/* Content Properties (Edit Area) */}
            <div className={cn(
              "flex-1 lg:w-[380px] lg:border-l lg:border-border lg:bg-surface lg:shrink-0 p-6 lg:p-6 overflow-y-auto scrollbar-none transition-all",
              activeMobileMode === "preview" && "hidden lg:block",
              activeMobileMode === "edit" && "w-full"
            )}>
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
                               <div className="absolute inset-0 bg-black/20 flex flex-col items-center justify-center p-2">
                                 <div className="bg-white/90 backdrop-blur-sm rounded-full px-3 py-1 flex items-center gap-1.5 shadow-lg border border-white/20">
                                   <div className="size-1.5 rounded-full bg-green-500 animate-pulse" />
                                   <p className="text-[8px] font-black text-black uppercase tracking-widest">Active Cover</p>
                                 </div>
                               </div>
                               <button
                                  onClick={() => onSave({ imageUrl: null })}
                                  className="absolute top-2 right-2 size-8 rounded-full bg-red-500 text-white flex items-center justify-center opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity shadow-lg active:scale-95 z-10"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                           ) : (
                             <div className="aspect-video rounded-lg border border-dashed border-border bg-black/[0.02] flex items-center justify-center text-center p-4">
                               <p className="text-[9px] font-bold text-text-muted leading-relaxed uppercase">No cover image set.<br/>Recipients see this first.</p>
                             </div>
                           )}
                           
                           <div className="flex gap-2">
                              {/* File input moved to a global location bottom of sidebar to ensure it's always mounted */}
                              <button 
                                onClick={() => initiateUpload("upload")}
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
                              <div className="flex gap-2 p-2 bg-black/[0.02] rounded-lg border border-border overflow-x-auto animate-in fade-in slide-in-from-top-2 scrollbar-none">
                                {momentData?.media?.map((m: any) => (
                                  <button
                                    key={m.id}
                                    onClick={() => handleSetThumbnail(m)}
                                    className={cn(
                                      "size-12 shrink-0 rounded-lg overflow-hidden border-2 transition-all",
                                      momentData.imageUrl === m.url ? "border-primary scale-95" : "border-transparent opacity-60 hover:opacity-100"
                                    )}
                                  >
                                    <img src={m.url} className="w-full h-full object-cover" />
                                  </button>
                                ))}
                                {(!momentData?.media || momentData.media.length === 0) && (
                                  <div className="w-full text-center py-4 text-text-muted text-[8px] font-black uppercase italic">Library is empty</div>
                                )}
                              </div>
                           )}
                        </div>

                        {momentData?.selectedAddons?.includes("extraMedia") && momentData.plan !== "premium" && !momentData.paidAddons?.includes("extraMedia") && (
                          <div className="p-4 rounded-lg bg-black/[0.02] dark:bg-white/[0.02] border border-border space-y-3">
                            <div className="flex items-center gap-2 text-text-muted">
                              <Lock size={14} />
                              <h4 className="text-[10px] font-black uppercase tracking-widest">Extra Slots Active</h4>
                            </div>
                            <p className="text-[9px] font-medium text-text-muted/70 leading-relaxed">
                              You have extra media slots added to your plan.
                            </p>
                            <button
                              onClick={() => {
                                if ((momentData?.media?.length || 0) > 10) {
                                  setShowMediaRemovalModal(true);
                                } else {
                                  toggleAddon("extraMedia");
                                }
                              }}
                              className="w-full py-2 bg-black/5 hover:bg-black/10 text-text-muted text-[9px] font-black uppercase tracking-widest rounded-md transition-all active:scale-95"
                            >
                              Remove Extra Slots
                            </button>
                          </div>
                        )}
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
                                 <div className="size-10 rounded-lg overflow-hidden shrink-0">
                                   <img src={style.musicMetadata.thumbnail} className="w-full h-full object-cover" />
                                 </div>
                                 <div className="flex-1 min-w-0">
                                   <p className="text-[10px] font-black truncate">{style.musicMetadata.title}</p>
                                   <p className="text-[8px] text-text-muted font-bold truncate">
                                     {style.musicMetadata.artist}
                                     {style.musicMetadata.duration && ` • ${style.musicMetadata.duration}`}
                                   </p>
                                 </div>
                                 <div className="flex gap-1 shrink-0">
                                   <button 
                                     onClick={() => {
                                       updateStyle({ ytMusicId: null, musicMetadata: null, musicUrl: null });
                                       if (playingId === style.ytMusicId) togglePlay(null);
                                     }}
                                     className="p-2 hover:bg-red-500/10 hover:text-red-500 rounded-lg transition-all text-text-muted"
                                   >
                                     <Trash2 size={12} />
                                   </button>
                                   <button 
                                     onClick={() => {
                                       setIsSettingGlobalMusic(!isSettingGlobalMusic);
                                       setYtSearchQuery("");
                                       togglePlay(null);
                                     }} 
                                     className="p-2 hover:bg-primary/10 rounded-lg transition-all text-primary"
                                   >
                                     <RefreshCcw size={12} />
                                   </button>
                                 </div>
                               </div>

                             </div>
                          ) : (
                            <button 
                              onClick={() => {
                                setIsSettingGlobalMusic(!isSettingGlobalMusic);
                                setYtSearchQuery("");
                              }}
                              className="w-full py-4 border border-dashed border-border rounded-lg bg-black/[0.01] hover:bg-primary/5 hover:border-primary/50 text-[10px] font-black uppercase tracking-widest text-text-muted transition-all"
                            >
                               Set Theme Song
                            </button>
                          )}

                          {isSettingGlobalMusic && (
                            <div className="space-y-3 pt-2 animate-in fade-in slide-in-from-top-2">
                               <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={12} />
                                <input 
                                  autoFocus
                                  type="text" 
                                  placeholder="Search theme song..."
                                  className="w-full h-10 pl-9 pr-3 rounded-lg border border-border bg-white text-[10px] font-bold outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                                  value={ytSearchQuery}
                                  onChange={(e) => setYtSearchQuery(e.target.value)}
                                />
                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                  {isSearching ? (
                                    <div>
                                      <Loader2 className="animate-spin text-primary" size={12} />
                                    </div>
                                  ) : (
                                    <button onClick={() => setIsSettingGlobalMusic(false)}>
                                      <X size={12} className="text-text-muted hover:text-primary transition-colors" />
                                    </button>
                                  )}
                                </div>
                              </div>
                              {showSearchResults && ytResults.length > 0 && (
                                <div className="bg-white border border-border rounded-lg overflow-hidden max-h-48 overflow-y-auto divide-y divide-border shadow-soft">
                                  {ytResults.map((song) => (
                                    <div key={song.videoId} onClick={() => {
                                      setGlobalMusic(song);
                                      setIsSettingGlobalMusic(false);
                                      togglePlay(null);
                                    }} className="p-2 flex items-center gap-2 cursor-pointer hover:bg-primary/5 transition-colors">
                                      <img src={song.thumbnail} className="size-8 rounded-lg object-cover" />
                                      <div className="flex-1 min-w-0">
                                        <p className="text-[9px] font-black truncate">{song.title}</p>
                                        <p className="text-[8px] text-text-muted font-bold truncate">{song.author}</p>
                                      </div>
                                      <button onClick={(e) => { e.stopPropagation(); togglePlay(song.videoId); }} className="size-6 bg-primary/10 text-primary rounded-lg flex items-center justify-center">
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
                           <div className="p-6 rounded-lg bg-primary/5 border border-primary/20 space-y-4">
                              <div className="size-12 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                                <Sparkles size={24} />
                              </div>
                              <div className="space-y-2">
                                <h3 className="text-xs font-black uppercase text-primary tracking-widest">Reaction Collector</h3>
                                <p className="text-[10px] font-medium text-text-muted leading-relaxed">
                                  Your branding removal is active. Instead of seeing our logo, the recipient will be invited to send you a private reaction or note once they finish viewing.
                                </p>
                              </div>
                           </div>
                        </div>
                      ) : (
                        <div className="space-y-6">
                           <div className="p-6 rounded-lg bg-black/[0.02] border border-border space-y-4">
                              <div className="size-12 bg-black/5 rounded-lg flex items-center justify-center text-text-muted">
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
                              "w-full py-4 border-2 rounded-lg flex items-center justify-center gap-2 transition-all group",
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
                         <section className="pt-8 border-t border-border animate-in fade-in slide-in-from-top-2">
                           <div className="mb-4">
                             <div className="flex items-center gap-2 mb-1">
                               <MessageCircleHeart size={14} className="text-pink-500" />
                               <h4 className="text-[10px] font-black uppercase tracking-widest text-text-main">Audience Reactions</h4>
                             </div>
                             <p className="text-[10px] font-medium text-text-muted leading-relaxed">
                               Allow recipients to send voice notes, video selfies, and text directly to your dashboard.
                             </p>
                           </div>

                           <button
                             onClick={() => updateStyle({ showReactions: style.showReactions === false ? true : false })}
                             className={cn(
                               "w-full relative overflow-hidden group border-2 rounded-lg transition-all duration-300 flex items-center justify-between p-4",
                               style.showReactions !== false
                                 ? "bg-pink-500/5 border-pink-500 shadow-[0_0_30px_rgba(236,72,153,0.1)] hover:bg-pink-500/10"
                                 : "bg-surface border-border hover:border-text-muted/30 hover:bg-black/[0.02]"
                             )}
                           >
                             <div className="flex items-center gap-4 relative z-10">
                               <div className={cn(
                                 "size-10 rounded-full flex items-center justify-center transition-all duration-500",
                                 style.showReactions !== false ? "bg-pink-500 text-white scale-110" : "bg-black/5 text-text-muted"
                               )}>
                                 <Heart size={18} className={cn(style.showReactions !== false && "animate-pulse")} fill={style.showReactions !== false ? "currentColor" : "none"} />
                               </div>
                               <div className="flex flex-col items-start gap-1">
                                 <span className={cn(
                                   "text-[11px] font-black uppercase tracking-widest transition-colors",
                                   style.showReactions !== false ? "text-pink-600 dark:text-pink-400" : "text-text-main"
                                 )}>
                                   {style.showReactions !== false ? "Collecting Feedback" : "Reactions Disabled"}
                                 </span>
                                 <span className="text-[8px] font-bold uppercase tracking-wider text-text-muted">
                                   {style.showReactions !== false ? "Active on Final Screen" : "Click to Enable Reaction Bar"}
                                 </span>
                               </div>
                             </div>
                             
                             <div className={cn(
                               "relative z-10 size-6 rounded-full border-2 flex items-center justify-center transition-colors",
                               style.showReactions !== false ? "border-pink-500 bg-pink-500" : "border-border bg-transparent group-hover:border-text-muted/30"
                             )}>
                               {style.showReactions !== false && <CheckCircle2 size={12} className="text-white" />}
                             </div>
                           </button>
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
                     >
                      {/* Theme Override */}
                      <section className="pb-8 space-y-4">
                          <h3 className="text-[10px] font-black uppercase tracking-widest text-text-muted flex items-center gap-2">
                          <Palette size={12} /> Screen Style
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

                      {/* Screen Music Override for Custom Scenes */}
                      <div className="py-8 space-y-4 border-t border-border">
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
                                    <div className="size-8 rounded-md overflow-hidden shrink-0">
                                      <img src={activeScene.config.musicMetadata.thumbnail} className="w-full h-full object-cover" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-[9px] font-black truncate">{activeScene.config.musicMetadata.title}</p>
                                      <p className="text-[8px] text-text-muted font-bold truncate">
                                        {activeScene.config.musicMetadata.artist}
                                        {activeScene.config.musicMetadata.duration && ` • ${activeScene.config.musicMetadata.duration}`}
                                      </p>
                                    </div>
                                    <div className="flex gap-1 shrink-0">
                                      <button 
                                        onClick={() => {
                                          updateSceneConfig(activeSceneId, { ytMusicId: null, musicMetadata: null, musicUrl: null });
                                          if (playingId === activeScene.config.ytMusicId) togglePlay(null);
                                        }}
                                        className="p-1.5 hover:bg-red-500/10 hover:text-red-500 rounded-md transition-all text-text-muted"
                                      >
                                        <Trash2 size={10} />
                                      </button>
                                      <button 
                                        onClick={() => {
                                          setIsSettingGlobalMusic(!isSettingGlobalMusic);
                                          setYtSearchQuery("");
                                          togglePlay(null);
                                        }}
                                        className="p-1.5 hover:bg-primary/10 rounded-md transition-all text-primary"
                                      >
                                        <RefreshCcw size={10} />
                                      </button>
                                    </div>
                                </div>
                                </div>
                            ) : (
                              <button 
                                onClick={() => {
                                  setIsSettingGlobalMusic(!isSettingGlobalMusic);
                                  setYtSearchQuery("");
                                }}
                                className="w-full py-4 border border-dashed border-border rounded-lg bg-black/[0.01] hover:bg-primary/5 hover:border-primary/50 text-[10px] font-black uppercase tracking-widest text-text-muted transition-all"
                              >Pick Screen Song</button>
                            )}

                            {isSettingGlobalMusic && (
                              <div className="space-y-3 pt-2 animate-in fade-in slide-in-from-top-2">
                                <div className="relative">
                                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={12} />
                                  <input 
                                    autoFocus
                                    type="text" 
                                    placeholder="Search screen song..."
                                    className="w-full h-10 pl-9 pr-3 rounded-lg border border-border bg-white text-[10px] font-bold outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                                    value={ytSearchQuery}
                                    onChange={(e) => setYtSearchQuery(e.target.value)}
                                  />
                                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                    {isSearching ? (
                                      <Loader2 className="animate-spin text-primary" size={12} />
                                    ) : (
                                      <button onClick={() => setIsSettingGlobalMusic(false)}>
                                        <X size={12} className="text-text-muted hover:text-primary transition-colors" />
                                      </button>
                                    )}
                                  </div>
                                </div>
                                {showSearchResults && ytResults.length > 0 && (
                                  <div className="bg-white border border-border rounded-lg overflow-hidden max-h-48 overflow-y-auto divide-y divide-border shadow-soft">
                                    {ytResults.map((song) => (
                                      <div key={song.videoId} onClick={() => {
                                        setGlobalMusic(song);
                                        setIsSettingGlobalMusic(false);
                                        togglePlay(null);
                                      }} className="p-2 flex items-center gap-2 cursor-pointer hover:bg-primary/5 transition-colors">
                                        <img src={song.thumbnail} className="size-8 rounded-lg object-cover" />
                                        <div className="flex-1 min-w-0">
                                          <p className="text-[9px] font-black truncate">{song.title}</p>
                                          <p className="text-[8px] text-text-muted font-bold truncate">{song.author}</p>
                                        </div>
                                        <button onClick={(e) => { e.stopPropagation(); togglePlay(song.videoId); }} className="size-6 bg-primary/10 text-primary rounded-lg flex items-center justify-center">
                                          {playingId === song.videoId ? <Pause size={10} fill="currentColor" /> : <Play size={10} fill="currentColor" className="ml-0.5" />}
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Screen Type Selector */}
                      <section className="py-8 space-y-4 border-t border-border">
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

                      {/* Dependent Screen Configuration */}
                      <section className="py-8 border-t border-border">
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
                              ref={editorRef}
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
                                          className="absolute top-1 right-1 size-5 bg-red-500 text-white rounded-md flex items-center justify-center shadow-lg active:scale-95 transition-all"
                                        >
                                          <Trash2 size={10} />
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
                      </section>

                      {/* Shared Media Library (Manage Assets) */}
                      {activeSceneId !== "splash" && activeSceneId !== "branding" && (
                        <section ref={mediaLibraryRef} className="py-8 border-t border-border space-y-6">
                          <header className="flex items-center justify-between">
                            <div className="space-y-1">
                              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-text-main flex items-center gap-2">
                                <ImageIcon size={12} className="text-primary" />
                                Asset Library {momentData?.media?.length || 0}/{maxAllowed}
                              </h3>
                              <div className="flex items-center gap-2">
                                <p className="text-[8px] font-bold text-text-muted uppercase tracking-widest">Manage Your Memories</p>
                              </div>
                            </div>
                            <button 
                              onClick={() => initiateUpload('library')}
                              className="size-10 rounded-md bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
                            >
                              <Plus size={20} />
                            </button>
                          </header>

                          <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto scrollbar-none">
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
                                  isMediaSelected(m.id) ? "bg-primary/20 opacity-100" : "bg-black/20 backdrop-blur-[2px] opacity-100"
                                )}>
                                  {isMediaSelected(m.id) ? (
                                    <div className="size-6 rounded-full bg-white text-primary flex items-center justify-center shadow-sm">
                                      <Check size={14} />
                                    </div>
                                  ) : (
                                    <p className="text-[8px] font-black text-white uppercase tracking-widest">Select</p>
                                  )}
                                </div>

                                {/* Action Hover - Delete Button */}
                                <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteAsset(m);
                                    }}
                                    className="size-5 rounded-md bg-red-500 text-white flex items-center justify-center shadow-lg active:scale-95 transition-all"
                                    title="Delete Memory"
                                    >
                                    <Trash2 size={10} />
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
                              <div className="col-span-3 py-10 flex flex-col items-center justify-center gap-2 border border-dashed border-border rounded-lg bg-black/[0.01]">
                                <div className="size-10 rounded-full bg-black/5 flex items-center justify-center text-text-muted/30">
                                  <ImageIcon size={20} />
                                </div>
                                <p className="text-[9px] font-bold text-text-muted uppercase tracking-widest">Library is empty</p>
                              </div>
                            )}
                          </div>

                          {momentData?.media?.length >= maxAllowed && (
                            <div className="p-4 rounded-lg bg-orange-50 dark:bg-orange-500/10 border border-orange-100 dark:border-orange-500/20 space-y-3">
                              <div className="flex items-center gap-2 text-orange-600">
                                <Lock size={14} />
                                <h4 className="text-[10px] font-black uppercase tracking-widest">Storage Limit Reached</h4>
                              </div>
                              <p className="text-[9px] font-medium text-orange-700/70 leading-relaxed">
                                You've used all {maxAllowed} media slots.
                              </p>
                            </div>
                          )}

                          {momentData?.selectedAddons?.includes("extraMedia") && momentData.plan !== "premium" && !momentData.paidAddons?.includes("extraMedia") && (
                            <div className="p-4 rounded-lg bg-black/[0.02] dark:bg-white/[0.02] border border-border space-y-3">
                              <div className="flex items-center gap-2 text-text-muted">
                                <Lock size={14} />
                                <h4 className="text-[10px] font-black uppercase tracking-widest">Extra Slots Active</h4>
                              </div>
                              <p className="text-[9px] font-medium text-text-muted/70 leading-relaxed">
                                You have extra media slots added to your plan.
                              </p>
                              <button
                                onClick={() => {
                                  if ((momentData?.media?.length || 0) > 10) {
                                    setShowMediaRemovalModal(true);
                                  } else {
                                    toggleAddon("extraMedia");
                                  }
                                }}
                                className="w-full py-2 bg-black/5 hover:bg-black/10 text-text-muted text-[9px] font-black uppercase tracking-widest rounded-md transition-all active:scale-95"
                              >
                                Remove Extra Slots
                              </button>
                            </div>
                          )}

                        </section>
                      )}

                      {/* Delete Screen Section */}
                      <section className="pt-6 border-t border-border animate-in fade-in slide-in-from-top-2">
                        <button 
                          onClick={() => deleteScene(activeSceneId)}
                          className="w-full py-4 border-2 border-red-500/20 hover:border-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg flex items-center justify-center gap-3 transition-all group text-red-500"
                        >
                          <Trash2 size={16} className="text-red-500 group-hover:-rotate-12 transition-transform" />
                          <div className="text-left leading-none">
                            <p className="text-[10px] font-black uppercase tracking-widest">Delete Screen</p>
                            <p className="text-[8px] font-bold opacity-80 uppercase tracking-tight">Remove this screen entirely</p>
                          </div>
                        </button>
                      </section>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Global Hidden File Input - ensure it's always mounted for all screens */}
                <input 
                  type="file" 
                  ref={fileInputRef}
                  className="hidden" 
                  accept={thumbnailMode === "upload" ? "image/*" : "image/*,video/*"}
                  multiple={thumbnailMode !== "upload"}
                  onChange={handleFileUpload}
                />

                </div>
              </div>
            </div>
          </div>

          {/* Audio Player */}
          {playingId && (
            <iframe 
              key={playingId}
              style={{ width: 0, height: 0, border: 0, position: 'absolute', pointerEvents: 'none' }}
              src={`https://www.youtube.com/embed/${playingId}?autoplay=1&enablejsapi=1`} 
              allow="autoplay" 
              onLoad={() => setIsAudioLoading(false)} 
            />
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
                  className="w-full max-w-5xl h-full max-h-[90vh] bg-background border border-border rounded-lg shadow-2xl overflow-hidden flex flex-col"
                >
                  <header className="p-6 border-b border-border flex items-center justify-between bg-surface/50">
                    <div className="flex items-center gap-3">
                      <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
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
                        ref={modalEditorRef}
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
                                onClick={() => initiateUpload('library')}
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
                                   onClick={() => toggleMedia(m.id)}
                                   className="aspect-square rounded-lg overflow-hidden border-2 border-transparent hover:border-primary cursor-pointer transition-all hover:scale-[1.02] shadow-sm relative group"
                                 >
                                   <img src={m.url} className="w-full h-full object-cover" />
                                   <div className="absolute inset-0 bg-primary/20 opacity-100 flex items-center justify-center transition-opacity">
                                     <Plus size={20} className="text-white drop-shadow-md" />
                                   </div>
                                 </div>
                               ))}
                            </div>
                            
                            {(!momentData?.media || momentData.media.length === 0) && (
                              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
                                 <div className="size-12 rounded-lg bg-black/5 flex items-center justify-center text-text-muted/30">
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
        {/* Limit Exhausted Modal */}
      <AnimatePresence>
        {showLimitModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowLimitModal(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm bg-white dark:bg-zinc-900 rounded-lg overflow-hidden shadow-2xl border border-white/10"
            >
              <div className="p-8 text-center space-y-6">
                <div className="size-16 rounded-lg bg-orange-500/10 flex items-center justify-center mx-auto text-orange-500">
                  <Lock size={32} />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-black text-text-main uppercase tracking-tight">Storage Full</h3>
                  <p className="text-sm font-medium text-text-muted leading-relaxed px-4">
                    You've reached your limit of {maxAllowed} memories. Upgrade to continue building your surprise.
                  </p>
                </div>

                <div className="space-y-3 pt-2">
                  {momentData?.plan === "base" && !momentData?.selectedAddons?.includes("extraMedia") && (
                    <button 
                      onClick={() => {
                        toggleAddon("extraMedia");
                        setShowLimitModal(false);
                      }}
                      className="w-full py-4 bg-primary text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-lg shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex flex-col items-center justify-center leading-tight"
                    >
                      Add 15 more Media files
                      <span className="text-[8px] opacity-60 mt-1">ONLY {formatPrice(ADDONS.find(a => a.id === "extraMedia")?.price[currency] || 0, currency)}</span>
                    </button>
                  )}
                  <button 
                    onClick={() => setShowLimitModal(false)}
                    className="w-full py-4 bg-black/5 dark:bg-white/5 text-text-muted text-[10px] font-black uppercase tracking-[0.2em] rounded-lg hover:bg-black/10 transition-all"
                  >
                    Maybe Later
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Media Removal Warning Modal */}
      <AnimatePresence>
        {showMediaRemovalModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowMediaRemovalModal(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm bg-white dark:bg-zinc-900 rounded-[32px] overflow-hidden shadow-2xl border border-white/10"
            >
              <div className="p-8 text-center space-y-6">
                <div className="size-16 rounded-lg bg-red-500/10 flex items-center justify-center mx-auto text-red-500">
                  <Trash2 size={32} />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-black text-text-main uppercase tracking-tight">Too Much Media</h3>
                  <p className="text-sm font-medium text-text-muted leading-relaxed px-4">
                    To disable extra slots, you must first remove {momentData.media.length - 10} items from your library to fit the 10-item limit.
                  </p>
                </div>

                <div className="pt-2">
                  <button 
                    onClick={() => setShowMediaRemovalModal(false)}
                    className="w-full py-4 bg-primary text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-lg shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                  >
                    Got it, I'll Delete Some
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Asset Confirmation Modal */}
      <AnimatePresence>
        {assetToDelete && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => !isDeleting && setAssetToDelete(null)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm bg-white dark:bg-zinc-900 rounded-lg overflow-hidden shadow-2xl border border-white/10"
            >
              <div className="p-8 text-center space-y-6">
                <div className="size-20 rounded-lg bg-red-500/10 flex items-center justify-center mx-auto text-red-500 relative overflow-hidden">
                   {isDeleting ? (
                     <Loader2 size={32} className="animate-spin" />
                   ) : (
                     <div className="relative">
                        <Trash2 size={32} className="relative z-10" />
                        <motion.div 
                          animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }}
                          transition={{ repeat: Infinity, duration: 3 }}
                          className="absolute inset-0 bg-red-500/20 blur-xl rounded-full"
                        />
                     </div>
                   )}
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-xl font-black text-text-main uppercase tracking-tight">Delete Memory?</h3>
                  <p className="text-sm font-medium text-text-muted leading-relaxed px-4">
                    This will permanently remove this item from your library and all scenes.
                  </p>
                </div>

                {deleteError && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-[10px] font-bold text-red-500 uppercase tracking-widest animate-in fade-in slide-in-from-top-1">
                    {deleteError}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button 
                    disabled={isDeleting}
                    onClick={() => setAssetToDelete(null)}
                    className="w-full py-4 bg-black/5 dark:bg-white/5 text-text-muted text-[10px] font-black uppercase tracking-[0.2em] rounded-lg hover:bg-black/10 transition-all disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button 
                    disabled={isDeleting}
                    onClick={confirmDeleteAsset}
                    className="w-full py-4 bg-red-500 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-lg shadow-xl shadow-red-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center disabled:opacity-50"
                  >
                    {isDeleting ? <Loader2 size={14} className="animate-spin" /> : "Delete"}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

