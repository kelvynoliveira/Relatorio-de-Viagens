"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "framer-motion";
import { MotionButton } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ThemeToggleProps {
  className?: string;
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  // Avoid hydration mismatch
  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className={cn("w-12 h-12 rounded-2xl bg-white/5 border border-white/10", className)} />
    );
  }

  const isDark = resolvedTheme === "dark";

  return (
    <MotionButton
      variant="ghost"
      size="icon"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={cn(
        "relative w-12 h-12 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 backdrop-blur-md shadow-2xl transition-all group overflow-hidden",
        className
      )}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      title={isDark ? "Mudar para modo claro" : "Mudar para modo escuro"}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-purple-600/10 opacity-0 group-hover:opacity-100 transition-opacity" />
      
      <AnimatePresence mode="wait" initial={false}>
        {isDark ? (
          <motion.div
            key="moon"
            initial={{ y: 20, opacity: 0, rotate: -90 }}
            animate={{ y: 0, opacity: 1, rotate: 0 }}
            exit={{ y: -20, opacity: 0, rotate: 90 }}
            transition={{ duration: 0.3, ease: "circOut" }}
            className="z-10"
          >
            <Moon className="w-6 h-6 text-sky-400 fill-sky-400/20" />
          </motion.div>
        ) : (
          <motion.div
            key="sun"
            initial={{ y: 20, opacity: 0, rotate: -90 }}
            animate={{ y: 0, opacity: 1, rotate: 0 }}
            exit={{ y: -20, opacity: 0, rotate: 90 }}
            transition={{ duration: 0.3, ease: "circOut" }}
            className="z-10"
          >
            <Sun className="w-6 h-6 text-amber-500 fill-amber-500/20" />
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Subtle glow effect */}
      <div className={cn(
        "absolute inset-0 blur-xl opacity-20 transition-colors duration-500",
        isDark ? "bg-sky-500" : "bg-amber-500"
      )} />
    </MotionButton>
  );
}
