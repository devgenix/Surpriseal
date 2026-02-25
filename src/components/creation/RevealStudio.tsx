"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { 
  Sparkles, 
  Music, 
  Layout, 
  Play, 
  Pause,
  CheckCircle2,
  ChevronRight,
  Plus,
  Trash2,
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
} from "lucide-react";
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
import { ADDONS } from "@/lib/constants/pricing";


interface Scene {
  id: string;
  type: "scratch" | "gallery" | "composition";
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
    momentData?.styleConfig?.scenes || [
      { id: "1", type: "scratch", config: { coverColor: "#e64c19", isFullScreen: false } }
    ]
  );
  const [activeSceneId, setActiveSceneId] = useState<string>(scenes[0]?.id || "1");
  const [showPreview, setShowPreview] = useState(false);

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

  useEffect(() => {
    setCanContinue(scenes.length > 0);
  }, [scenes, setCanContinue]);

  const style = momentData?.styleConfig || {};

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

  const addScene = () => {
    const newScene: Scene = {
      id: Math.random().toString(36).substr(2, 9),
      type: "scratch",
      config: { coverColor: "#e64c19" }
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
      case "scratch": return { coverColor: "#e64c19", isFullScreen: false };
      case "gallery": return { layout: "grid", mediaIds: [] };
      case "composition": return { text: "", mediaIds: [] };
      default: return {};
    }
  };

  const toggleMedia = (mediaId: string) => {
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

  // Preview Mock
  const previewMoment = {
    ...momentData,
    styleConfig: { 
      ...(momentData?.styleConfig || {}),
      scenes 
    },
    recipientName: momentData?.recipientName || "Recipient",
    personalMessage: momentData?.personalMessage || "Message here...",
    media: momentData?.media || []
  };

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

  const isMusicSelected = (videoId: string) => {
    return activeScene?.config?.ytMusicId === videoId;
  };

  const isPremium = momentData?.plan === "premium";
  const hasUnlimitedAddon = (momentData?.selectedAddons || []).includes("extraMedia");
  const isUnlimited = (momentData?.plan === "premium" && hasUnlimitedAddon); // This was previous logic, but let's use the new helper
  const maxAllowed = getMediaLimit(momentData);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !auth.currentUser) return;

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
        console.error("Upload failed for file:", file.name, error);
      } finally {
        setUploadingFiles(prev => {
          const newState = { ...prev };
          delete newState[tempId];
          return newState;
        });
      }
    }

    if (newMediaItems.length > 0) {
      // Append strictly to the backend and global context
      await onSave({
        media: [...currentMedia, ...newMediaItems]
      });
    }

    if (fileInputRef.current) fileInputRef.current.value = "";
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

  // No-op for thumbnail management in Studio - moved to Settings step
  const handleSetThumbnail = async (media: any) => {};
  const handleRemoveThumbnail = async () => {};

  const onSaveTheme = async (themeId: string) => {
    if (!activeSceneId) return;
    updateSceneConfig(activeSceneId, { themeId });
  };

  return (
    <div className="flex-1 w-full flex flex-col h-[calc(100vh-140px)] overflow-hidden">
      
      {/* Top Header */}
      <div className="px-8 py-6 border-b border-border bg-surface flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-2xl font-black text-text-main">Content Studio</h1>
          <p className="text-sm text-text-muted font-medium">Design an unforgettable reveal sequence.</p>
        </div>
        <div className="flex items-center gap-4">
          <Button 
            variant={showPreview ? "default" : "outline"} 
            className={cn("flex items-center gap-2 rounded-full", showPreview && "bg-primary hover:bg-primary/90")}
            onClick={() => setShowPreview(!showPreview)}
          >
            {showPreview ? <Settings size={16} /> : <Play size={16} fill="currentColor" />}
            {showPreview ? "Back to Editor" : "Live Preview"}
          </Button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Sidebar: Timeline */}
        <div className="w-64 border-r border-border bg-[#fafafa] dark:bg-black/20 flex flex-col shrink-0 overflow-y-auto">
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
            {scenes.map((scene, index) => (
              <div
                key={scene.id}
                onClick={() => setActiveSceneId(scene.id)}
                className={cn(
                  "group flex items-center gap-3 p-3 rounded-xl text-left transition-all cursor-pointer",
                  activeSceneId === scene.id 
                    ? "bg-white dark:bg-white/10 shadow-sm border border-border ring-1 ring-primary/20" 
                    : "hover:bg-black/[0.02]"
                )}
              >
                <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-black text-xs">
                  {index + 1}
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className="text-xs font-bold text-text-main truncate capitalize">{scene.type}</p>
                  <p className="text-[10px] text-text-muted font-bold truncate">Utility Screen</p>
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
          </div>
        </div>

        {/* Main Workspace */}
        <div className="flex-1 bg-[#f5f5f7] dark:bg-black/40 overflow-hidden relative">
          
          {showPreview ? (
            <div className="h-full w-full">
              <RevealEngine moment={previewMoment} isPreview={true} />
            </div>
          ) : (
            <div className="h-full flex flex-col lg:flex-row overflow-hidden">
              
              {/* Center: Stage Preview (Static) */}
              <div className="flex-1 flex items-center justify-center p-8">
                <div className="aspect-[9/16] h-full max-h-[600px] bg-white dark:bg-white/5 border border-border rounded-[40px] shadow-2xl flex flex-col overflow-hidden relative">
                   <div className="absolute inset-x-0 top-0 h-8 flex items-center justify-center z-10">
                     <div className="w-16 h-1 bg-border/20 rounded-full" />
                   </div>
                   
                   <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                     {activeScene?.type === "scratch" && (
                       <div className="w-full h-full flex flex-col items-center justify-center gap-4">
                         <div 
                          className={cn(
                            "rounded-2xl flex items-center justify-center text-4xl shadow-inner border-2 border-dashed border-border transition-all",
                            activeScene.config.isFullScreen ? "w-full h-full" : "size-48"
                          )}
                          style={{ backgroundColor: activeScene.config.coverColor }}
                        >
                           ✨
                         </div>
                         <p className="text-[10px] font-black uppercase text-text-muted mt-2">Scratch Tool</p>
                       </div>
                     )}
                     {activeScene?.type === "gallery" && (
                       <div className="w-full grid grid-cols-2 gap-2">
                         {activeScene.config.mediaIds?.length > 0 ? (
                            activeScene.config.mediaIds.map((id: string) => (
                              <div key={id} className="aspect-square bg-border/20 rounded-lg overflow-hidden">
                                <img src={momentData?.media?.find((m: any) => m.id === id)?.url} className="w-full h-full object-cover" />
                              </div>
                            ))
                         ) : (
                            <>
                              <div className="aspect-square bg-border/20 rounded-lg animate-pulse" />
                              <div className="aspect-square bg-border/20 rounded-lg animate-pulse" />
                            </>
                         )}
                       </div>
                     )}
                     {activeScene?.type === "composition" && (
                       <div className="w-full h-full flex flex-col items-center justify-center gap-6 p-4">
                         {activeScene.config.mediaIds?.[0] && (
                           <div className="w-full aspect-video rounded-xl overflow-hidden border border-border">
                              <img src={momentData?.media?.find((m: any) => m.id === activeScene.config.mediaIds[0])?.url} className="w-full h-full object-cover" />
                           </div>
                         )}
                         <p className="text-xl font-serif italic text-text-main line-clamp-3">
                           {activeScene.config.text || "Your text here..."}
                         </p>
                       </div>
                     )}
                   </div>
                </div>
              </div>

              {/* Right Sidebar: Properties */}
              <div className="w-80 border-l border-border bg-surface shrink-0 p-6 overflow-y-auto">
                <div className="flex flex-col gap-8">
                  
                   {/* Per-Scene Theme Selection */}
                   <section className="space-y-4">
                     <div className="flex flex-col gap-2">
                       <h3 className="text-[10px] font-black uppercase tracking-widest text-text-muted flex items-center gap-2">
                         <Palette size={12} />
                         Screen Theme
                       </h3>
                       <div className="flex p-1 bg-black/5 dark:bg-white/5 rounded-lg">
                        <button
                          onClick={() => updateSceneConfig(activeSceneId, { useGlobalTheme: true })}
                          className={cn(
                            "flex-1 py-1.5 text-[10px] font-bold rounded-md transition-all",
                            activeScene?.config?.useGlobalTheme !== false ? "bg-white dark:bg-white/10 shadow-sm" : "text-text-muted"
                          )}
                        >
                          Global
                        </button>
                        <button
                          onClick={() => updateSceneConfig(activeSceneId, { useGlobalTheme: false })}
                          className={cn(
                            "flex-1 py-1.5 text-[10px] font-bold rounded-md transition-all",
                            activeScene?.config?.useGlobalTheme === false ? "bg-white dark:bg-white/10 shadow-sm" : "text-text-muted"
                          )}
                        >
                          Custom
                        </button>
                      </div>
                    </div>

                    {activeScene?.config?.useGlobalTheme === false && (
                      <div className="animate-in fade-in slide-in-from-top-1">
                        <Select
                          label="Custom Theme"
                          options={[
                            { id: "birthday-classic", title: "Birthday Classic"},
                            { id: "anniversary-gold", title: "Anniversary Gold"},
                            { id: "surprise-neon", title: "Surprise Neon"},
                            { id: "elegant-noir", title: "Elegant Noir"},
                            { id: "romantic-rose", title: "Romantic Rose"},
                          ]}
                          value={activeScene.config.themeId || style.themeId || "birthday-classic"}
                          onChange={onSaveTheme}
                          icon={Palette}
                        />
                      </div>
                    )}
                  </section>

                  {/* Scene Type Selector */}
                  <section>
                    <Select
                      label="Utility Type"
                      options={[
                        { id: "scratch", title: "Scratch Tool", icon: Sparkles },
                        { id: "gallery", title: "Memory Gallery", icon: Layout },
                        { id: "composition", title: "Message Scene", icon: Settings },
                      ]}
                      value={activeScene?.type || "scratch"}
                      onChange={(value) => changeSceneType(activeSceneId, value as Scene["type"])}
                    />
                  </section>

                  {/* Contextual Properties */}
                  <section className="flex flex-col gap-4 animate-in fade-in slide-in-from-right-2">
                     <h3 className="text-[10px] font-black uppercase tracking-widest text-text-muted flex items-center gap-2">
                      <Settings size={12} />
                      Configuration
                    </h3>

                    {activeScene?.type === "scratch" && (
                      <div className="flex flex-col gap-4">
                        <div className="flex flex-col gap-2">
                          <label className="text-[10px] font-bold text-text-muted uppercase">Cover Color</label>
                          <input 
                            type="color" 
                            value={activeScene.config.coverColor || "#e64c19"}
                            onChange={(e) => updateSceneConfig(activeSceneId, { coverColor: e.target.value })}
                            className="w-full h-10 rounded-lg cursor-pointer border-none bg-transparent"
                          />
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-xl border border-border">
                          <span className="text-xs font-bold">Full Screen?</span>
                          <input 
                            type="checkbox"
                            checked={activeScene.config.isFullScreen}
                            onChange={(e) => updateSceneConfig(activeSceneId, { isFullScreen: e.target.checked })}
                            className="size-4 accent-primary"
                          />
                        </div>
                      </div>
                    )}

                    {activeScene?.type === "composition" && (
                      <div className="flex flex-col gap-4">
                        <div className="flex flex-col gap-2">
                          <label className="text-[10px] font-bold text-text-muted uppercase">Scene Text</label>
                          <textarea 
                            value={activeScene.config.text || ""}
                            onChange={(e) => updateSceneConfig(activeSceneId, { text: e.target.value })}
                            className="w-full min-h-[100px] p-3 rounded-lg border border-border text-xs focus:border-primary outline-none"
                            placeholder="Enter some text for this screen..."
                          />
                        </div>
                      </div>
                    )}

                    {activeScene?.type === "gallery" && (
                      <div className="flex flex-col gap-4">
                        <div className="flex flex-col gap-2">
                          <label className="text-[10px] font-bold text-text-muted uppercase">Layout</label>
                          <select 
                            value={activeScene.config.layout || "grid"}
                            onChange={(e) => updateSceneConfig(activeSceneId, { layout: e.target.value })}
                            className="w-full p-3 rounded-lg border border-border text-xs outline-none"
                          >
                            <option value="grid">Grid</option>
                            <option value="stack">Stack</option>
                            <option value="slideshow">Slideshow</option>
                          </select>
                        </div>
                      </div>
                    )}
                  </section>

                  {/* Consolidated Background Music Section */}
                   <section className="space-y-4 pt-4 border-t border-border">
                    <div className="flex flex-col gap-2">
                      <h3 className="text-[10px] font-black uppercase tracking-widest text-text-muted flex items-center gap-2">
                        <Music2 size={12} />
                        Background Music
                      </h3>
                      <div className="flex p-1 bg-black/5 dark:bg-white/5 rounded-lg">
                        <button
                          onClick={() => updateSceneConfig(activeSceneId, { useGlobalMusic: true })}
                          className={cn(
                            "flex-1 py-1.5 text-[10px] font-bold rounded-md transition-all",
                            activeScene?.config?.useGlobalMusic !== false ? "bg-white dark:bg-white/10 shadow-sm text-primary" : "text-text-muted"
                          )}
                        >
                          Global
                        </button>
                        <button
                          onClick={() => updateSceneConfig(activeSceneId, { useGlobalMusic: false })}
                          className={cn(
                            "flex-1 py-1.5 text-[10px] font-bold rounded-md transition-all",
                            activeScene?.config?.useGlobalMusic === false ? "bg-white dark:bg-white/10 shadow-sm text-primary" : "text-text-muted"
                          )}
                        >
                          Custom
                        </button>
                      </div>
                    </div>

                    {/* Current Track Display */}
                    <div className="animate-in fade-in slide-in-from-top-1">
                      {activeScene?.config?.useGlobalMusic !== false ? (
                        // Global Track View
                        style.musicMetadata ? (
                          <div className="p-3 rounded-xl border border-border bg-black/[0.02] flex items-center gap-3">
                            <div className="size-10 rounded-lg overflow-hidden shrink-0 shadow-sm">
                              <img src={style.musicMetadata.thumbnail} className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1 min-w-0">
                               <p className="text-[10px] font-bold truncate">{style.musicMetadata.title}</p>
                               <p className="text-[8px] text-primary font-black uppercase tracking-tighter">Global Master Track</p>
                            </div>
                          </div>
                        ) : (
                          <div className="p-4 rounded-xl border border-dashed border-border flex flex-col items-center justify-center gap-1 opacity-60">
                            <p className="text-[8px] font-black uppercase tracking-widest text-text-muted">No global music set</p>
                          </div>
                        )
                      ) : (
                        // Custom Track View
                        activeScene?.config?.musicMetadata ? (
                          <div className="space-y-3">
                            <div className="p-3 rounded-xl border-2 border-primary bg-primary/5 flex items-center gap-3 shadow-sm">
                              <div className="size-10 rounded-lg overflow-hidden shrink-0 shadow-md">
                                <img src={activeScene.config.musicMetadata.thumbnail} className="w-full h-full object-cover" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-[10px] font-bold truncate">{activeScene.config.musicMetadata.title}</p>
                                <p className="text-[8px] text-primary font-black uppercase tracking-tighter">Custom for this screen</p>
                              </div>
                              <button 
                                onClick={() => toggleMusic(activeScene.config.musicMetadata)}
                                className="text-text-muted hover:text-red-500 transition-colors"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                            
                            {/* Promote to Master */}
                            <button 
                              onClick={async () => {
                                await onSave({
                                  styleConfig: { 
                                    ...style, 
                                    ytMusicId: activeScene.config.ytMusicId, 
                                    musicMetadata: activeScene.config.musicMetadata,
                                    musicUrl: activeScene.config.musicUrl
                                  }
                                });
                                // Switch back to global for this scene since global is now this track
                                updateSceneConfig(activeSceneId, { useGlobalMusic: true });
                              }}
                              className="w-full py-2 border border-primary/20 hover:bg-primary/5 text-primary text-[9px] font-black uppercase tracking-widest rounded-lg transition-all active:scale-95"
                            >
                              Set as Global Master
                            </button>
                          </div>
                        ) : (
                          <div className="p-4 rounded-xl border border-dashed border-border flex flex-col items-center justify-center gap-1 opacity-60">
                            <p className="text-[8px] font-black uppercase tracking-widest text-text-muted">No custom music set</p>
                          </div>
                        )
                      )}
                    </div>

                    {/* Search Bar (Only for Custom) */}
                    {activeScene?.config?.useGlobalMusic === false && (
                       <div className="space-y-2 pt-2">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={12} />
                          <input 
                            type="text" 
                            placeholder="Search songs..."
                            className="w-full h-9 pl-9 pr-3 rounded-lg border border-border bg-white dark:bg-black/20 text-[10px] font-bold outline-none focus:border-primary transition-all"
                            value={ytSearchQuery}
                            onChange={(e) => setYtSearchQuery(e.target.value)}
                            onFocus={() => {
                               if (ytSearchQuery.length >= 2) setShowSearchResults(true);
                            }}
                          />
                          {isSearching && (
                            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-primary" size={10} />
                          )}
                        </div>

                        {showSearchResults && ytResults.length > 0 && (
                          <div className="bg-white dark:bg-black/20 border border-border rounded-xl overflow-hidden max-h-48 overflow-y-auto divide-y divide-border shadow-xl animate-in fade-in slide-in-from-top-2">
                             <div className="p-2 border-b border-border flex items-center justify-between">
                               <p className="text-[8px] font-black text-text-muted uppercase tracking-widest">Search Results</p>
                               <button onClick={() => setShowSearchResults(false)} className="text-[8px] font-bold text-primary hover:underline">Close</button>
                             </div>
                            {ytResults.map((song) => {
                              const isSelected = activeScene.config.ytMusicId === song.videoId;
                              return (
                                <div 
                                  key={song.videoId}
                                  onClick={() => toggleMusic(song)}
                                  className={cn(
                                    "p-2 flex items-center gap-2 cursor-pointer transition-all",
                                    isSelected ? "bg-primary/10" : "hover:bg-black/5"
                                  )}
                                >
                                  <img src={song.thumbnail} className="size-8 rounded object-cover shadow-sm" />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-[10px] font-bold truncate">{song.title}</p>
                                    <p className="text-[8px] text-text-muted truncate">{song.author}</p>
                                  </div>
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setPlayingId(playingId === song.videoId ? null : song.videoId);
                                    }}
                                    className="p-1 hover:text-primary transition-colors"
                                  >
                                    {playingId === song.videoId ? <Pause size={12} fill="currentColor" /> : <Play size={12} fill="currentColor" />}
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </section>

                  {/* Audio Trimming (Per Scene) */}
                  {(activeScene?.config?.musicUrl || style.musicUrl) && (
                    <section className="p-4 rounded-xl bg-primary/5 border border-primary/10">
                      <div className="flex items-center gap-2 mb-4">
                        <Music className="text-primary" size={14} />
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-text-muted">Audio Timing</h3>
                      </div>
                      
                      <AudioTrimmer 
                        url={activeScene?.config?.musicUrl || style.musicUrl}
                        start={activeScene?.config?.audioStart || 0}
                        duration={activeScene?.config?.audioDuration || 10}
                        onUpdate={(start, duration) => {
                          updateSceneConfig(activeSceneId, { 
                            audioStart: start, 
                            audioDuration: duration 
                          });
                        }}
                      />

                      <p className="mt-4 text-[9px] text-text-muted font-medium italic">
                        The music will play from the start time for the specified duration and loop while this screen is active.
                      </p>
                    </section>
                  )}


                  {/* Media Picker */}
                   <section>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-[10px] font-black uppercase tracking-widest text-text-muted flex items-center gap-2">
                        <ImageIcon size={12} />
                        Media Library
                      </h3>
                      {((momentData?.media?.length || 0) < maxAllowed) && (
                        <button 
                          onClick={() => fileInputRef.current?.click()}
                          className="flex items-center gap-1 text-[10px] font-bold text-primary bg-primary/10 hover:bg-primary/20 px-2 py-1 rounded-full transition-colors uppercase tracking-widest"
                        >
                          <Plus size={12} />
                          Upload
                        </button>
                      )}
                    </div>
                    
                    <input 
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      multiple
                      accept="image/*,video/*"
                      className="hidden"
                    />
 
                    <div className="grid grid-cols-3 gap-2">
                      {momentData?.media?.map((m: any) => (
                        <div 
                          key={m.id}
                          onClick={() => toggleMedia(m.id)}
                          className={cn(
                            "aspect-square rounded-lg overflow-hidden border-2 transition-all cursor-pointer relative group",
                            isMediaSelected(m.id) ? "border-primary shadow-lg scale-95" : "border-border hover:border-primary/50"
                          )}
                        >
                          <img src={m.url} className="w-full h-full object-cover" />
                          
                          {/* Hover Overlay */}
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-2">
                             <button 
                               onClick={(e) => { e.stopPropagation(); toggleMedia(m.id); }}
                               className="w-full bg-white/20 hover:bg-white/40 text-[8px] font-black text-white uppercase tracking-widest py-1 rounded-sm backdrop-blur-sm"
                             >
                                {isMediaSelected(m.id) ? "Remove" : "Add to Scene"}
                             </button>
                             <button 
                               onClick={(e) => { e.stopPropagation(); handleSetThumbnail(m); }}
                               disabled={isProcessingThumbnail === m.id}
                               className={cn(
                                 "w-full bg-primary/80 hover:bg-primary text-[8px] font-black text-white uppercase tracking-widest py-1 rounded-sm backdrop-blur-sm flex items-center justify-center gap-1",
                                 momentData?.imageUrl === m.url && "bg-green-500/80 hover:bg-green-500"
                               )}
                             >
                                {isProcessingThumbnail === m.id ? (
                                  <Loader2 size={8} className="animate-spin" />
                                ) : (
                                  momentData?.imageUrl === m.url ? "Current Thumb" : "Set as Thumb"
                                )}
                             </button>
                          </div>

                          {isMediaSelected(m.id) && (
                            <div className="absolute top-1 right-1 bg-primary text-white rounded-full p-0.5 z-10">
                              <CheckCircle2 size={10} />
                            </div>
                          )}
                        </div>
                      ))}
                      
                      {/* Uploading States */}
                      {Object.entries(uploadingFiles).map(([id, progress]) => (
                        <div key={id} className="aspect-square rounded-lg border border-border bg-surface flex flex-col items-center justify-center gap-1 relative overflow-hidden">
                          <Loader2 className="h-4 w-4 animate-spin text-primary" />
                          <span className="text-[8px] font-bold text-text-muted uppercase tracking-widest">{progress}%</span>
                          <div className="absolute inset-x-0 bottom-0 h-1 bg-border">
                            <div 
                              className="h-full bg-primary transition-all duration-300" 
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    {((momentData?.media?.length || 0) >= maxAllowed) && (
                      <div className="mt-4 p-3 bg-red-50 dark:bg-red-950/10 border border-red-100 dark:border-red-900/20 rounded-xl space-y-3">
                        <div className="flex items-center gap-2">
                          <Lock className="text-red-500 shrink-0" size={14} />
                          <div className="min-w-0">
                            <p className="text-[10px] font-black text-red-600 dark:text-red-400">Limit Reached ({maxAllowed})</p>
                            <p className="text-[8px] text-text-muted font-bold truncate">You need more slots to upload.</p>
                          </div>
                        </div>
                        
                        {momentData?.plan === "base" && !momentData?.selectedAddons?.includes("extraMedia") && (
                          <button 
                            onClick={async () => {
                              const extraMediaAddon = ADDONS.find(a => a.id === "extraMedia");
                              if (!extraMediaAddon) return;
                              
                              const updatedAddons = [...(momentData?.selectedAddons || []), "extraMedia"];
                              await onSave({
                                selectedAddons: updatedAddons
                              });
                            }}
                            className="w-full bg-primary hover:bg-primary-dark text-white text-[9px] font-black uppercase tracking-widest py-2 rounded-lg shadow-sm transition-all active:scale-95"
                          >
                            Add 25 Extra Slots (+NGN {ADDONS.find(a => a.id === "extraMedia")?.price.NGN})
                          </button>
                        )}
                      </div>
                    )}
                  </section>
                </div>
              </div>
            </div>
          )}
          
          {/* Hidden Video Player for Audio Preview */}
          {playingId && (
            <iframe
              className="w-0 h-0 absolute opacity-0 pointer-events-none"
              src={`https://www.youtube.com/embed/${playingId}?autoplay=1`}
              allow="autoplay"
            />
          )}
        </div>
      </div>
    </div>
  );
}
