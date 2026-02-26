"use client";

import { Loader2 } from "lucide-react";
import { db, auth } from "@/lib/firebase";
import { useRouter, useParams } from "next/navigation";
import { onAuthStateChanged, User } from "firebase/auth";
import { useCreation } from "@/context/CreationContext";
import { useState, useEffect, useCallback } from "react";
import RevealStudio from "@/components/creation/RevealStudio";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";

export default function CreationStylePage() {
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

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

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
        setLoading(false);
      } catch (err) {
        console.error("Error loading draft:", err);
      }
    }
    if (user) loadDraft();
  }, [draftId, user, router, setMomentData]);

  const saveDraft = useCallback(async (updates: any = {}) => {
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
  }, [draftId, setSaving, setSaveError, setLastSaved, setMomentData]);

  const onContinueAction = useCallback(async () => {
    if (!draftId) return;
    const docRef = doc(db!, "moments", draftId);
    await updateDoc(docRef, { 
      lastStepId: "settings",
      completedSteps: Array.from(new Set([...(momentData?.completedSteps || []), "style"]))
    });
    router.push(`/dashboard/create/${draftId}/settings`);
  }, [draftId, router, momentData]);

  useEffect(() => {
    setOnContinue(() => onContinueAction);
    setOnSave(() => async () => { await saveDraft(); });
    return () => {
      setOnContinue(null);
      setOnSave(null);
    };
  }, [onContinueAction, saveDraft, setOnContinue, setOnSave]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return <RevealStudio draftId={draftId} onSave={saveDraft} />;
}
