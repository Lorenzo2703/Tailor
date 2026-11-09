"use client";

import { useEffect } from "react";
import { SunMoon } from "lucide-react";
import { Button } from "@/components/ui/button";

type Theme = "light" | "dark";

const THEME_STORAGE_KEY = "tailor-theme";

function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
}

export function ThemeToggle() {
  useEffect(() => {
    const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    const initialTheme =
      storedTheme === "light" || storedTheme === "dark"
        ? storedTheme
        : window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light";

    applyTheme(initialTheme);
  }, []);

  function toggleTheme() {
    const currentTheme = document.documentElement.classList.contains("dark") ? "dark" : "light";
    const nextTheme = currentTheme === "dark" ? "light" : "dark";
    localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
    applyTheme(nextTheme);
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="icon-lg"
      className="theme-toggle"
      aria-label="Cambia tema di visualizzazione"
      title="Cambia tema di visualizzazione"
      onClick={toggleTheme}
    >
      <SunMoon aria-hidden="true" />
    </Button>
  );
}