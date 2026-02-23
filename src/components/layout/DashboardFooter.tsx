import Link from "next/link";
import { useState, useEffect } from "react";

export default function DashboardFooter() {
  const [year, setYear] = useState<number | string>(2026); // Default to current system year

  useEffect(() => {
    setYear(new Date().getFullYear());
  }, []);

  return (
    <footer className="fixed bottom-0 left-0 right-0 z-40 border-t border-[#f3eae7] dark:border-white/5 py-4 bg-surface-light/80 dark:bg-surface-dark/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-[#97604e] dark:text-gray-500">
        <p>© {year} Supriseal. All rights reserved.</p>
        <div className="flex gap-6">
          <Link href="/help" className="hover:text-primary transition-colors text-text-muted dark:text-gray-500">
            Help Center
          </Link>
          <Link href="/privacy" className="hover:text-primary transition-colors text-text-muted dark:text-gray-500">
            Privacy
          </Link>
          <Link href="/terms" className="hover:text-primary transition-colors text-text-muted dark:text-gray-500">
            Terms
          </Link>
        </div>
      </div>
    </footer>
  );
}
