import { adminDb } from "./firebase-admin";
import { cache } from "react";

export interface MomentData {
  id: string;
  recipientName?: string;
  senderName?: string;
  isAnonymous?: boolean;
  occasionId?: string;
  personalMessage?: string;
  media?: any[];
  styleConfig?: any;
  plan?: string;
  paidAddons?: string[];
  urlSlug?: string;
  status?: string;
  revealTime?: any;
  scheduledReveal?: boolean;
  [key: string]: any;
}

/**
 * Fetches a moment from Firestore by its ID or by its urlSlug.
 * This is meant to be used in Server Components or API routes.
 */
export const getMomentByIdOrSlug = cache(async function getMomentByIdOrSlug(idOrSlug: string): Promise<MomentData | null> {
  console.log("Fetching moment for ID or Slug:", idOrSlug);
  if (!adminDb) {
    console.error("adminDb is not initialized!");
    return null;
  }

  try {
    let timeoutId: NodeJS.Timeout;
    const timeoutPromise = new Promise((_, reject) => {
      timeoutId = setTimeout(() => reject(new Error("Firestore query timed out")), 4500);
    });

    const performLookup = async () => {
      try {
        // 1. Try Direct ID Lookup
        const idSnap = await adminDb.collection("moments").doc(idOrSlug).get();
        if (idSnap.exists) {
          console.log("Found moment by ID:", idSnap.id);
          return { id: idSnap.id, ...idSnap.data() } as MomentData;
        }

        // 2. Try Slug Lookup
        const slugLower = idOrSlug.toLowerCase();
        console.log("Attempting slug lookup with:", slugLower);
        const slugQuery = await adminDb.collection("moments")
          .where("urlSlug", "==", slugLower)
          .limit(1)
          .get();

        if (!slugQuery.empty) {
          const doc = slugQuery.docs[0];
          console.log("Found moment by slug:", doc.id);
          return { id: doc.id, ...doc.data() } as MomentData;
        }

        console.warn("No moment found for:", idOrSlug);
        return null;
      } finally {
        if (timeoutId) clearTimeout(timeoutId);
      }
    };

    return await Promise.race([performLookup(), timeoutPromise]) as MomentData | null;
  } catch (error) {
    console.error("Error fetching moment on server:", error);
    return null;
  }
});
