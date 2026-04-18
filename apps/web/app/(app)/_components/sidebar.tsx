"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarCheck2,
  LayoutDashboard,
  Search,
  Settings,
  Star,
} from "lucide-react";
import { cn } from "@takeaseat/ui";
import { useAuth } from "@/lib/auth/mock-auth";

const NAV = [
  { href: "/search", label: "Search", icon: Search },
  { href: "/reservations", label: "Reservations", icon: CalendarCheck2 },
  { href: "/favorites", label: "Favorites", icon: Star },
] as const;

const ADMIN_NAV = [
  { href: "/admin", label: "Admin", icon: Settings },
] as const;

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const showAdmin = user?.role === "admin" || user?.role === "manager";

  return (
    <div className="flex h-full flex-col gap-6 p-4">
      <Link href="/search" className="flex items-center gap-2 px-2 py-1">
        <span className="flex size-8 items-center justify-center rounded-md bg-accent text-accent-fg">
          <LayoutDashboard className="size-4" />
        </span>
        <span className="text-sm font-semibold">Take A Seat</span>
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
            Workspace
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
