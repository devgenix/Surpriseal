"use client";

import { 
  Settings, 
  PersonStanding, 
  Edit3, 
  Image as ImageIcon, 
  PartyPopper, 
  CreditCard,
  X,
  Sparkles,
  ChevronUp,
  ChevronDown,
  Check,
  LogOut
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { ADDONS } from "@/lib/constants/pricing";
import { User } from "firebase/auth";
import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";

interface Step {
  id: string;
  title: string;
  icon: any;
  status: string;
}

interface CreationSidebarProps {
  currentStepId: string;
  steps: Step[];
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  momentData: any;
  user: User | null;
  logout: () => Promise<void>;
}

export function CreationSidebar({
  currentStepId,
  steps,
  sidebarOpen,
  setSidebarOpen,
  momentData,
  user,
  logout
}: CreationSidebarProps) {
  const router = useRouter(); 
  const pathname = usePathname();
  const [showAddonDetails, setShowAddonDetails] = useState(false);
  const selectedAddonIds = momentData?.selectedAddons || [];

  return (
    <aside className={cn(
      "fixed inset-y-0 left-0 w-80 bg-white dark:bg-[#2a1d19] border-r border-[#e7d6d0] z-50 transition-transform duration-300 lg:relative lg:translate-x-0 shadow-sm",
      sidebarOpen ? "translate-x-0" : "-translate-x-full"
    )}>
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="p-8 flex items-center gap-3">
          <div className="size-10 text-primary flex items-center justify-center bg-primary/10 rounded-md">
            <span className="material-symbols-outlined text-[24px]">celebration</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-[#1b110e] dark:text-white">Supriseal</h1>
          <button className="lg:hidden ml-auto p-1" onClick={() => setSidebarOpen(false)}>
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Stepper */}
        <nav className="flex-1 px-6 py-4 overflow-y-auto">
          <ul className="space-y-3">
            {steps.map((step) => {
              const isCurrent = step.id === currentStepId;
              const isCompleted = step.status === "Completed";
              
              return (
                <li key={step.id}>
                  <button 
                    onClick={() => {
                      if (isCompleted || isCurrent) {
                        const pathId = step.id === "configure" ? "" : 
                                     step.id === "recipient" ? "details" : step.id;
                        
                        // Handle dynamic path for draftId
                        const draftIdForPath = pathname.split("/")[3];
                        if (draftIdForPath) {
                          router.push(`/dashboard/create/${draftIdForPath}${pathId ? "/" + pathId : ""}`);
                        } else if (step.id === "configure") {
                           router.push("/dashboard/create");
                        }
                        
                        if (window.innerWidth < 1024) setSidebarOpen(false);
                      }
                    }}
                    className={cn(
                      "flex items-center gap-4 rounded-xl p-4 transition-all w-full text-left",
                      isCurrent 
                        ? "bg-[#fdf1ec] border border-primary/20" 
                        : isCompleted ? "bg-black/[0.02] hover:bg-black/[0.05]" : "opacity-60 grayscale-[0.2] cursor-not-allowed"
                    )}
                  >
                    <div className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-full transition-all",
                      isCurrent 
                        ? "bg-primary text-white shadow-sm ring-2 ring-primary ring-offset-2 ring-offset-[#fdf1ec]" 
                        : isCompleted 
                          ? "bg-green-500 text-white"
                          : "border-2 border-[#e7d6d0] bg-white dark:bg-transparent text-[#e7d6d0]"
                    )}>
                      {isCompleted ? <Check size={16} strokeWidth={3} /> : <step.icon size={18} />}
                    </div>
                    <div className="flex flex-col">
                      <span className={cn(
                        "text-sm font-bold",
                        isCurrent ? "text-[#1b110e]" : "text-[#1b110e]/70"
                      )}>{step.title}</span>
                      <span className={cn(
                        "text-[10px] font-bold uppercase tracking-wider",
                        isCurrent ? "text-primary" : isCompleted ? "text-green-600" : "text-[#97604e]"
                      )}>{step.status}</span>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Plan & Addons Summary */}
        <div className="p-6 border-t border-[#e7d6d0] bg-[#fdf1ec]/30">
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  <Sparkles size={16} />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-[#97604e] uppercase tracking-wider">Active Plan</span>
                  <span className="text-sm font-bold text-[#1b110e] dark:text-white capitalize">{momentData?.plan || "..." } Plan</span>
                </div>
              </div>
              <button 
                onClick={() => setShowAddonDetails(!showAddonDetails)}
                className="p-1 hover:bg-black/5 rounded-md transition-colors"
                disabled={!momentData?.plan}
              >
                {showAddonDetails ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
            </div>

            {showAddonDetails && momentData?.plan && (
              <div className="space-y-2 animate-in slide-in-from-top-2 duration-200">
                <div className="text-[10px] font-bold text-primary uppercase tracking-widest pl-1">Included Add-ons</div>
                <div className="grid gap-1.5 pl-1">
                  {momentData.plan === "premium" ? (
                    <div className="flex items-center gap-2 text-xs font-medium text-[#1b110e]/70">
                      <Check size={12} className="text-primary" />
                      <span>All Premium Features</span>
                    </div>
                  ) : selectedAddonIds.length > 0 ? (
                    selectedAddonIds.map((id: string) => {
                      // Compatibility fix: handle old snake_case IDs if any exist in DB
                      const standardizedId = id === "custom_url" ? "customUrl" : 
                                            id === "scheduled_reveal" ? "scheduledReveal" : id;
                      const addon = ADDONS.find(a => a.id === standardizedId);
                      if (!addon) return null;
                      return (
                        <div key={id} className="flex items-center gap-2 text-xs font-medium text-[#1b110e]/70">
                          <Check size={12} className="text-primary" />
                          <span>{addon.title}</span>
                        </div>
                      );
                    }).filter(Boolean)
                  ) : (
                    <span className="text-xs italic text-[#97604e]">No extra features selected</span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* User Profile */}
        <div className="p-6 border-t border-[#e7d6d0]">
          <div className="flex items-center gap-3 w-full p-2 rounded-lg group">
            <div className="h-10 w-10 rounded-full bg-primary/10 border border-[#e7d6d0] flex items-center justify-center text-primary font-bold overflow-hidden transition-transform group-hover:scale-105">
               {user?.photoURL ? (
                <img src={user.photoURL} alt={user.displayName || ""} className="w-full h-full object-cover" />
              ) : (
                user?.displayName?.charAt(0) || user?.email?.charAt(0).toUpperCase()
              )}
            </div>
            <div className="flex flex-col flex-1 min-w-0">
              <span className="text-sm font-bold text-[#1b110e] dark:text-white truncate">
                {user?.displayName || "My Account"}
              </span>
              <span className="text-[10px] font-bold text-[#97604e] uppercase">View Account</span>
            </div>
            <Link 
              href="/dashboard/profile" 
              className="p-1.5 text-[#97604e] hover:text-primary hover:bg-primary/5 rounded-lg transition-all"
              title="Profile Settings"
            >
              <Settings size={18} />
            </Link>
            <button 
              onClick={async () => {
                await logout();
                router.push("/");
              }}
              className="p-1.5 text-[#97604e] hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
              title="Sign Out"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
