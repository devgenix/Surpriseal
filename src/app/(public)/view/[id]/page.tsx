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
    },
  };
}

export default async function PublicViewPage({ params }: Props) {
  const { id } = await params;
  const moment = await getMomentByIdOrSlug(id);

  if (!moment) {
    redirect("/");
  }

  // Serialize Firestore timestamps or other non-plain objects if necessary
  const serializedMoment = JSON.parse(JSON.stringify(moment));

  return <ViewClient initialMomentData={serializedMoment} momentId={moment.id} />;
}
