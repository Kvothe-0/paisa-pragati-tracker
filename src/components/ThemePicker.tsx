
import React, { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from "@/components/ui/dropdown-menu";
import { Moon, Sun, Laptop, Palette } from "lucide-react";

type Theme = "light" | "dark" | "system";
type ThemeColor = "green" | "blue" | "purple" | "orange" | "red";

const ThemePicker: React.FC = () => {
  const [theme, setTheme] = useState<Theme>("system");
  const [themeColor, setThemeColor] = useState<ThemeColor>("green");

  useEffect(() => {
    // Check if user has saved theme preferences
    const savedTheme = localStorage.getItem("paisa-pragati-theme") as Theme | null;
    const savedColor = localStorage.getItem("paisa-pragati-color") as ThemeColor | null;
    
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.setAttribute("data-theme", savedTheme);
      
      if (savedTheme === "dark") {
        document.documentElement.classList.add("dark");
      } else if (savedTheme === "light") {
        document.documentElement.classList.remove("dark");
      } else {
        applySystemTheme();
      }
    } else {
      // If no preference, use system theme
      applySystemTheme();
    }

    // Apply saved color theme if available
    if (savedColor) {
      setThemeColor(savedColor);
      applyColorTheme(savedColor);
    } else {
      // Default to green
      applyColorTheme("green");
    }
  }, []);

  const applySystemTheme = () => {
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    if (prefersDark) {
      document.documentElement.classList.add("dark");
      document.documentElement.setAttribute("data-theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      document.documentElement.setAttribute("data-theme", "light");
    }
  };

  const setThemePreference = (newTheme: Theme) => {
    setTheme(newTheme);
    localStorage.setItem("paisa-pragati-theme", newTheme);
    
    if (newTheme === "system") {
      applySystemTheme();
    } else {
      document.documentElement.setAttribute("data-theme", newTheme);
      if (newTheme === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }
  };

  const applyColorTheme = (color: ThemeColor) => {
    // Remove existing color classes
    document.documentElement.classList.remove("theme-green", "theme-blue", "theme-purple", "theme-orange", "theme-red");
    // Add new color class
    document.documentElement.classList.add(`theme-${color}`);
    localStorage.setItem("paisa-pragati-color", color);
  };

  const setColorPreference = (newColor: ThemeColor) => {
    setThemeColor(newColor);
    applyColorTheme(newColor);
  };

  const getThemeIcon = () => {
    switch (theme) {
      case "light":
        return <Sun className="h-5 w-5" />;
      case "dark":
        return <Moon className="h-5 w-5" />;
      default:
        return <Laptop className="h-5 w-5" />;
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="rounded-full">
          {getThemeIcon()}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Theme Mode</DropdownMenuLabel>
        <DropdownMenuItem onClick={() => setThemePreference("light")} className="flex items-center gap-2">
          <Sun className="h-4 w-4" />
          <span>Light</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setThemePreference("dark")} className="flex items-center gap-2">
          <Moon className="h-4 w-4" />
          <span>Dark</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setThemePreference("system")} className="flex items-center gap-2">
          <Laptop className="h-4 w-4" />
          <span>System</span>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuLabel className="flex items-center gap-2">
          <Palette className="h-4 w-4" />
          <span>Color Theme</span>
        </DropdownMenuLabel>
        <DropdownMenuItem onClick={() => setColorPreference("green")} className="flex items-center gap-2">
          <div className="h-4 w-4 rounded-full bg-green-500" />
          <span>Green</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setColorPreference("blue")} className="flex items-center gap-2">
          <div className="h-4 w-4 rounded-full bg-blue-500" />
          <span>Blue</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setColorPreference("purple")} className="flex items-center gap-2">
          <div className="h-4 w-4 rounded-full bg-purple-500" />
          <span>Purple</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setColorPreference("orange")} className="flex items-center gap-2">
          <div className="h-4 w-4 rounded-full bg-orange-500" />
          <span>Orange</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setColorPreference("red")} className="flex items-center gap-2">
          <div className="h-4 w-4 rounded-full bg-red-500" />
          <span>Red</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ThemePicker;
