"use client";
import * as React from "react";
import { ThemeProvider } from "next-themes";
import { TooltipProvider } from "@takeaseat/ui";
import { AuthProvider } from "@/lib/auth/mock-auth";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <AuthProvider>
        <TooltipProvider delayDuration={200}>{children}</TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
