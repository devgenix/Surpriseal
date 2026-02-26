
export const DEFAULT_SCENES = [
  { id: "default-1", type: "composition" as const, config: { text: "Life is full of surprises..." } }
];

export function prepareMomentForEngine(momentData: any) {
  if (!momentData) return null;

  const styleConfig = momentData.styleConfig || {};
  
  // Ensure we have at least one scene
  const scenes = styleConfig.scenes && styleConfig.scenes.length > 0 
    ? styleConfig.scenes 
    : DEFAULT_SCENES;

  return {
    ...momentData,
    styleConfig: {
      ...styleConfig,
      scenes
    },
    recipientName: momentData.recipientName || "Someone Special",
    senderName: momentData.senderName || "",
    isAnonymous: momentData.isAnonymous || false,
    personalMessage: momentData.personalMessage || "",
    media: momentData.media || [],
    plan: momentData.plan || "free",
    paidAddons: momentData.paidAddons || []
  };
}
