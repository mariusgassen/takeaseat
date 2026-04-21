"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarCheck2, Search, Star } from "lucide-react";
import { cn } from "@takeaseat/ui";
import { useLocale } from "@/lib/i18n/context";

export function MobileNav() {
  const pathname = usePathname();
  const { t } = useLocale();

  const items = [
    { href: "/search", label: t.nav.search, icon: Search },
    { href: "/reservations", label: t.nav.reservations, icon: CalendarCheck2 },
    { href: "/favorites", label: t.nav.favorites, icon: Star },
  ] as const;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex border-t border-border bg-surface/95 backdrop-blur md:hidden supports-[padding:max(0px)]:pb-[env(safe-area-inset-bottom)]">
      {items.map((item) => {
        const active = pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-1 flex-col items-center gap-1 py-3 text-xs font-medium transition-colors",
              active ? "text-accent" : "text-fg-muted hover:text-fg"
            )}
          >
            <item.icon
              className={cn(
                "size-5 transition-transform duration-150",
                active && "scale-110"
              )}
            />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
