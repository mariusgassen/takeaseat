"use client";
import Link from "next/link";
import { CalendarPlus } from "lucide-react";
import { Button, EmptyState } from "@takeaseat/ui";
import { useLocale } from "@/lib/i18n/context";

export default function ReservationsPage() {
  const { t } = useLocale();
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">{t.reservations.title}</h1>
        <p className="text-sm text-fg-muted">{t.reservations.subtitle}</p>
      </header>
      <EmptyState
        icon={<CalendarPlus className="size-5" />}
        title={t.reservations.emptyTitle}
        description={t.reservations.emptyDescription}
        action={
          <Button asChild>
            <Link href="/search">{t.reservations.browse}</Link>
          </Button>
        }
      />
    </div>
  );
}
