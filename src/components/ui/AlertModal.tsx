"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Info, AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";

type AlertType = "info" | "warning" | "success" | "error" | "celebration";

interface AlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  type?: AlertType;
  confirmLabel?: string;
  onConfirm?: () => void;
}

const icons = {
  info: <Info className="text-blue-500 h-6 w-6" />,
  warning: <AlertTriangle className="text-amber-500 h-6 w-6" />,
  success: <CheckCircle2 className="text-emerald-500 h-6 w-6" />,
  error: <XCircle className="text-rose-500 h-6 w-6" />,
  celebration: <motion.span animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1.5 }}>✨</motion.span>
};

export function AlertModal({
  isOpen,
  onClose,
  title,
  message,
  type = "info",
  confirmLabel = "Got it",
  onConfirm
}: AlertModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className={cn(
              "relative w-full max-w-sm bg-surface rounded-3xl shadow-2xl overflow-hidden border border-border p-8",
              type === "celebration" && "border-primary/30 ring-1 ring-primary/20"
            )}
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors text-text-muted"
            >
              <X size={20} />
            </button>

            <div className="flex flex-col items-center text-center">
              <div className={cn(
                "size-16 rounded-full flex items-center justify-center mb-6",
                type === "celebration" ? "bg-primary/10 text-3xl" : "bg-primary/5"
              )}>
                {type !== "celebration" ? icons[type] : "✨"}
              </div>

              <h3 className="text-2xl font-black text-text-main mb-3 tracking-tight">
                {title}
              </h3>
              
              <p className="text-text-muted font-medium leading-relaxed mb-8">
                {message}
              </p>

              <div className="w-full">
                <Button
                  onClick={() => {
                    if (onConfirm) onConfirm();
                    onClose();
                  }}
                  className={cn(
                    "w-full h-14 rounded-2xl text-lg font-black uppercase tracking-tight transition-transform active:scale-95",
                    type === "celebration" ? "bg-primary hover:bg-primary/90" : "bg-text-main text-surface"
                  )}
                >
                  {confirmLabel}
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
