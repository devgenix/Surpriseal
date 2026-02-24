"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { db, auth } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { onAuthStateChanged, User } from "firebase/auth";
import { 
  Loader2, 
  PartyPopper,
  Link as LinkIcon,
  Calendar,
  CheckCircle2,
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCreation } from "@/context/CreationContext";
import { cn } from "@/lib/utils";

export default function CreationRevealPage() {
  const router = useRouter();
  const params = useParams();
  const { id: draftId } = params as { id: string };

  const { 
    momentData,
    setMomentData, 
    setOnSave,
    setOnContinue,
    setCanContinue
  } = useCreation();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [revealType, setRevealType] = useState<"instant" | "scheduled">("instant");

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
          setRevealType(data.revealType || "instant");
          setLoading(false);
          setCanContinue(true);
        } else {
          router.push("/dashboard");
        }
      } catch (err) {
        console.error("Error loading draft:", err);
      }
    }
    if (user) loadDraft();
  }, [draftId, user, router, setMomentData, setCanContinue]);

  const onContinueAction = useCallback(async () => {
    if (!draftId) return;
    const docRef = doc(db!, "drafts", draftId);
    await updateDoc(docRef, { 
      revealType,
      completedSteps: Array.from(new Set([...(momentData?.completedSteps || []), "reveal"]))
    });
    router.push(`/dashboard/create/${draftId}/pay`);
  }, [draftId, revealType, router, momentData]);

  useEffect(() => {
    setOnContinue(() => onContinueAction);
    return () => setOnContinue(null);
  }, [onContinueAction, setOnContinue]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex justify-center w-full px-4 pb-32 pt-4">
      <div className="w-full max-w-[640px] flex flex-col items-center sm:items-start animate-in fade-in slide-in-from-bottom-4 duration-700">
        
        <div className="mb-10 text-center sm:text-left">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#1b110e] dark:text-white mb-3 tracking-tight">
            How should we reveal it?
          </h1>
          <p className="text-lg text-[#97604e] font-medium">
            Choose how you'd like your recipient to experience the surprise.
          </p>
        </div>

        <div className="w-full flex flex-col gap-4">
          {/* Instant Link Option */}
          <button 
            onClick={() => setRevealType("instant")}
            className={cn(
              "flex items-center gap-6 p-6 rounded-2xl border-2 transition-all text-left group",
              revealType === "instant" 
                ? "bg-white border-primary shadow-lg shadow-primary/5" 
                : "bg-[#f9f5f4] border-[#e7d6d0] hover:border-primary/30"
            )}
          >
            <div className={cn(
              "p-4 rounded-xl transition-all",
              revealType === "instant" ? "bg-primary text-white" : "bg-white text-[#97604e]"
            )}>
              <LinkIcon size={24} />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-lg font-bold text-[#1b110e]">Instant Link</h3>
                {revealType === "instant" && <CheckCircle2 className="text-primary" size={20} />}
              </div>
              <p className="text-xs text-[#97604e] font-medium leading-relaxed">
                You'll get a secret link to share whenever you're ready. Perfect for face-to-face reveals!
              </p>
            </div>
          </button>

          {/* Scheduled Reveal Option */}
          <button 
            onClick={() => setRevealType("scheduled")}
            className={cn(
              "flex items-center gap-6 p-6 rounded-2xl border-2 transition-all text-left group relative overflow-hidden",
              revealType === "scheduled" 
                ? "bg-white border-primary shadow-lg shadow-primary/5" 
                : "bg-[#f9f5f4] border-[#e7d6d0] hover:border-primary/30"
            )}
          >
            <div className={cn(
              "p-4 rounded-xl transition-all",
              revealType === "scheduled" ? "bg-primary text-white" : "bg-white text-[#97604e]"
            )}>
              <Calendar size={24} />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-[#1b110e]">Scheduled Gift</h3>
                  <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full uppercase tracking-widest">Add-on</span>
                </div>
                {revealType === "scheduled" && <CheckCircle2 className="text-primary" size={20} />}
              </div>
              <p className="text-xs text-[#97604e] font-medium leading-relaxed">
                We'll automatically unlock and email the surprise at your chosen date and time.
              </p>
            </div>
          </button>

          <div className="mt-8 p-6 rounded-2xl bg-primary/5 border border-primary/10 flex items-start gap-4">
            <div className="p-2 rounded-lg bg-primary text-white mt-1">
              <Sparkles size={16} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-[#1b110e]">The Final Transformation</h4>
              <p className="text-[11px] text-[#97604e] font-medium leading-relaxed mt-1">
                Once payment is confirmed, we'll transform your draft into a beautiful, interactive celebration page with confetti, music, and all your memories.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
