"use client";

import { createContext, useContext, useState, ReactNode, Dispatch, SetStateAction, useMemo } from "react";

interface CreationContextType {
  momentData: any;
  setMomentData: (data: any) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  
  // New layout states
  saving: boolean;
  setSaving: Dispatch<SetStateAction<boolean>>;
  saveError: boolean;
  setSaveError: Dispatch<SetStateAction<boolean>>;
  lastSaved: Date | null;
  setLastSaved: Dispatch<SetStateAction<Date | null>>;
  canContinue: boolean;
  setCanContinue: Dispatch<SetStateAction<boolean>>;
  
  // Actions for layout buttons
  onSave: (() => Promise<void>) | null;
  setOnSave: Dispatch<SetStateAction<(() => Promise<void>) | null>>;
  onContinue: (() => Promise<void>) | null;
  setOnContinue: Dispatch<SetStateAction<(() => Promise<void>) | null>>;
}

const CreationContext = createContext<CreationContextType | undefined>(undefined);

export function CreationProvider({ children }: { children: ReactNode }) {
  const [momentData, setMomentData] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [canContinue, setCanContinue] = useState(true);
  
  const [onSave, setOnSave] = useState<(() => Promise<void>) | null>(null);
  const [onContinue, setOnContinue] = useState<(() => Promise<void>) | null>(null);

  const value = useMemo(() => ({ 
    momentData, setMomentData, 
    sidebarOpen, setSidebarOpen,
    saving, setSaving,
    saveError, setSaveError,
    lastSaved, setLastSaved,
    canContinue, setCanContinue,
    onSave, setOnSave,
    onContinue, setOnContinue
  }), [
    momentData, sidebarOpen, saving, saveError, 
    lastSaved, canContinue, onSave, onContinue
  ]);

  return (
    <CreationContext.Provider value={value}>
      {children}
    </CreationContext.Provider>
  );
}

export function useCreation() {
  const context = useContext(CreationContext);
  if (context === undefined) {
    throw new Error("useCreation must be used within a CreationProvider");
  }
  return context;
}
