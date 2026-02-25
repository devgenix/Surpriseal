"use client";

import { useState, useEffect, useRef } from "react";
import { 
  Sparkles, 
  Music, 
  Layout, 
  Play, 
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
  Palette,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCreation } from "@/context/CreationContext";
import RevealEngine from "../reveal/RevealEngine";
import { Button } from "@/components/ui/button";
import { uploadFile, deleteFile } from "@/lib/upload";
import { auth } from "@/lib/firebase";
import AudioTrimmer from "./AudioTrimmer";
import { optimizeImage } from "@/lib/image";
import { Select } from "@/components/ui/Select";


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
  
  const [isUploadingMusic, setIsUploadingMusic] = useState(false);
  const [musicUploadProgress, setMusicUploadProgress] = useState(0);
  const musicInputRef = useRef<HTMLInputElement>(null);

  // YouTube Music Search State
  const [ytSearchQuery, setYtSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [ytResults, setYtResults] = useState<any[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  
  const [isProcessingThumbnail, setIsProcessingThumbnail] = useState<string | null>(null);

  useEffect(() => {
    setCanContinue(scenes.length > 0);
  }, [scenes, setCanContinue]);

  const style = momentData?.styleConfig || {};

  const handleMusicUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !auth.currentUser) return;

    try {
      setIsUploadingMusic(true);
      setMusicUploadProgress(0);

      const url = await uploadFile(
        file,
        `users/${auth.currentUser.uid}/moments/${draftId}/music/${file.name}`,
        (progress) => setMusicUploadProgress(Math.round(progress))
      );

      await onSave({
        styleConfig: {
          ...style,
          musicUrl: url
        }
      });
    } catch (error) {
      console.error("Music upload failed:", error);
    } finally {
      setIsUploadingMusic(false);
      setMusicUploadProgress(0);
    }
  };

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
      ? { ytMusicId: null, ytMetadata: null, musicUrl: null }
      : { 
          ytMusicId: song.videoId, 
          ytMetadata: song,
          musicUrl: `https://www.youtube.com/watch?v=${song.videoId}` // Fallback for legacy
        };
        
    updateSceneConfig(activeSceneId, updates);
  };

  const isMusicSelected = (videoId: string) => {
    return activeScene?.config?.ytMusicId === videoId;
  };

  const handleYTSearch = async () => {
    if (!ytSearchQuery.trim()) return;
    try {
      setIsSearching(true);
      const res = await fetch(`/api/yt-music/search?q=${encodeURIComponent(ytSearchQuery)}`);
      const data = await res.json();
      setYtResults(data.songs || []);
      setShowSearchResults(true);
    } catch (err) {
      console.error("YouTube search error:", err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSetThumbnail = async (media: any) => {
    if (!auth.currentUser) return;
    
    try {
      setIsProcessingThumbnail(media.id);
      
      // 1. Fetch the image and optimize it
      const response = await fetch(media.url);
      const blob = await response.blob();
      const file = new File([blob], "thumbnail.jpg", { type: "image/jpeg" });
      
      // Optimize to max 800px width and ~70% quality (targeting <100KB)
      const optimizedBlob = await optimizeImage(file, 800, 0.7);
      const optimizedFile = new File([optimizedBlob], "thumbnail_optimized.jpg", { type: "image/jpeg" });

      // 2. Upload to Firebase
      const path = `users/${auth.currentUser.uid}/moments/${draftId}/thumbnail.jpg`;
      const thumbnailUrl = await uploadFile(optimizedFile, path);

      // 3. Delete old thumbnail if it exists (Firestore might have a different URL)
      // Note: In this case, we overwrite the file at the same path if we use the same path, 
      // but let's be safe if the user changes strategy later.
      
      // 4. Update the moment
      await onSave({
        imageUrl: thumbnailUrl // Using imageUrl as the primary thumbnail field for the moment
      });
      
    } catch (err) {
      console.error("Thumbnail selection failed:", err);
    } finally {
      setIsProcessingThumbnail(null);
    }
  };

  const handleRemoveThumbnail = async () => {
    if (!auth.currentUser || !momentData?.imageUrl) return;
    
    try {
      setIsProcessingThumbnail("removing");
      
      // Delete from storage
      const path = `users/${auth.currentUser.uid}/moments/${draftId}/thumbnail.jpg`;
      await deleteFile(path);

      // Update doc
      await onSave({ imageUrl: null });
      
    } catch (err) {
      console.error("Thumbnail removal failed:", err);
    } finally {
      setIsProcessingThumbnail(null);
    }
  };

  const onSaveTheme = async (themeId: string) => {
    await onSave({
      styleConfig: {
        ...style,
        themeId
      }
    });
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
              <button
                key={scene.id}
                onClick={() => setActiveSceneId(scene.id)}
                className={cn(
                  "group flex items-center gap-3 p-3 rounded-xl text-left transition-all",
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
              </button>
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
                  
                  {/* Theme Selector */}
                  <section>
                    <Select
                      label="Visual Theme"
                      options={[
                        { id: "birthday-classic", title: "Birthday Classic", icon: "🎂" },
                        { id: "anniversary-gold", title: "Anniversary Gold", icon: "🍾" },
                        { id: "surprise-neon", title: "Surprise Neon", icon: "✨" },
                        { id: "elegant-noir", title: "Elegant Noir", icon: "🎩" },
                        { id: "romantic-rose", title: "Romantic Rose", icon: "❤️" },
                      ]}
                      value={style.themeId || "birthday-classic"}
                      onChange={onSaveTheme}
                      icon={Palette}
                    />
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

                  {/* Media Picker */}
                  <section>
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-4 flex items-center gap-2">
                      <ImageIcon size={12} />
                      Media Library
                    </h3>
                    <div className="grid grid-cols-3 gap-2">
                      {momentData?.media?.map((m: any) => (
                        <div 
                          key={m.id}
                          onClick={() => toggleMedia(m.id)}
                          className={cn(
                            "aspect-square rounded-lg overflow-hidden border-2 transition-all cursor-pointer relative",
                            isMediaSelected(m.id) ? "border-primary shadow-lg scale-95" : "border-border hover:border-primary/50"
                          )}
                        >
                          <img src={m.url} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-2">
                            <button 
                              onClick={(e) => { e.stopPropagation(); toggleMedia(m.id); }}
                              className="w-full bg-white/20 hover:bg-white/40 text-[8px] font-black text-white uppercase tracking-widest py-1 rounded-full backdrop-blur-sm"
                            >
                               {isMediaSelected(m.id) ? "Remove" : "Add to Scene"}
                            </button>
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleSetThumbnail(m); }}
                              disabled={isProcessingThumbnail === m.id}
                              className={cn(
                                "w-full bg-primary/80 hover:bg-primary text-[8px] font-black text-white uppercase tracking-widest py-1 rounded-full backdrop-blur-sm flex items-center justify-center gap-1",
                                momentData?.imageUrl === m.url && "bg-green-500/80 hover:bg-green-500"
                              )}
                            >
                               {isProcessingThumbnail === m.id ? (
                                 <Loader2 size={8} className="animate-spin" />
                               ) : (
                                 momentData?.imageUrl === m.url ? "Current Thumb" : "Set as Thumb"
                               )}
                            </button>
                            {momentData?.imageUrl === m.url && (
                              <button 
                                onClick={(e) => { e.stopPropagation(); handleRemoveThumbnail(); }}
                                disabled={isProcessingThumbnail === "removing"}
                                className="w-full bg-red-500/80 hover:bg-red-500 text-[8px] font-black text-white uppercase tracking-widest py-1 rounded-full backdrop-blur-sm"
                              >
                                {isProcessingThumbnail === "removing" ? <Loader2 size={8} className="animate-spin" /> : "Remove Thumb"}
                              </button>
                            )}
                          </div>
                          {isMediaSelected(m.id) && (
                            <div className="absolute top-1 right-1 bg-primary text-white rounded-full p-0.5">
                              <CheckCircle2 size={10} />
                            </div>
                          )}
                        </div>
                      ))}
                      {(!momentData?.media || momentData.media.length === 0) && (
                        <p className="col-span-3 text-[10px] text-text-muted font-bold italic py-4">
                          No media uploaded yet.
                        </p>
                      )}
                    </div>
                  </section>

                  {/* YouTube Music Search Section */}
                  <section>
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-4 flex items-center gap-2">
                      <Music size={12} />
                      YouTube Music Search
                    </h3>
                    
                    <div className="flex gap-2 mb-4">
                      <div className="relative flex-1">
                        <input 
                          type="text"
                          value={ytSearchQuery}
                          onChange={(e) => setYtSearchQuery(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && handleYTSearch()}
                          placeholder="Search for a song..."
                          className="w-full p-3 pr-10 rounded-xl bg-white border border-border text-xs focus:border-primary outline-none"
                        />
                        {isSearching && (
                          <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            <Loader2 size={14} className="animate-spin text-primary" />
                          </div>
                        )}
                      </div>
                      <Button 
                        size="sm" 
                        variant="secondary"
                        onClick={handleYTSearch}
                        className="rounded-xl px-4"
                      >
                        Search
                      </Button>
                    </div>

                    {showSearchResults && ytResults.length > 0 && (
                      <div className="flex flex-col gap-2 max-h-[250px] overflow-y-auto pr-1 mb-6 animate-in fade-in slide-in-from-top-2">
                        <div className="flex items-center justify-between mb-1 px-1">
                          <p className="text-[8px] font-black text-text-muted uppercase tracking-widest">Search Results</p>
                          <button onClick={() => setShowSearchResults(false)} className="text-[8px] font-bold text-primary hover:underline">Close</button>
                        </div>
                        {ytResults.map((song: any) => (
                          <div 
                            key={song.videoId}
                            onClick={() => toggleMusic(song)}
                            className={cn(
                              "flex items-center gap-3 p-2 rounded-xl border-2 transition-all cursor-pointer group",
                              isMusicSelected(song.videoId) ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                            )}
                          >
                            <div className="size-10 rounded-lg overflow-hidden bg-border/20 shrink-0">
                              <img src={song.thumbnail} className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[10px] font-bold text-text-main truncate">{song.title}</p>
                              <p className="text-[8px] text-text-muted font-bold truncate">{song.artist}</p>
                            </div>
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onSave({ styleConfig: { ...style, ytMusicId: song.videoId, ytMetadata: song } });
                                }}
                                className="text-[8px] font-black text-primary hover:underline uppercase"
                              >
                                Set Master
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Selected Music (Per Scene) */}
                    <div className="flex flex-col gap-2">
                      <p className="text-[8px] font-black text-text-muted uppercase tracking-widest px-1">Current Scene Track</p>
                      {activeScene?.config?.ytMetadata ? (
                        <div className="flex items-center gap-3 p-3 rounded-xl border-2 border-primary bg-primary/5 shadow-sm">
                          <div className="size-12 rounded-lg overflow-hidden shrink-0 shadow-lg ring-2 ring-white">
                            <img src={activeScene.config.ytMetadata.thumbnail} className="w-full h-full object-cover" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-bold text-text-main truncate">{activeScene.config.ytMetadata.title}</p>
                            <p className="text-[9px] text-primary font-black uppercase tracking-tighter">{activeScene.config.ytMetadata.artist}</p>
                          </div>
                          <button 
                            onClick={() => toggleMusic(activeScene.config.ytMetadata)}
                            className="text-text-muted hover:text-red-500 transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ) : (
                        <div className="p-4 rounded-xl border border-dashed border-border flex items-center justify-center gap-2 opacity-60">
                          <p className="text-[8px] font-black uppercase tracking-widest text-text-muted">No scene-specific track</p>
                        </div>
                      )}
                    </div>
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


                  {/* Master Music Section */}
                  <section className="flex flex-col gap-4 pt-4 border-t border-border">
                    <div className="flex items-center gap-2 mb-2">
                       <Settings className="text-primary" size={16} />
                       <h3 className="text-[10px] font-black uppercase tracking-widest text-text-muted">Master Background Music</h3>
                    </div>
                    
                    <div className="flex flex-col gap-3">
                      {style.ytMetadata ? (
                        <div className="p-4 rounded-xl bg-white border border-border shadow-sm flex items-center justify-between group">
                          <div className="flex items-center gap-3">
                            <div className="size-10 rounded-lg overflow-hidden shrink-0">
                               <img src={style.ytMetadata.thumbnail} className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1 overflow-hidden">
                              <p className="text-[10px] font-bold truncate">{style.ytMetadata.title}</p>
                              <p className="text-[8px] text-text-muted font-medium">Default for all screens</p>
                            </div>
                          </div>
                          <button 
                            onClick={async () => {
                              await onSave({
                                styleConfig: { ...style, ytMusicId: null, ytMetadata: null, musicUrl: null }
                              });
                            }}
                            className="text-text-muted hover:text-red-500 transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ) : (
                        <div className="p-4 rounded-xl border border-dashed border-border flex flex-col items-center justify-center gap-1 opacity-60">
                           <p className="text-[8px] font-black uppercase tracking-widest text-text-muted">No Master Track Set</p>
                        </div>
                      )}
                    </div>
                  </section>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
