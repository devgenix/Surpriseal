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
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCreation } from "@/context/CreationContext";
import { useDebounce } from "@/hooks/useDebounce";

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
  const [collectionName, setCollectionName] = useState<"drafts" | "moments">("drafts");
  
  // Form State
  const [personalMessage, setPersonalMessage] = useState("");
  const [media, setMedia] = useState<any[]>([]);
  const [recipientName, setRecipientName] = useState("");

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
        // Try drafts first
        let docRef = doc(db!, "drafts", draftId);
        let docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setCollectionName("drafts");
        } else {
          // Try moments
          docRef = doc(db!, "moments", draftId);
          docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setCollectionName("moments");
          } else {
            router.push("/dashboard");
            return;
          }
        }

        const data = docSnap.data();
        setMomentData(data);
        setPersonalMessage(data.personalMessage || "");
        setMedia(data.media || []);
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
      const docRef = doc(db!, collectionName, draftId);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      });
      setLastSaved(new Date());
    } catch (err) {
      console.error("Error saving draft:", err);
      setSaveError(true);
    } finally {
      setSaving(false);
    }
  }, [draftId, setSaving, setSaveError, setLastSaved, collectionName]);

  // Handle auto-save for message
  useEffect(() => {
    if (loading) return;
    saveDraft({ personalMessage: debouncedMessage });
  }, [debouncedMessage, saveDraft, loading]);

  // Handle Validation
  useEffect(() => {
    // For MVP, we require at least a message
    const isValid = personalMessage.trim().length > 10;
    setCanContinue(isValid);
  }, [personalMessage, setCanContinue]);

  const stateRef = useRef({ personalMessage, media });
  useEffect(() => {
    stateRef.current = { personalMessage, media };
  }, [personalMessage, media]);

  const onSaveAction = useCallback(async () => {
    await saveDraft(stateRef.current);
  }, [saveDraft]);

  const onContinueAction = useCallback(async () => {
    const docRef = doc(db!, collectionName, draftId); // Use dynamic collectionName
    await updateDoc(docRef, { 
      personalMessage,
      media,
      lastStepId: "pay",
      completedSteps: Array.from(new Set([...(momentData?.completedSteps || []), "content"]))
    });
    router.push(`/dashboard/create/${draftId}/pay`);
  }, [personalMessage, media, draftId, momentData, router, collectionName]); // Added collectionName

  useEffect(() => {
    setOnSave(() => onSaveAction);
    setOnContinue(() => onContinueAction);
    return () => {
      setOnSave(null);
      setOnContinue(null);
    };
  }, [onSaveAction, onContinueAction, setOnSave, setOnContinue]);

  const addMediaPlaceholder = () => {
    // Simple simulated upload for MVP
    const newMedia = [
      ...media,
      {
        id: Math.random().toString(36).substr(2, 9),
        type: "image",
        url: "https://images.unsplash.com/photo-1513201099705-a9746e1e201f?q=80&w=2897&auto=format&fit=crop",
        name: "memory-" + (media.length + 1) + ".jpg"
      }
    ];
    setMedia(newMedia);
    saveDraft({ media: newMedia });
  };

  const removeMedia = (id: string) => {
    const newMedia = media.filter(m => m.id !== id);
    setMedia(newMedia);
    saveDraft({ media: newMedia });
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
            Surprise Content
          </h1>
          <p className="text-lg text-[#97604e] font-medium">
            Share a heartfelt message and your favorite memories for {recipientName}.
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
                <h2 className="text-xl font-bold text-[#1b110e] dark:text-white">Memory Lane</h2>
              </div>
              <span className="text-[10px] font-bold text-[#97604e] uppercase tracking-widest bg-[#fdf1ec] px-3 py-1 rounded-full border border-primary/10">
                {media.length} of 10 items
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {/* Media Items */}
              {media.map((item) => (
                <div key={item.id} className="group relative aspect-square rounded-lg overflow-hidden border border-[#e7d6d0] bg-white shadow-sm hover:shadow-md transition-all">
                  <img src={item.url} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
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

              {/* Upload Multi-Option Trigger (MVP Concept) */}
              {media.length < 10 && (
                <div 
                  onClick={addMediaPlaceholder}
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

        </div>
      </div>
    </div>
  );
}
