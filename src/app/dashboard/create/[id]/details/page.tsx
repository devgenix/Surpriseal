"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { db, auth } from "@/lib/firebase";
import { doc, getDoc, updateDoc, serverTimestamp, collection, query, where, getDocs } from "firebase/firestore";
import { onAuthStateChanged, User } from "firebase/auth";
import { 
  Loader2, 
  ArrowLeft, 
  ArrowRight, 
  Check, 
  PersonStanding, 
  Edit3, 
  Image as ImageIcon, 
  PartyPopper, 
  CreditCard,
  CheckCircle2,
  Smile,
  Cake,
  Link as LinkIcon,
  Calendar,
  Mail,
  ChevronDown,
  Menu,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { occasions } from "@/lib/constants/occasions";
import { useDebounce } from "@/hooks/useDebounce";
import { formatPrice } from "@/lib/currency";
import { useCurrency } from "@/context/CurrencyContext";
import { ADDONS, PLANS } from "@/lib/constants/pricing";

// Define the steps
const STEPS = [
  { id: "recipient", title: "Recipient Info", icon: PersonStanding, status: "In Progress" },
  { id: "message", title: "Personal Message", icon: Edit3, status: "Upcoming" },
  { id: "media", title: "Memory Lane", icon: ImageIcon, status: "Upcoming" },
  { id: "reveal", title: "The Reveal", icon: PartyPopper, status: "Upcoming" },
  { id: "pay", title: "Review & Pay", icon: CreditCard, status: "Upcoming" },
];

export default function CreationDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const { id: draftId } = params as { id: string };
  const { currency } = useCurrency();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Form State
  const [recipientName, setRecipientName] = useState("");
  const [occasionId, setOccasionId] = useState("");
  const [customOccasion, setCustomOccasion] = useState("");
  const [urlSlug, setUrlSlug] = useState("");
  const [unlockDate, setUnlockDate] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  
  // App context from Firestore
  const [momentData, setMomentData] = useState<any>(null);
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
  const [checkingSlug, setCheckingSlug] = useState(false);

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
        const docRef = doc(db!, "drafts", draftId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setMomentData(data);
          setRecipientName(data.recipientName || "");
          setOccasionId(data.occasionId || "");
          setCustomOccasion(data.customOccasion || "");
          setUrlSlug(data.urlSlug || "");
          setUnlockDate(data.unlockDate || "");
          setRecipientEmail(data.recipientEmail || "");
          setLoading(false);
        } else {
          router.push("/dashboard");
        }
      } catch (err) {
        console.error("Error loading draft:", err);
      }
    }
    if (user) loadDraft();
  }, [draftId, user, router]);

  // Debounced Save Logic
  const debouncedName = useDebounce(recipientName, 1000);
  const debouncedOccasionId = useDebounce(occasionId, 1000);
  const debouncedCustomOccasion = useDebounce(customOccasion, 1000);
  const debouncedUrlSlug = useDebounce(urlSlug, 1000);
  const debouncedUnlockDate = useDebounce(unlockDate, 1000);
  const debouncedRecipientEmail = useDebounce(recipientEmail, 1000);

  const saveDraft = useCallback(async (updates: any) => {
    if (!draftId) return;
    setSaving(true);
    setSaveError(false);
    try {
      const docRef = doc(db!, "drafts", draftId);
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
  }, [draftId]);

  useEffect(() => {
    if (loading) return;
    saveDraft({ recipientName: debouncedName });
  }, [debouncedName, saveDraft, loading]);

  useEffect(() => {
    if (loading) return;
    saveDraft({ occasionId: debouncedOccasionId, customOccasion: debouncedCustomOccasion });
  }, [debouncedOccasionId, debouncedCustomOccasion, saveDraft, loading]);

  useEffect(() => {
    if (loading) return;
    saveDraft({ urlSlug: debouncedUrlSlug });
  }, [debouncedUrlSlug, saveDraft, loading]);

  useEffect(() => {
    if (loading) return;
    saveDraft({ unlockDate: debouncedUnlockDate });
  }, [debouncedUnlockDate, saveDraft, loading]);

  useEffect(() => {
    if (loading) return;
    saveDraft({ recipientEmail: debouncedRecipientEmail });
  }, [debouncedRecipientEmail, saveDraft, loading]);

  // Addon Logic
  const hasAddon = (addonId: string) => {
    if (!momentData) return false;
    if (momentData.plan === "premium") return true;
    return momentData.selectedAddons?.includes(addonId);
  };

  const toggleAddon = async (addonId: string) => {
    if (momentData.plan === "premium") return;
    
    const isEnabled = momentData.selectedAddons?.includes(addonId);
    const newAddons = isEnabled 
      ? momentData.selectedAddons.filter((id: string) => id !== addonId)
      : [...(momentData.selectedAddons || []), addonId];
    
    // Recalculate price
    const plan = PLANS.find(p => p.id === momentData.plan)!;
    let newPrice = plan.price[currency];
    newAddons.forEach((id: string) => {
      const addon = ADDONS.find(a => a.id === id);
      if (addon) newPrice += addon.price[currency];
    });

    const updates = {
      selectedAddons: newAddons,
      totalPrice: newPrice
    };

    setMomentData({ ...momentData, ...updates });
    await saveDraft(updates);
  };

  // Slug Availability Check
  useEffect(() => {
    async function checkSlug() {
      if (debouncedUrlSlug.length < 3) {
        setSlugAvailable(null);
        return;
      }
      setCheckingSlug(true);
      try {
        // Check drafts
        const qDrafts = query(collection(db!, "drafts"), where("urlSlug", "==", debouncedUrlSlug));
        const draftSnap = await getDocs(qDrafts);
        const existsInDrafts = draftSnap.docs.some(doc => doc.id !== draftId);
        
        if (existsInDrafts) {
          setSlugAvailable(false);
          setCheckingSlug(false);
          return;
        }

        // Check moments (published)
        const qMoments = query(collection(db!, "moments"), where("urlSlug", "==", debouncedUrlSlug));
        const momentSnap = await getDocs(qMoments);
        const existsInMoments = !momentSnap.empty;

        setSlugAvailable(!existsInMoments);
      } catch (err) {
        console.error("Error checking slug:", err);
      } finally {
        setCheckingSlug(false);
      }
    }
    checkSlug();
  }, [debouncedUrlSlug, draftId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fcf9f8] dark:bg-[#211511]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-[#fcf9f8] dark:bg-[#211511] overflow-hidden font-display">
      {/* Sidebar Navigation */}
      <aside className={cn(
        "fixed inset-y-0 left-0 w-80 bg-white dark:bg-[#2a1d19] border-r border-[#e7d6d0] z-50 transition-transform duration-300 lg:relative lg:translate-x-0 shadow-sm",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-8 flex items-center gap-3">
            <div className="size-8 text-primary">
              <svg className="w-full h-full" fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 42.4379C4 42.4379 14.0962 36.0744 24 41.1692C35.0664 46.8624 44 42.2078 44 42.2078L44 7.01134C44 7.01134 35.068 11.6577 24.0031 5.96913C14.0971 0.876274 4 7.27094 4 7.27094L4 42.4379Z" fill="currentColor"></path>
              </svg>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-[#1b110e] dark:text-white">Supriseal</h1>
            <button className="lg:hidden ml-auto p-1" onClick={() => setSidebarOpen(false)}>
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Stepper */}
          <nav className="flex-1 px-6 py-4 overflow-y-auto">
            <ul className="space-y-3">
              {STEPS.map((step, idx) => {
                const isCurrent = step.id === "recipient";
                return (
                  <li key={step.id}>
                    <div className={cn(
                      "flex items-center gap-4 rounded-xl p-4 transition-all",
                      isCurrent 
                        ? "bg-[#fdf1ec] border border-primary/20" 
                        : "opacity-60 grayscale-[0.2]"
                    )}>
                      <div className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-full transition-all",
                        isCurrent 
                          ? "bg-primary text-white shadow-sm ring-2 ring-primary ring-offset-2 ring-offset-[#fdf1ec]" 
                          : "border-2 border-[#e7d6d0] bg-white dark:bg-transparent text-[#e7d6d0]"
                      )}>
                        <step.icon size={18} />
                      </div>
                      <div className="flex flex-col">
                        <span className={cn(
                          "text-sm font-bold",
                          isCurrent ? "text-[#1b110e]" : "text-[#1b110e]/70"
                        )}>{step.title}</span>
                        <span className={cn(
                          "text-[10px] font-bold uppercase tracking-wider",
                          isCurrent ? "text-primary" : "text-[#97604e]"
                        )}>{step.status}</span>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* User Profile */}
          <div className="p-6 border-t border-[#e7d6d0]">
            <div className="flex items-center gap-3 w-full p-2 rounded-lg">
              <div className="h-10 w-10 rounded-full bg-primary/10 border border-[#e7d6d0] flex items-center justify-center text-primary font-bold">
                {user?.displayName?.charAt(0) || user?.email?.charAt(0).toUpperCase()}
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-[#1b110e] dark:text-white truncate max-w-[150px]">
                  {user?.displayName || "My Account"}
                </span>
                <span className="text-[10px] font-bold text-primary uppercase">{momentData.plan} Plan</span>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full overflow-y-auto relative bg-[#fcf9f8] dark:bg-[#211511]">
        {/* Mobile Header */}
        <div className="lg:hidden flex items-center justify-between px-6 py-4 border-b border-[#e7d6d0] bg-white dark:bg-[#2a1d19]">
          <div className="flex items-center gap-2 text-primary">
             <svg className="size-6" fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 42.4379C4 42.4379 14.0962 36.0744 24 41.1692C35.0664 46.8624 44 42.2078 44 42.2078L44 7.01134C44 7.01134 35.068 11.6577 24.0031 5.96913C14.0971 0.876274 4 7.27094 4 7.27094L4 42.4379Z" fill="currentColor"></path>
              </svg>
            <span className="font-bold">Supriseal</span>
          </div>
          <button className="p-2" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-6 w-6" />
          </button>
        </div>

        {/* Top Actions Bar */}
        <div className="w-full px-8 py-6 flex justify-between items-center">
          <button 
            onClick={() => router.push("/dashboard")}
            className="flex items-center gap-2 text-[#97604e] hover:text-primary transition-colors text-sm font-bold"
          >
            <ArrowLeft size={16} />
            Back to Dashboard
          </button>
          
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 text-xs font-medium text-[#97604e]">
              {saving ? (
                <span className="flex items-center gap-1.5 animate-pulse">
                  <Loader2 size={12} className="animate-spin" />
                  Saving...
                </span>
              ) : saveError ? (
                <span className="text-red-500">Failed to save draft</span>
              ) : lastSaved ? (
                <span>Last saved {lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              ) : null}
            </div>
            <Button variant="outline" className="rounded-lg h-10 border-[#e7d6d0] bg-white text-xs font-bold" onClick={() => saveDraft({})}>
              Save Draft
            </Button>
          </div>
        </div>

        {/* Form Container */}
        <div className="flex-1 flex justify-center w-full px-4 pb-32 pt-4">
          <div className="w-full max-w-[640px] flex flex-col items-center sm:items-start animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div className="mb-10 text-center sm:text-left">
              <h1 className="text-3xl sm:text-4xl font-extrabold text-[#1b110e] dark:text-white mb-3 tracking-tight">
                Who is this surprise for?
              </h1>
              <p className="text-lg text-[#97604e] font-medium">
                Let's start with the basics to set up your celebration page.
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
                      className="w-full h-14 pl-12 pr-4 bg-white dark:bg-white/5 border border-[#e7d6d0] rounded-lg text-[#1b110e] dark:text-white placeholder:text-[#97604e]/50 focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all outline-none" 
                      placeholder="e.g. Sarah Jenkins"
                      type="text"
                    />
                  </div>
                </div>

                {/* Occasion */}
                <div className="flex flex-col gap-2.5">
                  <label className="text-sm font-bold text-[#1b110e] dark:text-white ml-1">Occasion</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Cake className="text-[#97604e] group-focus-within:text-primary transition-colors h-5 w-5" />
                    </div>
                    <select 
                      value={occasionId}
                      onChange={(e) => setOccasionId(e.target.value)}
                      className="w-full h-14 pl-12 pr-10 bg-white dark:bg-white/5 border border-[#e7d6d0] rounded-lg text-[#1b110e] dark:text-white focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all outline-none appearance-none cursor-pointer"
                    >
                      <option value="" disabled>Select an occasion</option>
                      {occasions.map(occ => (
                        <option key={occ.id} value={occ.id}>{occ.title}</option>
                      ))}
                      <option value="custom">Other / Custom</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                      <ChevronDown className="text-[#97604e] h-5 w-5" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Custom Occasion Input */}
              {occasionId === "custom" && (
                <div className="flex flex-col gap-2.5 animate-in fade-in slide-in-from-top-2">
                  <label className="text-sm font-bold text-[#1b110e] dark:text-white ml-1">Specify Occasion</label>
                  <input 
                    value={customOccasion}
                    onChange={(e) => setCustomOccasion(e.target.value)}
                    className="w-full h-14 px-4 bg-white dark:bg-white/5 border border-[#e7d6d0] rounded-lg text-[#1b110e] dark:text-white focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all outline-none" 
                    placeholder="e.g. New Job, Engagement, etc."
                    type="text"
                  />
                </div>
              )}

              {/* Custom Link Section */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-sm font-bold text-[#1b110e] dark:text-white ml-1">Custom Link</label>
                  {!hasAddon("customUrl") && (
                    <button 
                      onClick={() => toggleAddon("customUrl")}
                      className="text-[10px] font-bold text-primary uppercase bg-primary/5 px-2 py-1 rounded-full border border-primary/20 hover:bg-primary/10 transition-colors"
                    >
                      + Add for {formatPrice(1000, currency)}
                    </button>
                  )}
                </div>

                {!hasAddon("customUrl") ? (
                   <div className="flex items-center gap-3 p-4 bg-[#f9f5f4] dark:bg-white/5 rounded-lg border border-[#e7d6d0] border-dashed">
                      <div className="size-8 rounded-full bg-white dark:bg-white/10 flex items-center justify-center text-[#97604e]">
                        <LinkIcon size={16} />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-[#1b110e]/70 uppercase tracking-tighter">Your temporary link</span>
                        <span className="text-sm font-medium text-[#97604e]">supriseal.com/{draftId.slice(0, 8)}...</span>
                      </div>
                   </div>
                ) : (
                  <div className="flex rounded-lg border border-[#e7d6d0] bg-white dark:bg-white/5 overflow-hidden focus-within:ring-4 focus-within:ring-primary/10 focus-within:border-primary transition-all">
                    <div className="bg-[#fcf9f8] dark:bg-white/10 px-4 flex items-center border-r border-[#e7d6d0]">
                      <span className="text-[#97604e] font-bold text-sm whitespace-nowrap">supriseal.com/</span>
                    </div>
                    <input 
                      value={urlSlug}
                      onChange={(e) => setUrlSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                      className="flex-1 h-14 px-4 bg-transparent border-none text-[#1b110e] dark:text-white placeholder:text-[#97604e]/50 focus:ring-0 outline-none font-medium" 
                      placeholder="sarahs-big-30"
                      type="text"
                    />
                    <div className="pr-4 flex items-center">
                      {checkingSlug ? (
                         <Loader2 size={16} className="text-primary animate-spin" />
                      ) : slugAvailable === true ? (
                        <CheckCircle2 size={16} className="text-green-500" />
                      ) : slugAvailable === false ? (
                        <X size={16} className="text-red-500" />
                      ) : null}
                    </div>
                  </div>
                )}
                {hasAddon("customUrl") && slugAvailable === false && (
                   <p className="text-[10px] text-red-500 font-bold ml-1">Oops! This link is already taken.</p>
                )}
                {!hasAddon("customUrl") && (
                  <p className="text-[10px] text-[#97604e] ml-1 font-medium">Customise the link to make it personal and memorable.</p>
                )}
              </div>

              {/* Unlock Date Section */}
              <div className="flex flex-col gap-3">
                 <div className="flex items-center justify-between mb-1">
                  <label className="text-sm font-bold text-[#1b110e] dark:text-white ml-1">Scheduled Reveal</label>
                  {!hasAddon("scheduledReveal") && (
                    <button 
                      onClick={() => toggleAddon("scheduledReveal")}
                      className="text-[10px] font-bold text-primary uppercase bg-primary/5 px-2 py-1 rounded-full border border-primary/20 hover:bg-primary/10 transition-colors"
                    >
                      + Add for {formatPrice(1000, currency)}
                    </button>
                  )}
                </div>

                {!hasAddon("scheduledReveal") ? (
                  <div 
                    onClick={() => toggleAddon("scheduledReveal")}
                    className="flex items-center gap-4 p-5 bg-white dark:bg-white/5 border-2 border-[#e7d6d0] rounded-lg border-dashed cursor-pointer hover:border-primary/30 group transition-all"
                  >
                    <div className="p-3 rounded-lg bg-[#fdf1ec] text-primary group-hover:scale-110 transition-transform">
                      <Calendar size={20} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-[#1b110e]">Unlock on a specific date</h4>
                      <p className="text-[10px] text-[#97604e] font-medium leading-relaxed mt-0.5">
                        Set a precise moment for the surprise to go live and notify the recipient automatically.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-top-2">
                    <div className="flex flex-col gap-2">
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
                        <p className="text-[10px] text-[#97604e] font-medium ml-1">The surprise will be revealed at 00:00 local time.</p>
                    </div>

                    <div className="flex flex-col gap-2">
                       <div className="relative group">
                          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Mail className="text-[#97604e] group-focus-within:text-primary transition-colors h-5 w-5" />
                          </div>
                          <input 
                            value={recipientEmail}
                            onChange={(e) => setRecipientEmail(e.target.value)}
                            className="w-full h-14 pl-12 pr-4 bg-white dark:bg-white/5 border border-[#e7d6d0] rounded-lg text-[#1b110e] dark:text-white focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all outline-none font-medium" 
                            placeholder="Recipient's Email"
                            type="email"
                          />
                        </div>
                        <p className="text-[10px] text-[#97604e] font-medium ml-1">We'll send them the link when it's time!</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Sticky Footer */}
        <div className="sticky bottom-0 w-full bg-white/80 dark:bg-[#211511]/90 backdrop-blur-md border-t border-[#e7d6d0] py-5 px-8 z-40">
          <div className="max-w-[960px] mx-auto flex items-center justify-between gap-6">
            <div className="hidden sm:flex flex-col flex-1 max-w-[200px]">
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-[10px] text-[#97604e] uppercase tracking-wider font-extrabold">Step 1 of 5</span>
                <span className="text-[10px] text-primary font-extrabold">20%</span>
              </div>
              <div className="h-2 w-full bg-[#f3eae7] rounded-full overflow-hidden">
                <div className="h-full bg-primary w-1/5 rounded-full shadow-[0_0_8px_rgba(230,76,25,0.4)]"></div>
              </div>
            </div>

            <div className="flex items-center gap-4 w-full sm:w-auto">
               <div className="sm:hidden flex-1 flex flex-col justify-center">
                  <span className="text-[10px] text-[#97604e] uppercase tracking-wider font-extrabold mb-1">Step 1</span>
                  <div className="h-1.5 w-full bg-[#f3eae7] rounded-full overflow-hidden">
                    <div className="h-full bg-primary w-1/5 rounded-full"></div>
                  </div>
               </div>
               
               <Button 
                variant="ghost" 
                className="hidden sm:inline-flex rounded-lg px-6 font-bold text-[#97604e] hover:text-[#1b110e] hover:bg-transparent"
                onClick={() => router.push("/dashboard")}
               >
                 Cancel
               </Button>

               <Button 
                onClick={() => router.push(`/create/${draftId}/message`)}
                disabled={!recipientName || !occasionId || (occasionId === "custom" && !customOccasion) || (hasAddon("customUrl") && slugAvailable === false)}
                className="flex-1 sm:flex-none h-12 px-8 rounded-lg bg-primary hover:bg-primary-dark text-white font-bold shadow-lg shadow-primary/20 transform active:scale-[0.98] transition-all flex items-center gap-2"
               >
                 Continue
                 <ArrowRight size={18} />
               </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
