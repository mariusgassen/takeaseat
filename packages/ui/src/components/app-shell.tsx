import * as React from "react";
import { cn } from "../lib/utils";

export interface AppShellProps {
  sidebar: React.ReactNode;
  topbar: React.ReactNode;
  children: React.ReactNode;
  bottomNav?: React.ReactNode;
  className?: string;
}

export function AppShell({ sidebar, topbar, children, bottomNav, className }: AppShellProps) {
  return (
    <div className={cn("grid min-h-svh grid-cols-1 md:grid-cols-[16rem_1fr]", className)}>
      <aside className="hidden border-r border-border bg-surface md:block">
        {sidebar}
      </aside>
      <div className="flex min-w-0 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b border-border bg-bg/80 px-4 backdrop-blur md:px-6 supports-[padding:max(0px)]:pl-[max(1rem,env(safe-area-inset-left))] supports-[padding:max(0px)]:pr-[max(1rem,env(safe-area-inset-right))]">
          {topbar}
        </header>
        <main className="flex-1 px-4 py-6 pb-28 md:px-8 md:py-8 md:pb-8">{children}</main>
      </div>
      {bottomNav}
    </div>
  );
}
