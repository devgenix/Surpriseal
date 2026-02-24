"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { db, auth } from "@/lib/firebase";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { onAuthStateChanged, User } from "firebase/auth";
import { 
  Loader2, 
  Smile, 
  ImagePlus, 
  X,
  Plus,
  Type,
  ImageIcon,
  Video,
  Music,
  AlertCircle,
  Upload,
  Music2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCreation } from "@/context/CreationContext";
import { useDebounce } from "@/hooks/useDebounce";
import { uploadFile } from "@/lib/upload";

export default function CreationContentPage() {
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

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Form State
  const [personalMessage, setPersonalMessage] = useState("");
  const [media, setMedia] = useState<any[]>([]);
  const [music, setMusic] = useState<any[]>([]);
  const [recipientName, setRecipientName] = useState("");
  const [uploadingFiles, setUploadingFiles] = useState<Record<string, number>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const musicInputRef = useRef<HTMLInputElement>(null);

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
        // Fetch from moments collection
        const docRef = doc(db, "moments", draftId);
        const docSnap = await getDoc(docRef);
        
        if (!docSnap.exists()) {
          router.push("/dashboard");
          return;
        }

        const data = docSnap.data();
        setMomentData(data);
        setPersonalMessage(data.personalMessage || "");
        setMedia(data.media || []);
        setMusic(data.music || []);
        setRecipientName(data.recipientName || "them");
        setLoading(false);
      } catch (err) {
        console.error("Error loading draft:", err);
      }
    }
    if (user) loadDraft();
  }, [draftId, user, router, setMomentData]);

  // Debounced Save Logic
  const debouncedMessage = useDebounce(personalMessage, 1000);
  
  const saveDraft = useCallback(async (updates: any) => {
    if (!draftId) return;
    setSaving(true);
    setSaveError(false);
    try {
      const docRef = doc(db!, "moments", draftId);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      });

      // Update local context state for immediate feedback
      setMomentData((prev: any) => {
        if (!prev) return prev;
        
        // Handle nested styleConfig updates (though less common in this page)
        if (updates.styleConfig && prev.styleConfig) {
          return {
            ...prev,
            ...updates,
            styleConfig: {
              ...prev.styleConfig,
              ...updates.styleConfig
            }
          };
        }
        
        return {
          ...prev,
          ...updates
        };
      });

      setLastSaved(new Date());
    } catch (err) {
      console.error("Error saving draft:", err);
      setSaveError(true);
    } finally {
      setSaving(false);
    }
  }, [draftId, setSaving, setSaveError, setLastSaved, setMomentData]);

  // Handle auto-save for message
  useEffect(() => {
    if (loading) return;
    saveDraft({ personalMessage: debouncedMessage });
  }, [debouncedMessage, saveDraft, loading]);

  // Handle auto-save for media deletions/additions
  // We use a separate useEffect to avoid race conditions during batch uploads
  const debouncedMedia = useDebounce(media, 1000);
  const debouncedMusic = useDebounce(music, 1000);

  useEffect(() => {
    if (loading) return;
    saveDraft({ 
      media: debouncedMedia,
      music: debouncedMusic 
    });
  }, [debouncedMedia, debouncedMusic, saveDraft, loading]);

  // Handle Validation
  useEffect(() => {
    // For MVP, we require at least a message
    const isValid = personalMessage.trim().length > 10;
    setCanContinue(isValid);
  }, [personalMessage, setCanContinue]);

  const stateRef = useRef({ personalMessage, media, music });
  useEffect(() => {
    stateRef.current = { personalMessage, media, music };
  }, [personalMessage, media, music]);

  const onSaveAction = useCallback(async () => {
    await saveDraft(stateRef.current);
  }, [saveDraft]);

  const onContinueAction = useCallback(async () => {
    const docRef = doc(db!, "moments", draftId);
    await updateDoc(docRef, { 
      personalMessage,
      media,
      music,
      lastStepId: "style",
      completedSteps: Array.from(new Set([...(momentData?.completedSteps || []), "content"]))
    });
    router.push(`/dashboard/create/${draftId}/style`);
  }, [personalMessage, media, music, draftId, momentData, router]);

  useEffect(() => {
    setOnSave(() => onSaveAction);
    setOnContinue(() => onContinueAction);
    return () => {
      setOnSave(null);
      setOnContinue(null);
    };
  }, [onSaveAction, onContinueAction, setOnSave, setOnContinue]);

  const isPremium = momentData?.plan === "premium";
  const hasUnlimitedAddon = (momentData?.selectedAddons || []).includes("extraMedia");
  const isUnlimited = isPremium || hasUnlimitedAddon;
  const maxAllowed = isUnlimited ? 999 : 20;
  const currentTotal = (media?.length || 0) + (music?.length || 0);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !user) return;

    const remainingSlots = Math.max(0, maxAllowed - currentTotal);
    const filesToUpload = Array.from(files).slice(0, remainingSlots);

    for (const file of filesToUpload) {
      const tempId = Math.random().toString(36).substr(2, 9);
      const path = `users/${user.uid}/moments/${draftId}/${tempId}-${file.name}`;
      
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

        setMedia(prev => [...prev, newMediaItem]);
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

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleMusicUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !user) return;

    const remainingSlots = Math.max(0, maxAllowed - currentTotal);
    const filesToUpload = Array.from(files).slice(0, remainingSlots);

    for (const file of filesToUpload) {
      const tempId = Math.random().toString(36).substr(2, 9);
      const path = `users/${user.uid}/moments/${draftId}/music/${tempId}-${file.name}`;
      
      setUploadingFiles(prev => ({ ...prev, [tempId]: 0 }));

      try {
        const downloadURL = await uploadFile(file, path, (progress) => {
          setUploadingFiles(prev => ({ ...prev, [tempId]: Math.round(progress) }));
        });

        const newMusicItem = {
          id: tempId,
          type: "audio",
          url: downloadURL,
          name: file.name,
          uploadedAt: new Date().toISOString()
        };

        setMusic(prev => [...prev, newMusicItem]);
      } catch (error) {
        console.error("Music upload failed:", error);
      } finally {
        setUploadingFiles(prev => {
          const newState = { ...prev };
          delete newState[tempId];
          return newState;
        });
      }
    }

    if (musicInputRef.current) musicInputRef.current.value = "";
  };

  const removeMedia = (id: string) => {
    setMedia(prev => prev.filter(m => m.id !== id));
  };

  const removeMusic = (id: string) => {
    setMusic(prev => prev.filter(m => m.id !== id));
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex-1 w-full max-w-4xl mx-auto px-4 lg:px-0 py-10">
      <div className="w-full flex flex-col items-center sm:items-start animate-in fade-in slide-in-from-bottom-4 duration-700">
        
        {/* Header Section */}
        <div className="mb-10 text-center sm:text-left w-full">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#1b110e] dark:text-white mb-3 tracking-tight">
            Content Library
          </h1>
          <p className="text-lg text-[#97604e] font-medium">
            Collect all the memories and music that'll power your reveal.
          </p>
        </div>

        <div className="w-full grid grid-cols-1 gap-12">
          
          {/* Message Section */}
          <section className="flex flex-col gap-4">
            <div className="flex items-center gap-2 mb-2">
              <h2 className="text-xl font-bold text-[#1b110e] dark:text-white">Personal Message</h2>
            </div>
            
            <div className="relative group">
              <textarea 
                value={personalMessage}
                onChange={(e) => setPersonalMessage(e.target.value)}
                className="w-full min-h-[250px] p-6 bg-white dark:bg-white/5 border border-[#e7d6d0] rounded-lg text-[#1b110e] dark:text-white placeholder:text-[#97604e]/30 focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all outline-none resize-none text-lg leading-relaxed shadow-sm font-medium"
                placeholder={`Dear ${recipientName}, I wanted to share something special with you...`}
              />
              <div className="absolute bottom-4 right-4 text-[10px] font-bold text-[#97604e] bg-white/50 backdrop-blur-sm px-2 py-1 rounded-md border border-[#e7d6d0]/50 uppercase tracking-widest">
                {personalMessage.length} characters
              </div>
            </div>
            {personalMessage.length > 0 && personalMessage.length < 10 && (
              <p className="text-[10px] text-amber-600 font-bold flex items-center gap-1 ml-1 animate-pulse">
                <AlertCircle size={12} />
                A slightly longer message would be more meaningful!
              </p>
            )}
          </section>

          {/* Media Section */}
          <section className="flex flex-col gap-6">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <ImageIcon size={20} />
                </div>
                <h2 className="text-xl font-bold text-[#1b110e] dark:text-white">Media Library</h2>
              </div>
              <span className="text-[10px] font-bold text-[#97604e] uppercase tracking-widest bg-[#fdf1ec] px-3 py-1 rounded-full border border-primary/10">
                {media.length} items
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {/* Media Items */}
              {media.map((item) => (
                <div key={item.id} className="group relative aspect-square rounded-lg overflow-hidden border border-[#e7d6d0] bg-white shadow-sm hover:shadow-md transition-all">
                  {item.type === "video" ? (
                    <video src={item.url} className="w-full h-full object-cover" />
                  ) : (
                    <img src={item.url} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button 
                      onClick={() => removeMedia(item.id)}
                      className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
              ))}

              {/* Uploading States */}
              {Object.entries(uploadingFiles).map(([id, progress]) => (
                <div key={id} className="aspect-square rounded-lg border border-[#e7d6d0] bg-white/50 backdrop-blur-sm flex flex-col items-center justify-center gap-3 relative overflow-hidden">
                  <div className="absolute inset-x-0 bottom-0 h-1 bg-[#fdf1ec]">
                    <div 
                      className="h-full bg-primary transition-all duration-300" 
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  <span className="text-[10px] font-bold text-[#97604e] uppercase tracking-widest">{progress}%</span>
                </div>
              ))}

              {/* Hidden File Input */}
              <input 
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                multiple
                accept="image/*,video/*"
                className="hidden"
              />

              {/* Upload Multi-Option Trigger */}
              {currentTotal < maxAllowed && (
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="aspect-square rounded-lg border-2 border-dashed border-[#e7d6d0] flex flex-col items-center justify-center gap-2 hover:border-primary/50 hover:bg-primary/[0.02] cursor-pointer group transition-all"
                >
                  <div className="p-3 rounded-full bg-[#fdf1ec] text-primary group-hover:scale-110 transition-transform shadow-sm">
                    <Plus size={20} />
                  </div>
                  <span className="text-[10px] font-extrabold text-[#97604e] uppercase tracking-tighter">Add Photo/Video</span>
                </div>
              )}
            </div>
          </section>

          {/* Music Library Section */}
          <section className="flex flex-col gap-6">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <Music size={20} />
                </div>
                <h2 className="text-xl font-bold text-[#1b110e] dark:text-white">Music Library</h2>
              </div>
              <span className="text-[10px] font-bold text-[#97604e] uppercase tracking-widest bg-[#fdf1ec] px-3 py-1 rounded-full border border-primary/10">
                {music.length} tracks
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Music Items */}
              {music.map((item) => (
                <div key={item.id} className="group relative flex items-center gap-4 p-4 rounded-xl border border-[#e7d6d0] bg-white shadow-sm hover:shadow-md transition-all">
                  <div className="size-10 rounded-lg bg-primary/5 text-primary flex items-center justify-center">
                    <Music2 size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-[#1b110e] truncate">{item.name}</p>
                    <p className="text-[10px] text-[#97604e] font-medium uppercase tracking-wider">Audio track</p>
                  </div>
                  <button 
                    onClick={() => removeMusic(item.id)}
                    className="p-2 text-[#97604e] hover:text-red-500 transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}

              {/* Uploading States for Music */}
              {Object.entries(uploadingFiles).filter(([id]) => !media.find(m => m.id === id) && !music.find(m => m.id === id)).map(([id, progress]) => (
                <div key={id} className="flex items-center gap-4 p-4 rounded-xl border border-[#e7d6d0] bg-white/50 backdrop-blur-sm relative overflow-hidden">
                   <div className="absolute inset-x-0 bottom-0 h-1 bg-[#fdf1ec]">
                    <div 
                      className="h-full bg-primary transition-all duration-300" 
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  <span className="text-xs font-bold text-[#97604e]">Uploading... {progress}%</span>
                </div>
              ))}

              {/* Hidden Music Input */}
              <input 
                type="file"
                ref={musicInputRef}
                onChange={handleMusicUpload}
                multiple
                accept="audio/*"
                className="hidden"
              />

              {/* Upload Music Trigger */}
              {currentTotal < maxAllowed && (
                <div 
                  onClick={() => musicInputRef.current?.click()}
                  className="flex items-center gap-4 p-4 rounded-xl border-2 border-dashed border-[#e7d6d0] hover:border-primary/50 hover:bg-primary/[0.02] cursor-pointer group transition-all"
                >
                  <div className="size-10 rounded-full bg-[#fdf1ec] text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Plus size={20} />
                  </div>
                  <span className="text-sm font-extrabold text-[#97604e] uppercase tracking-tighter">Upload Music</span>
                </div>
              )}
            </div>

            {/* Total Limit Warning */}
            <div className="mt-4 p-4 rounded-xl bg-[#fdf1ec]/50 border border-primary/10 flex items-start gap-3">
              <AlertCircle size={18} className="text-primary shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-xs font-bold text-[#1b110e]">Storage Overview</p>
                <p className="text-[11px] text-[#97604e] font-medium leading-relaxed">
                  You've used <span className="font-black text-primary">{currentTotal}</span> out of <span className="font-black text-primary">{isUnlimited ? "∞" : "20"}</span> total items (photos, videos, and music).
                  {!isUnlimited && (
                    <span className="ml-1">Upgrade to <span className="font-black">Premium</span> or add <span className="font-black">Unlimited Media</span> to upload more.</span>
                  )}
                </p>
              </div>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
