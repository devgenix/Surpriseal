import Link from "next/link";
import { useState, useEffect } from "react";

export default function DashboardFooter() {
  const [year, setYear] = useState<number | string>(2026); // Default to current system year

  useEffect(() => {
    setYear(new Date().getFullYear());
  }, []);

  return (
    <footer className="mt-auto border-t border-[#f3eae7] dark:border-white/5 py-8 bg-surface-light dark:bg-surface-dark/50">
      <div className="max-w-[1280px] mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-text-muted dark:text-gray-500">
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
