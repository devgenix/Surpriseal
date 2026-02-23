"use client";

import ConfigureStep from "@/components/creation/ConfigureStep";
import { useParams } from "next/navigation";

export default function EditConfigurePage() {
  const params = useParams();
  const { id } = params as { id: string };

  return <ConfigureStep draftId={id} />;
}
