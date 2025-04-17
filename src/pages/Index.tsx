
import React, { useEffect } from 'react';
import MoneyTracker from '@/components/MoneyTracker';

const Index = () => {
  useEffect(() => {
    // Check if user has a saved theme preference
    const savedTheme = localStorage.getItem("paisa-pragati-theme");
    
    if (savedTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else if (savedTheme === "light") {
      document.documentElement.classList.remove("dark");
    } else {
      // Apply system preference
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      if (prefersDark) {
        document.documentElement.classList.add("dark");
      }
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/80">
      <MoneyTracker />
    </div>
  );
};

export default Index;
