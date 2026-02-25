"use client";

import { cn } from "@/lib/utils";
import { db, auth } from "@/lib/firebase";
import { formatPrice } from "@/lib/currency";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/Select";
import { useDebounce } from "@/hooks/useDebounce";
import { useRouter, useParams } from "next/navigation";
import { onAuthStateChanged, User } from "firebase/auth";
import { useCreation } from "@/context/CreationContext";
import { useCurrency } from "@/context/CurrencyContext";
import { PLANS, ADDONS } from "@/lib/constants/pricing";
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { occasions as SHARED_OCCASIONS } from "@/lib/constants/occasions";
import { doc, getDoc, updateDoc, serverTimestamp, collection, query, where, getDocs } from "firebase/firestore";
import { 
  Loader2, 
  ArrowLeft, 
  ArrowRight, 
  Users,
  Check, 
  PersonStanding, 
  Edit3, 
  Image as ImageIcon, 
  PartyPopper, 
  CreditCard,
  CheckCircle2,
  Smile,
  AlertCircle,
  Cake,
  Link as LinkIcon,
  Calendar,
  Mail,
  ChevronDown,
  Menu,
  X,
  Settings,
  ChevronUp,
  Sparkles,
  Trash2,
  Copy
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

  // Form State
  const [recipientName, setRecipientName] = useState("");
  const [personalMessage, setPersonalMessage] = useState("");
  const [occasionId, setOccasionId] = useState("");
  const [customOccasion, setCustomOccasion] = useState("");
  const [urlSlug, setUrlSlug] = useState("");
  const [unlockDate, setUnlockDate] = useState("");
  const [unlockTime, setUnlockTime] = useState("00:00");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [senderName, setSenderName] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);

  const [checkingSlug, setCheckingSlug] = useState(false);
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);

  const debouncedName = useDebounce(recipientName, 1000);
  const debouncedMessage = useDebounce(personalMessage, 1000);
  const debouncedSenderName = useDebounce(senderName, 1000);
  const debouncedOccasionId = useDebounce(occasionId, 1000);
  const debouncedCustomOccasion = useDebounce(customOccasion, 1000);
  const debouncedUrlSlug = useDebounce(urlSlug, 1000);
  const debouncedUnlockDate = useDebounce(unlockDate, 1000);
  const debouncedUnlockTime = useDebounce(unlockTime, 1000);
  const debouncedRecipientEmail = useDebounce(recipientEmail, 1000);

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
        setLocalMomentData(data);
        setMomentData(data); // Sync shared context
        setRecipientName(data.recipientName || "");
        setPersonalMessage(data.personalMessage || "");
        setOccasionId(data.occasionId || "");
        setCustomOccasion(data.customOccasion || "");
        setUrlSlug(data.urlSlug || "");
        setUnlockTime(data.unlockTime || "00:00"); 
        setUnlockDate(data.unlockDate || "");
        setRecipientEmail(data.recipientEmail || "");
        setSenderName(data.senderName || "");
        setIsAnonymous(data.isAnonymous || false);
        setLoading(false);
        
        // Initial sync to context
        setMomentData(data);
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

      // Update local context state for immediate feedback
      setMomentData((prev: any) => {
        if (!prev) return prev;
        
        // Handle nested styleConfig updates
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
  }, [draftId, setSaving, setSaveError, setLastSaved]);

  // Use refs to keep actions stable while having access to latest state
  const stateRef = useRef({
    recipientName,
    personalMessage,
    occasionId,
    customOccasion,
    urlSlug,
    unlockDate,
    unlockTime,
    recipientEmail,
    senderName,
    isAnonymous
  });

  useEffect(() => {
    stateRef.current = {
      recipientName,
      personalMessage,
      occasionId,
      customOccasion,
      urlSlug,
      unlockDate,
      unlockTime,
      recipientEmail,
      senderName,
      isAnonymous
    };
  }, [recipientName, personalMessage, occasionId, customOccasion, urlSlug, unlockDate, unlockTime, recipientEmail, senderName, isAnonymous]);

  const onSaveAction = useCallback(async () => {
    await saveDraft(stateRef.current);
  }, [saveDraft]);

  const onContinueAction = useCallback(async () => {
    const updates = {
      ...stateRef.current,
      lastStepId: "settings",
      completedSteps: Array.from(new Set([...(momentData?.completedSteps || []), "recipient"]))
    };
    await saveDraft(updates);
    router.push(`/dashboard/create/${draftId}/settings`);
  }, [draftId, router, momentData, saveDraft]);

  // Register actions with layout
  useEffect(() => {
    setOnSave(() => onSaveAction);
    setOnContinue(() => onContinueAction);

    return () => {
      setOnSave(null);
      setOnContinue(null);
    };
  }, [onSaveAction, onContinueAction, setOnSave, setOnContinue]);

  // Handle Validation for Continue button
  useEffect(() => {
    const isValid = recipientName.trim() !== "" && 
                   personalMessage.trim().length > 10 &&
                   (senderName.trim() !== "" || isAnonymous) &&
                   occasionId !== "" && 
                   (occasionId !== "custom" || customOccasion.trim() !== "");
    setCanContinue(isValid);
  }, [recipientName, personalMessage, occasionId, customOccasion, senderName, isAnonymous, setCanContinue]);

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
    
    // Recalculate price
    const basePrice = PLANS.find(p => p.id === localMomentData.plan)?.price[currency] || 0;
    const addonsPrice = newAddons.reduce((acc: number, id: string) => {
      const addon = ADDONS.find(a => a.id === id);
      return acc + (addon?.price[currency] || 0);
    }, 0);
    
    const newTotal = basePrice + addonsPrice;
    
    const updates: any = {
      selectedAddons: newAddons,
      totalPrice: newTotal
    };

    if (!isAdding && addonId === "customUrl") {
      updates.urlSlug = "";
      setUrlSlug("");
      setSlugAvailable(null);
    }

    setLocalMomentData((prev: any) => ({
      ...prev,
      ...updates
    }));
    
    setMomentData((prev: any) => ({
      ...prev,
      ...updates
    }));
    
    await saveDraft(updates);
  }, [momentData, currency, saveDraft, setMomentData]);

  const isCustomLinkEnabled = useMemo(() => localMomentData?.selectedAddons?.includes("customUrl") || localMomentData?.plan === "premium", [localMomentData]);
  const isScheduledRevealEnabled = useMemo(() => localMomentData?.selectedAddons?.includes("scheduledReveal") || localMomentData?.plan === "premium", [localMomentData]);

  const copyToClipboard = useCallback((text: string) => {
    const fullUrl = `${window.location.origin}/view/${text}`;
    navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, []);

  // Debounced Saves for each field
  useEffect(() => {
    if (loading) return;
    saveDraft({ recipientName: debouncedName });
  }, [debouncedName, saveDraft, loading]);

  useEffect(() => {
    if (loading) return;
    saveDraft({ personalMessage: debouncedMessage });
  }, [debouncedMessage, saveDraft, loading]);

  useEffect(() => {
    if (loading) return;
    saveDraft({ occasionId: debouncedOccasionId });
  }, [debouncedOccasionId, saveDraft, loading]);

  useEffect(() => {
    if (loading) return;
    saveDraft({ customOccasion: debouncedCustomOccasion });
  }, [debouncedCustomOccasion, saveDraft, loading]);

  useEffect(() => {
    if (loading && slugAvailable !== false) return;
    saveDraft({ urlSlug: debouncedUrlSlug });
  }, [debouncedUrlSlug, saveDraft, loading, slugAvailable]);

  useEffect(() => {
    if (loading) return;
    saveDraft({ unlockDate: debouncedUnlockDate });
  }, [debouncedUnlockDate, saveDraft, loading]);

  useEffect(() => {
    if (loading) return;
    saveDraft({ unlockTime: debouncedUnlockTime });
  }, [debouncedUnlockTime, saveDraft, loading]);

  useEffect(() => {
    if (loading) return;
    saveDraft({ recipientEmail: debouncedRecipientEmail });
  }, [debouncedRecipientEmail, saveDraft, loading]);

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

  useEffect(() => {
    if (localMomentData) {
      setMomentData({
        ...localMomentData, // Use spread to ensure all fields like paidAmount, paidAddons are carried over
        plan: localMomentData.plan,
        selectedAddons: localMomentData.selectedAddons,
        totalPrice: localMomentData.totalPrice,
        completedSteps: localMomentData.completedSteps
      });
    }
  }, [localMomentData, setMomentData]);

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
          {/* Header */}
          <div className="mb-10 text-center sm:text-left">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-text-main mb-3 tracking-tight">
              Who is this surprise for?
            </h1>
            <p className="text-lg text-text-muted font-medium">
              Start with the basics to set up your celebration page.
            </p>
          </div>

          {/* Form */}
          <div className="w-full flex flex-col gap-10">
            {/* Name & Occasion Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Recipient Name */}
              <div className="flex flex-col gap-2.5">
                <label className="text-sm font-bold text-[#1b110e] dark:text-white ml-1">Recipient Name</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Smile className="text-[#97604e] group-focus-within:text-primary transition-colors h-5 w-5" />
                  </div>
                  <input 
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    className="w-full h-14 pl-12 pr-4 bg-surface border border-border rounded-lg text-text-main placeholder:text-text-muted/50 focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all outline-none" 
                    placeholder="e.g. Sarah Jenkins"
                    type="text"
                  />
                </div>
              </div>

              {/* Occasion */}
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

            {/* Custom Occasion Input */}
            {occasionId === "custom" && (
              <div className="flex flex-col gap-2.5 animate-in fade-in slide-in-from-top-2">
                <label className="text-sm font-bold text-[#1b110e] dark:text-white ml-1">Specify Occasion</label>
                <input 
                  value={customOccasion}
                  onChange={(e) => setCustomOccasion(e.target.value)}
                  className="w-full h-14 px-4 bg-surface border border-border rounded-lg text-text-main focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all outline-none" 
                  placeholder="e.g. New Job, Engagement, etc."
                  type="text"
                />
              </div>
            )}

            {/* Sender Name & Anonymity */}
            <div className="flex flex-col gap-4 p-6 bg-primary/5 rounded-xl border border-primary/10">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <label className="text-sm font-bold text-[#1b110e] dark:text-white ml-1">Who is sending this?</label>
                
                {/* Segmented Control */}
                <div className="flex items-center p-1 bg-surface border border-border rounded-lg shrink-0">
                  <button
                    onClick={() => {
                      setIsAnonymous(false);
                    }}
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
                      className="w-full h-14 pl-12 pr-4 bg-surface border border-border rounded-lg text-text-main placeholder:text-text-muted/50 focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all outline-none" 
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

            {/* Message Section */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2 mb-2">
                <h2 className="text-xl font-bold text-[#1b110e] dark:text-white">Personal Message</h2>
              </div>
              
              <div className="relative group">
                <textarea 
                  rows={3}
                  value={personalMessage}
                  onChange={(e) => setPersonalMessage(e.target.value)}
                  className="w-full min-h-[136px] max-h-[194px] lg:max-h-[253px] p-6 bg-surface border border-border rounded-lg text-text-main placeholder:text-text-muted/50 focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all outline-none resize-y text-lg leading-relaxed shadow-sm font-medium"
                  placeholder={`Dear ${recipientName || 'Someone Special'}, I wanted to share something special with you...`}
                />
                <div className="absolute bottom-4 right-4 text-[10px] font-bold text-[#97604e] bg-white/50 backdrop-blur-sm px-2 py-1 rounded-md border border-[#e7d6d0]/50 uppercase tracking-widest">
                  {personalMessage.length} characters
                </div>
              </div>
              {personalMessage.length > 0 && personalMessage.length <= 10 && (
                <p className="text-[10px] text-amber-600 font-bold flex items-center gap-1 ml-1 animate-pulse">
                  <AlertCircle size={12} />
                  A slightly longer message would be more meaningful!
                </p>
              )}
            </div>

            {/* Custom Link Section */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between mb-1">
                <label className="text-sm font-bold text-text-main ml-1">Custom Link</label>
                {!isCustomLinkEnabled && localMomentData?.plan === "base" && (
                  <button 
                    onClick={() => toggleAddon("customUrl")}
                    className="text-[10px] font-bold text-primary uppercase bg-primary/5 px-2 py-1 rounded-full border border-primary/20 hover:bg-primary/10 transition-colors"
                  >
                    + Add for {formatPrice(ADDONS.find(a => a.id === "customUrl")?.price[currency] || 0, currency)}
                  </button>
                )}
                {isCustomLinkEnabled && momentData?.plan === "base" && (
                  <button 
                    onClick={() => toggleAddon("customUrl")}
                    disabled={momentData?.status === "Published" && momentData?.paidAddons?.includes("customUrl")}
                    className={cn(
                      "text-[10px] font-bold px-2 py-1 rounded-full border flex items-center gap-1 uppercase tracking-wider",
                      momentData?.status === "Published" && momentData?.paidAddons?.includes("customUrl")
                        ? "text-text-muted bg-primary/5 border-border cursor-not-allowed"
                        : "text-red-500 hover:bg-red-50/50 border-red-200"
                    )}
                  >
                    {momentData?.status === "Published" && momentData?.paidAddons?.includes("customUrl") ? (
                      <>
                        <CheckCircle2 size={12} className="text-green-500" />
                        Enabled
                      </>
                    ) : (
                      <>
                        <Trash2 size={12} />
                        Remove
                      </>
                    )}
                  </button>
                )}
              </div>

              {!isCustomLinkEnabled ? (
                <div className="flex items-center justify-between p-4 bg-primary/5 rounded-lg border border-border border-dashed">
                  <div className="flex items-center gap-3">
                    <div className="size-8 rounded-full bg-surface flex items-center justify-center text-text-muted">
                      <LinkIcon size={16} />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-text-main/70 uppercase tracking-tighter">Your Surpriseal Link</span>
                      <span className="text-sm font-medium text-text-muted">supriseal.com/view/{draftId.slice(0, 8)}...</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => copyToClipboard(draftId)}
                    className="p-2 hover:bg-white rounded-md transition-colors text-primary"
                    title="Copy Link"
                  >
                    {copied ? <CheckCircle2 size={18} /> : <Copy size={18} />}
                  </button>
                </div>
              ) : (
                <div className="flex rounded-lg border border-border bg-surface overflow-hidden focus-within:ring-4 focus-within:ring-primary/10 focus-within:border-primary transition-all pr-1">
                  <div className="bg-primary/5 px-3 sm:px-4 flex items-center border-r border-border shrink-0">
                    <span className="text-text-muted font-bold text-xs sm:text-sm whitespace-nowrap hidden sm:inline">supriseal.com/view/</span>
                    <span className="text-text-muted font-bold text-xs whitespace-nowrap sm:hidden">.../view/</span>
                  </div>
                  <input 
                    value={urlSlug}
                    onChange={(e) => setUrlSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                    className="flex-1 min-w-0 h-14 px-3 sm:px-4 bg-transparent border-none text-text-main placeholder:text-text-muted/50 focus:ring-0 outline-none font-medium text-sm sm:text-base" 
                    placeholder="sarahs-big-30"
                    type="text"
                  />
                  <div className="flex items-center gap-1 shrink-0">
                    <button 
                      onClick={() => copyToClipboard(urlSlug || draftId)}
                      disabled={!urlSlug && !draftId}
                      className="p-2 hover:bg-primary/5 rounded-md transition-colors text-primary"
                      title="Copy Link"
                    >
                      {copied ? <CheckCircle2 size={18} /> : <Copy size={18} />}
                    </button>
                    {/* Only show status container if we're checking or have a result */}
                    {(checkingSlug || slugAvailable !== null) && (
                      <div className="pr-2 sm:pr-3 flex items-center w-6 justify-center">
                        {checkingSlug ? (
                          <Loader2 size={18} className="text-primary animate-spin" />
                        ) : slugAvailable === true ? (
                          <CheckCircle2 size={18} className="text-green-500" />
                        ) : slugAvailable === false ? (
                          <X size={18} className="text-red-500" />
                        ) : null}
                      </div>
                    )}
                  </div>
                </div>
              )}
              {isCustomLinkEnabled && slugAvailable === false && (
                <p className="text-[10px] text-red-500 font-bold ml-1">Oops! This link is already taken.</p>
              )}
              {!isCustomLinkEnabled && (
                <p className="text-[10px] text-text-muted ml-1 font-medium">Customise the link to make it personal and memorable.</p>
              )}
            </div>

            {/* Unlock Date Section  */}
            {/* <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between mb-1">
                <label className="text-sm font-bold text-[#1b110e] dark:text-white ml-1">Scheduled Reveal</label>
                {!isScheduledRevealEnabled && localMomentData?.plan === "base" && (
                  <button 
                    onClick={() => toggleAddon("scheduledReveal")}
                    className="text-[10px] font-bold text-primary uppercase bg-primary/5 px-2 py-1 rounded-full border border-primary/20 hover:bg-primary/10 transition-colors"
                  >
                    + Add for {formatPrice(ADDONS.find(a => a.id === "scheduledReveal")?.price[currency] || 0, currency)}
                  </button>
                )}
                {isScheduledRevealEnabled && momentData?.plan === "base" && (
                  <button 
                    onClick={() => toggleAddon("scheduledReveal")}
                    disabled={momentData?.status === "Published" && momentData?.paidAddons?.includes("scheduledReveal")}
                    className={cn(
                      "text-[10px] font-bold px-2 py-1 rounded-full border flex items-center gap-1 uppercase tracking-wider",
                      momentData?.status === "Published" && momentData?.paidAddons?.includes("scheduledReveal")
                        ? "text-[#97604e] bg-[#f9f5f4] border-[#e7d6d0] cursor-not-allowed"
                        : "text-red-500 hover:bg-red-50/50 border-red-200"
                    )}
                  >
                    {momentData?.status === "Published" && momentData?.paidAddons?.includes("scheduledReveal") ? (
                      <>
                        <CheckCircle2 size={12} className="text-green-500" />
                        Enabled
                      </>
                    ) : (
                      <>
                        <Trash2 size={12} />
                        Remove
                      </>
                    )}
                  </button>
                )}
              </div>

              {!isScheduledRevealEnabled ? (
                <div className="flex items-center gap-3 p-4 bg-[#f9f5f4] dark:bg-white/5 rounded-lg border border-[#e7d6d0] border-dashed">
                  <div className="size-8 rounded-full bg-white dark:bg-white/10 flex items-center justify-center text-[#97604e]">
                    <Calendar size={16} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-[#1b110e]/70 uppercase tracking-tighter">Instant Access</span>
                    <span className="text-sm font-medium text-[#97604e]">The surprise unlocks immediately</span>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Calendar className="text-[#97604e] group-focus-within:text-primary transition-colors h-5 w-5" />
                    </div>
                    <input 
                      value={unlockDate}
                      onChange={(e) => setUnlockDate(e.target.value)}
                      className="w-full h-14 pl-12 pr-4 bg-white dark:bg-white/5 border border-[#e7d6d0] rounded-lg text-[#1b110e] dark:text-white focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all outline-none" 
                      type="date"
                    />
                  </div>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Loader2 className="text-[#97604e] group-focus-within:text-primary transition-colors h-5 w-5" />
                    </div>
                    <input 
                      value={unlockTime}
                      onChange={(e) => setUnlockTime(e.target.value)}
                      className="w-full h-14 pl-12 pr-4 bg-white dark:bg-white/5 border border-[#e7d6d0] rounded-lg text-[#1b110e] dark:text-white focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all outline-none" 
                      type="time"
                    />
                  </div>
                </div>
              )}
            </div> */} { /* Commented out for future use */}

            {/* Email Notification Section */}
            {/* <div className="flex flex-col gap-3">
              <label className="text-sm font-bold text-[#1b110e] dark:text-white ml-1">Notify Recipient (Optional)</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="text-[#97604e] group-focus-within:text-primary transition-colors h-5 w-5" />
                </div>
                <input 
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  className="w-full h-14 pl-12 pr-4 bg-white dark:bg-white/5 border border-[#e7d6d0] rounded-lg text-[#1b110e] dark:text-white placeholder:text-[#97604e]/50 focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all outline-none" 
                  placeholder="recipient@email.com"
                  type="email"
                />
              </div>
              <p className="text-[10px] text-[#97604e] ml-1 font-medium">We'll send them a beautiful invite when it's time to reveal.</p>
            </div> */} { /* Commented out for future use */}
          </div>
        </div>
      </div>
  );
}
