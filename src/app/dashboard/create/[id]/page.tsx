"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { db, auth } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { Loader2 } from "lucide-react";
import ConfigureStep from "@/components/creation/ConfigureStep";

export default function EditRedirectPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { id } = params as { id: string };
  const [deciding, setDeciding] = useState(true);
  const shouldResume = searchParams.get("resume") === "true";

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.push("/login");
        return;
      }

      async function checkProgress() {
        if (!id || !db) return;

        // Only redirect if explicitly told to resume
        if (!shouldResume) {
          setDeciding(false);
          return;
        }

        try {
          const docRef = doc(db, "moments", id);
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists()) {
            const data = docSnap.data();
            const lastStepId = data.lastStepId;
            
            // Map step IDs to paths (excluding configure which is this page)
            const stepPaths: Record<string, string> = {
              "recipient": "details",
              "style": "style",
              "pay": "pay"
            };

            const path = stepPaths[lastStepId];
            if (path) {
              router.replace(`/dashboard/create/${id}/${path}`);
            } else {
              setDeciding(false);
            }
          } else {
            router.replace("/dashboard");
          }
        } catch (error) {
          console.error("Error checking progress:", error);
          setDeciding(false);
        }
      }
      checkProgress();
    });

    return () => unsubscribe();
  }, [id, router, shouldResume]);

  if (deciding) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm font-bold uppercase tracking-widest text-[#97604e]">Resuming your creation...</p>
      </div>
    );
  }

  return <ConfigureStep draftId={id} />;
}
