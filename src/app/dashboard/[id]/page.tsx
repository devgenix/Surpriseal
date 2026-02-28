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
  Mic,
  Send,
  Mail,
  QrCode,
  Printer
} from "lucide-react";
import { PrintStudio } from "@/components/dashboard/sharing/PrintStudio";
import Link from "next/link";
import { occasions as SHARED_OCCASIONS } from "@/lib/constants/occasions";

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
  const [showPrintStudio, setShowPrintStudio] = useState(false);

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
    const url = `${window.location.origin}/view/${moment?.urlSlug || id}`;
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
  const formattedOccasion = SHARED_OCCASIONS.find(o => o.id === moment.occasionId)?.title || moment.customOccasion || moment.occasionId || "Special Occasion";
  const hasLock = moment.unlockConfig?.type && moment.unlockConfig.type !== "none";

  return (
    <div className="mx-auto max-w-5xl animate-in fade-in duration-700">
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
      </div>

      <div className="space-y-8">
        {/* Visual Identity Hub */}
        <div className="bg-white dark:bg-surface-dark rounded-lg border border-[#f3eae7] dark:border-white/5 overflow-hidden shadow-sm">
          <div 
            className="h-56 sm:h-64 bg-cover bg-center relative"
            style={{ backgroundImage: `url(${moment.imageUrl || 'https://images.unsplash.com/photo-1513201099705-a9746e1e201f?q=80&w=2897&auto=format&fit=crop'})` }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-[#1b110e] via-[#1b110e]/40 to-transparent"></div>
            <div className="absolute bottom-6 sm:bottom-8 left-6 sm:left-8 right-6 sm:right-8">
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
                  {formattedOccasion}
                </span>
              </div>
              <h1 className="text-3xl sm:text-5xl font-black text-white leading-tight uppercase tracking-tighter">
                {moment.recipientName || "Someone"}'s Moment
              </h1>
            </div>
          </div>

          <div className="p-6 sm:p-8 flex flex-col md:flex-row flex-wrap md:items-center justify-between gap-6 sm:gap-8">
            <div className="flex flex-wrap items-center gap-6 sm:gap-8">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="size-10 sm:size-12 rounded-lg bg-[#f9f5f3] dark:bg-white/5 flex items-center justify-center text-primary shadow-sm">
                  <Eye size={20} className="sm:size-[24px]" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1">Total Views</p>
                  <p className="text-xl sm:text-2xl font-black text-[#1b110e] dark:text-white leading-none">{moment.views || 0}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 sm:gap-4">
                <div className="size-10 sm:size-12 rounded-lg bg-[#f9f5f3] dark:bg-white/5 flex items-center justify-center text-primary shadow-sm">
                  <Clock size={20} className="sm:size-[24px]" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1">Last Updated</p>
                  <p className="text-xl sm:text-2xl font-black text-[#1b110e] dark:text-white leading-none">
                    {moment.updatedAt ? new Date(moment.updatedAt.toDate()).toLocaleDateString() : 'Just now'}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:flex md:flex-row items-center gap-2 w-full md:w-auto mt-2 sm:mt-0 pt-6 sm:pt-0 border-t md:border-0 border-[#f3eae7] dark:border-white/5">
               <button 
                 onClick={handleShare}
                 className="flex items-center justify-center gap-2 px-3 sm:px-6 h-12 rounded-lg bg-primary/10 hover:bg-primary text-primary hover:text-white border border-primary/20 text-[10px] font-black uppercase tracking-widest transition-all shadow-sm"
               >
                 {copying ? <CheckCircle2 size={16} /> : <Share2 size={16} />}
                 {copying ? "Copied" : "Copy"}
               </button>
               <button 
                 onClick={() => window.open(`/view/${moment.urlSlug || id}`, '_blank')}
                 className="flex items-center justify-center gap-2 px-3 sm:px-6 h-12 rounded-lg bg-[#f9f5f3] dark:bg-white/5 hover:bg-[#1b110e] dark:hover:bg-white text-[#1b110e] dark:text-white hover:text-white dark:hover:text-[#1b110e] border border-[#f3eae7] dark:border-white/10 text-[10px] font-black uppercase tracking-widest transition-all shadow-sm"
               >
                 <ExternalLink size={16} /> View
               </button>
               <button 
                 onClick={() => router.push(`/dashboard/create/${id}?resume=true`)}
                 className="col-span-2 md:col-span-1 flex items-center justify-center gap-2 px-3 sm:px-6 h-12 rounded-lg bg-[#f9f5f3] dark:bg-white/5 hover:bg-[#1b110e] dark:hover:bg-white text-[#1b110e] dark:text-white hover:text-white dark:hover:text-[#1b110e] border border-[#f3eae7] dark:border-white/10 text-[10px] font-black uppercase tracking-widest transition-all shadow-sm"
               >
                 <Edit3 size={16} /> Edit
               </button>
               {/* Explicit Trash icon spacing layout on mobile vs desktop */}
               <button 
                 onClick={() => setShowDeleteConfirm(true)}
                 className="col-span-2 md:col-span-1 md:w-12 flex items-center justify-center h-12 rounded-lg bg-red-500/5 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/10 transition-all shadow-sm"
               >
                 <Trash2 size={16} className="md:mx-auto" />
                 <span className="md:hidden text-[10px] font-black uppercase tracking-widest ml-2">Delete</span>
               </button>
            </div>
          </div>
        </div>

        {/* Quick Management Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white dark:bg-surface-dark rounded-lg border border-[#f3eae7] dark:border-white/5 p-8 shadow-sm">
            <h3 className="text-xs font-black text-[#1b110e] dark:text-white uppercase tracking-widest mb-6 flex items-center gap-2">
              <Globe size={18} className="text-primary" />
              Public Settings
            </h3>
            <div className="space-y-6">
              <div className="flex justify-between items-center group">
                <div>
                  <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1">Privacy</p>
                  <p className="text-sm font-bold text-[#1b110e] dark:text-white uppercase">
                    {hasLock ? "Password Protected" : "Visible to anyone with link"}
                  </p>
                </div>
                <div className="size-8 rounded-full border border-[#f3eae7] dark:border-white/10 flex items-center justify-center">
                  {hasLock ? (
                    <Lock size={14} className="text-amber-500" />
                  ) : (
                    <Globe size={14} className="text-emerald-500" />
                  )}
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

          <div className="bg-white dark:bg-surface-dark rounded-lg border border-[#f3eae7] dark:border-white/5 p-8 shadow-sm">
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

        {/* Delivery & Sharing Hub */}
        <div className="bg-white dark:bg-surface-dark rounded-lg border border-[#f3eae7] dark:border-white/5 overflow-hidden shadow-sm">
           <div className="p-6 sm:p-8 border-b border-[#f3eae7] dark:border-white/5">
              <h3 className="text-xs font-black text-[#1b110e] dark:text-white uppercase tracking-widest flex items-center gap-2">
                <Send size={18} className="text-primary" />
                Delivery & Sharing
              </h3>
           </div>
           
           <div className="p-6 sm:p-8 grid grid-cols-1 md:grid-cols-3 gap-6 bg-[#fafafa]/50 dark:bg-black/10">
              {/* Option 1: Digital Link */}
              <div className="p-6 rounded-lg bg-white dark:bg-white/5 border border-[#f3eae7] dark:border-white/5 flex flex-col gap-4 shadow-sm hover:shadow-md transition-all group">
                 <div className="size-12 rounded-lg bg-primary/5 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                    <Share2 size={24} />
                 </div>
                 <div>
                    <h4 className="text-sm font-black uppercase tracking-tight dark:text-white">Copy Digital Link</h4>
                    <p className="text-[10px] text-text-muted mt-1 font-medium leading-relaxed">Fastest way to share. Simply paste the URL in any chat or social app.</p>
                 </div>
                 <button 
                   onClick={handleShare}
                   className="mt-2 w-full py-3 rounded-lg bg-primary/10 hover:bg-primary text-primary hover:text-white text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                 >
                   {copying ? <CheckCircle2 size={16} /> : <Share2 size={16} />}
                   {copying ? "Link Copied" : "Copy Moment Link"}
                 </button>
              </div>

              {/* Option 2: Email Delivery */}
              <div className="p-6 rounded-lg bg-white dark:bg-white/5 border border-[#f3eae7] dark:border-white/5 flex flex-col gap-4 shadow-sm relative overflow-hidden group">
                 <div className="absolute top-3 right-3 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter bg-amber-500/10 text-amber-500 border border-amber-500/20">
                    Soon
                 </div>
                 <div className="size-12 rounded-lg bg-blue-500/5 flex items-center justify-center text-blue-500 opacity-50">
                    <Mail size={24} />
                 </div>
                 <div className="opacity-50">
                    <h4 className="text-sm font-black uppercase tracking-tight dark:text-white">Email Delivery</h4>
                    <p className="text-[10px] text-text-muted mt-1 font-medium leading-relaxed">We'll deliver it directly to their inbox at a time you choose.</p>
                 </div>
                 <button className="mt-2 w-full py-3 rounded-lg bg-gray-100 dark:bg-white/5 text-gray-400 text-[10px] font-black uppercase tracking-widest cursor-not-allowed">
                   Scheduled Sending
                 </button>
              </div>

              {/* Option 3: Physical Share */}
              <div className="p-6 rounded-lg bg-white dark:bg-white/5 border border-primary/20 dark:border-primary/20 flex flex-col gap-4 shadow-[0_10px_30px_-5px_rgba(230,76,25,0.08)] group hover:shadow-[0_15px_35px_-5px_rgba(230,76,25,0.12)] transition-all">
                 <div className="size-12 rounded-lg bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/25 group-hover:scale-110 transition-transform">
                    <QrCode size={24} />
                 </div>
                 <div>
                    <h4 className="text-sm font-black uppercase tracking-tight dark:text-white">Physical Share</h4>
                    <p className="text-[10px] text-text-muted mt-1 font-medium leading-relaxed">Generate a custom QR card to print or share physically. Perfect for gifts.</p>
                 </div>
                 <button 
                   onClick={() => setShowPrintStudio(true)}
                   className="mt-2 w-full py-3 rounded-lg bg-[#1b110e] dark:bg-white hover:bg-primary dark:hover:bg-primary text-white dark:text-[#1b110e] hover:text-white dark:hover:text-white text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg"
                 >
                   <Printer size={16} />
                   Design QR Card
                 </button>
              </div>
           </div>
        </div>

        {/* Reactions Section */}
        <div className="bg-white dark:bg-surface-dark rounded-lg border border-[#f3eae7] dark:border-white/5 overflow-hidden shadow-sm">
           <div className="p-6 sm:p-8 border-b border-[#f3eae7] dark:border-white/5 flex items-center justify-between">
              <h3 className="text-xs font-black text-[#1b110e] dark:text-white uppercase tracking-widest flex items-center gap-2">
                <MessageCircleHeart size={18} className="text-pink-500" />
                Audience Reactions
              </h3>
              <div className="px-3 py-1 rounded-full bg-pink-500/10 text-pink-500 text-[10px] font-black uppercase tracking-widest">
                {reactions.length} total
              </div>
           </div>

           <div className="p-6 sm:p-8 bg-[#fafafa]/50 dark:bg-black/10">
             {reactions.length === 0 ? (
               <div className="text-center py-16">
                  <div className="size-20 rounded-lg bg-gradient-to-br from-pink-500/5 to-purple-500/5 border border-pink-500/10 flex items-center justify-center mx-auto mb-6 text-pink-500 shadow-inner">
                     <MessageCircleHeart size={28} className="drop-shadow-sm" />
                  </div>
                  <p className="text-lg font-black text-[#1b110e] dark:text-white mb-2 uppercase tracking-tighter">Awaiting the magic</p>
                  <p className="text-xs font-medium text-text-muted max-w-sm mx-auto leading-relaxed">
                    When someone viewing your moment leaves a voice note, video reaction, or message, it will securely appear right here for your eyes only.
                  </p>
               </div>
             ) : (
               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                 {reactions.map((reaction) => (
                   <div key={reaction.id} className="p-6 rounded-lg border border-[#f3eae7] dark:border-white/5 bg-white dark:bg-white/[0.03] flex flex-col items-start gap-4 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] dark:shadow-none hover:-translate-y-1 transition-transform duration-300">
                     <div className="flex items-center justify-between w-full">
                       <div className="flex items-center gap-3">
                         <div className="size-10 rounded-lg bg-black/5 dark:bg-black/30 flex items-center justify-center text-xl shadow-inner text-center leading-none">
                           {reaction.emoji || "💬"}
                         </div>
                         <div className="flex flex-col">
                           <span className="text-[12px] font-bold text-foreground capitalize">
                             {reaction.type === 'voice' ? 'Voice Note' : reaction.type === 'camera' ? 'Video Message' : 'Text Message'}
                           </span>
                           <span className="text-[9px] font-black uppercase tracking-widest text-text-muted">
                             {reaction.createdAt ? new Date(reaction.createdAt.toDate()).toLocaleDateString() : 'Just now'}
                           </span>
                         </div>
                       </div>
                       {reaction.type === 'voice' && <div className="p-2 rounded-full bg-blue-500/10 text-blue-500"><Mic size={14} /></div>}
                       {reaction.type === 'camera' && <div className="p-2 rounded-full bg-purple-500/10 text-purple-500"><Video size={14} /></div>}
                     </div>
                     
                     {reaction.type === 'text' && (
                       <div className="w-full bg-[#f9f5f3] dark:bg-black/20 p-4 rounded-lg border border-black/5 dark:border-white/5">
                         <p className="text-sm font-medium text-[#1b110e] dark:text-white leading-relaxed italic">"{reaction.content}"</p>
                       </div>
                     )}

                     {reaction.type === 'voice' && (
                       <div className="w-full bg-[#f9f5f3] dark:bg-black/20 p-2 rounded-lg border border-black/5 dark:border-white/5">
                         <audio src={reaction.content} controls className="w-full h-10 outline-none" />
                       </div>
                     )}

                     {reaction.type === 'camera' && (
                       <div className="w-full aspect-[3/4] rounded-lg overflow-hidden bg-black relative shadow-inner ring-1 ring-white/10">
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
          <div className="bg-white dark:bg-surface-dark w-full max-w-sm rounded-lg border border-[#f3eae7] dark:border-white/5 p-8 shadow-2xl animate-in zoom-in-95 duration-200">
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
      {/* Print Studio Modal */}
      <PrintStudio 
        isOpen={showPrintStudio} 
        onClose={() => setShowPrintStudio(false)} 
        moment={moment} 
      />
    </div>
  );
}
