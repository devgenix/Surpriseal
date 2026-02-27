"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { db, auth } from "@/lib/firebase";
import { formatPrice } from "@/lib/currency";
import { doc, getDoc, updateDoc, collection, query, where, getDocs, serverTimestamp } from "firebase/firestore";
import { onAuthStateChanged, User } from "firebase/auth";
import { 
  Loader2, ArrowLeft, ArrowRight, Lock, Save, Trash2, 
  CheckCircle2, Image as ImageIcon, Search, Music2, UploadCloud, 
  Camera, HelpCircle, X, ChevronDown, Check, Play, Pause, Palette,
  Link as LinkIcon, Copy
} from "lucide-react";

import { useCreation } from "@/context/CreationContext";
import { useCurrency } from "@/context/CurrencyContext";
import { Select } from "@/components/ui/Select";
import { cn } from "@/lib/utils";
import { useDebounce } from "@/hooks/useDebounce";
import { uploadFile } from "@/lib/upload";
import { getMediaLimit } from "@/lib/pricing-utils";
import { ADDONS, PLANS } from "@/lib/constants/pricing";

const cleanObject = (obj: any): any => {
  if (Array.isArray(obj)) {
    return obj.map(cleanObject);
  } else if (obj !== null && typeof obj === "object") {
    return Object.entries(obj).reduce((acc: any, [key, value]) => {
      if (value !== undefined) {
        acc[key] = cleanObject(value);
      }
      return acc;
    }, {});
  }
  return obj;
};

