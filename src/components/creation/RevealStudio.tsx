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
import { uploadFile } from "@/lib/upload";
import { auth } from "@/lib/firebase";
import AudioTrimmer from "./AudioTrimmer";
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

  const toggleMusic = (musicUrl: string) => {
    if (!activeScene) return;
    const currentMusicUrl = activeScene.config.musicUrl;
    const newMusicUrl = currentMusicUrl === musicUrl ? null : musicUrl;
    updateSceneConfig(activeSceneId, { musicUrl: newMusicUrl });
  };

  const isMusicSelected = (musicUrl: string) => {
    return activeScene?.config?.musicUrl === musicUrl;
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

                  {/* Music Library Section */}
                  <section>
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-4 flex items-center gap-2">
                      <Music size={12} />
                      Music Library
                    </h3>
                    <div className="flex flex-col gap-2">
                      {momentData?.music?.map((m: any) => (
                        <div 
                          key={m.id}
                          onClick={() => toggleMusic(m.url)}
                          className={cn(
                            "flex items-center gap-3 p-3 rounded-xl border-2 transition-all cursor-pointer",
                            isMusicSelected(m.url) ? "border-primary bg-primary/5 shadow-sm scale-[0.98]" : "border-border hover:border-primary/50"
                          )}
                        >
                          <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                            <Music2 size={16} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-bold text-text-main truncate">{m.name}</p>
                            <p className="text-[8px] text-text-muted uppercase font-bold tracking-tighter">Audio Track</p>
                          </div>
                          {isMusicSelected(m.url) && (
                            <div className="bg-primary text-white rounded-full p-0.5">
                              <CheckCircle2 size={10} />
                            </div>
                          )}
                        </div>
                      ))}
                      {(!momentData?.music || momentData.music.length === 0) && (
                        <p className="text-[10px] text-text-muted font-bold italic py-4">
                          No music uploaded to library yet.
                        </p>
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


                  {/* Global Music Selection (Legacy/Default) */}
                  <section className="flex flex-col gap-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Settings className="text-primary" size={16} />
                      <h3 className="text-[10px] font-black uppercase tracking-widest text-text-muted">Master Background Music</h3>
                    </div>
                    
                    <div className="flex flex-col gap-3">
                      {style.musicUrl ? (
                        <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="size-8 rounded-lg bg-primary text-white flex items-center justify-center">
                              <Play size={14} fill="currentColor" />
                            </div>
                            <div className="flex-1 overflow-hidden">
                              <p className="text-xs font-bold truncate">Default Track</p>
                              <p className="text-[10px] text-text-muted font-medium">Plays when no scene track is set</p>
                            </div>
                          </div>
                          <button 
                            onClick={async () => {
                              await onSave({
                                styleConfig: { ...style, musicUrl: null }
                              });
                            }}
                            className="text-text-muted hover:text-red-500 transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ) : (
                        <div 
                          onClick={() => musicInputRef.current?.click()}
                          className="p-8 rounded-xl border-2 border-dashed border-border hover:border-primary/50 hover:bg-primary/[0.02] transition-all cursor-pointer flex flex-col items-center justify-center gap-3"
                        >
                          {isUploadingMusic ? (
                             <>
                               <Loader2 className="animate-spin text-primary" size={20} />
                               <p className="text-[10px] font-bold text-primary">Uploading... {musicUploadProgress}%</p>
                             </>
                          ) : (
                             <>
                               <div className="size-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                                 <Plus size={16} />
                               </div>
                               <p className="text-[10px] font-bold text-text-muted uppercase">Set Master Music</p>
                             </>
                          )}
                        </div>
                      )}
                    </div>

                    <input 
                      type="file"
                      ref={musicInputRef}
                      onChange={handleMusicUpload}
                      accept="audio/*"
                      className="hidden"
                    />
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
