import { Metadata } from "next";
import { getMomentByIdOrSlug } from "@/lib/moments-server";
import { redirect } from "next/navigation";
import ViewClient from "@/components/reveal/ViewClient";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const moment = await getMomentByIdOrSlug(id);

  if (!moment) {
    return {
      title: "Surpriseal | Share Magical Moments",
      description: "Reveal your digital surprise page.",
    };
  }

  const recipient = moment.recipientName || "Someone Special";
  const sender = moment.isAnonymous ? "a thoughtful person" : (moment.senderName || "a thoughtful person");
  
  return {
    title: `A Surprise For ${recipient} | Surpriseal`,
    description: `Created by ${sender}. Reveal this special surprise!`,
    openGraph: {
      title: `A Surprise For ${recipient} | Surpriseal`,
      description: `Created by ${sender}. Reveal this special surprise!`,
      images: moment.imageUrl ? [moment.imageUrl] : [],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `A Surprise For ${recipient} | Surpriseal`,
      description: `Created by ${sender}. Reveal this special surprise!`,
      images: moment.imageUrl ? [moment.imageUrl] : [],
    },
  };
}

export default async function PublicViewPage({ params }: Props) {
  const { id } = await params;
  console.log("Rendering PublicViewPage for ID:", id);
  
  const moment = await getMomentByIdOrSlug(id);

  if (!moment) {
    console.warn("Moment NOT FOUND in PublicViewPage, redirecting to home.");
    redirect("/");
  }

  // Improved serialization to handle Firestore Timestamps and nulls
  const serializeData = (data: any) => {
    if (!data) return data;
    const stringified = JSON.stringify(data, (key, value) => {
      // Convert Firestore Timestamps to ISO strings
      if (value && typeof value === 'object' && ('_seconds' in value || 'seconds' in value)) {
        const date = value.toDate ? value.toDate() : new Date((value.seconds || value._seconds) * 1000);
        return date.toISOString();
      }
      return value;
    });
    return JSON.parse(stringified);
  };

  const serializedMoment = serializeData(moment);
  
  // Security Assessment Action: Explicitly strip highly sensitive fields before passing directly to the public client object
  delete serializedMoment.userId;
  delete serializedMoment.creatorEmail;
  delete serializedMoment.paidAmount;
  delete serializedMoment.lastPaymentDetails;
  delete serializedMoment.isPaid;
  delete serializedMoment.stripeSessionId;

  return <ViewClient initialMomentData={serializedMoment} momentId={moment.id} />;
}
