import { adminDb } from "./firebase-admin";

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
export async function getMomentByIdOrSlug(idOrSlug: string): Promise<MomentData | null> {
  if (!adminDb) return null;

  try {
    // 1. Try Direct ID Lookup
    const idSnap = await adminDb.collection("moments").doc(idOrSlug).get();
    if (idSnap.exists) {
      return { id: idSnap.id, ...idSnap.data() } as MomentData;
    }

    // 2. Try Slug Lookup
    const slugLower = idOrSlug.toLowerCase();
    const slugQuery = await adminDb.collection("moments")
      .where("urlSlug", "==", slugLower)
      .limit(1)
      .get();

    if (!slugQuery.empty) {
      const doc = slugQuery.docs[0];
      return { id: doc.id, ...doc.data() } as MomentData;
    }

    return null;
  } catch (error) {
    console.error("Error fetching moment on server:", error);
    return null;
  }
}
