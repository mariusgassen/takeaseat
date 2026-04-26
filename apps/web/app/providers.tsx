"use client";
import * as React from "react";
import { ThemeProvider } from "next-themes";
import { TooltipProvider } from "@takeaseat/ui";
import { AuthProvider as MockAuthProvider } from "@/lib/auth/mock-auth";
import { AuthProvider as ZitadelAuthProvider } from "@/lib/auth/zitadel-auth";
import { I18nProvider } from "@/lib/i18n/context";

const AuthProvider =
  process.env.NEXT_PUBLIC_AUTH_MODE === "real"
    ? ZitadelAuthProvider
    : MockAuthProvider;

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <AuthProvider>
        <I18nProvider>
          <TooltipProvider delayDuration={200}>{children}</TooltipProvider>
        </I18nProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
