"use client";

import { Button, Avatar, Dropdown } from "antd";
import { Plus, User, LogOut } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import Container from "@/components/ui/Container";
import MomentCard from "@/components/dashboard/MomentCard";

// Mock Data
const moments = [
  {
    id: "1",
    recipient: "Sarah",
    occasion: "Birthday",
    status: "Published" as const,
    views: 24,
    expiryDate: "Dec 31, 2024",
    imageUrl: "https://images.unsplash.com/photo-1513201099705-a9746e1e201f?q=80&w=2897&auto=format&fit=crop",
  },
  {
    id: "2",
    recipient: "Michael",
    occasion: "Anniversary",
    status: "Draft" as const,
    views: 0,
    expiryDate: "-",
  }
];

export default function DashboardPage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  const handleLogout = async () => {
    try {
      await logout();
      router.push("/");
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  // Empty state check
  const hasMoments = moments.length > 0;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50/50 pb-20">
      {/* Dashboard Header */}
      <header className="sticky top-0 z-40 w-full border-b border-gray-200 bg-white">
        <Container>
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-xl font-bold tracking-tight text-primary">
                Surpriseal
              </span>
            </Link>

            <div className="flex items-center gap-4">
              <Link href="/dashboard/create">
                <Button type="primary" icon={<Plus className="h-4 w-4" />}>
                  Create New Moment
                </Button>
              </Link>
              <Dropdown 
                menu={{ 
                  items: [
                    { 
                      label: 'Sign out', 
                      key: 'logout', 
                      icon: <LogOut className="h-4 w-4" />,
                      onClick: handleLogout
                    } 
                  ] 
                }}
              >
                <div className="flex items-center gap-2 cursor-pointer p-1 pr-2 rounded-full hover:bg-gray-100 transition-colors">
                  <Avatar 
                    src={user.photoURL} 
                    icon={!user.photoURL && <User className="h-4 w-4" />} 
                    className="bg-primary/10 text-primary border border-primary/20" 
                  />
                  <span className="hidden sm:inline text-sm font-medium text-gray-700">
                    {user.displayName || user.email?.split('@')[0]}
                  </span>
                </div>
              </Dropdown>
            </div>
          </div>
        </Container>
      </header>

      {/* Main Content */}
      <Container className="py-12">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Your Moments</h1>
            <p className="text-sm text-gray-500 mt-1">Manage and track your special surprises</p>
          </div>
        </div>

        {hasMoments ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {moments.map((moment) => (
              <MomentCard key={moment.id} moment={moment} />
            ))}
          </div>
        ) : (
          <div className="flex min-h-[400px] flex-col items-center justify-center rounded-3xl border border-gray-100 bg-white p-12 text-center shadow-sm">
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary/5 mb-6 animate-pulse-slow">
              <Plus className="h-10 w-10 text-primary" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">No moments yet</h3>
            <p className="text-gray-500 max-w-sm mb-10 text-lg">
              Create your first surprise moment and make someone's day unforgettable.
            </p>
            <Link href="/dashboard/create">
              <Button type="primary" size="large" className="h-14 px-8 text-lg font-semibold shadow-lg shadow-primary/20 rounded-full">
                Create Your First Moment
              </Button>
            </Link>
          </div>
        )}
      </Container>
    </div>
  );
}
