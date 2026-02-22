import { Share2, Eye, Calendar, Cake, Heart, Users, MoreVertical } from "lucide-react";
import { Button, Dropdown } from "antd";
import Link from "next/link";

interface MomentProps {
    id: string;
    recipient: string;
    occasion: string;
    status: "Draft" | "Published" | "Expired";
    views: number;
    expiryDate: string;
    imageUrl?: string;
    updatedAt?: string;
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
  
  return (
    <div className="group relative flex flex-col bg-white dark:bg-surface-dark rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm hover:shadow-soft-hover transition-all duration-300 hover:-translate-y-1 overflow-hidden">
      {/* Card Image/Cover */}
      <div 
        className="h-32 bg-cover bg-center relative" 
        style={{ backgroundImage: `url(${moment.imageUrl || 'https://images.unsplash.com/photo-1513201099705-a9746e1e201f?q=80&w=2897&auto=format&fit=crop'})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60"></div>
        
        <div className="absolute top-3 right-3">
          {isPublished ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/20 backdrop-blur-md border border-emerald-500/20 text-emerald-100 text-xs font-bold shadow-sm">
              <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Published
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-md border border-white/20 text-white text-xs font-bold shadow-sm">
              <span className="size-1.5 rounded-full bg-white/60"></span>
              Draft
            </span>
          )}
        </div>
      </div>

      {/* Card Content */}
      <div className="flex flex-col flex-1 p-5">
        <div className={`flex items-center gap-2 mb-3 text-xs font-bold uppercase tracking-wider ${occasionColors[moment.occasion] || 'text-primary'}`}>
          {occasionIcons[moment.occasion] || <Cake className="w-4 h-4" />}
          {moment.occasion}
        </div>
        
        <h3 className="text-lg font-bold text-text-main dark:text-white leading-tight mb-1">
          {moment.recipient}'s Moment
        </h3>
        <p className="text-sm text-text-muted dark:text-gray-400 mb-6 font-medium">
          {moment.updatedAt || `Updated ${moment.expiryDate}`}
        </p>

        {/* Footer Actions */}
        <div className="mt-auto pt-4 border-t border-gray-50 dark:border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-text-muted dark:text-gray-500" title={`${moment.views} Views`}>
            {isPublished ? <Eye className="w-[18px] h-[18px]" /> : <Eye className="w-[18px] h-[18px] opacity-50" />}
            <span className="text-sm font-medium">{isPublished ? moment.views : '--'}</span>
          </div>

          <div className="flex gap-2">
            <button 
              className={`size-8 flex items-center justify-center rounded-full text-text-muted hover:text-primary hover:bg-primary/10 transition-colors ${!isPublished && 'opacity-50 cursor-not-allowed'}`}
              disabled={!isPublished}
              title="Share"
            >
              <Share2 className="w-5 h-5" />
            </button>
            <Link href={`/dashboard/create?id=${moment.id}`}>
              <button className="h-8 px-4 flex items-center justify-center rounded-lg bg-primary/10 hover:bg-primary text-primary hover:text-white text-xs font-bold transition-all">
                Edit
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
