"use client";

import { useEffect, useMemo } from "react";
import { useCreation, CreationProvider } from "@/context/CreationContext";
import { CreationSidebar } from "@/components/layout/CreationSidebar";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import RevealEngine from "@/components/reveal/RevealEngine";
import { prepareMomentForEngine } from "@/components/reveal/utilities/RevealEngineUtils";
import {
  Settings,
  PersonStanding,
  CreditCard,
  Menu,
  ArrowLeft,
  ArrowRight,
  Save,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Sliders,
  Maximize2,
  ChevronDown,
  PenTool,
  Play,
  Heart,
  Award,
  Image as ImageIcon,
  Mic,
  Scroll
} from "lucide-react";
import { formatPrice } from "@/lib/currency";
import { calculateMomentPrice } from "@/lib/pricing-utils";
import { useCurrency } from "@/context/CurrencyContext";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const STEPS = [
  { id: "configure", title: "Configure", icon: Settings },
  { id: "recipient", title: "Recipient Info", icon: PersonStanding },
  { id: "style", title: "Content Studio", icon: Sparkles },
  { id: "settings", title: "Security & Sharing", icon: Sliders },
  { id: "pay", title: "Review & Pay", icon: CreditCard },
];

function CreationLayoutInner({ children }: { children: React.ReactNode }) {
  const {
    momentData,
    sidebarOpen,
    setSidebarOpen,
    saving,
    saveError,
    lastSaved,
    canContinue,
    onSave,
    onContinue,
    isCinematic,
    activeSceneId,
    activeMobileMode,
    setActiveMobileMode,
    setIsScenePickerOpen,
    toggleFullScreen
  } = useCreation();

  // Auto-fullscreen on mobile for creation flow
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Check if on mobile
    const isMobile = window.innerWidth < 1024 || /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    
    if (isMobile && !document.fullscreenElement) {
      const enterFS = () => {
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(() => {
            // Silently fail if blocked by browser
          });
        }
      };
      
      // Attempt once
      enterFS();
      
      // Also bind to first click/touch since browsers require interaction for FS
      window.addEventListener('click', enterFS, { once: true });
      window.addEventListener('touchstart', enterFS, { once: true });
      
      return () => {
        window.removeEventListener('click', enterFS);
        window.removeEventListener('touchstart', enterFS);
      };
    }
  }, []);

  const { user, logout } = useAuth();
  const { currency } = useCurrency();
  const pathname = usePathname();
  const router = useRouter();

  const getSteps = () => {
    const completedSteps = momentData?.completedSteps || [];
    const paidAddons = momentData?.paidAddons || [];
    const selectedAddons = momentData?.selectedAddons || [];
    const hasUnpaidAddons = selectedAddons.some(
      (id: string) => !paidAddons.includes(id)
    );

    return STEPS.map((step) => {
      let status = "Upcoming";

      const isCurrent =
        (step.id === "configure" &&
          (pathname === "/dashboard/create" ||
            (pathname.startsWith("/dashboard/create/") &&
              !pathname.includes("/", 18)))) ||
        (step.id === "recipient" && pathname.includes("/details")) ||
        (step.id === "settings" && pathname.includes("/settings")) ||
        (step.id === "style" && pathname.includes("/style")) ||
        (step.id === "pay" && pathname.includes("/pay"));

      if (isCurrent) {
        status = "In Progress";
      } else if (step.id === "pay") {
        status =
          momentData?.isPaid && !hasUnpaidAddons
            ? "Completed"
            : "Upcoming";
      } else if (
        completedSteps.includes(step.id) ||
        momentData?.status === "Published"
      ) {
        status = "Completed";
      }

      return { ...step, status };
    });
  };

  const steps = getSteps();
  const currentStepIndex = steps.findIndex(
    (s) => s.status === "In Progress"
  );
  const currentStep = steps[currentStepIndex] || steps[0];
  const progress =
    ((currentStepIndex + 1) / steps.length) * 100;

  const isStyleStep = currentStep.id === "style";

  const activeSceneInfo = useMemo(() => {
    if (!isStyleStep) return null;
    if (activeSceneId === "splash") return { title: "Splash Screen", icon: Heart };
    if (activeSceneId === "branding") return { title: "Final Screen", icon: Award };
    
    const scenes = momentData?.styleConfig?.scenes || [];
    const idx = scenes.findIndex((s: any) => s.id === activeSceneId);
    if (idx === -1) return { title: "Studio", icon: Sparkles };

    const scene = scenes[idx];
    const typeLabel = scene?.type === "gallery" ? "Memory Gallery" : 
                     scene?.type === "video" ? "Video Message" : 
                     scene?.type === "audio" ? "Voice Note" : "Message Note";
    const icon = scene?.type === "gallery" ? ImageIcon : 
                 scene?.type === "video" ? Play :
                 scene?.type === "audio" ? Mic : Scroll;
    
    return { title: `Step ${idx + 1}: ${typeLabel}`, icon };
  }, [isStyleStep, activeSceneId, momentData?.styleConfig?.scenes]);

  const activeSceneIndex = useMemo(() => {
    if (!activeSceneId || activeSceneId === "splash") return -1;
    const scenes = momentData?.styleConfig?.scenes || [];
    if (activeSceneId === "branding") return scenes.length;
    const idx = scenes.findIndex((s: any) => s.id === activeSceneId);
    return idx === -1 ? -1 : idx;
  }, [activeSceneId, momentData?.styleConfig?.scenes]);

  const isConfigureStep = currentStep.id === "configure";

  const handleBack = () => router.back();

  return (
    <div className="flex h-[100dvh] w-full bg-background overflow-hidden font-display">
      <CreationSidebar
        currentStepId={currentStep.id}
        steps={steps}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        momentData={momentData}
        user={user}
        logout={logout}
      />

      <main className="flex-1 flex flex-col h-full overflow-hidden relative">

        {/* ================= HEADER ================= */}
        <header
          style={{ '--header-h': '72px' } as React.CSSProperties}
          className={cn(
            "shrink-0 z-[70] bg-card/80 backdrop-blur-md border-b border-border px-4 h-[72px] flex flex-col justify-center transition-all",
            isCinematic && "hidden lg:flex"
          )}>
          <div className="w-full max-w-4xl mx-auto flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between px-2">

            {/* MOBILE ROW */}
            <div className="flex items-center justify-between w-full lg:hidden">
              {/* Left: Fullscreen Toggle */}
              <div className="flex-none flex justify-start">
                <button 
                  onClick={toggleFullScreen}
                  className="size-9 flex items-center justify-center rounded-lg bg-muted/30 border border-border text-text-muted transition-all active:scale-95 px-3"
                >
                  <Maximize2 size={16} />
                </button>
              </div>

              {/* Middle: Global Step Info & Menu Trigger */}
              <div className="flex-1 flex justify-center px-1">
                <button 
                  onClick={() => setSidebarOpen(true)}
                  className="flex flex-col items-center leading-none active:scale-95 transition-all"
                >
                  <p className="text-[9px] uppercase text-text-muted font-bold tracking-wider">
                    Step {currentStepIndex + 1} of {steps.length}
                  </p>
                  <h1 className="text-sm font-bold text-text-main flex items-center gap-1 leading-none">
                    {currentStep.title}
                    <ChevronDown size={12} className="text-text-muted/60" />
                  </h1>
                </button>
              </div>

              {/* Right: Preview/Edit Button */}
              <div className="flex-none flex justify-end">
                <button 
                  onClick={() => setActiveMobileMode(activeMobileMode === "preview" ? "edit" : "preview")}
                  className={cn(
                    "h-9 px-3 flex items-center justify-center gap-1.5 rounded-lg transition-all active:scale-95",
                    activeMobileMode === "preview" 
                      ? "bg-primary text-white shadow-lg shadow-primary/20" 
                      : "bg-primary/10 text-primary border border-primary/20"
                  )}
                >
                  {activeMobileMode === "preview" ? (
                    <>
                      <PenTool size={14} />
                      <span className="text-[10px] font-black uppercase tracking-tight">Edit</span>
                    </>
                  ) : (
                    <>
                      <Play size={14} />
                      <span className="text-[10px] font-black uppercase tracking-tight">Preview</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* DESKTOP LEFT: Back + Title */}
            <div className="hidden lg:flex items-center gap-4">
              <button
                onClick={handleBack}
                className="flex items-center gap-2 text-sm font-semibold text-text-muted hover:text-primary transition"
              >
                <ArrowLeft size={16} />
                Back
              </button>

              <div className="h-5 w-px bg-border" />

              <h1 className="text-sm font-bold uppercase tracking-wide text-text-main">
                {currentStep.title}
              </h1>
            </div>

            {/* DESKTOP RIGHT: Save Logic */}
            <div className="hidden lg:flex items-center gap-6">

              {!isConfigureStep && (
                <div className="flex items-center gap-2 text-xs text-text-muted">
                  {saving ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      Saving...
                    </>
                  ) : saveError ? (
                    <>
                      <AlertCircle size={14} />
                      Error saving
                    </>
                  ) : lastSaved ? (
                    <>
                      <CheckCircle2 size={14} />
                      Saved{" "}
                      {lastSaved.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </>
                  ) : null}
                </div>
              )}

              {!isConfigureStep && onSave && (
                <Button
                  onClick={() => onSave()}
                  disabled={saving}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Save size={16} />
                  Save
                </Button>
              )}
            </div>
          </div>
        </header>

        {/* ================= CONTENT ================= */}
        <div className="flex-1 overflow-y-auto scroll-smooth relative">
          {children}
        </div>

        {/* ================= MOBILE PREVIEW OVERLAY ================= */}
        {/* Fixed so it never scrolls — sits above content, below header/footer */}
        {activeMobileMode === 'preview' && (
          <div
            className="lg:hidden fixed left-0 right-0 z-[60] bg-black"
            style={{ top: 'var(--header-h, 72px)', bottom: 'var(--footer-h, 88px)' }}
          >
            <RevealEngine 
              moment={prepareMomentForEngine(momentData)} 
              isPreview={true} 
              activeSceneIndex={activeSceneIndex}
            />
          </div>
        )}

        {/* ================= FOOTER ================= */}
        <footer
          style={{ '--footer-h': '88px' } as React.CSSProperties}
          className={cn(
            "shrink-0 z-[70] bg-card/95 backdrop-blur-md border-t border-border px-4 py-5 transition-all",
            isCinematic && "hidden lg:block"
          )}>
          <div className="max-w-4xl mx-auto">

            {/* ================= DESKTOP LAYOUT ================= */}
            <div className="hidden lg:flex items-center justify-between">

              {/* Left: Progress */}
              <div className="flex flex-col w-full max-w-[240px]">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-[10px] text-text-muted uppercase font-extrabold tracking-wider">
                    Step {currentStepIndex + 1} of {steps.length}
                  </span>
                  <span className="text-[10px] text-primary font-extrabold">
                    {Math.round(progress)}%
                  </span>
                </div>
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-500 rounded-full"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              {/* Right: Price + Continue */}
              <div className="flex items-center gap-8">
                <div className="flex flex-col items-end">
                  <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider">
                    {(momentData?.paidAmount || 0) > 0
                      ? "Balance Due"
                      : "Total Price"}
                  </span>
                  <span className="text-2xl font-black text-text-main tabular-nums">
                    {formatPrice(
                      Math.max(
                        0,
                        calculateMomentPrice(
                          momentData?.plan || "base",
                          momentData?.selectedAddons || [],
                          currency
                        ) - (momentData?.paidAmount || 0)
                      ),
                      currency
                    )}
                  </span>
                </div>

                {!(pathname.endsWith("/pay") &&
                  (momentData?.totalPrice || 0) -
                    (momentData?.paidAmount || 0) <= 0) && (
                  <Button
                    onClick={() => onContinue && onContinue()}
                    disabled={!onContinue || !canContinue || saving}
                    className="h-12 px-8 rounded-lg bg-primary hover:bg-primary-dark text-white font-bold shadow-lg shadow-primary/20 active:scale-[0.98] transition-all flex items-center gap-2"
                  >
                    {saving ? (
                      <Loader2 className="animate-spin h-5 w-5" />
                    ) : (
                      <>
                        {pathname.endsWith("/pay")
                          ? "Pay Now"
                          : "Continue"}
                        <ArrowRight size={18} />
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>

            {/* ================= MOBILE LAYOUT ================= */}
            <div className="flex lg:hidden items-center justify-between gap-4">

              {/* Left Parent Div (Save + Balance stacked) */}
              <div className="flex flex-col gap-1">

                {/* Save Status */}
                {!isConfigureStep && (
                  <div className="flex items-center gap-2 text-xs text-text-muted font-medium">
                    {saving ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        Saving...
                      </>
                    ) : (lastSaved ? (
                      <>
                        <CheckCircle2 size={14} />
                        Saved{" "}
                        {lastSaved.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </>
                    ) : null)}
                  </div>
                )}

                {/* Balance Line */}
                <div className="text-sm font-semibold text-text-main tabular-nums">
                  {(momentData?.paidAmount || 0) > 0
                    ? "Balance Due: "
                    : "Total: "}
                  {formatPrice(
                    Math.max(
                      0,
                      calculateMomentPrice(
                        momentData?.plan || "base",
                        momentData?.selectedAddons || [],
                        currency
                      ) - (momentData?.paidAmount || 0)
                    ),
                    currency
                  )}
                </div>

              </div>

              {/* Continue Button (Right Side Same Row) */}
              {!(pathname.endsWith("/pay") &&
                (momentData?.totalPrice || 0) -
                  (momentData?.paidAmount || 0) <= 0) && (
                <Button
                  onClick={() => onContinue && onContinue()}
                  disabled={!onContinue || !canContinue || saving}
                  className="h-11 px-6 rounded-lg bg-primary hover:bg-primary-dark text-white font-bold shadow-lg shadow-primary/20 active:scale-[0.98] transition-all flex items-center gap-2"
                >
                  {saving ? (
                    <Loader2 className="animate-spin h-4 w-4" />
                  ) : (
                    <>
                      {pathname.endsWith("/pay")
                        ? "Pay Now"
                        : "Continue"}
                      <ArrowRight size={16} />
                    </>
                  )}
                </Button>
              )}
            </div>

          </div>
        </footer>
      </main>
    </div>
  );
}

export default function CreationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CreationProvider>
      <CreationLayoutInner>
        {children}
      </CreationLayoutInner>
    </CreationProvider>
  );
}
