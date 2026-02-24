"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "./AuthContext";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";

type Theme = "light" | "dark" | "system";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => Promise<void>;
  resolvedTheme: "light" | "dark";
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [theme, setThemeState] = useState<Theme>("system");
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light");

  // Load theme from Firestore when user changes
  useEffect(() => {
    if (!user || !db) return;

    const userDocRef = doc(db, "users", user.uid);
    
    // Initial fetch
    getDoc(userDocRef).then((docSnap) => {
      if (docSnap.exists() && docSnap.data().theme) {
        setThemeState(docSnap.data().theme);
      }
    });

    // Listen for updates (sync across devices)
    const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists() && docSnap.data().theme) {
        setThemeState(docSnap.data().theme);
      }
    });

    return () => unsubscribe();
  }, [user]);

  // Handle system preference and resolving theme
  useEffect(() => {
    const root = window.document.documentElement;
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const updateResolvedTheme = () => {
      if (theme === "system") {
        setResolvedTheme(mediaQuery.matches ? "dark" : "light");
      } else {
        setResolvedTheme(theme as "light" | "dark");
      }
    };

    updateResolvedTheme();

    if (theme === "system") {
      const listener = () => updateResolvedTheme();
      mediaQuery.addEventListener("change", listener);
      return () => mediaQuery.removeEventListener("change", listener);
    }
  }, [theme]);

  const setTheme = async (newTheme: Theme) => {
    setThemeState(newTheme);
    
    if (user && db) {
      const userDocRef = doc(db, "users", user.uid);
      try {
        await setDoc(userDocRef, { theme: newTheme }, { merge: true });
      } catch (error) {
        console.error("Error saving theme preference:", error);
      }
    } else {
      // Fallback to local storage for guests if needed, 
      // but the request specifically mentions dashboard (authenticated users)
      localStorage.setItem("theme-preference", newTheme);
    }
  };

  // Initial load from localStorage for faster paint if user is not yet loaded
  useEffect(() => {
    const saved = localStorage.getItem("theme-preference") as Theme;
    if (saved) setThemeState(saved);
  }, []);

  // Also sync to localStorage for immediate transitions
  useEffect(() => {
    localStorage.setItem("theme-preference", theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
