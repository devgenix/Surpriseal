import { adminDb } from "./firebase-admin";
import { cache } from "react";

// Simple module-level cache to deduplicate identical requests in the same tick 
// (Useful when Next.js `cache()` doesn't perfectly span generateMetadata and the page)
const requestCache = new Map<string, Promise<MomentData | null>>();
const CACHE_TTL_MS = 10000; // 10 seconds

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

  if (requestCache.has(idOrSlug)) {
    return requestCache.get(idOrSlug)!;
  }

  try {
    let timeoutId: NodeJS.Timeout;
    const timeoutPromise = new Promise((_, reject) => {
      timeoutId = setTimeout(() => reject(new Error("Firestore query timed out")), 10000);
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

    const promise = Promise.race([performLookup(), timeoutPromise]) as Promise<MomentData | null>;
    
    // Store promise in cache
    requestCache.set(idOrSlug, promise);
    
    // Auto-clear cache after TTL to prevent stale data
    setTimeout(() => {
      requestCache.delete(idOrSlug);
    }, CACHE_TTL_MS);

    return await promise;
  } catch (error) {
    console.error("Error fetching moment on server:", error);
    return null;
  }
});
