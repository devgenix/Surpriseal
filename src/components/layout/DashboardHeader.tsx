"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Avatar, Dropdown } from "antd";
import { LogOut, User, PlusCircle } from "lucide-react";

export default function DashboardHeader() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await logout();
      router.push("/");
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-surface-light/80 dark:bg-surface-dark/90 backdrop-blur-md border-b border-[#f3eae7] dark:border-white/10 px-6 py-4 transition-colors duration-200">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-3 text-text-main dark:text-white group cursor-pointer">
          <div className="size-10 text-primary flex items-center justify-center bg-primary/10 rounded-md">
            <span className="material-symbols-outlined text-[24px]">celebration</span>
          </div>
          <h2 className="text-xl font-bold tracking-tight">Supriseal</h2>
        </Link>

        {/* Navigation Links (Desktop) */}
        <nav className="hidden md:flex items-center gap-8">
          <Link 
            href="/dashboard" 
            className="text-text-main dark:text-white font-medium hover:text-primary transition-colors"
          >
            Dashboard
          </Link>
          <Link 
            href="#" 
            className="text-text-muted dark:text-gray-400 font-medium hover:text-primary transition-colors"
          >
            Templates
          </Link>
          <Link 
            href="#" 
            className="text-text-muted dark:text-gray-400 font-medium hover:text-primary transition-colors"
          >
            Inspiration
          </Link>
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-6">
          {/* Create Button */}
          <Link href="/dashboard/create">
            <button className="hidden sm:flex h-10 px-5 items-center justify-center rounded-lg bg-primary hover:bg-primary/90 text-white text-sm font-bold shadow-soft hover:shadow-soft-hover transition-all transform hover:-translate-y-0.5 active:translate-y-0">
              <PlusCircle className="w-5 h-5 mr-2" />
              Create New Moment
            </button>
          </Link>

          {/* Profile Dropdown */}
          <Dropdown
            menu={{
              items: [
                {
                  label: 'Profile',
                  key: 'profile',
                  icon: <User className="h-4 w-4" />,
                  onClick: () => router.push("/dashboard/profile")
                },
                {
                  label: 'Sign out',
                  key: 'logout',
                  icon: <LogOut className="h-4 w-4" />,
                  onClick: handleLogout
                }
              ]
            }}
            trigger={['click']}
            placement="bottomRight"
          >
            <div className="relative group cursor-pointer">
              <Avatar 
                src={user?.photoURL} 
                size={40}
                icon={!user?.photoURL && <User size={20} />}
                className="border-2 border-white dark:border-surface-dark shadow-sm bg-primary/10 text-primary"
              />
              <div className="absolute bottom-0 right-0 size-3 bg-green-500 rounded-full border-2 border-white dark:border-surface-dark"></div>
            </div>
          </Dropdown>
        </div>
      </div>
    </header>
  );
}
