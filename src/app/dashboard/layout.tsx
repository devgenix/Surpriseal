"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";

import DashboardHeader from "@/components/layout/DashboardHeader";
import DashboardFooter from "@/components/layout/DashboardFooter";
import { cn } from "@/lib/utils";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) {
      // Persist the current path as a redirect param
      router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [user, loading, router, pathname]);

  const isCreationFlow = pathname.startsWith("/dashboard/create");

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background-light dark:bg-background-dark">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-text-muted animate-pulse font-medium">Authenticating...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="bg-background-light dark:bg-background-dark text-text-main font-display antialiased min-h-[100dvh] flex flex-col transition-colors duration-200">
      {!isCreationFlow && <DashboardHeader />}
      <main className={cn(
        "flex-1 w-full mx-auto",
        !isCreationFlow ? "py-10 px-4 pb-24" : "h-screen"
      )}>
        {children}
      </main>
      {!isCreationFlow && <DashboardFooter />}
    </div>
  );
}
