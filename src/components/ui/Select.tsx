"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface SelectOption {
  id: string;
  title: string;
  icon?: string | React.ElementType;
}

interface SelectProps {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  className?: string;
  icon?: React.ElementType;
}

export function Select({ 
  options, 
  value, 
  onChange, 
  placeholder = "Select an option", 
  label,
  className,
  icon: LeadingIcon
}: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(opt => opt.id === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className={cn("flex flex-col gap-2.5 w-full", className)} ref={containerRef}>
      {label && <label className="text-sm font-bold text-text-main ml-1">{label}</label>}
      
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "w-full h-14 pl-12 pr-10 bg-surface border border-border rounded-lg text-left transition-all outline-none",
            "focus:ring-4 focus:ring-primary/10 focus:border-primary",
            isOpen && "border-primary ring-4 ring-primary/10"
          )}
        >
          {/* Leading Icon */}
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            {LeadingIcon ? (
              (() => {
                const Icon = LeadingIcon as any;
                return <Icon className={cn("h-5 w-5 transition-colors", isOpen ? "text-primary" : "text-text-muted")} />;
              })()
            ) : selectedOption?.icon ? (
              typeof selectedOption.icon === "string" ? (
                <span className="text-lg">{selectedOption.icon}</span>
              ) : (
                (() => {
                  const Icon = selectedOption.icon as any;
                  return <Icon className={cn("h-5 w-5 transition-colors", isOpen ? "text-primary" : "text-text-muted")} />;
                })()
              )
            ) : (
              <ChevronDown className="h-5 w-5 text-text-muted" />
            )}
          </div>

          <span className={cn(
            "block truncate font-medium",
            !selectedOption ? "text-text-muted/50" : "text-text-main"
          )}>
            {selectedOption ? (
              <div className="flex items-center gap-2">
                {typeof selectedOption.icon === "string" && <span className="mr-1">{selectedOption.icon}</span>}
                {selectedOption.title}
              </div>
            ) : placeholder}
          </span>

          <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
            <motion.div
              animate={{ rotate: isOpen ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown className="text-text-muted h-5 w-5" />
            </motion.div>
          </div>
        </button>

        <AnimatePresence>
          {isOpen && (
            <motion.ul
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 4, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="absolute z-[100] w-full mt-1 bg-surface border border-border rounded-xl shadow-2xl max-h-60 overflow-auto py-2 outline-none"
            >
              {options.map((option) => (
                <li
                  key={option.id}
                  onClick={() => {
                    onChange(option.id);
                    setIsOpen(false);
                  }}
                  className={cn(
                    "relative flex items-center px-4 py-3 cursor-pointer transition-colors",
                    "hover:bg-primary/5 dark:hover:bg-white/5",
                    value === option.id ? "bg-primary/10 text-primary" : "text-text-main"
                  )}
                >
                  <div className="flex items-center gap-3 flex-1">
                    {option.icon && (
                      typeof option.icon === "string" ? (
                        <span className="text-xl w-6 flex justify-center">{option.icon}</span>
                      ) : (
                        (() => {
                          const Icon = option.icon as any;
                          return <Icon className="h-4 w-4" />;
                        })()
                      )
                    )}
                    <span className="font-semibold text-sm">{option.title}</span>
                  </div>
                  
                  {value === option.id && (
                    <motion.div
                      layoutId="select-check"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                    >
                      <Check className="h-4 w-4 text-primary" />
                    </motion.div>
                  )}
                </li>
              ))}
            </motion.ul>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
