"use client";

import { usePathname } from "next/navigation";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAuthPage = pathname === "/login" || pathname === "/signup" || pathname === "/forgot-password";
  const isViewPage = pathname.startsWith("/view");
  const hideNav = isAuthPage || isViewPage;

  return (
    <div className="flex min-h-screen flex-col">
      {!hideNav && <Header />}
      <main className="flex-1">{children}</main>
      {!hideNav && <Footer />}
    </div>
  );
}
