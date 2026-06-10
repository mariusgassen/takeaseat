"use client";
import { useRouter } from "next/navigation";
import {
  Building2,
  ChevronDown,
  LayoutDashboard,
  LogOut,
  Monitor,
  Moon,
  Sun,
  User as UserIcon,
} from "lucide-react";
import { useTheme } from "next-themes";
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@takeaseat/ui";
import { useAuth } from "@/lib/auth/context";
import { useLocale } from "@/lib/i18n/context";

export function Topbar() {
  const { user, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const { locale, setLocale, t } = useLocale();

  function handleSignOut() {
    signOut();
    router.push("/login");
  }

  return (
    <>
      {/* Brand — visible on mobile only (sidebar is hidden) */}
      <div className="flex items-center gap-2 md:hidden">
        <span className="flex size-7 items-center justify-center rounded-lg bg-accent text-accent-fg">
          <LayoutDashboard className="size-3.5" />
        </span>
        <span className="text-sm font-semibold">{t.nav.appName}</span>
      </div>

      {/* Workspace switcher — visible on desktop only */}
      <div className="hidden md:block">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-2 px-2">
              <Building2 className="size-4 text-fg-muted" />
              <span className="font-medium">{user?.tenantName ?? "Workspace"}</span>
              <ChevronDown className="size-3.5 text-fg-muted" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuLabel>{t.topbar.workspaces}</DropdownMenuLabel>
            <DropdownMenuItem disabled>
              {user?.tenantName ?? "Demo"} {t.topbar.current}
            </DropdownMenuItem>
            <DropdownMenuItem disabled>{t.topbar.addWorkspace}</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex items-center gap-1">
        {/* Language toggle — desktop only */}
        <Button
          variant="ghost"
          size="sm"
          className="hidden px-2 font-semibold tracking-wide md:flex"
          aria-label={locale === "en" ? t.topbar.switchToDE : t.topbar.switchToEN}
          onClick={() => setLocale(locale === "en" ? "de" : "en")}
        >
          {locale === "en" ? "DE" : "EN"}
        </Button>

        {/* Theme toggle — desktop only */}
        <div className="hidden md:block">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Theme">
                {theme === "dark" ? (
                  <Moon className="size-4" />
                ) : theme === "light" ? (
                  <Sun className="size-4" />
                ) : (
                  <Monitor className="size-4" />
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => setTheme("light")}>
                <Sun className="size-4" /> {t.topbar.themeLight}
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setTheme("dark")}>
                <Moon className="size-4" /> {t.topbar.themeDark}
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setTheme("system")}>
                <Monitor className="size-4" /> {t.topbar.themeSystem}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* User avatar — always visible; includes all settings on mobile */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-2 px-1.5">
              <span className="flex size-8 items-center justify-center rounded-full bg-accent-soft text-xs font-semibold text-accent">
                {user?.name?.[0] ?? "U"}
              </span>
              <span className="hidden text-sm font-medium md:inline">
                {user?.name ?? "User"}
              </span>
              <ChevronDown className="hidden size-3.5 text-fg-muted md:inline" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-52">
            <DropdownMenuLabel>{user?.email}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem disabled>
              <UserIcon className="size-4" /> {t.topbar.profile}
            </DropdownMenuItem>
            {/* Mobile-only theme/lang controls inside user menu */}
            <div className="md:hidden">
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => setTheme("light")}>
                <Sun className="size-4" /> {t.topbar.themeLight}
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setTheme("dark")}>
                <Moon className="size-4" /> {t.topbar.themeDark}
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setTheme("system")}>
                <Monitor className="size-4" /> {t.topbar.themeSystem}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={() => setLocale(locale === "en" ? "de" : "en")}
              >
                {locale === "en" ? "🇩🇪 Deutsch" : "🇬🇧 English"}
              </DropdownMenuItem>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={handleSignOut}>
              <LogOut className="size-4" /> {t.topbar.signOut}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </>
  );
}
