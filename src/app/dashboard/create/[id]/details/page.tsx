"use client";

import { cn } from "@/lib/utils";
import { db, auth } from "@/lib/firebase";
import { Select } from "@/components/ui/Select";
import { useDebounce } from "@/hooks/useDebounce";
import { useRouter, useParams } from "next/navigation";
import { onAuthStateChanged, User } from "firebase/auth";
import { useCreation } from "@/context/CreationContext";
import { useState, useEffect, useCallback, useRef } from "react";
import { occasions as SHARED_OCCASIONS } from "@/lib/constants/occasions";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { 
  Loader2, 
  Users,
  Check, 
  Smile,
  AlertCircle,
  Cake,
  PartyPopper,
  ChevronDown,
  Sparkles
} from "lucide-react";

const OCCASION_ICONS: Record<string, any> = {
  birthday: Cake,
  anniversary: Sparkles,
  wedding: PartyPopper,
  valentine: PartyPopper,
  retirement: PartyPopper,
  graduation: PartyPopper,
  memorial: Smile,
  teacher_appreciation: Smile,
  promotion: Sparkles,
  new_baby: Smile,
  appreciation: Smile,
};

export default function CreationDetailsPage() {
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

  // Form State
  const [recipientName, setRecipientName] = useState("");
  const [occasionId, setOccasionId] = useState("");
  const [customOccasion, setCustomOccasion] = useState("");
  const [senderName, setSenderName] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);

  const debouncedName = useDebounce(recipientName, 1000);
  const debouncedSenderName = useDebounce(senderName, 1000);
  const debouncedOccasionId = useDebounce(occasionId, 1000);
  const debouncedCustomOccasion = useDebounce(customOccasion, 1000);

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
        setRecipientName(data.recipientName || "");
        setOccasionId(data.occasionId || "");
        setCustomOccasion(data.customOccasion || "");
        setSenderName(data.senderName || "");
        setIsAnonymous(data.isAnonymous || false);
        setLoading(false);
      } catch (err) {
        console.error("Error loading draft:", err);
      }
    }
    if (user) loadDraft();
  }, [draftId, user, router, setMomentData]);

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

      setMomentData((prev: any) => {
        if (!prev) return prev;
        return { ...prev, ...updates };
      });

      setLastSaved(new Date());
    } catch (err) {
      console.error("Error saving draft:", err);
      setSaveError(true);
    } finally {
      setSaving(false);
    }
  }, [draftId, setSaving, setSaveError, setLastSaved, setMomentData]);

  const stateRef = useRef({
    recipientName,
    occasionId,
    customOccasion,
    senderName,
    isAnonymous
  });

  useEffect(() => {
    stateRef.current = {
      recipientName,
      occasionId,
      customOccasion,
      senderName,
      isAnonymous
    };
  }, [recipientName, occasionId, customOccasion, senderName, isAnonymous]);

  const onSaveAction = useCallback(async () => {
    await saveDraft(stateRef.current);
  }, [saveDraft]);

  const onContinueAction = useCallback(async () => {
    const updates = {
      ...stateRef.current,
      lastStepId: "style",
      completedSteps: Array.from(new Set([...(momentData?.completedSteps || []), "recipient"]))
    };
    await saveDraft(updates);
    router.push(`/dashboard/create/${draftId}/style`);
  }, [draftId, router, momentData, saveDraft]);

  useEffect(() => {
    setOnSave(() => onSaveAction);
    setOnContinue(() => onContinueAction);
    return () => {
      setOnSave(null);
      setOnContinue(null);
    };
  }, [onSaveAction, onContinueAction, setOnSave, setOnContinue]);

  useEffect(() => {
    const isValid = recipientName.trim() !== "" && 
                   (senderName.trim() !== "" || isAnonymous) &&
                   occasionId !== "" && 
                   (occasionId !== "custom" || customOccasion.trim() !== "");
    setCanContinue(isValid);
  }, [recipientName, occasionId, customOccasion, senderName, isAnonymous, setCanContinue]);

  // Debounced Saves
  useEffect(() => {
    if (loading) return;
    saveDraft({ occasionId: debouncedOccasionId });
  }, [debouncedOccasionId, saveDraft, loading]);

  useEffect(() => {
    if (loading) return;
    saveDraft({ customOccasion: debouncedCustomOccasion });
  }, [debouncedCustomOccasion, saveDraft, loading]);

  useEffect(() => {
    if (loading) return;
    saveDraft({ recipientName: debouncedName });
  }, [debouncedName, saveDraft, loading]);

  useEffect(() => {
    if (loading) return;
    saveDraft({ senderName: debouncedSenderName });
  }, [debouncedSenderName, saveDraft, loading]);

  useEffect(() => {
    if (loading) return;
    saveDraft({ isAnonymous });
  }, [isAnonymous, saveDraft, loading]);

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
          <div className="mb-10 text-center sm:text-left">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-text-main mb-3 tracking-tight">
              Who is this surprise for?
            </h1>
            <p className="text-lg text-text-muted font-medium">
              Start with the basics to set up your celebration page.
            </p>
          </div>

          <div className="w-full flex flex-col gap-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2.5">
                <label className="text-sm font-bold text-[#1b110e] dark:text-white ml-1">Recipient Name</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Smile className="text-[#97604e] group-focus-within:text-primary transition-colors h-5 w-5" />
                  </div>
                  <input 
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    className="w-full h-14 pl-12 pr-4 bg-surface border border-border rounded-lg text-text-main placeholder:text-text-muted/50 focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all outline-none font-bold" 
                    placeholder="e.g. Sarah Jenkins"
                    type="text"
                  />
                </div>
              </div>

              <Select
                label="Occasion"
                options={SHARED_OCCASIONS.map(occ => ({
                  id: occ.id,
                  title: occ.title,
                }))}
                value={occasionId}
                onChange={(val) => setOccasionId(val)}
                placeholder="Select an occasion"
                icon={OCCASION_ICONS[occasionId] || PartyPopper}
              />
            </div>

            {occasionId === "custom" && (
              <div className="flex flex-col gap-2.5 animate-in fade-in slide-in-from-top-2">
                <label className="text-sm font-bold text-[#1b110e] dark:text-white ml-1">Specify Occasion</label>
                <input 
                  value={customOccasion}
                  onChange={(e) => setCustomOccasion(e.target.value)}
                  className="w-full h-14 px-4 bg-surface border border-border rounded-lg text-text-main focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all outline-none font-bold" 
                  placeholder="e.g. New Job, Engagement, etc."
                  type="text"
                />
              </div>
            )}

            <div className="flex flex-col gap-4 p-6 bg-primary/5 rounded-lg border border-primary/10">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <label className="text-sm font-bold text-[#1b110e] dark:text-white ml-1">Who is sending this?</label>
                <div className="flex items-center p-1 bg-surface border border-border rounded-lg shrink-0">
                  <button
                    onClick={() => setIsAnonymous(false)}
                    className={cn(
                      "flex-1 sm:flex-none px-4 py-2 text-xs font-bold rounded-md transition-all",
                      !isAnonymous 
                        ? "bg-white text-primary shadow-sm ring-1 ring-border" 
                        : "text-text-muted hover:text-text-main"
                    )}
                  >
                    Use Name
                  </button>
                  <button
                    onClick={() => {
                      setIsAnonymous(true);
                      setSenderName("");
                    }}
                    className={cn(
                      "flex-1 sm:flex-none px-4 py-2 text-xs font-bold rounded-md transition-all",
                      isAnonymous 
                        ? "bg-primary text-white shadow-sm" 
                        : "text-text-muted hover:text-text-main"
                    )}
                  >
                    Stay Anonymous
                  </button>
                </div>
              </div>

              <div className="relative group mt-2">
                {!isAnonymous ? (
                  <>
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Users className="text-[#97604e] group-focus-within:text-primary transition-colors h-5 w-5" />
                    </div>
                    <input 
                      value={senderName}
                      onChange={(e) => setSenderName(e.target.value)}
                      className="w-full h-14 pl-12 pr-4 bg-surface border border-border rounded-lg text-text-main placeholder:text-text-muted/50 focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all outline-none font-bold" 
                      placeholder="e.g. John Doe, or The Smith Family"
                      type="text"
                    />
                  </>
                ) : (
                  <div className="w-full h-14 px-4 bg-surface border border-border border-dashed rounded-lg flex items-center justify-center gap-2">
                    <div className="size-6 rounded-full bg-primary/10 flex items-center justify-center">
                      <Check size={12} className="text-primary" />
                    </div>
                    <span className="text-sm font-bold text-text-muted">You will appear as "a thoughtful person"</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
  );
}
