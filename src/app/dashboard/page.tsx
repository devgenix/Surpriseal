"use client";

import { useAuth } from "@/context/AuthContext";
import MomentCard from "@/components/dashboard/MomentCard";
import { Plus, ListFilter, ArrowDownAZ, Loader2 } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot, orderBy } from "firebase/firestore";





export default function DashboardPage() {
  const { user, loading: loadingAuth } = useAuth();
  const [moments, setMoments] = useState<any[]>([]);
  const [loadingMoments, setLoadingMoments] = useState(true);

  useEffect(() => {
    if (!user || !db) return;

    const q = query(
      collection(db, "drafts"),
      where("userId", "==", user.uid),
      orderBy("updatedAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const momentsData = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          recipient: data.recipient || "Someone",
          occasion: data.occasion || "Celebration",
          status: (data.status?.charAt(0).toUpperCase() + data.status?.slice(1)) || "Draft",
          views: data.views || 0,
          updatedAt: data.updatedAt ? new Date(data.updatedAt.toDate()).toLocaleDateString() : "Just now",
          imageUrl: data.imageUrl,
          expiryDate: data.expiryDate ? data.expiryDate.toDate().toLocaleDateString() : "-",
        };
      });
      setMoments(momentsData);
      setLoadingMoments(false);
    }, (error) => {
      console.error("Firestore error:", error);
      setLoadingMoments(false);
    });

    return () => unsubscribe();
  }, [user]);

  if (loadingAuth || loadingMoments) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <>
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div className="flex flex-col gap-2">
          <h1 className="text-text-main dark:text-white text-3xl md:text-4xl font-extrabold tracking-tight">Your Moments</h1>
          <p className="text-text-muted dark:text-gray-400 text-base md:text-lg">Manage and track your celebration pages.</p>
        </div>

        {/* Filter/Sort Controls */}
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 h-10 px-4 rounded-lg bg-white dark:bg-surface-dark border border-[#f3eae7] dark:border-white/10 text-text-main dark:text-white text-sm font-semibold hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
            <ArrowDownAZ className="w-[18px] h-[18px]" />
            Newest First
          </button>
          <button className="flex items-center gap-2 h-10 px-4 rounded-lg bg-white dark:bg-surface-dark border border-[#f3eae7] dark:border-white/10 text-text-main dark:text-white text-sm font-semibold hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
            <ListFilter className="w-[18px] h-[18px]" />
            All Status
          </button>
        </div>
      </div>

        {moments.map((moment) => (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {/* Create New Card - Now ALWAYS First */}
              <Link href="/dashboard/create" className="contents">
                <button className="group relative flex flex-col items-center justify-center bg-transparent rounded-2xl border-2 border-dashed border-primary/20 hover:border-primary/50 dark:border-white/10 dark:hover:border-primary/50 p-6 min-h-[320px] transition-all duration-300">
                  <div className="size-16 rounded-full bg-primary/5 dark:bg-white/5 group-hover:bg-primary/10 flex items-center justify-center mb-4 transition-colors">
                    <Plus className="w-8 h-8 text-primary group-hover:scale-110 transition-transform duration-300" />
                  </div>
                  <h3 className="text-lg font-bold text-text-main dark:text-white mb-1">Create New</h3>
                  <p className="text-sm text-center text-text-muted dark:text-gray-400 max-w-[200px]">Start a fresh surprise for someone special.</p>
                </button>
              </Link>
              <MomentCard key={moment.id} moment={moment} />
          </div>
        ))}

      {moments.length === 0 && (
        /* Empty State */
        <div className="mt-12 flex flex-col items-center justify-center py-16 px-4 bg-white dark:bg-surface-dark rounded-3xl border border-dashed border-gray-200 dark:border-white/10">
          <div className="relative w-full max-w-[280px] aspect-square mb-8">
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-accent-pink/20 rounded-full blur-3xl opacity-60"></div>
            <div className="relative z-10 w-full h-full flex items-center justify-center">
               <div className="bg-primary/10 rounded-full w-48 h-48 flex items-center justify-center">
                  <Plus className="w-24 h-24 text-primary opacity-20" />
               </div>
            </div>
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-text-main dark:text-white text-center mb-3">No moments yet?</h2>
          <p className="text-text-muted dark:text-gray-400 text-center max-w-md mb-8 text-lg leading-relaxed">
            Create memories that last. Build your first digital surprise page in minutes and make someone's day unforgettable.
          </p>
          <Link href="/dashboard/create">
            <button className="h-12 px-8 flex items-center justify-center rounded-xl bg-primary hover:bg-primary/90 text-white font-bold text-base shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all transform hover:-translate-y-1">
              Create First Moment
            </button>
          </Link>
        </div>
      )}
    </>
  );
}
