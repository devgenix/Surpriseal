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
  LogOut,
  Moon,
  Sun,
  Monitor
} from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { Dropdown } from "antd";
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
  const { theme, setTheme } = useTheme();
  const [showAddonDetails, setShowAddonDetails] = useState(false);
  const selectedAddonIds = momentData?.selectedAddons || [];

  return (
    <aside className={cn(
      "fixed inset-y-0 left-0 w-80 bg-surface border-r border-border z-50 transition-transform duration-300 lg:relative lg:translate-x-0 shadow-sm",
      sidebarOpen ? "translate-x-0" : "-translate-x-full"
    )}>
      <div className="flex flex-col h-full">
        {/* Logo */}
        <Link 
          href="/dashboard"
          className="p-8 flex items-center gap-3 hover:opacity-80 transition-opacity"
        >
          <div className="size-10 text-primary flex items-center justify-center bg-primary/10 rounded-md">
            <span className="material-symbols-outlined text-[24px]">celebration</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-text-main">Supriseal</h1>
          <button className="lg:hidden ml-auto p-1" onClick={(e) => {
            e.preventDefault();
            setSidebarOpen(false);
          }}>
            <X className="h-6 w-6" />
          </button>
        </Link>

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
                      const isPublished = momentData?.status === "Published";
                      if (isCompleted || isCurrent || isPublished) {
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
                          : (isCompleted || (momentData?.status === "Published" && step.id !== "pay")) 
                            ? "bg-black/[0.02] hover:bg-black/[0.05]" 
                            : step.id === "pay" && momentData?.status === "Published"
                              ? "bg-primary/5 hover:bg-primary/10 border border-primary/20"
                              : "opacity-60 grayscale-[0.2] cursor-not-allowed"
                    )}
                  >
                    <div className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-full transition-all",
                        isCurrent 
                          ? "bg-primary text-white shadow-sm ring-2 ring-primary ring-offset-2 ring-offset-surface" 
                          : (isCompleted || (momentData?.status === "Published" && step.id !== "pay"))
                            ? "bg-green-500 text-white"
                            : step.id === "pay" && momentData?.status === "Published"
                              ? "bg-white border-2 border-primary text-primary shadow-sm"
                              : "border-2 border-border bg-transparent text-text-muted"
                    )}>
                      {isCompleted ? <Check size={16} strokeWidth={3} /> : <step.icon size={18} />}
                    </div>
                    <div className="flex flex-col">
                      <span className={cn(
                        "text-sm font-bold",
                        isCurrent ? "text-text-main" : "text-text-main/70"
                      )}>{step.title}</span>
                      <span className={cn(
                        "text-[10px] font-bold uppercase tracking-wider",
                        isCurrent ? "text-primary" : isCompleted ? "text-green-600" : "text-text-muted"
                      )}>{step.status}</span>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Plan & Addons Summary */}
        <div className="p-6 border-t border-border bg-primary/5">
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Active Plan</span>
                  <span className="text-sm font-bold text-text-main capitalize">{momentData?.plan || "..." } Plan</span>
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
                    <span className="text-xs italic text-text-muted">No extra features selected</span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* User Profile */}
        <div className="p-4 border-t border-[#e7d6d0]">
          <Dropdown
            trigger={["click"]}
            placement="topRight"
            menu={{
              items: [
                {
                  key: "user-info",
                  label: (
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-text-main">
                        {user?.displayName || "My Account"}
                      </span>
                      <span className="text-[10px] font-bold text-text-muted uppercase">
                        {user?.email}
                      </span>
                    </div>
                  ),
                  disabled: true,
                },
                { type: "divider" },

                {
                  key: "theme-light",
                  label: "Light Theme",
                  icon: <Sun size={14} />,
                  onClick: () => setTheme("light"),
                },
                {
                  key: "theme-dark",
                  label: "Dark Theme",
                  icon: <Moon size={14} />,
                  onClick: () => setTheme("dark"),
                },
                {
                  key: "theme-system",
                  label: "System Theme",
                  icon: <Monitor size={14} />,
                  onClick: () => setTheme("system"),
                },

                { type: "divider" },

                {
                  key: "profile",
                  label: "Profile Settings",
                  icon: <Settings size={14} />,
                  onClick: () => router.push("/dashboard/profile"),
                },
                {
                  key: "logout",
                  label: "Sign Out",
                  icon: <LogOut size={14} />,
                  danger: true,
                  onClick: async () => {
                    await logout();
                    router.push("/");
                  },
                },
              ],
            }}
          >
            <div className="flex items-center gap-3 w-full p-2 rounded-lg cursor-pointer hover:bg-primary/5 transition-all">
              <div className="h-10 w-10 rounded-full bg-primary/10 border border-[#e7d6d0] flex items-center justify-center text-primary font-bold overflow-hidden transition-transform hover:scale-105">
                {user?.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || ""}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  user?.displayName?.charAt(0) ||
                  user?.email?.charAt(0).toUpperCase()
                )}
              </div>

              <div className="flex flex-col flex-1 min-w-0">
                <span className="text-sm font-bold text-text-main truncate">
                  {user?.displayName || "My Account"}
                </span>
                <span className="text-[10px] font-bold text-text-muted uppercase truncate">
                  {user?.email}
                </span>
              </div>
            </div>
          </Dropdown>
        </div>
      </div>
    </aside>
  );
}
