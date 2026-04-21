"use client";
import { Star } from "lucide-react";
import { EmptyState } from "@takeaseat/ui";
import { useLocale } from "@/lib/i18n/context";

export default function FavoritesPage() {
  const { t } = useLocale();
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">{t.favorites.title}</h1>
        <p className="text-sm text-fg-muted">{t.favorites.subtitle}</p>
      </header>
      <EmptyState
        icon={<Star className="size-5" />}
        title={t.favorites.emptyTitle}
        description={t.favorites.emptyDescription}
      />
    </div>
  );
}
