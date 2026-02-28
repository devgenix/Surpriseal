import { Share2, Eye, Calendar, Cake, Heart, Users, Trash2, Loader2, AlertCircle, Edit3, Play } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { db } from "@/lib/firebase";
import { doc, deleteDoc } from "firebase/firestore";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface MomentProps {
    id: string;
    recipient: string;
    occasion: string;
    status: "Draft" | "Published" | "Expired";
    views: number;
    expiryDate: string;
    imageUrl?: string;
    updatedAt?: string;
    urlSlug?: string;
}

const occasionIcons: Record<string, any> = {
  Birthday: <Cake className="w-4 h-4" />,
  Anniversary: <Heart className="w-4 h-4" />,
  Work: <Users className="w-4 h-4" />,
};

const occasionColors: Record<string, string> = {
  Birthday: "text-accent-pink dark:text-pink-400",
  Anniversary: "text-accent-pink dark:text-pink-400",
  Work: "text-accent-purple dark:text-purple-400",
};

export default function MomentCard({ moment }: { moment: MomentProps }) {
  const isPublished = moment.status === "Published";
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    if (!db) return;
    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, "moments", moment.id));
    } catch (error) {
      console.error("Error deleting moment:", error);
      setIsDeleting(false);
      setShowConfirm(false);
    }
  };
  
  return (
    <div 
      onClick={() => router.push(`/dashboard/${moment.id}`)}
      className="group relative flex flex-col bg-card rounded-lg border border-border shadow-sm hover:shadow-md hover:border-primary/20 transition-all duration-300 overflow-hidden cursor-pointer"
    >
      {/* Card Image/Cover */}
      <div 
        className={cn(
          "h-32 bg-cover bg-center relative overflow-hidden flex items-center justify-center",
          !moment.imageUrl && (
            moment.occasion === "Birthday" ? "bg-gradient-to-br from-pink-500 to-rose-400" :
            moment.occasion === "Anniversary" ? "bg-gradient-to-br from-amber-500 to-orange-400" :
            "bg-gradient-to-br from-primary to-primary-light"
          )
        )} 
        style={moment.imageUrl ? { backgroundImage: `url(${moment.imageUrl})` } : {}}
      >
        {!moment.imageUrl && (
          <div className="flex flex-col items-center justify-center text-white/40 drop-shadow-xl">
             <div className="size-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center mb-1">
               {occasionIcons[moment.occasion] || <Cake size={24} />}
             </div>
             <p className="text-[8px] font-black uppercase tracking-[0.2em]">{moment.occasion}</p>
          </div>
        )}

        {/* Darkening Overlay for Badge Visibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20 opacity-70 group-hover:scale-110 transition-transform duration-500"></div>
        
        <div className="absolute top-2.5 right-2.5">
          <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md backdrop-blur-md border text-[10px] font-bold uppercase tracking-wider shadow-sm ${
            isPublished 
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" 
              : "bg-orange-500/10 border-orange-500/30 text-orange-400"
          }`}>
            <span className={`size-1.5 rounded-full ${isPublished ? "bg-emerald-400 animate-pulse" : "bg-orange-400"}`}></span>
            {moment.status}
          </span>
        </div>

        {isDeleting && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center z-10 transition-all duration-300">
            <Loader2 className="h-6 w-6 animate-spin text-white" />
          </div>
        )}

        {showConfirm && !isDeleting && (
          <div className="absolute inset-0 bg-[#1b110e]/95 backdrop-blur-sm flex flex-col items-center justify-center gap-3 p-4 z-10 animate-in fade-in duration-200">
            <AlertCircle size={20} className="text-red-500" />
            <p className="text-[10px] font-bold text-white uppercase tracking-tighter text-center">Permanently delete?</p>
            <div className="flex gap-2 w-full">
              <button 
                onClick={(e) => { e.stopPropagation(); setShowConfirm(false); }}
                className="flex-1 py-1.5 rounded-md bg-white/10 hover:bg-white/20 text-white text-[10px] font-bold uppercase transition-colors"
              >
                No
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); handleDelete(); }}
                className="flex-1 py-1.5 rounded-md bg-red-600 hover:bg-red-700 text-white text-[10px] font-bold uppercase transition-colors"
              >
                Yes
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Card Content */}
      <div className="flex flex-col flex-1 p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="text-[10px] font-bold text-primary uppercase tracking-widest flex items-center gap-1">
            {occasionIcons[moment.occasion] || <Cake size={10} />}
            {moment.occasion}
          </div>
          <div className="flex items-center gap-1 text-[10px] font-bold text-text-muted">
            <Calendar size={10} />
            {moment.updatedAt}
          </div>
        </div>
        
        <h3 className="text-base font-bold text-text-main leading-tight mb-4 group-hover:text-primary transition-colors line-clamp-1">
          {moment.recipient}'s Moment
        </h3>

        {/* Footer Stats & Actions */}
        <div className="mt-auto pt-3 border-t border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 text-text-main/60" title={`${moment.views} Views`}>
              <Eye size={14} className={isPublished ? "text-primary/70" : "opacity-30"} />
              <span className="text-[11px] font-bold">{isPublished ? moment.views : '--'}</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button 
              className="p-1.5 rounded-md text-text-muted hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all"
              onClick={(e) => { e.stopPropagation(); setShowConfirm(true); }}
              title="Delete"
            >
              <Trash2 size={16} />
            </button>
            <button 
              className="p-1.5 rounded-md text-text-muted hover:text-primary hover:bg-primary/5 transition-all text-primary"
              onClick={(e) => { e.stopPropagation(); window.open(`/view/${moment.urlSlug || moment.id}`, '_blank'); }}
              title="Live Preview"
            >
              <Play size={16} />
            </button>
            <button 
              className="p-1.5 rounded-md text-text-muted hover:text-primary hover:bg-primary/5 transition-all"
              onClick={(e) => { e.stopPropagation(); router.push(`/dashboard/create/${moment.id}?resume=true`); }}
              title="Edit"
            >
              <Edit3 size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
