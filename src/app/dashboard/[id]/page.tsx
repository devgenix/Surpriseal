"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { db, auth } from "@/lib/firebase";
import { doc, getDoc, deleteDoc, collection, query, where, getDocs } from "firebase/firestore";
import { onAuthStateChanged, User } from "firebase/auth";
import { 
  ArrowLeft, 
  Edit3, 
  Trash2, 
  Share2, 
  ExternalLink, 
  Calendar, 
  Eye, 
  Clock, 
  AlertCircle,
  Loader2,
  CheckCircle2,
  Lock,
  Globe,
  Settings,
  MessageCircleHeart,
  Play,
  Video,
  Mic
} from "lucide-react";
import Link from "next/link";
import Container from "@/components/ui/Container";

export default function MomentDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [moment, setMoment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [copying, setCopying] = useState(false);
  const [reactions, setReactions] = useState<any[]>([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (val) => {
      setUser(val);
      if (!val) {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    async function fetchMoment() {
      if (!id || !db) return;
      try {
        const docRef = doc(db, "moments", id as string);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setMoment({ id: docSnap.id, ...docSnap.data() });

          const q = query(collection(db, "reactions"), where("momentId", "==", id as string));
          const reactionsSnap = await getDocs(q);
          const rawReactions = reactionsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
          // Sort client-side to avoid composite index requirements
          rawReactions.sort((a: any, b: any) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
          setReactions(rawReactions);
          
        } else {
          router.push("/dashboard");
        }
      } catch (error) {
        console.error("Error fetching moment:", error);
      } finally {
        setLoading(false);
      }
    }

    if (user) {
      fetchMoment();
    }
  }, [id, user, router]);

  const handleDelete = async () => {
    if (!db || !id) return;
    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, "moments", id as string));
      router.push("/dashboard");
    } catch (error) {
      console.error("Error deleting moment:", error);
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleShare = () => {
    const url = `${window.location.origin}/view/${id}`;
    navigator.clipboard.writeText(url);
    setCopying(true);
    setTimeout(() => setCopying(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm font-bold uppercase tracking-widest text-text-muted">Loading Moment...</p>
      </div>
    );
  }

  if (!moment) return null;

  const isPublished = moment.status === "published" || moment.status === "Published";

  return (
    <Container className="py-8 max-w-5xl">
      {/* Navigation Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <Link 
          href="/dashboard"
          className="group flex items-center gap-2 text-xs font-black text-text-muted hover:text-primary transition-colors tracking-widest"
        >
          <div className="size-8 rounded-lg bg-white dark:bg-surface-dark border border-[#f3eae7] dark:border-white/5 flex items-center justify-center group-hover:bg-primary/5 transition-all">
            <ArrowLeft size={16} />
          </div>
          BACK TO DASHBOARD
        </Link>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setShowDeleteConfirm(true)}
            className="flex items-center justify-center size-10 rounded-lg bg-red-500/5 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/10 transition-all"
            title="Delete Moment"
          >
            <Trash2 size={18} />
          </button>
          
          <Link href={`/dashboard/create/${id}?resume=true`} className="flex-1 sm:flex-none">
            <button className="flex items-center justify-center gap-2 px-6 h-10 w-full rounded-lg bg-[#1b110e] dark:bg-white text-white dark:text-[#1b110e] text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-all">
              <Edit3 size={14} />
              Edit Moment
            </button>
          </Link>

          <Link href={`/view/${id}`} target="_blank" className="flex-1 sm:flex-none">
            <button className="flex items-center justify-center gap-2 px-6 h-10 w-full rounded-lg bg-primary hover:bg-primary-hover text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 transition-all">
              <ExternalLink size={14} />
              Live Preview
            </button>
          </Link>
        </div>
      </div>

      <div className="space-y-8">
        {/* Visual Identity Hub */}
        <div className="bg-white dark:bg-surface-dark rounded-xl border border-[#f3eae7] dark:border-white/5 overflow-hidden shadow-sm">
          <div 
            className="h-64 bg-cover bg-center relative"
            style={{ backgroundImage: `url(${moment.imageUrl || 'https://images.unsplash.com/photo-1513201099705-a9746e1e201f?q=80&w=2897&auto=format&fit=crop'})` }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-[#1b110e] via-[#1b110e]/40 to-transparent"></div>
            <div className="absolute bottom-8 left-8 right-8">
              <div className="flex items-center gap-2 mb-3">
                <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider border backdrop-blur-md ${
                  isPublished 
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" 
                    : "bg-orange-500/10 border-orange-500/30 text-orange-400"
                }`}>
                  <span className={`inline-block size-1.5 rounded-full mr-1.5 ${isPublished ? "bg-emerald-400 animate-pulse" : "bg-orange-400"}`}></span>
                  {moment.status}
                </span>
                <span className="px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider border bg-white/10 border-white/20 text-white/90">
                  {moment.occasionId || "Special Occasion"}
                </span>
              </div>
              <h1 className="text-4xl sm:text-5xl font-black text-white leading-tight uppercase tracking-tighter">
                {moment.recipientName || "Someone"}'s Moment
              </h1>
            </div>
          </div>

          <div className="p-8 flex flex-wrap items-center justify-between gap-8">
            <div className="flex flex-wrap items-center gap-8">
              <div className="flex items-center gap-4">
                <div className="size-12 rounded-xl bg-[#f9f5f3] dark:bg-white/5 flex items-center justify-center text-primary shadow-sm">
                  <Eye size={24} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1">Total Views</p>
                  <p className="text-2xl font-black text-[#1b110e] dark:text-white leading-none">{moment.views || 0}</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="size-12 rounded-xl bg-[#f9f5f3] dark:bg-white/5 flex items-center justify-center text-primary shadow-sm">
                  <Clock size={24} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1">Last Updated</p>
                  <p className="text-2xl font-black text-[#1b110e] dark:text-white leading-none">
                    {moment.updatedAt ? new Date(moment.updatedAt.toDate()).toLocaleDateString() : 'Just now'}
                  </p>
                </div>
              </div>
            </div>

            <button 
              onClick={handleShare}
              className="flex items-center gap-3 px-8 h-12 rounded-xl bg-primary/10 hover:bg-primary text-primary hover:text-white border border-primary/20 text-xs font-black uppercase tracking-widest transition-all shadow-sm"
            >
              {copying ? <CheckCircle2 size={18} /> : <Share2 size={18} />}
              {copying ? "Link Copied!" : "Share Moment"}
            </button>
          </div>
        </div>

        {/* Quick Management Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white dark:bg-surface-dark rounded-xl border border-[#f3eae7] dark:border-white/5 p-8 shadow-sm">
            <h3 className="text-xs font-black text-[#1b110e] dark:text-white uppercase tracking-widest mb-6 flex items-center gap-2">
              <Globe size={18} className="text-primary" />
              Public Settings
            </h3>
            <div className="space-y-6">
              <div className="flex justify-between items-center group">
                <div>
                  <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1">Privacy</p>
                  <p className="text-sm font-bold text-[#1b110e] dark:text-white uppercase">Visible to anyone with link</p>
                </div>
                <div className="size-8 rounded-full border border-[#f3eae7] dark:border-white/10 flex items-center justify-center">
                  <Lock size={14} className="text-emerald-500" />
                </div>
              </div>
              <div className="flex justify-between items-center group">
                <div>
                  <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1">Appearance</p>
                  <p className="text-sm font-bold text-[#1b110e] dark:text-white uppercase">Standard Cinematic Theme</p>
                </div>
                <div className="size-8 rounded-full border border-[#f3eae7] dark:border-white/10 flex items-center justify-center">
                  <Settings size={14} className="text-primary" />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-surface-dark rounded-xl border border-[#f3eae7] dark:border-white/5 p-8 shadow-sm">
            <h3 className="text-xs font-black text-[#1b110e] dark:text-white uppercase tracking-widest mb-6 flex items-center gap-2">
              <Calendar size={18} className="text-primary" />
              Event Timeline
            </h3>
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1">Scheduled Reveal</p>
                  <p className="text-sm font-bold text-[#1b110e] dark:text-white uppercase">
                    {moment.revealDate ? new Date(moment.revealDate.toDate()).toLocaleDateString() : 'Instant Reveal'}
                  </p>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1">Hosting Period</p>
                  <p className="text-sm font-bold text-[#1b110e] dark:text-white uppercase">30 Days (Active)</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Reactions Section */}
        <div className="bg-white dark:bg-surface-dark rounded-xl border border-[#f3eae7] dark:border-white/5 overflow-hidden shadow-sm">
           <div className="p-8 border-b border-[#f3eae7] dark:border-white/5 flex items-center justify-between">
              <h3 className="text-xs font-black text-[#1b110e] dark:text-white uppercase tracking-widest flex items-center gap-2">
                <MessageCircleHeart size={18} className="text-pink-500" />
                Audience Reactions
              </h3>
              <div className="px-3 py-1 rounded-full bg-pink-500/10 text-pink-500 text-[10px] font-black uppercase tracking-widest">
                {reactions.length} total
              </div>
           </div>

           <div className="p-8">
             {reactions.length === 0 ? (
               <div className="text-center py-12">
                  <div className="size-16 rounded-full bg-black/[0.02] dark:bg-white/5 flex items-center justify-center mx-auto mb-4 text-text-muted">
                     <MessageCircleHeart size={24} />
                  </div>
                  <p className="text-sm font-bold text-[#1b110e] dark:text-white mb-2">No reactions yet</p>
                  <p className="text-xs font-medium text-text-muted max-w-sm mx-auto">
                    When someone viewing your moment leaves a voice note, video, or message, it will appear here securely.
                  </p>
               </div>
             ) : (
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {reactions.map((reaction) => (
                   <div key={reaction.id} className="p-6 rounded-2xl border border-[#f3eae7] dark:border-white/5 bg-[#fafafa] dark:bg-black/20 flex flex-col items-start gap-4 shadow-sm hover:shadow-md transition-shadow">
                     <div className="flex items-center justify-between w-full">
                       <div className="flex items-center gap-2">
                         <span className="text-2xl">{reaction.emoji || "💬"}</span>
                         <span className="text-[10px] font-black uppercase tracking-widest text-text-muted">
                           {reaction.createdAt ? new Date(reaction.createdAt.toDate()).toLocaleDateString() : 'Just now'}
                         </span>
                       </div>
                       {reaction.type === 'voice' && <Mic size={14} className="text-blue-500" />}
                       {reaction.type === 'camera' && <Video size={14} className="text-purple-500" />}
                     </div>
                     
                     {reaction.type === 'text' && (
                       <p className="text-sm font-medium text-[#1b110e] dark:text-white leading-relaxed italic">"{reaction.content}"</p>
                     )}

                     {reaction.type === 'voice' && (
                       <div className="w-full">
                         <audio src={reaction.content} controls className="w-full h-8 outline-none" />
                       </div>
                     )}

                     {reaction.type === 'camera' && (
                       <div className="w-full aspect-[3/4] rounded-xl overflow-hidden bg-black relative border border-border">
                         <video src={reaction.content} controls className="w-full h-full object-cover" />
                       </div>
                     )}
                   </div>
                 ))}
               </div>
             )}
           </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white dark:bg-surface-dark w-full max-w-sm rounded-xl border border-[#f3eae7] dark:border-white/5 p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="size-16 rounded-full bg-red-50 dark:bg-red-500/10 flex items-center justify-center text-red-500 mb-6 mx-auto">
              <AlertCircle size={32} />
            </div>
            <h3 className="text-xl font-black text-[#1b110e] dark:text-white text-center uppercase tracking-tight mb-2">Delete this Moment?</h3>
            <p className="text-sm text-text-muted text-center mb-8">This action cannot be undone. All memories, photos, and messages will be permanently lost.</p>
            
            <div className="flex gap-3">
              <button 
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-4 px-6 rounded-lg border border-[#f3eae7] dark:border-white/10 text-[10px] font-black uppercase tracking-widest hover:bg-gray-50 dark:hover:bg-white/5 transition-all"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button 
                onClick={handleDelete}
                className="flex-1 py-4 px-6 rounded-lg bg-red-600 hover:bg-red-700 text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-red-500/20 transition-all flex items-center justify-center gap-2"
                disabled={isDeleting}
              >
                {isDeleting ? <Loader2 size={16} className="animate-spin" /> : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </Container>
  );
}
