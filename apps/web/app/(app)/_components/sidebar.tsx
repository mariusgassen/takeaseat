"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarCheck2,
  LayoutDashboard,
  Search,
  Settings,
  ShieldCheck,
  Star,
  Users,
} from "lucide-react";
import { cn } from "@takeaseat/ui";
import { useAuth } from "@/lib/auth/context";
import { useLocale } from "@/lib/i18n/context";

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const { t } = useLocale();
  const showAdmin = user?.role === "admin" || user?.role === "manager";

  const NAV = [
    { href: "/search", label: t.nav.search, icon: Search },
    { href: "/reservations", label: t.nav.reservations, icon: CalendarCheck2 },
    { href: "/favorites", label: t.nav.favorites, icon: Star },
  ] as const;

  const ADMIN_NAV = [
    { href: "/admin/tenant", label: t.admin.tenantTab, icon: Settings },
    { href: "/admin/sso", label: t.admin.ssoTab, icon: ShieldCheck },
    { href: "/admin/users", label: t.admin.usersTab, icon: Users },
  ] as const;

  return (
    <div className="flex h-full flex-col gap-6 p-4">
      <Link href="/search" className="flex items-center gap-2 px-2 py-1">
        <span className="flex size-8 items-center justify-center rounded-md bg-accent text-accent-fg">
          <LayoutDashboard className="size-4" />
        </span>
        <span className="text-sm font-semibold">{t.nav.appName}</span>
      </Link>

      <nav className="flex flex-col gap-0.5">
        {NAV.map((item) => (
          <NavLink key={item.href} href={item.href} active={pathname.startsWith(item.href)}>
            <item.icon className="size-4" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      {showAdmin ? (
        <div className="flex flex-col gap-0.5">
          <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-wide text-fg-muted">
            {t.nav.workspace}
          </p>
          {ADMIN_NAV.map((item) => (
            <NavLink key={item.href} href={item.href} active={pathname.startsWith(item.href)}>
              <item.icon className="size-4" />
              {item.label}
            </NavLink>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function NavLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
        active
          ? "bg-accent-soft text-accent"
          : "text-fg-muted hover:bg-surface-muted hover:text-fg"
      )}
    >
      {children}
    </Link>
  );
}
