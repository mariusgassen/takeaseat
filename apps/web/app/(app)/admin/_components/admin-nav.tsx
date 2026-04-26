"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@takeaseat/ui";
import { useLocale } from "@/lib/i18n/context";

export function AdminNav() {
  const pathname = usePathname();
  const { t } = useLocale();

  const tabs = [
    { href: "/admin/tenant", label: t.admin.tenantTab },
    { href: "/admin/sso", label: t.admin.ssoTab },
    { href: "/admin/users", label: t.admin.usersTab },
  ] as const;

  return (
    <nav className="mb-6 flex gap-1 border-b border-border pb-0">
      {tabs.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          className={cn(
            "-mb-px border-b-2 px-4 py-2 text-sm font-medium transition-colors",
            pathname.startsWith(tab.href)
              ? "border-accent text-accent"
              : "border-transparent text-fg-muted hover:text-fg"
          )}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}
