"use client";

import { useCreation, CreationProvider } from "@/context/CreationContext";
import { CreationSidebar } from "@/components/layout/CreationSidebar";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { 
  Settings, 
  PersonStanding, 
  Edit3, 
  Image as ImageIcon, 
  PartyPopper, 
  CreditCard, 
  Menu,
  ArrowLeft,
  ArrowRight,
  Save,
  Loader2,
  Trash2,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { useRouter } from "next/navigation";
import { formatPrice } from "@/lib/currency";
import { useCurrency } from "@/context/CurrencyContext";
import { Button } from "@/components/ui/button";

const STEPS = [
  { id: "configure", title: "Configure", icon: Settings, status: "Upcoming" },
  { id: "recipient", title: "Recipient Info", icon: PersonStanding, status: "Upcoming" },
  { id: "content", title: "Surprise content", icon: Edit3, status: "Upcoming" },
  { id: "pay", title: "Review & Pay", icon: CreditCard, status: "Upcoming" },
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
    onContinue
  } = useCreation();
  const { user, logout } = useAuth();
  const { currency } = useCurrency();
  const pathname = usePathname();
  const router = useRouter();

  // Determine current step and statuses
  const getSteps = () => {
    const completedSteps = momentData?.completedSteps || [];
    const paidAddons = momentData?.paidAddons || [];
    const selectedAddons = momentData?.selectedAddons || [];
    const hasUnpaidAddons = selectedAddons.some((id: string) => !paidAddons.includes(id));

    return STEPS.map(step => {
      let status = "Upcoming";
      
      const isCurrent = (
        (step.id === "configure" && (pathname === "/dashboard/create" || (pathname.startsWith("/dashboard/create/") && !pathname.includes("/", 18)))) ||
        (step.id === "recipient" && pathname.includes("/details")) ||
        (step.id === "content" && pathname.includes("/content")) ||
        (step.id === "reveal" && pathname.includes("/reveal")) ||
        (step.id === "pay" && pathname.includes("/pay"))
      );

      if (isCurrent) {
        status = "In Progress";
      } else if (step.id === "pay") {
        status = (momentData?.isPaid && !hasUnpaidAddons) ? "Completed" : "Upcoming";
      } else if (completedSteps.includes(step.id) || momentData?.status === "Published") {
        status = "Completed";
      } else {
        // Fallback for linear flow logic (pre-completion tracking compatibility)
        if (pathname.includes("/details")) {
          if (step.id === "configure") status = "Completed";
        } else if (pathname.includes("/content")) {
          if (["configure", "recipient"].includes(step.id)) status = "Completed";
        } else if (pathname.includes("/reveal")) {
          if (["configure", "recipient", "content"].includes(step.id)) status = "Completed";
        } else if (pathname.includes("/pay")) {
           if (["configure", "recipient", "content", "reveal"].includes(step.id)) status = "Completed";
        }
      }
      
      return { ...step, status };
    });
  };

  const steps = getSteps();
  const currentStepIndex = steps.findIndex(s => s.status === "In Progress");
  const currentStep = steps[currentStepIndex] || steps[0];
  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  const isConfigureStep = currentStep.id === "configure";
  const draftId = pathname.split("/")[3];

  const handleBack = () => {
    router.back();
  };

  return (
    <div className="flex h-screen w-full bg-[#fcf9f8] dark:bg-[#211511] overflow-hidden font-display">
      <CreationSidebar 
        currentStepId={currentStep.id}
        steps={steps}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        momentData={momentData}
        user={user}
        logout={logout}
      />
      
      <main className="flex-1 flex flex-col h-full overflow-hidden relative bg-[#fcf9f8] dark:bg-[#211511]">
        {/* Centralized Header */}
        <header className="shrink-0 z-40 bg-white/80 dark:bg-[#2a1d19]/80 backdrop-blur-md border-b border-[#e7d6d0] h-20 px-8 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <button 
              onClick={handleBack}
              className="flex items-center gap-2 text-[#97604e] hover:text-primary transition-colors text-sm font-bold"
            >
              <ArrowLeft size={16} />
              <span className="hidden sm:inline">Back</span>
            </button>
            
            <div className="h-6 w-px bg-[#e7d6d0] hidden sm:block" />
            
            <div className="hidden md:flex items-center gap-2">
              <span className="text-sm font-bold text-[#1b110e] dark:text-white uppercase tracking-wider">{currentStep.title}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Save Status */}
            {!isConfigureStep && (
              <div className="flex items-center gap-3 mr-2">
                {saving ? (
                  <div className="flex items-center gap-2 text-[#97604e] animate-pulse">
                    <Loader2 size={14} className="animate-spin" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Saving...</span>
                  </div>
                ) : saveError ? (
                  <div className="flex items-center gap-2 text-red-500">
                    <AlertCircle size={14} />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Error Saving</span>
                  </div>
                ) : lastSaved ? (
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle2 size={14} />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Last saved {lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                ) : null}
                
                {onSave && (
                  <button 
                    onClick={() => onSave()}
                    disabled={saving}
                    className="flex items-center gap-2 p-2.5 bg-primary/5 hover:bg-primary/10 text-primary border border-primary/20 rounded-sm transition-all disabled:opacity-50 group"
                  >
                    <Save size={20} className="group-hover:scale-110 transition-transform" />
                  </button>
                )}
              </div>
            )}

            {/* Mobile Nav Toggle */}
            <button 
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2.5 bg-[#fdf1ec] border border-primary/10 rounded-sm text-primary"
            >
              <Menu size={20} />
            </button>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto scroll-smooth">
          {children}
        </div>

        {/* Centralized Footer */}
        <footer className="shrink-0 z-40 bg-white/95 dark:bg-[#211511]/95 backdrop-blur-md border-t border-[#e7d6d0] py-5 px-4 lg:px-0">
          <div className="max-w-4xl mx-auto flex items-center justify-between gap-6">
            <div className="flex flex-col flex-1 max-w-[200px]">
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-[10px] text-[#97604e] uppercase tracking-wider font-extrabold">
                  Step {currentStepIndex + 1} of {steps.length}
                </span>
                <span className="text-[10px] text-primary font-extrabold">{Math.round(progress)}%</span>
              </div>
              <div className="h-2 w-full bg-[#f3eae7] dark:bg-[#3a2d29] rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all duration-500 rounded-full shadow-[0_0_8px_rgba(230,76,25,0.4)]"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-[10px] text-[#97604e] font-bold uppercase tracking-tighter">
                  {(momentData?.paidAmount || 0) > 0 ? "Balance Due" : "Total Price"}
                </span>
                <span className="text-2xl font-black text-[#1b110e] dark:text-white tabular-nums">
                  {formatPrice(Math.max(0, (momentData?.totalPrice || 0) - (momentData?.paidAmount || 0)), currency)}
                </span>
              </div>

              {!(pathname.endsWith("/pay") && (momentData?.totalPrice || 0) - (momentData?.paidAmount || 0) <= 0) && (
                <Button 
                  onClick={() => onContinue && onContinue()}
                  disabled={!onContinue || !canContinue || saving}
                  className="h-12 px-8 rounded-lg bg-primary hover:bg-primary-dark text-white font-bold shadow-lg shadow-primary/20 transform active:scale-[0.98] transition-all flex items-center gap-2 min-w-[140px]"
                >
                  {saving ? (
                    <Loader2 className="animate-spin h-5 w-5" />
                  ) : (
                    <>
                      {pathname.endsWith("/pay") ? "Pay Now" : "Continue"}
                      <ArrowRight size={18} />
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

export default function CreationLayout({ children }: { children: React.ReactNode }) {
  return (
    <CreationProvider>
      <CreationLayoutInner>{children}</CreationLayoutInner>
    </CreationProvider>
  );
}
