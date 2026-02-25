"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { db, auth } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { onAuthStateChanged, User } from "firebase/auth";
import { 
  Loader2, ArrowLeft, ArrowRight, Lock, Save, Trash2, 
  CheckCircle2, Image as ImageIcon, Search, Music2, UploadCloud, 
  Camera, HelpCircle, X, ChevronDown, Check, Play, Pause, Palette
} from "lucide-react";

import { useCreation } from "@/context/CreationContext";
import { Select } from "@/components/ui/Select";
import { cn } from "@/lib/utils";
import { useDebounce } from "@/hooks/useDebounce";
import { uploadFile } from "@/lib/upload";
import { getMediaLimit } from "@/lib/pricing-utils";
import { ADDONS } from "@/lib/constants/pricing";

export default function CreationSettingsPage() {
  const router = useRouter();
  const params = useParams();
  const { id: draftId } = params as { id: string };

  const { 
    momentData,
    setMomentData, 
    setSaving,
    setSaveError,
    setLastSaved,
    setCanContinue,
    setOnSave,
    setOnContinue,
  } = useCreation();

  const [localMomentData, setLocalMomentData] = useState<any>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Settings State
  const [themeId, setThemeId] = useState("");
  const [musicUrl, setMusicUrl] = useState("");
  const [ytMusicId, setYtMusicId] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  
  // Unlock Settings State
  const [unlockType, setUnlockType] = useState<"none" | "password" | "qa" | "face">("none");
  const [unlockPassword, setUnlockPassword] = useState("");
  const [unlockQuestion, setUnlockQuestion] = useState("");
  const [unlockAnswer, setUnlockAnswer] = useState("");
  const [unlockHint, setUnlockHint] = useState("");
  const [unlockFaceRef, setUnlockFaceRef] = useState("");

  const debouncedThemeId = useDebounce(themeId, 1000);
  const debouncedMusicUrl = useDebounce(musicUrl, 1000);
  const debouncedYtMusicId = useDebounce(ytMusicId, 1000);
  const debouncedImageUrl = useDebounce(imageUrl, 1000);
  
  const debouncedUnlockPassword = useDebounce(unlockPassword, 1000);
  const debouncedUnlockQuestion = useDebounce(unlockQuestion, 1000);
  const debouncedUnlockAnswer = useDebounce(unlockAnswer, 1000);
  const debouncedUnlockHint = useDebounce(unlockHint, 1000);

  // Thumbnail Library State
  const [thumbnailMode, setThumbnailMode] = useState<"upload" | "library">("upload");
  const [showImageLibrary, setShowImageLibrary] = useState(false);

  // YouTube Music Search State
  const [ytSearchQuery, setYtSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(ytSearchQuery, 500);
  const [isSearching, setIsSearching] = useState(false);
  const [ytResults, setYtResults] = useState<any[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  // Click outside search results
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchResults(false);
        setPlayingId(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const formatDuration = (seconds: number | string) => {
    const s = typeof seconds === 'string' ? parseInt(seconds) : seconds;
    if (isNaN(s)) return seconds;
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleYTSearch = useCallback(async (query: string) => {
    if (!query || query.length < 2) return;
    setIsSearching(true);
    try {
      const res = await fetch(`/api/yt-music/search?q=${encodeURIComponent(query)}`);
      if (!res.ok) throw new Error("Search failed");
      const data = await res.json();
      setYtResults(data.songs || []);
      setShowSearchResults(true);
    } catch (err) {
      console.error("Music search failed:", err);
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

  const toggleMusic = (song: any) => {
    const isSelected = ytMusicId === song.videoId;
    
    // If clicking an already selected song, just close the search box
    if (isSelected) {
      setShowSearchResults(false);
      setYtSearchQuery("");
      return;
    }

    setYtMusicId(song.videoId);
    setMusicUrl(song.url || "");
    setShowSearchResults(false);
    setYtSearchQuery("");
    
    const metadata = {
      title: song.title || "Unknown Title",
      artist: song.author || song.artist || "Unknown Artist",
      thumbnail: song.thumbnail || "",
      duration: song.duration || ""
    };

    setPlayingId(null); // Stop any preview

    saveDraft({
      styleConfig: {
        ...momentData?.styleConfig,
        ytMusicId: song.videoId,
        musicUrl: song.url || "",
        musicMetadata: metadata
      }
    });
  };

  // Auth check
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (!u) router.push("/login");
    });
    return () => unsubscribe();
  }, [router]);

  // Load draft data
  useEffect(() => {
    async function loadDraft() {
      if (!draftId || !user) return;
      try {
        const docRef = doc(db, "moments", draftId);
        const docSnap = await getDoc(docRef);
        
        if (!docSnap.exists()) {
          router.push("/dashboard");
          return;
        }

        const data = docSnap.data();
        setLocalMomentData(data);
        setMomentData(data);
        
        // Load Settings
        const styleConfig = data.styleConfig || {};
        setThemeId(styleConfig.themeId || "");
        setMusicUrl(styleConfig.musicUrl || "");
        setYtMusicId(styleConfig.ytMusicId || "");
        
        setImageUrl(data.imageUrl || "");
        
        // Ensure styleConfig has a default structure
        if (!data.styleConfig) {
          setMomentData((prev: any) => ({ ...prev, styleConfig: {} }));
        }
        
        // Load Unlock Data
        const unlockConfig = data.unlockConfig || {};
        setUnlockType(unlockConfig.type || "none");
        setUnlockPassword(unlockConfig.password || "");
        setUnlockQuestion(unlockConfig.question || "");
        setUnlockAnswer(unlockConfig.answer || "");
        setUnlockHint(unlockConfig.hint || "");
        setUnlockFaceRef(unlockConfig.faceRef || "");
        
        setLoading(false);
      } catch (err) {
        console.error("Error loading draft:", err);
      }
    }
    if (user) loadDraft();
  }, [draftId, user, router, setMomentData]);

  // Save logic
  const saveDraft = useCallback(async (updates: any = {}) => {
    if (!draftId) return;
    setSaving(true);
    setSaveError(false);

    try {
      const docRef = doc(db!, "moments", draftId);
      await updateDoc(docRef, updates);

      setLocalMomentData((prev: any) => {
        const merged = {
          ...prev,
          ...updates,
        };

        if (updates.styleConfig) {
          merged.styleConfig = {
            ...(prev?.styleConfig || {}),
            ...updates.styleConfig
          };
        }
        
        if (updates.unlockConfig) {
          merged.unlockConfig = {
            ...(prev?.unlockConfig || {}),
            ...updates.unlockConfig
          };
        }

        return merged;
      });

      setMomentData((prev: any) => {
        const merged = {
          ...prev,
          ...updates,
        };

        if (updates.styleConfig) {
          merged.styleConfig = {
            ...(prev?.styleConfig || {}),
            ...updates.styleConfig
          };
        }
        
        return merged;
      });

      setLastSaved(new Date());
    } catch (err) {
      console.error("Error saving draft:", err);
      setSaveError(true);
    } finally {
      setSaving(false);
    }
  }, [draftId, setSaving, setSaveError, setLastSaved, setMomentData]);

  useEffect(() => {
    setOnSave(() => saveDraft);
    return () => setOnSave(null);
  }, [saveDraft, setOnSave]);

  // Auto-save logic
  useEffect(() => {
    if (loading || !localMomentData) return;

    let hasChanges = false;
    const updates: any = {};
    const styleUpdates: any = {};
    const unlockUpdates: any = {};

    if (debouncedThemeId !== (localMomentData.styleConfig?.themeId || "")) {
      styleUpdates.themeId = debouncedThemeId;
      hasChanges = true;
    }
    if (debouncedMusicUrl !== (localMomentData.styleConfig?.musicUrl || "")) {
      styleUpdates.musicUrl = debouncedMusicUrl;
      hasChanges = true;
    }
    if (debouncedYtMusicId !== (localMomentData.styleConfig?.ytMusicId || "")) {
      styleUpdates.ytMusicId = debouncedYtMusicId;
      hasChanges = true;
    }
    if (debouncedImageUrl !== (localMomentData.imageUrl || "")) {
      updates.imageUrl = debouncedImageUrl;
      hasChanges = true;
    }
    
    // Unlock config changes
    if (unlockType !== (localMomentData.unlockConfig?.type || "none")) {
      unlockUpdates.type = unlockType;
      hasChanges = true;
    }
    if (debouncedUnlockPassword !== (localMomentData.unlockConfig?.password || "")) {
      unlockUpdates.password = debouncedUnlockPassword;
      hasChanges = true;
    }
    if (debouncedUnlockQuestion !== (localMomentData.unlockConfig?.question || "")) {
      unlockUpdates.question = debouncedUnlockQuestion;
      hasChanges = true;
    }
    if (debouncedUnlockAnswer !== (localMomentData.unlockConfig?.answer || "")) {
      unlockUpdates.answer = debouncedUnlockAnswer;
      hasChanges = true;
    }
    if (debouncedUnlockHint !== (localMomentData.unlockConfig?.hint || "")) {
      unlockUpdates.hint = debouncedUnlockHint;
      hasChanges = true;
    }
    if (unlockFaceRef !== (localMomentData.unlockConfig?.faceRef || "")) {
      unlockUpdates.faceRef = unlockFaceRef;
      hasChanges = true;
    }

    if (hasChanges) {
      if (Object.keys(styleUpdates).length > 0) updates.styleConfig = { ...localMomentData.styleConfig, ...styleUpdates };
      if (Object.keys(unlockUpdates).length > 0) updates.unlockConfig = { ...localMomentData.unlockConfig, ...unlockUpdates };
      
      saveDraft(updates);
    }
  }, [
    loading, localMomentData, debouncedThemeId, debouncedMusicUrl, debouncedYtMusicId, 
    debouncedImageUrl, unlockType, debouncedUnlockPassword, debouncedUnlockQuestion, 
    debouncedUnlockAnswer, debouncedUnlockHint, unlockFaceRef, saveDraft
  ]);

  // Validation
  useEffect(() => {
    let isValid = true;
    if (unlockType === "password" && unlockPassword.trim().length === 0) isValid = false;
    if (unlockType === "qa" && (unlockQuestion.trim().length === 0 || unlockAnswer.trim().length === 0)) isValid = false;
    if (unlockType === "face" && unlockFaceRef.trim().length === 0) isValid = false;
    
    setCanContinue(isValid);
  }, [unlockType, unlockPassword, unlockQuestion, unlockAnswer, unlockFaceRef, setCanContinue]);

  const onContinueAction = useCallback(async () => {
    if (!draftId) return;
    const docRef = doc(db!, "moments", draftId);
    await updateDoc(docRef, { 
      lastStepId: "style",
      completedSteps: Array.from(new Set([...(momentData?.completedSteps || []), "settings"]))
    });
    router.push(`/dashboard/create/${draftId}/style`);
  }, [draftId, router, momentData]);

  useEffect(() => {
    setOnContinue(() => onContinueAction);
    return () => setOnContinue(null);
  }, [onContinueAction, setOnContinue]);

  const [uploadingFace, setUploadingFace] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // File Upload Handlers
  const handleFaceUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !auth.currentUser) return;
    
    setUploadingFace(true);
    try {
      const tempId = Math.random().toString(36).substr(2, 9);
      const path = `users/${auth.currentUser.uid}/moments/${draftId}/face-${tempId}-${file.name}`;
      const downloadURL = await uploadFile(file, path);
      setUnlockFaceRef(downloadURL);
    } catch (error) {
      console.error("Face upload failed:", error);
    } finally {
      setUploadingFace(false);
    }
  };

  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !auth.currentUser) return;
    
    // Check plan limits
    const maxAllowed = getMediaLimit(momentData);
    const currentCount = momentData?.media?.length || 0;
    if (currentCount >= maxAllowed) {
       // Handled by UI now, but keeping for safety
       return;
    }

    setUploadingImage(true);
    try {
      const tempId = Math.random().toString(36).substr(2, 9);
      const path = `users/${auth.currentUser.uid}/moments/${draftId}/thumb-${tempId}-${file.name}`;
      const downloadURL = await uploadFile(file, path);
      setImageUrl(downloadURL);

      // Also add to the moment's media library
      const newMediaItem = {
        id: tempId,
        url: downloadURL,
        type: "image",
        name: file.name,
        createdAt: new Date().toISOString()
      };

      const updatedMedia = [...(momentData?.media || []), newMediaItem];
      await saveDraft({ 
        imageUrl: downloadURL,
        media: updatedMedia 
      });
    } catch (error) {
      console.error("Thumbnail upload failed:", error);
    } finally {
      setUploadingImage(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex-1 w-full max-w-4xl mx-auto px-4 lg:px-0 py-10 space-y-12">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-black text-[#1b110e] dark:text-white tracking-tight">Reveal Settings</h1>
        <p className="text-text-muted font-medium text-lg leading-relaxed">
          Configure global defaults and choose how the recipient unlocks this moment.
        </p>
      </div>

      <div className="space-y-8">
          
          {/* Section 1: Global Theme & Thumbnail */}
          <div className="bg-surface border border-border rounded-lg p-6 space-y-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <ImageIcon size={20} className="text-primary" />
              Global Aesthetics
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Theme Selector */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-text-main">Global Visual Theme</label>
                  <p className="text-xs text-text-muted">Applied to screens unless overridden in Reveal Studio.</p>
                  <Select
                    icon={Palette}
                    options={[
                      { id: "birthday-classic", title: "Birthday Classic" },
                      { id: "anniversary-gold", title: "Anniversary Gold" },
                      { id: "surprise-neon", title: "Surprise Neon" },
                      { id: "elegant-noir", title: "Elegant Noir" },
                      { id: "romantic-rose", title: "Romantic Rose" },
                    ]}
                    value={themeId || "birthday-classic"}
                    onChange={setThemeId}
                    placeholder="Select global theme"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-text-main">Global Audio Track</label>
                  <p className="text-xs text-text-muted">Applied to screens unless overridden in Reveal Studio.</p>
                  
                  <div className="relative" ref={searchRef}>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
                      <input 
                        type="text" 
                        placeholder="Search for a song..."
                        className="w-full h-11 pl-10 pr-10 rounded-lg border border-border bg-white dark:bg-black text-sm font-medium outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all"
                        value={ytSearchQuery}
                        onChange={(e) => setYtSearchQuery(e.target.value)}
                        onFocus={() => {
                          if (ytSearchQuery.length >= 2) {
                            setShowSearchResults(true);
                            if (ytResults.length === 0) handleYTSearch(ytSearchQuery);
                          }
                        }}
                      />
                      {isSearching && (
                          <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            <Loader2 size={14} className="animate-spin text-primary" />
                          </div>
                      )}
                    </div>

                    {showSearchResults && ytResults.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-white dark:bg-black border border-border rounded-lg overflow-hidden max-h-60 overflow-y-auto divide-y divide-border shadow-2xl animate-in fade-in slide-in-from-top-2">
                        {ytResults.map((song) => {
                          const isSelected = ytMusicId === song.videoId;
                          return (
                            <div 
                              key={song.videoId}
                              onClick={() => toggleMusic(song)}
                              className={cn(
                                "p-3 flex items-center gap-3 cursor-pointer transition-all",
                                isSelected ? "bg-primary/10" : "hover:bg-black/5"
                              )}
                            >
                              <img src={song.thumbnail} className="size-10 rounded-md object-cover" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold truncate text-[#1b110e] dark:text-white">{song.title}</p>
                                <p className="text-xs text-text-muted truncate">{song.author}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setPlayingId(playingId === song.videoId ? null : song.videoId);
                                  }}
                                  className="size-8 rounded-md bg-primary/10 text-primary flex items-center justify-center hover:bg-primary hover:text-white transition-all"
                                >
                                  {playingId === song.videoId ? (
                                    <Pause size={14} fill="currentColor" />
                                  ) : (
                                    <Play size={14} fill="currentColor" className="ml-0.5" />
                                  )}
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {ytMusicId && !showSearchResults && (
                    <div className="p-4 rounded-lg bg-white dark:bg-black border border-border shadow-md flex items-center gap-4 animate-in zoom-in-95 group relative">
                      <div className="relative size-16 shrink-0 rounded-lg overflow-hidden shadow-inner group transition-all">
                        <img 
                          src={
                            momentData?.styleConfig?.musicMetadata?.thumbnail || 
                            "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=160&h=160&fit=crop"
                          } 
                          className="w-full h-full object-cover"
                        />

                        {/* Hover Overlay */}
                        <div className="absolute inset-0 bg-black/30 opacity-100 transition-opacity duration-300" />

                        {/* Always Visible Button */}
                        <div className="absolute inset-0 flex items-center justify-center">
                          <button 
                            onClick={() => setPlayingId(playingId === ytMusicId ? null : ytMusicId)}
                            className="size-10 flex items-center justify-center transition-all duration-500  active:scale-95 hover:scale-150"
                          >
                            {playingId === ytMusicId 
                              ? <Pause size={18} className="text-white" fill="currentColor" /> 
                              : <Play size={18} className="text-white ml-0.5" fill="currentColor" />
                            }
                          </button>
                        </div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-black text-[#1b110e] dark:text-white truncate">
                          {momentData?.styleConfig?.musicMetadata?.title || "Selected Track"}
                        </h4>
                        <p className="text-xs text-text-muted font-bold truncate">
                          {momentData?.styleConfig?.musicMetadata?.artist || "YouTube Music"}
                        </p>
                        {momentData?.styleConfig?.musicMetadata?.duration && (
                           <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full mt-1 inline-block font-black">
                             {formatDuration(momentData.styleConfig.musicMetadata.duration)}
                           </span>
                        )}
                      </div>

                      <div className="flex">
                        <button 
                          onClick={() => { setYtMusicId(""); setMusicUrl(""); setPlayingId(null); }}
                          className="size-10 rounded-lg text-red-500 hover:bg-red-50 flex items-center justify-center transition-all duration-300 active:scale-95"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Thumbnail Upload */}
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <label className="text-sm font-bold text-text-main">Cover Image (Thumbnail)</label>
                    <p className="text-xs text-text-muted">Preview image shown before unlocking.</p>
                  </div>
                  
                  {/* Segmented Control */}
                  {!imageUrl && (
                    <div className="flex items-center p-1 bg-black/5 dark:bg-white/5 border border-border rounded-lg shrink-0">
                      <button
                        onClick={() => setThumbnailMode("upload")}
                        className={cn(
                          "px-4 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-md transition-all",
                          thumbnailMode === "upload" 
                            ? "bg-white dark:bg-black text-primary shadow-sm" 
                            : "text-text-muted hover:text-text-main"
                        )}
                      >
                        Upload
                      </button>
                      <button
                        onClick={() => setThumbnailMode("library")}
                        className={cn(
                          "px-4 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-md transition-all",
                          thumbnailMode === "library" 
                            ? "bg-white dark:bg-black text-primary shadow-sm" 
                            : "text-text-muted hover:text-text-main"
                        )}
                      >
                        Library
                      </button>
                    </div>
                  )}
                </div>
                
                {imageUrl ? (
                  <div className="relative aspect-video rounded-lg border border-border overflow-hidden group shadow-lg">
                    <img src={imageUrl} alt="Cover" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                      <button onClick={() => setImageUrl("")} className="bg-red-500 hover:bg-red-600 text-white text-xs font-bold px-6 py-2.5 rounded-full flex items-center gap-2 shadow-xl hover:scale-105 transition-all">
                        <Trash2 size={16} /> Remove Cover
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="animate-in fade-in slide-in-from-top-2">
                    {thumbnailMode === "upload" ? (
                      <div>
                        {momentData?.media?.length >= getMediaLimit(momentData) ? (
                          <div className="aspect-video w-full rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center gap-4 bg-red-50 dark:bg-red-950/10 p-6 text-center">
                            <div className="size-12 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                              <Lock className="text-red-500" size={24} />
                            </div>
                            <div className="space-y-1">
                              <p className="text-sm font-black text-red-600 dark:text-red-400">Media Limit Reached</p>
                              <p className="text-[10px] text-text-muted font-bold">You've used all {getMediaLimit(momentData)} slots.</p>
                            </div>
                            {momentData?.plan === "base" && !momentData?.selectedAddons?.includes("extraMedia") && (
                              <button 
                                onClick={async () => {
                                  const extraMediaAddon = ADDONS.find(a => a.id === "extraMedia");
                                  if (!extraMediaAddon) return;
                                  
                                  const updatedAddons = [...(momentData?.selectedAddons || []), "extraMedia"];
                                  await saveDraft({
                                    selectedAddons: updatedAddons
                                  });
                                }}
                                className="bg-primary hover:bg-primary-dark text-white text-[10px] font-black uppercase tracking-widest px-6 py-2.5 rounded-full shadow-lg shadow-primary/20 transition-all active:scale-95"
                              >
                                Add 25 Extra Slots (+NGN 2000)
                              </button>
                            )}
                          </div>
                        ) : (
                          <label className="aspect-video w-full rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center gap-3 bg-primary/5 cursor-pointer hover:bg-primary/10 transition-all group overflow-hidden relative">
                            {uploadingImage ? (
                              <div className="flex flex-col items-center gap-3">
                                <Loader2 className="animate-spin text-primary" size={32} />
                                <span className="text-xs font-bold text-primary animate-pulse">Uploading magic...</span>
                              </div>
                            ) : (
                              <>
                                <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                                  <UploadCloud className="text-primary" size={24} />
                                </div>
                                <div className="text-center">
                                  <span className="text-sm font-bold text-primary block">Drop image here or click</span>
                                  <span className="text-[10px] text-text-muted font-bold">PNG, JPG up to 10MB</span>
                                </div>
                              </>
                            )}
                            <input type="file" accept="image/*" onChange={handleThumbnailUpload} className="hidden" />
                          </label>
                        )}
                      </div>
                    ) : (
                      <div className="p-6 border border-border rounded-lg bg-black/5 dark:bg-white/5 space-y-4 shadow-inner min-h-[160px]">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black uppercase tracking-widest text-text-muted">Your Moment Images</span>
                          <ImageIcon size={14} className="text-text-muted" />
                        </div>
                        
                        {momentData?.media?.filter((m: any) => m.type === "image").length > 0 ? (
                          <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
                            {momentData.media.filter((m: any) => m.type === "image").map((img: any) => (
                              <div 
                                key={img.id} 
                                onClick={() => setImageUrl(img.url)}
                                className="aspect-square rounded-lg overflow-hidden border-2 border-transparent hover:border-primary hover:scale-110 cursor-pointer transition-all shadow-sm"
                              >
                                <img src={img.url} alt="Gallery" className="w-full h-full object-cover" />
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center py-8 text-center space-y-2">
                            <ImageIcon size={32} className="text-text-muted/20" />
                            <p className="text-xs text-text-muted font-bold">No images uploaded yet.</p>
                            <button 
                              onClick={() => setThumbnailMode("upload")}
                              className="text-[10px] font-black text-primary hover:underline uppercase tracking-tighter"
                            >
                              Go to Upload
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Section 2: Unlock Mechanism */}
          <div className="bg-surface border border-border rounded-lg overflow-hidden p-6 space-y-6">
            <div className="space-y-2">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Lock size={20} className="text-primary" />
                Security & Unlocking
              </h2>
              <p className="text-sm text-text-muted">How should the recipient access this reveal?</p>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { id: "none", title: "None", desc: "Open Instantly", icon: CheckCircle2 },
                { id: "password", title: "Password", desc: "Static Pin", icon: Lock },
                { id: "qa", title: "Q & A", desc: "Riddle or Question", icon: HelpCircle },
                { id: "face", title: "Face Match", desc: "AI Recognition", icon: Camera },
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => setUnlockType(m.id as any)}
                  className={cn(
                    "flex flex-col items-center gap-2 p-4 rounded-lg border transition-all",
                    unlockType === m.id 
                      ? "bg-primary/5 border-primary ring-1 ring-primary/20 text-primary" 
                      : "bg-surface border-border text-text-muted hover:border-text-muted"
                  )}
                >
                  <m.icon size={24} className={unlockType === m.id ? "text-primary" : "text-text-muted"} />
                  <span className="text-xs font-bold mt-1 text-[#1b110e] dark:text-white">{m.title}</span>
                  <span className="text-[10px] text-center leading-tight hidden sm:block">{m.desc}</span>
                </button>
              ))}
            </div>

            {/* Dynamic Config Area */}
            <div className="pt-4 border-t border-border">
              {unlockType === "none" && (
                <div className="flex items-center gap-3 text-sm text-text-muted font-medium bg-primary/5 p-4 rounded-lg border border-primary/10">
                  <CheckCircle2 className="text-primary shrink-0" size={18} />
                  <p>The moment will open immediately when the recipient clicks the link.</p>
                </div>
              )}

              {unlockType === "password" && (
                <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                  <div className="space-y-1">
                    <label className="text-sm font-bold">Set Password</label>
                    <input 
                      type="text"
                      value={unlockPassword}
                      onChange={(e) => setUnlockPassword(e.target.value)}
                      placeholder="e.g. 1994 or secretword"
                      className="w-full h-12 px-4 bg-white dark:bg-black border border-border rounded-lg text-text-main focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none"
                    />
                  </div>
                </div>
              )}

              {unlockType === "qa" && (
                <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                  <div className="space-y-1">
                    <label className="text-sm font-bold">Question / Riddle</label>
                    <input 
                      type="text"
                      value={unlockQuestion}
                      onChange={(e) => setUnlockQuestion(e.target.value)}
                      placeholder="e.g. What's the name of our first pet?"
                      className="w-full h-12 px-4 bg-white dark:bg-black border border-border rounded-lg text-text-main focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-bold">Exact Answer</label>
                    <input 
                      type="text"
                      value={unlockAnswer}
                      onChange={(e) => setUnlockAnswer(e.target.value.toLowerCase())}
                      placeholder="e.g. fluffy (case insensitive)"
                      className="w-full h-12 px-4 bg-white dark:bg-black border border-border rounded-lg text-text-main focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-bold text-text-muted">Hint (Optional)</label>
                    <input 
                      type="text"
                      value={unlockHint}
                      onChange={(e) => setUnlockHint(e.target.value)}
                      placeholder="e.g. Starts with F, ends with Y"
                      className="w-full h-12 px-4 bg-white/50 dark:bg-black/50 border border-border rounded-lg text-text-main focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none"
                    />
                  </div>
                </div>
              )}

              {unlockType === "face" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-top-2">
                  <div className="space-y-2">
                    <label className="text-sm font-bold">Target Face (Reference)</label>
                    <p className="text-xs text-text-muted leading-relaxed">
                      Upload a clear picture with a face. When they open the link, we'll ask them to upload a picture with a face to match!
                    </p>
                    {unlockFaceRef ? (
                      <div className="relative aspect-square max-w-[200px] rounded-lg border border-border overflow-hidden group">
                        <img src={unlockFaceRef} alt="Face Ref" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <button onClick={() => setUnlockFaceRef("")} className="bg-red-500 hover:bg-red-600 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg flex items-center gap-1">
                            <Trash2 size={12} /> Remove
                          </button>
                        </div>
                      </div>
                    ) : (
                      <label className="aspect-square max-w-[200px] w-full rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center gap-2 bg-primary/5 cursor-pointer hover:bg-primary/10 transition-colors group">
                        {uploadingFace ? (
                          <Loader2 className="animate-spin text-primary" size={24} />
                        ) : (
                          <>
                            <Camera className="text-primary group-hover:scale-110 transition-transform" size={24} />
                            <span className="text-xs font-bold text-primary">Upload Face</span>
                          </>
                        )}
                        <input type="file" accept="image/*" onChange={handleFaceUpload} className="hidden" />
                      </label>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="text-sm font-bold text-text-muted">Hint / Instruction (Optional)</label>
                    <textarea 
                      rows={4}
                      value={unlockHint}
                      onChange={(e) => setUnlockHint(e.target.value)}
                      placeholder="e.g. Make sure you're in good lighting and smile at the camera!"
                      className="w-full p-4 bg-white/50 dark:bg-black/50 border border-border rounded-lg text-text-main focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none resize-none"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
      </div>
      {/* Hidden Audio Preview */}
      {playingId && (
        <iframe
          width="0"
          height="0"
          src={`https://www.youtube.com/embed/${playingId}?autoplay=1&hidden=1`}
          allow="autoplay; encrypted-media"
          className="hidden"
        />
      )}
    </div>
  );
}
