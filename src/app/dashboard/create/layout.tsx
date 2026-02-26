"use client";

import { useCreation, CreationProvider } from "@/context/CreationContext";
import { CreationSidebar } from "@/components/layout/CreationSidebar";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
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
} from "lucide-react";
import { formatPrice } from "@/lib/currency";
import { calculateMomentPrice } from "@/lib/pricing-utils";
import { useCurrency } from "@/context/CurrencyContext";
import { Button } from "@/components/ui/button";

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
  } = useCreation();

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

  const isConfigureStep = currentStep.id === "configure";

  const handleBack = () => router.back();

  return (
    <div className="flex h-[100dvh] w-full bg-[#fcf9f8] dark:bg-[#211511] overflow-hidden font-display">
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
        <header className="shrink-0 z-40 bg-white/80 dark:bg-[#2a1d19]/80 backdrop-blur-md border-b border-[#e7d6d0] px-4 h-[72px] flex flex-col justify-center">
          <div className="w-full max-w-4xl mx-auto flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between px-2">

            {/* MOBILE ROW */}
            <div className="flex items-center justify-between w-full lg:hidden">
              <button
                onClick={handleBack}
                className="p-2 text-[#97604e] hover:text-primary transition"
              >
                <ArrowLeft size={20} />
              </button>

              <div className="text-center">
                <p className="text-[10px] uppercase text-[#97604e] font-bold tracking-wider">
                  Step {currentStepIndex + 1} of {steps.length}
                </p>
                <h1 className="text-sm font-bold text-[#1b110e] dark:text-white">
                  {currentStep.title}
                </h1>
              </div>

              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2 text-primary"
              >
                <Menu size={20} />
              </button>
            </div>

            {/* DESKTOP LEFT: Back + Title */}
            <div className="hidden lg:flex items-center gap-4">
              <button
                onClick={handleBack}
                className="flex items-center gap-2 text-sm font-semibold text-[#97604e] hover:text-primary transition"
              >
                <ArrowLeft size={16} />
                Back
              </button>

              <div className="h-5 w-px bg-[#e7d6d0]" />

              <h1 className="text-sm font-bold uppercase tracking-wide text-[#1b110e] dark:text-white">
                {currentStep.title}
              </h1>
            </div>

            {/* DESKTOP RIGHT: Save Logic */}
            <div className="hidden lg:flex items-center gap-6">

              {!isConfigureStep && (
                <div className="flex items-center gap-2 text-xs text-[#97604e]">
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
        <div className="flex-1 overflow-y-auto scroll-smooth">
          {children}
        </div>

        {/* ================= FOOTER ================= */}
        <footer className="shrink-0 z-40 bg-white/95 dark:bg-[#211511]/95 backdrop-blur-md border-t border-[#e7d6d0] px-4 py-5">
          <div className="max-w-4xl mx-auto">

            {/* ================= DESKTOP LAYOUT ================= */}
            <div className="hidden lg:flex items-center justify-between">

              {/* Left: Progress */}
              <div className="flex flex-col w-full max-w-[240px]">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-[10px] text-[#97604e] uppercase font-extrabold tracking-wider">
                    Step {currentStepIndex + 1} of {steps.length}
                  </span>
                  <span className="text-[10px] text-primary font-extrabold">
                    {Math.round(progress)}%
                  </span>
                </div>
                <div className="h-2 w-full bg-[#f3eae7] dark:bg-[#3a2d29] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-500 rounded-full"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              {/* Right: Price + Continue */}
              <div className="flex items-center gap-8">
                <div className="flex flex-col items-end">
                  <span className="text-[10px] text-[#97604e] font-bold uppercase tracking-wider">
                    {(momentData?.paidAmount || 0) > 0
                      ? "Balance Due"
                      : "Total Price"}
                  </span>
                  <span className="text-2xl font-black text-[#1b110e] dark:text-white tabular-nums">
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
                  <div className="flex items-center gap-2 text-xs text-[#97604e] font-medium">
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

                {/* Balance Line */}
                <div className="text-sm font-semibold text-[#1b110e] dark:text-white tabular-nums">
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
