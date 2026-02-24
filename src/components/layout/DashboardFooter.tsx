import Link from "next/link";
import { useState, useEffect } from "react";

export default function DashboardFooter() {
  const [year, setYear] = useState<number | string>(2026); // Default to current system year

  useEffect(() => {
    setYear(new Date().getFullYear());
  }, []);

  return (
    <footer className="fixed bottom-0 left-0 right-0 z-40 border-t border-border py-4 bg-surface/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-text-muted">
        <p>© {year} Supriseal. All rights reserved.</p>
        <div className="flex gap-6">
          <Link href="/help" className="hover:text-primary transition-colors text-text-muted">
            Help Center
          </Link>
          <Link href="/privacy" className="hover:text-primary transition-colors text-text-muted">
            Privacy
          </Link>
          <Link href="/terms" className="hover:text-primary transition-colors text-text-muted">
            Terms
          </Link>
        </div>
      </div>
    </footer>
  );
}
