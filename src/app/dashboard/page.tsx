"use client";

import Link from "next/link";
import { db } from "@/lib/firebase";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import Container from "@/components/ui/Container";
import MomentCard from "@/components/dashboard/MomentCard";
import { Plus, ListFilter, ArrowDownAZ, Loader2, Calendar, LayoutGrid, CheckCircle2, Clock  } from "lucide-react";
import { Select } from "@/components/ui/Select";
import { collection, query, where, onSnapshot, orderBy } from "firebase/firestore";





export default function DashboardPage() {
  const { user, loading: loadingAuth } = useAuth();
  const [moments, setMoments] = useState<any[]>([]);
  const [loadingMoments, setLoadingMoments] = useState(true);
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "alphabetical" | "views">("newest");
  const [filterStatus, setFilterStatus] = useState<"all" | "Draft" | "Published">("all");

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
          recipient: data.recipientName || "Someone",
          occasion: data.occasionId || "Celebration",
          status: (data.status?.charAt(0).toUpperCase() + data.status?.slice(1)) || "Draft",
          views: data.views || 0,
          updatedAtRaw: data.updatedAt?.toDate() || new Date(0),
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

  const filteredAndSortedMoments = moments
    .filter((m) => filterStatus === "all" || m.status === filterStatus)
    .sort((a, b) => {
      if (sortBy === "newest") return b.updatedAtRaw - a.updatedAtRaw;
      if (sortBy === "oldest") return a.updatedAtRaw - b.updatedAtRaw;
      if (sortBy === "alphabetical") return a.recipient.localeCompare(b.recipient);
      if (sortBy === "views") return (b.views || 0) - (a.views || 0);
      return 0;
    });

  if (loadingAuth || loadingMoments) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <Container>
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div className="flex flex-col gap-2">
          <h1 className="text-text-main dark:text-white text-3xl md:text-4xl font-extrabold tracking-tight">Your Moments</h1>
          <p className="text-text-muted dark:text-gray-400 text-base md:text-lg">Manage and track your celebration pages.</p>
        </div>

        {/* Filter/Sort Controls */}
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
          <Select
            options={[
              { id: "newest", title: "Newest First", icon: Clock },
              { id: "oldest", title: "Oldest First", icon: Calendar },
              { id: "alphabetical", title: "A - Z", icon: ArrowDownAZ },
              { id: "views", title: "Most Viewed", icon: LayoutGrid },
            ]}
            value={sortBy}
            onChange={(val) => setSortBy(val as any)}
            className="w-full sm:w-48"
            icon={ListFilter}
          />
          
          <Select
            options={[
              { id: "all", title: "All Status", icon: LayoutGrid },
              { id: "Draft", title: "Drafts", icon: Clock },
              { id: "Published", title: "Published", icon: CheckCircle2 },
            ]}
            value={filterStatus}
            onChange={(val) => setFilterStatus(val as any)}
            className="w-full sm:w-48"
            icon={CheckCircle2}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {/* Create New Card - Always First */}
        <Link href="/dashboard/create" className="contents">
          <button className="group relative flex flex-col items-center justify-center bg-transparent rounded-lg border-2 border-dashed border-primary/20 hover:border-primary/50 dark:border-white/10 dark:hover:border-primary/50 p-6 min-h-[320px] transition-all duration-300">
            <div className="size-16 rounded-full bg-primary/5 dark:bg-white/5 group-hover:bg-primary/10 flex items-center justify-center mb-4 transition-colors">
              <Plus className="w-8 h-8 text-primary group-hover:scale-110 transition-transform duration-300" />
            </div>
            <h3 className="text-lg font-bold text-text-main dark:text-white mb-1">Create New</h3>
            <p className="text-sm text-center text-text-muted dark:text-gray-400 max-w-[200px]">Start a fresh surprise for someone special.</p>
          </button>
        </Link>

        {filteredAndSortedMoments.map((moment) => (
          <MomentCard key={moment.id} moment={moment} />
        ))}
      </div>
    </Container>
  );
}
