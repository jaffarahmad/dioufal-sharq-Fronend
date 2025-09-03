import React, { createContext, useContext, useEffect, useState, useMemo } from "react";

type Theme = "light" | "dark" | "system";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  actualTheme: "light" | "dark"; // The actual resolved theme
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    // Get theme from localStorage or default to 'system'
    const savedTheme = localStorage.getItem("theme") as Theme;
    return savedTheme || "system";
  });

  const [actualTheme, setActualTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const root = document.documentElement;

    const applyTheme = (newTheme: Theme) => {
      let resolvedTheme: "light" | "dark";

      if (newTheme === "system") {
        resolvedTheme = window.matchMedia("(prefers-color-scheme: dark)")
          .matches
          ? "dark"
          : "light";
      } else {
        resolvedTheme = newTheme;
      }

      // Only update actualTheme if it's different to prevent infinite loops
      setActualTheme(prev => {
        if (prev !== resolvedTheme) {
          return resolvedTheme;
        }
        return prev;
      });

      if (resolvedTheme === "dark") {
        root.classList.add("dark");
      } else {
        root.classList.remove("dark");
      }
    };

    applyTheme(theme);

    // Save theme to localStorage
    localStorage.setItem("theme", theme);

    // Listen for system theme changes when using 'system' theme
    if (theme === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const handleChange = () => applyTheme(theme);

      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }
  }, [theme]);

  const value = useMemo(() => ({
    theme,
    setTheme,
    actualTheme,
  }), [theme, actualTheme]);

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