export default function CreationSettingsPage() {
  const router = useRouter();
  const params = useParams();
  const { id: draftId } = params as { id: string };
  const { currency } = useCurrency();

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
  const [copied, setCopied] = useState(false);

  // Custom Link State
  const [urlSlug, setUrlSlug] = useState("");
  const [checkingSlug, setCheckingSlug] = useState(false);
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
  const debouncedUrlSlug = useDebounce(urlSlug, 1000);

  // Unlock Settings State
  const [unlockType, setUnlockType] = useState<"none" | "password" | "qa" | "face">("none");
  const [unlockPassword, setUnlockPassword] = useState("");
  const [unlockQuestion, setUnlockQuestion] = useState("");
  const [unlockAnswer, setUnlockAnswer] = useState("");
  const [unlockHint, setUnlockHint] = useState("");
  const [unlockFaceRef, setUnlockFaceRef] = useState("");
  
  const debouncedUnlockPassword = useDebounce(unlockPassword, 1000);
  const debouncedUnlockQuestion = useDebounce(unlockQuestion, 1000);
  const debouncedUnlockAnswer = useDebounce(unlockAnswer, 1000);
  const debouncedUnlockHint = useDebounce(unlockHint, 1000);

  const [uploadingFace, setUploadingFace] = useState(false);

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
        
        // Load Custom Link
        setUrlSlug(data.urlSlug || "");
        
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
      const cleanedUpdates = cleanObject(updates);
      await updateDoc(docRef, {
        ...cleanedUpdates,
        updatedAt: serverTimestamp()
      });

      setLocalMomentData((prev: any) => {
        const merged = { ...prev, ...updates };
        if (updates.unlockConfig) {
          merged.unlockConfig = { ...(prev?.unlockConfig || {}), ...updates.unlockConfig };
        }
        return merged;
      });

      setMomentData((prev: any) => ({ ...prev, ...updates }));
      setLastSaved(new Date());
    } catch (err) {
      console.error("Error saving draft:", err);
      setSaveError(true);
    } finally {
      setSaving(false);
    }
  }, [draftId, setSaving, setSaveError, setLastSaved, setMomentData]);

  const isCustomLinkEnabled = useMemo(() => localMomentData?.selectedAddons?.includes("customUrl") || localMomentData?.plan === "premium", [localMomentData]);

  const copyToClipboard = useCallback((text: string) => {
    const fullUrl = `${window.location.host}/view/${text}`;
    navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, []);

  const toggleAddon = useCallback(async (addonId: string) => {
    if (!momentData || momentData.plan === "premium") return;
    
    // Lock paid addons for published moments
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
    
    const basePrice = PLANS.find(p => p.id === localMomentData.plan)?.price[currency] || 0;
    const addonsPrice = newAddons.reduce((acc: number, id: string) => {
      const addon = ADDONS.find(a => a.id === id);
      return acc + (addon?.price[currency] || 0);
    }, 0);
    
    const newTotal = basePrice + addonsPrice;
    const updates: any = { selectedAddons: newAddons, totalPrice: newTotal };

    if (!isAdding && addonId === "customUrl") {
      updates.urlSlug = "";
      setUrlSlug("");
      setSlugAvailable(null);
    }

    await saveDraft(updates);
  }, [momentData, currency, saveDraft, localMomentData]);

  // Slug Availability Check
  useEffect(() => {
    async function checkSlug() {
      if (debouncedUrlSlug.length < 3) {
        setSlugAvailable(null);
        return;
      }
      setCheckingSlug(true);
      try {
        const momentsRef = collection(db!, "moments");
        const q = query(momentsRef, where("urlSlug", "==", debouncedUrlSlug));
        const querySnap = await getDocs(q);

        // It's available if no one else has it, OR if the one who has it is US
        const isTakenByOthers = querySnap.docs.some(doc => doc.id !== draftId);
        setSlugAvailable(!isTakenByOthers);
      } catch (err) {
        console.error("Error checking slug:", err);
      } finally {
        setCheckingSlug(false);
      }
    }
    checkSlug();
  }, [debouncedUrlSlug, draftId]);

  // Auto-save logic
  useEffect(() => {
    if (loading || !localMomentData) return;

    let hasChanges = false;
    const updates: any = {};
    const unlockUpdates: any = {};

    if (debouncedUrlSlug !== (localMomentData.urlSlug || "")) {
      if (slugAvailable === true || debouncedUrlSlug === "") {
        updates.urlSlug = debouncedUrlSlug;
        hasChanges = true;
      }
    }
    
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
      if (Object.keys(unlockUpdates).length > 0) updates.unlockConfig = { ...localMomentData.unlockConfig, ...unlockUpdates };
      saveDraft(updates);
    }
  }, [
    loading, debouncedUrlSlug, slugAvailable, unlockType, 
    debouncedUnlockPassword, debouncedUnlockQuestion, debouncedUnlockAnswer, 
    debouncedUnlockHint, unlockFaceRef, saveDraft
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
      lastStepId: "pay",
      completedSteps: Array.from(new Set([...(momentData?.completedSteps || []), "settings"]))
    });
    router.push(`/dashboard/create/${draftId}/pay`);
  }, [draftId, router, momentData]);

  useEffect(() => {
    setOnContinue(() => onContinueAction);
    setOnSave(() => async () => { await saveDraft(); });
    return () => { setOnContinue(null); setOnSave(null); };
  }, [onContinueAction, saveDraft, setOnContinue, setOnSave]);

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

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex-1 w-full max-w-4xl mx-auto px-4 lg:px-0 py-10 space-y-12">
      <div className="space-y-2">
        <h1 className="text-3xl font-black text-[#1b110e] dark:text-white tracking-tight">Security & Sharing</h1>
        <p className="text-text-muted font-medium text-lg leading-relaxed">
          Choose how the recipient unlocks this moment and how they'll receive it.
        </p>
      </div>

      <div className="space-y-8">
          {/* Section 1: Custom Link */}
          <div className="bg-surface border border-border rounded-lg overflow-hidden p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h2 className="text-xl font-bold flex items-center gap-2 text-text-main">
                  <LinkIcon size={20} className="text-primary" />
                  Custom Link
                </h2>
                <p className="text-sm text-text-muted">Make your surprise easy to share and remember.</p>
              </div>
              
              {!isCustomLinkEnabled && localMomentData?.plan === "base" && (
                <button 
                  onClick={() => toggleAddon("customUrl")}
                  className="text-[10px] font-black text-primary uppercase bg-primary/5 px-2.5 py-1.5 rounded-full border border-primary/20 hover:bg-primary/10 transition-colors tracking-widest"
                >
                  + Add for {formatPrice(ADDONS.find(a => a.id === "customUrl")?.price[currency] || 0, currency)}
                </button>
              )}
              {isCustomLinkEnabled && momentData?.plan === "base" && (
                <button 
                  onClick={() => toggleAddon("customUrl")}
                  disabled={momentData?.status === "Published" && momentData?.paidAddons?.includes("customUrl")}
                  className={cn(
                    "text-[10px] font-black px-2.5 py-1.5 rounded-full border flex items-center gap-1 uppercase tracking-widest",
                    momentData?.status === "Published" && momentData?.paidAddons?.includes("customUrl")
                      ? "text-text-muted bg-primary/5 border-border cursor-not-allowed"
                      : "text-red-500 hover:bg-red-50/50 border-red-200"
                  )}
                >
                  {momentData?.status === "Published" && momentData?.paidAddons?.includes("customUrl") ? (
                    <><CheckCircle2 size={12} className="text-green-500" /> Enabled</>
                  ) : (
                    <><Trash2 size={12} /> Remove</>
                  )}
                </button>
              )}
            </div>

            <div className="pt-2">
              {!isCustomLinkEnabled ? (
                <div className="flex items-center justify-between p-4 bg-primary/5 rounded-lg border border-border border-dashed">
                  <div className="flex items-center gap-3">
                    <div className="size-8 rounded-full bg-surface flex items-center justify-center text-text-muted border border-border/50 shadow-sm">
                      <LinkIcon size={16} />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-text-main/50 uppercase tracking-tight">Your Surpriseal Link</span>
                      <span className="text-sm font-bold text-text-muted">supriseal.com/view/{draftId.slice(0, 8)}...</span>
                    </div>
                  </div>
                  <button onClick={() => copyToClipboard(draftId)} className="p-2 hover:bg-white rounded-md transition-colors text-primary">
                    {copied ? <CheckCircle2 size={18} /> : <Copy size={18} />}
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex rounded-lg border border-border bg-surface overflow-hidden shadow-sm focus-within:ring-4 focus-within:ring-primary/10 transition-all pr-1">
                    <div className="bg-primary/5 px-4 flex items-center border-r border-border shrink-0">
                      <span className="text-text-muted font-bold text-xs sm:text-sm">supriseal.com/view/</span>
                    </div>
                    <input 
                      value={urlSlug}
                      onChange={(e) => setUrlSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                      className="flex-1 h-14 px-4 bg-transparent border-none text-text-main placeholder:text-text-muted/30 focus:ring-0 outline-none font-bold text-base tracking-tight" 
                      placeholder="sarahs-big-30"
                      type="text"
                    />
                    <div className="flex items-center gap-1 px-2">
                      <button onClick={() => copyToClipboard(urlSlug || draftId)} disabled={!urlSlug && !draftId} className="size-10 flex items-center justify-center hover:bg-primary/5 rounded-md transition-colors text-primary">
                        {copied ? <CheckCircle2 size={18} /> : <Copy size={18} />}
                      </button>
                      {(checkingSlug || slugAvailable !== null) && (
                        <div className="flex items-center w-6 justify-center">
                          {checkingSlug ? <Loader2 size={18} className="text-primary animate-spin" /> : slugAvailable === true ? <CheckCircle2 size={18} className="text-green-500" /> : <X size={18} className="text-red-500" />}
                        </div>
                      )}
                    </div>
                  </div>
                  {slugAvailable === false && <p className="text-[9px] text-red-500 font-extrabold ml-1 uppercase tracking-widest bg-red-50 inline-block px-2 py-0.5 rounded">This link is already taken</p>}
                  {!urlSlug && <p className="text-[9px] text-text-muted ml-1 font-black uppercase tracking-[0.1em] opacity-60">Customize the link for a personal touch</p>}
                </div>
              )}
            </div>
          </div>

          {/* Section 2: Unlock Mechanism */}
          <div className="bg-surface border border-border rounded-lg overflow-hidden p-6 space-y-6">
            <div className="space-y-1">
              <h2 className="text-xl font-bold flex items-center gap-2 text-text-main">
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
                { id: "face", title: "Face Match", desc: "Coming Soon", icon: Camera, disabled: true },
              ].map((m) => (
                <button
                  key={m.id}
                  disabled={m.disabled}
                  onClick={() => setUnlockType(m.id as any)}
                  className={cn(
                    "flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all relative",
                    unlockType === m.id 
                      ? "bg-primary/5 border-primary shadow-sm text-primary" 
                      : "bg-surface border-border text-text-muted hover:border-primary/20",
                    m.disabled && "opacity-50 cursor-not-allowed grayscale"
                  )}
                >
                  {m.disabled && (
                    <div className="absolute top-2 right-2 bg-text-muted/10 text-[6px] font-black uppercase px-1.5 py-0.5 rounded-full text-text-muted tracking-widest border border-border">
                      Soon
                    </div>
                  )}
                  <m.icon size={24} className={unlockType === m.id ? "text-primary" : "text-text-muted"} />
                  <span className="text-xs font-black mt-1 uppercase tracking-widest">{m.title}</span>
                  <span className="text-[9px] font-bold text-center leading-tight opacity-60 uppercase tracking-tighter">{m.desc}</span>
                </button>
              ))}
            </div>

            <div className="pt-4 border-t border-border">
              {unlockType === "none" && (
                <div className="flex items-center gap-3 text-sm text-text-muted font-bold bg-primary/[0.03] p-5 rounded-lg border border-primary/10">
                  <CheckCircle2 className="text-primary shrink-0" size={18} />
                  <p className="opacity-80">The moment will open immediately when the recipient clicks the link.</p>
                </div>
              )}

              {unlockType === "password" && (
                <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-text-muted">Set Access Password</label>
                    <input 
                      type="text"
                      value={unlockPassword}
                      onChange={(e) => setUnlockPassword(e.target.value)}
                      placeholder="e.g. 1994 or secretword"
                      className="w-full h-14 px-5 bg-white border-2 border-border rounded-lg text-text-main font-bold placeholder:text-text-muted/30 focus:border-primary focus:ring-4 focus:ring-primary/5 outline-none transition-all"
                    />
                  </div>
                  
                  <div className="space-y-2 pt-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-text-muted">Security Hint (Optional)</label>
                    <textarea 
                      rows={2}
                      value={unlockHint}
                      onChange={(e) => setUnlockHint(e.target.value)}
                      placeholder="e.g. Our anniversary date..."
                      className="w-full p-4 bg-white border-2 border-border rounded-lg text-text-main font-bold placeholder:text-text-muted/30 focus:border-primary focus:ring-4 focus:ring-primary/5 outline-none transition-all resize-none"
                    />
                  </div>
                </div>
              )}

              {unlockType === "qa" && (
                <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-text-muted">Security Question / Riddle</label>
                    <input 
                      type="text"
                      value={unlockQuestion}
                      onChange={(e) => setUnlockQuestion(e.target.value)}
                      placeholder="e.g. What's the name of our first pet?"
                      className="w-full h-14 px-5 bg-white border-2 border-border rounded-lg text-text-main font-bold placeholder:text-text-muted/30 focus:border-primary focus:ring-4 focus:ring-primary/5 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-text-muted">Exact Answer (Case Insensitive)</label>
                    <input 
                      type="text"
                      value={unlockAnswer}
                      onChange={(e) => setUnlockAnswer(e.target.value.toLowerCase())}
                      placeholder="e.g. fluffy"
                      className="w-full h-14 px-5 bg-white border-2 border-border rounded-lg text-text-main font-bold placeholder:text-text-muted/30 focus:border-primary focus:ring-4 focus:ring-primary/5 outline-none transition-all"
                    />
                  </div>

                  <div className="space-y-2 pt-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-text-muted">Security Hint (Optional)</label>
                    <textarea 
                      rows={2}
                      value={unlockHint}
                      onChange={(e) => setUnlockHint(e.target.value)}
                      placeholder="e.g. Think back to 5 years ago..."
                      className="w-full p-4 bg-white border-2 border-border rounded-lg text-text-main font-bold placeholder:text-text-muted/30 focus:border-primary focus:ring-4 focus:ring-primary/5 outline-none transition-all resize-none"
                    />
                  </div>
                </div>
              )}

              {unlockType === "face" && (
                <div className="p-8 text-center bg-primary/[0.03] rounded-lg border border-dashed border-primary/20 space-y-4">
                  <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto text-primary">
                    <Camera size={32} />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-sm font-black uppercase tracking-widest text-text-main">Face Match is Coming Soon</h3>
                    <p className="text-[10px] font-medium text-text-muted max-w-xs mx-auto leading-relaxed">
                      We're currently perfecting our AI Face Recognition to ensure maximum privacy and accuracy for your surprises.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
      </div>
    </div>
  );
}
