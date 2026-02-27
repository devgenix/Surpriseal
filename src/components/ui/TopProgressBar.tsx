"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

export default function TopProgressBar() {
  const [isNavigating, setIsNavigating] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Turn off loading once path or search params change (navigation completes)
  useEffect(() => {
    setIsNavigating(false);
  }, [pathname, searchParams]);

  useEffect(() => {
    const handleAnchorClick = (e: MouseEvent) => {
      // Find the closest anchor tag in case of clicking an icon/child inside the anchor
      const target = (e.target as HTMLElement).closest("a");
      if (!target) return;
      
      const targetUrl = target.href;
      const currentUrl = window.location.href;

      // Ignore if it's opening in a new tab or modifying keys are pressed
      if (
        !targetUrl ||
        target.target === "_blank" ||
        e.ctrlKey ||
        e.metaKey ||
        e.altKey ||
        e.shiftKey
      ) {
        return;
      }

      // Ignore external links
      if (target.origin !== window.location.origin) {
        return;
      }

      // Ignore same-page anchors/hashes
      if (
        targetUrl === currentUrl ||
        targetUrl.startsWith(currentUrl.split("#")[0] + "#")
      ) {
        return;
      }

      // Start the progress loader
      setIsNavigating(true);
    };

    // Use event delegation on the document body to catch all link clicks efficiently
    document.body.addEventListener("click", handleAnchorClick);

    return () => {
      document.body.removeEventListener("click", handleAnchorClick);
    };
  }, []);

  return (
    <AnimatePresence>
      {isNavigating && (
        <motion.div
          initial={{ scaleX: 0, opacity: 1, originX: 0 }}
          animate={{ scaleX: [0, 0.4, 0.7, 0.95] }}
          exit={{ scaleX: 1, opacity: 0, transition: { duration: 0.3 } }}
          transition={{ duration: 10, ease: "easeOut" }}
          className="fixed top-0 left-0 right-0 h-1 bg-primary z-[999999] shadow-[0_0_15px_rgba(230,76,25,0.7)] pointer-events-none"
        />
      )}
    </AnimatePresence>
  );
}
