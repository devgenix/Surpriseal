import { Edit, Share2, Eye, Calendar, MoreVertical } from "lucide-react";
import { Button, Tag, Dropdown } from "antd";
import Link from "next/link";

interface MomentProps {
    id: string;
    recipient: string;
    occasion: string;
    status: "Draft" | "Published" | "Expired";
    views: number;
    expiryDate: string;
    imageUrl?: string;
}

export default function MomentCard({ moment }: { moment: MomentProps }) {
  const statusColor = {
    Draft: "default",
    Published: "success",
    Expired: "error",
  };

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-all">
        {/* Card Image / Header */}
      <div className="relative h-56 w-full bg-secondary/30 flex items-center justify-center overflow-hidden">
        {moment.imageUrl ? (
            <img src={moment.imageUrl} alt={moment.recipient} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
        ) : (
            <div className="text-5xl animate-bounce">🎁</div>
        )}
        <div className="absolute top-4 right-4 z-10">
            <Tag bordered={false} className="px-3 py-1 rounded-full font-medium shadow-sm backdrop-blur-md bg-white/80">
                {moment.status}
            </Tag>
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>

      <div className="flex flex-1 flex-col p-6">
        <div className="flex items-start justify-between">
            <div>
                 <h3 className="text-lg font-semibold text-gray-900 group-hover:text-primary transition-colors">
                    {moment.recipient}
                </h3>
                <p className="text-sm text-gray-500">{moment.occasion}</p>
            </div>
             <Dropdown menu={{ items: [{ label: 'Delete', key: 'delete', danger: true }] }}>
                 <Button type="text" icon={<MoreVertical className="h-4 w-4" />} className="text-gray-400" />
            </Dropdown>
        </div>

        <div className="mt-6 flex items-center gap-4 text-xs text-gray-500">
            <div className="flex items-center gap-1">
                <Eye className="h-3.5 w-3.5" />
                {moment.views} views
            </div>
             <div className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                Expires {moment.expiryDate}
            </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3">
             <Link href={`/create?id=${moment.id}`} className="w-full">
                <Button block icon={<Edit className="h-4 w-4" />}>
                    Edit
                </Button>
            </Link>
             <Button block type="primary" ghost icon={<Share2 className="h-4 w-4" />}>
                Share
            </Button>
        </div>
      </div>
    </div>
  );
}
